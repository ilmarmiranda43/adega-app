// src/app/adegas/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Adega {
  id: number;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  whatsapp_numero: string;
  textmebot_api_key: string;
  notificacao_ativa: boolean;
  criado_em?: string;
  atualizado_em?: string;
}

import AdegaPageShell from "@/components/AdegaPageShell";

export default function AdegasPage() {
  const router = useRouter();

  const [adegas, setAdegas] = useState<Adega[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [authChecked, setAuthChecked] = useState(false);
  const [permissaoNegada, setPermissaoNegada] = useState(false);

  const [busca, setBusca] = useState("");
  const adegasFiltradas = useMemo(() => adegas.filter((a) =>
    [a.nome, a.cnpj, a.email, a.telefone].some((valor) =>
      String(valor ?? "").toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR").trim())
    )
  ), [adegas, busca]);

  useEffect(() => {
    async function init() {
      const usuarioLogado: any =
        typeof window !== "undefined" ? obterUsuarioAtual() : null;

      if (!usuarioLogado) {
        router.replace("/login");
        return;
      }

      // Nome do perfil
      const perfilBruto: any =
        usuarioLogado?.perfil ?? usuarioLogado?.perfil_nome ?? null;

      let perfilNome = "";
      if (typeof perfilBruto === "string") {
        perfilNome = perfilBruto;
      } else if (perfilBruto && typeof perfilBruto === "object") {
        perfilNome = perfilBruto.nome ?? perfilBruto.descricao ?? "";
      }

      // Verificar se é perfil MASTER
      const isMaster =
        perfilNome &&
        ["master", "superadmin", "dono", "administrador imbebi"].includes(
          perfilNome.trim().toLowerCase()
        );

      if (!isMaster) {
        setPermissaoNegada(true);
        setLoading(false);
        setAuthChecked(true);
        return;
      }

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("adega_token")
          : null;

      if (!token) {
        router.replace("/login");
        return;
      }

      async function carregarAdegas() {
        try {
          setLoading(true);
          setErro(null);

          const resp = await fetch(`${API_BASE}/adegas/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (resp.status === 401 || resp.status === 403) {
            setPermissaoNegada(true);
            return;
          }

          if (!resp.ok) {
            throw new Error("Erro ao carregar adegas.");
          }

          const data = await resp.json();
          setAdegas(data ?? []);
        } catch (error: any) {
          setErro(error.message ?? "Erro ao carregar adegas.");
        } finally {
          setLoading(false);
          setAuthChecked(true);
        }
      }

      await carregarAdegas();
    }

    init();
  }, [router]);

  if (!authChecked && !permissaoNegada && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-slate-900">
        <p className="text-sm text-slate-500">
          Verificando acesso à Adega...
        </p>
      </div>
    );
  }

  if (permissaoNegada) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-slate-900 px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="mb-2 text-lg font-semibold text-red-700">
            Acesso negado
          </h1>
          <p className="mb-4 text-sm text-red-700">
            Você não tem permissão para acessar o cadastro de adegas.
            Somente administradores autorizados da plataforma podem visualizar esta página.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-900 hover:bg-slate-100"
          >
            Voltar para o início
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdegaPageShell title="Gerenciar adegas" subtitle="Administração da plataforma">
      <div className="mx-auto w-full max-w-7xl space-y-6 pb-10 text-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Plataforma</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Gestão de adegas</h1>
            <p className="mt-1 text-sm text-slate-500">Consulte os estabelecimentos cadastrados e acesse seus dados.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Voltar ao painel</Link>
            <Link href="/adegas/nova" className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700">+ Nova adega</Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Adegas cadastradas</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{adegas.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Notificações habilitadas</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{adegas.filter((a) => a.notificacao_ativa).length}</p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div>
              <h2 className="font-semibold text-slate-900">Estabelecimentos</h2>
              <p className="mt-1 text-xs text-slate-500">{adegasFiltradas.length} resultado(s)</p>
            </div>
            <input
              type="search"
              aria-label="Pesquisar adegas"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar nome, CNPJ, e-mail..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:w-80"
            />
          </div>

          {erro && <p role="alert" className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Carregando adegas...</p>
          ) : adegasFiltradas.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-slate-800">Nenhuma adega encontrada.</p>
              <p className="mt-1 text-sm text-slate-500">{busca ? "Tente outro termo de pesquisa." : "Cadastre a primeira adega para começar."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Adega</th>
                    <th className="px-5 py-3 font-semibold">CNPJ</th>
                    <th className="px-5 py-3 font-semibold">Contato</th>
                    <th className="px-5 py-3 font-semibold">WhatsApp</th>
                    <th className="px-5 py-3 font-semibold">Notificações</th>
                    <th className="px-5 py-3 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adegasFiltradas.map((a) => (
                    <tr key={a.id} className="transition hover:bg-orange-50/40">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{a.nome}</p>
                        <p className="text-xs text-slate-400">ID #{a.id}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{a.cnpj || "—"}</td>
                      <td className="px-5 py-4 text-slate-600">
                        <p>{a.email || "—"}</p>
                        {a.telefone && <p className="mt-1 text-xs text-slate-400">{a.telefone}</p>}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{a.whatsapp_numero || "—"}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${a.notificacao_ativa ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {a.notificacao_ativa ? "Ativas" : "Desativadas"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/adegas/${a.id}/editar`} className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700">Editar</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <p className="text-xs text-slate-400">O acesso e as alterações de adegas continuam sujeitos às permissões verificadas pela API.</p>
      </div>
    </AdegaPageShell>
  );
}
