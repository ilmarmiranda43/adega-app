// app/estoque/cadastrar/page.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, getAuthToken } from "@/lib/api";

type Produto = {
  id: number;
  nome: string;
};

import AdegaPageShell from "@/components/AdegaPageShell";

export default function CadastrarEstoquePage() {
  const router = useRouter();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [minimo_alerta, setMinimo] = useState("");
  const [observacao, setObservacao] = useState("");

  const [criado_em, setDataEntrada] = useState("");
  const [dataValidade, setDataValidade] = useState("");

  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const { userName, perfilNome, adegaNome, user } = useAuth();
  const adegaCodigo = user?.adega_id;

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
          adega_id: adegaCodigo,
          produto_id: produtoIdNumber,
          quantidade: quantidadeNumber,
          minimo_alerta: minimo_alerta || 0,
          criado_em: criado_em || null,
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
    <AdegaPageShell title="Nova entrada de estoque" subtitle="Painel de gestão">
    <main className="mx-auto max-w-xl px-4 py-6">
      {/* <h1 className="text-2xl font-bold text-orange-700">
        {adegaNome || "Minha Adega"} - Nova entrada de estoque
      </h1> */}
      <header className="mb-4">
        <h1 className="text-xl font-semibold">
          {adegaNome || "Minha Adega"} - Nova entrada de estoque
        </h1>
        <p className="text-sm text-slate-500">
          Olá, {userName} ({perfilNome})
        </p>
      </header>
      <p className="mb-6 text-sm text-slate-500">
        Preencha os dados da nova entrada de estoque.
      </p>

      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={() => router.push("/estoque")}
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 hover:bg-slate-50 transition"
        >
          ← Voltar
        </button>
      </div>

      {erro && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
      >
        {/* SELECT DE PRODUTOS */}
        <div>
          <label className="mb-1 block text-sm text-slate-700">
            Produto *
          </label>
          <select
            value={produtoId}
            onChange={(e) => setProdutoId(e.target.value)}
            required
            disabled={loadingProdutos}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:opacity-60"
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
          <label className="mb-1 block text-sm text-slate-700">
            Quantidade *
          </label>
          <input
            type="number"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-700">
            Mínimo Alerta
          </label>
          <input
            value={minimo_alerta}
            onChange={(e) => setMinimo(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-slate-700">
              Data de entrada
            </label>
            <input
              type="date"
              value={criado_em}
              onChange={(e) => setDataEntrada(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push("/estoque")}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Salvar entrada"}
          </button>
        </div>
      </form>
    </main>
    </AdegaPageShell>
  );
}
