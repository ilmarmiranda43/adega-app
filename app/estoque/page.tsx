// app/estoque/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, getAuthToken } from "@/lib/api";
import { obterUsuarioAtual } from "@/lib/auth";

type ItemEstoque = {
  id: number;
  produto_id: number;
  quantidade: number;
  localizacao?: string;
  lote?: string;
  data_entrada: string;
  data_validade?: string;
};

type UsuarioAtual = {
  nome: string;
  perfil: string;
  perfil_id: number;
};

export default function EstoquePage() {
  const router = useRouter();
  const [itens, setItens] = useState<ItemEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<UsuarioAtual | null>(null);

  useEffect(() => {
    const user = obterUsuarioAtual() as UsuarioAtual | null;
    setUsuario(user);

    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    async function carregarEstoque() {
      try {
        const resp = await fetch(`${API_BASE}/estoque/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (resp.status === 401 || resp.status === 403) {
          setErro("Você não tem permissão para ver o estoque.");
          if (resp.status === 401) {
            router.push("/login");
          }
          return;
        }

        if (!resp.ok) {
          throw new Error("Erro ao carregar estoque.");
        }

        const data = await resp.json();
        setItens(data);
      } catch (error: any) {
        setErro(error.message ?? "Erro ao carregar estoque.");
      } finally {
        setLoading(false);
      }
    }

    carregarEstoque();
  }, [router]);

  const isAdminOrManager =
    usuario &&
    (usuario.perfil_id === 1 || usuario.perfil_id === 2);

  if (loading) {
    return <p className="p-4 text-zinc-200">Carregando estoque...</p>;
  }

  if (erro) {
    return <p className="p-4 text-red-400">{erro}</p>;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-amber-200">Estoque</h1>
          <p className="text-sm text-zinc-400">
            Visualize as entradas de estoque dos produtos.
          </p>
        </div>

        {isAdminOrManager && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              // aqui você pode levar para uma página de "nova entrada de estoque"
              // ex: /estoque/adicionar
            }}
          >
            Nova entrada
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-900/70 text-zinc-300">
            <tr>
              <th className="px-4 py-3 text-left">Produto ID</th>
              <th className="px-4 py-3 text-left">Quantidade</th>
              <th className="px-4 py-3 text-left">Localização</th>
              <th className="px-4 py-3 text-left">Lote</th>
              <th className="px-4 py-3 text-left">Entrada</th>
              <th className="px-4 py-3 text-left">Validade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {itens.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-900/60">
                <td className="px-4 py-3 text-zinc-100">{item.produto_id}</td>
                <td className="px-4 py-3 text-zinc-100">{item.quantidade}</td>
                <td className="px-4 py-3 text-zinc-300">
                  {item.localizacao ?? "-"}
                </td>
                <td className="px-4 py-3 text-zinc-300">{item.lote ?? "-"}</td>
                <td className="px-4 py-3 text-zinc-300">
                  {new Date(item.data_entrada).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-zinc-300">
                  {item.data_validade
                    ? new Date(item.data_validade).toLocaleDateString("pt-BR")
                    : "-"}
                </td>
              </tr>
            ))}

            {itens.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                  Nenhuma entrada de estoque cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
