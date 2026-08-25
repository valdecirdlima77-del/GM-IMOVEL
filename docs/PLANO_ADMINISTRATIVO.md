# Módulo ADMINISTRATIVO — análise e plano de implementação

Escrito em **25/08/2026**, a partir da diretriz de arquitetura do Valdecir.
Documento de análise e planejamento — nenhuma linha de código foi escrita ainda.

**Divisão de escopo (decidida em 24-25/08, não renegociar sem decisão explícita):**

| Sistema | Escopo |
|---|---|
| **GM-IMOVEL** | Imobiliário + Administrativo |
| **JuresIA** | Jurídico + Financeiro do jurídico — **nunca** funcionalidades imobiliárias |

---

## 1. O que já existe pronto

Convenção: 🟢 pronto e funcionando · 🟡 estrutura existe, uso incompleto · 🔴 não existe

### Banco de dados — 21 tabelas, todas criadas e vazias

| Tabela | Estado | Serve a qual módulo do Administrativo |
|---|---|---|
| `proprietarios` | 🟢 completa (inclui `comissao_percentual`, dados bancários, `chave_pix`) | Repasses |
| `inquilinos` | 🟢 completa (CPF, RG, renda, fiador, `comprovante_renda_url`) | Contratos, Documentos |
| `imoveis_alugados` | 🟢 ficha da locação, liga imóvel + proprietário + inquilino | Contratos |
| `contratos_aluguel` | 🟢 valores, `indice_reajuste` (IGPM), `multa_atraso_percentual` (2%), `juros_mora_percentual_dia` (0,0333%), `documento_url` | Contratos |
| `cobrancas` | 🟢 competência, vencimento, status, `alerta_enviado_em` | Recebimentos, Cobranças |
| `pagamentos` | 🟢 valor, forma, `referencia_externa` (gateway) | Recebimentos |
| `recibos` | 🟢 PDF, `enviado_inquilino_em`, `enviado_proprietario_em`, `ultimo_meio_envio` | Recebimentos, Comunicação |
| `documentos` | 🟡 existe (`nome`, `url`, `tipo`), mas só liga a `contratos`/`imoveis` — não a inquilino, proprietário ou locação | Documentos |
| `agendamentos` | 🟡 existe, com índice anti-conflito de horário — **nenhuma rota grava nela** | Agenda |
| `historico_visitas` | 🟡 existe, sem uso | Agenda |
| `notificacoes` | 🟡 existe, ligada a `usuarios` (não a inquilino/proprietário) | Comunicação |
| `mensagens` | 🟡 existe com `origem` (`whatsapp`/`chat_site`/`ia`) e `remetente` (`cliente`/`corretor`/`ia`) — **vazia** | Comunicação |
| `contratos` | 🟡 contrato de **venda** (não de locação) — não confundir com `contratos_aluguel` | — |
| `imoveis`, `enderecos`, `fotos` | 🟢 em uso | Cadastro |
| `usuarios`, `corretores`, `clientes` | 🟡 existem, mas o painel autentica por cookie próprio, não por Supabase Auth | Permissões |

### Automação de banco já existente

- `marcar_cobranca_paga()` — trigger: ao inserir pagamento, muda a cobrança para `pago` 🟢
- `marcar_cobrancas_atrasadas()` — RPC chamada pelo cron diário 🟢
- `atualizar_timestamp_alteracao()` — triggers de `atualizado_em` em 5 tabelas 🟢

### Aplicação

- **14 telas** em `app/admin/alugueis/*` (dashboard, cobranças, pagamentos, recibos, contratos, e CRUD de proprietários/inquilinos/imóveis alugados) 🟢
- **2 crons na Vercel** 🟢
  - `verificar-vencimentos` — diário 12h: marca vencidas + alerta de "vence em 3 dias"
  - `relatorio-mensal-proprietarios` — dia 1º
- Geração de **recibo em PDF** + upload para Storage + rota de reenvio 🟢
- `lib/notificacoes/whatsapp.ts` e `email.ts` — 🟡 **stubs**: logam no console, não enviam
- `app/api/webhooks/pagamento` — 🟡 stub, sem validar assinatura, sem gateway
- Upload de fotos com compressão no navegador 🟢 *(feito em 24/08)*
- ChatWidget + `/api/ia/chat` com resposta fixa 🟡 *(feito em 24/08, sem IA conectada)*

**Resumo honesto:** o esqueleto de **Contratos, Recebimentos e Cobranças** já
está de pé. **Repasses, Manutenções, Agenda e Comunicação** praticamente não
existem.

---

## 2. O que precisa ser ajustado

| # | Ajuste | Por quê | Gravidade |
|---|---|---|---|
| A1 | **RLS desabilitado** em `proprietarios`, `inquilinos`, `imoveis_alugados`, `contratos_aluguel`, `cobrancas`, `pagamentos`, `recibos` | Apontado pelo Security Advisor do Supabase. A chave pública (que vai no navegador) lê CPF, RG, renda e movimentação financeira | **Bloqueador** |
| A2 | Rotas `/api/*` do financeiro usam cliente `anon` **sem verificar login** | O middleware só cobre páginas, não APIs. Mesmo padrão já corrigido nas rotas de imóveis (service_role + cookie) | **Bloqueador** |
| A3 | `documentos` só se liga a `contratos` e `imoveis` | Não dá para anexar RG do inquilino nem laudo de vistoria | Alta |
| A4 | `notificacoes` só se liga a `usuarios` | Inquilino e proprietário não são `usuarios` — não dá para notificá-los | Alta |
| A5 | `agendamentos` exige `cliente_id` e `corretor_id` obrigatórios | Vistoria e chamado técnico não têm "cliente"; impede reuso para a Agenda operacional | Média |
| A6 | `whatsapp.ts` e `email.ts` são stubs | Nenhuma automação de comunicação funciona de verdade hoje | Alta |
| A7 | Crons sem validação de `CRON_SECRET` | Qualquer um dispara o job pela URL | Média |
| A8 | Relatório mensal não aplica `comissao_percentual` | Só soma previsto e pago — não calcula repasse | Alta |
| A9 | Nomenclatura `alugueis` nas rotas e pastas | A diretriz é chamar de **Administrativo** | Baixa (cosmética) |

---

## 3. O que precisa ser criado

Por módulo da diretriz:

**1. CONTRATOS** — existe base; falta: aditivos, renovações, rescisões, garantias
**2. RECEBIMENTOS** — existe base; falta: IPTU/condomínio como lançamentos próprios, cálculo de multa e juros
**3. REPASSES** — 🔴 não existe nada além do campo `comissao_percentual`
**4. COBRANÇAS** — existe pendente/atrasado; falta: acordos e histórico
**5. MANUTENÇÕES** — 🔴 não existe nada
**6. DOCUMENTOS** — existe tabela; falta: vínculo amplo, categorias, vistorias
**7. AGENDA** — 🔴 tabela existe sem uso; falta tudo (tipos, visualizações, integrações)
**8. COMUNICAÇÃO** — 🔴 tabelas existem vazias; falta o motor de envio real

---

## 4. Impacto no banco de dados

**Boa notícia: nenhuma tabela existente precisa ser destruída.** Todo o impacto
é aditivo — colunas novas e tabelas novas. As 21 tabelas atuais permanecem.

Alterações em tabelas existentes (todas `ALTER TABLE ... ADD COLUMN`, sem perda):

| Tabela | Alteração |
|---|---|
| `contratos_aluguel` | `taxa_administracao_percentual` (hoje a comissão vive só no proprietário; deveria poder variar por contrato) · `contrato_anterior_id` (para renovação) · `data_rescisao`, `motivo_rescisao` |
| `documentos` | `inquilino_id`, `proprietario_id`, `imovel_alugado_id`, `manutencao_id`, `vistoria_id` (todos opcionais) · `categoria` |
| `notificacoes` | tornar `usuario_id` opcional e acrescentar `inquilino_id`, `proprietario_id` |
| `agendamentos` | tornar `cliente_id`/`corretor_id` opcionais · `tipo`, `titulo`, `data_fim`, `local`, `id_evento_externo`, `provedor_externo`, `link_reuniao` |

---

## 5. Novas tabelas necessárias

```
REPASSES
  repasses                (proprietario_id, competencia, valor_bruto,
                           taxa_administracao, total_despesas, valor_liquido,
                           status, data_repasse, comprovante_url, demonstrativo_url)
  repasse_itens           (repasse_id, tipo: aluguel|multa|juros|iptu|condominio|
                           manutencao|taxa_adm, descricao, valor, sinal: +|-)

DESPESAS  (alimenta o repasse)
  despesas                (imovel_alugado_id, tipo, descricao, valor,
                           competencia, pago_por: proprietario|inquilino|imobiliaria,
                           repassavel, comprovante_url)

COBRANÇAS
  acordos                 (cobranca_id, valor_original, valor_acordado,
                           parcelas, status, observacoes)
  acordo_parcelas         (acordo_id, numero, valor, vencimento, status)
  historico_cobranca      (cobranca_id, acao, canal, resultado, registrado_em)

MANUTENÇÕES
  manutencoes             (imovel_alugado_id, aberto_por, categoria, descricao,
                           prioridade, status: aberto|orcamento|aprovado|
                           execucao|concluido|cancelado, prazo, custo_final)
  manutencao_orcamentos   (manutencao_id, fornecedor, valor, prazo_dias,
                           anexo_url, status: pendente|aprovado|recusado)
  manutencao_eventos      (manutencao_id, status_anterior, status_novo,
                           observacao, registrado_em)

AGENDA
  eventos                 (tipo: visita|vistoria|reuniao|assinatura|chamado,
                           titulo, inicio, fim, local, status,
                           imovel_alugado_id, manutencao_id, contrato_id,
                           provedor_externo, id_evento_externo, link_reuniao)
  evento_participantes    (evento_id, inquilino_id|proprietario_id|usuario_id,
                           email, telefone, confirmou_em)
  integracoes_calendario  (usuario_id, provedor: google|microsoft,
                           refresh_token_criptografado, calendario_id,
                           ultima_sincronizacao)

VISTORIAS
  vistorias               (imovel_alugado_id, tipo: entrada|saida|periodica,
                           data, responsavel, laudo_url, status)
  vistoria_itens          (vistoria_id, ambiente, item, estado, observacao, foto_url)

COMUNICAÇÃO
  comunicacoes            (canal: whatsapp|email|sistema, direcao: enviada|recebida,
                           destinatario_tipo, destinatario_id, assunto, corpo,
                           status: fila|enviada|entregue|lida|falhou,
                           erro, origem_modulo, origem_id, enviada_em)
  modelos_mensagem        (chave, canal, assunto, corpo_template, variaveis, ativo)
```

**Total: 16 tabelas novas.** Todas independentes das atuais — nenhuma migração
destrutiva.

---

## 6. APIs necessárias

Seguindo o padrão já estabelecido (`service_role` + verificação do cookie
`gm_admin` via `lib/auth/admin.ts`):

```
/api/administrativo/contratos          GET POST · [id] PUT DELETE
                   /aditivos            POST
                   /renovacoes          POST
                   /rescisoes           POST
/api/administrativo/despesas           GET POST · [id] PUT DELETE
/api/administrativo/repasses           GET POST
                   /[id]/demonstrativo  GET   (gera PDF)
                   /[id]/confirmar      POST
                   /calcular            POST  (prévia sem gravar)
/api/administrativo/acordos            GET POST · [id]/parcelas
/api/administrativo/manutencoes        GET POST · [id] PUT
                   /[id]/orcamentos     GET POST
                   /[id]/aprovar        POST
/api/administrativo/vistorias          GET POST · [id]/itens · [id]/laudo
/api/administrativo/documentos         GET POST DELETE  (upload igual ao de fotos)
/api/agenda/eventos                    GET POST · [id] PUT DELETE
/api/agenda/sincronizar                POST
/api/agenda/oauth/google/[iniciar|callback]
/api/agenda/oauth/microsoft/[iniciar|callback]
/api/comunicacao/enviar                POST
/api/comunicacao/historico             GET
/api/webhooks/whatsapp                 POST  (receber respostas)
/api/cron/repasses-mensais             GET
/api/cron/lembretes-agenda             GET
/api/cron/contratos-a-vencer           GET
```

---

## 7. Melhor forma de integrar o Google Agenda

**Recomendação: OAuth 2.0 com refresh token, chamando a Google Calendar API v3
direto por HTTP — sem SDK.**

Por quê:
- O projeto tem **zero dependências além de Next/React/Supabase**. O SDK do
  Google (`googleapis`) pesa dezenas de MB e traz o Google inteiro para
  resolver 4 chamadas.
- As 4 chamadas necessárias são simples: criar evento, atualizar, apagar,
  listar. Todas `fetch` com `Authorization: Bearer`.
- Custo: **R$ 0**. A Calendar API é gratuita.

Fluxo:
1. Geisa autoriza uma vez (`/api/agenda/oauth/google/iniciar`) com escopo
   `calendar.events`
2. Guardar o `refresh_token` **criptografado** em `integracoes_calendario`
   (nunca em texto puro — é credencial de acesso à agenda dela)
3. Cada operação troca o refresh por um access token de curta duração
4. Google Meet: basta pedir `conferenceData` na criação do evento — o link vem
   junto, sem integração extra

**Direção da sincronização:** começar só de **saída** (sistema → Google). Trazer
mudanças do Google de volta exige webhook (`watch` + canal com renovação a cada
7 dias) e é onde essas integrações costumam quebrar. Fase posterior.

## 8. Melhor forma de integrar Outlook / Microsoft 365

**Mesmo desenho, via Microsoft Graph API** (`/me/events`), OAuth 2.0 pelo
Entra ID (antigo Azure AD). Teams entra igual ao Meet: `isOnlineMeeting: true`
no corpo do evento.

**Recomendação de sequência:** implementar **Google primeiro**, sozinho. O
`integracoes_calendario` já nasce com a coluna `provedor`, então adicionar
Microsoft depois é acrescentar um adaptador, não refazer. Fazer os dois de uma
vez dobra a superfície de erro numa parte que ainda não foi validada com uso
real.

**Observação sobre o Microsoft 365:** o Valdecir já usa o ambiente Microsoft na
empresa (SharePoint/Teams). Se a Geisa **não** usa Microsoft no negócio dela,
essa integração pode não ter demanda real — vale confirmar antes de construir.

---

## 9. Como conectar isso ao WhatsApp

Existem **dois caminhos**, e escolher errado custa caro:

**Opção A — Reaproveitar o Agente Geisa (recomendada)**
O Agente Geisa já roda no Render, já tem WhatsApp Business configurado, já tem
`whatsapp.notificar_geisa()` funcionando e uma taxonomia de mensagens pronta.
O GM-IMOVEL chamaria uma rota HTTP dele para enviar.
- ✅ Não duplica credencial da Meta em dois lugares
- ✅ Não repete o problema de token expirando em dois sistemas
- ⚠️ Cria dependência entre os dois projetos (se o Render dorme, não envia)

**Opção B — WhatsApp Cloud API direto no GM-IMOVEL**
Preencher os stubs de `lib/notificacoes/whatsapp.ts` com a API da Meta.
- ✅ Independente
- ❌ Segundo lugar guardando token da Meta, com a mesma rotina de expiração que
  já deu trabalho no Agente Geisa

**Recomendação: Opção A**, com a tabela `comunicacoes` registrando tudo do lado
do GM-IMOVEL (para o histórico não depender do Render).

**Restrição importante da Meta:** mensagens iniciadas pelo negócio fora da
janela de 24h exigem **template aprovado**. Lembrete de vencimento e aviso de
repasse caem nessa regra. Os templates precisam ser submetidos e aprovados
antes — leva dias. **Isso deve começar cedo**, não na última fase.

---

## Plano em fases

### FASE 1 — Correções urgentes e aproveitamento do que existe

*Objetivo: deixar seguro e utilizável o que já está construído. Nada de módulo novo.*

1. **A2** — rotas do financeiro com `service_role` + cookie (mesmo padrão já
   aplicado às de imóveis)
2. **A1** — ligar RLS nas 7 tabelas — **só depois do item 1**, senão o painel
   fica vazio
3. **A7** — proteger os crons com `CRON_SECRET`
4. **A8** — relatório mensal passa a aplicar `comissao_percentual`
5. Cadastrar o **primeiro contrato real** e ver onde trava

> A ordem de 1→2 não é negociável: ligar RLS antes de trocar o cliente quebra
> o painel. Foi exatamente por isso que alguém desligou o RLS lá atrás.

### FASE 2 — Financeiro vira Administrativo

1. ✅ **25/08/2026** — Tabelas de **despesas** e **repasses** + cálculo do
   líquido. Branch `feat/despesas-repasses`. Aguardando: (a) aplicar
   `supabase/despesas-repasses-schema.sql` no Supabase, (b) ligar RLS nessas
   2 tabelas junto com `rls-administrativo.sql`, (c) merge na `main`.
2. ✅ **Demonstrativo de repasse** em PDF (reaproveitou `lib/pdf/gerador-pdf.ts`,
   igual ao recibo) — `lib/repasses/gerar-demonstrativo.ts`
3. Aditivos, renovações e rescisões em `contratos_aluguel`
4. **Manutenções** com o ciclo chamado → orçamento → aprovação → execução → encerramento
5. **Documentos** com vínculo amplo (upload igual ao de fotos, já pronto)
6. Renomear `alugueis` → `administrativo` nas rotas e pastas

### FASE 3 — Agenda

1. Tabela `eventos` + tela com visualizações dia/semana/mês
2. Ligar aos módulos: vistoria gera evento, chamado gera evento, assinatura gera evento
3. **Google Agenda** (OAuth + criação de evento + Meet), só saída
4. **Microsoft 365** depois, como adaptador — se houver demanda real

### FASE 4 — Automações do Agente Geisa

1. Motor de comunicação real (`comunicacoes` + `modelos_mensagem`), substituindo os stubs
2. **Submeter templates à Meta** — começar já na Fase 2, porque a aprovação demora
3. Ligar os gatilhos, na ordem de menor risco:
   - Pagamento recebido → recibo + aviso *(mais simples, já tem recibo pronto)*
   - Aluguel a vencer → lembrete *(o cron já identifica quem vence)*
   - Repasse feito → demonstrativo ao proprietário
   - Novo contrato → boas-vindas
   - Chamado aberto → notificar envolvidos
   - Visita agendada → evento + confirmação
   - Contrato a vencer → fluxo de renovação

### FASE 5 — Operação integrada

1. Confirmação de presença e reagendamento por WhatsApp (respostas de volta)
2. Régua de cobrança inteligente (antes, no dia, depois)
3. Painel único de histórico por inquilino/proprietário
4. Só então avaliar conectar o cérebro do Agente ao site

---

## Riscos que eu registraria desde já

| Risco | Observação |
|---|---|
| **Construir para operação que ainda não existe** | Todas as 21 tabelas estão vazias. O sistema nunca processou um contrato real. Especificar 16 tabelas novas antes do primeiro contrato é desenhar no escuro — a Fase 1 termina com "cadastrar o primeiro contrato real" justamente por isso |
| **Templates da Meta** | Aprovação leva dias e bloqueia toda a Fase 4. Começar na Fase 2 |
| **Token da Meta expirando** | Já é problema conhecido no Agente Geisa. Reaproveitar (Opção A) concentra o problema em um lugar só |
| **Supabase gratuito pausa com 7 dias sem uso** | Os crons diários mantêm acordado — **desde que estejam funcionando**. Se pararem, o banco dorme e tudo cai |
| **Dados sensíveis** | CPF, RG e renda de terceiros. A Fase 1 (RLS) não é burocracia: é o que separa "sistema" de "vazamento" |
