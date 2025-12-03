"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { useRouter } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/auth"; // usa o seu helper atual

type AuthInfo = {
  loading: boolean;
  user: any | null;
  userName: string;
  perfilNome: string;
  adegaNome: string;
};

const AuthContext = createContext<AuthInfo | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthInfo>({
    loading: true,
    user: null,
    userName: "",
    perfilNome: "",
    adegaNome: "",
  });

  const router = useRouter();

  useEffect(() => {
    const usuarioLogado =
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

    // Nome do perfil
    const perfilBruto: any =
      usuarioLogado?.perfil ?? usuarioLogado?.perfil_nome ?? null;

    let perfilNome = "";
    if (typeof perfilBruto === "string") {
      perfilNome = perfilBruto;
    } else if (perfilBruto && typeof perfilBruto === "object") {
      perfilNome = perfilBruto.nome ?? perfilBruto.descricao ?? "";
    }

    // Nome da adega
    const adegaBruta: any =
      usuarioLogado?.adega ?? usuarioLogado?.adega_nome ?? null;

    let adegaNome = "";
    if (typeof adegaBruta === "string") {
      adegaNome = adegaBruta;
    } else if (adegaBruta && typeof adegaBruta === "object") {
      adegaNome = adegaBruta.nome ?? "";
    }

    setState({
      loading: false,
      user: usuarioLogado,
      userName: nomeDoUsuario,
      perfilNome,
      adegaNome,
    });
  }, [router]);

  // Tela de "verificando acesso" centralizada
  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-100">
        <p className="text-sm text-zinc-400">
          Verificando acesso à {state.adegaNome || "sua adega"}...
        </p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
  );
}

// Hook para usar em qualquer página
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }
  return ctx;
}
