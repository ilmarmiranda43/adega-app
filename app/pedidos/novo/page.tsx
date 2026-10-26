"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { criarPedido, ItemPedidoCreate, PedidoCreate } from "@/lib/api/pedidos";
import { listarClientes, Cliente } from "@/lib/api/clientes";
import { listarProdutos, Produto } from "@/lib/api/produtos";

import AdegaPageShell from "@/components/AdegaPageShell";

export default function NovoPedidoPage() {
  const router = useRouter();
  const [clienteId, setClienteId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemPedidoCreate[]>([
    { produto_id: 0, quantidade: 1 },
  ]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const { userName, perfilNome, adegaNome, user } = useAuth();

  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        setCarregandoDados(true);
        const [clientesRes, produtosRes] = await Promise.all([
          listarClientes(),
          listarProdutos(),
        ]);
        setClientes(clientesRes);
        setProdutos(produtosRes);
        if (clientesRes.length > 0) {
          setClienteId(String(clientesRes[0].id));
        }
      } catch (e: any) {
        console.error(e);
        setErro(e.message ?? "Erro ao carregar clientes/produtos");
      } finally {
        setCarregandoDados(false);
      }
    }
    carregarDadosIniciais();
  }, []);

  function atualizarItem(index: number, campo: "produto_id" | "quantidade", valor: string) {
    setItens((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [campo]: Number(valor),
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
    <AdegaPageShell title="Novo pedido" subtitle="Painel de gestão">
    <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      {/* <h1 className="text-2xl font-semibold text-orange-700">
        {adegaNome || "Minha Adega"} - Novo pedido
      </h1> */}

      <header className="mb-4">
        <h1 className="text-xl font-semibold">
          {adegaNome || "Minha Adega"} - Novo Pedido
        </h1>
        <p className="text-sm text-slate-500">
          Olá, {userName} ({perfilNome})
        </p>
      </header>

      {erro && <p className="text-sm text-red-400">{erro}</p>}
      {carregandoDados && <p className="text-sm text-slate-700">Carregando clientes e produtos...</p>}

      {!carregandoDados && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Cliente
              </label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} (#{c.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Observações
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 min-h-[60px]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">
                Itens do pedido
              </h2>
              <button
                type="button"
                onClick={adicionarLinha}
                className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-amber-800/40"
              >
                + Adicionar item
              </button>
            </div>

            <div className="space-y-2">
              {itens.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center"
                >
                  <div className="flex-1 flex gap-2">
                    <div className="flex-1">
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Produto
                      </label>
                      <select
                        value={item.produto_id || ""}
                        onChange={(e) =>
                          atualizarItem(index, "produto_id", e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900"
                      >
                        <option value="">Selecione</option>
                        {produtos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome} (R$ {Number(p.preco).toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-28">
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantidade}
                        onChange={(e) =>
                          atualizarItem(index, "quantidade", e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900"
                      />
                    </div>
                  </div>

                  {itens.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removerLinha(index)}
                      className="self-start rounded-full border border-red-200 bg-red-900/30 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-red-700 hover:bg-red-800/40"
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
              className="rounded-full border border-slate-300/60 bg-slate-50/40 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-700 hover:bg-slate-100/60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="rounded-full border border-orange-200 bg-amber-900/40 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-amber-100 hover:bg-amber-800/60 disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Salvar pedido"}
            </button>
          </div>
        </form>
      )}
    </main>
    </AdegaPageShell>
  );
}
