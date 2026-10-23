"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdegaPageShell from "@/components/AdegaPageShell";
import { API_BASE, getAuthToken } from "@/lib/api";

type Entrada = { id:number; produto_id:number; quantidade:number; minimo_alerta?:string|null; criado_em:string };
type Produto = { id:number; nome:string };
const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const action = "inline-flex items-center justify-center rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700";

export default function EstoquePage() {
  const router = useRouter();
  const [itens,setItens] = useState<Entrada[]>([]);
  const [produtos,setProdutos] = useState<Produto[]>([]);
  const [busca,setBusca] = useState("");
  const [loading,setLoading] = useState(true);
  const [erro,setErro] = useState<string|null>(null);
  useEffect(()=>{
    const token = getAuthToken();
    if(!token){router.replace("/login");return;}
    let ativo = true;
    (async()=>{
      try {
        const headers = {Authorization:`Bearer ${token}`};
        const [re,rp] = await Promise.all([fetch(`${API_BASE}/estoque/`,{headers}),fetch(`${API_BASE}/produtos/`,{headers})]);
        if(re.status===401||rp.status===401){router.replace("/login");return;}
        if(re.status===403||rp.status===403) throw new Error("Acesso ao estoque bloqueado. Verifique a assinatura e as permissões da sua conta.");
        if(!re.ok||!rp.ok) throw new Error("Não foi possível carregar os dados do estoque.");
        const [e,p] = await Promise.all([re.json(),rp.json()]);
        if(ativo){setItens(e);setProdutos(p);}
      } catch(e) {if(ativo)setErro(e instanceof Error?e.message:"Erro ao carregar estoque.");}
      finally{if(ativo)setLoading(false);}
    })();
    return ()=>{ativo=false;};
  },[router]);
  const nomes = useMemo(()=>new Map(produtos.map(p=>[p.id,p.nome])),[produtos]);
  const filtrados = itens.filter(i=>`${nomes.get(i.produto_id)??""} ${i.produto_id} ${i.minimo_alerta??""}`.toLowerCase().includes(busca.toLowerCase()));
  const quantidade = itens.reduce((acc,item)=>acc+Number(item.quantidade||0),0);
  return <AdegaPageShell title="Estoque" subtitle="Movimentações e entradas" headerAction={<Link href="/estoque/cadastrar" className={action}>+ Nova entrada</Link>}>
    <div className="grid gap-4 sm:grid-cols-3">
      <section className={card}><p className="text-sm text-slate-500">Entradas registradas</p><p className="mt-2 text-3xl font-bold">{itens.length}</p></section>
      <section className={card}><p className="text-sm text-slate-500">Quantidade somada das entradas</p><p className="mt-2 text-3xl font-bold">{quantidade.toLocaleString("pt-BR")}</p></section>
      <section className={card}><p className="text-sm text-slate-500">Produtos com entradas</p><p className="mt-2 text-3xl font-bold">{new Set(itens.map(i=>i.produto_id)).size}</p></section>
    </div>
    <section className={card}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Histórico de entradas</h2><p className="text-sm text-slate-500">Consulte as movimentações da sua adega</p></div><input aria-label="Pesquisar estoque" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-orange-400 sm:w-72" placeholder="Buscar produto ou ID..." value={busca} onChange={e=>setBusca(e.target.value)}/></div>
      {loading?<p className="py-10 text-center text-slate-500">Carregando estoque...</p>:erro?<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{erro}</p>:<div className="overflow-x-auto"><table className="w-full min-w-[660px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-slate-500"><tr><th className="px-4 py-3">Produto</th><th className="px-4 py-3">Quantidade</th><th className="px-4 py-3">Mínimo / alerta</th><th className="px-4 py-3">Data</th><th className="px-4 py-3">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{filtrados.map(i=><tr key={i.id} className="hover:bg-slate-50"><td className="px-4 py-4 font-medium">{nomes.get(i.produto_id)??`Produto #${i.produto_id}`}</td><td className="px-4 py-4">{i.quantidade}</td><td className="px-4 py-4 text-slate-600">{i.minimo_alerta||"—"}</td><td className="px-4 py-4 text-slate-600">{i.criado_em?new Date(i.criado_em).toLocaleDateString("pt-BR"):"—"}</td><td className="px-4 py-4"><Link className="text-sm font-semibold text-orange-700 hover:underline" href={`/estoque/${i.id}/editar`}>Editar</Link></td></tr>)}</tbody></table>{filtrados.length===0&&<p className="py-12 text-center text-sm text-slate-500">Nenhuma entrada encontrada.</p>}</div>}
    </section>
    <p className="text-xs text-slate-500">Os indicadores representam entradas registradas, não o saldo líquido disponível após as vendas.</p>
  </AdegaPageShell>;
}
