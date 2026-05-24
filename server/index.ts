import { mkdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import Fastify from "fastify";
import type {
  FastifyReply,
  FastifyRequest,
  preHandlerHookHandler,
} from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import jwt from "@fastify/jwt";
import bcrypt from "bcryptjs";
import type { ManagedUser, ManagedUserRole } from "../src/admin/types";
import type {
  AppNotification,
  Appointment,
  AppointmentAttachment,
  Donation,
  Patient,
} from "../src/domain/types";
import type { VolunteerHourEntry } from "../src/volunteer-hours/types";
import { hashPasswordSync } from "./mock-data";
import { readStore, toManagedUsers, writeStore } from "./store";

const UPLOADS_DIR = resolve(process.cwd(), "server/data/uploads");
await mkdir(UPLOADS_DIR, { recursive: true });

const JWT_SECRET =
  process.env.JWT_SECRET ?? "cuidado-floral-dev-secret-change-me";

interface AuthPayload {
  sub: number;
  role: ManagedUserRole;
  name: string;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AuthPayload;
    user: AuthPayload;
  }
}

const app = Fastify({ logger: false });

await app.register(cors, { origin: true });

await app.register(jwt, { secret: JWT_SECRET });

await app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
});

await app.register(fastifyStatic, {
  root: UPLOADS_DIR,
  prefix: "/uploads/",
  decorateReply: false,
});

const PUBLIC_PATHS = new Set(["/api/health", "/api/auth/login"]);

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
      return reply
        .status(403)
        .send({ message: "Você não tem permissão para esta ação." });
    }
  };
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "arquivo";
}

function makeUploadId(): string {
  return `att-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

// Whitelist de formatos aceitos para anexos (RF14).
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
]);
const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg"]);

function isAllowedAttachment(filename: string, mimeType: string): boolean {
  if (ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) return true;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_EXTENSIONS.has(ext);
}

// ── Públicas ───────────────────────────────────────────

app.get("/api/health", async () => ({ status: "ok" }));

app.post<{ Body: { email?: string; password?: string } }>(
  "/api/auth/login",
  async (request, reply) => {
    const email = request.body.email?.trim().toLowerCase();
    const password = request.body.password ?? "";
    if (!email || !password) {
      return reply.status(400).send({ message: "Informe e-mail e senha." });
    }

    const store = await readStore();
    const user = store.users.find(
      (item) =>
        item.email.trim().toLowerCase() === email && item.status === "Ativo",
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

// ── Protegidas ─────────────────────────────────────────

const ALL_ROLES: ManagedUserRole[] = [
  "admin",
  "voluntaria",
  "paciente",
  "doador",
];

app.get(
  "/api/patients",
  { preHandler: requireRole(["admin", "voluntaria"]) },
  async () => {
    const store = await readStore();
    return store.patients;
  },
);

app.put<{ Body: Patient[] }>(
  "/api/patients",
  { preHandler: requireRole(["admin", "voluntaria"]) },
  async (request) => {
    const store = await readStore();
    store.patients = request.body;
    await writeStore(store);
    return store.patients;
  },
);

app.get(
  "/api/appointments",
  { preHandler: requireRole(["admin", "voluntaria", "paciente"]) },
  async () => {
    const store = await readStore();
    return store.appointments;
  },
);

app.put<{ Body: Appointment[] }>(
  "/api/appointments",
  { preHandler: requireRole(["admin", "voluntaria", "paciente"]) },
  async (request) => {
    const store = await readStore();
    store.appointments = request.body;
    await writeStore(store);
    return store.appointments;
  },
);

app.get(
  "/api/notifications",
  { preHandler: requireRole(ALL_ROLES) },
  async () => {
    const store = await readStore();
    return store.notifications;
  },
);

app.put<{ Body: AppNotification[] }>(
  "/api/notifications",
  { preHandler: requireRole(["admin", "voluntaria", "paciente"]) },
  async (request) => {
    const store = await readStore();
    store.notifications = request.body;
    await writeStore(store);
    return store.notifications;
  },
);

app.get(
  "/api/donations",
  { preHandler: requireRole(["admin", "doador"]) },
  async () => {
    const store = await readStore();
    return store.donations;
  },
);

app.put<{ Body: Donation[] }>(
  "/api/donations",
  { preHandler: requireRole(["admin", "doador"]) },
  async (request) => {
    const store = await readStore();
    store.donations = request.body;
    await writeStore(store);
    return store.donations;
  },
);

app.get("/api/users", { preHandler: requireRole(["admin"]) }, async () => {
  const store = await readStore();
  return toManagedUsers(store.users);
});

app.put<{ Body: ManagedUser[] }>(
  "/api/users",
  { preHandler: requireRole(["admin"]) },
  async (request) => {
    const store = await readStore();
    const defaultHash = hashPasswordSync("123");
    store.users = request.body.map((user) => {
      const existing = store.users.find((current) => current.id === user.id);
      return {
        ...user,
        passwordHash: existing?.passwordHash ?? defaultHash,
      };
    });
    await writeStore(store);
    return toManagedUsers(store.users);
  },
);

app.get("/api/campaigns", { preHandler: requireRole(ALL_ROLES) }, async () => {
  const store = await readStore();
  return store.campaigns;
});

app.get("/api/sectors", { preHandler: requireRole(ALL_ROLES) }, async () => {
  const store = await readStore();
  return store.sectors;
});

app.get(
  "/api/volunteer-hours",
  { preHandler: requireRole(["admin", "voluntaria"]) },
  async () => {
    const store = await readStore();
    return store.volunteerHours;
  },
);

app.put<{ Body: VolunteerHourEntry[] }>(
  "/api/volunteer-hours",
  { preHandler: requireRole(["admin", "voluntaria"]) },
  async (request) => {
    const store = await readStore();
    store.volunteerHours = request.body;
    await writeStore(store);
    return store.volunteerHours;
  },
);

app.get(
  "/api/volunteer-agenda",
  { preHandler: requireRole(["admin", "voluntaria"]) },
  async () => {
    const store = await readStore();
    return store.volunteerAgenda;
  },
);

app.post(
  "/api/uploads",
  { preHandler: requireRole(ALL_ROLES) },
  async (request, reply) => {
    const parts = request.files();
    const uploaded: AppointmentAttachment[] = [];

    for await (const part of parts) {
      const filename = safeFilename(part.filename);

      if (!isAllowedAttachment(filename, part.mimetype)) {
        // Drena o stream pra não travar a conexão e responde 415.
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

      if (part.file.truncated) {
        return reply.status(413).send({
          message: "Arquivo excede o limite de 10 MB.",
        });
      }

      const { size } = await stat(fullPath);

      uploaded.push({
        id,
        filename,
        mimeType: part.mimetype,
        size,
        url: `/uploads/${id}/${filename}`,
        uploadedAt: new Date().toISOString(),
      });
    }

    return uploaded;
  },
);

await app.listen({
  host: "0.0.0.0",
  port: 3001,
});

console.log("API rodando em http://localhost:3001");
