"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;


type AdegaUser = {
  id: number;
  nome: string;
  email: string;
  perfil_id: number;
  adega_id: number | null;
  adega_nome?: string | null;
};

type Cliente = {
  id: number;
  nome: string;
  telefone?: string | null;
  eh_whatsapp?: boolean | null;
};

type Debito = {
  id: number;
  adega_id: number;
  cliente_id: number;
  valor: number;
  descricao?: string | null;
  status: "aberto" | "pago" | "cancelado";
  vencimento?: string | null;
  criado_em: string;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("adega_token");
}

function getAdegaUser(): AdegaUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("adega_user");
  if (!raw) return null;

  // Trata casos: JSON normal OU string com aspas extras
  try {
    return JSON.parse(raw) as AdegaUser;
  } catch {
    try {
      const t = raw.trim();
      if (
        (t.startsWith("'") && t.endsWith("'")) ||
        (t.startsWith('"') && t.endsWith('"'))
      ) {
        return JSON.parse(t.slice(1, -1)) as AdegaUser;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

function brl(v: number) {
  return `R$ ${Number(v).toFixed(2).replace(".", ",")}`;
}

export default function DebitosPage() {
    const router = useRouter();
  const [adegaId, setAdegaId] = useState<number | null>(null);
  const [adegaNome, setAdegaNome] = useState<string>("");

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [debitos, setDebitos] = useState<Debito[]>([]);
  const [statusFiltro, setStatusFiltro] = useState<Debito["status"] | "">(
    "aberto"
  );

  // form
  const [clienteId, setClienteId] = useState<number | "">("");
  const [valor, setValor] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");
  const [vencimento, setVencimento] = useState<string>("");

  // ui
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const headers = useMemo(() => {
    const token = getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  useEffect(() => {
    const u = getAdegaUser();
    if (u?.adega_id) {
      setAdegaId(u.adega_id);
      setAdegaNome(u.adega_nome ?? "");
    } else {
      setAdegaId(null);
      setAdegaNome("");
    }
  }, []);

  async function carregarTudo(aid: number) {
    setLoading(true);
    setMsg("");

    try {
      // 1) Clientes
      const rClientes = await fetch(`${API_BASE}/clientes/?adega_id=${aid}`, {
        headers,
        cache: "no-store",
      });

      if (!rClientes.ok) {
        const t = await rClientes.text();
        throw new Error(`Falha ao carregar clientes: ${t}`);
      }

      const clientesData = (await rClientes.json()) as Cliente[];
      setClientes(clientesData);

      // 2) Débitos
      const qsStatus = statusFiltro ? `&status=${statusFiltro}` : "";
      const rDebitos = await fetch(
        `${API_BASE}/debitos/?adega_id=${aid}${qsStatus}`,
        { headers, cache: "no-store" }
      );

      if (!rDebitos.ok) {
        const t = await rDebitos.text();
        throw new Error(`Falha ao carregar débitos: ${t}`);
      }

      const debitosData = (await rDebitos.json()) as Debito[];
      setDebitos(debitosData);
    } catch (e: any) {
      setMsg(e?.message ?? "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!adegaId) return;
    carregarTudo(adegaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adegaId, statusFiltro]);

  function clienteNome(id: number) {
    return clientes.find((c) => c.id === id)?.nome ?? `#${id}`;
  }

  async function criarDebito() {
    if (!adegaId) return setMsg("Não foi possível identificar a adega do usuário.");
    if (!clienteId) return setMsg("Selecione um cliente.");

    const v = Number(valor.replace(",", "."));
    if (!Number.isFinite(v) || v <= 0) return setMsg("Informe um valor válido.");

    setLoading(true);
    setMsg("");

    try {
      const body = {
        adega_id: adegaId,
        cliente_id: Number(clienteId),
        valor: v,
        descricao: descricao ? descricao : null,
        vencimento: vencimento ? vencimento : null,
      };

      const res = await fetch(`${API_BASE}/debitos/`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Erro ao criar débito: ${t}`);
      }

      // limpa form
      setClienteId("");
      setValor("");
      setDescricao("");
      setVencimento("");

      await carregarTudo(adegaId);
      setMsg("Débito criado com sucesso!");
    } catch (e: any) {
      setMsg(e?.message ?? "Erro ao criar débito.");
    } finally {
      setLoading(false);
    }
  }

  async function enviarWhatsApp(debitoId: number) {
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(
        `${API_BASE}/debitos/${debitoId}/enviar-whatsapp`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({}), // ou { mensagem: "..." }
        }
      );

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Falha ao enviar WhatsApp: ${t}`);
      }

      setMsg("Mensagem enviada com sucesso!");
    } catch (e: any) {
      setMsg(e?.message ?? "Erro ao enviar WhatsApp.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Débitos avulsos</h1>
            <p className="text-sm text-zinc-400">
              Cadastre débitos sem pedido e envie cobrança via WhatsApp.
            </p>
            {adegaId ? (
              <p className="mt-1 text-xs text-zinc-500">
                Adega:{" "}
                <span className="text-zinc-300">
                  {adegaNome ? adegaNome : `#${adegaId}`}
                </span>
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <select
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value as any)}
              disabled={loading}
            >
              <option value="">Todos</option>
              <option value="aberto">Abertos</option>
              <option value="pago">Pagos</option>
              <option value="cancelado">Cancelados</option>
            </select>

            <button
              onClick={() => adegaId && carregarTudo(adegaId)}
              className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-white disabled:opacity-50"
              disabled={loading || !adegaId}
            >
              Atualizar
            </button>
            <button
                type="button"
                onClick={() => router.push("/")}
                className="btn-secondary"
            >
                ← Home
          </button>
          </div>
        </div>

        {!getToken() ? (
          <div className="mt-4 rounded-lg border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            Nenhum token encontrado no <b>localStorage</b> (chave{" "}
            <code>adega_token</code>). Faça login novamente.
          </div>
        ) : null}

        {!adegaId ? (
          <div className="mt-4 rounded-lg border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
            Não encontrei <code>adega_id</code> no <code>adega_user</code>. Verifique
            se você salva o usuário no localStorage com a chave{" "}
            <b>adega_user</b>.
          </div>
        ) : null}

        {msg ? (
          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200">
            {msg}
          </div>
        ) : null}

        {/* Form */}
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-sm font-semibold text-zinc-200">Novo débito</h2>

          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="text-xs text-zinc-400">Cliente</label>
              <select
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm"
                value={clienteId}
                onChange={(e) =>
                  setClienteId(e.target.value ? Number(e.target.value) : "")
                }
                disabled={loading || !adegaId}
              >
                <option value="">Selecione...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-400">Valor (R$)</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ex: 35,90"
                disabled={loading || !adegaId}
                inputMode="decimal"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400">Vencimento</label>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                disabled={loading || !adegaId}
              />
            </div>

            <div className="md:col-span-4">
              <label className="text-xs text-zinc-400">Descrição</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Compra fiado no balcão"
                disabled={loading || !adegaId}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={criarDebito}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50"
              disabled={loading || !adegaId}
            >
              Salvar débito
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800">
          <table className="w-full">
            <thead className="bg-zinc-950">
              <tr className="text-left text-xs text-zinc-400">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-900 bg-black">
              {debitos.map((d) => (
                <tr key={d.id} className="text-sm">
                  <td className="px-4 py-3">{clienteNome(d.cliente_id)}</td>
                  <td className="px-4 py-3">{brl(d.valor)}</td>
                  <td className="px-4 py-3">{d.vencimento ?? "—"}</td>
                  <td className="px-4 py-3">{d.status}</td>
                  <td className="px-4 py-3">
                    <span className="text-zinc-300">
                      {d.descricao ? d.descricao : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => enviarWhatsApp(d.id)}
                      className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-950 hover:bg-white disabled:opacity-50"
                      disabled={loading || d.status !== "aberto"}
                      title={
                        d.status !== "aberto"
                          ? "Somente débitos em aberto"
                          : "Enviar WhatsApp"
                      }
                    >
                      Enviar WhatsApp
                    </button>
                  </td>
                </tr>
              ))}

              {!debitos.length ? (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                    colSpan={6}
                  >
                    Nenhum débito encontrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
