// lib/auth.ts

// Colocado um comentário para testar a subida no GitHub

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  adega_id: number;
  // perfil: "admin" | "gerente" | "usuario" | "cliente" | string;
  perfil?: string | { nome?: string; descricao?: string };
  username?: string;
  perfil_nome?: string;

  adega?: { id?: number; nome?: string } | string;
  adega_nome?: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user: Usuario;
};

// Base da API: usa variável de ambiente em produção e localhost em dev
const API_BASE =  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// ATENÇÃO:
// Certifique-se de que o backend espera exatamente estes campos no JSON.
// Se o FastAPI estiver esperando `username` e `password`, troque aqui.
export async function login(
  email: string,
  senha: string
): Promise<LoginResponse> {
  console.log("API_BASE login:", API_BASE);

  const resp = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Se o backend espera `username` e `password`, faça:
      // username: email,
      // password: senha,
      email,
      senha,
    }),
  });

  // Se der 4xx ou 5xx, lança erro com detalhes
  if (!resp.ok) {
    const texto = await resp.text();
    console.error(
      "Erro no login:",
      resp.status,
      resp.statusText,
      texto
    );
    throw new Error(
      `Falha no login. Status: ${resp.status} - ${resp.statusText}`
    );
  }

  // Aqui assumo que o backend retorna: { access_token, token_type, user: {...} }
  const data = (await resp.json()) as LoginResponse;
  return data;
}

export function salvarSessao(loginResponse: LoginResponse) {
  if (typeof window === "undefined") return;

  // Guarda token e usuário no localStorage
  localStorage.setItem("adega_token", loginResponse.access_token);
  localStorage.setItem("adega_user", JSON.stringify(loginResponse.user));
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
