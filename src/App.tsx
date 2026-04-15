import { useState } from "react";

import { AuthScreen, type UserRole } from "./authScreen";
import { AdminArea } from "./admin-area";
import { UserArea } from "./user-area/user-area";
import { VolunteerArea } from "./volunteerArea";

export function App() {
  const [loggedRole, setLoggedRole] = useState<UserRole | null>(null);
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
