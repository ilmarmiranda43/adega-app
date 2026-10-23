"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { listarCategorias, criarCategoria, atualizarCategoria, excluirCategoria, type Categoria } from "@/lib/api";
import AdegaPageShell from "@/components/AdegaPageShell";

type FormState = { idEditando: number | null; nome: string; descricao: string };
const vazio: FormState = { idEditando: null, nome: "", descricao: "" };

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState<FormState>(vazio);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  async function carregar() {
    setLoading(true);
    try {
      const dados = await listarCategorias();
      setCategorias(Array.isArray(dados) ? dados : []);
      setErro(null);
    } catch (error) {
      console.error(error);
      setErro("Não foi possível carregar as categorias.");
    } finally { setLoading(false); }
  }
  useEffect(() => { void carregar(); }, []);

  function editar(c: Categoria) {
    setForm({ idEditando: c.id, nome: c.nome, descricao: c.descricao ?? "" });
    setSucesso(null);
    document.getElementById("formulario-categoria")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.nome.trim()) { setErro("Informe o nome da categoria."); return; }
    setSalvando(true); setErro(null); setSucesso(null);
    try {
      const payload = { nome: form.nome.trim(), descricao: form.descricao.trim() || undefined };
      if (form.idEditando === null) await criarCategoria(payload);
      else await atualizarCategoria(form.idEditando, payload);
      setSucesso(form.idEditando === null ? "Categoria cadastrada." : "Categoria atualizada.");
      setForm(vazio);
      await carregar();
    } catch (error) {
      console.error(error);
      setErro("Não foi possível salvar a categoria. Verifique os dados e tente novamente.");
    } finally { setSalvando(false); }
  }

  async function excluir(c: Categoria) {
    if (!window.confirm(`Excluir a categoria “${c.nome}”?`)) return;
    setExcluindo(c.id); setErro(null); setSucesso(null);
    try {
      await excluirCategoria(c.id);
      setSucesso("Categoria excluída.");
      if (form.idEditando === c.id) setForm(vazio);
      await carregar();
    } catch (error) {
      console.error(error);
      setErro("Não foi possível excluir esta categoria. Confira se ela possui produtos vinculados.");
    } finally { setExcluindo(null); }
  }

  const filtradas = useMemo(() => categorias.filter(c => c.nome.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR").trim())), [categorias, busca]);

  return <AdegaPageShell title="Categorias" subtitle="Produtos" headerAction={<Link href="/produtos" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Ver catálogo</Link>}>
    <div><h2 className="text-xl font-semibold text-slate-900">Organize seu catálogo</h2><p className="mt-1 text-sm text-slate-500">Crie e atualize as categorias dos produtos.</p></div>
    {erro && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{erro}</div>}
    {sucesso && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{sucesso}</div>}
    <div className="grid gap-5 lg:grid-cols-5">
      <section id="formulario-categoria" className="self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <h3 className="text-lg font-semibold text-slate-900">{form.idEditando === null ? "Nova categoria" : "Editar categoria"}</h3>
        <p className="mt-1 text-sm text-slate-500">Preencha os dados abaixo.</p>
        <form onSubmit={salvar} className="mt-5 space-y-4">
          <div><label htmlFor="categoria-nome" className="mb-1.5 block text-sm font-medium text-slate-700">Nome *</label>
            <input id="categoria-nome" required maxLength={120} value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex.: Vinhos tintos" className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /></div>
          <div><label htmlFor="categoria-descricao" className="mb-1.5 block text-sm font-medium text-slate-700">Descrição (opcional)</label>
            <textarea id="categoria-descricao" rows={4} value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Descreva a categoria..." className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /></div>
          <div className="flex flex-wrap gap-2"><button type="submit" disabled={salvando} className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50">{salvando ? "Salvando..." : form.idEditando === null ? "Cadastrar categoria" : "Salvar alterações"}</button>
            {form.idEditando !== null && <button type="button" onClick={() => setForm(vazio)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>}</div>
        </form>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-semibold text-slate-900">Categorias cadastradas</h3><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{loading ? "—" : categorias.length} no total</span></div>
        <label htmlFor="buscar-categoria" className="mt-5 block text-sm font-medium text-slate-700">Pesquisar</label>
        <input id="buscar-categoria" type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar pelo nome..." className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
        <div className="mt-4 divide-y divide-slate-100">
          {loading ? <p role="status" className="py-6 text-sm text-slate-500">Carregando categorias...</p> : filtradas.length === 0 ? <p className="py-6 text-sm text-slate-500">{busca ? "Nenhuma categoria encontrada." : "Nenhuma categoria cadastrada."}</p> : filtradas.map(c =>
            <div key={c.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><p className="font-semibold text-slate-900">{c.nome}</p><p className="mt-0.5 text-sm text-slate-500">{c.descricao || "Sem descrição"}</p></div>
              <div className="flex shrink-0 gap-2"><button type="button" onClick={() => editar(c)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Editar</button><button type="button" onClick={() => void excluir(c)} disabled={excluindo === c.id} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">{excluindo === c.id ? "Excluindo..." : "Excluir"}</button></div>
            </div>)}
        </div>
      </section>
    </div>
  </AdegaPageShell>;
}
