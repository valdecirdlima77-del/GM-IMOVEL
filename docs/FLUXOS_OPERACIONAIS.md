# Fluxos Operacionais — Auditoria com Evidência de Código

> Legenda: ✅ Funciona · ⚠️ Funciona parcialmente · ❌ Não funciona
> Cada linha cita o arquivo que comprova o status.

## 1. Lead (contato do site)

```
Cliente entra no site → Preenche contato → Lead é salvo → Painel recebe → Geisa responde
```

| Etapa | Status | Evidência |
|---|---|---|
| Cliente preenche formulário | ✅ | `app/contato/page.tsx` — formulário controlado, campos obrigatórios funcionam |
| Lead é salvo | ❌ | `app/contato/page.tsx:29-35` — `aoEnviar()` só faz `setEnviado(true)`, não grava em nenhuma tabela nem chama nenhuma API |
| Painel recebe informação | ❌ | Não existe rota `/api/mensagens` ou equivalente; tabela `mensagens` existe no schema (`database-schema.sql:184-193`) mas nenhum código escreve nela |
| Geisa consegue responder | ❌ | Consequência direta dos itens acima — não há nada para responder |

**Caminho que de fato funciona hoje:** botão/link direto de WhatsApp (`wa.me/...`) presente em `app/page.tsx`, `app/contato/page.tsx`, `app/imoveis/[slug]/page.tsx` — esse é o único canal de lead real. O formulário do site é decorativo.

**Resultado esperado do enunciado ("nenhum lead pode ser perdido"): NÃO ATENDIDO** para quem usa o formulário.

## 2. Imóveis

```
Cadastro → Upload de fotos → Compressão → Storage → Banco → Site
```

| Etapa | Status | Evidência |
|---|---|---|
| Cadastro (dados do imóvel) | ✅ | `app/admin/imoveis/novo/page.tsx` + `app/api/imoveis/route.ts` |
| Upload de fotos | ✅ | `components/admin/UploadFotos.tsx` + `app/api/imoveis/[id]/fotos/route.ts` |
| Compressão | ✅ | `lib/imagens/comprimir.ts` — resize a 1600px no lado maior + WebP qualidade 0.82, executado no navegador antes do upload |
| Storage | ✅ | `app/api/imoveis/[id]/fotos/route.ts:75-80` — upload para bucket `fotos-imoveis` via `service_role` |
| Banco (tabela `fotos`) | ✅ | mesma rota, `insert` na tabela `fotos` com `ordem` e `principal` calculados |
| Site exibe a foto | ✅ | `app/page.tsx`, `app/imoveis/page.tsx`, `app/imoveis/[slug]/page.tsx` consultam `fotos(url, principal)` |
| Cadastro parcial (imóvel sem foto, sem `corretor_id` válido) | ⚠️ | `imoveis.corretor_id` é `NOT NULL` no schema (`database-schema.sql:86`) mas não há tela de criação de corretor no código lido — depende de linha inserida manualmente fora do sistema |

**Ponto de atenção real:** se o bucket `fotos-imoveis` não existir no projeto Supabase, o upload falha com erro tratado (`app/api/imoveis/[id]/fotos/route.ts:82-87`) — não quebra silenciosamente, mas não há verificação automática de que o bucket existe antes do primeiro uso.

## 3. Proprietários

```
Cadastro → Documentos → Contrato → Vinculação ao imóvel
```

| Etapa | Status | Evidência |
|---|---|---|
| Cadastro | ✅ | `components/admin/FormularioProprietario.tsx` + `app/api/proprietarios/route.ts` |
| Documentos | ❌ | Tabela `proprietarios` (`aluguel-schema.sql:18-34`) não tem nenhuma coluna de documento/URL de anexo; não há upload de documento de proprietário em nenhuma rota lida |
| Contrato | ✅ | `contratos_aluguel` referencia `imoveis_alugados`, que referencia `proprietario_id` (`aluguel-schema.sql:67`) |
| Vinculação ao imóvel | ✅ | `app/api/imoveis-alugados/route.ts` exige `proprietario_id` obrigatório |

## 4. Inquilinos

```
Cadastro → Documentação → Contrato → Cobranças
```

| Etapa | Status | Evidência |
|---|---|---|
| Cadastro | ✅ | `components/admin/FormularioInquilino.tsx` + `app/api/inquilinos/route.ts` |
| Documentação (comprovante de renda) | ✅ | `inquilinos.comprovante_renda_url` existe no schema (`aluguel-schema.sql:49`) — coluna existe, mas não foi confirmado neste código se há UI de upload dedicada para ela (não localizada em `FormularioInquilino.tsx` na leitura feita) |
| Contrato | ✅ | Igual ao fluxo de proprietário |
| Cobranças (histórico) | ⚠️ | Histórico existe **apenas para o primeiro mês** — ver P0-3 em `RISCOS_CRITICOS.md`: cobranças recorrentes não são geradas automaticamente |

## 5. Locação (fluxo completo)

```
Imóvel → Inquilino → Contrato → Cobrança → Pagamento → Recibo
```

| Etapa | Status | Evidência |
|---|---|---|
| Vincular imóvel + inquilino | ✅ | `app/api/imoveis-alugados/route.ts` |
| Contrato | ✅ | `app/api/contratos/generate/route.ts` gera PDF rascunho (comentário no código: "não substitui um contrato revisado por advogado") |
| Cobrança (1ª) | ✅ | Gerada automaticamente ao criar a locação (`imoveis-alugados/route.ts:92-100`) |
| Cobrança (2ª em diante) | ❌ | Não existe rotina de geração recorrente — ver P0-3 |
| Pagamento | ✅ | `app/api/pagamentos/route.ts` — lançamento manual, trigger `marcar_cobranca_paga()` no banco marca a cobrança como paga |
| Recibo | ⚠️ | PDF é gerado e salvo corretamente (`lib/recibos/gerar-recibo.ts`), mas o **envio** por WhatsApp/e-mail é stub — ver P0-1/P0-2 |

**Resultado esperado do enunciado ("fluxo completo sem falhas"): NÃO ATENDIDO** — quebra em dois pontos: cobrança recorrente e envio de notificação.

## 6. WhatsApp

```
Evento ocorre → Mensagem é criada → Mensagem é enviada → Entrega confirmada
```

| Etapa | Status | Evidência |
|---|---|---|
| Evento dispara a intenção de mensagem | ✅ | Geração de recibo, alerta de vencimento e relatório mensal todos chamam `enviarWhatsApp()` corretamente no ponto certo do fluxo |
| Mensagem é criada (texto) | ✅ | Templates de texto são montados corretamente em cada chamador |
| Mensagem é enviada | ❌ | `lib/notificacoes/whatsapp.ts:25-29` — sem env vars, é só `console.log` |
| Entrega confirmada | ❌ | Não existe, em código nenhum, tratamento de webhook de status de entrega da Meta/Twilio/Z-API |

**Classificação clara pedida no enunciado: isto é um STUB.** Está documentado como tal no próprio comentário do arquivo (`lib/notificacoes/whatsapp.ts:3`), o que é uma boa prática de honestidade no código — mas o efeito em produção, sem configurar as variáveis, é indistinguível de "está funcionando" para quem olha só o painel.

## 7. E-mail

```
Evento ocorre → E-mail gerado → E-mail enviado → Entrega confirmada
```

Mesmo padrão do WhatsApp. **STUB** confirmado em `lib/notificacoes/email.ts:3` e `:27-32`.

## 8. Uploads (fotos, documentos, recibos, contratos)

| Tipo | Onde é salvo | Status |
|---|---|---|
| Fotos de imóvel | Bucket `fotos-imoveis` (Storage) | ✅ funcional, com fallback de erro tratado |
| Recibo PDF | Bucket `recibos` (Storage), com fallback para base64 na coluna `pdf_url` | ⚠️ funciona, mas o fallback é indesejável em volume |
| Contrato PDF | **Não usa Storage** — vai direto como base64 em `contratos_aluguel.documento_url` (`app/api/contratos/generate/route.ts:60-66`) | ⚠️ funciona, mas sempre infla o banco, não é fallback — é o único caminho |
| Comprovante de renda (inquilino) | Coluna `comprovante_renda_url` existe no schema, mecanismo de upload não localizado no código lido | ⚠️ incerto |

## 9. Segurança

| Item | Status | Evidência |
|---|---|---|
| Login falha fechado sem `ADMIN_SENHA`/`ADMIN_TOKEN` | ✅ | `middleware.ts:18-23`, `lib/auth/admin.ts:14-15` |
| Cookie de sessão | ✅ | `httpOnly`, `secure`, `sameSite: lax`, 30 dias (`app/api/auth/login/route.ts:13-19`) |
| Rate limit no login | ❌ | Não existe em `app/api/auth/login/route.ts` |
| RLS nas tabelas de aluguel | ❌ | Ver P0-5 em `RISCOS_CRITICOS.md` |
| Rotas de API protegidas por cookie | ✅ | Praticamente todas as rotas de escrita chamam `requisicaoAutorizada()` |
| Rotas do Agente protegidas por segredo próprio | ✅ | `lib/auth/agente.ts` — segredo `AGENTE_SECRET` separado do `ADMIN_TOKEN`, decisão correta |
| Rotas de cron protegidas | ✅ | `lib/auth/cron.ts` (não lido linha a linha nesta auditoria, mas referenciado e usado consistentemente) |

## 10. Backup e Recuperação

| Item | Status | Evidência |
|---|---|---|
| Backup do banco (Postgres) | ❌ | Nenhum script, rotina ou configuração de backup encontrada no repositório — depende inteiramente do plano do Supabase contratado (free tier não garante backup) |
| Backup do Storage (fotos/recibos/contratos) | ❌ | Idem — nenhuma rotina de exportação/cópia encontrada no código |
| Plano de recuperação documentado | ❌ | Não existe nenhum documento ou script de restauração no repositório antes desta auditoria |

**Nota:** backup é responsabilidade de infraestrutura (plano do Supabase), não de código — mas a ausência de qualquer rotina de exportação própria significa que a única rede de segurança hoje é o que o plano contratado do Supabase oferecer.

---

## Dashboard Ideal da Geisa (proposta, sem implementação nesta auditoria)

O `app/admin/page.tsx` atual mostra 3 cards de destaque + 5 métricas secundárias — todos são **contagens agregadas**, nenhum é uma fila acionável. Proposta de estrutura, usando exclusivamente tabelas que já existem:

```
AÇÃO DO DIA
├── Cobranças vencidas          → cobrancas WHERE status = 'atrasado'
├── Cobranças vencendo em 7 dias → cobrancas WHERE status = 'pendente' AND data_vencimento <= hoje+7
├── Recibos pendentes de envio   → recibos WHERE enviado_inquilino_em IS NULL
├── Contratos vencendo em 60 dias → contratos_aluguel WHERE data_fim <= hoje+60
└── Pendências operacionais      → ex.: locação sem inquilino vinculado, imóvel sem foto
```

Todas essas consultas usam tabelas e colunas que **já existem no schema atual** — não é uma funcionalidade nova, é uma reorganização de como os dados já existentes são exibidos. Nenhuma dependência de WhatsApp, e-mail ou Agente Geisa.
