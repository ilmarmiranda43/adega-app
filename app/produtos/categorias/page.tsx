"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listarCategorias,
  criarCategoria,
  atualizarCategoria,
  excluirCategoria,
  Categoria,
} from "@/lib/api";

type FormState = {
  idEditando: number | null;
  nome: string;
  descricao: string;
};

const formStateDefault: FormState = {
  idEditando: null,
  nome: "",
  descricao: "",
};

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<FormState>(formStateDefault);
  const { userName, perfilNome, adegaNome, user } = useAuth();

  async function carregarCategorias() {
    try {
      setLoading(true);
      const data = await listarCategorias();
      setCategorias(data);
      setErro(null);
    } catch (e) {
      console.error(e);
      setErro("Erro ao carregar categorias.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarCategorias();
  }, []);

  function handleChange(
    campo: keyof FormState,
    valor: string | number | null
  ) {
    setForm((prev) => ({
      ...prev,
      [campo]: (valor ?? "") as string,
    }));
  }

  function iniciarEdicao(c: Categoria) {
    setForm({
      idEditando: c.id,
      nome: c.nome,
      descricao: c.descricao ?? "",
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
      const payload = {
        nome: form.nome,
        descricao: form.descricao || undefined,
      };

      if (form.idEditando === null) {
        await criarCategoria(payload);
      } else {
        await atualizarCategoria(form.idEditando, payload);
      }

      await carregarCategorias();
      limparFormulario();
    } catch (e) {
      console.error(e);
      setErro("Erro ao salvar categoria.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(id: number) {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    try {
      await excluirCategoria(id);
      await carregarCategorias();
    } catch (e) {
      console.error(e);
      setErro("Erro ao excluir categoria.");
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
              {/* <h1 className="text-xl font-semibold tracking-wide">
                {adegaNome || "Minha Adega"} - Categorias
              </h1> */}
              <header className="mb-4">
                <h1 className="text-xl font-semibold">
                  {adegaNome || "Minha Adega"} - Categorias
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
            <Link
              href="/produtos/gerenciar"
              className="rounded-full border border-zinc-600 bg-zinc-900/40 px-4 py-1.5 font-medium text-zinc-100 transition hover:bg-zinc-800/70"
            >
              Gerenciar produtos
            </Link>
          </nav>
        </header>

        <main className="flex flex-1 flex-col gap-6 lg:flex-row">
          {/* FORMULÁRIO */}
          <section className="lg:w-1/3">
            <div className="rounded-2xl border border-amber-900/60 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
              <h2 className="mb-3 text-lg font-semibold">
                {form.idEditando ? "Editar categoria" : "Nova categoria"}
              </h2>

              {erro && (
                <p className="mb-2 text-sm text-red-400">
                  {erro}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 text-sm">
                <div>
                  <label className="mb-1 block text-xs text-zinc-300">
                    Nome da categoria
                  </label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => handleChange("nome", e.target.value)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-50 outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-zinc-300">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={form.descricao}
                    onChange={(e) =>
                      handleChange("descricao", e.target.value)
                    }
                    rows={3}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-50 outline-none focus:border-amber-500"
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
                  Categorias cadastradas
                </h2>
                <span className="text-xs text-zinc-400">
                  Total:{" "}
                  <span className="font-semibold text-amber-200">
                    {loading ? "—" : categorias.length}
                  </span>
                </span>
              </div>

              {loading ? (
                <p className="text-sm text-zinc-300">
                  Carregando categorias...
                </p>
              ) : categorias.length === 0 ? (
                <p className="text-sm text-zinc-300">
                  Nenhuma categoria cadastrada ainda.
                </p>
              ) : (
                <div className="space-y-2 text-xs sm:text-sm">
                  {categorias.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500">
                            #{c.id}
                          </span>
                          <span className="font-semibold">
                            {c.nome}
                          </span>
                        </div>
                        {c.descricao && (
                          <p className="text-[11px] text-zinc-400">
                            {c.descricao}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(c)}
                          className="rounded-full border border-zinc-600 px-3 py-1 text-[11px] font-semibold text-zinc-100 transition hover:bg-zinc-800/80"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExcluir(c.id)}
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
