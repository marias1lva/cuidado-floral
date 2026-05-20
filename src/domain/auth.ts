import type { UserRole } from "../authScreen";
import { apiRequest } from "./api";

interface LoginResponse {
  role: UserRole;
}

export function loginWithDemoAccount(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
