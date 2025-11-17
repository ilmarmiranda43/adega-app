"use client";

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
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-5xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Catálogo da Adega
        </h1>

        {loading && <p>Carregando produtos...</p>}
        {erro && <p className="text-red-600">{erro}</p>}

        {!loading && !erro && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {produtos.map((p) => (
              <div
                key={p.id}
                className="bg-white border rounded-xl shadow-sm p-3 flex flex-col"
              >
                {p.foto_url && (
                  <img
                    src={p.foto_url}
                    alt={p.nome}
                    className="w-full h-40 object-cover rounded-md mb-2"
                  />
                )}
                <h2 className="font-semibold text-lg">{p.nome}</h2>
                <p className="text-sm text-gray-600 mb-2">
                  {p.tipo_bebida}
                </p>
                <p className="mt-auto text-lg font-bold text-emerald-700">
                  R$ {p.preco_venda.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
