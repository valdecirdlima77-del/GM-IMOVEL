# Checklist de Produção — GM Negócios Imobiliários

> Cada item marcado ✅/⚠️/❌ com base em código lido, não suposição. "Pronto para produção" aqui significa: a Geisa pode operar sem perder lead, cobrança, contrato ou dado.

## Bloqueadores (não usar em produção real sem resolver)

- [ ] ❌ **Configurar provedor real de WhatsApp** (Z-API, Twilio ou Cloud API da Meta) e preencher `WHATSAPP_API_URL`/`WHATSAPP_API_TOKEN`. Sem isso, recibos e alertas de vencimento nunca chegam a ninguém (`lib/notificacoes/whatsapp.ts`).
- [ ] ❌ **Configurar provedor real de e-mail** (Resend ou equivalente) e preencher `RESEND_API_KEY`, ou aceitar conscientemente que e-mail não é canal usado. Mesmo stub em `lib/notificacoes/email.ts`.
- [ ] ❌ **Criar rotina de geração de cobrança mensal recorrente.** Hoje só a primeira cobrança de cada locação é criada (`app/api/imoveis-alugados/route.ts`). Sem isso, aluguéis param de ser cobrados a partir do 2º mês.
- [ ] ❌ **Resolver a dependência da tabela `repasses`** usada por `app/api/agente/repasse/route.ts` — criar a tabela (com schema versionado) ou desativar a rota até ela existir.
- [ ] ❌ **Aplicar `supabase/rls-administrativo.sql`** no banco de produção — hoje CPF, RG, renda e dados bancários ficam legíveis pela chave pública.
- [ ] ❌ **Decidir sobre o formulário de contato do site:** ou passa a gravar em `mensagens`/dispara notificação real, ou é removido do site para não passar falsa sensação de canal funcional (`app/contato/page.tsx`).

## Segurança

- [ ] ✅ Middleware falha fechado sem `ADMIN_TOKEN` configurado (`middleware.ts`)
- [ ] ✅ Cookie de sessão com `httpOnly`, `secure`, `sameSite: lax`
- [ ] ✅ Rotas de escrita do admin protegidas por `requisicaoAutorizada()`
- [ ] ✅ Rotas do Agente protegidas por segredo próprio (`AGENTE_SECRET`), separado do admin
- [ ] ❌ Rate limit no endpoint de login (`app/api/auth/login/route.ts`)
- [ ] ❌ Confirmação de que os buckets `fotos-imoveis` e `recibos` existem no Supabase Storage do projeto de produção

## Dados

- [ ] ⚠️ Confirmar qual dos 3 arquivos SQL (`database-schema.sql`, `aluguel-schema.sql`, `rls-administrativo.sql`) já rodou no banco de produção e em que ordem — não há registro disso no repositório
- [ ] ⚠️ Confirmar existência de ao menos 1 linha em `corretores`/`usuarios`, exigida por `imoveis.corretor_id NOT NULL`, já que não há tela de cadastro de corretor no código
- [ ] ❌ Nenhuma rotina de backup próprio do banco ou do Storage existe no repositório — depende inteiramente do plano contratado do Supabase

## Fluxo operacional

- [ ] ✅ Cadastro de imóvel com fotos comprimidas automaticamente (`lib/imagens/comprimir.ts`)
- [ ] ✅ Cadastro de proprietário, inquilino, locação
- [ ] ✅ Lançamento manual de pagamento gera recibo em PDF automaticamente
- [ ] ⚠️ Recibo é gerado mas o "envio" registrado no banco é falso enquanto WhatsApp/e-mail forem stub
- [ ] ❌ Cobrança recorrente mensal (ver bloqueador acima)
- [ ] ❌ Lead pelo formulário de contato do site (ver bloqueador acima)

## Antes de divulgar o site para o público

- [ ] Cadastrar ao menos alguns imóveis reais (site hoje está vazio — fora do escopo desta auditoria técnica, mas é pré-requisito de lançamento)
- [ ] Validar manualmente, com um pagamento de teste real, o ciclo completo: cobrança → pagamento → recibo → envio (só depois do WhatsApp real estar configurado)
- [ ] Confirmar que `ADMIN_SENHA` e `ADMIN_TOKEN` estão configurados corretamente no ambiente de produção da Vercel (ver histórico de "senha incorreta" já enfrentado)
