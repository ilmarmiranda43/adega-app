"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { obterUsuarioAtual, limparSessao } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

interface Adega {
  id: number;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  whatsapp_numero: string;
  textmebot_api_key: string;
  notificacao_ativa: boolean;
}

export default function EditarAdegaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const adegaId = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [permissaoNegada, setPermissaoNegada] = useState(false);

  const [form, setForm] = useState<Adega>({
    id: adegaId,
    nome: "",
    cnpj: "",
    telefone: "",
    email: "",
    whatsapp_numero: "",
    textmebot_api_key: "",
    notificacao_ativa: false,
  });

  const handleLogout = () => {
    limparSessao();
    router.replace("/login");
  };

  useEffect(() => {
    async function init() {
      const usuarioLogado: any =
        typeof window !== "undefined" ? obterUsuarioAtual() : null;

      if (!usuarioLogado) {
        router.replace("/login");
        return;
      }

      const perfilBruto: any = usuarioLogado?.perfil ?? usuarioLogado?.perfil_nome ?? null;

      let perfilNome = "";
      if (typeof perfilBruto === "string") perfilNome = perfilBruto;
      else if (perfilBruto && typeof perfilBruto === "object") perfilNome = perfilBruto.nome ?? "";

      const isMaster =
        perfilNome &&
        ["master", "superadmin", "dono"].includes(perfilNome.toLowerCase());

      if (!isMaster) {
        setPermissaoNegada(true);
        setLoading(false);
        return;
      }

      const token =
        typeof window !== "undefined" ? localStorage.getItem("adega_token") : null;

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);
        setErro(null);

        if (!Number.isFinite(adegaId) || adegaId <= 0) {
          throw new Error("ID da adega inválido.");
        }

        const resp = await fetch(`${API_BASE}/adegas/${adegaId}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (resp.status === 401 || resp.status === 403) {
          setPermissaoNegada(true);
          return;
        }

        if (!resp.ok) {
          const t = await resp.text();
          throw new Error(`Erro ao carregar adega: ${t}`);
        }

        const data = (await resp.json()) as Adega;
        setForm(data);
      } catch (e: any) {
        setErro(e?.message ?? "Erro ao carregar adega.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router, adegaId]);

  async function salvar() {
    const token = localStorage.getItem("adega_token");
    if (!token) return router.replace("/login");

    setSalvando(true);
    setErro(null);
    setOkMsg(null);

    try {
      const resp = await fetch(`${API_BASE}/adegas/${adegaId}`, {
        method: "PUT", // se seu backend usar PATCH, trocamos aqui
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: form.nome,
          cnpj: form.cnpj,
          telefone: form.telefone,
          email: form.email,
          whatsapp_numero: form.whatsapp_numero,
          textmebot_api_key: form.textmebot_api_key,
          notificacao_ativa: form.notificacao_ativa,
        }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`Erro ao salvar: ${t}`);
      }

      setOkMsg("Adega atualizada com sucesso!");
    } catch (e: any) {
      setErro(e?.message ?? "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (permissaoNegada) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-100 px-4">
        <div className="max-w-md rounded-2xl border border-red-600/60 bg-red-900/20 p-6 text-center">
          <h1 className="mb-2 text-lg font-semibold text-red-200">Acesso negado</h1>
          <p className="mb-4 text-sm text-red-100">
            Somente o perfil <span className="font-semibold">Master</span> pode editar adegas.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium uppercase tracking-wide text-zinc-100 hover:bg-zinc-800"
          >
            Voltar para o início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-zinc-950 to-black text-zinc-50">
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-wide">Editar Adega</h1>
            <p className="text-xs text-zinc-400">ID: {adegaId}</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/adegas")}
              className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-800"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-800"
            >
              Sair
            </button>
          </div>
        </header>

        <main className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-lg shadow-black/40">
          {loading ? (
            <p className="text-sm text-zinc-400">Carregando...</p>
          ) : (
            <>
              {erro && (
                <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {erro}
                </div>
              )}
              {okMsg && (
                <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                  {okMsg}
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs text-zinc-400">Nome</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400">CNPJ</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm"
                    value={form.cnpj}
                    onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400">Telefone</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400">WhatsApp</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm"
                    value={form.whatsapp_numero}
                    onChange={(e) =>
                      setForm({ ...form, whatsapp_numero: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-zinc-400">E-mail</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-zinc-400">TextMeBot API Key</label>
                  
                  <input
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm"
                    value={form.textmebot_api_key ?? ""}
                    onChange={(e) =>
                        setForm((prev) => ({ ...prev, textmebot_api_key: e.target.value }))
                    }
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-2 pt-2">
                  <input
                    id="notif"
                    type="checkbox"
                    checked={!!form.notificacao_ativa}
                    onChange={(e) =>
                      setForm({ ...form, notificacao_ativa: e.target.checked })
                    }
                  />
                  <label htmlFor="notif" className="text-sm text-zinc-300">
                    Notificação ativa
                  </label>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/adegas")}
                  className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-800"
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={salvar}
                  className="rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300 disabled:opacity-60"
                  disabled={salvando}
                >
                  {salvando ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
