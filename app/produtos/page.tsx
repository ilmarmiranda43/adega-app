"use client";

import Image from "next/image";



import Link from "next/link";
import { useEffect, useState } from "react";
import { listarProdutos, Produto } from "@/lib/api";

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarProdutos()
      .then((data) => {
        setProdutos(data);
      })
      .catch((e) => {
        console.error(e);
        setErro("Erro ao carregar produtos.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-zinc-950 to-black text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 md:px-8">
        {/* HEADER */}
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍷</span>
            <div>
              <h1 className="text-xl font-semibold tracking-wide">
                Diego's Adega
              </h1>
              <p className="text-xs text-zinc-400">
                Catálogo de rótulos em tempo real.
              </p>
            </div>
          </div>

          {/* Navegação simples */}
          <nav className="flex items-center gap-2 text-xs sm:text-sm">
            <Link
              href="/"
              className="rounded-full border border-amber-500/40 bg-amber-900/20 px-4 py-1.5 font-medium text-amber-100 transition hover:bg-amber-800/50 hover:text-amber-50"
            >
              ← Voltar para Home
            </Link>
          </nav>
        </header>

        {/* CONTEÚDO */}
        <main className="flex-1">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                Catálogo de produtos
              </h2>
              <p className="text-sm text-zinc-300">
                Visualize os rótulos disponíveis na adega. Em breve: filtros,
                estoque e categorias avançadas.
              </p>
            </div>

            {/* Badge / resumo simples */}
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <span className="rounded-full border border-zinc-700 bg-zinc-900/70 px-3 py-1">
                Total de rótulos:{" "}
                <span className="font-semibold text-amber-200">
                  {loading ? "—" : produtos.filter((p) => p.ativo).length}
                </span>
              </span>
            </div>
          </div>

          {/* ESTADOS DE CARREGAMENTO / ERRO */}
          {loading && (
            <p className="text-sm text-zinc-300">Carregando produtos...</p>
          )}

          {erro && (
            <p className="text-sm text-red-400">
              {erro} Tente novamente em instantes.
            </p>
          )}

          {/* LISTA DE PRODUTOS */}
          {!loading && !erro && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              
              {produtos
                .filter((p) => p.ativo !== false)
                .map((p) => (
                <article
                  key={p.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-amber-900/40 bg-zinc-900/70 shadow-lg shadow-black/40"
                >
                  {/* Imagem / capa */}
                  {p.foto_url && (
                    <div className="relative h-40 w-full overflow-hidden">
                        <Image
                        src={p.foto_url}
                        alt={p.nome}
                        fill
                        className="object-cover transition duration-300 hover:scale-105"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    </div>
                    )}


                  {/* Conteúdo do card */}
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <h3 className="text-sm font-semibold sm:text-base">
                      {p.nome}
                    </h3>

                    <p className="text-xs text-zinc-400">
                      Tipo:{" "}
                      <span className="font-medium text-amber-200">
                        {p.tipo_bebida}
                      </span>
                    </p>

                    {/* Em breve: aqui dá para colocar teor alcoólico, volume, etc. */}

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-sm font-bold text-emerald-300">
                        R$ {p.preco_venda.toFixed(2)}
                      </span>

                      <span className="rounded-full border border-zinc-700 px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-300">
                        Disponível
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Rodapé interno da página */}
          <div className="mt-6 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
            Em breve: filtros por tipo de bebida, faixa de preço e controle de
            estoque diretamente nesta tela.
          </div>
        </main>
      </div>
    </div>
  );
}
