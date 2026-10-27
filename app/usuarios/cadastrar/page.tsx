"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obterUsuarioAtual, obterToken } from "@/lib/auth";

type Perfil = {
  id: number;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

import AdegaPageShell from "@/components/AdegaPageShell";

export default function CadastroUsuarioPage() {
  const router = useRouter();

  // estados de permissão
  const [autorizado, setAutorizado] = useState(false);
  const [verificandoPermissao, setVerificandoPermissao] = useState(true);

  // estados do form...
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [perfilId, setPerfilId] = useState<string>("");

  const [carregandoPerfis, setCarregandoPerfis] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const { userName, perfilNome, adegaNome, user } = useAuth();

  const adegaId = user?.adega_id;

  // 1) Verificar permissões armazenadas na sessão e no AuthContext.
  // Esta verificação é apenas visual: a API continua responsável por autorizar.
  useEffect(() => {
    const usuarioAtual = obterUsuarioAtual();
    if (!usuarioAtual && !user) {
      router.replace("/login");
      return;
    }

    type Sessao = {
      perfil?: string | {
        nome?: string;
        ativo?: boolean;
        eh_admin?: boolean;
        pode_gerenciar_usuarios?: boolean;
      } | null;
      perfil_nome?: string;
      eh_admin?: boolean;
      pode_gerenciar_usuarios?: boolean;
    };

    const atual = (usuarioAtual ?? {}) as Sessao;
    const contexto = (user ?? {}) as Sessao;
    const perfilSessao = typeof atual.perfil === "object" ? atual.perfil : null;
    const perfilContexto = typeof contexto.perfil === "object" ? contexto.perfil : null;

    const normalizar = (valor: unknown) =>
      typeof valor === "string"
        ? valor.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        : "";

    const nomes = [
      typeof atual.perfil === "string" ? atual.perfil : perfilSessao?.nome,
      atual.perfil_nome,
      typeof contexto.perfil === "string" ? contexto.perfil : perfilContexto?.nome,
      contexto.perfil_nome,
      perfilNome,
    ];

    const nomePermitido = nomes.some((nome) =>
      ["admin", "administrador", "gerente", "master"].includes(normalizar(nome))
    );
    const permissaoExplicita = [
      atual.eh_admin,
      atual.pode_gerenciar_usuarios,
      perfilSessao?.eh_admin,
      perfilSessao?.pode_gerenciar_usuarios,
      contexto.eh_admin,
      contexto.pode_gerenciar_usuarios,
      perfilContexto?.eh_admin,
      perfilContexto?.pode_gerenciar_usuarios,
    ].some((valor) => valor === true);

    const perfilInativo = perfilSessao?.ativo === false || perfilContexto?.ativo === false;
    setAutorizado(!perfilInativo && (nomePermitido || permissaoExplicita));
    setVerificandoPermissao(false);
  }, [router, user, perfilNome]);

  // 2) Carrega perfis só se estiver autorizado

  useEffect(() => {
    if (!autorizado || adegaId == null) return;

    async function carregarPerfis() {
      try {
        setCarregandoPerfis(true);
        setErro(null);

        const token = obterToken();

        const headers: HeadersInit = {};

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const resp = await fetch(
          `${API_BASE}/perfis/?adega_id=${encodeURIComponent(String(adegaId))}`,
          { headers }
        );

        if (!resp.ok) {
          const txt = await resp.text();

          console.error(
            "Erro ao carregar perfis:",
            resp.status,
            txt
          );

          throw new Error("Não foi possível carregar os perfis.");
        }

        const dados: Perfil[] = await resp.json();

        setPerfis(dados.filter((p) => p.ativo));

      } catch (err: any) {
        console.error(err);

        setErro(
          err?.message || "Erro ao carregar perfis."
        );

      } finally {
        setCarregandoPerfis(false);
      }
    }

    carregarPerfis();

  }, [autorizado, adegaId]);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!autorizado || adegaId == null) {
      setErro("Não foi possível validar sua adega e suas permissões. Faça login novamente.");
      return;
    }

    if (!perfilId) {
      setErro("Selecione um perfil para o usuário.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    const token = obterToken();
    if (!token) {
      setErro("Sessão expirada. Faça login novamente.");
      router.replace("/login");
      return;
    }

    try {
      setSalvando(true);

      const resp = await fetch(`${API_BASE}/usuarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome,
          email,
          senha,
          perfil_id: Number(perfilId),
          adega_id: Number(adegaId),
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        console.error("Erro ao cadastrar usuário:", resp.status, txt);

        let mensagem = "Não foi possível cadastrar o usuário.";
        try {
          const json = JSON.parse(txt);
          if (json?.detail) {
            mensagem = typeof json.detail === "string"
              ? json.detail
              : JSON.stringify(json.detail);
          }
        } catch {
          // O servidor pode responder sem JSON.
        }
        if (resp.status === 401) mensagem = "Sessão inválida ou expirada. Faça login novamente.";
        if (resp.status === 403) mensagem = "A API não autorizou seu usuário a cadastrar usuários nesta adega.";
        throw new Error(mensagem);
      }

      const data = await resp.json();
      console.log("Usuário criado:", data);

      setSucesso("Usuário cadastrado com sucesso!");
      setNome("");
      setEmail("");
      setSenha("");
      setConfirmarSenha("");
      setPerfilId("");

      // Se quiser redirecionar para uma listagem depois:
      // router.push("/usuarios");
    } catch (err: any) {
      console.error(err);
      setErro(err?.message || "Erro ao cadastrar usuário.");
    } finally {
      setSalvando(false);
    }
  }

  function handleCancelar() {
    router.back(); // volta pra página anterior
  }

  if (verificandoPermissao) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <p className="text-sm text-slate-500">Verificando permissões...</p>
      </div>
    );
  }

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-center">
          <h1 className="text-lg font-semibold text-red-700">
            Acesso negado
          </h1>
          <p className="mt-1 text-sm text-red-700">
            Apenas usuários com perfil <strong>Administrador</strong> ou{" "}
            <strong>Gerente</strong> podem cadastrar usuários.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdegaPageShell title="Cadastrar usuário" subtitle="Painel de gestão">
    <div className="text-slate-900">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        {/* Cabeçalho */}
        <header className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            {/* <h1 className="text-2xl font-semibold text-orange-700">
              {adegaNome || "Minha Adega"} - Cadastro de Usuários
            </h1> */}
            <header className="mb-4">
              <h1 className="text-xl font-semibold">
                {adegaNome || "Minha Adega"} - Cadastro de Usuários
              </h1>
              <p className="text-sm text-slate-500">
                Olá, {userName} ({perfilNome})
              </p>
            </header>
            <p className="mt-1 text-sm text-slate-500">
              Crie novos usuários e defina o perfil de acesso à adega.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCancelar}
            className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-700 hover:bg-slate-100 transition"
          >
            ← Home
          </button>
        </header>

        {/* Mensagens */}
        {erro && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {sucesso}
          </div>
        )}

        {/* Formulário */}
        <main className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nome completo
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 focus:ring-1 focus:ring-orange-200"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  E-mail
                </label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 focus:ring-1 focus:ring-orange-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Senha
                </label>
                <input
                  type="password"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 focus:ring-1 focus:ring-orange-200"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  minLength={6}
                  maxLength={72}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Confirmar senha
                </label>
                <input
                  type="password"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 focus:ring-1 focus:ring-orange-200"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                  minLength={6}
                  maxLength={72}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Perfil
                </label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 focus:ring-1 focus:ring-orange-200 disabled:opacity-60"
                  value={perfilId}
                  onChange={(e) => setPerfilId(e.target.value)}
                  disabled={carregandoPerfis || perfis.length === 0}
                  required
                >
                  <option value="">
                    {carregandoPerfis
                      ? "Carregando perfis..."
                      : "Selecione um perfil"}
                  </option>
                  {perfis.map((perfil) => (
                    <option key={perfil.id} value={perfil.id}>
                      {perfil.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelar}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-700 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {salvando ? "Salvando..." : "Cadastrar usuário"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
    </AdegaPageShell>
  );
}
