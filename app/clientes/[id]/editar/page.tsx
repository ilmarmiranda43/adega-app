"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE, getAuthToken } from "@/lib/api";
import { obterUsuarioAtual } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

type Cliente = {
  id: number;
  adega_id: number;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  observacoes?: string | null;
  eh_whatsapp?: boolean | null;
};

type UsuarioAtual = {
  nome: string;
  perfil: string;
  perfil_id: number;
};

function getAdegaIdFromLocalStorage(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("adega_user");
  if (!raw) return null;

  try {
    const u = JSON.parse(raw);
    const id = Number(u?.adega_id);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    // em alguns casos vem com aspas extras
    try {
      const t = raw.trim();
      if (
        (t.startsWith("'") && t.endsWith("'")) ||
        (t.startsWith('"') && t.endsWith('"'))
      ) {
        const u2 = JSON.parse(t.slice(1, -1));
        const id2 = Number(u2?.adega_id);
        return Number.isFinite(id2) && id2 > 0 ? id2 : null;
      }
    } catch {
      // ignore
    }
    return null;
  }
}

export default function EditarClientePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const clienteId = Number(params?.id);

  const { userName, perfilNome, adegaNome } = useAuth();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [usuario, setUsuario] = useState<UsuarioAtual | null>(null);

  const isAdminOrManager =
    usuario &&
    (usuario.perfil_id === 1 ||
      usuario.perfil_id === 2 ||
      usuario.perfil_id === 7);

  const [form, setForm] = useState<Cliente>({
    id: clienteId,
    adega_id: 0,
    nome: "",
    email: "",
    telefone: "",
    observacoes: "",
    eh_whatsapp: true,
  });

  const token = useMemo(() => getAuthToken(), []);

  useEffect(() => {
    const u = obterUsuarioAtual() as UsuarioAtual | null;
    setUsuario(u);

    if (!token) {
      router.push("/login");
      return;
    }

    if (!Number.isFinite(clienteId) || clienteId <= 0) {
      setErro("ID do cliente inválido.");
      setLoading(false);
      return;
    }

    async function carregarCliente() {
      try {
        setLoading(true);
        setErro(null);

        const resp = await fetch(`${API_BASE}/clientes/${clienteId}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (resp.status === 401) {
          router.push("/login");
          return;
        }
        if (resp.status === 403) {
          setErro("Você não tem permissão para editar clientes.");
          return;
        }
        if (!resp.ok) {
          const t = await resp.text();
          throw new Error(`Erro ao carregar cliente: ${t}`);
        }

        const data = (await resp.json()) as Cliente;

        // ✅ Normaliza: nunca deixe adega_id virar string vazia
        setForm({
          ...data,
          adega_id: Number(data.adega_id) || 0,
          nome: data.nome ?? "",
          email: data.email ?? "",
          telefone: data.telefone ?? "",
          observacoes: data.observacoes ?? "",
          eh_whatsapp: data.eh_whatsapp ?? true,
        });
      } catch (e: any) {
        setErro(e?.message ?? "Erro ao carregar cliente.");
      } finally {
        setLoading(false);
      }
    }

    carregarCliente();
  }, [router, token, clienteId]);

  async function salvar() {
    if (!token) return router.push("/login");
    if (!isAdminOrManager) {
      setErro("Você não tem permissão para editar clientes.");
      return;
    }

    if (!form.nome?.trim()) {
      setErro("Informe o nome do cliente.");
      return;
    }

    // ✅ garante adega_id obrigatório
    const adegaId =
      (Number(form.adega_id) > 0 ? Number(form.adega_id) : null) ??
      getAdegaIdFromLocalStorage();

    if (!adegaId) {
      setErro(
        "Não foi possível identificar a adega (adega_id). Faça login novamente."
      );
      return;
    }

    setSalvando(true);
    setErro(null);
    setOkMsg(null);

    try {
      const resp = await fetch(`${API_BASE}/clientes/${clienteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adega_id: adegaId, // ✅ ESSENCIAL (backend exige)
          nome: form.nome.trim(),
          email: (form.email ?? "").trim() || null,
          telefone: (form.telefone ?? "").trim() || null,
          observacoes: (form.observacoes ?? "").trim() || null,
          eh_whatsapp: form.eh_whatsapp ?? true,
        }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`Erro ao salvar: ${t}`);
      }

      setOkMsg("Cliente atualizado com sucesso!");
    } catch (e: any) {
      setErro(e?.message ?? "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return <p className="p-4 text-zinc-200">Carregando cliente...</p>;
  }

  if (!isAdminOrManager) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          Você não tem permissão para editar clientes.
        </div>
        <button
          className="btn-secondary mt-4"
          onClick={() => router.push("/clientes")}
          type="button"
        >
          ← Voltar
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {adegaNome || "Minha Adega"} - Editar Cliente
          </h1>
          <p className="text-sm text-zinc-500">
            Olá, {userName} ({perfilNome})
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/clientes")}
            className="btn-primary"
          >
            Voltar
          </button>

          <button
            type="button"
            onClick={salvar}
            className="btn-primary"
            disabled={salvando}
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      {erro && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {erro}
        </div>
      )}
      {okMsg && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {okMsg}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs text-zinc-400">Nome *</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-zinc-300"
              value={form.nome ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, nome: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400">E-mail</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-zinc-100"
              value={form.email ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Telefone</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-zinc-300"
              value={form.telefone ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, telefone: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-zinc-400">Observações</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-zinc-300"
              value={form.observacoes ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, observacoes: e.target.value }))
              }
              rows={4}
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2 pt-1">
            <input
              id="eh_whatsapp"
              type="checkbox"
              checked={!!form.eh_whatsapp}
              onChange={(e) =>
                setForm((p) => ({ ...p, eh_whatsapp: e.target.checked }))
              }
            />
            <label htmlFor="eh_whatsapp" className="text-sm text-zinc-300">
              É WhatsApp?
            </label>
          </div>
        </div>
      </div>
    </main>
  );
}
