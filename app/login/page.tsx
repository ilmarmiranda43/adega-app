"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, salvarSessao, obterUsuarioAtual, limparSessao } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const usuarioLogado = typeof window !== "undefined" ? obterUsuarioAtual() : null;

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const resp = await login(email, senha);
      salvarSessao(resp);
      router.push("/produtos/gerenciar");
    } catch (err) {
      console.error(err);
      setErro("E-mail ou senha inválidos.");
    } finally {
      setCarregando(false);
    }
  }

  function handleLogout() {
    limparSessao();
    router.refresh();
  }

  async function autenticar() {
    const res = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        email,
        senha
        }),
    });

    const data = await res.json();

    if (data.access_token) {
        document.cookie = `token=${data.access_token}; path=/;`;
        window.location.href = "/";
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-zinc-950 to-black text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍷</span>
            <div>
              <h1 className="text-xl font-semibold tracking-wide">
                Adega Essentia
              </h1>
              <p className="text-xs text-zinc-400">
                Acesso ao painel administrativo.
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="text-xs text-amber-200 hover:text-amber-100 underline"
          >
            ← Voltar para Home
          </Link>
        </header>

        <main className="flex-1">
          <div className="rounded-2xl border border-amber-900/60 bg-zinc-900/70 p-5 shadow-lg shadow-black/50">
            {usuarioLogado ? (
              <div className="space-y-3 text-sm">
                <p>
                  Logado como{" "}
                  <span className="font-semibold text-amber-200">
                    {usuarioLogado.nome}
                  </span>{" "}
                  ({usuarioLogado.perfil})
                </p>
                <div className="flex gap-2">
                  <Link
                    href="/produtos/gerenciar"
                    className="flex-1 rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-amber-500"
                  >
                    Ir para Gerenciar Produtos
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="rounded-full border border-zinc-600 px-4 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-800/60"
                  >
                    Sair
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="mb-4 text-lg font-semibold">
                  Entrar no painel
                </h2>

                {erro && (
                  <p className="mb-3 text-sm text-red-400">
                    {erro}
                  </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-3 text-sm">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-300">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-50 outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-zinc-300">
                      Senha
                    </label>
                    <input
                      type="password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-50 outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={carregando}
                    className="mt-3 w-full rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {carregando ? "Entrando..." : "Entrar"}
                  </button>
                </form>
              </>
            )}
          </div>
        </main>

        <footer className="mt-6 text-center text-[11px] text-zinc-500">
          Perfis suportados: admin, gerente, usuario, cliente.
        </footer>
      </div>
    </div>
  );
}
