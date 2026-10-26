"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { limparSessao } from "@/lib/auth";
import AppLayout, { type MenuSection } from "@/components/AppLayout";
import type { ReactNode } from "react";

const isStaging = (process.env.NEXT_PUBLIC_API_URL ?? "").includes("adega-app-api-teste");

export default function AdegaPageShell({
  title, subtitle, children, headerAction,
}: { title: string; subtitle?: string; children: ReactNode; headerAction?: ReactNode }) {
  const router = useRouter();
  const { userName, perfilNome, adegaNome } = useAuth();
  const role = (perfilNome ?? "").toLowerCase();
  const isManager = ["admin", "administrador", "gerente", "master"].includes(role);
  const isMaster = [
    "master",
    "superadmin",
    "administrador imbebi",
  ].includes(role);
  const sections: MenuSection[] = [
    {
      title: "Principal", items: [
        { label: "Início", href: "/", icon: "⌂" },
        { label: "Produtos", href: "/produtos", icon: "▣" },
        { label: "Clientes", href: "/clientes", icon: "♧" },
        { label: "Pedidos", href: "/pedidos", icon: "▤" },
      ]
    },
  ];
  if (isManager) sections.push({
    title: "Gerenciamento", items: [
      { label: "Gerenciar produtos", href: "/produtos/gerenciar", icon: "▦" },
      { label: "Categorias", href: "/produtos/categorias", icon: "◫" },
      { label: "Estoque", href: "/estoque", icon: "◈" },
      { label: "Usuários", href: "/usuarios", icon: "♙" },
      { label: "Cadastrar usuário", href: "/usuarios/cadastrar", icon: "+" },
      ...(!isStaging ? [{ label: "Débitos", href: "/debitos", icon: "▤" }] : []),
    ]
  });
  if (isMaster) sections.push({
    title: "Plataforma", items: [
      { label: "Adegas", href: "/adegas", icon: "▥" },
      { label: "Cadastrar adega", href: "/adegas/nova", icon: "+" },
      { label: "Gerenciar perfis", href: "/perfis/gerenciar", icon: "⚙" },
    ]
  });

  return <AppLayout
    title={title}
    subtitle={subtitle}
    adegaNome={adegaNome || "Minha Adega"}
    usuarioNome={userName || "Usuário"}
    usuarioPerfil={perfilNome || ""}
    sections={sections}
    onLogout={() => { limparSessao(); router.replace("/login"); }}
    headerAction={headerAction}
  >{children}</AppLayout>;
}
