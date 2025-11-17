// lib/api.ts

export type Produto = {
  id: number;
  nome: string;
  tipo_bebida: string;
  marca?: string;
  volume_ml?: number;
  teor_alcoolico?: number;
  preco_custo?: number;
  preco_venda: number;
  foto_url?: string;
  ativo?: boolean;
};

export type ProdutoCreateInput = {
  nome: string;
  tipo_bebida: string;
  preco_venda: number;
  marca?: string;
  volume_ml?: number;
  teor_alcoolico?: number;
  preco_custo?: number;
  foto_url?: string;
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

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://adega-app-api.onrender.com";

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
  const res = await fetch(`${API_BASE}/categorias/`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const texto = await res.text();
    console.error(
      "listarCategorias falhou:",
      res.status,
      res.statusText,
      texto);
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