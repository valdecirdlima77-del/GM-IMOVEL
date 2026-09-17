# Riscos Críticos — GM Negócios Imobiliários

> Baseado exclusivamente em código lido neste repositório em 2026-09-17. Cada item cita o arquivo evidência. Nenhuma suposição sobre o que "deveria" existir — só o que existe ou comprovadamente não existe.

## P0 — Pode gerar perda financeira, perda de dado ou perda de cliente

### P0-1. Nenhuma notificação de WhatsApp sai de verdade
**Evidência:** `lib/notificacoes/whatsapp.ts` — `enviarWhatsApp()` checa `process.env.WHATSAPP_API_URL`/`WHATSAPP_API_TOKEN`; se ausentes (não configuradas em nenhum lugar do repo), executa `console.log(...)` e retorna `{ sucesso: true }`.
**Quem usa essa função achando que envia de verdade:** geração de recibo (`lib/recibos/gerar-recibo.ts:114-118`), alerta de vencimento (`app/api/cron/verificar-vencimentos/route.ts:47`), relatório mensal a proprietários (`app/api/cron/relatorio-mensal-proprietarios/route.ts:58`).
**Impacto:** o sistema registra `enviado_inquilino_em`/`enviado_proprietario_em` como preenchido no banco mesmo sem nada ter saído. Ninguém — nem Geisa, nem inquilino, nem proprietário — é avisado de nada por este canal hoje.

### P0-2. Nenhum e-mail sai de verdade
**Evidência:** `lib/notificacoes/email.ts` — mesmo padrão: sem `RESEND_API_KEY`, `console.log` e `{ sucesso: true }`.
**Impacto:** idêntico ao P0-1, para o canal e-mail.

### P0-3. Cobrança recorrente mensal nunca é gerada automaticamente
**Evidência:** busca no projeto inteiro por criação de linha em `cobrancas` encontra só dois lugares: `app/api/imoveis-alugados/route.ts:92-100` (cria a **primeira** cobrança no momento em que a locação é cadastrada) e nenhum outro. `app/api/cron/verificar-vencimentos/route.ts` só **atualiza status** de cobranças já existentes (`marcar_cobrancas_atrasadas()`) e envia alerta — não cria a cobrança do mês seguinte.
**Impacto:** uma locação ativa há 3 meses tem, no banco, **apenas 1 cobrança** (a do primeiro mês), a menos que alguém crie manualmente as demais pela API ou SQL direto. Isso não é uma automação incompleta — é uma automação inexistente para o caso de uso central do produto (cobrar aluguel todo mês).

### P0-4. Rota do Agente depende de tabela que não existe no schema
**Evidência:** `app/api/agente/repasse/route.ts:36-41` faz `supabase.from("repasses").select(...)`. Busca em `supabase/database-schema.sql` e `supabase/aluguel-schema.sql` (os dois arquivos de schema do repo) não encontra `create table repasses` em nenhum dos dois.
**Impacto:** se essa rota for chamada em produção sem essa tabela ter sido criada manualmente fora do controle de versão, todo proprietário que perguntar "quanto vou receber" via Agente recebe erro 500 ou 404 dependendo de como o Postgres responde à tabela inexistente — não um erro tratado.

### P0-5. RLS desligado em 7 tabelas com CPF, RG, renda e dados bancários
**Evidência:** `supabase/rls-administrativo.sql` (script de correção já escrito, não confirmado como aplicado) documenta no próprio comentário: "O Security Advisor do Supabase aponta 7 tabelas com 'RLS Disabled in Public'". Tabelas: `proprietarios`, `inquilinos`, `imoveis_alugados`, `contratos_aluguel`, `cobrancas`, `pagamentos`, `recibos`.
**Impacto:** qualquer portador da chave pública (`anon`), que fica embutida no JavaScript do site, consegue ler essas tabelas diretamente via REST API do Supabase, sem passar pelo admin.

### P0-6. Formulário de contato do site público não salva nada
**Evidência:** `app/contato/page.tsx:29-35` — `aoEnviar()` só chama `setEnviado(true)` e limpa o formulário. Comentário no próprio código: "Sem backend de mensagens ainda — por enquanto apenas confirma o envio na tela."
**Impacto:** todo visitante que preencher esse formulário em vez de usar o WhatsApp perde a mensagem — ela não é gravada em lugar nenhum, Geisa nunca a vê. O formulário mostra "Mensagem enviada!" para o visitante, ou seja, **o próprio visitante acredita que funcionou**.

### P0-7. Webhook de pagamento desligado — todo pagamento é lançamento manual
**Evidência:** `app/api/webhooks/pagamento/route.ts:20-26` retorna 503 sempre que `WEBHOOK_PAGAMENTO_SECRET` não está configurado (não está). Comentário confirma: "Como ainda não há gateway configurado, esta rota fica DESLIGADA."
**Impacto:** não há vulnerabilidade aqui (é uma decisão de segurança correta), mas confirma que **100% dos pagamentos dependem de Geisa digitar manualmente** em `/admin/alugueis/pagamentos` (via `app/api/pagamentos/route.ts`). Nenhuma conciliação automática existe.

## P1 — Afeta diretamente a operação da Geisa

### P1-1. Login sem rate limit
**Evidência:** `app/api/auth/login/route.ts:8` — `if (!senhaAdmin || senha !== senhaAdmin)`, sem contagem de tentativas, sem bloqueio temporário, sem CAPTCHA.
**Impacto:** um único segredo (`ADMIN_SENHA`) protege CPF/RG/financeiro de terceiros e pode ser testado por força bruta sem limite.

### P1-2. Duas famílias de tabelas de "pessoa" desconectadas
**Evidência:** `supabase/database-schema.sql` define `usuarios`/`clientes`/`corretores` com `papel_usuario` e RLS baseado em `auth.uid()`. `supabase/aluguel-schema.sql` define `proprietarios`/`inquilinos` sem nenhuma relação com `usuarios`. `imoveis.corretor_id` (`database-schema.sql:86`) é `not null references corretores`.
**Impacto:** todo cadastro de imóvel depende de existir ao menos 1 linha em `corretores` (e por consequência em `usuarios`), mas não há, no código lido, nenhuma tela ou rota de API para criar um corretor. Essa linha precisou ser inserida manualmente fora do fluxo do sistema.

### P1-3. Políticas de RLS que nunca poderão dar match
**Evidência:** `database-schema.sql:251-268` e `aluguel-schema.sql:231-257` — policies como `"Admin gerencia todos os imoveis"` usam `auth.uid()`. O login do admin é via cookie próprio (`middleware.ts`, `lib/auth/admin.ts`), não via Supabase Auth — não existe, em nenhum ponto do código lido, uma chamada a `supabase.auth.signIn*`.
**Impacto:** essas policies não quebram nada (as rotas usam a chave `service_role`, que ignora RLS — `lib/supabase/admin.ts:4`), mas são código morto que pode enganar uma auditoria futura, incluindo o próprio Security Advisor do Supabase, que pode reportar "RLS habilitado" dando falsa sensação de proteção por papel de usuário — proteção essa que nunca existiu.

### P1-4. Recibo/contrato em PDF cai em base64 dentro do próprio banco quando o bucket falha
**Evidência:** `lib/recibos/gerar-recibo.ts:76-93` e `app/api/contratos/generate/route.ts:60-66` — se o upload ao Storage falhar (ex.: bucket `recibos` inexistente), o PDF inteiro em base64 é salvo na coluna `pdf_url`/`documento_url` (tipo `text`).
**Impacto:** sem confirmação de que os buckets `fotos-imoveis` e `recibos` foram de fato criados no Supabase Storage, todo contrato/recibo pode estar sendo salvo como string gigante dentro do Postgres, inflando o banco.

## P2 — Melhoria desejável

- Dashboard (`app/admin/page.tsx`) mostra KPIs agregados, não uma fila de ação priorizada por urgência (ver `FLUXOS_OPERACIONAIS.md`, seção Dashboard Ideal).
- Três arquivos SQL (`database-schema.sql`, `aluguel-schema.sql`, `rls-administrativo.sql`) sem numeração de migration — não há como saber pela árvore de arquivos qual rodou e em que ordem no banco de produção.

## P3 — Evolução futura

- Consolidar `usuarios`/`corretores`/`clientes` (schema original, multi-usuário) com o fluxo real de login único — decisão de arquitetura, não bug.
