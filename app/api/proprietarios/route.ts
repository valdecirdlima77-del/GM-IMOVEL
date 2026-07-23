import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

export type PayloadProprietario = {
  nome: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo_conta: string;
  chave_pix: string;
  comissao_percentual: number;
  observacoes: string;
  ativo: boolean;
};

export async function GET() {
  const supabase = criarClienteSupabaseServidor();
  const { data, error } = await supabase
    .from("proprietarios")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ proprietarios: data });
}

export async function POST(request: NextRequest) {
  const supabase = criarClienteSupabaseServidor();
  const payload = (await request.json()) as PayloadProprietario;

  if (!payload.nome || !payload.telefone) {
    return NextResponse.json(
      { erro: "Nome e telefone são obrigatórios." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("proprietarios")
    .insert({
      nome: payload.nome,
      cpf_cnpj: payload.cpf_cnpj || null,
      email: payload.email || null,
      telefone: payload.telefone,
      banco: payload.banco || null,
      agencia: payload.agencia || null,
      conta: payload.conta || null,
      tipo_conta: payload.tipo_conta || null,
      chave_pix: payload.chave_pix || null,
      comissao_percentual: payload.comissao_percentual ?? 10,
      observacoes: payload.observacoes || null,
      ativo: payload.ativo ?? true,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { erro: `Erro ao salvar proprietário: ${error?.message ?? ""}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ proprietario: data }, { status: 201 });
}
