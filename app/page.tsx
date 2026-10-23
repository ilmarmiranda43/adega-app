"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout, { type MenuSection } from "@/components/AppLayout";
import { listarProdutos, listarCategorias, type Produto, type Categoria } from "@/lib/api";
import { listarPedidos } from "@/lib/api/pedidos";
import { obterUsuarioAtual, limparSessao } from "@/lib/auth";

type PedidoResumo = { status?: string | null };
const isStaging = (process.env.NEXT_PUBLIC_API_URL ?? "").includes("adega-app-api-teste");

function Metric({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [userName, setUserName] = useState("Usuário");
  const [perfil, setPerfil] = useState("");
  const [adegaNome, setAdegaNome] = useState("");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);

  useEffect(() => {
    const usuario = obterUsuarioAtual();
    if (!usuario) {
      router.replace("/login");
      return;
    }
    const u = usuario as {
      nome?: string; email?: string; username?: string;
      perfil?: string | { nome?: string; descricao?: string };
      perfil_nome?: string;
      adega?: string | { nome?: string };
      adega_nome?: string; adega_name?: string;
    };
    setUserName(u.nome ?? u.email ?? u.username ?? "Usuário");
    const p = u.perfil ?? u.perfil_nome;
    setPerfil(typeof p === "string" ? p : (p?.nome ?? p?.descricao ?? ""));
    const a = u.adega ?? u.adega_nome ?? u.adega_name;
    setAdegaNome(typeof a === "string" ? a : (a?.nome ?? ""));
    setReady(true);

    async function carregar() {
      try {
        setLoading(true);
        setError(false);
        const [p, c, ped] = await Promise.all([listarProdutos(), listarCategorias(), listarPedidos()]);
        setProdutos(Array.isArray(p) ? p : []);
        setCategorias(Array.isArray(c) ? c : []);
        setPedidos(Array.isArray(ped) ? ped : []);
      } catch (e) {
        console.error("Erro ao carregar o painel:", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    void carregar();
  }, [router]);

  function sair() {
    limparSessao();
    router.replace("/login");
  }

  const role = perfil.toLowerCase();
  const isManager = ["administrador", "admin", "gerente", "master"].includes(role);
  // Controle visual apenas. Autorização efetiva permanece obrigatória no backend.
  const isMaster = ["master", "superadmin"].includes(role);
  const sections: MenuSection[] = [
    { title: "Principal", items: [
      { label: "Início", href: "/", icon: "⌂" },
      { label: "Produtos", href: "/produtos", icon: "▣" },
      { label: "Clientes", href: "/clientes", icon: "♧" },
      { label: "Pedidos", href: "/pedidos", icon: "▤" },
    ] },
  ];
  if (isManager) sections.push({ title: "Gerenciamento", items: [
    { label: "Gerenciar produtos", href: "/produtos/gerenciar", icon: "▦" },
    { label: "Categorias", href: "/produtos/categorias", icon: "◫" },
    { label: "Estoque", href: "/estoque", icon: "◈" },
    { label: "Usuários", href: "/usuarios", icon: "♙" },
    { label: "Cadastrar usuário", href: "/usuarios/cadastrar", icon: "+" },
    ...(!isStaging ? [{ label: "Débitos", href: "/debitos", icon: "▤" }] : []),
  ] });
  if (isMaster) sections.push({ title: "Plataforma", items: [
    { label: "Adegas", href: "/adegas", icon: "▥" },
    { label: "Cadastrar adega", href: "/adegas/nova", icon: "+" },
    { label: "Gerenciar perfis", href: "/perfis/gerenciar", icon: "⚙" },
  ] });

  if (!ready) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">Verificando acesso à sua adega...</div>;

  const abertos = pedidos.filter((p) => (p.status ?? "").toLowerCase() === "aberto").length;
  const valor = (n: number) => (loading || error ? "—" : n);

  return (
    <AppLayout
      title="Visão geral"
      subtitle="Painel principal"
      adegaNome={adegaNome || "Minha Adega"}
      usuarioNome={userName}
      usuarioPerfil={perfil}
      sections={sections}
      onLogout={sair}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Bem-vindo ao seu espaço de gestão</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{adegaNome || "Sua adega"}</h2>
          <p className="mt-2 text-sm text-slate-500">Acompanhe seu catálogo, pedidos e operações em um só lugar.</p>
        </div>
        {isManager && <Link href="/produtos/gerenciar" className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700">Gerenciar produtos →</Link>}
      </div>

      {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Não foi possível atualizar os indicadores. Verifique a conexão com a API.</div>}
      <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Metric label="Produtos ativos" value={valor(produtos.filter((p) => p.ativo).length)} detail="No catálogo" />
        <Metric label="Categorias" value={valor(categorias.length)} detail="Grupos cadastrados" />
        <Metric label="Pedidos abertos" value={valor(abertos)} detail="Aguardando andamento" />
        <Metric label="Total de pedidos" value={valor(pedidos.length)} detail="Pedidos encontrados" />
      </section>
      <div className="grid gap-5 xl:grid-cols-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-3">
          <h3 className="text-base font-bold">Acesso rápido</h3>
          <p className="mt-1 text-sm text-slate-500">O que você deseja fazer hoje?</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href="/produtos" className="rounded-xl border border-slate-200 p-4 hover:border-orange-300 hover:bg-orange-50"><b className="block text-sm">Catálogo de produtos</b><span className="text-xs text-slate-500">Consulte seus produtos</span></Link>
            <Link href="/pedidos" className="rounded-xl border border-slate-200 p-4 hover:border-orange-300 hover:bg-orange-50"><b className="block text-sm">Pedidos</b><span className="text-xs text-slate-500">Acompanhe as operações</span></Link>
            <Link href="/clientes" className="rounded-xl border border-slate-200 p-4 hover:border-orange-300 hover:bg-orange-50"><b className="block text-sm">Clientes</b><span className="text-xs text-slate-500">Consulte seus clientes</span></Link>
            {isManager && <Link href="/estoque" className="rounded-xl border border-slate-200 p-4 hover:border-orange-300 hover:bg-orange-50"><b className="block text-sm">Estoque</b><span className="text-xs text-slate-500">Gerencie entradas e quantidades</span></Link>}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <h3 className="text-base font-bold">Comece por aqui</h3>
          <p className="mt-1 text-sm text-slate-500">Primeiros passos para organizar sua adega.</p>
          <ol className="mt-5 list-inside list-decimal space-y-3 text-sm text-slate-700">
            <li>Configure suas categorias</li>
            <li>Cadastre os produtos</li>
            <li>Atualize o estoque</li>
          </ol>
          {isManager && <Link href="/produtos/categorias" className="mt-5 inline-block text-sm font-semibold text-orange-700 hover:underline">Organizar categorias →</Link>}
        </section>
      </div>
      <p className="pb-3 text-center text-xs text-slate-400">IMBEBI Tec da Informação · Sistema de gestão</p>
    </AppLayout>
  );
}
