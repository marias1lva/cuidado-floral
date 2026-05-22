import { mkdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import type { ManagedUser } from "../src/admin/types";
import type {
  AppNotification,
  Appointment,
  AppointmentAttachment,
  Donation,
  Patient,
} from "../src/domain/types";
import type { VolunteerHourEntry } from "../src/volunteer-hours/types";
import { readStore, toManagedUsers, writeStore } from "./store";

const UPLOADS_DIR = resolve(process.cwd(), "server/data/uploads");
await mkdir(UPLOADS_DIR, { recursive: true });

const app = Fastify({ logger: false });

await app.register(cors, {
  origin: true,
});

await app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB por arquivo
    files: 10,
  },
});

await app.register(fastifyStatic, {
  root: UPLOADS_DIR,
  prefix: "/uploads/",
  decorateReply: false,
});

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "arquivo";
}

function makeUploadId(): string {
  return `att-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

app.get("/api/health", async () => ({ status: "ok" }));

app.post<{ Body: { email?: string; password?: string } }>(
  "/api/auth/login",
  async (request, reply) => {
    const email = request.body.email?.trim().toLowerCase();
    const password = request.body.password ?? "";
    const store = await readStore();
    const user = store.users.find(
      (item) =>
        item.email.trim().toLowerCase() === email &&
        item.password === password &&
        item.status === "Ativo",
    );

    if (!user) {
      return reply.status(401).send({
        message: "E-mail ou senha incorretos. Por favor, tente novamente.",
      });
    }

    return { role: user.type };
  },
);

app.get("/api/patients", async () => {
  const store = await readStore();
  return store.patients;
});

app.put<{ Body: Patient[] }>("/api/patients", async (request) => {
  const store = await readStore();
  store.patients = request.body;
  await writeStore(store);
  return store.patients;
});

app.get("/api/appointments", async () => {
  const store = await readStore();
  return store.appointments;
});

app.put<{ Body: Appointment[] }>("/api/appointments", async (request) => {
  const store = await readStore();
  store.appointments = request.body;
  await writeStore(store);
  return store.appointments;
});

app.get("/api/notifications", async () => {
  const store = await readStore();
  return store.notifications;
});

app.put<{ Body: AppNotification[] }>("/api/notifications", async (request) => {
  const store = await readStore();
  store.notifications = request.body;
  await writeStore(store);
  return store.notifications;
});

app.get("/api/donations", async () => {
  const store = await readStore();
  return store.donations;
});

app.put<{ Body: Donation[] }>("/api/donations", async (request) => {
  const store = await readStore();
  store.donations = request.body;
  await writeStore(store);
  return store.donations;
});

app.get("/api/users", async () => {
  const store = await readStore();
  return toManagedUsers(store.users);
});

app.put<{ Body: ManagedUser[] }>("/api/users", async (request) => {
  const store = await readStore();
  store.users = request.body.map((user) => {
    const existing = store.users.find((current) => current.id === user.id);
    return {
      ...user,
      password: existing?.password ?? "123",
    };
  });
  await writeStore(store);
  return toManagedUsers(store.users);
});

app.get("/api/campaigns", async () => {
  const store = await readStore();
  return store.campaigns;
});

app.get("/api/volunteer-hours", async () => {
  const store = await readStore();
  return store.volunteerHours;
});

app.put<{ Body: VolunteerHourEntry[] }>(
  "/api/volunteer-hours",
  async (request) => {
    const store = await readStore();
    store.volunteerHours = request.body;
    await writeStore(store);
    return store.volunteerHours;
  },
);

app.get("/api/volunteer-agenda", async () => {
  const store = await readStore();
  return store.volunteerAgenda;
});

app.post("/api/uploads", async (request, reply) => {
  const parts = request.files();
  const uploaded: AppointmentAttachment[] = [];

  for await (const part of parts) {
    const id = makeUploadId();
    const folder = resolve(UPLOADS_DIR, id);
    await mkdir(folder, { recursive: true });

    const filename = safeFilename(part.filename);
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
});

await app.listen({
  host: "0.0.0.0",
  port: 3001,
});

console.log("API rodando em http://localhost:3001");
