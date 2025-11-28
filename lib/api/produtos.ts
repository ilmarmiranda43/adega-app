const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
import { obterToken } from "@/lib/auth";

export type Produto = {
  id: number;
  nome: string;   // ajuste para "descricao" se seu backend usar esse nome
  preco: number;
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

export async function listarProdutos(): Promise<Produto[]> {
  const res = await authFetch(`${API_BASE_URL}/produtos/`);
  return res.json();
}
