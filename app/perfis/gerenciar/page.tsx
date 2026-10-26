"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { obterUsuarioAtual } from "@/lib/auth";

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

import AdegaPageShell from "@/components/AdegaPageShell";

export default function GerenciarPerfisPage() {
  const [adegas, setAdegas] = useState<Adega[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const perfisFiltrados =
    form.adega_id === ""
      ? []
      : perfis.filter((p) => p.adega_id === Number(form.adega_id));

  const { userName } = useAuth();
  const router = useRouter();

  // 🔒 Só MASTER pode acessar
  const usuarioLogado: any =
    typeof window !== "undefined" ? obterUsuarioAtual() : null;

  const perfilBruto: any =
    usuarioLogado?.perfil ?? usuarioLogado?.perfil_nome ?? null;

  let perfilNome = "";

  if (typeof perfilBruto === "string") {
    perfilNome = perfilBruto;
  } else if (perfilBruto && typeof perfilBruto === "object") {
    perfilNome = perfilBruto.nome ?? perfilBruto.descricao ?? "";
  }


  if (
    !["master", "administrador imbebi"].includes(
      perfilNome.trim().toLowerCase()
    )
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-slate-900">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-center">
          <h1 className="mb-2 text-lg font-semibold">
            Acesso restrito
          </h1>
          <p className="text-sm text-slate-700">
            Apenas administradores da plataforma podem gerenciar perfis.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-full bg-orange-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-black hover:bg-orange-700"
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
    <AdegaPageShell title="Gerenciar perfis" subtitle="Painel de gestão">
    <div className="w-full text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-1 py-2 sm:px-3">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Gerenciar Perfis por Adega
            </h1>
            <p className="text-sm text-slate-500">
              Olá, {userName}. Cadastre perfis e defina permissões por adega.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            ← Home
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-start gap-6 lg:flex-row">
          {/* FORM */}
          <section className="w-full lg:w-2/5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                {form.idEditando ? "Editar perfil" : "Novo perfil"}
              </h2>

              {erro && (
                <p className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erro}</p>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 text-sm">
                <div>
                  <label className="mb-1 block text-xs text-slate-700">
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
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
                  <label className="mb-1 block text-xs text-slate-700">
                    Nome do perfil
                  </label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) =>
                      handleChangeField("nome", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-700">
                    Descrição
                  </label>
                  <textarea
                    value={form.descricao}
                    onChange={(e) =>
                      handleChangeField("descricao", e.target.value)
                    }
                    className="h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* permissões */}
                <fieldset className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <legend className="px-1 text-xs text-slate-500">
                    Permissões
                  </legend>

                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.eh_admin}
                      onChange={(e) =>
                        handleChangeField("eh_admin", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 accent-orange-600"
                    />
                    É administrador da adega
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.pode_gerenciar_usuarios}
                      onChange={(e) =>
                        handleChangeField(
                          "pode_gerenciar_usuarios",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 accent-orange-600"
                    />
                    Pode gerenciar usuários
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.pode_gerenciar_estoque}
                      onChange={(e) =>
                        handleChangeField(
                          "pode_gerenciar_estoque",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 accent-orange-600"
                    />
                    Pode gerenciar estoque
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.pode_gerenciar_clientes}
                      onChange={(e) =>
                        handleChangeField(
                          "pode_gerenciar_clientes",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 accent-orange-600"
                    />
                    Pode gerenciar clientes
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.ativo}
                      onChange={(e) =>
                        handleChangeField("ativo", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 accent-orange-600"
                    />
                    Ativo
                  </label>
                </fieldset>

                <div className="mt-3 flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </section>

          {/* LISTA */}
          <section className="w-full lg:w-3/5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Perfis da adega selecionada
                </h2>
                <span className="text-xs text-slate-500">
                  Total:{" "}
                  <span className="font-semibold text-orange-700">
                    {loading ? "—" : perfisFiltrados.length}
                  </span>
                </span>
              </div>

              {form.adega_id === "" ? (
                <p className="text-sm text-slate-700">
                  Selecione uma adega para visualizar os perfis.
                </p>
              ) : loading ? (
                <p className="text-sm text-slate-700">
                  Carregando perfis...
                </p>
              ) : perfisFiltrados.length === 0 ? (
                <p className="text-sm text-slate-700">
                  Nenhum perfil cadastrado para esta adega.
                </p>
              ) : (
                <div className="space-y-2 text-xs sm:text-sm">
                  {perfisFiltrados.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-orange-200 hover:bg-orange-50/30 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            #{p.id}
                          </span>
                          <span className="font-semibold">{p.nome}</span>
                          {!p.ativo && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                              Inativo
                            </span>
                          )}
                          {p.eh_admin && (
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
                              Admin
                            </span>
                          )}
                        </div>
                        {p.descricao && (
                          <p className="text-[11px] text-slate-700">
                            {p.descricao}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(p)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExcluir(p.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
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
    </AdegaPageShell>
  );
}
