"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  listarAdegas,
  listarPerfis,
  criarPerfil,
  atualizarPerfil,
  excluirPerfil,
  Adega,
  Perfil,
} from "@/lib/api";

type FormState = {
  idEditando: number | null;
  adega_id: number | "";
  nome: string;
  descricao: string;
  eh_admin: boolean;
  pode_gerenciar_usuarios: boolean;
  pode_gerenciar_estoque: boolean;
  pode_gerenciar_clientes: boolean;
  ativo: boolean;
};

const defaultForm: FormState = {
  idEditando: null,
  adega_id: "",
  nome: "",
  descricao: "",
  eh_admin: false,
  pode_gerenciar_usuarios: false,
  pode_gerenciar_estoque: false,
  pode_gerenciar_clientes: false,
  ativo: true,
};

export default function GerenciarPerfisPage() {
  const [adegas, setAdegas] = useState<Adega[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const { user, userName } = useAuth();
  const router = useRouter();

  // 🔒 Só MASTER pode acessar
  if (user && user.papel !== "master") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-100">
        <div className="rounded-2xl border border-red-700 bg-red-950/40 px-6 py-4 text-center">
          <h1 className="mb-2 text-lg font-semibold">
            Acesso restrito
          </h1>
          <p className="text-sm text-zinc-300">
            Apenas o usuário <span className="font-semibold">master</span> pode gerenciar perfis.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-black hover:bg-amber-400"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  async function carregarAdegas() {
    try {
      const data = await listarAdegas();
      setAdegas(data);
      // deixa a primeira adega já selecionada
      if (data.length > 0 && form.adega_id === "") {
        setForm((prev) => ({ ...prev, adega_id: data[0].id }));
        await carregarPerfis(data[0].id);
      }
    } catch (e) {
      console.error(e);
      setErro("Erro ao carregar adegas.");
    }
  }

  async function carregarPerfis(adegaId: number) {
    try {
      setLoading(true);
      const data = await listarPerfis(adegaId);
      setPerfis(data);
      setErro(null);
    } catch (e) {
      console.error(e);
      setErro("Erro ao carregar perfis.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarAdegas();
  }, []);

  function handleChangeField<K extends keyof FormState>(
    campo: K,
    valor: FormState[K]
  ) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function iniciarEdicao(perfil: Perfil) {
    setForm({
      idEditando: perfil.id,
      adega_id: perfil.adega_id,
      nome: perfil.nome,
      descricao: perfil.descricao || "",
      eh_admin: perfil.eh_admin,
      pode_gerenciar_usuarios: perfil.pode_gerenciar_usuarios,
      pode_gerenciar_estoque: perfil.pode_gerenciar_estoque,
      pode_gerenciar_clientes: perfil.pode_gerenciar_clientes,
      ativo: perfil.ativo,
    });
  }

  function limparFormulario() {
    setForm((prev) => ({
      ...defaultForm,
      adega_id: prev.adega_id, // mantém adega selecionada
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (form.adega_id === "") {
      setErro("Selecione uma adega.");
      return;
    }

    const payload = {
      adega_id: Number(form.adega_id),
      nome: form.nome,
      descricao: form.descricao || null,
      eh_admin: form.eh_admin,
      pode_gerenciar_usuarios: form.pode_gerenciar_usuarios,
      pode_gerenciar_estoque: form.pode_gerenciar_estoque,
      pode_gerenciar_clientes: form.pode_gerenciar_clientes,
      ativo: form.ativo,
    };

    try {
      setSaving(true);
      if (form.idEditando === null) {
        await criarPerfil(payload);
      } else {
        await atualizarPerfil(form.idEditando, payload);
      }
      await carregarPerfis(Number(form.adega_id));
      limparFormulario();
    } catch (e) {
      console.error(e);
      setErro("Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function handleExcluir(id: number) {
    if (!confirm("Tem certeza que deseja excluir este perfil?")) return;
    try {
      await excluirPerfil(id);
      if (form.adega_id !== "") {
        await carregarPerfis(Number(form.adega_id));
      }
    } catch (e) {
      console.error(e);
      setErro("Erro ao excluir perfil.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-zinc-950 to-black text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 md:px-8">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              Gerenciar Perfis por Adega
            </h1>
            <p className="text-sm text-zinc-400">
              Olá, {userName} (master)
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-amber-500/40 bg-amber-900/20 px-4 py-1.5 text-xs font-medium text-amber-100 transition hover:bg-amber-800/50"
          >
            ← Home
          </Link>
        </header>

        <main className="flex flex-1 flex-col gap-6 lg:flex-row">
          {/* FORM */}
          <section className="lg:w-1/3">
            <div className="rounded-2xl border border-amber-900/60 bg-zinc-900/70 p-4 shadow-lg shadow-black/40">
              <h2 className="mb-3 text-lg font-semibold">
                {form.idEditando ? "Editar perfil" : "Novo perfil"}
              </h2>

              {erro && (
                <p className="mb-2 text-sm text-red-400">{erro}</p>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 text-sm">
                <div>
                  <label className="mb-1 block text-xs text-zinc-300">
                    Adega
                  </label>
                  <select
                    value={form.adega_id}
                    onChange={async (e) => {
                      const id = e.target.value === "" ? "" : Number(e.target.value);
                      handleChangeField("adega_id", id as any);
                      if (id !== "") {
                        await carregarPerfis(Number(id));
                      } else {
                        setPerfis([]);
                      }
                    }}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-50 outline-none focus:border-amber-500"
                  >
                    <option value="">Selecione uma adega</option>
                    {adegas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-zinc-300">
                    Nome do perfil
                  </label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) =>
                      handleChangeField("nome", e.target.value)
                    }
                    className="w-full rounded-md border border-zinc-700 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-50 outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-zinc-300">
                    Descrição
                  </label>
                  <textarea
                    value={form.descricao}
                    onChange={(e) =>
                      handleChangeField("descricao", e.target.value)
                    }
                    className="h-20 w-full rounded-md border border-zinc-700 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-50 outline-none focus:border-amber-500"
                  />
                </div>

                {/* permissões */}
                <fieldset className="space-y-1 rounded-md border border-zinc-700/70 px-3 py-2">
                  <legend className="px-1 text-xs text-zinc-400">
                    Permissões
                  </legend>

                  <label className="flex items-center gap-2 text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={form.eh_admin}
                      onChange={(e) =>
                        handleChangeField("eh_admin", e.target.checked)
                      }
                      className="h-3 w-3 rounded border-zinc-600 bg-zinc-900"
                    />
                    É administrador da adega
                  </label>

                  <label className="flex items-center gap-2 text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={form.pode_gerenciar_usuarios}
                      onChange={(e) =>
                        handleChangeField(
                          "pode_gerenciar_usuarios",
                          e.target.checked
                        )
                      }
                      className="h-3 w-3 rounded border-zinc-600 bg-zinc-900"
                    />
                    Pode gerenciar usuários
                  </label>

                  <label className="flex items-center gap-2 text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={form.pode_gerenciar_estoque}
                      onChange={(e) =>
                        handleChangeField(
                          "pode_gerenciar_estoque",
                          e.target.checked
                        )
                      }
                      className="h-3 w-3 rounded border-zinc-600 bg-zinc-900"
                    />
                    Pode gerenciar estoque
                  </label>

                  <label className="flex items-center gap-2 text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={form.pode_gerenciar_clientes}
                      onChange={(e) =>
                        handleChangeField(
                          "pode_gerenciar_clientes",
                          e.target.checked
                        )
                      }
                      className="h-3 w-3 rounded border-zinc-600 bg-zinc-900"
                    />
                    Pode gerenciar clientes
                  </label>

                  <label className="flex items-center gap-2 text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={form.ativo}
                      onChange={(e) =>
                        handleChangeField("ativo", e.target.checked)
                      }
                      className="h-3 w-3 rounded border-zinc-600 bg-zinc-900"
                    />
                    Ativo
                  </label>
                </fieldset>

                <div className="mt-3 flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? "Salvando..."
                      : form.idEditando
                      ? "Salvar alterações"
                      : "Cadastrar perfil"}
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
                  Perfis da adega selecionada
                </h2>
                <span className="text-xs text-zinc-400">
                  Total:{" "}
                  <span className="font-semibold text-amber-200">
                    {loading ? "—" : perfis.length}
                  </span>
                </span>
              </div>

              {form.adega_id === "" ? (
                <p className="text-sm text-zinc-300">
                  Selecione uma adega para visualizar os perfis.
                </p>
              ) : loading ? (
                <p className="text-sm text-zinc-300">
                  Carregando perfis...
                </p>
              ) : perfis.length === 0 ? (
                <p className="text-sm text-zinc-300">
                  Nenhum perfil cadastrado para esta adega.
                </p>
              ) : (
                <div className="space-y-2 text-xs sm:text-sm">
                  {perfis.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500">
                            #{p.id}
                          </span>
                          <span className="font-semibold">{p.nome}</span>
                          {!p.ativo && (
                            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-300">
                              Inativo
                            </span>
                          )}
                          {p.eh_admin && (
                            <span className="rounded-full bg-amber-700/70 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-50">
                              Admin
                            </span>
                          )}
                        </div>
                        {p.descricao && (
                          <p className="text-[11px] text-zinc-300">
                            {p.descricao}
                          </p>
                        )}
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
