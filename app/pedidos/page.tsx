"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listarPedidos, PedidoRead, atualizarStatusPedido } from "@/lib/api/pedidos";

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoRead[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    try {
      setCarregando(true);
      const data = await listarPedidos();
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
  }, []);

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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-amber-200">
          Pedidos
        </h1>
        <Link href="/pedidos/novo" className="btn-primary">
          Novo pedido
        </Link>
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
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} className="border-t border-zinc-800/70">
                  <td className="px-3 py-2">{p.id}</td>
                  <td className="px-3 py-2">{p.cliente_id}</td>
                  <td className="px-3 py-2">
                    {new Date(p.data_criacao).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-3 py-2 capitalize">{p.status}</td>
                  <td className="px-3 py-2 text-right">
                    R$ {Number(p.total).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      className="rounded-full border border-emerald-500/60 px-2 py-1 text-[11px] text-emerald-200 hover:bg-emerald-900/40"
                      onClick={() => handleAlterarStatus(p.id, "confirmado")}
                    >
                      Confirmar
                    </button>
                    <button
                      className="rounded-full border border-red-500/60 px-2 py-1 text-[11px] text-red-200 hover:bg-red-900/40"
                      onClick={() => handleAlterarStatus(p.id, "cancelado")}
                    >
                      Cancelar
                    </button>
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
