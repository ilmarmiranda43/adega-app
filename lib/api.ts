// lib/api.ts

export type Produto = {
  id: number;
  adega_id: number;
  nome: string;
  catdegoria_id: number;
  preco: number;
  ativo?: boolean;
};

export type ProdutoCreateInput = {
  id?: number;
  adega_id: number | null;
  nome: string;
  categoria_id: number | null;
  preco: number;
  ativo?: boolean;
};

export type Categoria = {
  id: number;
  nome: string;
  descricao?: string | null;
}

export type CategoriaCreateInput = {
  nome: string;
  descricao?: string;
};

export type ProdutoUpdateInput = Partial<ProdutoCreateInput>;
export type CategoriaUpdateInput = Partial<CategoriaCreateInput>;

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://adega-app-api.onrender.com";

export function getAuthToken(): string | null {
  
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("adega_token");

  if (!raw) return null;

  return raw;

  // try {
  //   const sessao = JSON.parse(raw);

  //   return sessao?.token ?? null;
  // } catch {
  //   return null;
  // }
}

// LISTAR
export async function listarProdutos(): Promise<Produto[]> {
  const res = await fetch(`${API_BASE}/produtos/`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error("Erro ao carregar produtos");
  }

  return res.json();
}

// CRIAR
export async function criarProduto(
  dados: ProdutoCreateInput
): Promise<Produto> {
  const res = await fetch(`${API_BASE}/produtos/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });

  if (!res.ok) {
    throw new Error("Erro ao criar produto");
  }

  return res.json();
}

// ATUALIZAR
export async function atualizarProduto(
  id: number,
  dados: ProdutoUpdateInput
): Promise<Produto> {
  const res = await fetch(`${API_BASE}/produtos/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });

  if (!res.ok) {
    throw new Error("Erro ao atualizar produto");
  }

  return res.json();
}

// DELETAR
export async function excluirProduto(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/produtos/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Erro ao excluir produto");
  }
}

// ATIVAR / DESATIVAR
export async function alternarAtivo(
  id: number,
  ativo: boolean
): Promise<Produto> {
  return atualizarProduto(id, { ativo });
}

// Rotas de Categorias daqui pra baixo

export async function listarCategorias(): Promise<Categoria[]> {
  const headers: HeadersInit = {};

  // Só existe window/localStorage no cliente
  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem("token") || localStorage.getItem("adega_token");

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn("listarCategorias: nenhum token encontrado no localStorage");
    }
  }

  const res = await fetch(`${API_BASE}/categorias/`, {
    method: "GET",
    headers,
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const texto = await res.text();
    console.error(
      "listarCategorias falhou:",
      res.status,
      res.statusText,
      texto
    );

    if (res.status === 401 || res.status === 403) {
      throw new Error("Não autorizado ao carregar categorias. Faça login novamente.");
    }

    throw new Error("Erro ao carregar categorias");
  }

  return res.json();
}

export async function criarCategoria(
  dados: CategoriaCreateInput
): Promise<Categoria> {
  const res = await fetch(`${API_BASE}/categorias/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });

  if (!res.ok) {
    throw new Error("Erro ao criar categoria");
  }

  return res.json();
}

export async function atualizarCategoria(
  id: number,
  dados: CategoriaUpdateInput
): Promise<Categoria> {
  const res = await fetch(`${API_BASE}/categorias/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });

  if (!res.ok) {
    throw new Error("Erro ao atualizar categoria");
  }

  return res.json();
}

export async function excluirCategoria(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/categorias/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Erro ao excluir categoria");
  }
}