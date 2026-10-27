"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obterUsuarioAtual, obterToken } from "@/lib/auth";
import AdegaPageShell from "@/components/AdegaPageShell";

type Perfil = {
  id: number;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
};

type Usuario = {
  id: number;
  nome: string;
  email: string;
  perfil_id: number;
  perfil?: Perfil | null;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

function nomeDoPerfil(valor: unknown): string {
  if (typeof valor === "string") return valor;
  if (valor && typeof valor === "object" && "nome" in valor) {
    const nome = (valor as { nome?: unknown }).nome;
    return typeof nome === "string" ? nome : "";
  }
  return "";
}

function perfilPermitido(valor: string): boolean {
  return ["administrador", "admin", "gerente", "master"].includes(
    valor.trim().toLocaleLowerCase("pt-BR")
  );
}

export default function ListaUsuariosPage() {
  const router = useRouter();
  const { userName, perfilNome, adegaNome, user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [autorizado, setAutorizado] = useState(false);
  const [verificandoPermissao, setVerificandoPermissao] = useState(true);

  useEffect(() => {
    const usuarioAtual = obterUsuarioAtual();
    const token = obterToken();
    if (!usuarioAtual || !token) {
      setAutorizado(false);
      setVerificandoPermissao(false);
      router.replace("/login");
      return;
    }

    // A sessão e o contexto podem representar o perfil de formas diferentes.
    // Esta checagem controla apenas a interface: a API deve validar o token,
    // o perfil ativo e a adega do usuário em todas as requisições.
    const sessao = usuarioAtual as Record<string, unknown>;
    const contexto = (user ?? {}) as Record<string, unknown>;
    const nomes = [
      nomeDoPerfil(sessao.perfil),
      nomeDoPerfil(sessao.perfil_nome),
      nomeDoPerfil(sessao.perfilNome),
      nomeDoPerfil(contexto.perfil),
      nomeDoPerfil(contexto.perfil_nome),
      nomeDoPerfil(contexto.perfilNome),
      nomeDoPerfil(perfilNome),
    ];

    const permissaoExplicita = [sessao, contexto].some((origem) => {
      const perfil = origem.perfil;
      const perfilObj = perfil && typeof perfil === "object" ? perfil as Record<string, unknown> : {};
      return perfilObj.eh_admin === true || perfilObj.pode_gerenciar_usuarios === true ||
        origem.eh_admin === true || origem.pode_gerenciar_usuarios === true;
    });

    setAutorizado(permissaoExplicita || nomes.some(perfilPermitido));
    setVerificandoPermissao(false);
  }, [router, user, perfilNome]);

  useEffect(() => {
    if (!autorizado) return;
    let cancelado = false;

    async function carregarUsuarios() {
      try {
        setCarregando(true);
        setErro(null);
        const token = obterToken();
        if (!token) throw new Error("Sessão expirada. Entre novamente.");

        const resp = await fetch(`${API_BASE}/usuarios`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resp.ok) {
          const mensagem = await resp.text();
          console.error("Erro ao carregar usuários:", resp.status, mensagem);
          if (resp.status === 401) throw new Error("Sessão inválida ou expirada. Entre novamente.");
          if (resp.status === 403) throw new Error("A API não autorizou o acesso à gestão de usuários.");
          throw new Error("Não foi possível carregar os usuários.");
        }

        const dados: Usuario[] = await resp.json();
        if (!cancelado) setUsuarios(dados);
      } catch (err: unknown) {
        if (!cancelado) setErro(err instanceof Error ? err.message : "Erro ao carregar usuários.");
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    void carregarUsuarios();
    return () => { cancelado = true; };
  }, [autorizado]);

  if (verificandoPermissao) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <p className="text-sm text-slate-500">Verificando permissões...</p>
      </div>
    );
  }

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-center">
          <h1 className="text-lg font-semibold text-red-700">Acesso negado</h1>
          <p className="mt-1 text-sm text-red-700">
            Não foi possível confirmar sua permissão para acessar a gestão de usuários.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdegaPageShell title="Usuários" subtitle="Painel de gestão">
      <div className="text-slate-900">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
          <header className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-xl font-semibold">{adegaNome || "Minha Adega"} - Usuários</h1>
              <p className="text-sm text-slate-500">Olá, {userName} ({perfilNome})</p>
              <p className="mt-1 text-sm text-slate-500">Visualize todos os usuários cadastrados e seus perfis.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => router.back()}
                className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-orange-700 transition">
                ← Home
              </button>
              <button type="button" onClick={() => router.push("/usuarios/cadastrar")}
                className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-orange-700 transition">
                Novo usuário
              </button>
            </div>
          </header>

          {erro && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>
          )}

          <main className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
            {carregando ? (
              <p className="text-sm text-slate-500">Carregando usuários...</p>
            ) : usuarios.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum usuário cadastrado até o momento.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2 text-left">Nome</th>
                      <th className="px-3 py-2 text-left">E-mail</th>
                      <th className="px-3 py-2 text-left">Perfil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((u) => (
                      <tr key={u.id} className="border-b border-slate-200/80 hover:bg-slate-50/40">
                        <td className="px-3 py-2">{u.nome}</td>
                        <td className="px-3 py-2 text-slate-700">{u.email}</td>
                        <td className="px-3 py-2 text-orange-700">{u.perfil?.nome ?? "(sem perfil)"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
      </div>
    </AdegaPageShell>
  );
}
