"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import AdegaPageShell from "@/components/AdegaPageShell";
import {API_BASE,getAuthToken} from "@/lib/api";

type Cliente={id:number;nome:string;email?:string|null;telefone?:string|null;endereco?:string|null;observacoes?:string|null};
const card="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
export default function ClientesPage(){
  const router=useRouter();
  const [clientes,setClientes]=useState<Cliente[]>([]);
  const [busca,setBusca]=useState("");
  const [loading,setLoading]=useState(true);
  const [erro,setErro]=useState<string|null>(null);
  useEffect(()=>{
    const token=getAuthToken();if(!token){router.replace("/login");return;}
    let ativo=true;
    (async()=>{try{
      const r=await fetch(`${API_BASE}/clientes/`,{headers:{Authorization:`Bearer ${token}`}});
      if(r.status===401){router.replace("/login");return;}
      if(r.status===403)throw new Error("Acesso aos clientes bloqueado. Verifique sua assinatura e permissões.");
      if(!r.ok)throw new Error("Não foi possível carregar os clientes.");
      const data=await r.json();if(ativo)setClientes(data);
    }catch(e){if(ativo)setErro(e instanceof Error?e.message:"Erro ao carregar clientes.");}
    finally{if(ativo)setLoading(false);}})();
    return()=>{ativo=false;};
  },[router]);
  const filtrados=useMemo(()=>clientes.filter(c=>`${c.nome} ${c.email??""} ${c.telefone??""}`.toLowerCase().includes(busca.toLowerCase())),[clientes,busca]);
  return <AdegaPageShell title="Clientes" subtitle="Relacionamento e cadastros" headerAction={<Link href="/clientes/cadastrar" className="inline-flex rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700">+ Novo cliente</Link>}>
    <div className="grid gap-4 sm:grid-cols-2"><section className={card}><p className="text-sm text-slate-500">Clientes cadastrados</p><p className="mt-2 text-3xl font-bold">{clientes.length}</p></section><section className={card}><p className="text-sm text-slate-500">Clientes com e-mail</p><p className="mt-2 text-3xl font-bold">{clientes.filter(c=>Boolean(c.email)).length}</p></section></div>
    <section className={card}><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Lista de clientes</h2><p className="text-sm text-slate-500">Consulte os contatos cadastrados</p></div><input className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-orange-400 sm:w-72" aria-label="Pesquisar clientes" placeholder="Buscar nome, e-mail ou telefone" value={busca} onChange={e=>setBusca(e.target.value)}/></div>
    {loading?<p className="py-10 text-center text-slate-500">Carregando clientes...</p>:erro?<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{erro}</p>:<div className="overflow-x-auto"><table className="w-full min-w-[740px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-slate-500"><tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3">E-mail</th><th className="px-4 py-3">Telefone</th><th className="px-4 py-3">Endereço</th><th className="px-4 py-3">Observações</th><th className="px-4 py-3">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{filtrados.map(c=><tr key={c.id} className="hover:bg-slate-50"><td className="px-4 py-4 font-semibold text-slate-900">{c.nome}</td><td className="px-4 py-4 text-slate-600">{c.email||"—"}</td><td className="px-4 py-4 text-slate-600">{c.telefone||"—"}</td><td className="px-4 py-4 text-slate-600">{c.endereco||"—"}</td><td className="max-w-48 truncate px-4 py-4 text-slate-600" title={c.observacoes??""}>{c.observacoes||"—"}</td><td className="px-4 py-4"><Link className="font-semibold text-orange-700 hover:underline" href={`/clientes/${c.id}/editar`}>Editar</Link></td></tr>)}</tbody></table>{filtrados.length===0&&<p className="py-12 text-center text-sm text-slate-500">Nenhum cliente encontrado.</p>}</div>}
    </section>
  </AdegaPageShell>;
}
