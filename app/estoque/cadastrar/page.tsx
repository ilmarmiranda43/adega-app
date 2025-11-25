// app/estoque/cadastrar/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, getAuthToken } from "@/lib/api";

type Produto = {
  id: number;
  nome: string;
};

export default function CadastrarEstoquePage() {
  const router = useRouter();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [local, setLocalizacao] = useState("");
  const [observacao, setObservacao] = useState("");

  const [dataEntrada, setDataEntrada] = useState("");
  const [dataValidade, setDataValidade] = useState("");

  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProdutos, setLoadingProdutos] = useState(true);

  // Carregar produtos cadastrados + setar data de hoje
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    async function carregarProdutos() {
      try {
        setLoadingProdutos(true);
        const resp = await fetch(`${API_BASE}/produtos/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (resp.status === 401 || resp.status === 403) {
          setErro("Você não tem permissão para carregar os produtos.");
          if (resp.status === 401) {
            router.push("/login");
          }
          return;
        }

        if (!resp.ok) {
          throw new Error("Erro ao carregar produtos.");
        }

        const data = await resp.json();
        setProdutos(data);
      } catch (error: any) {
        setErro(error.message ?? "Erro ao carregar produtos.");
      } finally {
        setLoadingProdutos(false);
      }
    }

    // Data de hoje em formato YYYY-MM-DD
    const hoje = new Date().toISOString().slice(0, 10);
    setDataEntrada(hoje);

    carregarProdutos();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    if (!produtoId) {
      setErro("Selecione um produto.");
      return;
    }

    const produtoIdNumber = Number(produtoId);
    const quantidadeNumber = Number(quantidade);

    if (isNaN(produtoIdNumber) || isNaN(quantidadeNumber)) {
      setErro("Produto e quantidade devem ser válidos.");
      return;
    }

    try {
      setLoading(true);

      const resp = await fetch(`${API_BASE}/estoque/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          produto_id: produtoIdNumber,
          quantidade: quantidadeNumber,
          local: local || null,
          observacoes: observacao || null,
          data_entrada: dataEntrada || null,
          data_validade: dataValidade || null,
        }),
      });

      if (resp.status === 401 || resp.status === 403) {
        setErro("Você não tem permissão para cadastrar entradas de estoque.");
        if (resp.status === 401) {
          router.push("/login");
        }
        return;
      }

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.detail ?? "Erro ao cadastrar entrada de estoque.");
      }

      router.push("/estoque");
    } catch (error: any) {
      setErro(error.message ?? "Erro ao cadastrar entrada de estoque.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-semibold text-zinc-100">
        Nova entrada de estoque
      </h1>
      <p className="mb-6 text-sm text-zinc-400">
        Preencha os dados da nova entrada de estoque.
      </p>

      <div className="mb-6 flex justify-end">
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
        {/* SELECT DE PRODUTOS */}
        <div>
          <label className="mb-1 block text-sm text-zinc-300">
            Produto *
          </label>
          <select
            value={produtoId}
            onChange={(e) => setProdutoId(e.target.value)}
            required
            disabled={loadingProdutos}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400 disabled:opacity-60"
          >
            <option value="">
              {loadingProdutos ? "Carregando produtos..." : "Selecione um produto"}
            </option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} (ID: {p.id})
              </option>
            ))}
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
            Local
          </label>
          <input
            value={local}
            onChange={(e) => setLocalizacao(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-300">Observação</label>
          <input
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
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
              onChange={(e) => setDataEntrada(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400"
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
            disabled={loading}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Salvar entrada"}
          </button>
        </div>
      </form>
    </main>
  );
}
