// app/estoque/page.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, getAuthToken } from "@/lib/api";
import { obterUsuarioAtual } from "@/lib/auth";

type ItemEstoque = {
  id: number;
  adega_id: number;
  produto_id: number;
  quantidade: number;
  minimo_alerta: string;
  criado_em: string;
};

type Produto = {
  id: number;
  nome: string;
};

type UsuarioAtual = {
  nome: string;
  perfil: string;
  perfil_id: number;
};

export default function EstoquePage() {
  const router = useRouter();
  const [itens, setItens] = useState<ItemEstoque[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
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

    async function carregarDados() {
      try {
        setLoading(true);

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [respEstoque, respProdutos] = await Promise.all([
          fetch(`${API_BASE}/estoque/`, { headers }),
          fetch(`${API_BASE}/produtos/`, { headers }),
        ]);

        if (respEstoque.status === 401 || respProdutos.status === 401) {
          router.push("/login");
          return;
        }

        if (
          respEstoque.status === 403 ||
          respProdutos.status === 403
        ) {
          setErro("Você não tem permissão para ver o estoque.");
          return;
        }

        if (!respEstoque.ok) {
          throw new Error("Erro ao carregar estoque.");
        }

        if (!respProdutos.ok) {
          throw new Error("Erro ao carregar produtos.");
        }

        const dadosEstoque = await respEstoque.json();
        const dadosProdutos = await respProdutos.json();

        setItens(dadosEstoque);
        setProdutos(dadosProdutos);
      } catch (error: any) {
        setErro(error.message ?? "Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [router]);

  const isAdminOrManager =
    usuario && (usuario.perfil_id === 1 || usuario.perfil_id === 2 || usuario.perfil_id === 7);

  function obterNomeProduto(produto_id: number): string {
    const prod = produtos.find((p) => p.id === produto_id);
    return prod ? prod.nome : `ID ${produto_id}`;
  }

  const itensFiltrados = itens.filter((item) => {
    const texto = busca.toLowerCase().trim();
    if (!texto) return true;

    const nomeProduto = obterNomeProduto(item.produto_id).toLowerCase();
    const local = (item.minimo_alerta ?? "").toLowerCase();
    
    return (
      nomeProduto.includes(texto) ||
      String(item.produto_id).includes(texto) ||
      local.includes(texto)
    );
  });

  if (loading) {
    return <p className="p-4 text-zinc-200">Carregando estoque...</p>;
  }

  if (erro) {
    return <p className="p-4 text-red-400">{erro}</p>;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      {/* HEADER PADRONIZADO */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          {/* <h1 className="text-3xl font-bold text-amber-300">{adegaNome || "Minha Adega"} - Estoque</h1> */}
          <header className="mb-4">
            <h1 className="text-xl font-semibold">
              {adegaNome || "Minha Adega"} - Estoque
            </h1>
            <p className="text-sm text-zinc-500">
              Olá, {userName} ({perfilNome})
            </p>
          </header>
          <p className="text-sm text-zinc-400">
            Visualize e gerencie as entradas de estoque dos produtos.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="btn-secondary"
          >
            ← Voltar
          </button>

          {isAdminOrManager && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => router.push("/estoque/cadastrar")}
            >
              Nova entrada
            </button>
          )}
        </div>
      </div>

      {/* BUSCA */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-zinc-500">
          {itensFiltrados.length} registro(s) exibido(s)
        </div>
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Buscar por produto, ID, local ou observação..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* TABELA */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-900/70 text-zinc-300">
            <tr>
              <th className="px-4 py-3 text-left">Produto</th>
              <th className="px-4 py-3 text-left">Quantidade</th>
              <th className="px-4 py-3 text-left">Mínimo Alerta</th>
              <th className="px-4 py-3 text-left">Data Entrada</th>
              {isAdminOrManager && (
                <th className="px-4 py-3 text-left">Ações</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {itensFiltrados.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-zinc-900/60 transition-colors"
              >
                <td className="px-4 py-3 text-zinc-100">
                  {obterNomeProduto(item.produto_id)}
                  <span className="ml-2 text-xs text-zinc-500">
                    (ID: {item.produto_id})
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-100">
                  {item.quantidade}
                </td>
                <td className="px-4 py-3 text-zinc-300">
                  {item.minimo_alerta ?? "-"}
                </td>
                <td className="px-4 py-3 text-zinc-300">
                  {new Date(item.criado_em).toLocaleDateString("pt-BR")}
                </td>

                {isAdminOrManager && (
                  <td className="px-4 py-3 text-zinc-300">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/estoque/${item.id}/editar`)
                      }
                      className="rounded-full border border-zinc-600 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
                    >
                      Editar
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {itensFiltrados.length === 0 && (
              <tr>
                <td
                  colSpan={isAdminOrManager ? 7 : 6}
                  className="px-4 py-6 text-center text-zinc-500"
                >
                  Nenhuma entrada de estoque encontrada com esse filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
