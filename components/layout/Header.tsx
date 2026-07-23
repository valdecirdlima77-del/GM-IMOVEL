import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-gold-100 bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-heading text-xl font-bold text-primary">
          GM <span className="text-sm font-normal text-gray-500">Negócios Imobiliários</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/imoveis" className="hover:text-primary">
            Imóveis
          </Link>
          <Link href="/sobre" className="hover:text-primary">
            Sobre
          </Link>
          <Link href="/contato" className="hover:text-primary">
            Contato
          </Link>
          <Link href="/anuncie" className="hover:text-primary">
            Anuncie seu imóvel
          </Link>
        </nav>

        <Link
          href="/imoveis"
          className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          Buscar imóveis
        </Link>
      </div>
    </header>
  );
}
