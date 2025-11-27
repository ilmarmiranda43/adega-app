// frontend/adega-app/lib/api/pedidos.ts

import { obterToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type ItemPedidoCreate = {
  produto_id: number;
  quantidade: number;
};

export type ItemPedidoRead = {
  id: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: string;
  subtotal: string;
};

export type PedidoCreate = {
  cliente_id: number;
  observacoes?: string;
  itens: ItemPedidoCreate[];
};

export type PedidoRead = {
  id: number;
  cliente_id: number;
  data_criacao: string;
  status: string;
  observacoes?: string | null;
  total: string;
  itens: ItemPedidoRead[];
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

export async function listarPedidos(): Promise<PedidoRead[]> {
  const res = await authFetch(`${API_BASE_URL}/pedidos/`);
  return res.json();
}

export async function criarPedido(data: PedidoCreate): Promise<PedidoRead> {
  const res = await authFetch(`${API_BASE_URL}/pedidos/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function atualizarStatusPedido(
  id: number,
  novoStatus: string
): Promise<PedidoRead> {
  const params = new URLSearchParams({ novo_status: novoStatus });
  const res = await authFetch(`${API_BASE_URL}/pedidos/${id}/status?${params.toString()}`, {
    method: "PUT",
  });
  return res.json();
}

export async function obterPedido(id: number): Promise<PedidoRead> {
  const res = await authFetch(`${API_BASE_URL}/pedidos/${id}`);
  return res.json();
}
