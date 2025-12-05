"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { NovaAdegaPayload } from "@/types/adega";
import { postComAuth } from "@/lib/api";

export default function NovaAdegaPage() {
  const router = useRouter();

  const [form, setForm] = useState<NovaAdegaPayload>({
    nome: "",
    cnpj: "",
    telefone: "",
    email: "",
    whatsapp_numero: "",
    textmebot_api_key: "",
    notificacao_ativa: false,
  });

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    setLoading(true);

    try {
      // ajuste o path se o endpoint for diferente (ex: "/adegas/")
      await postComAuth("/adegas/", form);

      setSucesso("Adega cadastrada com sucesso!");
      // opcional: limpar formulário
      // setForm({ ... });

      // depois de um tempo, redireciona para a lista
      setTimeout(() => {
        router.push("/adegas");
      }, 1200);
    } catch (err: any) {
      setErro(err.message || "Erro ao cadastrar adega.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 shadow-lg">
        <h1 className="text-2xl font-semibold mb-4 text-center">
          Cadastrar Adega
        </h1>
        <p className="text-sm text-zinc-400 mb-6 text-center">
          Preencha os dados abaixo para cadastrar uma nova adega.
        </p>

        {erro && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {sucesso}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label
              htmlFor="nome"
              className="block text-sm font-medium mb-1"
            >
              Nome da Adega
            </label>
            <input
              id="nome"
              name="nome"
              type="text"
              required
              value={form.nome}
              onChange={handleChange}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              placeholder="Adega da NANA"
            />
          </div>

          {/* CNPJ */}
          <div>
            <label
              htmlFor="cnpj"
              className="block text-sm font-medium mb-1"
            >
              CNPJ
            </label>
            <input
              id="cnpj"
              name="cnpj"
              type="text"
              required
              value={form.cnpj}
              onChange={handleChange}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              placeholder="12.345.678/0001-90"
            />
          </div>

          {/* Telefone */}
          <div>
            <label
              htmlFor="telefone"
              className="block text-sm font-medium mb-1"
            >
              Telefone
            </label>
            <input
              id="telefone"
              name="telefone"
              type="text"
              required
              value={form.telefone}
              onChange={handleChange}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              placeholder="(11) 99999-0001"
            />
          </div>

          {/* E-mail */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1"
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              placeholder="contato@adeganana.com"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label
              htmlFor="whatsapp_numero"
              className="block text-sm font-medium mb-1"
            >
              Número do WhatsApp
            </label>
            <input
              id="whatsapp_numero"
              name="whatsapp_numero"
              type="text"
              required
              value={form.whatsapp_numero}
              onChange={handleChange}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              placeholder="+5511999997456"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Use o formato internacional com DDI. Ex: +55...
            </p>
          </div>

          {/* TextMeBot API Key (opcional) */}
          <div>
            <label
              htmlFor="textmebot_api_key"
              className="block text-sm font-medium mb-1"
            >
              TextMeBot API Key{" "}
              <span className="text-xs text-zinc-500">
                (opcional)
              </span>
            </label>
            <input
              id="textmebot_api_key"
              name="textmebot_api_key"
              type="text"
              value={form.textmebot_api_key}
              onChange={handleChange}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              placeholder="Chave da API do TextMeBot"
            />
          </div>

          {/* Notificação ativa */}
          <div className="flex items-center gap-2">
            <input
              id="notificacao_ativa"
              name="notificacao_ativa"
              type="checkbox"
              checked={form.notificacao_ativa}
              onChange={handleChange}
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-amber-400 focus:ring-amber-400"
            />
            <label
              htmlFor="notificacao_ativa"
              className="text-sm text-zinc-200"
            >
              Ativar notificações para esta adega
            </label>
          </div>

          {/* Botões */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              Voltar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {loading ? "Salvando..." : "Salvar Adega"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
