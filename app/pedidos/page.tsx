"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listarPedidos, PedidoRead, atualizarStatusPedido } from "@/lib/api/pedidos";

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoRead[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [statusFiltro, setStatusFiltro] = useState<string>("");
  const [clienteFiltro, setClienteFiltro] = useState<string>("");
  const { userName, perfilNome, adegaNome, user } = useAuth();

  async function carregar() {
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

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFiltro, clienteFiltro]);

  async function handleAlterarStatus(id: number, status: string) {
    try {
      await atualizarStatusPedido(id, status);
      await carregar();
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
          <label className="block text-[11px] text-zinc-400 mb-1">
            Status
          </label>
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
          <label className="block text-[11px] text-zinc-400 mb-1">
            ID do cliente
          </label>
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
                <th className="px-3 py-2 text-left">Preço Unitário</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Observações</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} className="border-t border-zinc-800/70">
                  <td className="px-3 py-2">{p.id}</td>
                  <td className="px-3 py-2">{p.cliente_id}</td>
                  <td className="px-3 py-2">
                    {new Date(p.criado_em).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-3 py-2 capitalize">{p.status}</td>

                  <td className="px-3 py-2">
                    {p.itens.reduce((total, item) => total + item.quantidade, 0)}
                  </td>

                  <td className="px-3 py-2">
                    {p.itens.length > 0
                      ? `R$ ${Number(p.itens[0].preco_unitario).toFixed(2)}`
                      : "-"}
                  </td>

                  <td className="px-3 py-2 text-right">
                    R$ {Number(p.valor_liquido).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 capitalize">{p.observacoes}</td>
                  <td className="px-3 py-2 text-right space-x-2">
                    {/** só pode alterar se o status for "aberto" */}
                    {(() => {
                      const podeAlterar = p.status === "aberto";

                      return (
                        <>
                          <button
                            disabled={!podeAlterar}
                            className={`rounded-full border border-emerald-500/60 px-2 py-1 text-[11px] text-emerald-200
                              ${podeAlterar ? "hover:bg-emerald-900/40 cursor-pointer" : "opacity-40 cursor-not-allowed"}
                            `}
                            onClick={() => podeAlterar && handleAlterarStatus(p.id, "confirmado")}
                          >
                            Confirmar
                          </button>

                          <button
                            disabled={!podeAlterar}
                            className={`rounded-full border border-red-500/60 px-2 py-1 text-[11px] text-red-200
                              ${podeAlterar ? "hover:bg-red-900/40 cursor-pointer" : "opacity-40 cursor-not-allowed"}
                            `}
                            onClick={() => podeAlterar && handleAlterarStatus(p.id, "cancelado")}
                          >
                            Cancelar
                          </button>
                        </>
                      );
                    })()}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
