import FormularioInquilino, {
  INQUILINO_VAZIO,
} from "@/components/admin/FormularioInquilino";

export default function NovoInquilinoPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-graphite mb-6">
        Novo inquilino
      </h1>
      <FormularioInquilino valoresIniciais={INQUILINO_VAZIO} />
    </div>
  );
}
