"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import AdegaPageShell from "@/components/AdegaPageShell";
import {listarPedidos,atualizarStatusPedido,type PedidoRead} from "@/lib/api/pedidos";
import {API_BASE,getAuthToken} from "@/lib/api";

const card="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const money=(v:unknown)=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const badges:Record<string,string>={aberto:"bg-amber-50 text-amber-800",confirmado:"bg-emerald-50 text-emerald-700",cancelado:"bg-red-50 text-red-700"};

export default function PedidosPage(){
  const [pedidos,setPedidos]=useState<PedidoRead[]>([]);
  const [statusFiltro,setStatusFiltro]=useState("");
  const [clienteFiltro,setClienteFiltro]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState<number|null>(null);
  const [erro,setErro]=useState<string|null>(null);
  const [selecionado,setSelecionado]=useState<PedidoRead|null>(null);
  const [nomes,setNomes]=useState<Record<number,string>>({});

  async function carregar(){
    try{setLoading(true);setErro(null);setPedidos(await listarPedidos(statusFiltro||undefined,clienteFiltro?Number(clienteFiltro):undefined));}
    catch(e){setErro(e instanceof Error?e.message:"Não foi possível carregar os pedidos.");}
    finally{setLoading(false);}
  }
  useEffect(()=>{void carregar();/* eslint-disable-next-line react-hooks/exhaustive-deps */},[statusFiltro,clienteFiltro]);
  useEffect(()=>{
    let ativo=true;
    (async()=>{
      const token=getAuthToken();if(!token)return;
      try{const r=await fetch(`${API_BASE}/produtos/`,{headers:{Authorization:`Bearer ${token}`}});
        if(!r.ok)return;
        const dados: {id:number;nome:string}[]=await r.json();
        if(ativo)setNomes(Object.fromEntries(dados.map(p=>[p.id,p.nome])));
      }catch{/* Nomes são informações complementares. */}
    })();return()=>{ativo=false;};
  },[]);
  async function alterar(id:number,novoStatus:string){
    if(!window.confirm(`Deseja ${novoStatus==="confirmado"?"confirmar":"cancelar"} o pedido #${id}?`))return;
    try{setBusy(id);setErro(null);await atualizarStatusPedido(id,novoStatus);await carregar();setSelecionado(null);}
    catch(e){setErro(e instanceof Error?e.message:"Não foi possível alterar o pedido.");}
    finally{setBusy(null);}
  }
  const abertos=useMemo(()=>pedidos.filter(p=>p.status==="aberto").length,[pedidos]);
  const confirmados=useMemo(()=>pedidos.filter(p=>p.status==="confirmado").length,[pedidos]);
  return <AdegaPageShell title="Pedidos e vendas" subtitle="Acompanhe as vendas da sua adega" headerAction={<Link href="/pedidos/novo" className="inline-flex rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700">+ Novo pedido</Link>}>
    <div className="grid gap-4 sm:grid-cols-3">
      <section className={card}><p className="text-sm text-slate-500">Pedidos exibidos</p><p className="mt-2 text-3xl font-bold">{pedidos.length}</p></section>
      <section className={card}><p className="text-sm text-slate-500">Em aberto</p><p className="mt-2 text-3xl font-bold text-amber-700">{abertos}</p></section>
      <section className={card}><p className="text-sm text-slate-500">Confirmados</p><p className="mt-2 text-3xl font-bold text-emerald-700">{confirmados}</p></section>
    </div>
    <section className={card}>
      <div className="mb-5"><h2 className="font-semibold text-slate-900">Consultar pedidos</h2><p className="text-sm text-slate-500">Filtre os registros e acompanhe os detalhes</p></div>
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="text-sm font-medium text-slate-700">Status<select value={statusFiltro} onChange={e=>setStatusFiltro(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">Todos</option><option value="aberto">Aberto</option><option value="confirmado">Confirmado</option><option value="cancelado">Cancelado</option></select></label>
        <label className="text-sm font-medium text-slate-700">ID do cliente<input value={clienteFiltro} onChange={e=>setClienteFiltro(e.target.value)} type="number" min="1" placeholder="Ex.: 10" className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"/></label>
        <button type="button" onClick={()=>{setStatusFiltro("");setClienteFiltro("");}} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Limpar filtros</button>
      </div>
      {erro&&<p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{erro}</p>}
      {loading?<p className="py-10 text-center text-slate-500">Carregando pedidos...</p>:<div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-slate-500"><tr><th className="px-4 py-3">Pedido</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Data</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Itens</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{pedidos.map(p=><tr key={p.id} className="hover:bg-slate-50"><td className="px-4 py-4 font-semibold">#{p.id}</td><td className="px-4 py-4">#{p.cliente_id}</td><td className="px-4 py-4 text-slate-600">{new Date(p.criado_em).toLocaleDateString("pt-BR")}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badges[p.status]??"bg-slate-100 text-slate-700"}`}>{p.status}</span></td><td className="px-4 py-4">{p.itens.reduce((n,i)=>n+i.quantidade,0)}</td><td className="px-4 py-4 font-semibold">{money(p.valor_liquido)}</td><td className="px-4 py-4"><div className="flex gap-2"><button onClick={()=>setSelecionado(p)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-100">Detalhes</button>{p.status==="aberto"&&<><button disabled={busy===p.id} onClick={()=>void alterar(p.id,"confirmado")} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 disabled:opacity-50">Confirmar</button><button disabled={busy===p.id} onClick={()=>void alterar(p.id,"cancelado")} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50">Cancelar</button></>}</div></td></tr>)}</tbody></table>{pedidos.length===0&&<p className="py-12 text-center text-sm text-slate-500">Nenhum pedido encontrado.</p>}</div>}
    </section>
    {selecionado&&<div role="presentation" className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4" onMouseDown={e=>{if(e.target===e.currentTarget)setSelecionado(null);}}><section role="dialog" aria-modal="true" aria-label={`Detalhes do pedido ${selecionado.id}`} className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold">Pedido #{selecionado.id}</h2><p className="text-sm text-slate-500">{selecionado.observacoes||"Sem observações"}</p></div><button onClick={()=>setSelecionado(null)} aria-label="Fechar" className="rounded-lg border border-slate-200 px-3 py-1.5">✕</button></div><ul className="space-y-3">{selecionado.itens.map(i=><li key={i.id} className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 p-4 text-sm"><div><p className="font-semibold">{nomes[i.produto_id]??`Produto #${i.produto_id}`}</p><p className="text-slate-500">{i.quantidade} × {money(i.preco_unitario)}</p></div><p className="font-semibold">{money(i.total_liquido)}</p></li>)}</ul><p className="mt-4 text-right font-bold">Total: {money(selecionado.valor_liquido)}</p></section></div>}
  </AdegaPageShell>;
}
