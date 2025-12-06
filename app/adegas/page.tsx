// src/app/adegas/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obterUsuarioAtual, limparSessao } from "@/lib/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

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

export default function AdegasPage() {
  const router = useRouter();

  const [adegas, setAdegas] = useState<Adega[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [authChecked, setAuthChecked] = useState(false);
  const [permissaoNegada, setPermissaoNegada] = useState(false);

  const [userName, setUserName] = useState<string>("Usuário");
  const [perfil, setPerfil] = useState<string>("");
  const [adegaNome, setAdegaNome] = useState<string>("");

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

      // Nome do usuário
      const nomeDoUsuario: string =
        usuarioLogado?.nome ??
        usuarioLogado?.email ??
        usuarioLogado?.username ??
        usuarioLogado?.adega_name ??
        "Usuário";

      setUserName(nomeDoUsuario);

      // Nome do perfil
      const perfilBruto: any =
        usuarioLogado?.perfil ?? usuarioLogado?.perfil_nome ?? null;

      let perfilNome = "";
      if (typeof perfilBruto === "string") {
        perfilNome = perfilBruto;
      } else if (perfilBruto && typeof perfilBruto === "object") {
        perfilNome = perfilBruto.nome ?? perfilBruto.descricao ?? "";
      }
      setPerfil(perfilNome);

      // Nome da adega logada (se vier no token)
      const adegaBruta: any =
        usuarioLogado?.adega ?? usuarioLogado?.adega_nome ?? null;

      if (typeof adegaBruta === "string") {
        setAdegaNome(adegaBruta);
      } else if (adegaBruta && typeof adegaBruta === "object") {
        setAdegaNome(adegaBruta.nome ?? "");
      }

      // Verificar se é perfil MASTER
      const isMaster =
        perfilNome &&
        ["master", "superadmin", "dono"].includes(
          perfilNome.toLowerCase()
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
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-100">
        <p className="text-sm text-zinc-400">
          Verificando acesso à Adega...
        </p>
      </div>
    );
  }

  if (permissaoNegada) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-100 px-4">
        <div className="max-w-md rounded-2xl border border-red-600/60 bg-red-900/20 p-6 text-center">
          <h1 className="mb-2 text-lg font-semibold text-red-200">
            Acesso negado
          </h1>
          <p className="mb-4 text-sm text-red-100">
            Você não tem permissão para acessar o cadastro de adegas.
            Somente o perfil <span className="font-semibold">Master</span>{" "}
            pode visualizar esta página.
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
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 md:px-8">
        {/* TOPO */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍷</span>
            <div>
              <h1 className="text-xl font-semibold tracking-wide">
                Gestão de Adegas
              </h1>
              <p className="text-xs text-zinc-400">
                Cadastro de todas as adegas do sistema (somente Master).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                Logado como
              </p>
              <p className="text-sm font-medium text-amber-200">
                {userName}
                {perfil && (
                  <span className="ml-1 text-xs text-amber-300">
                    ({perfil})
                  </span>
                )}
              </p>
              {adegaNome && (
                <p className="text-[11px] text-zinc-500">
                  Adega atual:{" "}
                  <span className="text-amber-200">{adegaNome}</span>
                </p>
              )}
            </div>

          </div>
        </header>

        {/* CONTEÚDO */}
        <main className="flex-1 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-amber-200">
              Lista de Adegas
            </h2>

            {/* Botão para nova adega (também só Master, mas aqui já está filtrado) */}
            <Link href="/adegas/nova" className="btn-primary">
              + Nova Adega
            </Link>

             <Link href="/" className="btn-primary">
              Home
            </Link>

          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-lg shadow-black/40">
            {erro && (
              <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {erro}
              </div>
            )}

            {loading ? (
              <p className="text-sm text-zinc-400">
                Carregando adegas...
              </p>
            ) : adegas.length === 0 ? (
              <p className="text-sm text-zinc-400">
                Nenhuma adega cadastrada ainda.
                Clique em <span className="font-semibold">Nova Adega</span>{" "}
                para cadastrar a primeira.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-400">
                      <th className="px-3 py-2">Nome</th>
                      <th className="px-3 py-2">CNPJ</th>
                      <th className="px-3 py-2">Telefone</th>
                      <th className="px-3 py-2">WhatsApp</th>
                      <th className="px-3 py-2">E-mail</th>
                      <th className="px-3 py-2 text-center">
                        Notificações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {adegas.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-zinc-900/60 last:border-none hover:bg-zinc-900/40"
                      >
                        <td className="px-3 py-2 text-sm font-medium text-zinc-100">
                          {a.nome}
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-300">
                          {a.cnpj}
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-300">
                          {a.telefone}
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-300">
                          {a.whatsapp_numero}
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-300">
                          {a.email}
                        </td>
                        <td className="px-3 py-2 text-center text-xs">
                          {a.notificacao_ativa ? (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[11px] font-medium text-emerald-300">
                              Ativa
                            </span>
                          ) : (
                            <span className="rounded-full bg-zinc-700/40 px-2 py-1 text-[11px] font-medium text-zinc-300">
                              Desativada
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        <footer className="mt-8 border-t border-zinc-800 pt-4 text-center text-xs text-zinc-500">
          Painel de gestão de adegas • Apenas perfil Master
        </footer>
      </div>
    </div>
  );
}
