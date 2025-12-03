"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  listarProdutos,
  listarCategorias,
  type Produto,
  type Categoria,
} from "@/lib/api";

import { listarPedidos } from "@/lib/api/pedidos";

import { obterUsuarioAtual, limparSessao } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [authChecked, setAuthChecked] = useState(false);

  const [userName, setUserName] = useState<string>("Usuário");
  const [perfil, setPerfil] = useState<string>("");
  const [adegaNome, setAdegaNome] = useState<string>(""); 

  const handleLogout = () => {
    limparSessao();
    router.replace("/login");
  };

  useEffect(() => {
    async function carregarDashboard() {
      try {
        setLoading(true);

        // Após as mudanças no backend, esses endpoints já devem
        // considerar o adega_id do usuário autenticado
        const [prodData, catData, pedData] = await Promise.all([
          listarProdutos(),
          listarCategorias(),
          listarPedidos(), // backend filtra pela adega do usuário
        ]);

        setProdutos(prodData ?? []);
        setCategorias(catData ?? []);
        setPedidos(pedData ?? []);
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

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

    // Nome do perfil (compatível com vários formatos possíveis)
    const perfilBruto: any =
      usuarioLogado?.perfil ?? usuarioLogado?.perfil_nome ?? null;

    let perfilNome = "";

    if (typeof perfilBruto === "string") {
      perfilNome = perfilBruto;
    } else if (perfilBruto && typeof perfilBruto === "object") {
      perfilNome = perfilBruto.nome ?? perfilBruto.descricao ?? "";
    }

    setPerfil(perfilNome);

    // Nome da adega (se o backend estiver enviando isso no token / sessão)
    const adegaBruta: any =
      usuarioLogado?.adega ?? usuarioLogado?.adega_nome ?? null;

    if (typeof adegaBruta === "string") {
      setAdegaNome(adegaBruta);
    } else if (adegaBruta && typeof adegaBruta === "object") {
      setAdegaNome(adegaBruta.nome ?? "");
    }

    setAuthChecked(true);
    carregarDashboard();
  }, [router]);

  // Contagem de pedidos em aberto (já filtrados por adega no backend)
  const pedidosAbertos = pedidos.filter(
    (p: any) => p.status?.toLowerCase() === "aberto"
  ).length;

  // Regra de acesso: ADMIN / GERENTE
  const isAdminOrGerente =
    perfil &&
    ["administrador", "admin", "gerente"].includes(perfil.toLowerCase());

  // (Opcional) se você tiver outros perfis, pode criar mais flags:
  // const isAtendente = perfil && perfil.toLowerCase() === "atendente";

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-100">
        <p className="text-sm text-zinc-400">
          Verificando acesso à Diego&apos;s Adega...
        </p>
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
                {adegaNome ? `${adegaNome}` : "Adega"}
              </h1>
              <p className="text-xs text-zinc-400">
                Controle de rótulos, estoque e vendas em um só lugar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="rounded-full border border-amber-500/40 bg-amber-900/30 px-4 py-1 text-xs font-medium uppercase tracking-wide text-amber-200">
              Painel da Adega
            </span>

            <div className="flex items-center gap-3">
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
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-red-600/60 bg-red-900/30 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-red-200 transition hover:bg-red-800/40"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex flex-1 flex-col gap-10 md:flex-row md:items-stretch">
          {/* LADO ESQUERDO */}
          <section className="space-y-6 md:w-3/5">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                Organize sua{" "}
                <span className="text-amber-300">adega</span> como um sommelier.
              </h2>

              <p className="max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                Cadastre rótulos, acompanhe o estoque, veja o que está saindo
                mais e tenha o catálogo sempre à mão — no celular, tablet ou
                computador. Perfeito para adegas, bares e pequenos comércios.
              </p>
            </div>

            {/* CARDS DE ATALHO / PAINEL */}
            <div className="space-y-4">
              {/* Atalhos principais */}
              <div className="rounded-3xl border border-amber-500/25 bg-black/40 p-4 shadow-lg shadow-black/40">
                <p className="mb-2 text-[11px] uppercase tracking-wide text-amber-200">
                  Atalhos principais
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Catálogo de produtos: todos podem ver */}
                  <Link href="/produtos" className="btn-primary">
                    Catálogo de Produtos
                  </Link>

                  {/* Gerenciador e Categorias: apenas Admin / Gerente */}
                  {isAdminOrGerente && (
                    <>
                      <Link href="/produtos/gerenciar" className="btn-primary">
                        Gerenciador da Adega
                      </Link>

                      <Link
                        href="/produtos/categorias"
                        className="btn-primary"
                      >
                        Categorias de Produtos
                      </Link>

                      <Link href="/estoque" className="btn-primary">
                        Estoque
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Operações do dia a dia */}
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-lg shadow-black/30">
                <p className="mb-2 text-[11px] uppercase tracking-wide text-zinc-400">
                  Operações do dia a dia
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Clientes e Pedidos: regra de negócio pode ser aberta para mais perfis */}
                  <Link href="/clientes" className="btn-primary">
                    Cadastrar / Listar Clientes
                  </Link>

                  <Link href="/pedidos" className="btn-primary">
                    Pedidos
                  </Link>

                  {/* Usuários: somente Admin / Gerente (combina com as rules do backend) */}
                  {isAdminOrGerente && (
                    <>
                      <Link href="/usuarios/cadastrar" className="btn-primary">
                        Cadastrar usuário
                      </Link>

                      <Link href="/usuarios" className="btn-primary">
                        Listar usuário
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* LADO DIREITO – CARD RESUMO */}
          <aside className="md:w-2/5">
            <div className="h-full rounded-3xl border border-amber-500/20 bg-gradient-to-br from-zinc-900/80 via-zinc-950 to-black p-5 shadow-xl shadow-black/40">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-amber-200">
                Visão geral da adega
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <p className="text-xs text-zinc-400">Produtos</p>
                    <p className="mt-2 text-2xl font-semibold text-amber-300">
                      {loading ? "—" : produtos.filter((p) => p.ativo).length}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Total de rótulos cadastrados.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <p className="text-xs text-zinc-400">Categorias</p>
                    <p className="mt-2 text-2xl font-semibold text-amber-300">
                      {loading ? "—" : categorias.length}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Agrupamentos para organizar o catálogo.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <p className="text-xs text-zinc-400">Pedidos</p>
                    <p className="mt-2 text-2xl font-semibold text-amber-300">
                      {loading ? "—" : pedidosAbertos}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Pedidos aguardando confirmação.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-xs text-zinc-300">
                  <p className="mb-1 text-[11px] uppercase tracking-wide text-zinc-400">
                    Próximos passos
                  </p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Cadastre algumas categorias (ex.: Tintos, Brancos).</li>
                    <li>Inclua seus primeiros rótulos no catálogo.</li>
                    <li>Acesse o gerenciador para atualizar estoque.</li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </main>

        <footer className="mt-8 border-t border-zinc-800 pt-4 text-center text-xs text-zinc-500">
          {adegaNome ? adegaNome : "Diego&apos;s Adega"} • Projeto em
          desenvolvimento •{" "}
          <span className="text-amber-300">frontend Next.js</span>
        </footer>
      </div>
    </div>
  );
}
