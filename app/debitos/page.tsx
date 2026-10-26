"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

  // ✅ NOVO: flag de WhatsApp enviado (se vier do backend)
  whatsapp_enviado?: boolean | null;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("adega_token");
}

function getAdegaUser(): AdegaUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("adega_user");
  if (!raw) return null;

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

import AdegaPageShell from "@/components/AdegaPageShell";

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

  // conexão do WhatsApp/Baileys
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [whatsappStatus, setWhatsappStatus] = useState<string>("");
  const [whatsappConectado,setWhatsappConectado] = useState(false);
  const [conectandoWhatsapp, setConectandoWhatsapp] = useState(false);
  const intervaloQrRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutQrRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function pararConsultaQr() {
    if (intervaloQrRef.current) {
      clearInterval(intervaloQrRef.current);
      intervaloQrRef.current = null;
    }

    if (timeoutQrRef.current) {
      clearTimeout(timeoutQrRef.current);
      timeoutQrRef.current = null;
    }
  }

  useEffect(() => {
    return () => pararConsultaQr();
  }, []);

  async function lerRespostaErro(response: Response, fallback: string) {
    const texto = await response.text();
    if (!texto) return fallback;

    try {
      const data = JSON.parse(texto);
      return data?.detail || data?.erro || fallback;
    } catch {
      return texto;
    }
  }

  async function consultarQrWhatsapp(aid: number) {
    const response = await fetch(
      `${API_BASE}/debitos/whatsapp/${aid}/qr`,
      {
        headers,
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        await lerRespostaErro(response, "Não foi possível consultar o QR Code.")
      );
    }

    const resultado = await response.json();

    if (resultado.conectado) {
      pararConsultaQr();
      setQrCode(null);
      setConectandoWhatsapp(true);
      setWhatsappStatus("WhatsApp conectado com sucesso!");
      return true;
    }

    if (resultado.qr_code) {
      setQrCode(resultado.qr_code);
      setWhatsappStatus("Leia o QR Code com o aplicativo WhatsApp.");
    } else {
      setWhatsappStatus("Gerando QR Code...");
    }

    return false;
  }

  async function conectarWhatsApp() {
    setWhatsappConectado(false);
    if (!adegaId) {
      setWhatsappStatus("Não foi possível identificar a adega do usuário.");
      return;
    }

    pararConsultaQr();
    setQrCode(null);
    setConectandoWhatsapp(true);
    setWhatsappStatus("Iniciando conexão com o WhatsApp...");

    try {
      const response = await fetch(
        `${API_BASE}/debitos/whatsapp/${adegaId}/conectar`,
        {
          method: "POST",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(
          await lerRespostaErro(response, "Não foi possível iniciar a conexão.")
        );
      }

      const conectado = await consultarQrWhatsapp(adegaId);
      if (conectado) return;

      intervaloQrRef.current = setInterval(() => {
        consultarQrWhatsapp(adegaId).catch((erro) => {
          pararConsultaQr();
          setConectandoWhatsapp(false);
          setWhatsappStatus(
            erro instanceof Error ? erro.message : "Erro ao consultar o QR Code."
          );
        });
      }, 2000);

      timeoutQrRef.current = setTimeout(() => {
        pararConsultaQr();
        setConectandoWhatsapp(false);
        setWhatsappStatus(
          "O QR Code expirou. Clique em Conectar WhatsApp para tentar novamente."
        );
        setQrCode(null);
      }, 120000);
    } catch (erro) {
      pararConsultaQr();
      setConectandoWhatsapp(false);
      setWhatsappStatus(
        erro instanceof Error ? erro.message : "Erro ao conectar o WhatsApp."
      );
    }
  }

  async function verificarStatusWhatsapp(
  aid: number
) {
  try {
    const response = await fetch(
      `${API_BASE}/debitos/whatsapp/${aid}/status`,
      {
        headers,
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        await lerRespostaErro(
          response,
          "Não foi possível consultar o WhatsApp."
        )
      );
    }

    const resultado = await response.json();

    if (resultado.conectado) {
      setWhatsappConectado(true);
      setWhatsappStatus(
        resultado.sessao?.telefone
          ? `WhatsApp conectado: +${resultado.sessao.telefone}`
          : "WhatsApp conectado"
      );
    } else {
      setWhatsappConectado(false);

      const status =
        resultado.status ||
        resultado.sessao?.status ||
        "desconectado";

      if (status === "conectando") {
        setWhatsappStatus(
          "WhatsApp conectando..."
        );
      } else if (status === "aguardando_qr") {
        setWhatsappStatus(
          "Aguardando leitura do QR Code"
        );
      } else {
        setWhatsappStatus(
          "WhatsApp desconectado"
        );
      }
    }
  } catch (erro) {
    setWhatsappConectado(false);

    setWhatsappStatus(
      erro instanceof Error
        ? erro.message
        : "Não foi possível consultar o WhatsApp."
    );
  }
}

useEffect(() => {
  if (!adegaId) return;

  verificarStatusWhatsapp(adegaId);

  const intervalo = setInterval(() => {
    verificarStatusWhatsapp(adegaId);
  }, 10000);

  return () => clearInterval(intervalo);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [adegaId]);


  async function carregarTudo(aid: number, opts?: { marcarWhatsappEnviadoId?: number }) {
    
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

      // const debitosData = (await rDebitos.json()) as Debito[];
      const debitosRaw = (await rDebitos.json()) as any[];

      console.log("Débitos RAW do backend:", debitosRaw);
      console.log(
        "whatsapp_enviado values:",
        Array.isArray(debitosRaw) ? debitosRaw.map((d: any) => d.whatsapp_enviado) : debitosRaw
      );


      const debitosData: Debito[] = debitosRaw.map((d) => ({
        ...d,
        // garante boolean consistente vindo do backend (true/false, 1/0, "true"/"false")
        whatsapp_enviado:
          d.whatsapp_enviado === true ||
          d.whatsapp_enviado === 1 ||
          d.whatsapp_enviado === "true"
            ? true
            : d.whatsapp_enviado === false ||
              d.whatsapp_enviado === 0 ||
              d.whatsapp_enviado === "false"
            ? false
            : null,
      }));

      const debitosAjustados =
        opts?.marcarWhatsappEnviadoId
          ? debitosData.map((d) =>
              d.id === opts.marcarWhatsappEnviadoId
                ? { ...d, whatsapp_enviado: true }
                : d
            )
          : debitosData;

      setDebitos(debitosAjustados);
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

  // ✅ helper: atualiza um débito no estado (sem precisar recarregar tudo)
  function patchDebitoLocal(debitoId: number, patch: Partial<Debito>) {
    setDebitos((prev) =>
      prev.map((d) => (d.id === debitoId ? { ...d, ...patch } : d))
    );
  }

  // ✅ tenta persistir um patch no backend
  async function fecharDebitoBackend(debitoId: number) {
  const res = await fetch(`${API_BASE}/debitos/${debitoId}/fechar`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
}

async function marcarWhatsAppBackend(debitoId: number) {
  const res = await fetch(`${API_BASE}/debitos/${debitoId}/marcar-whatsapp`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
}


  async function fecharDebito(debitoId: number) {
    setLoading(true);
    setMsg("");

    // otimista (UI responde na hora)
    patchDebitoLocal(debitoId, { status: "pago" });

    try {
      await fecharDebitoBackend(debitoId);
      setMsg("Débito fechado com sucesso!");
    } catch (e: any) {
      // rollback se falhar
      patchDebitoLocal(debitoId, { status: "aberto" });
      setMsg(
        `Não consegui fechar no backend. Verifique se existe PATCH /debitos/{id}. Detalhes: ${
          e?.message ?? "erro"
        }`
      );
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

      // ✅ marca local
      patchDebitoLocal(debitoId, { whatsapp_enviado: true });

      console.log("Status : " + debitoId)

      // ✅ tenta persistir no backend (se existir campo/rota)
      try {
        await marcarWhatsAppBackend(debitoId);
      } catch {
        // se ainda não tem no backend, tudo bem: não quebra o fluxo
      }

      setMsg("Mensagem enviada com sucesso!");
    } catch (e: any) {
      setMsg(e?.message ?? "Erro ao enviar WhatsApp.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdegaPageShell title="Débitos avulsos" subtitle="Disponível somente quando o módulo estiver habilitado na API">
    <div className="text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Débitos avulsos</h1>
            <p className="text-sm text-slate-500">
              Cadastre débitos sem pedido, feche quando pago e envie cobrança via WhatsApp.
            </p>
            {adegaId ? (
              <p className="mt-1 text-xs text-slate-500">
                Adega:{" "}
                <span className="text-slate-700">
                  {adegaNome ? adegaNome : `#${adegaId}`}
                </span>
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
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
              className="btn-primary"
              disabled={loading || !adegaId}
            >
              Atualizar
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="btn-primary"
            >
              Home
            </button>
          </div>
        </div>

        {!getToken() ? (
          <div className="mt-4 rounded-lg border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-700">
            Nenhum token encontrado no <b>localStorage</b> (chave{" "}
            <code>adega_token</code>). Faça login novamente.
          </div>
        ) : null}

        {!adegaId ? (
          <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
            Não encontrei <code>adega_id</code> no <code>adega_user</code>. Verifique
            se você salva o usuário no localStorage com a chave{" "}
            <b>adega_user</b>.
          </div>
        ) : null}

        {msg ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            {msg}
          </div>
        ) : null}

        {/* Conexão WhatsApp/Baileys */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">
                Conexão do WhatsApp
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Conecte o WhatsApp da adega antes de enviar cobranças.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    whatsappConectado
                      ? "bg-emerald-400"
                      : "bg-red-400"
                  }`}
                />

                <span
                  className={`text-xs ${
                    whatsappConectado
                      ? "text-emerald-300"
                      : "text-slate-500"
                  }`}
                >
                  {whatsappStatus ||
                    "Consultando status..."}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={conectarWhatsApp}
              disabled={!adegaId ||conectandoWhatsapp ||whatsappConectado}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {/* {conectandoWhatsapp ? "Conectando..." : "Conectar WhatsApp"} */}
              {whatsappConectado? "WhatsApp conectado": conectandoWhatsapp? "Conectando...": "Conectar WhatsApp"}
            </button>
          </div>

          {whatsappStatus ? (
            <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              {whatsappStatus}
            </div>
          ) : null}

          {qrCode ? (
            <div className="mt-4 flex flex-col items-center rounded-xl bg-white p-4 text-center text-white">
              <p className="mb-3 max-w-md text-sm">
                No celular, abra o WhatsApp, acesse <b>Dispositivos conectados</b>,
                selecione <b>Conectar dispositivo</b> e leia o código abaixo.
              </p>

              <img
                src={qrCode}
                alt="QR Code para conectar o WhatsApp"
                width={350}
                height={350}
                className="h-auto w-full max-w-[350px]"
              />
            </div>
          ) : null}
        </div>

        {/* Form */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-700">Novo débito</h2>

          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="text-xs text-slate-500">Cliente</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
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
              <label className="text-xs text-slate-500">Valor (R$)</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ex: 35,90"
                disabled={loading || !adegaId}
                inputMode="decimal"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500">Vencimento</label>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                disabled={loading || !adegaId}
              />
            </div>

            <div className="md:col-span-4">
              <label className="text-xs text-slate-500">Descrição</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
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
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full">
            <thead className="bg-white">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3">Status</th>

                {/* ✅ NOVO */}
                <th className="px-4 py-3">WhatsApp</th>

                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-900 bg-white">
              {debitos.map((d) => (
                <tr key={d.id} className="text-sm">
                  <td className="px-4 py-3">{clienteNome(d.cliente_id)}</td>
                  <td className="px-4 py-3">{brl(d.valor)}</td>
                  <td className="px-4 py-3">{d.vencimento ?? "—"}</td>
                  <td className="px-4 py-3">{d.status}</td>

                  {/* ✅ NOVO */}
                  <td className="px-4 py-3">
                    
                    {d.whatsapp_enviado ? (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                        Enviado
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-700/30 px-2 py-1 text-[11px] font-semibold text-slate-700">
                        Não enviado
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-slate-700">
                      {d.descricao ? d.descricao : "—"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => enviarWhatsApp(d.id)}
                        className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-white hover:bg-white disabled:opacity-50"
                        disabled={loading || d.status !== "aberto"}
                        title={
                          d.status !== "aberto"
                            ? "Somente débitos em aberto"
                            : "Enviar WhatsApp"
                        }
                      >
                        Enviar WhatsApp
                      </button>

                      {/* ✅ NOVO: Fechar débito */}
                      <button
                        onClick={() => fecharDebito(d.id)}
                        className="rounded-lg bg-amber-300 px-3 py-2 text-xs font-semibold text-black hover:bg-amber-200 disabled:opacity-50"
                        disabled={loading || d.status !== "aberto"}
                        title={
                          d.status !== "aberto"
                            ? "Somente débitos em aberto"
                            : "Marcar como pago"
                        }
                      >
                        Fechar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!debitos.length ? (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-sm text-slate-500"
                    colSpan={7}
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
    </AdegaPageShell>
  );
}