const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
import { obterToken } from "@/lib/auth";

export type Cliente = {
  id: number;
  nome: string;
  // outros campos que você tiver...
};

async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = obterToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("Content-Type", "application/json");

  const res = await fetch(input, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro API (${res.status}): ${text}`);
  }
  return res;
}

export async function listarClientes(): Promise<Cliente[]> {
  const res = await authFetch(`${API_BASE_URL}/clientes/`);
  return res.json();
}
