import type { UserRole } from "../authScreen";
import { apiRequest, setAuthToken, getAuthToken } from "./api";

interface LoginResponse {
  token: string;
  role: UserRole;
  name: string;
}

export interface LoggedUser {
  sub: number;
  role: UserRole;
  name: string;
}

// Nova função para decodificar o token JWT
export function getLoggedUser(): LoggedUser | null {
  const token = getAuthToken();
  if (!token) return null;
  
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as LoggedUser;
  } catch (e) {
    return null;
  }
}

export async function loginWithDemoAccount(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }, {
    omitAuth: true,
    suppressUnauthorizedHandler: true,
  });
  setAuthToken(response.token);
  return response;
}

export function clearSession(): void {
  setAuthToken(null);
}

export async function registerAccount(
  name: string,
  email: string,
  password: string,
  cpf: string,
  role: string
): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, cpf, type: role }),
  }, {
    omitAuth: true,
    suppressUnauthorizedHandler: true,
  });
  
  setAuthToken(response.token);
  return response;
}
