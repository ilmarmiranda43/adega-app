"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export type MenuItem = { label: string; href: string; icon?: string };
export type MenuSection = { title: string; items: MenuItem[] };

type AppLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  adegaNome?: string;
  usuarioNome?: string;
  usuarioPerfil?: string;
  sections: MenuSection[];
  onLogout: () => void;
  headerAction?: ReactNode;
};

function NavSections({
  sections,
  pathname,
  close,
}: {
  sections: MenuSection[];
  pathname: string;
  close: () => void;
}) {
  return (
    <nav aria-label="Navegação principal" className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {section.title}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 ${
                    active
                      ? "bg-orange-50 text-orange-800"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-base text-orange-700">
                    {item.icon ?? "•"}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function AppLayout({
  children,
  title,
  subtitle,
  adegaNome = "Minha Adega",
  usuarioNome = "Usuário",
  usuarioPerfil = "",
  sections,
  onLogout,
  headerAction,
}: AppLayoutProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [menuOpen]);

  const navigation = (
    <>
      <Link href="/" onClick={() => setMenuOpen(false)} className="mb-8 flex items-center gap-3 rounded-xl px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-xl" aria-hidden="true">🍷</span>
        <span className="min-w-0">
          <span className="block truncate font-bold text-slate-900">{adegaNome}</span>
          <span className="block text-xs text-slate-500">Painel de gestão</span>
        </span>
      </Link>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <NavSections sections={sections} pathname={pathname} close={() => setMenuOpen(false)} />
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-400">IMBEBI Tec · Menu v2026.10.27.2</p>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white px-4 py-6 lg:flex">
        {navigation}
      </aside>

      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          aria-label="Fechar menu de navegação"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        id="mobile-navigation"
        aria-label="Menu mobile"
        aria-hidden={!menuOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden bg-white p-5 shadow-xl transition-transform lg:hidden ${menuOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"}`}
      >
        <button type="button" onClick={() => setMenuOpen(false)} className="mb-5 self-end rounded-lg border border-slate-200 px-3 py-1.5 text-sm">Fechar ✕</button>
        {navigation}
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              className="rounded-xl border border-slate-200 px-3 py-2 lg:hidden"
            >
              ☰
            </button>
            <div>
              {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
              <h1 className="text-lg font-bold sm:text-xl">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {headerAction}
            <div className="hidden max-w-48 text-right sm:block">
              <div className="truncate text-sm font-semibold">{usuarioNome}</div>
              <div className="truncate text-xs text-slate-500">{usuarioPerfil || "Usuário"}</div>
            </div>
            <button type="button" onClick={onLogout} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50">Sair</button>
          </div>
        </header>
        <main id="conteudo" className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
