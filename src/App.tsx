import { useEffect, useState } from "react";

import { AuthScreen, type UserRole } from "./authScreen";
import { AdminArea } from "./admin-area";
import { UserArea } from "./user-area/user-area";
import { VolunteerArea } from "./volunteerArea";
import { getAuthToken, onUnauthorized } from "./domain/api";
import { clearSession } from "./domain/auth";

const SESSION_STORAGE_KEY = "cf:session-role";
const VALID_ROLES: UserRole[] = ["admin", "voluntaria", "paciente", "doador"];

function loadSessionRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  // Só considera logado se tiver token também — evita estado inconsistente.
  if (!getAuthToken()) return null;
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (raw && (VALID_ROLES as string[]).includes(raw)) {
    return raw as UserRole;
  }
  return null;
}

export function App() {
  const [loggedRole, setLoggedRole] = useState<UserRole | null>(() =>
    loadSessionRole(),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (loggedRole) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, loggedRole);
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      clearSession();
    }
  }, [loggedRole]);

  // Se uma requisição volta 401 (token expirado / inválido), forçamos logout.
  useEffect(() => {
    onUnauthorized(() => setLoggedRole(null));
    return () => onUnauthorized(null);
  }, []);

  const handleLogout = () => setLoggedRole(null);

  if (loggedRole === "admin") {
    return <AdminArea onLogout={handleLogout} />;
  }

  if (loggedRole === "voluntaria") {
    return <VolunteerArea onLogout={handleLogout} />;
  }

  if (loggedRole === "paciente" || loggedRole === "doador") {
    return <UserArea role={loggedRole} onLogout={handleLogout} />;
  }

  return <AuthScreen onLoginSuccess={setLoggedRole} />;
}
