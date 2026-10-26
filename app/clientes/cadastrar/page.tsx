"use client";

import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, getAuthToken } from "@/lib/api";

import AdegaPageShell from "@/components/AdegaPageShell";

export default function CadastrarClientePage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [ehWhatsapp, setEhWhatsapp] = useState(true);      // 👈 novo
  const [observacoes, setObservacoes] = useState("");      // 👈 novo

  // você pode manter cidade/estado na UI se quiser,
  // mas não vou enviar pro backend porque o modelo não espera
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { userName, perfilNome, adegaNome, user } = useAuth();

  function handleCancelar() {
    router.back();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    if (!user?.adega_id) {
      setErro("Não foi possível identificar a adega do usuário.");
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
          adega_id: user.adega_id,                 // 👈 o que o back espera
          nome,
          email: email || null,
          telefone: telefone || null,
          eh_whatsapp: ehWhatsapp,                 // 👈 boolean
          observacoes: observacoes || null,        // 👈 string / null
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
    <AdegaPageShell title="Cadastrar cliente" subtitle="Painel de gestão">
    <main className="mx-auto max-w-xl px-4 py-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">
          {adegaNome || "Minha Adega"} - Cadastrar Cliente
        </h1>
        <p className="text-sm text-slate-500">
          Olá, {userName} ({perfilNome})
        </p>
      </header>
      <p className="mb-6 text-sm text-slate-500">
        Preencha os dados do novo cliente.
      </p>

      <div className="mb-4 flex justify-end gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleCancelar}
          className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-orange-700"
        >
          ← Home
        </button>
      </div>

      {erro && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-slate-700">Nome *</label>
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-700">E-mail</label>
          <input
            type="email"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-700">Telefone</label>
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
        </div>

        {/* checkbox eh_whatsapp */}
        <div className="flex items-center gap-2">
          <input
            id="eh_whatsapp"
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 bg-slate-50"
            checked={ehWhatsapp}
            onChange={(e) => setEhWhatsapp(e.target.checked)}
          />
          <label
            htmlFor="eh_whatsapp"
            className="text-sm text-slate-700"
          >
            Telefone é WhatsApp?
          </label>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-700">
            Observações
          </label>
          <textarea
            className="h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push("/clientes")}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Salvar cliente"}
          </button>
        </div>
      </form>
    </main>
    </AdegaPageShell>
  );
}