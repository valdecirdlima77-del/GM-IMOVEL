export default function Footer() {
  return (
    <footer className="bg-graphite text-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <h3 className="font-heading text-lg text-white mb-2">GM Negócios Imobiliários</h3>
          <p className="text-gray-300">
            Assessoria completa em negócios imobiliários.
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Geisa Macena — CRECI-MS 13.429
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Serviços</h4>
          <ul className="space-y-1 text-gray-300">
            <li>Compra e Venda</li>
            <li>Locações</li>
            <li>Avaliação Imobiliária</li>
            <li>Regularizações</li>
            <li>Vistorias</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Fale conosco</h4>
          <p className="text-gray-300">
            <a href="https://wa.me/5567998500610" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              WhatsApp: (67) 99850-0610
            </a>
          </p>
          <p className="text-gray-300 mt-2">
            <a href="https://www.instagram.com/geisa_macena" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Instagram: @geisa_macena
            </a>
          </p>
          <p className="text-gray-400 text-xs mt-3">
            Atendimento mediante agendamento
          </p>
        </div>
      </div>
      <div className="text-center text-xs text-gray-400 py-4 border-t border-white/10">
        © {new Date().getFullYear()} GM Negócios Imobiliários. Todos os direitos reservados.
      </div>
    </footer>
  );
}
