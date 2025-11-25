// app/clientes/cadastrar/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, getAuthToken } from "@/lib/api";

export default function CadastrarClientePage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

   function handleCancelar() {
    router.back(); // volta pra página anterior
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      const resp = await fetch(`${API_BASE}/clientes/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome,
          email: email || null,
          telefone: telefone || null,
          cidade: cidade || null,
          estado: estado || null,
        }),
      });

      if (resp.status === 401 || resp.status === 403) {
        setErro("Você não tem permissão para cadastrar clientes.");
        if (resp.status === 401) {
          router.push("/login");
        }
        return;
      }

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.detail ?? "Erro ao cadastrar cliente.");
      }

      router.push("/clientes");
    } catch (error: any) {
      setErro(error.message ?? "Erro ao cadastrar cliente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-amber-200 mb-1">
        Cadastrar cliente
      </h1>
      <p className="text-sm text-zinc-400 mb-6">
        Preencha os dados do novo cliente.
      </p>

      <div className="flex justify-end gap-3 sm:flex-row">
            <button
            type="button"
            onClick={handleCancelar}
            className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-950 hover:bg-amber-400 transition"
          >
            ← Home
          </button>
        </div>

      {erro && (
        <div className="mb-4 rounded-xl border border-red-700 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-300">Nome *</label>
          <input
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-300">E-mail</label>
          <input
            type="email"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-300">Telefone</label>
          <input
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="mb-1 block text-sm text-zinc-300">Cidade</label>
            <input
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Estado</label>
            <input
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400"
              maxLength={2}
              value={estado}
              onChange={(e) => setEstado(e.target.value.toUpperCase())}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push("/clientes")}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900/60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Salvar cliente"}
          </button>
        </div>
      </form>
    </main>
  );
}
