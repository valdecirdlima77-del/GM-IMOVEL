# Roadmap para Produção — GM Negócios Imobiliários

> Regra da missão: nenhuma IA, nenhum Agente Geisa, nenhum chatbot, nenhuma tela nova, nenhuma funcionalidade nova. Este roadmap só liga/corrige o que já existe em código.

## Fase 0 — Esta semana (P0, bloqueadores de confiança)

Ordem importa: cada item resolve uma mentira operacional específica identificada em `RISCOS_CRITICOS.md`.

1. **Escolher e configurar 1 provedor de WhatsApp** (Z-API é o mais simples de configurar sem CNPJ/aprovação Meta). Preencher `WHATSAPP_API_URL`/`WHATSAPP_API_TOKEN` na Vercel. Sem código novo — `lib/notificacoes/whatsapp.ts` já sabe usar essas variáveis quando existirem.
2. **Aplicar `supabase/rls-administrativo.sql`** no banco de produção via SQL Editor do Supabase.
3. **Criar a rotina de geração de cobrança mensal.** Não é feature nova, é fechar um fluxo que já existe pela metade: mesma lógica de `proximaCompetencia()` já escrita em `app/api/imoveis-alugados/route.ts` precisa rodar mensalmente para toda `imovel_alugado` com `status = 'ativo'` que ainda não tem cobrança da competência atual. Pode reaproveitar o padrão de rota de cron já existente (`app/api/cron/verificar-vencimentos`).
4. **Decidir sobre `/api/agente/repasse`:** criar a tabela `repasses` com um schema versionado, ou desativar a rota (retornar 501) até a tabela existir — não deixar quebrando silenciosamente contra tabela inexistente.
5. **Decidir sobre o formulário de contato:** gravar em `mensagens` (tabela já existe) ou remover o formulário do site e deixar só WhatsApp, que é o canal comprovadamente funcional.

## Fase 1 — 30 dias (P1, reduz risco operacional e de dados)

6. Rate limit simples no login (`app/api/auth/login/route.ts`) — mesmo um contador em memória/Redis básico já corta ataque de força bruta trivial.
7. Confirmar e documentar, num único lugar, a ordem correta de aplicação dos 3 arquivos SQL — mesmo sem virar um sistema de migration completo, um `supabase/ORDEM_DE_APLICACAO.md` simples já resolve a ambiguidade.
8. Confirmar existência dos buckets `fotos-imoveis` e `recibos` no Storage de produção — testar upload de 1 foto e 1 recibo real.
9. Verificar se `comprovante_renda_url` (inquilino) tem de fato um caminho de upload no admin, ou se é uma coluna sem uso — decidir manter oculta ou implementar o upload que falta.
10. Configurar backup: no mínimo, confirmar no painel do Supabase se o plano contratado inclui backup automático do banco; se não, agendar exportação manual periódica até decidir sobre plano pago.

## Fase 2 — 90 dias (P2, simplificação e solidez)

11. Reorganizar o Dashboard (`app/admin/page.tsx`) para a estrutura de "Ação do Dia" descrita em `FLUXOS_OPERACIONAIS.md` — usa dados que já existem, é reorganização de consulta/exibição, não feature nova.
12. Remover a obrigatoriedade de `corretor_id NOT NULL` em `imoveis` (ou documentar formalmente qual linha de `corretores` foi inserida manualmente e por quê) — hoje é uma dependência invisível que qualquer reinstalação do banco vai travar sem aviso claro.
13. Limpar as policies de RLS mortas em `database-schema.sql`/`aluguel-schema.sql` que dependem de `auth.uid()` — ou documentar explicitamente que são vestígio do desenho original e não têm efeito com o modelo de login atual, para não confundir uma auditoria de segurança futura.

## Fora de escopo deste roadmap (por instrução explícita da missão)

- Qualquer funcionalidade de IA, Agente Geisa ou chatbot
- Qualquer tela nova
- Qualquer gateway de pagamento automático (PIX/cartão) — a decisão consciente de manter `app/api/webhooks/pagamento` desligado até ter um gateway real está correta e não deve ser revertida às pressas só para "automatizar"

## Critério de saída de cada fase

- **Fase 0 concluída** quando: uma mensagem de WhatsApp real chega no celular de um número de teste, RLS aplicado e verificado com o `curl` de teste descrito em `rls-administrativo.sql`, e uma segunda cobrança aparece automaticamente sem intervenção manual.
- **Fase 1 concluída** quando: o checklist em `PRODUCAO_CHECKLIST.md` não tiver mais nenhum item ❌ na seção "Segurança" e "Dados".
- **Fase 2 concluída** quando: Geisa consegue abrir o admin e, em menos de 10 segundos, saber o que precisa fazer no dia — sem navegar entre abas.
