// lib/api.ts
import { obterUsuarioAtual } from "./auth";

export type Produto = {
  id: number;
  adega_id: number;
  nome: string;
  // corrigindo typo aqui:
  categoria_id: number;
  preco: number;
  ativo?: boolean;
};

export type ProdutoCreateInput = {
  id?: number;
  // no backend multi-tenant você pode ignorar isso e usar o adega_id do usuário
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
};

export type CategoriaCreateInput = {
  adega_id?: number | null;
  nome: string;
  descricao?: string;
};

export type Adega = {
  id: number;
  nome: string;
};

export type Perfil = {
  id: number;
  adega_id: number;
  nome: string;
  descricao: string | null;
  eh_admin: boolean;
  pode_gerenciar_usuarios: boolean;
  pode_gerenciar_estoque: boolean;
  pode_gerenciar_clientes: boolean;
  ativo: boolean;
};

export type ProdutoUpdateInput = Partial<ProdutoCreateInput>;
export type CategoriaUpdateInput = Partial<CategoriaCreateInput>;
export type PerfilCreateInput = Omit<Perfil, "id">;

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://adega-app-api.onrender.com";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("adega_token");
  if (!raw) return null;
  return raw;
}

// helperzinho pra não repetir código nos headers
function getAuthHeaders(extra: HeadersInit = {}): HeadersInit {
  const token = getAuthToken();

  const base: HeadersInit = {
    "Content-Type": "application/json",
    ...extra,
  };

  if (token) {
    return {
      ...base,
      Authorization: `Bearer ${token}`,
    };
  }

  return base;
}

/* =========================
   PRODUTOS
   ========================= */

// LISTAR
export async function listarProdutos(): Promise<Produto[]> {
  const res = await fetch(`${API_BASE}/produtos/`, {
    method: "GET",
    headers: getAuthHeaders(), // já inclui token se existir
  });

  if (!res.ok) {
    const texto = await res.text();
    console.error(
      "Falha ao listar produtos. Status:",
      res.status,
      "Body:",
      texto
    );
    throw new Error("Erro ao carregar produtos");
  }

  return res.json();
}

// CRIAR
export async function criarProduto(
  dados: ProdutoCreateInput
): Promise<Produto> {
  const usuario =
    typeof window !== "undefined" ? obterUsuarioAtual() : null;

  const payload: ProdutoCreateInput = {
    ...dados,
    // força usar a adega do usuário logado
    adega_id: usuario?.adega_id ?? dados.adega_id ?? null,
    // garante que vai número se vier como string
    categoria_id:
      dados.categoria_id !== null && dados.categoria_id !== undefined
        ? Number(dados.categoria_id)
        : dados.categoria_id,
    preco: Number(dados.preco),
  };

  const res = await fetch(`${API_BASE}/produtos/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const texto = await res.text();
    console.error("Erro ao criar produto:", res.status, texto);
    if (res.status === 401 || res.status === 403) {
      throw new Error("Você não tem permissão para criar produtos.");
    }
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
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  });

  if (!res.ok) {
    const texto = await res.text();
    console.error("Erro ao atualizar produto:", res.status, texto);
    if (res.status === 401 || res.status === 403) {
      throw new Error("Você não tem permissão para atualizar produtos.");
    }
    throw new Error("Erro ao atualizar produto");
  }

  return res.json();
}

// DELETAR
export async function excluirProduto(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/produtos/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const texto = await res.text();
    console.error("Erro ao excluir produto:", res.status, texto);
    if (res.status === 401 || res.status === 403) {
      throw new Error("Você não tem permissão para excluir produtos.");
    }
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

/* =========================
   CATEGORIAS
   ========================= */

export async function listarCategorias(): Promise<Categoria[]> {
  const res = await fetch(`${API_BASE}/categorias/`, {
    method: "GET",
    headers: getAuthHeaders({}), // mantém token
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
      throw new Error(
        "Não autorizado ao carregar categorias. Faça login novamente."
      );
    }

    throw new Error("Erro ao carregar categorias");
  }

  return res.json();
}

export async function criarCategoria(
  dados: CategoriaCreateInput
): Promise<Categoria> {
  const usuario =
    typeof window !== "undefined" ? obterUsuarioAtual() : null;

  // Garante que o adega_id vá no corpo da requisição
  const payload: CategoriaCreateInput = {
    ...dados,
    adega_id: usuario?.adega_id ?? dados.adega_id ?? undefined,
  };

  const res = await fetch(`${API_BASE}/categorias/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const texto = await res.text();
    console.error("Erro ao criar categoria:", res.status, texto);
    if (res.status === 401 || res.status === 403) {
      throw new Error("Você não tem permissão para criar categorias.");
    }
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
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  });

  if (!res.ok) {
    const texto = await res.text();
    console.error("Erro ao atualizar categoria:", res.status, texto);
    if (res.status === 401 || res.status === 403) {
      throw new Error("Você não tem permissão para atualizar categorias.");
    }
    throw new Error("Erro ao atualizar categoria");
  }

  return res.json();
}

export async function excluirCategoria(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/categorias/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const texto = await res.text();
    console.error("Erro ao excluir categoria:", res.status, texto);
    if (res.status === 401 || res.status === 403) {
      throw new Error("Você não tem permissão para excluir categorias.");
    }
    throw new Error("Erro ao excluir categoria");
  }
}

/* =========================
   POST genérico com auth
   ========================= */

export async function postComAuth<T>(
  path: string,
  body: unknown
): Promise<T> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Nenhum token encontrado. Faça login novamente.");
  }

  const resp = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (resp.status === 401 || resp.status === 403) {
    throw new Error("Você não tem permissão para executar esta ação.");
  }

  if (!resp.ok) {
    const text = await resp.text();
    let detail = text;
    try {
      const json = JSON.parse(text);
      detail = (json as any).detail || JSON.stringify(json);
    } catch {
      // mantém o texto original
    }
    throw new Error(`Erro ao salvar: ${detail}`);
  }

  return resp.json();
}

/* =========================
   ADEGAS
   ========================= */
export async function listarAdegas(): Promise<Adega[]> {
  const res = await fetch(`${API_BASE}/adegas/`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Erro ao listar adegas");
  }
  return res.json();
}


/* =========================
   PERFIS
   ========================= */

export async function listarPerfis(adegaId?: number): Promise<Perfil[]> {
  const params = adegaId ? `?adega_id=${adegaId}` : "";
  const res = await fetch(`${API_BASE}/perfis/${params}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Erro ao listar perfis");
  }
  return res.json();
}

export async function criarPerfil(dados: PerfilCreateInput): Promise<Perfil> {
  const res = await fetch(`${API_BASE}/perfis/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  });

  if (!res.ok) {
    const texto = await res.text();
    console.error("Erro ao criar perfil:", res.status, texto);
    throw new Error("Erro ao criar perfil");
  }

  return res.json();
}

export async function atualizarPerfil(
  id: number,
  dados: Partial<PerfilCreateInput>
): Promise<Perfil> {
  const res = await fetch(`${API_BASE}/perfis/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  });

  if (!res.ok) {
    const texto = await res.text();
    console.error("Erro ao atualizar perfil:", res.status, texto);
    throw new Error("Erro ao atualizar perfil");
  }

  return res.json();
}

export async function excluirPerfil(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/perfis/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const texto = await res.text();
    console.error("Erro ao excluir perfil:", res.status, texto);
    throw new Error("Erro ao excluir perfil");
  }
}