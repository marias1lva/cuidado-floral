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

export interface StoredUser {
  id: number;
  name: string;
  email: string;
  cpf: string;
  telefone?: string;
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

// Helpers para conversão de datas
function toIso(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

// NOVO HELPER: Converte a data ISO do front-end para o padrão estrito do MySQL (YYYY-MM-DD HH:MM:SS)
function toMysqlDatetime(val: unknown): string {
  if (!val) return new Date().toISOString().slice(0, 19).replace('T', ' ');
  const str = typeof val === 'string' ? val : (val instanceof Date ? val.toISOString() : String(val));
  if (str.length >= 19) {
    return str.substring(0, 19).replace('T', ' ');
  }
  return str;
}


// USUÁRIOS
export async function getUsers(): Promise<StoredUser[]> {
  const [rows] = await pool.query<any[]>(`
    SELECT
      id,
      nome        AS name,
      email,
      cpf,
      telefone,
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
        `INSERT INTO usuarios (id, nome, email, cpf, telefone, tipo_usuario, status, data_cadastro, senha_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           nome=VALUES(nome), email=VALUES(email), cpf=VALUES(cpf),
           telefone=VALUES(telefone),
           tipo_usuario=VALUES(tipo_usuario), status=VALUES(status),
           data_cadastro=VALUES(data_cadastro), senha_hash=VALUES(senha_hash)`,
        [u.id, u.name, u.email, u.cpf, u.telefone ?? null, u.type, u.status, dateMysql, u.passwordHash],
      );

      if (u.type === "voluntaria") {
        await conn.query(`INSERT IGNORE INTO voluntarias (id_voluntaria, usuario_id) VALUES (?, ?)`, [`vol-${u.id}`, u.id]);
      } else if (u.type === "paciente") {
        await conn.query(`INSERT IGNORE INTO pacientes (id_paciente, usuario_id, prioridade) VALUES (?, ?, 'media')`, [`pat-${u.id}`, u.id]);
      } else if (u.type === "doador") {
        await conn.query(`INSERT IGNORE INTO doadores (id_doador, usuario_id) VALUES (?, ?)`, [`doa-${u.id}`, u.id]);
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

export async function updateUserPasswordHash(
  id: number,
  passwordHash: string,
): Promise<void> {
  await pool.query(`UPDATE usuarios SET senha_hash = ? WHERE id = ?`, [
    passwordHash,
    id,
  ]);
}

// ── Perfil consolidado da paciente (usuarios + pacientes) ─────────────

export interface PatientProfileRecord {
  userId: number;
  patientId: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate?: string; // YYYY-MM-DD
  city?: string;
  district?: string;
  familyHistory?: "sim" | "nao" | "nao_sei";
  symptoms?: string;
}

export async function getPatientProfileByUserId(
  userId: number,
): Promise<PatientProfileRecord | null> {
  const [rows] = await pool.query<any[]>(
    `
    SELECT
      u.id                                       AS userId,
      p.id_paciente                              AS patientId,
      u.nome                                     AS name,
      u.email                                    AS email,
      u.cpf                                      AS cpf,
      COALESCE(u.telefone, '')                   AS phone,
      DATE_FORMAT(p.data_nascimento, '%Y-%m-%d') AS birthDate,
      p.cidade                                   AS city,
      p.bairro                                   AS district,
      p.historico_familiar                       AS familyHistory,
      p.sintomas                                 AS symptoms
    FROM usuarios u
    JOIN pacientes p ON p.usuario_id = u.id
    WHERE u.id = ?
    LIMIT 1
    `,
    [userId],
  );
  return rows[0] ?? null;
}

export interface PatientProfileUpdate {
  name: string;
  email: string;
  phone: string;
  birthDate?: string | null;
  city?: string | null;
  district?: string | null;
  familyHistory?: "sim" | "nao" | "nao_sei" | null;
  symptoms?: string | null;
}

export async function savePatientProfile(
  userId: number,
  payload: PatientProfileUpdate,
): Promise<PatientProfileRecord | null> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Dados de pessoa: usuarios (CPF NUNCA é alterado aqui).
    await conn.query(
      `UPDATE usuarios SET nome = ?, email = ?, telefone = ? WHERE id = ?`,
      [payload.name, payload.email, payload.phone || null, userId],
    );
    // Dados clínicos: pacientes.
    await conn.query(
      `UPDATE pacientes
       SET data_nascimento = ?, cidade = ?, bairro = ?,
           historico_familiar = ?, sintomas = ?
       WHERE usuario_id = ?`,
      [
        payload.birthDate || null,
        payload.city || null,
        payload.district || null,
        payload.familyHistory || null,
        payload.symptoms || null,
        userId,
      ],
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return getPatientProfileByUserId(userId);
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
      COALESCE(p.status_workflow, 'pendente')     AS status,
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
        `UPDATE pacientes SET prioridade=?, sintomas=?, status_workflow=?, data_cadastro=? WHERE id_paciente=?`,
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

// ATENDIMENTOS E ANEXOS
async function getAnexos(atendimentoId: string): Promise<AppointmentAttachment[]> {
  const [rows] = await pool.query<any[]>(
    `SELECT id, nome_arquivo AS filename, mime_type AS mimeType, tamanho AS size, url, enviado_em AS uploadedAt 
     FROM atendimento_anexos WHERE atendimento_id = ?`,
    [atendimentoId],
  );
  return rows.map((r) => ({ ...r, uploadedAt: toIso(r.uploadedAt) }));
}

export async function getAppointments(): Promise<Appointment[]> {
  const [rows] = await pool.query<any[]>(`
    SELECT
      id, paciente_id AS patientId, paciente_nome AS patientName,
      DATE_FORMAT(data, '%Y-%m-%d') AS date, horario AS time,
      voluntaria_nome AS volunteerName, profissional_nome AS professionalName,
      status, observacoes, encaminhamento, encaminhamento_detalhe AS encaminhamentoDetalhe,
      criado_por AS createdBy, criado_em AS createdAt, atualizado_em AS updatedAt
    FROM atendimentos ORDER BY data DESC, horario DESC
  `);

  return Promise.all(
    rows.map(async (r) => ({
      ...r,
      createdAt: toIso(r.createdAt),
      updatedAt: toIso(r.updatedAt),
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
            status, observacoes, encaminhamento, encaminhamento_detalhe, criado_por, criado_em, atualizado_em)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           paciente_id=VALUES(paciente_id), paciente_nome=VALUES(paciente_nome), data=VALUES(data), horario=VALUES(horario),
           voluntaria_nome=VALUES(voluntaria_nome), profissional_nome=VALUES(profissional_nome),
           status=VALUES(status), observacoes=VALUES(observacoes), encaminhamento=VALUES(encaminhamento),
           encaminhamento_detalhe=VALUES(encaminhamento_detalhe), criado_por=VALUES(criado_por),
           criado_em=VALUES(criado_em), atualizado_em=VALUES(atualizado_em)`,
        [
          a.id, a.patientId, a.patientName, a.date, a.time ?? null,
          a.volunteerName, a.professionalName ?? null, a.status,
          a.observacoes ?? null, a.encaminhamento ?? null, a.encaminhamentoDetalhe ?? null, a.createdBy ?? null,
          toMysqlDatetime(a.createdAt), toMysqlDatetime(a.updatedAt), // USANDO O HELPER AQUI
        ],
      );

      // Tratamento dos anexos
      if (a.attachments && a.attachments.length > 0) {
        await conn.query(`DELETE FROM atendimento_anexos WHERE atendimento_id = ?`, [a.id]);
        for (const att of a.attachments) {
          await conn.query(
            `INSERT IGNORE INTO atendimento_anexos (id, atendimento_id, nome_arquivo, mime_type, tamanho, url, enviado_em) VALUES (?,?,?,?,?,?,?)`,
            [att.id, a.id, att.filename, att.mimeType, att.size, att.url, toMysqlDatetime(att.uploadedAt)], // USANDO O HELPER AQUI
          );
        }
      }
    }

    if (appointments.length > 0) {
      const ids = appointments.map((a) => a.id);
      await conn.query(`DELETE FROM atendimentos WHERE id NOT IN (${ids.map(() => "?").join(",")})`, ids);
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
    SELECT id, perfil_destinatario AS recipientRole, destinatario_id AS recipientId, tipo, titulo AS title, mensagem AS message, data, lida AS \`read\`
    FROM notificacoes ORDER BY data DESC
  `);
  return rows.map((r) => ({ ...r, read: r.read === 1 || r.read === true, date: toIso(r.data), data: undefined }));
}

export async function saveNotifications(notifications: AppNotification[]): Promise<AppNotification[]> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const n of notifications) {
      await conn.query(
        `INSERT INTO notificacoes (id, perfil_destinatario, destinatario_id, tipo, titulo, mensagem, data, lida) VALUES (?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE perfil_destinatario=VALUES(perfil_destinatario), destinatario_id=VALUES(destinatario_id),
           tipo=VALUES(tipo), titulo=VALUES(titulo), mensagem=VALUES(mensagem), data=VALUES(data), lida=VALUES(lida)`,
        [n.id, n.recipientRole, n.recipientId ?? null, n.type, n.title, n.message, toMysqlDatetime(n.date), n.read ? 1 : 0],
      );
    }

    if (notifications.length > 0) {
      const ids = notifications.map((n) => n.id);
      await conn.query(`DELETE FROM notificacoes WHERE id NOT IN (${ids.map(() => "?").join(",")})`, ids);
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
      id, doador_id AS donorId, doador_nome AS donorName, doador_telefone AS donorPhone, doador_origem AS donorSource,
      perfil_dono_id AS profileOwnerId, perfil_dono_nome AS profileOwnerName, terceiro_nome AS thirdPartyName, terceiro_telefone AS thirdPartyPhone,
      tipo AS kind, data, status, campanha AS campaign, valor AS amount, tipo_item AS itemType, quantidade AS quantity,
      descricao AS description, metodo_entrega AS deliveryMethod, observacoes AS notes, protocolo AS protocol, comprovante_em AS receiptIssuedAt
    FROM doacoes ORDER BY data DESC
  `);
  return rows.map((r) => ({ ...r, date: toIso(r.data), data: undefined, receiptIssuedAt: r.receiptIssuedAt ? toIso(r.receiptIssuedAt) : undefined }));
}

export async function saveDonations(donations: Donation[]): Promise<Donation[]> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const d of donations) {
      await conn.query(
        `INSERT INTO doacoes
           (id, doador_id, doador_nome, doador_telefone, doador_origem, perfil_dono_id, perfil_dono_nome, terceiro_nome, terceiro_telefone,
            tipo, data, status, campanha, valor, tipo_item, quantidade, descricao, metodo_entrega, observacoes, protocolo, comprovante_em)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           doador_id=VALUES(doador_id), doador_nome=VALUES(doador_nome), doador_telefone=VALUES(doador_telefone), doador_origem=VALUES(doador_origem),
           perfil_dono_id=VALUES(perfil_dono_id), perfil_dono_nome=VALUES(perfil_dono_nome), terceiro_nome=VALUES(terceiro_nome), terceiro_telefone=VALUES(terceiro_telefone),
           tipo=VALUES(tipo), data=VALUES(data), status=VALUES(status), campanha=VALUES(campanha), valor=VALUES(valor),
           tipo_item=VALUES(tipo_item), quantidade=VALUES(quantidade), descricao=VALUES(descricao), metodo_entrega=VALUES(metodo_entrega),
           observacoes=VALUES(observacoes), protocolo=VALUES(protocolo), comprovante_em=VALUES(comprovante_em)`,
        [
          d.id, d.donorId, d.donorName, d.donorPhone ?? null, d.donorSource ?? null, d.profileOwnerId ?? null, d.profileOwnerName ?? null,
          d.thirdPartyName ?? null, d.thirdPartyPhone ?? null, d.kind, toMysqlDatetime(d.date), d.status, d.campaign ?? null, d.amount ?? null,
          d.itemType ?? null, d.quantity ?? null, d.description ?? null, d.deliveryMethod ?? null, d.notes ?? null, d.protocol ?? null, toMysqlDatetime(d.receiptIssuedAt),
        ],
      );
    }

    if (donations.length > 0) {
      const ids = donations.map((d) => d.id);
      await conn.query(`DELETE FROM doacoes WHERE id NOT IN (${ids.map(() => "?").join(",")})`, ids);
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

// CAMPANHAS E SETORES
export async function getCampaigns(): Promise<Campaign[]> {
  const [rows] = await pool.query<any[]>(`SELECT id, nome AS name, periodo AS period, doacoes AS donations, status FROM campanhas`);
  return rows;
}

export async function getSectors(): Promise<Sector[]> {
  const [rows] = await pool.query<any[]>(`SELECT id, nome AS name, slug, descricao AS description FROM setores`);
  return rows;
}

// HORAS VOLUNTÁRIAS 
export async function getVolunteerHours(): Promise<VolunteerHourEntry[]> {
  const [rows] = await pool.query<any[]>(`
    SELECT id, voluntaria_id AS volunteerId, voluntaria_nome AS volunteerName, nome_atividade AS activityName, categoria AS category,
      DATE_FORMAT(data, '%Y-%m-%d') AS date, horas AS hours, local AS location, observacoes AS notes, criado_em AS createdAt
    FROM horas_voluntarias ORDER BY data DESC
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
           (id, voluntaria_id, voluntaria_nome, nome_atividade, categoria, data, horas, local, observacoes, criado_em)
         VALUES (?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           voluntaria_id=VALUES(voluntaria_id), voluntaria_nome=VALUES(voluntaria_nome), nome_atividade=VALUES(nome_atividade), categoria=VALUES(categoria),
           data=VALUES(data), horas=VALUES(horas), local=VALUES(local), observacoes=VALUES(observacoes), criado_em=VALUES(criado_em)`,
        [h.id, h.volunteerId ?? null, h.volunteerName, h.activityName, h.category, h.date, h.hours, h.location, h.notes ?? null, toMysqlDatetime(h.createdAt)],
      );
    }

    if (hours.length > 0) {
      const ids = hours.map((h) => h.id);
      await conn.query(`DELETE FROM horas_voluntarias WHERE id NOT IN (${ids.map(() => "?").join(",")})`, ids);
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
      a.id,
      a.titulo                          AS title,
      a.descricao                       AS description,
      DATE_FORMAT(a.data, '%Y-%m-%d')   AS date,
      a.turno                           AS shift,
      a.local                           AS location,
      a.duracao_estimada                AS estimatedDuration,
      COALESCE(a.status, 'aberta')      AS status,
      a.voluntaria_id                   AS volunteerId,
      u.nome                            AS volunteerName
    FROM agenda_voluntarias a
    LEFT JOIN usuarios u ON u.id = a.voluntaria_id
    ORDER BY a.data ASC
  `);
  return rows;
}

export async function createVolunteerAgendaItem(payload: {
  title: string;
  description?: string;
  date: string;
  shift: string;
  location: string;
  estimatedDuration?: string;
}): Promise<VolunteerAgendaItem> {
  const [result] = await pool.query<any>(
    `INSERT INTO agenda_voluntarias
       (titulo, descricao, data, turno, local, duracao_estimada, status)
     VALUES (?, ?, ?, ?, ?, ?, 'aberta')`,
    [
      payload.title,
      payload.description ?? null,
      payload.date,
      payload.shift,
      payload.location,
      payload.estimatedDuration ?? null,
    ],
  );
  const id = result.insertId;
  const all = await getVolunteerAgenda();
  return all.find((item) => item.id === id) as VolunteerAgendaItem;
}

export async function updateVolunteerAgendaItem(
  id: number,
  payload: {
    title: string;
    description?: string;
    date: string;
    shift: string;
    location: string;
    estimatedDuration?: string;
  },
): Promise<VolunteerAgendaItem | null> {
  await pool.query(
    `UPDATE agenda_voluntarias
       SET titulo = ?, descricao = ?, data = ?, turno = ?, local = ?, duracao_estimada = ?
     WHERE id = ?`,
    [
      payload.title,
      payload.description ?? null,
      payload.date,
      payload.shift,
      payload.location,
      payload.estimatedDuration ?? null,
      id,
    ],
  );
  const all = await getVolunteerAgenda();
  return all.find((item) => item.id === id) ?? null;
}

export async function deleteVolunteerAgendaItem(id: number): Promise<void> {
  await pool.query(`DELETE FROM agenda_voluntarias WHERE id = ?`, [id]);
}

export async function claimVolunteerAgendaItem(
  id: number,
  volunteerId: number,
): Promise<VolunteerAgendaItem | null> {
  // Atomic: só atribui se ainda estiver aberta (evita corrida de claim).
  const [result] = await pool.query<any>(
    `UPDATE agenda_voluntarias
       SET voluntaria_id = ?, status = 'atribuida'
     WHERE id = ? AND (voluntaria_id IS NULL OR voluntaria_id = ?)
       AND status = 'aberta'`,
    [volunteerId, id, volunteerId],
  );
  if (result.affectedRows === 0) {
    return null; // já atribuída a outra voluntária
  }
  const all = await getVolunteerAgenda();
  return all.find((item) => item.id === id) ?? null;
}

export async function getActiveVolunteerIds(): Promise<number[]> {
  const [rows] = await pool.query<any[]>(
    `SELECT id FROM usuarios WHERE tipo_usuario = 'voluntaria' AND status = 'Ativo'`,
  );
  return rows.map((r) => r.id as number);
}

export async function getActiveAdminIds(): Promise<number[]> {
  const [rows] = await pool.query<any[]>(
    `SELECT id FROM usuarios WHERE tipo_usuario = 'admin' AND status = 'Ativo'`,
  );
  return rows.map((r) => r.id as number);
}

export async function insertNotifications(
  items: AppNotification[],
): Promise<void> {
  if (items.length === 0) return;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const n of items) {
      await conn.query(
        `INSERT INTO notificacoes
           (id, perfil_destinatario, destinatario_id, tipo, titulo, mensagem, data, lida)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          n.id,
          n.recipientRole,
          n.recipientId ?? null,
          n.type,
          n.title,
          n.message,
          toMysqlDatetime(n.date),
          n.read ? 1 : 0,
        ],
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}