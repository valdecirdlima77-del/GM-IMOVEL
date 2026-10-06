-- Aplicada em 2026-10-05 no projeto gm-imovel (pxunmaaqxhldkdyjlsrt).
--
-- Remove as políticas abertas para a chave pública (anon) em tabelas que o
-- frontend não usa mais diretamente. Antes, qualquer pessoa com a chave pública
-- conseguia ler e alterar clientes, mensagens, contratos etc.
--
-- Única leitura pública que sobrevive: o join de `enderecos` feito pelas páginas
-- do site (/, /imoveis, /imoveis/[slug]). Por isso a leitura de enderecos é
-- criada ANTES de remover a política antiga, restrita a imóveis publicados.

begin;

create policy "Publico le enderecos de imoveis publicados"
  on public.enderecos
  for select
  to anon
  using (
    exists (
      select 1 from public.imoveis i
      where i.endereco_id = enderecos.id and i.status = 'publicado'
    )
  );

drop policy if exists anon_insert_enderecos on public.enderecos;
drop policy if exists anon_manage_clientes on public.clientes;
drop policy if exists anon_manage_mensagens on public.mensagens;
drop policy if exists anon_manage_contratos on public.contratos;
drop policy if exists anon_manage_documentos on public.documentos;
drop policy if exists anon_manage_notificacoes on public.notificacoes;
drop policy if exists anon_manage_historico on public.historico_visitas;
drop policy if exists anon_manage_videos on public.videos;
drop policy if exists anon_insert_usuarios on public.usuarios;
drop policy if exists anon_insert_corretores on public.corretores;

commit;
