"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obterToken } from "@/lib/auth";
import AdegaPageShell from "@/components/AdegaPageShell";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
type Adega = { id: number; nome: string };
type Perfil = { id: number; nome: string; ativo: boolean; eh_admin: boolean };
type Usuario = { id: number; nome: string; email: string; perfil_id: number };
type Acesso = { usuario_id: number; adega_id: number; master: boolean };

async function requisicao<T>(rota: string, opcoes: RequestInit = {}): Promise<T> {
  const token = obterToken();
  if (!token) throw new Error("Sessão expirada. Faça login novamente.");
  const resposta = await fetch(`${API}${rota}`, {
    ...opcoes,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...opcoes.headers },
    cache: "no-store",
  });
  if (!resposta.ok) {
    let mensagem = `Falha na API (${resposta.status}).`;
    try { const corpo = await resposta.json(); if (typeof corpo.detail === "string") mensagem = corpo.detail; } catch {}
    throw new Error(mensagem);
  }
  return resposta.json() as Promise<T>;
}

export default function AdministracaoPage() {
  const router = useRouter();
  const [acesso, setAcesso] = useState<Acesso | null>(null);
  const [adegas, setAdegas] = useState<Adega[]>([]);
  const [adegaId, setAdegaId] = useState<number | null>(null);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfilId, setPerfilId] = useState("");
  const [novaAdega, setNovaAdega] = useState("");
  const [novoPerfil, setNovoPerfil] = useState("Admin");

  useEffect(() => {
    let ativo = true;
    async function iniciar() {
      try {
        const a = await requisicao<Acesso>("/gestao/me");
        const lista = await requisicao<Adega[]>("/gestao/adegas");
        if (!ativo) return;
        setAcesso(a); setAdegas(lista);
        setAdegaId(lista.find((item) => item.id === a.adega_id)?.id ?? lista[0]?.id ?? null);
      } catch (e) { if (ativo) setErro(e instanceof Error ? e.message : "Erro de autenticação."); }
      finally { if (ativo) setCarregando(false); }
    }
    void iniciar();
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    if (adegaId === null) return;
    let ativo = true;
    setErro(""); setPerfilId("");
    const q = `?adega_id=${encodeURIComponent(String(adegaId))}`;
    Promise.all([requisicao<Perfil[]>(`/gestao/perfis${q}`), requisicao<Usuario[]>(`/gestao/usuarios${q}`)])
      .then(([p, u]) => { if (ativo) { setPerfis(p); setUsuarios(u); } })
      .catch((e) => { if (ativo) { setPerfis([]); setUsuarios([]); setErro(e.message); } });
    return () => { ativo = false; };
  }, [adegaId]);

  async function cadastrar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setErro(""); setSucesso("");
    if (adegaId === null) return;
    try {
      setSalvando(true);
      await requisicao<Usuario>("/gestao/usuarios", { method: "POST", body: JSON.stringify({
        nome: nome.trim(), email: email.trim(), senha, perfil_id: Number(perfilId), adega_id: adegaId,
      }) });
      setSucesso("Usuário cadastrado com sucesso.");
      setNome(""); setEmail(""); setSenha(""); setPerfilId("");
      setUsuarios(await requisicao<Usuario[]>(`/gestao/usuarios?adega_id=${adegaId}`));
    } catch (e) { setErro(e instanceof Error ? e.message : "Falha ao cadastrar."); }
    finally { setSalvando(false); }
  }

  async function criarAdega(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setErro(""); setSucesso("");
    try {
      setSalvando(true);
      const criada = await requisicao<Adega>("/adegas/", {
        method: "POST", body: JSON.stringify({ nome: novaAdega.trim(), notificacao_ativa: false }),
      });
      setAdegas(await requisicao<Adega[]>("/gestao/adegas"));
      setAdegaId(criada.id); setNovaAdega("");
      setSucesso("Adega criada. Crie o perfil Admin antes de cadastrar o usuário.");
    } catch (e) { setErro(e instanceof Error ? e.message : "Falha ao criar adega."); }
    finally { setSalvando(false); }
  }

  async function criarPerfil(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setErro(""); setSucesso("");
    if (adegaId === null) return;
    try {
      setSalvando(true);
      const admin = novoPerfil === "Admin";
      const gerente = novoPerfil === "Gerente";
      await requisicao<Perfil>("/perfis/", { method: "POST", body: JSON.stringify({
        adega_id: adegaId, nome: novoPerfil, descricao: novoPerfil,
        eh_admin: admin, pode_gerenciar_usuarios: admin || gerente,
        pode_gerenciar_estoque: admin || gerente,
        pode_gerenciar_clientes: admin || gerente, ativo: true,
      }) });
      setPerfis(await requisicao<Perfil[]>(`/gestao/perfis?adega_id=${adegaId}`));
      setSucesso("Perfil criado com sucesso.");
    } catch (e) { setErro(e instanceof Error ? e.message : "Falha ao criar perfil."); }
    finally { setSalvando(false); }
  }

  const campo = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
  return (
    <AdegaPageShell title="Administração" subtitle="Adegas, perfis e usuários">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 text-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div><h1 className="text-2xl font-semibold">Gestão de acessos</h1>
            <p className="text-sm text-slate-500">Administre usuários e confira os perfis da adega selecionada.</p></div>
          <button type="button" onClick={() => router.push("/")} className="rounded-xl border px-4 py-2 text-sm">Início</button>
        </div>
        {carregando && <p>Carregando permissões...</p>}
        {erro && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{erro}</p>}
        {sucesso && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">{sucesso}</p>}
        {acesso && <>
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <label htmlFor="adega" className="mb-2 block text-sm font-semibold">Adega</label>
            <select id="adega" className={campo} value={adegaId ?? ""} onChange={e => setAdegaId(Number(e.target.value))} disabled={!acesso.master}>
              {adegas.map(a => <option key={a.id} value={a.id}>{a.nome} (ID {a.id})</option>)}
            </select>
            <p className="mt-2 text-xs text-slate-500">{acesso.master ? "Acesso global habilitado." : "Seu acesso está limitado à sua adega."}</p>
          </section>
          {acesso.master && <div className="grid gap-5 md:grid-cols-2">
            <section className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">Cadastrar adega</h2>
              <form onSubmit={criarAdega} className="space-y-3">
                <label className="block text-sm">Nome da adega<input required className={`${campo} mt-1`} value={novaAdega} onChange={e => setNovaAdega(e.target.value)} /></label>
                <button disabled={salvando} className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Criar adega</button>
              </form>
            </section>
            <section className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">Cadastrar perfil na adega selecionada</h2>
              <form onSubmit={criarPerfil} className="space-y-3">
                <label className="block text-sm">Tipo de perfil<select className={`${campo} mt-1`} value={novoPerfil} onChange={e => setNovoPerfil(e.target.value)}>
                  <option value="Admin">Admin</option><option value="Gerente">Gerente</option><option value="Usuário">Usuário</option>
                </select></label>
                <button disabled={salvando || adegaId === null} className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Criar perfil</button>
              </form>
            </section>
          </div>}
          <div className="grid gap-5 md:grid-cols-2">
            <section className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">Perfis cadastrados ({perfis.length})</h2>
              <div className="space-y-2">{perfis.map(p => <div key={p.id} className="flex justify-between rounded-lg border p-3 text-sm">
                <span>{p.nome} <span className="text-slate-400">#{p.id}</span></span>
                <span className={p.ativo ? "text-emerald-700" : "text-red-700"}>{p.ativo ? "Ativo" : "Inativo"}</span>
              </div>)}</div>
            </section>
            <section className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">Usuários ({usuarios.length})</h2>
              <div className="space-y-2">{usuarios.map(u => <div key={u.id} className="rounded-lg border p-3 text-sm">
                <div className="font-semibold">{u.nome}</div><div className="text-slate-500">{u.email}</div>
                <div className="text-xs text-orange-700">{perfis.find(p => p.id === u.perfil_id)?.nome ?? `Perfil #${u.perfil_id}`}</div>
              </div>)}</div>
            </section>
          </div>
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Cadastrar usuário nesta adega</h2>
            <form onSubmit={cadastrar} className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">Nome completo<input required minLength={2} className={`${campo} mt-1`} value={nome} onChange={e => setNome(e.target.value)}/></label>
              <label className="text-sm">E-mail<input type="email" required className={`${campo} mt-1`} value={email} onChange={e => setEmail(e.target.value)}/></label>
              <label className="text-sm">Senha inicial<input type="password" required minLength={6} maxLength={72} className={`${campo} mt-1`} value={senha} onChange={e => setSenha(e.target.value)}/></label>
              <label className="text-sm">Perfil<select required className={`${campo} mt-1`} value={perfilId} onChange={e => setPerfilId(e.target.value)}>
                <option value="">Selecione...</option>{perfis.filter(p => p.ativo && p.id !== 7).map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select></label>
              <div className="md:col-span-2"><button disabled={salvando || !perfilId} className="rounded-xl bg-orange-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {salvando ? "Salvando..." : "Cadastrar usuário"}</button></div>
            </form>
          </section>
        </>}
      </div>
    </AdegaPageShell>
  );
}
