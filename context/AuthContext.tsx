"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/auth";

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
  const pathname = usePathname();

  useEffect(() => {
    // 1) Se estiver na página de login, não força redirect
    if (pathname === "/login") {
      setState((prev) => ({
        ...prev,
        loading: false,
        user: null,
        userName: "",
        perfilNome: "",
        adegaNome: "",
      }));
      return;
    }

    // 2) Demais páginas: exige usuário logado
    const usuarioLogado: any =
      typeof window !== "undefined" ? obterUsuarioAtual() : null;

    if (!usuarioLogado) {
      router.replace("/login");
      // já que vamos redirecionar, libera o loading pra não ficar travado
      setState((prev) => ({
        ...prev,
        loading: false,
        user: null,
        userName: "",
        perfilNome: "",
        adegaNome: "",
      }));
      return;
    }

    // 3) Se tem usuário, monta os dados
    const nomeDoUsuario: string =
      usuarioLogado?.nome ??
      usuarioLogado?.email ??
      usuarioLogado?.username ??
      "Usuário";

    const perfilBruto: any =
      usuarioLogado?.perfil ?? usuarioLogado?.perfil_nome ?? null;

    let perfilNome = "";
    if (typeof perfilBruto === "string") {
      perfilNome = perfilBruto;
    } else if (perfilBruto && typeof perfilBruto === "object") {
      perfilNome = perfilBruto.nome ?? perfilBruto.descricao ?? "";
    }

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
  }, [router, pathname]);

  // Só mostra “Verificando acesso…” em páginas protegidas,
  // nunca na /login
  if (state.loading && pathname !== "/login") {
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }
  return ctx;
}
