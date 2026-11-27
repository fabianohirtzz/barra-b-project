# Robô do WhatsApp: o que fazer na Meta

Escrito em 27/11/2026 a partir do que aconteceu na Pereira Oliveira Turismo (`po-tu-project`, CLAUDE.md,
itens de 07/10 a 26/10/2026). Tudo da Barra Boat é próprio: portfólio, app, token, conta do WhatsApp.
Nada da PO é reaproveitado na Meta; o código do motor sim.

Número: **(48) 99115-3172**, em **coexistência** (a equipe segue usando o app WhatsApp Business no
celular e o robô roda no mesmo número pela Cloud API).

## Ordem e prazos

| Etapa | Quem | Espera |
|---|---|---|
| 1. Portfólio empresarial | Fabiano + Michele | na hora |
| 2. Verificação da empresa | Michele (documentos) | 2 a 14 dias |
| 3. App da Barra Boat | Fabiano (eu acompanho) | na hora |
| 4. Usuário do sistema + token | Fabiano | na hora |
| 5. Provedor de tecnologia (análise do app) | Fabiano + eu (vídeos) | na PO: 08/10 a 26/10 |
| 6. Coexistência do número | Michele com o celular na mão | 10 min |
| 7. Forma de pagamento + nome de exibição | Michele | 1 a 3 dias |
| 8. Webhook, modelos, testes | eu | depois das chaves |

A etapa 5 é a mais longa e só pode começar depois da 2. Começar a 2 o quanto antes.

## 1. Portfólio empresarial (business.facebook.com)

- Antes de criar, ver se já existe: a Barra Boat tem Instagram, anúncios e o GTM ligado a contas de
  anúncio reais, então é provável que já exista um portfólio. Usar o que já existe.
- Michele como administradora (dona), Fabiano como administrador (Configurações > Pessoas).
- Instagram @barraboatfloripa e a página do Facebook ficam no mesmo portfólio.

## 2. Verificação da empresa

Configurações > Central de segurança > Verificação da empresa. Pede:

- **CNPJ, razão social e endereço iguais aos da Receita** (o CNPJ ainda está pendente com a Michele).
- Um documento: cartão CNPJ ou conta (luz, telefone, internet) no nome da empresa, com o endereço.
- Site com o mesmo nome: barraboatfloripa.com.br. **Verificação do domínio**: a Meta dá uma meta tag
  ou um registro TXT. Me mandar o código que eu ponho (a zona DNS está no cPanel).
- E-mail do domínio para receber o código: contato@barraboatfloripa.com.br.

## 3. App (developers.facebook.com)

- Criar app tipo **Empresa**, ligado ao portfólio da Barra Boat. Nome: "Barra Boat Floripa".
- Caso de uso: **Conectar-se com clientes pelo WhatsApp**.
- Configurações básicas: e-mail de contato, ícone 1024x1024 (eu gero a partir da marca),
  categoria, política de privacidade `https://barraboatfloripa.com.br/politica-de-privacidade/`,
  termos `https://barraboatfloripa.com.br/termos-de-uso/`, exclusão de dados (eu preparo a página).
- Anotar: **ID do app** e **Chave secreta do app** (App Secret).
- Publicar o app (sair do modo de desenvolvimento). Na PO isso é requisito do cadastro incorporado.

## 4. Usuário do sistema e token permanente

Portfólio > Configurações > Usuários > Usuários do sistema:

- Criar "Barra Boat Robô", função **Administrador**.
- Atribuir ativos: o app (controle total) e, depois da etapa 6, a conta do WhatsApp (controle total).
- Gerar token: app da Barra Boat, expiração **Nunca**, permissões `whatsapp_business_messaging`,
  `whatsapp_business_management` e `business_management`.

## 5. Provedor de tecnologia (só existe por causa da coexistência)

Na PO ficou provado que sem isso não há coexistência: o assistente do Login para Empresas só oferece
a variação "Geral" e não lista contas do WhatsApp até o app ser provedor aprovado.

- App > Casos de uso > WhatsApp > Personalizar > integração de provedor de tecnologia.
- Análise do app com acesso avançado a `whatsapp_business_messaging`, `whatsapp_business_management`
  e `public_profile`.
- **Dois vídeos, gravados no número de TESTE da Meta**, nunca no da Barra Boat: envio de mensagem
  com o WhatsApp Web ao lado, e criação de modelo pelo painel. Eu preparo as telas e o roteiro.
- Não gravar passando por Clientes (dados reais vão para um revisor terceiro).
- Não usar o texto sugerido pela IA da Meta (na PO ele afirmava coisas que não existiam).
- Operadores a declarar: ErêHost (Brasil), Supabase (EUA), Freela In Home (Brasil), Anthropic (EUA,
  tradução do site). Controlador: a empresa da Barra Boat (razão social do CNPJ).

## 6. Coexistência do número (Michele com o celular)

- **Antes de tudo, abrir Configurações > Contas do WhatsApp e ver se o número já está lá.** Na PO o
  número já estava conectado e o cadastro falhou por isso (sessão inteira perdida).
- O número tem que estar no **WhatsApp Business** (não o comum), atualizado.
- A conexão é pela página de conexão que eu publico (cadastro incorporado da Meta).
- **A confirmação é por QR code no app. Se aparecer SMS ou ligação, parar**: é o fluxo que tira o
  número do celular e não se desfaz.
- Sincronizar contatos e histórico quando oferecer: é uma vez só, dentro de 24 h.
- O que ela perde no app: lista de transmissão (vira campanha pelo painel), mensagens temporárias nas
  conversas e aparelhos vinculados Windows/WearOS. Grupos e chamadas continuam, mas o robô não vê.
- **Abrir o app ao menos uma vez a cada 14 dias**, senão a conexão cai.

## 7. Pagamento e nome de exibição

- WhatsApp Manager > Faturamento: cartão da empresa, **a Michele cadastra**. Sem isso nenhuma
  mensagem iniciada pela empresa sai (erro 141006 na PO); as respostas do robô saem.
- Nome de exibição "Barra Boat Floripa": a Meta aprova em 1 a 3 dias.

## 8. O que eu faço com as chaves

Guardar num arquivo fora do repositório, como a senha do FTP:
`E:\Clientes\Barra Boat Floripa\Site\ferramentas\meta-chaves.txt` (ID do app, App Secret, token,
WABA ID, Phone Number ID). Nunca no chat, nunca no Git.

- Webhook `https://barraboatfloripa.com.br/whatsapp.php` com token de verificação nosso, campos
  `messages`, `smb_message_echoes`, `history`, `smb_app_state_sync`.
- **A WABA certa é a que o próprio número diz ser a dele** (na PO a tela mostrava outra).
- Inscrever o app na conta (`subscribed_apps`) **liga o robô para clientes reais**: só com ok.
- Modelos de mensagem recriados na conta real (modelo não passa de uma conta para outra).

## Custos (referência da PO)

Mensagem que o cliente inicia e as respostas em até 24 h: sem custo. Mensagem digitada no app: sem
custo. Modelo de marketing (campanha): cerca de R$ 0,31 por pessoa. Modelo de utilidade (lembrete,
reserva): bem menos.
