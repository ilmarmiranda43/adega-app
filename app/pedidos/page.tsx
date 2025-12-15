"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listarPedidos, PedidoRead, atualizarStatusPedido } from "@/lib/api/pedidos";

type ProdutoReadMin = { id: number; nome: string };

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoRead[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [statusFiltro, setStatusFiltro] = useState<string>("");
  const [clienteFiltro, setClienteFiltro] = useState<string>("");

  const { userName, perfilNome, adegaNome, user } = useAuth();

  const [pedidoSelecionado, setPedidoSelecionado] = useState<PedidoRead | null>(null);
  const [produtosMap, setProdutosMap] = useState<Record<number, string>>({});

  // 1) Pega adega selecionada (tentando user primeiro, e fallback em localStorage)
  const adegaIdSelecionada = useMemo(() => {
    const doUser =
      (user as any)?.adega_id ??
      (user as any)?.adegaId ??
      (user as any)?.adegaIdSelecionada;

    if (typeof doUser === "number" && doUser > 0) return doUser;

    if (typeof window !== "undefined") {
      const ls =
        Number(localStorage.getItem("adega_id")) ||
        Number(localStorage.getItem("adegaId")) ||
        Number(localStorage.getItem("adega_id_selecionada"));
      return ls > 0 ? ls : 0;
    }

    return 0;
  }, [user]);

  // 2) Token (mesma ideia — tenta contexto e fallback)
  const token = useMemo(() => {
    const doUser = (user as any)?.token;
    if (doUser) return doUser;
    if (typeof window !== "undefined") {
      return localStorage.getItem("adega_token") || localStorage.getItem("token") || "";
    }
    return "";
  }, [user]);

  // 3) Base da API
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "";


  async function carregarPedidos() {
    try {
      setCarregando(true);

      const clienteIdNum = clienteFiltro ? Number(clienteFiltro) : undefined;
      const status = statusFiltro || undefined;

      const data = await listarPedidos(status, clienteIdNum);
      setPedidos(data);
      setErro(null);
    } catch (e: any) {
      console.error(e);
      setErro(e.message ?? "Erro ao carregar pedidos");
    } finally {
      setCarregando(false);
    }
  }

  async function carregarProdutosDaAdega() {
  try {

    if (!API_BASE) return;
    if (!token) return;

    const res = await fetch(`${API_BASE}/produtos/`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) return;

    const produtos = await res.json(); // [{id, nome, ...}]
    const map: Record<number, string> = {};
    for (const pr of produtos) {
      const id = Number(pr.id)

      const nome = 
        pr.nome ??
        pr.produto ??
        pr.nome_produto ??
        pr.descricao ??
        pr.titulo;

      // if (id) map[id] = String(nome ?? 'Produto #${id}')
      if (id) map[id] = String(nome ?? `Produto #${id}`);

    } 

    setProdutosMap(map);

  } catch (e) {
    console.warn("Falha ao carregar produtos:", e);
  }
}


  // Carrega pedidos quando mudar filtros
  useEffect(() => {
    carregarPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFiltro, clienteFiltro]);

  // Carrega produtos quando mudar a adega selecionada (ou token/base)
  useEffect(() => {
    carregarProdutosDaAdega();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, API_BASE]);

  async function handleAlterarStatus(id: number, status: string) {
    try {
      await atualizarStatusPedido(id, status);
      await carregarPedidos();
    } catch (e: any) {
      alert(e.message ?? "Erro ao atualizar status");
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <header className="mb-4">
          <h1 className="text-xl font-semibold">
            {adegaNome || "Minha Adega"} - Pedidos
          </h1>
          <p className="text-sm text-zinc-500">
            Olá, {userName} ({perfilNome})
          </p>
        </header>

        <div className="flex gap-2">
          <Link
            href="/"
            className="rounded-full border border-zinc-600/60 bg-zinc-900/80 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-zinc-100 hover:bg-zinc-800/80"
          >
            Voltar
          </Link>

          <Link
            href="/pedidos/novo"
            className="rounded-full bg-amber-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-black shadow-md hover:bg-amber-500"
          >
            Novo pedido
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/60 p-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-[11px] text-zinc-400 mb-1">Status</label>
          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="">Todos</option>
            <option value="aberto">Aberto</option>
            <option value="confirmado">Confirmado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-[11px] text-zinc-400 mb-1">ID do cliente</label>
          <input
            type="number"
            value={clienteFiltro}
            onChange={(e) => setClienteFiltro(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            placeholder="Filtrar por ID do cliente"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setStatusFiltro("");
            setClienteFiltro("");
          }}
          className="rounded-full border border-zinc-600/60 bg-zinc-800/60 px-4 py-2 text-xs font-medium uppercase tracking-wide text-zinc-100"
        >
          Limpar filtros
        </button>
      </div>

      {carregando && <p>Carregando pedidos...</p>}
      {erro && <p className="text-red-400 text-sm">{erro}</p>}

      {!carregando && pedidos.length === 0 && (
        <p className="text-zinc-300">Nenhum pedido encontrado.</p>
      )}

      {pedidos.length > 0 && (
        <div className="overflow-x-auto rounded-xl bg-zinc-900/50 border border-zinc-700/60">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-900/80 text-zinc-300">
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Cliente</th>
                <th className="px-3 py-2 text-left">Data</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Quantidade</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Observações</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>

            <tbody>
              {pedidos.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-zinc-800/70 cursor-pointer hover:bg-zinc-800/40"
                  onClick={() => setPedidoSelecionado(p)}
                >
                  <td className="px-3 py-2">{p.id}</td>
                  <td className="px-3 py-2">{p.cliente_id}</td>
                  <td className="px-3 py-2">
                    {new Date(p.criado_em).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-3 py-2 capitalize">{p.status}</td>

                  {/* Quantidade total (soma dos itens) */}
                  <td className="px-3 py-2">
                    {p.itens.reduce((total, item) => total + item.quantidade, 0)}
                  </td>

                  <td className="px-3 py-2 text-right">
                    R$ {Number(p.valor_liquido).toFixed(2)}
                  </td>
                  <td className="px-2 py-2 capitalize">{p.observacoes}</td>

                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2 flex-nowrap">
                      {(() => {
                        const podeAlterar = p.status === "aberto";

                        return (
                          <>
                            <button
                              disabled={!podeAlterar}
                              className={`whitespace-nowrap rounded-full border border-emerald-500/60 px-2 py-1 text-[11px] text-emerald-200
                                ${podeAlterar ? "hover:bg-emerald-900/40 cursor-pointer" : "opacity-40 cursor-not-allowed"}
                              `}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (podeAlterar) handleAlterarStatus(p.id, "confirmado");
                              }}
                            >
                              Confirmar
                            </button>

                            <button
                              disabled={!podeAlterar}
                              className={`whitespace-nowrap rounded-full border border-red-500/60 px-2 py-1 text-[11px] text-red-200
                                ${podeAlterar ? "hover:bg-red-900/40 cursor-pointer" : "opacity-40 cursor-not-allowed"}
                              `}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (podeAlterar) handleAlterarStatus(p.id, "cancelado");
                              }}
                            >
                              Cancelar
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>

          {/* MODAL */}
          {pedidoSelecionado && (
            <div
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
              onClick={() => setPedidoSelecionado(null)}
            >
              <div
                className="bg-zinc-900 p-6 rounded-xl w-full max-w-lg shadow-xl border border-zinc-700/60"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h2 className="text-xl font-semibold text-zinc-200">
                    Itens do Pedido #{pedidoSelecionado.id}
                  </h2>
                  <button
                    className="text-zinc-300 hover:text-white"
                    onClick={() => setPedidoSelecionado(null)}
                    aria-label="Fechar"
                  >
                    ✕
                  </button>
                </div>

                <ul className="space-y-3">
                  {pedidoSelecionado.itens.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-lg border border-zinc-700/60 bg-zinc-950/60 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-zinc-100 font-medium">
                            Produto : {produtosMap[item.produto_id] ?? `Produto #${item.produto_id}`}
                          </p>
                          <p className="text-sm text-zinc-400">
                            Quantidade: {item.quantidade}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-zinc-300">
                            Preço: R$ {Number(item.preco_unitario).toFixed(2)}
                          </p>
                          <p className="text-sm text-zinc-200 font-semibold">
                            Subtotal: R$ {Number(item.total_liquido).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setPedidoSelecionado(null)}
                  className="mt-6 w-full rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-100 py-2"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
