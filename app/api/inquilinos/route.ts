import { NextRequest, NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/lib/supabase/server";

export type PayloadInquilino = {
  nome: string;
  cpf: string;
  rg: string;
  email: string;
  telefone: string;
  whatsapp: string;
  comprovante_renda_url: string;
  renda_declarada: number | null;
  fiador_nome: string;
  fiador_telefone: string;
  observacoes: string;
  ativo: boolean;
};

export async function GET() {
  const supabase = criarClienteSupabaseServidor();
  const { data, error } = await supabase
    .from("inquilinos")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ inquilinos: data });
}

export async function POST(request: NextRequest) {
  const supabase = criarClienteSupabaseServidor();
  const payload = (await request.json()) as PayloadInquilino;

  if (!payload.nome || !payload.telefone) {
    return NextResponse.json(
      { erro: "Nome e telefone são obrigatórios." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("inquilinos")
    .insert({
      nome: payload.nome,
      cpf: payload.cpf || null,
      rg: payload.rg || null,
      email: payload.email || null,
      telefone: payload.telefone,
      whatsapp: payload.whatsapp || null,
      comprovante_renda_url: payload.comprovante_renda_url || null,
      renda_declarada: payload.renda_declarada,
      fiador_nome: payload.fiador_nome || null,
      fiador_telefone: payload.fiador_telefone || null,
      observacoes: payload.observacoes || null,
      ativo: payload.ativo ?? true,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { erro: `Erro ao salvar inquilino: ${error?.message ?? ""}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ inquilino: data }, { status: 201 });
}
