"use client";

import { useAuth } from "@/context/AuthContext";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listarProdutos,
  criarProduto,
  atualizarProduto,
  excluirProduto,
  alternarAtivo,
  listarCategorias,   // 👈 novo
  Produto,
  Categoria,          // 👈 novo
} from "@/lib/api";

type FormState = {
  idEditando: number | null;
  adega_id: number | null;
  nome: string;
  categoria_id: number | null;
  preco: string;
  ativo?: boolean;
};

const formStateDefault: FormState = {
  idEditando: null,
  adega_id: null,
  nome: "",
  categoria_id: null,
  preco: "",
};

export default function GerenciarProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]); // 👈 novo
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<FormState>(formStateDefault);
  const { userName, perfilNome, adegaNome, user } = useAuth();

  async function carregarProdutos() {
    try {
      setLoading(true);
      const data = await listarProdutos();
      setProdutos(data);
      setErro(null);
    } catch (e) {
      console.error(e);
      setErro("Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  }

  // 👇 novo: carregar categorias
  async function carregarCategorias() {
    try {
      const data = await listarCategorias();
      setCategorias(data);
    } catch (e) {
      console.error("Erro ao carregar categorias:", e);
    }
  }

  useEffect(() => {
    carregarProdutos();
    carregarCategorias(); // 👈 chama junto
  }, []);

  function handleChange(
    campo: keyof FormState,
    valor: string | number | null
  ) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor ?? "",
    }));
  }

  function iniciarEdicao(p: Produto) {
    setForm({
      idEditando: p.id,
      adega_id: p.adega_id,
      nome: p.nome,
      categoria_id: p.categoria_id,
      preco: p.preco.toString().replace(".", ","),
    });
  }

  function limparFormulario() {
    setForm(formStateDefault);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);

    try {
      const precoNumber = parseFloat(
        form.preco.replace(".", "").replace(",", ".")
      );

      if (isNaN(precoNumber)) {
        setErro("Preço de venda inválido.");
        setSalvando(false);
        return;
      }

      if (form.categoria_id === null) {
        setErro("Selecione uma categoria.");
        setSalvando(false);
        return;
      }

      const payload = {
        adega_id: form.adega_id,
        nome: form.nome,
        categoria_id: form.categoria_id,
        preco: precoNumber,
        ativo: true,
      };

      if (form.idEditando === null) {
        await criarProduto(payload);
      } else {
        await atualizarProduto(form.idEditando, payload);
      }

      await carregarProdutos();
      limparFormulario();
    } catch (e) {
      console.error(e);
      setErro("Erro ao salvar produto.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(id: number) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      await excluirProduto(id);
      await carregarProdutos();
    } catch (e) {
      console.error(e);
      setErro("Erro ao excluir produto.");
    }
  }

  async function handleToggleAtivo(p: Produto) {
    try {
      await alternarAtivo(p.id, !p.ativo);
      await carregarProdutos();
    } catch (e) {
      console.error(e);
      setErro("Erro ao alterar status do produto.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-zinc-950 to-black text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 md:px-8">
        {/* HEADER */}
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍷</span>
            <div>
              <header className="mb-4">
                <h1 className="text-xl font-semibold">
                  {adegaNome || "Minha Adega"} - Produtos
                </h1>
                <p className="text-sm text-zinc-500">
                  Olá, {userName} ({perfilNome})
                </p>
              </header>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2 text-xs sm:text-sm">
            <Link
              href="/"
              className="rounded-full border border-amber-500/40 bg-amber-900/20 px-4 py-1.5 font-medium text-amber-100 transition hover:bg-amber-800/50 hover:text-amber-50"
            >
              ← Home
            </Link>
            <Link
              href="/produtos"
              className="rounded-full border border-zinc-600 bg-zinc-900/40 px-4 py-1.5 font-medium text-zinc-100 transition hover:bg-zinc-800/70"
            >
              Ver catálogo
            </Link>
          </nav>
        </header>

        <main className="flex flex-1 flex-col gap-6 lg:flex-row">
          {/* FORMULÁRIO */}
          <section className="lg:w-1/3">
            <div className="rounded-2xl border border-amber-900/60 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
              <h2 className="mb-3 text-lg font-semibold">
                {form.idEditando ? "Editar produto" : "Novo produto"}
              </h2>

              {erro && (
                <p className="mb-2 text-sm text-red-400">
                  {erro}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 text-sm">
                
                {/* 👇 novo campo: categoria */}
                <div>
                  <label className="mb-1 block text-xs text-zinc-300">
                    Categoria
                  </label>
                  <select
                    value={form.categoria_id ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleChange(
                        "categoria_id",
                        value === "" ? null : Number(value)
                      );
                    }}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-50 outline-none focus:border-amber-500"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs text-zinc-300">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) =>
                      handleChange("nome", e.target.value)
                    }
                    className="w-full rounded-md border border-zinc-700 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-50 outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-zinc-300">
                    Preço de venda (R$)
                  </label>
                  <input
                    type="text"
                    value={form.preco}
                    onChange={(e) =>
                      handleChange("preco", e.target.value)
                    }
                    placeholder="R$ 0,00"
                    className="w-full rounded-md border border-zinc-700 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-50 outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="submit"
                    disabled={salvando}
                    className="flex-1 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {salvando
                      ? "Salvando..."
                      : form.idEditando
                      ? "Salvar alterações"
                      : "Cadastrar"}
                  </button>
                  {form.idEditando && (
                    <button
                      type="button"
                      onClick={limparFormulario}
                      className="rounded-full border border-zinc-600 px-3 py-2 text-xs font-semibold text-zinc-100 transition hover:bg-zinc-800/70"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </section>

          {/* LISTA */}
          <section className="lg:w-2/3">
            <div className="rounded-2xl border border-amber-900/60 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Produtos cadastrados
                </h2>
                <span className="text-xs text-zinc-400">
                  Total:{" "}
                  <span className="font-semibold text-amber-200">
                    {loading ? "—" : produtos.length}
                  </span>
                </span>
              </div>

              {loading ? (
                <p className="text-sm text-zinc-300">
                  Carregando produtos...
                </p>
              ) : produtos.length === 0 ? (
                <p className="text-sm text-zinc-300">
                  Nenhum produto cadastrado ainda.
                </p>
              ) : (
                <div className="space-y-2 text-xs sm:text-sm">
                  {produtos.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500">
                            #{p.id}
                          </span>
                          <span className="font-semibold">
                            {p.nome}
                          </span>
                          {!p.ativo && (
                            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-300">
                              Inativo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-emerald-300">
                          R$ {p.preco}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(p)}
                          className="rounded-full border border-zinc-600 px-3 py-1 text-[11px] font-semibold text-zinc-100 transition hover:bg-zinc-800/80"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAtivo(p)}
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                            p.ativo
                              ? "border border-amber-500/60 text-amber-100 hover:bg-amber-900/50"
                              : "border border-emerald-500/60 text-emerald-100 hover:bg-emerald-900/40"
                          }`}
                        >
                          {p.ativo ? "Desativar" : "Ativar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExcluir(p.id)}
                          className="rounded-full border border-red-600/70 px-3 py-1 text-[11px] font-semibold text-red-200 transition hover:bg-red-900/50"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
