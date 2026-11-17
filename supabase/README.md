# Supabase: Barra Boat Floripa

Usa o projeto **compartilhado do HD360** (`euzmbswywwhmicjlszqw`). Todas as tabelas, funções e
policies têm o prefixo `bb_`. O bucket de recibos se chama `bb-recibos`.

**Status:** escritas em 2026-11-17 e **ainda não aplicadas**. Elas só entram no banco com o ok do Fabiano.

## Como aplicar

1. No Supabase, abra o **SQL Editor** e rode os arquivos de `migrations/` em ordem:
   `01-equipe-e-cadastros`, `02-clientes`, `03-agenda`, `04-dinheiro`, `05-whatsapp`.
   Todos podem rodar de novo sem erro.
2. Em **Auth > Users**, crie o login da Michele. Depois dê a ela o papel de dona pelo SQL Editor:
   ```sql
   insert into public.bb_equipe (user_id, nome, papel)
   select id, 'Michele', 'dona' from auth.users where email = '<email dela>';
   ```
   Os outros acessos (atendente, parceiro, marinheiro) a dona cadastra pelo painel.
3. Rode `seed/01-lanchas-roteiros.sql` (17 lanchas e 2 roteiros, iguais ao site). Ele é gerado por
   `python tools/gerar_carga.py` e não sobrescreve o que já foi editado no painel.

## Modelo de segurança

O projeto tem outros clientes, então "estar logado" não basta. Toda policy confere o usuário em
`bb_equipe` e o papel dele:

| Papel | Pode |
|---|---|
| dona | tudo, inclusive dinheiro (despesas, comissões, metas, anúncios), registro de alterações e equipe |
| atendente | cadastros, funil, agenda, robô; **não** vê o caderno de despesas nem os relatórios de lucro |
| parceiro | só pelas funções `bb_disponibilidade_parceiro()` (lanchas liberadas a ele, dias ocupados) e `bb_minhas_comissoes()` |
| marinheiro | só pela função `bb_meus_passeios()` (a própria escala, sem valores) |

- **anon não tem policy em nenhuma tabela.** O site público é montado pelo PHP com a
  `service_role` (só no `config.local.php`, fora do Git). A disponibilidade do site sai de
  `bb_disponibilidade_site()`, no mesmo formato do `assets/data/disponibilidade.json`.
- Tabelas que o painel só lê, e quem grava é o PHP: conversas, mensagens, campanhas, envios,
  agendados, cliques e lotes de importação.
- Parceiro e marinheiro não têm policy de select nas tabelas. Uma policy entregaria a linha inteira
  da lancha, inclusive `agenda_url`, que é o endereço secreto da agenda de outro dono.
- `bb_registro` guarda quem alterou o quê nas tabelas principais (item 43). Quem grava é um
  trigger.
- Fotos de lancha e vídeos ficam na ErêHost, não no Storage, porque o tráfego de mídia pesaria na
  cota dos outros clientes. No Storage fica só o bucket privado `bb-recibos`.

## Regras que o banco garante

- **Um passeio por lancha por dia.** Um índice único ignora os passeios cancelados.
- **Dia bloqueado não recebe passeio novo.** Isso vale para manutenção e para agenda fechada por
  período, numa lancha ou em todas. O trigger devolve a mensagem pronta para o painel mostrar.
  Os passeios marcados antes do bloqueio continuam.
- **Datas do funil carimbadas pelo banco.** O banco preenche `orcamento_at`, `fechado_at` e
  `perdido_at` quando a etapa muda.
- **"Falta receber" é calculado.** É o valor fechado menos a soma de `bb_recebimentos`, e não
  existe coluna de saldo copiada.
- **Despesa fixa entra uma vez por mês.** O índice único é `(fixa_id, mes_ref)`.
- **Mensagens automáticas não se repetem.** Cada passeio tem no máximo uma mensagem de cada tipo
  (véspera, avaliação, clima, lista).
- **Robô e campanha seguem os cadeados da PO.** O `wamid` é único, só pode existir uma campanha
  ativa, e cada número recebe a campanha uma vez só.
