"use client";

import Link from "next/link";
import { useState } from "react";

const IMOVEIS_MENU = [
  { label: "Casas para Comprar", href: "/imoveis?tipo=casa&finalidade=venda" },
  { label: "Apartamentos para Comprar", href: "/imoveis?tipo=apartamento&finalidade=venda" },
  { label: "Terrenos", href: "/imoveis?tipo=terreno&finalidade=venda" },
  { label: "Imóveis Comerciais", href: "/imoveis?tipo=comercial&finalidade=venda" },
  { label: "Imóveis Rurais", href: "/imoveis?tipo=rural&finalidade=venda" },
  { label: "Galpões", href: "/imoveis?tipo=galpao&finalidade=venda" },
];

const ALUGUEL_MENU = [
  { label: "Casas para Alugar", href: "/imoveis?tipo=casa&finalidade=aluguel" },
  { label: "Apartamentos para Alugar", href: "/imoveis?tipo=apartamento&finalidade=aluguel" },
  { label: "Comerciais para Alugar", href: "/imoveis?tipo=comercial&finalidade=aluguel" },
  { label: "Temporada", href: "/imoveis?finalidade=temporada" },
];

export default function Header() {
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [menuMobile, setMenuMobile] = useState(false);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#B8860B" }}>
              <span className="text-white font-bold text-sm">GM</span>
            </div>
            <div className="leading-tight">
              <p className="font-bold text-gray-800 text-sm leading-none">GM Negócios</p>
              <p className="text-xs text-yellow-700 leading-none">Imobiliários</p>
            </div>
          </Link>

          {/* NAV DESKTOP */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-gray-700">
            {/* Comprar dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setMenuAberto("comprar")}
              onMouseLeave={() => setMenuAberto(null)}
            >
              <button className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-50 hover:text-yellow-700 transition-colors">
                Comprar
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {menuAberto === "comprar" && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50">
                  {IMOVEIS_MENU.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <Link href="/imoveis?finalidade=venda" className="block px-4 py-2.5 text-sm font-semibold text-yellow-700 hover:bg-yellow-50">
                      Ver todos para Comprar →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Alugar dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setMenuAberto("alugar")}
              onMouseLeave={() => setMenuAberto(null)}
            >
              <button className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-50 hover:text-yellow-700 transition-colors">
                Alugar
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {menuAberto === "alugar" && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50">
                  {ALUGUEL_MENU.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <Link href="/imoveis?finalidade=aluguel" className="block px-4 py-2.5 text-sm font-semibold text-yellow-700 hover:bg-yellow-50">
                      Ver todos para Alugar →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/sobre" className="px-3 py-2 rounded-lg hover:bg-gray-50 hover:text-yellow-700 transition-colors">
              Sobre
            </Link>
            <Link href="/contato" className="px-3 py-2 rounded-lg hover:bg-gray-50 hover:text-yellow-700 transition-colors">
              Contato
            </Link>
          </nav>

          {/* DIREITA */}
          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/5567998500610"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 text-sm text-green-700 font-medium hover:text-green-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-500">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.826L.057 23.882l6.204-1.626A11.933 11.933 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.894 0-3.662-.523-5.18-1.432l-.371-.22-3.844 1.007 1.027-3.748-.242-.385A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              (67) 99850-0610
            </a>

            <Link
              href="/imoveis"
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-colors"
              style={{ background: "#B8860B" }}
            >
              Buscar imóveis
            </Link>

            {/* Hamburger mobile */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMenuMobile(!menuMobile)}
            >
              {menuMobile ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* MENU MOBILE */}
        {menuMobile && (
          <div className="lg:hidden border-t border-gray-100 py-3 space-y-1">
            <p className="text-xs text-gray-400 font-semibold uppercase px-3 mb-2">Comprar</p>
            {IMOVEIS_MENU.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuMobile(false)}
                className="block px-3 py-2 text-sm text-gray-700 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg">
                {item.label}
              </Link>
            ))}
            <p className="text-xs text-gray-400 font-semibold uppercase px-3 mt-3 mb-2">Alugar</p>
            {ALUGUEL_MENU.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuMobile(false)}
                className="block px-3 py-2 text-sm text-gray-700 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg">
                {item.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 pt-3 mt-2 space-y-1">
              <Link href="/sobre" onClick={() => setMenuMobile(false)} className="block px-3 py-2 text-sm text-gray-700 hover:text-yellow-700">Sobre</Link>
              <Link href="/contato" onClick={() => setMenuMobile(false)} className="block px-3 py-2 text-sm text-gray-700 hover:text-yellow-700">Contato</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
