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
  getUsers, saveUsers, toManagedUsers,
  getPatients, savePatients,
  getAppointments, saveAppointments,
  getNotifications, saveNotifications,
  getDonations, saveDonations,
  getCampaigns, getSectors,
  getVolunteerHours, saveVolunteerHours,
  getVolunteerAgenda,
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
app.put<{ Body: ManagedUser[] }>("/api/users",
  { preHandler: requireRole(["admin"]) },
  async (request) => {
    const existing = await getUsers();
    // Gerando o hash localmente pelo bcrypt, removendo necessidade do mock-data
    const defaultHash = bcrypt.hashSync("123", 10);
    const toSave = request.body.map((user) => {
      const current = existing.find((u) => u.id === user.id);
      return { ...user, passwordHash: current?.passwordHash ?? defaultHash };
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