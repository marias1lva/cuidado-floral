import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Download,
  Edit,
  FileText,
  Heart,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Plus,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  Users,
} from "lucide-react";

import { AdminUserModal } from "./admin/admin-user-modal";
import type { ManagedUser, ManagedUserRole } from "./admin/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

type AdminTab = "users" | "campaigns" | "reports";

const USERS_STORAGE_KEY = "admin-managed-users";

const initialUsers: ManagedUser[] = [
  {
    id: 1,
    name: "Maria Silva",
    email: "maria@email.com",
    cpf: "123.456.789-09",
    type: "paciente",
    status: "Ativo",
    date: "10/10/2025",
  },
  {
    id: 2,
    name: "Ana Voluntária",
    email: "ana@email.com",
    cpf: "987.654.321-00",
    type: "voluntaria",
    status: "Ativo",
    date: "05/09/2025",
  },
  {
    id: 3,
    name: "João Doador",
    email: "joao@email.com",
    cpf: "456.789.123-10",
    type: "doador",
    status: "Ativo",
    date: "15/08/2025",
  },
];

const campaigns = [
  { id: 1, name: "Outubro Rosa 2025", period: "01/10 - 31/10/2025", donations: 45, status: "Ativa" },
  { id: 2, name: "Campanha de Cabelos", period: "01/09 - 30/11/2025", donations: 23, status: "Ativa" },
  { id: 3, name: "Natal Solidário 2024", period: "01/12 - 24/12/2024", donations: 67, status: "Encerrada" },
];

function getTodayDateLabel() {
  return new Intl.DateTimeFormat("pt-BR").format(new Date());
}

function formatRoleLabel(role: ManagedUserRole) {
  if (role === "voluntaria") {
    return "Voluntária";
  }
  if (role === "paciente") {
    return "Paciente";
  }
  if (role === "doador") {
    return "Doador";
  }
  return "Admin";
}

interface AdminAreaProps {
  onLogout: () => void;
}

export function AdminArea({ onLogout }: AdminAreaProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<ManagedUser[]>(() => {
    if (typeof window === "undefined") {
      return initialUsers;
    }

    const savedUsers = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!savedUsers) {
      return initialUsers;
    }

    try {
      return JSON.parse(savedUsers) as ManagedUser[];
    } catch {
      return initialUsers;
    }
  });
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  useEffect(() => {
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  const activeUsers = users.filter((user) => user.status === "Ativo");
  const patientsCount = activeUsers.filter((user) => user.type === "paciente").length;
  const volunteersCount = activeUsers.filter((user) => user.type === "voluntaria").length;
  const donorsCount = activeUsers.filter((user) => user.type === "doador").length;
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "Ativa").length;

  const totalDonations = useMemo(
    () => campaigns.reduce((sum, campaign) => sum + campaign.donations, 0),
    [],
  );

  function openCreateUserModal() {
    setEditingUser(null);
    setIsUserModalOpen(true);
  }

  function openEditUserModal(user: ManagedUser) {
    setEditingUser(user);
    setIsUserModalOpen(true);
  }

  function handleSaveUser(payload: {
    name: string;
    email: string;
    cpf: string;
    type: ManagedUserRole;
  }) {
    if (editingUser) {
      setUsers((current) =>
        current.map((user) =>
          user.id === editingUser.id ? { ...user, ...payload } : user,
        ),
      );
      return;
    }

    const newUser: ManagedUser = {
      id: Date.now(),
      ...payload,
      status: "Ativo",
      date: getTodayDateLabel(),
    };
    setUsers((current) => [newUser, ...current]);
  }

  function handleInactivateUser(id: number) {
    setUsers((current) =>
      current.map((user) =>
        user.id === id ? { ...user, status: "Inativo" as const } : user,
      ),
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <nav className="flex items-center justify-between border-b border-[var(--border)] bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #E91E63, #C2185B)" }}
          >
            <Heart className="text-white" size={20} fill="white" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-[var(--primary)]">
              Cuidado Floral
            </p>
            <p className="text-xs leading-tight text-[var(--muted-foreground)]">
              Rede Feminina de Combate ao Câncer - Itapema
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative cursor-pointer">
            <Bell size={20} className="text-[var(--muted-foreground)]" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--primary)]" />
          </div>
          <div className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
            <User size={17} />
            <span>Administrador</span>
          </div>
          <button
            onClick={onLogout}
            className="flex cursor-pointer items-center gap-1 border-0 bg-transparent text-sm text-[var(--primary)] transition-opacity hover:opacity-75"
          >
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-semibold text-pink-600">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, campanhas e visualize relatórios do sistema
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card className="border-pink-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pacientes</CardTitle>
                <div className="rounded-lg bg-pink-100 p-2">
                  <Users className="h-5 w-5 text-pink-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-pink-600">{patientsCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">Ativos</p>
            </CardContent>
          </Card>

          <Card className="border-pink-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Voluntárias</CardTitle>
                <div className="rounded-lg bg-purple-100 p-2">
                  <UserCheck className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-purple-600">{volunteersCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">Ativas</p>
            </CardContent>
          </Card>

          <Card className="border-pink-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Doadores</CardTitle>
                <div className="rounded-lg bg-blue-100 p-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-blue-600">{donorsCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">Ativos</p>
            </CardContent>
          </Card>

          <Card className="border-pink-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Campanhas</CardTitle>
                <div className="rounded-lg bg-green-100 p-2">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-green-600">{campaigns.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">{activeCampaigns} ativas</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 grid w-full grid-cols-3 rounded-full bg-pink-50 p-1">
          <TabButton
            isActive={activeTab === "users"}
            label="Usuários"
            onClick={() => setActiveTab("users")}
          />
          <TabButton
            isActive={activeTab === "campaigns"}
            label="Campanhas"
            onClick={() => setActiveTab("campaigns")}
          />
          <TabButton
            isActive={activeTab === "reports"}
            label="Relatórios"
            onClick={() => setActiveTab("reports")}
          />
        </div>

        {activeTab === "users" && (
          <Card className="border-pink-100">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-pink-600">Gerenciamento de Usuários</CardTitle>
                  <CardDescription>
                    Visualize e gerencie todos os usuários do sistema
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full border-pink-300 hover:bg-pink-50"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                  <Button
                    onClick={openCreateUserModal}
                    className="rounded-full bg-pink-600 hover:bg-pink-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Usuário
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border border-pink-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-pink-50 text-[var(--foreground)]">
                        <th className="px-4 py-3 font-semibold">Nome</th>
                        <th className="px-4 py-3 font-semibold">E-mail</th>
                        <th className="px-4 py-3 font-semibold">CPF</th>
                        <th className="px-4 py-3 font-semibold">Tipo</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Data Cadastro</th>
                        <th className="px-4 py-3 text-right font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-t border-pink-50 hover:bg-pink-50">
                          <td className="px-4 py-3">{user.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                          <td className="px-4 py-3 text-muted-foreground">{user.cpf}</td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className="border-purple-200 bg-purple-50 text-purple-700"
                            >
                              {formatRoleLabel(user.type)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={
                                user.status === "Ativo"
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : "border-gray-200 bg-gray-50 text-gray-700"
                              }
                            >
                              {user.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{user.date}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => openEditUserModal(user)}
                                aria-label={`Editar ${user.name}`}
                              >
                                <Edit className="h-4 w-4 text-pink-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => handleInactivateUser(user.id)}
                                disabled={user.status === "Inativo"}
                                aria-label={`Inativar ${user.name}`}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "campaigns" && (
          <Card className="border-pink-100">
            <CardHeader>
              <CardTitle className="text-pink-600">Campanhas</CardTitle>
              <CardDescription>
                {campaigns.length} campanhas cadastradas e {totalDonations} doações registradas.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {activeTab === "reports" && (
          <Card className="border-pink-100">
            <CardHeader>
              <CardTitle className="text-pink-600">Relatórios</CardTitle>
              <CardDescription>Acesse indicadores administrativos detalhados.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </main>

      <footer className="mt-auto border-t border-[var(--border)] bg-[var(--background)] pb-4 pt-10">
        <div className="mx-auto w-full max-w-[1200px] px-4">
          <div className="mb-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Heart size={16} className="text-[var(--primary)]" />
                <span className="text-sm font-semibold text-[var(--primary)]">Sobre Nós</span>
              </div>
              <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                A Rede Feminina de Combate ao Câncer de Mama de Itapema trabalha para apoiar
                pacientes e promover a conscientização sobre o câncer de mama.
              </p>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold">Contato</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <Phone size={14} className="text-[var(--primary)]" />
                  (47) 3368-XXXX
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <Mail size={14} className="text-[var(--primary)]" />
                  contato@cuidadofloral.org.br
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <MapPin size={14} className="text-[var(--primary)]" />
                  Itapema, SC
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold">Links Úteis</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Sobre o Câncer de Mama", highlight: false },
                  { label: "Como Ajudar", highlight: true },
                  { label: "Política de Privacidade", highlight: false },
                  { label: "Termos de Uso", highlight: false },
                ].map(({ label, highlight }) => (
                  <a
                    key={label}
                    href="#"
                    className={`text-sm no-underline transition-colors hover:text-[var(--primary)] ${
                      highlight ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
                    }`}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-4 text-center text-xs text-[var(--muted-foreground)]">
            © 2025 Cuidado Floral - Rede Feminina de Combate ao Câncer de Mama. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      <AdminUserModal
        open={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        existingUsers={users}
        editingUser={editingUser}
        onSubmit={handleSaveUser}
      />
    </div>
  );
}

interface TabButtonProps {
  isActive: boolean;
  label: string;
  onClick: () => void;
}

function TabButton({ isActive, label, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-white text-[var(--foreground)] shadow-sm"
          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      }`}
    >
      {label}
    </button>
  );
}
