// lib/api.ts

export type Produto = {
  id: number;
  nome: string;
  tipo_bebida: string;
  preco_venda: number;
  foto_url?: string;
};

// Por enquanto, vamos usar MOCK (sem backend)
export async function listarProdutos(): Promise<Produto[]> {
  // Simula um pequeno atraso de rede
  await new Promise((resolve) => setTimeout(resolve, 300));

  return [
    {
      id: 1,
      nome: "Vinho Tinto Reserva",
      tipo_bebida: "Vinho Tinto",
      preco_venda: 79.9,
      foto_url:
        "https://via.placeholder.com/400x200?text=Vinho+Tinto+Reserva",
    },
    {
      id: 2,
      nome: "Cerveja Artesanal IPA",
      tipo_bebida: "Cerveja Artesanal",
      preco_venda: 18.5,
      foto_url: "https://via.placeholder.com/400x200?text=Cerveja+IPA",
    },
    {
      id: 3,
      nome: "Whisky 12 anos",
      tipo_bebida: "Destilado",
      preco_venda: 199.9,
      foto_url:
        "https://via.placeholder.com/400x200?text=Whisky+12+anos",
    },
  ];
}
