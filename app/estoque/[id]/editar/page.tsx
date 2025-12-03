// app/estoque/[id]/editar/page.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { API_BASE, getAuthToken } from "@/lib/api";

type Produto = {
  id: number;
  nome: string;
};

type ItemEstoque = {
  id: number;
  produto_id: number;
  quantidade: number;
  local?: string;
  observacoes?: string;
  data_entrada: string;
  data_validade?: string;
};

export default function EditarEstoquePage() {
  const router = useRouter();
  const pathname = usePathname();

  // /estoque/5/editar -> ["", "estoque", "5", "editar"]
  const pathParts = pathname.split("/");
  const idFromPath = pathParts[2]; // índice 2 é o "5"
  const estoqueId = Number(idFromPath);

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [item, setItem] = useState<ItemEstoque | null>(null);

  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [local, setLocal] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [dataEntrada, setDataEntrada] = useState("");
  const [dataValidade, setDataValidade] = useState("");

  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const { userName, perfilNome, adegaNome, user } = useAuth();

  // Carrega dados do item + lista de produtos
  useEffect(() => {
    // proteção extra: se estoqueId for NaN, já mostra erro e não chama backend
    if (!Number.isFinite(estoqueId)) {
      setErro("ID de estoque inválido na URL.");
      setLoading(false);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    async function carregarDados() {
      try {
        setLoading(true);
        setErro(null);

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [respItem, respProdutos] = await Promise.all([
          fetch(`${API_BASE}/estoque/${estoqueId}`, { headers }),
          fetch(`${API_BASE}/produtos/`, { headers }),
        ]);

        if (respItem.status === 401 || respProdutos.status === 401) {
          router.push("/login");
          return;
        }

        if (respItem.status === 403 || respProdutos.status === 403) {
          setErro("Você não tem permissão para editar o estoque.");
          return;
        }

        if (!respItem.ok) {
          throw new Error("Erro ao carregar dados do estoque.");
        }

        if (!respProdutos.ok) {
          throw new Error("Erro ao carregar lista de produtos.");
        }

        const dadosItem: ItemEstoque = await respItem.json();
        const dadosProdutos: Produto[] = await respProdutos.json();

        setItem(dadosItem);
        setProdutos(dadosProdutos);

        setProdutoId(String(dadosItem.produto_id));
        setQuantidade(String(dadosItem.quantidade));
        setLocal(dadosItem.local ?? "");
        setObservacoes(dadosItem.observacoes ?? "");
        setDataEntrada(
          dadosItem.data_entrada ? dadosItem.data_entrada.slice(0, 10) : ""
        );
        setDataValidade(
          dadosItem.data_validade ? dadosItem.data_validade.slice(0, 10) : ""
        );
      } catch (error: any) {
        setErro(error.message ?? "Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [router, estoqueId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    if (!Number.isFinite(estoqueId)) {
      setErro("ID de estoque inválido.");
      return;
    }

    const quantidadeNumber = Number(quantidade);

    if (isNaN(quantidadeNumber)) {
      setErro("Quantidade deve ser um número válido.");
      return;
    }

    try {
      setSalvando(true);

      const resp = await fetch(`${API_BASE}/estoque/${estoqueId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantidade: quantidadeNumber,
          local: local || null,
          data_validade: dataValidade || null,
          observacoes: observacoes || null,
        }),
      });

      if (resp.status === 401 || resp.status === 403) {
        setErro("Você não tem permissão para editar este item de estoque.");
        if (resp.status === 401) {
          router.push("/login");
        }
        return;
      }

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.detail ?? "Erro ao salvar alterações.");
      }

      router.push("/estoque");
    } catch (error: any) {
      setErro(error.message ?? "Erro ao salvar alterações.");
    } finally {
      setSalvando(false);
    }
  }

  function obterNomeProduto(id: number): string {
    const p = produtos.find((prod) => prod.id === id);
    return p ? p.nome : `ID ${id}`;
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-xl px-4 py-6">
        <p className="text-zinc-200">Carregando dados do estoque...</p>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="mx-auto max-w-xl px-4 py-6">
        <p className="text-red-400">
          Não foi possível carregar a entrada de estoque.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      {/* <h1 className="text-2xl font-bold text-amber-300">
        {adegaNome || "Minha Adega"} - Editar entrada de estoque
      </h1> */}
      <header className="mb-4">
        <h1 className="text-xl font-semibold">
          {adegaNome || "Minha Adega"} - Editar entrada de estoque
        </h1>
        <p className="text-sm text-zinc-500">
          Olá, {userName} ({perfilNome})
        </p>
      </header>
      <p className="mb-6 text-sm text-zinc-400">
        Ajuste as informações da entrada selecionada.
      </p>

      <div className="mb-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/estoque")}
          className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-200 hover:bg-zinc-900/60 transition"
        >
          ← Voltar
        </button>
      </div>

      {erro && (
        <div className="mb-4 rounded-xl border border-red-700 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {erro}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6"
      >
        <div>
          <label className="mb-1 block text-sm text-zinc-300">
            Produto
          </label>
          <select
            value={produtoId}
            disabled
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-400 outline-none"
          >
            <option value={produtoId}>
              {obterNomeProduto(item.produto_id)} (ID: {item.produto_id})
            </option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-300">
            Quantidade *
          </label>
          <input
            type="number"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            required
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-300">
            Localização
          </label>
          <input
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-300">
            Observações
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              Data de entrada
            </label>
            <input
              type="date"
              value={dataEntrada}
              readOnly
              disabled
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-400 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              Data de validade
            </label>
            <input
              type="date"
              value={dataValidade}
              onChange={(e) => setDataValidade(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push("/estoque")}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900/60"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={salvando}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </main>
  );
}
