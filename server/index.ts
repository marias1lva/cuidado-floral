import Fastify from "fastify";
import cors from "@fastify/cors";
import type { ManagedUser } from "../src/admin/types";
import type {
  AppNotification,
  Appointment,
  Donation,
  Patient,
} from "../src/domain/types";
import type { VolunteerHourEntry } from "../src/volunteer-hours/types";
import { readStore, toManagedUsers, writeStore } from "./store";

const app = Fastify({ logger: false });

await app.register(cors, {
  origin: true,
});

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

app.post<{ Body: Appointment }>("/api/appointments", async (request) => {
  const store = await readStore();
  store.appointments = [request.body, ...store.appointments];
  await writeStore(store);
  return request.body;
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

app.get<{ Params: { id: string } }>("/api/users/:id", async (request, reply) => {
  const store = await readStore();
  const id = Number(request.params.id);
  const user = store.users.find((item) => item.id === id);
  if (!user) {
    return reply.status(404).send({ message: "Usuário não encontrado." });
  }
  return toManagedUsers([user])[0];
});

app.put<{ Params: { id: string }; Body: ManagedUser }>(
  "/api/users/:id",
  async (request, reply) => {
    const store = await readStore();
    const id = Number(request.params.id);
    const userIndex = store.users.findIndex((item) => item.id === id);
    if (userIndex === -1) {
      return reply.status(404).send({ message: "Usuário não encontrado." });
    }

    store.users[userIndex] = {
      ...request.body,
      password: store.users[userIndex].password,
    };

    await writeStore(store);
    return toManagedUsers([store.users[userIndex]])[0];
  },
);

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

await app.listen({
  host: "0.0.0.0",
  port: 3001,
});
