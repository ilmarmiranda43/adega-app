// app/clientes/page.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE, getAuthToken } from "@/lib/api";
import { obterUsuarioAtual } from "@/lib/auth";

type Cliente = {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  observacoes?: string;
};

type UsuarioAtual = {
  nome: string;
  perfil: string;
  perfil_id: number;
};

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<UsuarioAtual | null>(null);
  const { userName, perfilNome, adegaNome, user } = useAuth();

  useEffect(() => {
    const user = obterUsuarioAtual() as UsuarioAtual | null;
    setUsuario(user);

    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    async function carregarClientes() {
      try {
        const resp = await fetch(`${API_BASE}/clientes/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (resp.status === 401 || resp.status === 403) {
          setErro("Você não tem permissão para ver os clientes.");
          if (resp.status === 401) router.push("/login");
          return;
        }

        if (!resp.ok) throw new Error("Erro ao carregar clientes.");

        const data = await resp.json();
        setClientes(data);
      } catch (error: any) {
        setErro(error.message ?? "Erro ao carregar clientes.");
      } finally {
        setLoading(false);
      }
    }

    carregarClientes();
  }, [router]);

  const isAdminOrManager =
    usuario &&
    (usuario.perfil_id === 1 || usuario.perfil_id === 2 || usuario.perfil_id === 7 );

  if (loading)
    return <p className="p-4 text-zinc-200">Carregando clientes...</p>;

  if (erro) return <p className="p-4 text-red-400">{erro}</p>;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      {/* HEADER PADRONIZADO */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          {/* <h1 className="text-3xl font-bold text-amber-300">{adegaNome || "Minha Adega"} - Clientes</h1> */}
          <header className="mb-4">
            <h1 className="text-xl font-semibold">
              {adegaNome || "Minha Adega"} - Clientes
            </h1>
            <p className="text-sm text-zinc-500">
              Olá, {userName} ({perfilNome})
            </p>
          </header>
          <p className="text-sm text-zinc-400">
            Gerencie o cadastro de clientes da adega.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="btn-secondary"
          >
            ← Home
          </button>

          {/* {isAdminOrManager && ( */}
            <Link href="/clientes/cadastrar" className="btn-primary">
              Cadastrar Cliente
            </Link>
          {/* // )} */}
        </div>
      </div>

      {/* TABELA */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-900/70 text-zinc-300">
            <tr>
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-left">E-mail</th>
              <th className="px-4 py-3 text-left">Telefone</th>
              <th className="px-4 py-3 text-left">Endereço</th>
              <th className="px-4 py-3 text-left">Observação</th>
              <th className="px-4 py-3 text-left">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {clientes.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-900/60 transition">
                <td className="px-4 py-3 text-zinc-100">{c.nome}</td>
                <td className="px-4 py-3 text-zinc-300">{c.email ?? "-"}</td>
                <td className="px-4 py-3 text-zinc-300">
                  {c.telefone ?? "-"}
                </td>
                <td className="px-4 py-3 text-zinc-300">
                  {c.endereco ?? "-"}
                </td>
                <td className="px-4 py-3 text-zinc-300">
                  {c.observacoes ?? "-"}
                </td>
                <td className="px-4 py-3">
                  {isAdminOrManager ? (
                    <button
                      type="button"
                      onClick={() => router.push(`/clientes/${c.id}/editar`)}
                      className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-800"
                    >
                      Editar
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-500">—</span>
                  )}
                </td>

              </tr>
            ))}

            {clientes.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-zinc-500"
                >
                  Nenhum cliente cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
