"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarPedido, ItemPedidoCreate, PedidoCreate } from "@/lib/api/pedidos";

export default function NovoPedidoPage() {
  const router = useRouter();
  const [clienteId, setClienteId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemPedidoCreate[]>([
    { produto_id: 0, quantidade: 1 },
  ]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function atualizarItem(index: number, campo: "produto_id" | "quantidade", valor: string) {
    setItens((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [campo]: campo === "quantidade" ? Number(valor) : Number(valor),
            }
          : item
      )
    );
  }

  function adicionarLinha() {
    setItens((prev) => [...prev, { produto_id: 0, quantidade: 1 }]);
  }

  function removerLinha(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSalvando(true);
      setErro(null);

      const payload: PedidoCreate = {
        cliente_id: Number(clienteId),
        observacoes: observacoes || undefined,
        itens: itens.filter((i) => i.produto_id && i.quantidade > 0),
      };

      if (!payload.cliente_id) {
        throw new Error("Informe o cliente.");
      }
      if (payload.itens.length === 0) {
        throw new Error("Adicione pelo menos um item com produto e quantidade.");
      }

      await criarPedido(payload);
      router.push("/pedidos");
    } catch (e: any) {
      setErro(e.message ?? "Erro ao salvar pedido");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <h1 className="text-2xl font-semibold text-amber-200">
        Novo pedido
      </h1>

      {erro && <p className="text-sm text-red-400">{erro}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              ID do cliente
            </label>
            <input
              type="number"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400"
            />
            <p className="mt-1 text-[11px] text-zinc-400">
              (Depois podemos trocar para um select carregando clientes.)
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400 min-h-[60px]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">
              Itens do pedido
            </h2>
            <button
              type="button"
              onClick={adicionarLinha}
              className="rounded-full border border-amber-500/60 bg-amber-900/20 px-3 py-1 text-xs font-medium text-amber-200 hover:bg-amber-800/40"
            >
              + Adicionar item
            </button>
          </div>

          <div className="space-y-2">
            {itens.map((item, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-xl border border-zinc-700/70 bg-zinc-900/50 p-3 sm:flex-row sm:items-center"
              >
                <div className="flex-1 flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      ID do produto
                    </label>
                    <input
                      type="number"
                      value={item.produto_id || ""}
                      onChange={(e) =>
                        atualizarItem(index, "produto_id", e.target.value)
                      }
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantidade}
                      onChange={(e) =>
                        atualizarItem(index, "quantidade", e.target.value)
                      }
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                    />
                  </div>
                </div>

                {itens.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerLinha(index)}
                    className="self-start rounded-full border border-red-600/60 bg-red-900/30 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-red-200 hover:bg-red-800/40"
                  >
                    Remover
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.push("/pedidos")}
            className="rounded-full border border-zinc-600/60 bg-zinc-900/40 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-zinc-200 hover:bg-zinc-800/60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="rounded-full border border-amber-500/60 bg-amber-900/40 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-amber-100 hover:bg-amber-800/60 disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar pedido"}
          </button>
        </div>
      </form>
    </main>
  );
}
