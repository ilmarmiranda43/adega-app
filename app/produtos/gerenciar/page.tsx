"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { listarProdutos, criarProduto, atualizarProduto, excluirProduto, alternarAtivo, listarCategorias, type Produto, type Categoria } from "@/lib/api";
import AdegaPageShell from "@/components/AdegaPageShell";

type FormState = { idEditando: number | null; adega_id: number | null; nome: string; categoria_id: number | null; preco: string };
const vazio: FormState = { idEditando: null, adega_id: null, nome: "", categoria_id: null, preco: "" };
const moeda = (valor: number | string) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor) || 0);

export default function GerenciarProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState<FormState>(vazio);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [processando, setProcessando] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  async function carregarProdutos() {
    setLoading(true);
    try {
      const resultado = await listarProdutos();
      setProdutos(Array.isArray(resultado) ? resultado : []);
      setErro(null);
    } catch (error) {
      console.error(error);
      setErro("Não foi possível carregar os produtos.");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    void carregarProdutos();
    listarCategorias().then(d => setCategorias(Array.isArray(d) ? d : [])).catch(e => {
      console.error(e); setErro("Não foi possível carregar as categorias.");
    });
  }, []);

  function editar(produto: Produto) {
    setForm({ idEditando: produto.id, adega_id: produto.adega_id, nome: produto.nome, categoria_id: produto.categoria_id, preco: String(produto.preco).replace(".", ",") });
    setSucesso(null);
    document.getElementById("formulario-produto")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null); setSucesso(null);
    const valorDigitado = form.preco.trim();
    const normalizado = valorDigitado.includes(",")
      ? valorDigitado.replace(/\./g, "").replace(",", ".")
      : valorDigitado;
    const preco = Number(normalizado);
    if (!form.nome.trim()) { setErro("Informe o nome do produto."); return; }
    if (!form.categoria_id) { setErro("Selecione uma categoria."); return; }
    if (!form.preco.trim() || !Number.isFinite(preco) || preco < 0) { setErro("Informe um preço válido."); return; }
    setSalvando(true);
    try {
      const payload = { adega_id: form.adega_id, nome: form.nome.trim(), categoria_id: form.categoria_id, preco, ativo: true };
      if (form.idEditando === null) await criarProduto(payload);
      else await atualizarProduto(form.idEditando, payload);
      setSucesso(form.idEditando === null ? "Produto cadastrado." : "Produto atualizado.");
      setForm(vazio);
      await carregarProdutos();
    } catch (error) {
      console.error(error);
      setErro("Não foi possível salvar o produto. Verifique as informações.");
    } finally { setSalvando(false); }
  }

  async function excluir(produto: Produto) {
    if (!window.confirm(`Excluir “${produto.nome}”?`)) return;
    setProcessando(produto.id); setErro(null); setSucesso(null);
    try {
      await excluirProduto(produto.id);
      setSucesso("Produto excluído.");
      if (form.idEditando === produto.id) setForm(vazio);
      await carregarProdutos();
    } catch (error) { console.error(error); setErro("Não foi possível excluir o produto. Verifique se ele possui registros vinculados."); }
    finally { setProcessando(null); }
  }

  async function alternar(produto: Produto) {
    setProcessando(produto.id); setErro(null); setSucesso(null);
    try { await alternarAtivo(produto.id, !produto.ativo); await carregarProdutos(); setSucesso("Status do produto atualizado."); }
    catch (error) { console.error(error); setErro("Não foi possível alterar o status do produto."); }
    finally { setProcessando(null); }
  }

  const filtrados = useMemo(() => produtos.filter(p => p.nome.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR").trim())), [produtos, busca]);
  const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

  return <AdegaPageShell title="Gerenciar produtos" subtitle="Produtos" headerAction={<Link href="/produtos" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Ver catálogo</Link>}>
    <div><h2 className="text-xl font-semibold text-slate-900">Produtos da adega</h2><p className="mt-1 text-sm text-slate-500">Cadastre, edite e organize seus produtos em um só lugar.</p></div>
    {erro && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{erro}</div>}
    {sucesso && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{sucesso}</div>}
    <div className="grid gap-5 lg:grid-cols-5">
      <section id="formulario-produto" className="self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <h3 className="text-lg font-semibold text-slate-900">{form.idEditando === null ? "Novo produto" : "Editar produto"}</h3>
        <p className="mt-1 text-sm text-slate-500">Informe os dados básicos do catálogo.</p>
        <form onSubmit={salvar} className="mt-5 space-y-4">
          <div><label htmlFor="produto-nome" className="mb-1.5 block text-sm font-medium text-slate-700">Nome *</label><input id="produto-nome" required value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} className={inputClass} placeholder="Ex.: Vinho Tinto 750 ml" /></div>
          <div><label htmlFor="produto-categoria" className="mb-1.5 block text-sm font-medium text-slate-700">Categoria *</label>
            <select id="produto-categoria" required value={form.categoria_id ?? ""} onChange={e => setForm(p => ({ ...p, categoria_id: e.target.value === "" ? null : Number(e.target.value) }))} className={inputClass}>
              <option value="">Selecione uma categoria</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select><Link href="/produtos/categorias" className="mt-2 inline-block text-xs font-semibold text-orange-700 hover:underline">Gerenciar categorias →</Link></div>
          <div><label htmlFor="produto-preco" className="mb-1.5 block text-sm font-medium text-slate-700">Preço de venda (R$) *</label><input id="produto-preco" required inputMode="decimal" value={form.preco} onChange={e => setForm(p => ({ ...p, preco: e.target.value }))} placeholder="0,00" className={inputClass} /></div>
          <div className="flex flex-wrap gap-2"><button type="submit" disabled={salvando} className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50">{salvando ? "Salvando..." : form.idEditando === null ? "Cadastrar produto" : "Salvar alterações"}</button>{form.idEditando !== null && <button type="button" onClick={() => setForm(vazio)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancelar</button>}</div>
        </form>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-semibold text-slate-900">Produtos cadastrados</h3><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{loading ? "—" : produtos.length} produtos</span></div>
        <label htmlFor="buscar-gerencia" className="mt-5 block text-sm font-medium text-slate-700">Pesquisar</label><input id="buscar-gerencia" value={busca} onChange={e => setBusca(e.target.value)} type="search" placeholder="Nome do produto..." className={`mt-1.5 ${inputClass}`} />
        <div className="mt-4 divide-y divide-slate-100">
          {loading ? <p role="status" className="py-6 text-sm text-slate-500">Carregando produtos...</p> : filtrados.length === 0 ? <p className="py-6 text-sm text-slate-500">{busca ? "Nenhum produto encontrado." : "Nenhum produto cadastrado."}</p> : filtrados.map(p => <div key={p.id} className="flex flex-col gap-3 py-4">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold text-slate-900">{p.nome}</p><p className="mt-1 text-sm font-medium text-slate-700">{moeda(p.preco)}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.ativo === false ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-800"}`}>{p.ativo === false ? "Inativo" : "Ativo"}</span></div>
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => editar(p)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Editar</button><button type="button" disabled={processando === p.id} onClick={() => void alternar(p)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">{p.ativo === false ? "Ativar" : "Desativar"}</button><button type="button" disabled={processando === p.id} onClick={() => void excluir(p)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">Excluir</button></div>
          </div>)}
        </div>
      </section>
    </div>
  </AdegaPageShell>;
}
