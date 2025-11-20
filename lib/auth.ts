// lib/auth.ts

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  perfil: "admin" | "gerente" | "usuario" | "cliente" | string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user: Usuario;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export async function login(
  email: string,
  senha: string
): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, senha }),
  });

  if (!res.ok) {
    throw new Error("E-mail ou senha inválidos");
  }

  return res.json();
}

export function salvarSessao(login: LoginResponse) {
  if (typeof window === "undefined") return;
  localStorage.setItem("adega_token", login.access_token);
  localStorage.setItem("adega_user", JSON.stringify(login.user));
}

export function limparSessao() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("adega_token");
  localStorage.removeItem("adega_user");
}

export function obterUsuarioAtual(): Usuario | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem("adega_user");
  if (!data) return null;
  try {
    return JSON.parse(data) as Usuario;
  } catch {
    return null;
  }
}

export function obterToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("adega_token");
}
