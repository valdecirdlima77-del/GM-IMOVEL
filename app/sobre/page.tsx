export default function SobrePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-heading text-2xl font-bold text-graphite mb-4">
        Sobre a GM Negócios Imobiliários
      </h1>

      <div className="space-y-4 text-gray-600 leading-relaxed">
        <p>
          A GM Negócios Imobiliários é uma empresa de assessoria imobiliária
          comandada por <strong>Geisa Macena</strong>, corretora credenciada
          pelo <strong>CRECI-MS 13.429</strong>.
        </p>
        <p>
          Oferecemos assessoria completa em negócios imobiliários, com
          atendimento personalizado e humanizado — sempre mediante agendamento
          para garantir dedicação total a cada cliente.
        </p>

        <h2 className="font-heading text-lg font-bold text-graphite mt-6">
          Nossos Serviços
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Compra e Venda</strong> — Assessoria completa para compra e venda de imóveis.</li>
          <li><strong>Locações</strong> — Gestão de aluguéis com contratos seguros.</li>
          <li><strong>Avaliação Imobiliária</strong> — Avaliação técnica do valor de mercado.</li>
          <li><strong>Regularizações</strong> — Regularização de documentação e situação cadastral.</li>
          <li><strong>Vistorias</strong> — Vistorias detalhadas com relatório fotográfico.</li>
          <li><strong>Documentação</strong> — Elaboração de aditivos, contratos, distratos, notificações, recibos e termos.</li>
        </ul>

        <div className="bg-gold-50 border border-gold-100 rounded-xl p-6 mt-6">
          <p className="font-heading font-bold text-primary mb-1">Geisa Macena</p>
          <p className="text-sm text-gray-500">CRECI-MS 13.429</p>
          <p className="text-sm text-gray-500 mt-2">
            WhatsApp:{" "}
            <a href="https://wa.me/5567998500610" className="text-primary hover:underline">
              (67) 99850-0610
            </a>
          </p>
          <p className="text-sm text-gray-500">
            Instagram:{" "}
            <a href="https://www.instagram.com/geisa_macena" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              @geisa_macena
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
