import type { UserRole } from "../authScreen";
import { apiRequest, setAuthToken } from "./api";

interface LoginResponse {
  token: string;
  role: UserRole;
  name: string;
}

export async function loginWithDemoAccount(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(response.token);
  return response;
}

export function clearSession(): void {
  setAuthToken(null);
}
