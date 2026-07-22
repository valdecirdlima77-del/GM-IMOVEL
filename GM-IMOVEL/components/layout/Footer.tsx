export default function Footer() {
  return (
    <footer className="bg-graphite text-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <h3 className="font-heading text-lg text-white mb-2">CasaLar</h3>
          <p className="text-gray-300">
            Seu próximo endereço, com quem conhece o bairro.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Links</h4>
          <ul className="space-y-1 text-gray-300">
            <li>Imóveis</li>
            <li>Sobre</li>
            <li>Contato</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Fale conosco</h4>
          <p className="text-gray-300">WhatsApp: (00) 00000-0000</p>
        </div>
      </div>
      <div className="text-center text-xs text-gray-400 py-4 border-t border-white/10">
        © {new Date().getFullYear()} CasaLar. Todos os direitos reservados.
      </div>
    </footer>
  );
}
