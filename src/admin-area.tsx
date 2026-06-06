import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Download,
  Edit,
  FileDown,
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
import { AdminReports } from "./admin/admin-reports";
import { AdminDonations } from "./admin/admin-donations";
import type { ManagedUser, ManagedUserRole } from "./admin/types";
import {
  loadCampaigns,
  loadManagedUsers,
  saveManagedUsers,
  type Campaign,
} from "./domain/admin-data";
import { loadNotifications, saveNotifications } from "./domain/patient-data";
import {
  buildCsv,
  downloadCsv,
  downloadPdfReport,
  type CsvColumn,
} from "./domain/reports";
import type { AppNotification } from "./domain/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  formatDateTimeBR,
  notificationTypeBadgeClass,
  notificationTypeLabel,
} from "./user-area/patient/patient-utils";

type AdminTab = "users" | "campaigns" | "donations" | "reports";

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
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [hasLoadedUsers, setHasLoadedUsers] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [hasLoadedNotifications, setHasLoadedNotifications] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([loadManagedUsers(), loadCampaigns()])
      .then(([managedUsers, loadedCampaigns]) => {
        if (!isMounted) return;
        setUsers(managedUsers);
        setCampaigns(loadedCampaigns);
        setHasLoadedUsers(true);
      })
      .catch((error) => {
        console.error("Falha ao carregar área administrativa", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    void loadNotifications()
      .then((items) => {
        if (!isMounted) return;
        setNotifications(items);
        setHasLoadedNotifications(true);
      })
      .catch((error) => {
        console.error("Falha ao carregar notificações", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedUsers) return;
    void saveManagedUsers(users).catch((error) => {
      console.error("Falha ao salvar usuários", error);
    });
  }, [users, hasLoadedUsers]);

  useEffect(() => {
    if (!hasLoadedNotifications) return;
    void saveNotifications(notifications).catch((error) => {
      console.error("Falha ao salvar notificações", error);
    });
  }, [notifications, hasLoadedNotifications]);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (!notificationsRef.current) return;
      const target = event.target;
      if (
        target instanceof Node &&
        !notificationsRef.current.contains(target)
      ) {
        setIsNotificationsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isNotificationsOpen]);

  const adminNotifications = useMemo(
    () =>
      notifications
        .filter((item) => item.recipientRole === "admin")
        .sort((a, b) => b.date.localeCompare(a.date)),
    [notifications],
  );

  const unreadCount = useMemo(
    () => adminNotifications.filter((item) => !item.read).length,
    [adminNotifications],
  );

  function handleMarkNotificationAsRead(notificationId: string) {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      ),
    );
  }

  function handleMarkAllAsRead() {
    if (unreadCount === 0) return;
    setNotifications((current) =>
      current.map((item) =>
        item.recipientRole === "admin" ? { ...item, read: true } : item,
      ),
    );
  }

  const userExportColumns: CsvColumn<ManagedUser>[] = [
    { header: "Nome", value: (row) => row.name },
    { header: "E-mail", value: (row) => row.email },
    { header: "CPF", value: (row) => row.cpf },
    { header: "Tipo", value: (row) => formatRoleLabel(row.type) },
    { header: "Status", value: (row) => row.status },
    { header: "Data de cadastro", value: (row) => row.date },
  ];

  function handleExportUsersCsv() {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`usuarios-${stamp}.csv`, buildCsv(users, userExportColumns));
  }

  function handleExportUsersPdf() {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadPdfReport(
      `usuarios-${stamp}.pdf`,
      {
        title: "Relatório de Usuários",
        summary: [
          { label: "Total", value: users.length.toString() },
          { label: "Ativos", value: activeUsers.length.toString() },
          { label: "Pacientes", value: patientsCount.toString() },
          { label: "Voluntárias", value: volunteersCount.toString() },
          { label: "Doadores", value: donorsCount.toString() },
        ],
      },
      [{ title: "Usuários", columns: userExportColumns, rows: users }],
    );
  }

  const activeUsers = users.filter((user) => user.status === "Ativo");
  const patientsCount = activeUsers.filter(
    (user) => user.type === "paciente",
  ).length;
  const volunteersCount = activeUsers.filter(
    (user) => user.type === "voluntaria",
  ).length;
  const donorsCount = activeUsers.filter(
    (user) => user.type === "doador",
  ).length;
  const activeCampaigns = campaigns.filter(
    (campaign) => campaign.status === "Ativa",
  ).length;

  const totalDonations = useMemo(
    () => campaigns.reduce((sum, campaign) => sum + campaign.donations, 0),
    [campaigns],
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
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((current) => !current)}
              className="relative cursor-pointer rounded-full p-1.5 transition-colors hover:bg-pink-50"
              aria-label="Abrir notificações"
              aria-haspopup="menu"
              aria-expanded={isNotificationsOpen}
            >
              <Bell size={20} className="text-[var(--muted-foreground)]" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
                  <span className="absolute -right-2 -top-2 min-w-[1.1rem] rounded-full bg-pink-600 px-1 text-center text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                </>
              )}
            </button>

            {isNotificationsOpen && (
              <div
                className="absolute right-0 z-40 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-lg shadow-pink-100/40"
                role="menu"
              >
                <div className="flex items-center justify-between border-b border-pink-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--primary)]">
                      Notificações
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {unreadCount > 0
                        ? `${unreadCount} não ${unreadCount === 1 ? "lida" : "lidas"}`
                        : "Sem pendências"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    disabled={unreadCount === 0}
                    className="rounded-full border border-pink-200 px-3 py-1 text-xs font-semibold text-pink-700 transition-colors hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Marcar tudo
                  </button>
                </div>

                {adminNotifications.length === 0 ? (
                  <div className="px-4 py-5 text-sm text-[var(--muted-foreground)]">
                    Você ainda não tem notificações.
                  </div>
                ) : (
                  <ul className="pretty-scrollbar max-h-80 space-y-2 overflow-y-auto p-3">
                    {adminNotifications.map((item) => (
                      <li
                        key={item.id}
                        className={`rounded-xl border p-3 ${
                          item.read
                            ? "border-gray-100 bg-gray-50/80"
                            : "border-pink-200 bg-pink-50/70"
                        }`}
                      >
                        <div className="mb-1.5 flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-[var(--foreground)]">
                            {item.title}
                          </p>
                          <Badge
                            variant="outline"
                            className={notificationTypeBadgeClass[item.type]}
                          >
                            {notificationTypeLabel[item.type]}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {item.message}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[11px] text-[var(--muted-foreground)]">
                            {formatDateTimeBR(item.date)}
                          </span>
                          {!item.read && (
                            <button
                              type="button"
                              onClick={() =>
                                handleMarkNotificationAsRead(item.id)
                              }
                              className="text-xs font-semibold text-pink-700 hover:text-pink-800"
                            >
                              Marcar como lida
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
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
          <h1 className="mb-2 text-3xl font-semibold text-pink-600">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground">
            Gerencie usuários, doações, campanhas e visualize relatórios do
            sistema
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card className="bg-pink-50 border-pink-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium text-foreground">
                  Pacientes
                </CardTitle>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100">
                  <Users className="h-5 w-5 text-pink-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-pink-600">
                {patientsCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Ativos</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium text-foreground">
                  Voluntárias
                </CardTitle>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100">
                  <UserCheck className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-purple-600">
                {volunteersCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Ativas</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium text-foreground">
                  Doadores
                </CardTitle>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-blue-600">
                {donorsCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Ativos</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium text-foreground">
                  Campanhas
                </CardTitle>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-green-600">
                {campaigns.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {activeCampaigns} ativas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs — agora com 4 opções */}
        <div className="mb-6 grid w-full grid-cols-4 rounded-full bg-pink-100 p-1 shadow-sm">
          <TabButton
            isActive={activeTab === "users"}
            label="Usuários"
            onClick={() => setActiveTab("users")}
          />
          <TabButton
            isActive={activeTab === "donations"}
            label="Doações"
            onClick={() => setActiveTab("donations")}
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
          <Card className="border-pink-100 bg-white">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-pink-600">
                    Gerenciamento de Usuários
                  </CardTitle>
                  <CardDescription>
                    Visualize e gerencie todos os usuários do sistema
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={handleExportUsersCsv}
                    disabled={users.length === 0}
                    className="rounded-full border-pink-300 hover:bg-pink-50"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportUsersPdf}
                    disabled={users.length === 0}
                    className="rounded-full border-pink-300 hover:bg-pink-50"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    PDF
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
                <div className="pretty-scrollbar overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-pink-200 text-slate-800">
                        <th className="px-4 py-3 font-semibold">Nome</th>
                        <th className="px-4 py-3 font-semibold">E-mail</th>
                        <th className="px-4 py-3 font-semibold">CPF</th>
                        <th className="px-4 py-3 font-semibold">Tipo</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">
                          Data Cadastro
                        </th>
                        <th className="px-4 py-3 text-right font-semibold">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="border-t border-pink-100 hover:bg-pink-50"
                        >
                          <td className="px-4 py-3">{user.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {user.email}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {user.cpf}
                          </td>
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
                          <td className="px-4 py-3 text-muted-foreground">
                            {user.date}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => openEditUserModal(user)}
                                aria-label={`Editar ${user.name}`}
                              >
                                <Edit className="h-4 w-4 text-pink-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
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

        {activeTab === "donations" && <AdminDonations />}

        {activeTab === "campaigns" && (
          <Card className="border-pink-100">
            <CardHeader>
              <CardTitle className="text-pink-600">Campanhas</CardTitle>
              <CardDescription>
                {campaigns.length} campanhas cadastradas e {totalDonations}{" "}
                doações registradas.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {activeTab === "reports" && <AdminReports />}
      </main>

      <footer className="mt-auto border-t border-[var(--border)] bg-[var(--background)] pb-4 pt-10">
        <div className="mx-auto w-full max-w-[1200px] px-4">
          <div className="mb-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Heart size={16} className="text-[var(--primary)]" />
                <span className="text-sm font-semibold text-[var(--primary)]">
                  Sobre Nós
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                A Rede Feminina de Combate ao Câncer de Mama de Itapema trabalha
                para apoiar pacientes e promover a conscientização sobre o
                câncer de mama.
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
                      highlight
                        ? "text-[var(--primary)]"
                        : "text-[var(--muted-foreground)]"
                    }`}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-4 text-center text-xs text-[var(--muted-foreground)]">
            © 2025 Cuidado Floral - Rede Feminina de Combate ao Câncer de Mama.
            Todos os direitos reservados.
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
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
        isActive
          ? "border-pink-500 bg-white text-pink-700 shadow"
          : "border-transparent text-slate-600 hover:border-pink-200 hover:bg-white/70 hover:text-slate-800"
      }`}
    >
      {label}
    </button>
  );
}
