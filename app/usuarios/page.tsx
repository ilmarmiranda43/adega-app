"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obterUsuarioAtual, obterToken } from "@/lib/auth";

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

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function ListaUsuariosPage() {
  const router = useRouter();

  function handleCancelar() {
    router.back(); // volta pra página anterior
  }

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [autorizado, setAutorizado] = useState(false);
  const [verificandoPermissao, setVerificandoPermissao] = useState(true);

  // 1) Verifica se o usuário logado é Admin/Gerente
  useEffect(() => {
    const usuarioAtual = obterUsuarioAtual();
    if (!usuarioAtual) {
      router.replace("/login");
      return;
    }

    // pega o "perfil cru" vindo da sessão (pode ser string ou objeto)
    const perfilBruto = (usuarioAtual as any)?.perfil;

    // flexível: perfil pode ser string ou objeto com nome
    const perfilNome =
      typeof perfilBruto === "string"
        ? perfilBruto
        : perfilBruto?.nome;

    const perfilNormalizado = (perfilNome || "").toLowerCase();

    if (perfilNormalizado === "administrador" || perfilNormalizado === "admin" || perfilNormalizado === "gerente") {
      setAutorizado(true);
    } else {
      setAutorizado(false);
    }

    setVerificandoPermissao(false);
  }, [router]);

  // 2) Carrega usuários se tiver permissão
  useEffect(() => {
    if (!autorizado) return;
    async function carregarUsuarios() {
      try {
        setCarregando(true);
        setErro(null);

        const token = obterToken();
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const resp = await fetch(`${API_BASE}/usuarios`, {
          method: "GET",
          headers,
        });

        if (!resp.ok) {
          const txt = await resp.text();
          console.error("Erro ao carregar usuários:", resp.status, txt);
          throw new Error("Não foi possível carregar os usuários.");
        }

        const dados: Usuario[] = await resp.json();
        setUsuarios(dados);
      } catch (err: any) {
        console.error(err);
        setErro(
          err?.message || "Erro ao carregar usuários. Tente novamente."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarUsuarios();
  }, [autorizado]);

  // Enquanto está verificando permissão, não mostra nada
  if (verificandoPermissao) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <p className="text-sm text-zinc-400">Verificando permissões...</p>
      </div>
    );
  }

  // Se não for autorizado
  if (!autorizado) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="rounded-2xl border border-red-600/60 bg-red-900/20 px-6 py-4 text-center">
          <h1 className="text-lg font-semibold text-red-200">
            Acesso negado
          </h1>
          <p className="mt-1 text-sm text-red-100/80">
            Apenas usuários com perfil <strong>Administrador</strong> ou{" "}
            <strong>Gerente</strong> podem acessar a gestão de usuários.
          </p>
        </div>
      </div>
    );
  }

  // Render principal
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        {/* Cabeçalho */}
        <header className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-semibold text-amber-300">
              Usuários
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Visualize todos os usuários cadastrados e seus perfis.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
            type="button"
            onClick={handleCancelar}
            className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-950 hover:bg-amber-400 transition"
          >
            ← Home
          </button>

          <button
            type="button"
            onClick={() => router.push("/usuarios/cadastrar")}
            className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-950 hover:bg-amber-400 transition"
          >
            Novo usuário
          </button>
          </div>
         
        </header>

        {/* Mensagens */}
        {erro && (
          <div className="rounded-xl border border-red-500/60 bg-red-900/20 px-4 py-3 text-sm text-red-100">
            {erro}
          </div>
        )}

        {/* Lista */}
        <main className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-lg">
          {carregando ? (
            <p className="text-sm text-zinc-400">Carregando usuários...</p>
          ) : usuarios.length === 0 ? (
            <p className="text-sm text-zinc-400">
              Nenhum usuário cadastrado até o momento.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-400">
                    <th className="px-3 py-2 text-left">Nome</th>
                    <th className="px-3 py-2 text-left">E-mail</th>
                    <th className="px-3 py-2 text-left">Perfil</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => {
                    const perfilNome = u.perfil?.nome ?? "(sem perfil)";
                    return (
                      <tr
                        key={u.id}
                        className="border-b border-zinc-900/80 hover:bg-zinc-900/40"
                      >
                        <td className="px-3 py-2">{u.nome}</td>
                        <td className="px-3 py-2 text-zinc-300">
                          {u.email}
                        </td>
                        <td className="px-3 py-2 text-amber-200">
                          {perfilNome}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
