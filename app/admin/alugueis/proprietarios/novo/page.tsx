import FormularioProprietario, {
  PROPRIETARIO_VAZIO,
} from "@/components/admin/FormularioProprietario";

export default function NovoProprietarioPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-graphite mb-6">
        Novo proprietário
      </h1>
      <FormularioProprietario valoresIniciais={PROPRIETARIO_VAZIO} />
    </div>
  );
}
