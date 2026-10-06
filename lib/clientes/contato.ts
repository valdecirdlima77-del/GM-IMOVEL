// Funções puras de contato e busca — sem dependência do Supabase, para poder
// ser testadas isoladamente (ver tests/unit).

// Remove caracteres com significado no filtro do PostgREST (.or) e curingas do
// ILIKE, para que o texto digitado na busca nunca quebre a consulta.
export function termoSeguro(q: string): string {
  return q.replace(/[,()%_*\\]/g, " ").trim();
}

// wa.me exige só dígitos, com DDI 55 para número brasileiro sem código do país.
// Retorna null quando o número é curto demais para ser um telefone válido.
export function linkWhatsApp(telefone: string): string | null {
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length < 10) return null;
  const completo = digitos.length <= 11 ? `55${digitos}` : digitos;
  return `https://wa.me/${completo}`;
}
