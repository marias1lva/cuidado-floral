import type { ManagedUser } from "../../src/admin/types";
import type {
  AppNotification,
  Appointment,
  AppointmentAttachment,
  Donation,
  Patient,
  Sector,
} from "../../src/domain/types";
import type {
  VolunteerAgendaItem,
  VolunteerHourEntry,
} from "../../src/volunteer-hours/types";
import pool from "./connection";

// Tipagens movidas do mock-data para o banco real
export interface StoredUser {
  id: number;
  name: string;
  email: string;
  cpf: string;
  type: "admin" | "voluntaria" | "paciente" | "doador";
  status: "Ativo" | "Inativo";
  date?: string;
  passwordHash: string;
}

export interface Campaign {
  id: number;
  name: string;
  period: string;
  donations: number;
  status: "Ativa" | "Encerrada";
}

// Helpers 
function toIso(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

function toDateStr(val: unknown): string {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

// USUÁRIOS 
export async function getUsers(): Promise<StoredUser[]> {
  const [rows] = await pool.query<any[]>(`
    SELECT
      id,
      nome        AS name,
      email,
      cpf,
      tipo_usuario AS type,
      status,
      DATE_FORMAT(data_cadastro, '%d/%m/%Y') AS date,
      senha_hash  AS passwordHash
    FROM usuarios
    ORDER BY id
  `);
  return rows;
}

export async function saveUsers(users: StoredUser[]): Promise<StoredUser[]> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const u of users) {
      const dateMysql = u.date
        ? u.date.includes("/")
          ? u.date.split("/").reverse().join("-")
          : u.date
        : new Date().toISOString().slice(0, 10);

      await conn.query(
        `INSERT INTO usuarios (id, nome, email, cpf, tipo_usuario, status, data_cadastro, senha_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           nome=VALUES(nome), email=VALUES(email), cpf=VALUES(cpf),
           tipo_usuario=VALUES(tipo_usuario), status=VALUES(status),
           data_cadastro=VALUES(data_cadastro), senha_hash=VALUES(senha_hash)`,
        [u.id, u.name, u.email, u.cpf, u.type, u.status, dateMysql, u.passwordHash],
      );

      if (u.type === "voluntaria") {
        await conn.query(
          `INSERT IGNORE INTO voluntarias (id_voluntaria, usuario_id) VALUES (?, ?)`,
          [`vol-${u.id}`, u.id],
        );
      } else if (u.type === "paciente") {
        await conn.query(
          `INSERT IGNORE INTO pacientes (id_paciente, usuario_id, prioridade) VALUES (?, ?, 'media')`,
          [`pat-${u.id}`, u.id],
        );
      } else if (u.type === "doador") {
        await conn.query(
          `INSERT IGNORE INTO doadores (id_doador, usuario_id) VALUES (?, ?)`,
          [`doa-${u.id}`, u.id],
        );
      }
    }

    await conn.commit();
    return getUsers();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export function toManagedUsers(users: StoredUser[]): ManagedUser[] {
  return users.map(({ passwordHash: _ph, date, ...rest }) => ({
    ...rest,
    date: date ?? "",
  }));
}

// PACIENTES
export async function getPatients(): Promise<Patient[]> {
  const [rows] = await pool.query<any[]>(`
    SELECT
      p.id_paciente                               AS id,
      u.nome                                      AS name,
      DATE_FORMAT(p.data_cadastro, '%Y-%m-%d')    AS registrationDate,
      COALESCE(p.status_workflow, 'pendente')      AS status,
      p.prioridade                                AS priority,
      p.sintomas                                  AS symptoms
    FROM pacientes p
    JOIN usuarios u ON u.id = p.usuario_id
    ORDER BY p.data_cadastro DESC
  `);
  return rows;
}

export async function savePatients(patients: Patient[]): Promise<Patient[]> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const p of patients) {
      await conn.query(
        `UPDATE pacientes
         SET prioridade=?, sintomas=?, status_workflow=?, data_cadastro=?
         WHERE id_paciente=?`,
        [p.priority, p.symptoms ?? null, p.status, p.registrationDate, p.id],
      );
    }

    await conn.commit();
    return getPatients();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ATENDIMENTO
async function getAnexos(atendimentoId: string): Promise<AppointmentAttachment[]> {
  const [rows] = await pool.query<any[]>(
    `SELECT
       id,
       nome_arquivo  AS filename,
       mime_type     AS mimeType,
       tamanho       AS size,
       url,
       enviado_em    AS uploadedAt
     FROM atendimento_anexos
     WHERE atendimento_id = ?`,
    [atendimentoId],
  );
  return rows.map((r) => ({ ...r, uploadedAt: toIso(r.uploadedAt) }));
}

export async function getAppointments(): Promise<Appointment[]> {
  const [rows] = await pool.query<any[]>(`
    SELECT
      id,
      paciente_id             AS patientId,
      paciente_nome           AS patientName,
      DATE_FORMAT(data, '%Y-%m-%d') AS date,
      horario                 AS time,
      voluntaria_nome         AS volunteerName,
      profissional_nome       AS professionalName,
      status,
      observacoes,
      encaminhamento,
      encaminhamento_detalhe  AS encaminhamentoDetalhe,
      criado_por              AS createdBy,
      criado_em               AS createdAt,
      atualizado_em           AS updatedAt
    FROM atendimentos
    ORDER BY data DESC, horario DESC
  `);

  return Promise.all(
    rows.map(async (r) => ({
      ...r,
      createdAt:   toIso(r.createdAt),
      updatedAt:   toIso(r.updatedAt),
      attachments: await getAnexos(r.id),
    })),
  );
}

export async function saveAppointments(appointments: Appointment[]): Promise<Appointment[]> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const a of appointments) {
      await conn.query(
        `INSERT INTO atendimentos
           (id, paciente_id, paciente_nome, data, horario, voluntaria_nome, profissional_nome,
            status, observacoes, encaminhamento, encaminhamento_detalhe,
            criado_por, criado_em, atualizado_em)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           paciente_id=VALUES(paciente_id), paciente_nome=VALUES(paciente_nome),
           data=VALUES(data), horario=VALUES(horario),
           voluntaria_nome=VALUES(voluntaria_nome), profissional_nome=VALUES(profissional_nome),
           status=VALUES(status), observacoes=VALUES(observacoes),
           encaminhamento=VALUES(encaminhamento),
           encaminhamento_detalhe=VALUES(encaminhamento_detalhe),
           criado_por=VALUES(criado_por),
           criado_em=VALUES(criado_em), atualizado_em=VALUES(atualizado_em)`,
        [
          a.id, a.patientId, a.patientName, a.date, a.time ?? null,
          a.volunteerName, a.professionalName ?? null, a.status,
          a.observacoes ?? null, a.encaminhamento ?? null,
          a.encaminhamentoDetalhe ?? null, a.createdBy ?? null,
          a.createdAt, a.updatedAt,
        ],
      );

      if (a.attachments && a.attachments.length > 0) {
        await conn.query(`DELETE FROM atendimento_anexos WHERE atendimento_id = ?`, [a.id]);
        for (const att of a.attachments) {
          await conn.query(
            `INSERT IGNORE INTO atendimento_anexos
               (id, atendimento_id, nome_arquivo, mime_type, tamanho, url, enviado_em)
             VALUES (?,?,?,?,?,?,?)`,
            [att.id, a.id, att.filename, att.mimeType, att.size, att.url, att.uploadedAt],
          );
        }
      }
    }

    if (appointments.length > 0) {
      const ids = appointments.map((a) => a.id);
      await conn.query(
        `DELETE FROM atendimentos WHERE id NOT IN (${ids.map(() => "?").join(",")})`,
        ids,
      );
    }

    await conn.commit();
    return getAppointments();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// NOTIFICAÇÕES
export async function getNotifications(): Promise<AppNotification[]> {
  const [rows] = await pool.query<any[]>(`
    SELECT
      id,
      perfil_destinatario   AS recipientRole,
      destinatario_id       AS recipientId,
      tipo                  AS type,
      titulo                AS title,
      mensagem              AS message,
      data,
      lida                  AS \`read\`
    FROM notificacoes
    ORDER BY data DESC
  `);
  return rows.map((r) => ({
    ...r,
    read: r.read === 1 || r.read === true,
    date: toIso(r.data),
    data: undefined,
  }));
}

export async function saveNotifications(notifications: AppNotification[]): Promise<AppNotification[]> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const n of notifications) {
      await conn.query(
        `INSERT INTO notificacoes
           (id, perfil_destinatario, destinatario_id, tipo, titulo, mensagem, data, lida)
         VALUES (?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           perfil_destinatario=VALUES(perfil_destinatario),
           destinatario_id=VALUES(destinatario_id),
           tipo=VALUES(tipo), titulo=VALUES(titulo),
           mensagem=VALUES(mensagem), data=VALUES(data), lida=VALUES(lida)`,
        [
          n.id, n.recipientRole, n.recipientId ?? null, n.type,
          n.title, n.message, n.date, n.read ? 1 : 0,
        ],
      );
    }

    if (notifications.length > 0) {
      const ids = notifications.map((n) => n.id);
      await conn.query(
        `DELETE FROM notificacoes WHERE id NOT IN (${ids.map(() => "?").join(",")})`,
        ids,
      );
    }

    await conn.commit();
    return getNotifications();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// DOAÇÕES 
export async function getDonations(): Promise<Donation[]> {
  const [rows] = await pool.query<any[]>(`
    SELECT
      id,
      doador_id           AS donorId,
      doador_nome         AS donorName,
      doador_telefone     AS donorPhone,
      doador_origem       AS donorSource,
      perfil_dono_id      AS profileOwnerId,
      perfil_dono_nome    AS profileOwnerName,
      terceiro_nome       AS thirdPartyName,
      terceiro_telefone   AS thirdPartyPhone,
      tipo                AS kind,
      data,
      status,
      campanha            AS campaign,
      valor               AS amount,
      tipo_item           AS itemType,
      quantidade          AS quantity,
      descricao           AS description,
      metodo_entrega      AS deliveryMethod,
      observacoes         AS notes,
      protocolo           AS protocol,
      comprovante_em      AS receiptIssuedAt
    FROM doacoes
    ORDER BY data DESC
  `);
  return rows.map((r) => ({
    ...r,
    date:            toIso(r.data),
    data:            undefined,
    receiptIssuedAt: r.receiptIssuedAt ? toIso(r.receiptIssuedAt) : undefined,
  }));
}

export async function saveDonations(donations: Donation[]): Promise<Donation[]> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const d of donations) {
      await conn.query(
        `INSERT INTO doacoes
           (id, doador_id, doador_nome, doador_telefone, doador_origem,
            perfil_dono_id, perfil_dono_nome, terceiro_nome, terceiro_telefone,
            tipo, data, status, campanha, valor,
            tipo_item, quantidade, descricao, metodo_entrega, observacoes,
            protocolo, comprovante_em)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           doador_id=VALUES(doador_id), doador_nome=VALUES(doador_nome),
           doador_telefone=VALUES(doador_telefone), doador_origem=VALUES(doador_origem),
           perfil_dono_id=VALUES(perfil_dono_id), perfil_dono_nome=VALUES(perfil_dono_nome),
           terceiro_nome=VALUES(terceiro_nome), terceiro_telefone=VALUES(terceiro_telefone),
           tipo=VALUES(tipo), data=VALUES(data), status=VALUES(status),
           campanha=VALUES(campanha), valor=VALUES(valor),
           tipo_item=VALUES(tipo_item), quantidade=VALUES(quantidade),
           descricao=VALUES(descricao), metodo_entrega=VALUES(metodo_entrega),
           observacoes=VALUES(observacoes), protocolo=VALUES(protocolo),
           comprovante_em=VALUES(comprovante_em)`,
        [
          d.id, d.donorId, d.donorName, d.donorPhone ?? null, d.donorSource ?? null,
          d.profileOwnerId ?? null, d.profileOwnerName ?? null,
          d.thirdPartyName ?? null, d.thirdPartyPhone ?? null,
          d.kind, d.date, d.status, d.campaign ?? null, d.amount ?? null,
          d.itemType ?? null, d.quantity ?? null, d.description ?? null,
          d.deliveryMethod ?? null, d.notes ?? null,
          d.protocol ?? null, d.receiptIssuedAt ?? null,
        ],
      );
    }

    if (donations.length > 0) {
      const ids = donations.map((d) => d.id);
      await conn.query(
        `DELETE FROM doacoes WHERE id NOT IN (${ids.map(() => "?").join(",")})`,
        ids,
      );
    }

    await conn.commit();
    return getDonations();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// CAMPANHAS
export async function getCampaigns(): Promise<Campaign[]> {
  const [rows] = await pool.query<any[]>(
    `SELECT id, nome AS name, periodo AS period, doacoes AS donations, status FROM campanhas`,
  );
  return rows;
}

// SETORES
export async function getSectors(): Promise<Sector[]> {
  const [rows] = await pool.query<any[]>(
    `SELECT id, nome AS name, slug, descricao AS description FROM setores`,
  );
  return rows;
}

// HORAS VOLUNTÁRIAS 
export async function getVolunteerHours(): Promise<VolunteerHourEntry[]> {
  const [rows] = await pool.query<any[]>(`
    SELECT
      id,
      voluntaria_id   AS volunteerId,
      voluntaria_nome AS volunteerName,
      nome_atividade  AS activityName,
      categoria       AS category,
      DATE_FORMAT(data, '%Y-%m-%d') AS date,
      horas           AS hours,
      local           AS location,
      observacoes     AS notes,
      criado_em       AS createdAt
    FROM horas_voluntarias
    ORDER BY data DESC
  `);
  return rows.map((r) => ({ ...r, createdAt: toIso(r.createdAt) }));
}

export async function saveVolunteerHours(hours: VolunteerHourEntry[]): Promise<VolunteerHourEntry[]> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const h of hours) {
      await conn.query(
        `INSERT INTO horas_voluntarias
           (id, voluntaria_id, voluntaria_nome, nome_atividade, categoria,
            data, horas, local, observacoes, criado_em)
         VALUES (?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           voluntaria_id=VALUES(voluntaria_id), voluntaria_nome=VALUES(voluntaria_nome),
           nome_atividade=VALUES(nome_atividade), categoria=VALUES(categoria),
           data=VALUES(data), horas=VALUES(horas), local=VALUES(local),
           observacoes=VALUES(observacoes), criado_em=VALUES(criado_em)`,
        [
          h.id, h.volunteerId ?? null, h.volunteerName, h.activityName,
          h.category, h.date, h.hours, h.location, h.notes ?? null, h.createdAt,
        ],
      );
    }

    if (hours.length > 0) {
      const ids = hours.map((h) => h.id);
      await conn.query(
        `DELETE FROM horas_voluntarias WHERE id NOT IN (${ids.map(() => "?").join(",")})`,
        ids,
      );
    }

    await conn.commit();
    return getVolunteerHours();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// AGENDA VOLUNTÁRIA 
export async function getVolunteerAgenda(): Promise<VolunteerAgendaItem[]> {
  const [rows] = await pool.query<any[]>(`
    SELECT
      id,
      titulo AS title,
      DATE_FORMAT(data, '%Y-%m-%d') AS date,
      turno  AS shift,
      local  AS location
    FROM agenda_voluntarias
    ORDER BY data ASC
  `);
  return rows;
}