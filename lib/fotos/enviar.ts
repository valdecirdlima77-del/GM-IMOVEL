import type { SupabaseClient } from "@supabase/supabase-js";

// Bucket onde ficam as fotos dos imóveis. Não mudar sem migrar os arquivos.
export const NOME_BUCKET = "fotos-imoveis";

export type ResultadoEnvioFoto =
  | { ok: true; foto: Record<string, unknown> }
  | { ok: false; status: number; erro: string };

// Fluxo do upload de foto de imóvel: confere o imóvel, calcula a ordem, envia
// ao Storage e grava o registro em `fotos`. Usa o cliente service role que o
// chamador passa — quem chama é responsável por checar o cookie gm_admin.
export async function enviarFotoDoImovel(
  supabase: SupabaseClient,
  imovelId: string,
  arquivo: Blob
): Promise<ResultadoEnvioFoto> {
  const { data: imovel } = await supabase
    .from("imoveis")
    .select("id")
    .eq("id", imovelId)
    .maybeSingle();

  if (!imovel) {
    return { ok: false, status: 404, erro: "Imóvel não encontrado." };
  }

  const { count } = await supabase
    .from("fotos")
    .select("id", { count: "exact", head: true })
    .eq("imovel_id", imovelId);

  const ordem = count ?? 0;
  const nomeArquivo = `${imovelId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.webp`;

  const bytes = new Uint8Array(await arquivo.arrayBuffer());

  const { error: erroUpload } = await supabase.storage
    .from(NOME_BUCKET)
    .upload(nomeArquivo, bytes, {
      contentType: "image/webp",
      upsert: false,
    });

  if (erroUpload) {
    return { ok: false, status: 500, erro: `Erro ao enviar a foto: ${erroUpload.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(NOME_BUCKET).getPublicUrl(nomeArquivo);

  const { data: foto, error: erroInsercao } = await supabase
    .from("fotos")
    .insert({
      imovel_id: imovelId,
      url: publicUrl,
      ordem,
      principal: ordem === 0,
    })
    .select()
    .single();

  if (erroInsercao || !foto) {
    return {
      ok: false,
      status: 500,
      erro: `Erro ao salvar a foto: ${erroInsercao?.message ?? ""}`,
    };
  }

  return { ok: true, foto };
}
