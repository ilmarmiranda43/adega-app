"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listarProdutos, type Produto } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AdegaPageShell from "@/components/AdegaPageShell";

const money = (value: number | string) => new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL",
}).format(Number(value) || 0);

export default function ProdutosPage() {
  const { perfilNome } = useAuth();
  const isManager = ["admin", "administrador", "gerente", "master"].includes((perfilNome ?? "").toLowerCase());
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setLoading(true);
    setErro(null);
    try {
      const resultado = await listarProdutos();
      setProdutos(Array.isArray(resultado) ? resultado : []);
    } catch (error) {
      console.error(error);
      setErro("Não foi possível carregar o catálogo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void carregar(); }, []);

  const ativos = useMemo(() => produtos.filter(p => p.ativo !== false), [produtos]);
  const filtrados = useMemo(() => ativos.filter(p => p.nome.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR").trim())), [ativos, busca]);

  return (
    <AdegaPageShell title="Catálogo de produtos" subtitle="Produtos"
      headerAction={isManager ? <Link href="/produtos/gerenciar" className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">Gerenciar produtos</Link> : undefined}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-semibold text-slate-900">Seus produtos</h2><p className="mt-1 text-sm text-slate-500">Consulte os itens disponíveis no catálogo.</p></div>
        <span className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-800">{loading ? "—" : ativos.length} produtos ativos</span>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <label htmlFor="buscar-produto" className="mb-2 block text-sm font-medium text-slate-700">Pesquisar produto</label>
        <input id="buscar-produto" type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Digite o nome do produto..."
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
      </section>
      {erro && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{erro} <button type="button" onClick={() => void carregar()} className="ml-2 font-semibold underline">Tentar novamente</button></div>}
      {loading ? <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Carregando produtos...</div>
        : !erro && filtrados.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="text-3xl">📦</div>
            <h3 className="mt-3 font-semibold text-slate-800">{busca ? "Nenhum produto encontrado" : "Seu catálogo está vazio"}</h3>
            <p className="mt-1 text-sm text-slate-500">{busca ? "Experimente outro termo." : "Cadastre seu primeiro produto para começar."}</p>
            {isManager && !busca && <Link href="/produtos/gerenciar" className="mt-4 inline-block rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white">Cadastrar produto</Link>}
          </div>
        ) : !erro && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtrados.map(produto => <article key={produto.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div><span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-xl" aria-hidden="true">🍷</span>
                <h3 className="text-base font-semibold text-slate-900">{produto.nome}</h3></div>
              <div className="mt-6 flex items-center justify-between gap-2 border-t border-slate-100 pt-4"><span className="text-lg font-bold text-slate-900">{money(produto.preco)}</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">Ativo</span></div>
            </article>)}
          </div>
        )}
    </AdegaPageShell>
  );
}
