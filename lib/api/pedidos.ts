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
  total_liquido: string;
};

export type PedidoCreate = {
  cliente_id: number;
  observacoes?: string;
  itens: ItemPedidoCreate[];
};

export type PedidoRead = {
  id: number;
  cliente_id: number;
  criado_em: string;
  status: string;
  observacoes?: string | null;
  valor_liquido: string;
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

export async function listarPedidos(
  status_pedido?: string,
  cliente_id?: number
): Promise<PedidoRead[]> {
  const params = new URLSearchParams();
  if (status_pedido) params.set("status_pedido", status_pedido);
  if (cliente_id) params.set("cliente_id", String(cliente_id));

  const queryString = params.toString();
  const url = queryString
    ? `${API_BASE_URL}/pedidos/?${queryString}`
    : `${API_BASE_URL}/pedidos/`;

  const res = await authFetch(url);
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
