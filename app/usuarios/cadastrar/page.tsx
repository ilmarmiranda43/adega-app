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

  // 1) Verificar permissão
  useEffect(() => {
    const usuarioAtual = obterUsuarioAtual();
    if (!usuarioAtual) {
      router.replace("/login");
      return;
    }

    // pega o "perfil cru" vindo da sessão (pode ser string ou objeto)
    const perfilBruto = (usuarioAtual as any)?.perfil;

    const perfilNome =
      typeof perfilBruto === "string"
        ? perfilBruto
        : perfilBruto?.nome;

    const perfilNormalizado = (perfilNome || "").toLowerCase();

    if (perfilNormalizado === "administrador" || perfilNormalizado === "admin" || perfilNormalizado === "gerente") {
      setAutorizado(true);
    } else {
      setAutorizado(false);
    }

    setVerificandoPermissao(false);
  }, [router]);

  // 2) Carrega perfis só se estiver autorizado
  useEffect(() => {
    if (!autorizado) return;

    async function carregarPerfis() {
      try {
        setCarregandoPerfis(true);
        setErro(null);

        const token = obterToken();
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const resp = await fetch(`${API_BASE}/perfis`, { headers });

        if (!resp.ok) {
          const txt = await resp.text();
          console.error("Erro ao carregar perfis:", resp.status, txt);
          throw new Error("Não foi possível carregar os perfis.");
        }

        const dados: Perfil[] = await resp.json();
        setPerfis(dados.filter((p) => p.ativo));
      } catch (err: any) {
        console.error(err);
        setErro(
          err?.message || "Erro ao carregar perfis. Tente novamente."
        );
      } finally {
        setCarregandoPerfis(false);
      }
    }

    carregarPerfis();
  }, [autorizado]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

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

    try {
      setSalvando(true);

      const resp = await fetch(`${API_BASE}/usuarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          email,
          senha,
          perfil_id: Number(perfilId),
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        console.error("Erro ao cadastrar usuário:", resp.status, txt);

        // tenta extrair mensagem amigável se veio JSON
        try {
          const json = JSON.parse(txt);
          if (json?.detail) {
            throw new Error(
              typeof json.detail === "string"
                ? json.detail
                : JSON.stringify(json.detail)
            );
          }
        } catch {
          // ignora erro de parse, usa mensagem padrão
        }

        throw new Error("Não foi possível cadastrar o usuário.");
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
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <p className="text-sm text-zinc-400">Verificando permissões...</p>
      </div>
    );
  }

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="rounded-2xl border border-red-600/60 bg-red-900/20 px-6 py-4 text-center">
          <h1 className="text-lg font-semibold text-red-200">
            Acesso negado
          </h1>
          <p className="mt-1 text-sm text-red-100/80">
            Apenas usuários com perfil <strong>Administrador</strong> ou{" "}
            <strong>Gerente</strong> podem cadastrar usuários.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        {/* Cabeçalho */}
        <header className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            {/* <h1 className="text-2xl font-semibold text-amber-300">
              {adegaNome || "Minha Adega"} - Cadastro de Usuários
            </h1> */}
            <header className="mb-4">
              <h1 className="text-xl font-semibold">
                {adegaNome || "Minha Adega"} - Cadastro de Usuários
              </h1>
              <p className="text-sm text-zinc-500">
                Olá, {userName} ({perfilNome})
              </p>
            </header>
            <p className="mt-1 text-sm text-zinc-400">
              Crie novos usuários e defina o perfil de acesso à adega.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCancelar}
            className="rounded-full border border-zinc-600 bg-zinc-900 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-200 hover:bg-zinc-800 transition"
          >
            ← Home
          </button>
        </header>

        {/* Mensagens */}
        {erro && (
          <div className="rounded-xl border border-red-500/60 bg-red-900/20 px-4 py-3 text-sm text-red-100">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="rounded-xl border border-emerald-500/60 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-100">
            {sucesso}
          </div>
        )}

        {/* Formulário */}
        <main className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Nome completo
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  E-mail
                </label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Senha
                </label>
                <input
                  type="password"
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  minLength={6}
                  maxLength={72}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Confirmar senha
                </label>
                <input
                  type="password"
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                  minLength={6}
                  maxLength={72}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Perfil
                </label>
                <select
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-60"
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
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium uppercase tracking-wide text-zinc-200 hover:bg-zinc-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-950 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {salvando ? "Salvando..." : "Cadastrar usuário"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
