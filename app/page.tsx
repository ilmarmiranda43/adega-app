// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-zinc-950 to-black text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 md:px-8">
        {/* TOPO */}
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍷</span>
            <div>
              <h1 className="text-xl font-semibold tracking-wide">
                Diego&apos;s Adega
              </h1>
              <p className="text-xs text-zinc-400">
                Controle de rótulos, estoque e vendas em um só lugar.
              </p>
            </div>
          </div>

          <span className="rounded-full border border-amber-500/40 bg-amber-900/30 px-4 py-1 text-xs font-medium uppercase tracking-wide text-amber-200">
            Painel da Adega
          </span>
        </header>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex flex-1 flex-col gap-10 md:flex-row md:items-stretch">
          {/* LADO ESQUERDO */}
          <section className="md:w-3/5 space-y-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                Organize sua <span className="text-amber-300">adega</span>{" "}
                como um sommelier.
              </h2>

              <p className="text-sm leading-relaxed text-zinc-300 sm:text-base max-w-xl">
                Cadastre rótulos, acompanhe o estoque, veja o que está saindo
                mais e tenha o catálogo sempre à mão — no celular, tablet ou
                computador. Perfeito para adegas, bares e pequenos comércios.
              </p>
            </div>

            {/* BOTÕES PRINCIPAIS */}
            <div className="flex flex-col gap-3 sm:flex-row">
              {/* Catálogo */}
              <Link
                href="/produtos"
                className="inline-flex flex-1 items-center justify-center rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-900/40 transition hover:bg-amber-500"
              >
                Catálogo de Produtos
              </Link>

              {/* Gerenciador (usa o que você já tem em app/produtos/gerenciar) */}
              <Link
                href="/produtos/gerenciar"
                className="inline-flex flex-1 items-center justify-center rounded-full border border-amber-500/50 bg-zinc-950/40 px-6 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-900/40"
              >
                Gerenciador da Adega
              </Link>
            </div>

            {/* Atalho para categorias */}
            <div className="flex flex-wrap gap-3 text-xs text-zinc-300">
              <Link
                href="/produtos/categorias"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/60 px-4 py-2 hover:border-amber-500/70 hover:text-amber-200"
              >
                <span>📂</span>
                <span>Gerenciar categorias de produtos</span>
              </Link>
            </div>

            {/* TAGS */}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-400">
              <span className="rounded-full border border-zinc-700 px-3 py-1">
                📱 Responsivo (mobile / tablet / desktop)
              </span>
              <span className="rounded-full border border-zinc-700 px-3 py-1">
                🏷️ Cadastro de rótulos
              </span>
              <span className="rounded-full border border-zinc-700 px-3 py-1">
                📊 Visão rápida de vendas
              </span>
            </div>
          </section>

          {/* LADO DIREITO – CARD RESUMO */}
          <aside className="md:w-2/5">
            <div className="h-full rounded-3xl border border-amber-500/20 bg-gradient-to-br from-zinc-900/80 via-zinc-950 to-black p-5 shadow-xl shadow-black/40">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-amber-200">
                Visão geral da adega
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <p className="text-xs text-zinc-400">Produtos</p>
                    <p className="mt-2 text-2xl font-semibold text-amber-300">
                      --
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Total de rótulos cadastrados.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <p className="text-xs text-zinc-400">Categorias</p>
                    <p className="mt-2 text-2xl font-semibold text-amber-300">
                      --
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Agrupamentos para organizar o catálogo.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-xs text-zinc-300">
                  <p className="mb-1 text-[11px] uppercase tracking-wide text-zinc-400">
                    Próximos passos
                  </p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Cadastre algumas categorias (ex.: Tintos, Brancos).</li>
                    <li>Inclua seus primeiros rótulos no catálogo.</li>
                    <li>Acesse o gerenciador para atualizar estoque.</li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </main>

        <footer className="mt-8 border-t border-zinc-800 pt-4 text-center text-xs text-zinc-500">
          Diego&apos;s Adega • Projeto em desenvolvimento •{" "}
          <span className="text-amber-300">frontend Next.js</span>
        </footer>
      </div>
    </div>
  );
}
