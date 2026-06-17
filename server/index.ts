import { mkdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import Fastify from "fastify";
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import jwt from "@fastify/jwt";
import bcrypt from "bcryptjs";
import type { ManagedUser, ManagedUserRole } from "../src/admin/types";
import type {
  AppNotification, Appointment, AppointmentAttachment, Donation, Patient,
} from "../src/domain/types";
import type { VolunteerHourEntry } from "../src/volunteer-hours/types";
import { testConnection } from "./db/connection";
import {
  getUsers, saveUsers, toManagedUsers, updateUserPasswordHash,
  getPatients, savePatients,
  getPatientProfileByUserId, savePatientProfile as savePatientProfileDb,
  type PatientProfileUpdate,
  getAppointments, saveAppointments,
  getNotifications, saveNotifications,
  getDonations, saveDonations,
  getCampaigns, getSectors,
  getVolunteerHours, saveVolunteerHours,
  getVolunteerAgenda,
  createVolunteerAgendaItem,
  updateVolunteerAgendaItem,
  deleteVolunteerAgendaItem,
  claimVolunteerAgendaItem,
  getActiveVolunteerIds,
  getActiveAdminIds,
  insertNotifications,
} from "./db/queries";


const UPLOADS_DIR = resolve(process.cwd(), "server/data/uploads");
await mkdir(UPLOADS_DIR, { recursive: true });

// Verifica conexão com o banco ao iniciar
await testConnection();

const JWT_SECRET = process.env.JWT_SECRET ?? "cuidado-floral-dev-secret-change-me";

interface AuthPayload { sub: number; role: ManagedUserRole; name: string; }
declare module "@fastify/jwt" {
  interface FastifyJWT { payload: AuthPayload; user: AuthPayload; }
}

const app = Fastify({ logger: false });
await app.register(cors, { origin: true });
await app.register(jwt, { secret: JWT_SECRET });
await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024, files: 10 } });
await app.register(fastifyStatic, { root: UPLOADS_DIR, prefix: "/uploads/", decorateReply: false });

const PUBLIC_PATHS = new Set(["/api/health", "/api/auth/login", "/api/auth/register"]);

app.addHook("onRequest", async (request, reply) => {
  if (!request.url.startsWith("/api/")) return;
  if (PUBLIC_PATHS.has(request.url.split("?")[0])) return;
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({ message: "Sessão expirada ou inválida." });
  }
});

function requireRole(allowed: ManagedUserRole[]): preHandlerHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user || !allowed.includes(request.user.role)) {
      return reply.status(403).send({ message: "Você não tem permissão para esta ação." });
    }
  };
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "arquivo";
}
function makeUploadId(): string {
  return `att-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/jpg"]);
const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg"]);
function isAllowedAttachment(filename: string, mimeType: string): boolean {
  if (ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) return true;
  return ALLOWED_EXTENSIONS.has(filename.split(".").pop()?.toLowerCase() ?? "");
}

const ALL_ROLES: ManagedUserRole[] = ["admin", "voluntaria", "paciente", "doador"];

// Saúde 
app.get("/api/health", async () => ({ status: "ok" }));

// Login 
app.post<{ Body: { email?: string; password?: string } }>(
  "/api/auth/login",
  async (request, reply) => {
    const email = request.body.email?.trim().toLowerCase();
    const password = request.body.password ?? "";
    if (!email || !password)
      return reply.status(400).send({ message: "Informe e-mail e senha." });

    const users = await getUsers();
    const user = users.find(
      (u) => u.email.trim().toLowerCase() === email && u.status === "Ativo",
    );

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return reply.status(401).send({
        message: "E-mail ou senha incorretos. Por favor, tente novamente.",
      });
    }

    const token = app.jwt.sign(
      { sub: user.id, role: user.type, name: user.name },
      { expiresIn: "12h" },
    );
    return { token, role: user.type, name: user.name };
  },
);

// Trocar senha do usuário logado
app.post<{
  Body: { currentPassword?: string; newPassword?: string };
}>(
  "/api/auth/change-password",
  { preHandler: requireRole(ALL_ROLES) },
  async (request, reply) => {
    const currentPassword = request.body.currentPassword ?? "";
    const newPassword = request.body.newPassword ?? "";

    if (!currentPassword || !newPassword) {
      return reply.status(400).send({
        message: "Informe a senha atual e a nova senha.",
      });
    }
    if (newPassword.length < 6) {
      return reply.status(400).send({
        message: "A nova senha deve ter ao menos 6 caracteres.",
      });
    }
    if (currentPassword === newPassword) {
      return reply.status(400).send({
        message: "A nova senha deve ser diferente da atual.",
      });
    }

    const userId = request.user.sub;
    const users = await getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return reply.status(404).send({ message: "Usuário não encontrado." });
    }
    if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
      return reply.status(401).send({ message: "Senha atual incorreta." });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await updateUserPasswordHash(userId, newHash);
    return { ok: true };
  },
);

// Cadastro
app.post("/api/auth/register", async (request, reply) => {
  const { name, email, password, cpf, type } = request.body as any;

  if (!name || !email || !password || !cpf || !type) {
    return reply.status(400).send({ message: "Preencha todos os campos obrigatórios." });
  }

  const pool = (await import("./db/connection")).default;
  const conn = await pool.getConnection();

  try {
    const [existing] = await conn.query<any>(
      "SELECT id FROM usuarios WHERE email = ? OR cpf = ?", [email, cpf]
    );
    
    if (existing.length > 0) {
      return reply.status(400).send({ message: "Este E-mail ou CPF já estão cadastrados." });
    }

    const hash = await bcrypt.hash(password, 10);

    await conn.beginTransaction();

    const [result] = await conn.query<any>(
      "INSERT INTO usuarios (nome, email, senha_hash, cpf, tipo_usuario, status, data_cadastro) VALUES (?, ?, ?, ?, ?, 'Ativo', NOW())",
      [name, email, hash, cpf, type]
    );
    const userId = result.insertId;

    // IDs padronizados usando o ID do banco (pat-ID, don-ID, vol-ID) para manter integridade com as queries
    if (type === "paciente") {
      await conn.query("INSERT INTO pacientes (id_paciente, usuario_id, prioridade) VALUES (?, ?, 'media')", [`pat-${userId}`, userId]);
    } else if (type === "doador") {
      await conn.query("INSERT INTO doadores (id_doador, usuario_id) VALUES (?, ?)", [`doa-${userId}`, userId]);
    } else if (type === "voluntaria") {
      await conn.query("INSERT INTO voluntarias (id_voluntaria, usuario_id) VALUES (?, ?)", [`vol-${userId}`, userId]);
    }

    await conn.commit();

    const token = app.jwt.sign({ sub: userId, role: type, name });
    return { token, role: type, name };

  } catch (error) {
    await conn.rollback(); 
    console.error("Erro no cadastro:", error);
    return reply.status(500).send({ message: "Erro interno ao cadastrar o usuário no banco de dados." });
  } finally {
    conn.release(); 
  }
});

// Pacientes 
app.get("/api/patients",
  { preHandler: requireRole(["admin", "voluntaria"]) },
  async () => getPatients(),
);
app.put<{ Body: Patient[] }>("/api/patients",
  { preHandler: requireRole(["admin", "voluntaria"]) },
  async (request) => savePatients(request.body),
);

// Perfil consolidado da paciente (usuarios + pacientes).
// Paciente edita o próprio perfil; admin e voluntária podem consultar pelo userId.
app.get<{ Querystring: { userId?: string } }>(
  "/api/patients/profile",
  { preHandler: requireRole(["paciente", "admin", "voluntaria"]) },
  async (request, reply) => {
    const userId =
      request.user.role === "paciente"
        ? request.user.sub
        : Number(request.query.userId ?? 0);
    if (!userId) {
      return reply.status(400).send({ message: "userId é obrigatório." });
    }
    const profile = await getPatientProfileByUserId(userId);
    if (!profile) {
      return reply.status(404).send({ message: "Perfil não encontrado." });
    }
    return profile;
  },
);

app.put<{ Body: PatientProfileUpdate & { userId?: number } }>(
  "/api/patients/profile",
  { preHandler: requireRole(["paciente", "admin"]) },
  async (request, reply) => {
    const userId =
      request.user.role === "paciente"
        ? request.user.sub
        : Number(request.body.userId ?? 0);
    if (!userId) {
      return reply.status(400).send({ message: "userId é obrigatório." });
    }
    const { name, email, phone } = request.body;
    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return reply.status(400).send({
        message: "Nome, e-mail e telefone são obrigatórios.",
      });
    }
    const saved = await savePatientProfileDb(userId, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      birthDate: request.body.birthDate ?? null,
      city: request.body.city ?? null,
      district: request.body.district ?? null,
      familyHistory: request.body.familyHistory ?? null,
      symptoms: request.body.symptoms ?? null,
    });
    return saved;
  },
);

// Atendimentos
app.get("/api/appointments",
  { preHandler: requireRole(["admin", "voluntaria", "paciente"]) },
  async () => getAppointments(),
);
app.put<{ Body: Appointment[] }>("/api/appointments",
  { preHandler: requireRole(["admin", "voluntaria", "paciente"]) },
  async (request) => saveAppointments(request.body),
);

// Notificações 
app.get("/api/notifications",
  { preHandler: requireRole(ALL_ROLES) },
  async () => getNotifications(),
);
app.put<{ Body: AppNotification[] }>("/api/notifications",
  { preHandler: requireRole(["admin", "voluntaria", "paciente"]) },
  async (request) => saveNotifications(request.body),
);

// Doações 
app.get("/api/donations",
  { preHandler: requireRole(["admin", "doador"]) },
  async () => getDonations(),
);
app.put<{ Body: Donation[] }>("/api/donations",
  { preHandler: requireRole(["admin", "doador"]) },
  async (request) => saveDonations(request.body),
);

// Usuários (admin) 
app.get("/api/users",
  { preHandler: requireRole(["admin"]) },
  async () => toManagedUsers(await getUsers()),
);
app.put<{ Body: (ManagedUser & { password?: string })[] }>("/api/users",
  { preHandler: requireRole(["admin"]) },
  async (request) => {
    const existing = await getUsers();
    const defaultHash = bcrypt.hashSync("123", 10);
    const toSave = request.body.map((item) => {
      const { password, ...user } = item;
      const current = existing.find((u) => u.id === user.id);
      // Usuário existente: preserva o hash atual (edição nunca altera senha).
      // Usuário novo: usa a senha enviada pelo admin (hasheada); fallback "123".
      const passwordHash = current
        ? current.passwordHash
        : password && password.length >= 6
          ? bcrypt.hashSync(password, 10)
          : defaultHash;
      return { ...user, passwordHash };
    });
    const saved = await saveUsers(toSave);
    return toManagedUsers(saved);
  },
);

// Campanhas e Setores 
app.get("/api/campaigns", { preHandler: requireRole(ALL_ROLES) }, async () => getCampaigns());
app.get("/api/sectors",   { preHandler: requireRole(ALL_ROLES) }, async () => getSectors());

// Horas Voluntárias 
app.get("/api/volunteer-hours",
  { preHandler: requireRole(["admin", "voluntaria"]) },
  async () => getVolunteerHours(),
);
app.put<{ Body: VolunteerHourEntry[] }>("/api/volunteer-hours",
  { preHandler: requireRole(["admin", "voluntaria"]) },
  async (request) => saveVolunteerHours(request.body),
);

// Agenda
app.get("/api/volunteer-agenda",
  { preHandler: requireRole(["admin", "voluntaria"]) },
  async () => getVolunteerAgenda(),
);

interface AgendaPayload {
  title: string;
  description?: string;
  date: string;
  shift: string;
  location: string;
  estimatedDuration?: string;
}

function makeNotificationId(prefix = "nt"): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

// Admin cria atividade -> broadcast pra todas as voluntárias ativas.
app.post<{ Body: AgendaPayload }>(
  "/api/volunteer-agenda",
  { preHandler: requireRole(["admin"]) },
  async (request, reply) => {
    const { title, date, shift, location } = request.body;
    if (!title?.trim() || !date || !shift?.trim() || !location?.trim()) {
      return reply.status(400).send({
        message: "Título, data, turno e local são obrigatórios.",
      });
    }
    const created = await createVolunteerAgendaItem({
      title: title.trim(),
      description: request.body.description?.trim() || undefined,
      date,
      shift: shift.trim(),
      location: location.trim(),
      estimatedDuration: request.body.estimatedDuration?.trim() || undefined,
    });

    // Notifica todas as voluntárias ativas.
    const volunteerIds = await getActiveVolunteerIds();
    const now = new Date().toISOString();
    const notifications = volunteerIds.map((vid) => ({
      id: makeNotificationId(),
      recipientRole: "voluntaria" as const,
      recipientId: `vol-${vid}`,
      type: "geral" as const,
      title: "Nova atividade disponível",
      message: `Nova atividade "${created.title}" em ${created.date}, ${created.shift}, ${created.location}.`,
      date: now,
      read: false,
    }));
    try {
      await insertNotifications(notifications);
    } catch (err) {
      console.error("Falha ao enviar notificações de nova atividade", err);
    }
    return created;
  },
);

app.put<{ Params: { id: string }; Body: AgendaPayload }>(
  "/api/volunteer-agenda/:id",
  { preHandler: requireRole(["admin"]) },
  async (request, reply) => {
    const id = Number(request.params.id);
    const updated = await updateVolunteerAgendaItem(id, {
      title: request.body.title.trim(),
      description: request.body.description?.trim() || undefined,
      date: request.body.date,
      shift: request.body.shift.trim(),
      location: request.body.location.trim(),
      estimatedDuration: request.body.estimatedDuration?.trim() || undefined,
    });
    if (!updated) {
      return reply.status(404).send({ message: "Atividade não encontrada." });
    }
    return updated;
  },
);

app.delete<{ Params: { id: string } }>(
  "/api/volunteer-agenda/:id",
  { preHandler: requireRole(["admin"]) },
  async (request) => {
    await deleteVolunteerAgendaItem(Number(request.params.id));
    return { ok: true };
  },
);

// Voluntária pega atividade aberta -> notifica todos os admins.
app.post<{ Params: { id: string } }>(
  "/api/volunteer-agenda/:id/claim",
  { preHandler: requireRole(["voluntaria"]) },
  async (request, reply) => {
    const id = Number(request.params.id);
    const volunteerId = request.user.sub;
    const claimed = await claimVolunteerAgendaItem(id, volunteerId);
    if (!claimed) {
      return reply.status(409).send({
        message: "Atividade já foi atribuída a outra voluntária.",
      });
    }

    const adminIds = await getActiveAdminIds();
    const now = new Date().toISOString();
    const notifications = adminIds.map((aid) => ({
      id: makeNotificationId(),
      recipientRole: "admin" as const,
      recipientId: `admin-${aid}`,
      type: "geral" as const,
      title: "Atividade atribuída",
      message: `${request.user.name} pegou a atividade "${claimed.title}" (${claimed.date}, ${claimed.shift}).`,
      date: now,
      read: false,
    }));
    try {
      await insertNotifications(notifications);
    } catch (err) {
      console.error("Falha ao notificar admin sobre claim", err);
    }
    return claimed;
  },
);

// Upload de Anexos

app.post("/api/uploads",
  { preHandler: requireRole(ALL_ROLES) },
  async (request, reply) => {
    const parts = request.files();
    const uploaded: AppointmentAttachment[] = [];

    for await (const part of parts) {
      const filename = safeFilename(part.filename);
      if (!isAllowedAttachment(filename, part.mimetype)) {
        await part.toBuffer().catch(() => undefined);
        return reply.status(415).send({
          message: `Formato não suportado em "${part.filename}". Envie apenas PDF ou JPG.`,
        });
      }
      const id = makeUploadId();
      const folder = resolve(UPLOADS_DIR, id);
      await mkdir(folder, { recursive: true });
      const fullPath = resolve(folder, filename);
      await pipeline(part.file, createWriteStream(fullPath));
      if (part.file.truncated)
        return reply.status(413).send({ message: "Arquivo excede o limite de 10 MB." });

      const { size } = await stat(fullPath);
      uploaded.push({
        id, filename, mimeType: part.mimetype, size,
        url: `/uploads/${id}/${filename}`,
        uploadedAt: new Date().toISOString(),
      });
    }
    return uploaded;
  },
);

app.get<{ Params: { id: string } }>(
  "/api/users/:id",
  { preHandler: requireRole(ALL_ROLES) },
  async (request, reply) => {
    const userId = Number(request.params.id);
    const users = await getUsers();
    const user = users.find((u) => u.id === userId);

    if (!user) {
      return reply.status(404).send({ message: "Usuário não encontrado." });
    }

    return toManagedUsers([user])[0];
  }
);

app.put<{ Params: { id: string }; Body: ManagedUser }>(
  "/api/users/:id",
  { preHandler: requireRole(ALL_ROLES) },
  async (request, reply) => {
    const userId = Number(request.params.id);
    const existing = await getUsers();
    const currentUser = existing.find((u) => u.id === userId);

    if (!currentUser) {
      return reply.status(404).send({ message: "Usuário não encontrado." });
    }

    const updatedUser = {
      ...currentUser,
      name: request.body.name,
      date: request.body.date,
    };

    const saved = await saveUsers([updatedUser]);
    const finalUser = saved.find((u) => u.id === userId);

    return toManagedUsers(finalUser ? [finalUser] : [])[0];
  }
);

await app.listen({ host: "0.0.0.0", port: 3001 });
console.log("API rodando em http://localhost:3001");