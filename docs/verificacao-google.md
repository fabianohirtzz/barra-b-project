# Verificação do app no Google (Barra Boat Agenda)

Projeto no Google Cloud: `barra-boat-agenda`, conta barraboatfloripa@gmail.com.
Escopo que o Google analisa: `calendar.events` (sensível). `calendar.calendarlist.readonly`, `openid` e `email` vêm junto.

Ordem: **1. gravar o vídeo → 2. subir no YouTube como "Não listado" → 3. colar os textos abaixo → 4. Confirmar.**
Sem o link do vídeo o botão Confirmar não libera.

---

## 1. O que o Google exige no vídeo (se faltar, recusa)

1. **Tela de permissão em inglês.** Na tela do Google, no rodapé, trocar "Português (Brasil)" por **English (United States)**
   antes de seguir. Os revisores pedem isso.
2. **ID do cliente visível na barra de endereço** durante a tela de permissão. O endereço tem `client_id=...`: dar zoom
   na barra (ou parar 3 segundos com ela inteira à mostra). Não pode ter extensão nem recorte escondendo a barra.
3. **Nome do app igual ao do Branding**: "Barra Boat Floripa".
4. **Mostrar o uso de cada permissão dentro do app**: a leitura (evento da agenda vira dia ocupado) e a escrita (reserva
   do painel vira evento na agenda; cancelar apaga).
5. Um vídeo só, contínuo de preferência, de 3 a 5 minutos. Não precisa de narração. Legendas em inglês ajudam (texto na
   tela ou legenda do YouTube), as frases estão no roteiro.

## 2. Preparação (10 minutos antes de gravar)

- **Navegador**: um Chrome limpo, sem abas pessoais à mostra, zoom 100%, janela grande. Esconder barra de favoritos.
- **Conta do "dono da lancha"**: uma conta Google de teste (a da Freela serve). Nela, criar a agenda **"Boat bookings"**
  (Google Agenda > Configurações > Criar nova agenda). Agenda vazia.
- **Painel**: logado em barraboatfloripa.com.br/painel/ com a conta da equipe.
- **Parceiro do vídeo**: Antonio Portuga, dono da Cabrasmar 37 (lancha ativa no site, página `/lanchas/3373/`). Conferir
  que ele está **desconectado** (Parceiros > Antonio > "Agenda do Antonio" sem conta Google).
- **Dois dias livres da Cabrasmar** para a gravação, por exemplo **10/12** (o dono anota) e **12/12** (a equipe marca).
- **Gravador**: no Mac, `Cmd + Shift + 5` > "Gravar a tela inteira" (ou só a janela do Chrome). Mostrar cliques ativado
  em Opções.

## 3. Roteiro do vídeo, cena por cena

Cada cena: **o que fazer**, **o que precisa aparecer** e a **legenda em inglês** (texto que vai na tela ou na legenda).

### Cena 1. O que é o app (15 s)
- Fazer: abrir `https://barraboatfloripa.com.br/`, rolar um pouco, depois abrir `/lanchas/3373/` e mostrar o calendário
  de datas livres da lancha.
- Aparecer: domínio na barra de endereço, o calendário com o 10/12 e o 12/12 livres.
- Legenda: *"Barra Boat Floripa rents private boats. Most boats belong to partner owners. This calendar shows which days
  each boat is free."*

### Cena 2. A equipe gera o convite do dono (25 s)
- Fazer: no painel, Parceiros > **Antonio Portuga** > "Mandar o link de conexão". Mostrar a mensagem pronta e tocar em
  **"Copiar só o link"**.
- Aparecer: a gaveta "Link de conexão" com o texto.
- Legenda: *"Our staff sends each boat owner a private invitation link. Only invited owners can connect a calendar."*

### Cena 3. O dono abre o link (20 s)
- Fazer: colar o link numa aba nova. Mostrar a página "Vamos ligar a sua agenda à Barra Boat", rolar devagar pelo
  "O que a Barra Boat vê e faz".
- Aparecer: a lista do que lemos e gravamos e o link da política de privacidade.
- Legenda: *"The owner sees exactly what we read and write before connecting: only the calendar he chooses, only booking
  events."*
- Tocar em **"Conectar com Google"**.

### Cena 4. Tela do Google: escolher conta, inglês e permissões (45 s), a cena mais importante
1. Escolher a conta de teste.
2. **Antes de qualquer outra coisa**, no rodapé da tela, trocar o idioma para **English (United States)**.
3. Se aparecer "Google hasn't verified this app": tocar em **Advanced** e **Go to Barra Boat Floripa (unsafe)**.
   (É esperado: o app está em análise. Pode aparecer na gravação.)
4. Na tela de permissões: **parar 3 segundos e dar zoom na barra de endereço** mostrando `client_id=...`.
5. Mostrar o nome "Barra Boat Floripa" no topo e as duas permissões:
   - "See the list of Google calendars you're subscribed to"
   - "View and edit events on all your calendars"
6. Marcar **Select all** e tocar em **Continue**.
- Legenda: *"The OAuth consent screen. App name: Barra Boat Floripa. The OAuth client ID is shown in the address bar.
  We request calendar.events and calendar.calendarlist.readonly."*

### Cena 5. Por que pedimos a lista de agendas (15 s)
- Aparecer: a página "Onde você anota as lanchas?" com as agendas da conta.
- Fazer: escolher **"Boat bookings"** e tocar em **"Usar esta agenda"**. Mostrar a tela "Agenda conectada".
- Legenda: *"calendar.calendarlist.readonly is used only to list the owner's calendars so he can pick one. We never read
  any other calendar."*

### Cena 6. LEITURA: o dono anota uma reserva e o dia fica ocupado (45 s)
1. Abrir o Google Agenda da conta de teste. Criar evento de **dia inteiro em 10/12**, na agenda **"Boat bookings"**,
   título **"Cabrasmar 37, João, 8 pessoas"**. Salvar.
2. Voltar ao painel > Agenda: a Cabrasmar 37 mostra **"dono"** em 10/12 (aparece em poucos segundos; se precisar,
   recarregar).
3. Abrir `/lanchas/3373/` no site: o 10/12 agora aparece **ocupado** no calendário.
- Legenda: *"Read (calendar.events): when the owner books his boat in his own calendar, that day becomes unavailable on
  our website within seconds. We store only the date and the boat, never the event title or description."*

### Cena 7. ESCRITA: a equipe marca um passeio e ele entra na agenda do dono (45 s)
1. No painel > Agenda, tocar em **Cabrasmar 37, 12/12** > "Marcar um passeio". Cliente "Maria Teste", 6 pessoas,
   embarque 10:00. "Marcar o passeio".
2. Abrir a gaveta do passeio: "Este passeio está na agenda Google do Antonio."
3. Ir ao Google Agenda da conta de teste, 12/12: o evento **"Reserva Barra Boat: Cabrasmar 37, Maria Teste, 6 pessoas"**,
   10:00 às 17:00. Abrir o evento e mostrar a descrição.
- Legenda: *"Write (calendar.events): bookings made by our staff are created in the owner's chosen calendar, so the same
  boat is never sold twice on the same day."*

### Cena 8. Cancelar apaga o evento (20 s)
1. No painel, abrir o passeio de 12/12 > "Cancelar este passeio" (tocar duas vezes).
2. No Google Agenda, 12/12: o evento sumiu.
- Legenda: *"When a booking is cancelled, we delete only the event we created."*

### Cena 9. Desconectar (20 s)
1. No painel, Parceiros > Antonio > **"Desconectar a conta Google"** (tocar duas vezes).
2. Mostrar `/politica-de-privacidade/#agenda-google` rapidamente.
- Legenda: *"The owner or our staff can disconnect at any time. The stored authorization and the days read are deleted.
  Data use follows the Google API Services User Data Policy, including Limited Use."*

**Depois de gravar**: apagar o evento de 10/12 da agenda de teste (ou a agenda inteira) e o passeio cancelado de
12/12 fica no histórico (ou apagar pelo SQL, como no teste de 26/11).

## 4. Subir no YouTube

- youtube.com > Criar > Enviar vídeo, com a conta barraboatfloripa@gmail.com.
- Título: `Barra Boat Floripa - Google Calendar integration (OAuth verification demo)`
- Visibilidade: **Não listado** (não "Privado": o revisor do Google precisa abrir).
- Copiar o link.

## 5. Textos para colar no Google (Central de verificação > Enviar)

### Justificativa do escopo (calendar.events)

> Barra Boat Floripa rents private boats, most of them owned by partner boat owners. Each owner connects one Google
> Calendar of his choice, through a private invitation link sent by our staff. We read the events of that calendar only
> to mark which days each boat is already booked; we store only the date and the boat, never titles or descriptions. We
> create, update and delete events only for the bookings our team makes on that owner's boats, so the owner sees them in
> his own calendar and the same boat is never sold twice for the same day. calendar.events is the narrowest scope that
> allows reading and writing events on the single calendar the owner selects. calendar.calendarlist.readonly is used
> only to show the owner his list of calendars so he can choose one. We do not access any other Google data.

### Link do vídeo
O link do YouTube (não listado).

### Mais informações

> The app is used by Barra Boat Floripa's staff (a boat rental company in Florianopolis, Brazil) and by about 20 partner
> boat owners. There is no public sign-up: each owner receives a private, signed invitation link (valid for 14 days)
> from our staff panel, opens https://barraboatfloripa.com.br/conectar-agenda/, signs in with Google and picks one
> calendar. The video shows the whole flow: invitation, consent screen (client ID in the address bar), calendar choice,
> an owner's event blocking a day on our public website, a booking from our panel created in the owner's calendar, the
> cancellation deleting it, and the disconnection. Refresh tokens are stored encrypted (AES-256-GCM) on our server and
> deleted when the owner disconnects. Privacy policy: https://barraboatfloripa.com.br/politica-de-privacidade/#agenda-google
> Terms: https://barraboatfloripa.com.br/termos-de-uso/

## 6. Depois de enviar

- O Google responde por e-mail para barraboatfloripa@gmail.com (às vezes pede ajustes no vídeo ou no texto). Prazo
  comum: de alguns dias a 4 semanas.
- Enquanto analisa, tudo continua funcionando com o aviso de "app não verificado" (até 100 contas).
- Se pedirem **verificação de marca** de novo: o domínio já está verificado no Search Console pela mesma conta.
