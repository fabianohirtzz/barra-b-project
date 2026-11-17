-- Carga inicial: 17 lanchas e 2 roteiros, iguais ao site da prévia.
-- GERADO por tools/gerar_carga.py. Não editar à mão. Rodar depois das migrations 01 a 05.
-- "on conflict do nothing": rodar de novo não sobrescreve o que foi editado no painel.
-- Todas entram como lancha própria (parceiro_id nulo); a Michele marca o dono de cada uma no painel.

insert into public.bb_lanchas (slug, legado_id, nome, pes, passageiros, regiao, itens, capa_url, fotos, ordem)
select slug, legado_id, nome, pes, passageiros, regiao, itens, capa_url, fotos, ordem
  from jsonb_to_recordset($carga$[
 {
  "slug": "1564",
  "legado_id": 1564,
  "nome": "Phantom 36",
  "pes": 36.0,
  "passageiros": 13,
  "regiao": "Leste da Ilha",
  "itens": [
   "Cabine com cama de casal e sofá",
   "Banheiro com ducha quente",
   "Vaso sanitário elétrico",
   "Gerador",
   "Geleira externa e cooler extra",
   "Cockpit amplo",
   "Solário estofado",
   "Som potente com conexão Bluetooth",
   "Churrasqueira a carvão",
   "2 motores Volvo Penta",
   "1 Stand Up Paddle",
   "1 Boia Splash Deck",
   "Bóias tipo espaguete",
   "Coletes para banho adulto e infantil",
   "Coletes salva-vidas homologados para mar aberto",
   "Boia circular para resgate",
   "Extintor de incêndio",
   "Kit pirotécnico",
   "Kit Primeiros Socorros"
  ],
  "capa_url": "/assets/img/lanchas/1564.webp",
  "fotos": [
   {
    "url": "/assets/img/lanchas/1564/01.webp",
    "url_p": "/assets/img/lanchas/1564/01-p.webp",
    "alt": "Phantom 36, foto 1"
   },
   {
    "url": "/assets/img/lanchas/1564/02.webp",
    "url_p": "/assets/img/lanchas/1564/02-p.webp",
    "alt": "Phantom 36, foto 2"
   },
   {
    "url": "/assets/img/lanchas/1564/03.webp",
    "url_p": "/assets/img/lanchas/1564/03-p.webp",
    "alt": "Phantom 36, foto 3"
   },
   {
    "url": "/assets/img/lanchas/1564/04.webp",
    "url_p": "/assets/img/lanchas/1564/04-p.webp",
    "alt": "Phantom 36, foto 4"
   },
   {
    "url": "/assets/img/lanchas/1564/05.webp",
    "url_p": "/assets/img/lanchas/1564/05-p.webp",
    "alt": "Phantom 36, foto 5"
   },
   {
    "url": "/assets/img/lanchas/1564/06.webp",
    "url_p": "/assets/img/lanchas/1564/06-p.webp",
    "alt": "Phantom 36, foto 6"
   },
   {
    "url": "/assets/img/lanchas/1564/07.webp",
    "url_p": "/assets/img/lanchas/1564/07-p.webp",
    "alt": "Phantom 36, foto 7"
   },
   {
    "url": "/assets/img/lanchas/1564/08.webp",
    "url_p": "/assets/img/lanchas/1564/08-p.webp",
    "alt": "Phantom 36, foto 8"
   },
   {
    "url": "/assets/img/lanchas/1564/09.webp",
    "url_p": "/assets/img/lanchas/1564/09-p.webp",
    "alt": "Phantom 36, foto 9"
   },
   {
    "url": "/assets/img/lanchas/1564/10.webp",
    "url_p": "/assets/img/lanchas/1564/10-p.webp",
    "alt": "Phantom 36, foto 10"
   }
  ],
  "ordem": 0
 },
 {
  "slug": "phantom30bb",
  "legado_id": 1090,
  "nome": "Phantom 30 BB",
  "pes": 29.0,
  "passageiros": 12,
  "regiao": "Leste da Ilha",
  "itens": [
   "Cabine espaçosa",
   "Quarto com ventiladores",
   "Banheiro elétrico",
   "Piso em EVA",
   "Som bluetooth JBL",
   "Iluminação",
   "Sonda, GPS e rádio VHF",
   "Churrasqueira a carvão",
   "Cooler",
   "Geladeira térmica",
   "Chaise",
   "Mesa",
   "Deck de popa aberto e alongado",
   "Proa com estofamento",
   "Carregador 12v",
   "Fechamento frontal e lateral",
   "Toldo",
   "Cristaleira com copos e taças",
   "Pia com água doce",
   "Cafeteira",
   "Kit salvatagem",
   "Prancha stand up",
   "Boias macarrão",
   "Tapete flutuante",
   "Stand Up"
  ],
  "capa_url": "/assets/img/lanchas/phantom30bb.webp",
  "fotos": [
   {
    "url": "/assets/img/lanchas/phantom30bb/01.webp",
    "url_p": "/assets/img/lanchas/phantom30bb/01-p.webp",
    "alt": "Phantom 30 BB, foto 1"
   },
   {
    "url": "/assets/img/lanchas/phantom30bb/02.webp",
    "url_p": "/assets/img/lanchas/phantom30bb/02-p.webp",
    "alt": "Phantom 30 BB, foto 2"
   },
   {
    "url": "/assets/img/lanchas/phantom30bb/03.webp",
    "url_p": "/assets/img/lanchas/phantom30bb/03-p.webp",
    "alt": "Phantom 30 BB, foto 3"
   },
   {
    "url": "/assets/img/lanchas/phantom30bb/04.webp",
    "url_p": "/assets/img/lanchas/phantom30bb/04-p.webp",
    "alt": "Phantom 30 BB, foto 4"
   },
   {
    "url": "/assets/img/lanchas/phantom30bb/05.webp",
    "url_p": "/assets/img/lanchas/phantom30bb/05-p.webp",
    "alt": "Phantom 30 BB, foto 5"
   },
   {
    "url": "/assets/img/lanchas/phantom30bb/06.webp",
    "url_p": "/assets/img/lanchas/phantom30bb/06-p.webp",
    "alt": "Phantom 30 BB, foto 6"
   },
   {
    "url": "/assets/img/lanchas/phantom30bb/07.webp",
    "url_p": "/assets/img/lanchas/phantom30bb/07-p.webp",
    "alt": "Phantom 30 BB, foto 7"
   },
   {
    "url": "/assets/img/lanchas/phantom30bb/08.webp",
    "url_p": "/assets/img/lanchas/phantom30bb/08-p.webp",
    "alt": "Phantom 30 BB, foto 8"
   },
   {
    "url": "/assets/img/lanchas/phantom30bb/09.webp",
    "url_p": "/assets/img/lanchas/phantom30bb/09-p.webp",
    "alt": "Phantom 30 BB, foto 9"
   },
   {
    "url": "/assets/img/lanchas/phantom30bb/10.webp",
    "url_p": "/assets/img/lanchas/phantom30bb/10-p.webp",
    "alt": "Phantom 30 BB, foto 10"
   },
   {
    "url": "/assets/img/lanchas/phantom30bb/11.webp",
    "url_p": "/assets/img/lanchas/phantom30bb/11-p.webp",
    "alt": "Phantom 30 BB, foto 11"
   },
   {
    "url": "/assets/img/lanchas/phantom30bb/12.webp",
    "url_p": "/assets/img/lanchas/phantom30bb/12-p.webp",
    "alt": "Phantom 30 BB, foto 12"
   },
   {
    "url": "/assets/img/lanchas/phantom30bb/13.webp",
    "url_p": "/assets/img/lanchas/phantom30bb/13-p.webp",
    "alt": "Phantom 30 BB, foto 13"
   },
   {
    "url": "/assets/img/lanchas/phantom30bb/14.webp",
    "url_p": "/assets/img/lanchas/phantom30bb/14-p.webp",
    "alt": "Phantom 30 BB, foto 14"
   },
   {
    "url": "/assets/img/lanchas/phantom30bb/15.webp",
    "url_p": "/assets/img/lanchas/phantom30bb/15-p.webp",
    "alt": "Phantom 30 BB, foto 15"
   },
   {
    "url": "/assets/img/lanchas/phantom30bb/16.webp",
    "url_p": "/assets/img/lanchas/phantom30bb/16-p.webp",
    "alt": "Phantom 30 BB, foto 16"
   },
   {
    "url": "/assets/img/lanchas/phantom30bb/17.webp",
    "url_p": "/assets/img/lanchas/phantom30bb/17-p.webp",
    "alt": "Phantom 30 BB, foto 17"
   },
   {
    "url": "/assets/img/lanchas/phantom30bb/18.webp",
    "url_p": "/assets/img/lanchas/phantom30bb/18-p.webp",
    "alt": "Phantom 30 BB, foto 18"
   },
   {
    "url": "/assets/img/lanchas/phantom30bb/19.webp",
    "url_p": "/assets/img/lanchas/phantom30bb/19-p.webp",
    "alt": "Phantom 30 BB, foto 19"
   }
  ],
  "ordem": 1
 },
 {
  "slug": "phantom-36c",
  "legado_id": 1399,
  "nome": "Phantom 36 C",
  "pes": 36.0,
  "passageiros": 11,
  "regiao": "Leste da Ilha",
  "itens": [
   "Cabine espaçosa",
   "Quarto",
   "Banheiro elétrico",
   "Piso em EVA",
   "Som bluetooth",
   "Iluminação",
   "Sonda, GPS e rádio VHF",
   "Churrasqueira a carvão",
   "Cooler",
   "Geladeira térmica",
   "Chaise",
   "Mesa",
   "Deck de popa aberto",
   "Proa com estofamento",
   "Carregador 12v",
   "Fechamento frontal e lateral",
   "Toldo",
   "Cristaleira com copos e taças",
   "Pia com água doce",
   "Kit salvatagem",
   "Boias macarrão"
  ],
  "capa_url": "/assets/img/lanchas/phantom-36c.webp",
  "fotos": [
   {
    "url": "/assets/img/lanchas/phantom-36c/01.webp",
    "url_p": "/assets/img/lanchas/phantom-36c/01-p.webp",
    "alt": "Phantom 36 C, foto 1"
   },
   {
    "url": "/assets/img/lanchas/phantom-36c/02.webp",
    "url_p": "/assets/img/lanchas/phantom-36c/02-p.webp",
    "alt": "Phantom 36 C, foto 2"
   },
   {
    "url": "/assets/img/lanchas/phantom-36c/03.webp",
    "url_p": "/assets/img/lanchas/phantom-36c/03-p.webp",
    "alt": "Phantom 36 C, foto 3"
   },
   {
    "url": "/assets/img/lanchas/phantom-36c/04.webp",
    "url_p": "/assets/img/lanchas/phantom-36c/04-p.webp",
    "alt": "Phantom 36 C, foto 4"
   },
   {
    "url": "/assets/img/lanchas/phantom-36c/05.webp",
    "url_p": "/assets/img/lanchas/phantom-36c/05-p.webp",
    "alt": "Phantom 36 C, foto 5"
   },
   {
    "url": "/assets/img/lanchas/phantom-36c/06.webp",
    "url_p": "/assets/img/lanchas/phantom-36c/06-p.webp",
    "alt": "Phantom 36 C, foto 6"
   },
   {
    "url": "/assets/img/lanchas/phantom-36c/07.webp",
    "url_p": "/assets/img/lanchas/phantom-36c/07-p.webp",
    "alt": "Phantom 36 C, foto 7"
   },
   {
    "url": "/assets/img/lanchas/phantom-36c/08.webp",
    "url_p": "/assets/img/lanchas/phantom-36c/08-p.webp",
    "alt": "Phantom 36 C, foto 8"
   },
   {
    "url": "/assets/img/lanchas/phantom-36c/09.webp",
    "url_p": "/assets/img/lanchas/phantom-36c/09-p.webp",
    "alt": "Phantom 36 C, foto 9"
   },
   {
    "url": "/assets/img/lanchas/phantom-36c/10.webp",
    "url_p": "/assets/img/lanchas/phantom-36c/10-p.webp",
    "alt": "Phantom 36 C, foto 10"
   },
   {
    "url": "/assets/img/lanchas/phantom-36c/11.webp",
    "url_p": "/assets/img/lanchas/phantom-36c/11-p.webp",
    "alt": "Phantom 36 C, foto 11"
   },
   {
    "url": "/assets/img/lanchas/phantom-36c/12.webp",
    "url_p": "/assets/img/lanchas/phantom-36c/12-p.webp",
    "alt": "Phantom 36 C, foto 12"
   },
   {
    "url": "/assets/img/lanchas/phantom-36c/13.webp",
    "url_p": "/assets/img/lanchas/phantom-36c/13-p.webp",
    "alt": "Phantom 36 C, foto 13"
   },
   {
    "url": "/assets/img/lanchas/phantom-36c/14.webp",
    "url_p": "/assets/img/lanchas/phantom-36c/14-p.webp",
    "alt": "Phantom 36 C, foto 14"
   },
   {
    "url": "/assets/img/lanchas/phantom-36c/15.webp",
    "url_p": "/assets/img/lanchas/phantom-36c/15-p.webp",
    "alt": "Phantom 36 C, foto 15"
   },
   {
    "url": "/assets/img/lanchas/phantom-36c/16.webp",
    "url_p": "/assets/img/lanchas/phantom-36c/16-p.webp",
    "alt": "Phantom 36 C, foto 16"
   }
  ],
  "ordem": 2
 },
 {
  "slug": "phantom-30",
  "legado_id": 552,
  "nome": "Phantom 30 C",
  "pes": 30.0,
  "passageiros": 11,
  "regiao": "Leste da Ilha",
  "itens": [
   "Cabinada e espaçosa",
   "Banheiro elétrico",
   "Deck de popa",
   "Solarium na proa",
   "Som bluetooth",
   "Churrasqueira a carvão",
   "Kit de salvatagem",
   "Kit com Louças e Taças",
   "Piso antiderrapante",
   "Toldo e fechamento frontal e lateral",
   "Cooler",
   "Geladeira térmica"
  ],
  "capa_url": "/assets/img/lanchas/phantom-30.webp",
  "fotos": [
   {
    "url": "/assets/img/lanchas/phantom-30/01.webp",
    "url_p": "/assets/img/lanchas/phantom-30/01-p.webp",
    "alt": "Phantom 30 C, foto 1"
   },
   {
    "url": "/assets/img/lanchas/phantom-30/02.webp",
    "url_p": "/assets/img/lanchas/phantom-30/02-p.webp",
    "alt": "Phantom 30 C, foto 2"
   },
   {
    "url": "/assets/img/lanchas/phantom-30/03.webp",
    "url_p": "/assets/img/lanchas/phantom-30/03-p.webp",
    "alt": "Phantom 30 C, foto 3"
   },
   {
    "url": "/assets/img/lanchas/phantom-30/04.webp",
    "url_p": "/assets/img/lanchas/phantom-30/04-p.webp",
    "alt": "Phantom 30 C, foto 4"
   },
   {
    "url": "/assets/img/lanchas/phantom-30/05.webp",
    "url_p": "/assets/img/lanchas/phantom-30/05-p.webp",
    "alt": "Phantom 30 C, foto 5"
   },
   {
    "url": "/assets/img/lanchas/phantom-30/06.webp",
    "url_p": "/assets/img/lanchas/phantom-30/06-p.webp",
    "alt": "Phantom 30 C, foto 6"
   },
   {
    "url": "/assets/img/lanchas/phantom-30/07.webp",
    "url_p": "/assets/img/lanchas/phantom-30/07-p.webp",
    "alt": "Phantom 30 C, foto 7"
   },
   {
    "url": "/assets/img/lanchas/phantom-30/08.webp",
    "url_p": "/assets/img/lanchas/phantom-30/08-p.webp",
    "alt": "Phantom 30 C, foto 8"
   },
   {
    "url": "/assets/img/lanchas/phantom-30/09.webp",
    "url_p": "/assets/img/lanchas/phantom-30/09-p.webp",
    "alt": "Phantom 30 C, foto 9"
   },
   {
    "url": "/assets/img/lanchas/phantom-30/10.webp",
    "url_p": "/assets/img/lanchas/phantom-30/10-p.webp",
    "alt": "Phantom 30 C, foto 10"
   },
   {
    "url": "/assets/img/lanchas/phantom-30/11.webp",
    "url_p": "/assets/img/lanchas/phantom-30/11-p.webp",
    "alt": "Phantom 30 C, foto 11"
   },
   {
    "url": "/assets/img/lanchas/phantom-30/12.webp",
    "url_p": "/assets/img/lanchas/phantom-30/12-p.webp",
    "alt": "Phantom 30 C, foto 12"
   }
  ],
  "ordem": 3
 },
 {
  "slug": "3373",
  "legado_id": 3373,
  "nome": "Cabrasmar 37",
  "pes": 37.0,
  "passageiros": 10,
  "regiao": "Leste da Ilha",
  "itens": [
   "Fly",
   "Cabinada",
   "Solarium espaçoso",
   "Banheiro",
   "Espaço Gourmet",
   "Stand up",
   "Tapete Flutuante"
  ],
  "capa_url": "/assets/img/lanchas/3373.webp",
  "fotos": [
   {
    "url": "/assets/img/lanchas/3373/01.webp",
    "url_p": "/assets/img/lanchas/3373/01-p.webp",
    "alt": "Cabrasmar 37, foto 1"
   },
   {
    "url": "/assets/img/lanchas/3373/02.webp",
    "url_p": "/assets/img/lanchas/3373/02-p.webp",
    "alt": "Cabrasmar 37, foto 2"
   },
   {
    "url": "/assets/img/lanchas/3373/03.webp",
    "url_p": "/assets/img/lanchas/3373/03-p.webp",
    "alt": "Cabrasmar 37, foto 3"
   },
   {
    "url": "/assets/img/lanchas/3373/04.webp",
    "url_p": "/assets/img/lanchas/3373/04-p.webp",
    "alt": "Cabrasmar 37, foto 4"
   },
   {
    "url": "/assets/img/lanchas/3373/05.webp",
    "url_p": "/assets/img/lanchas/3373/05-p.webp",
    "alt": "Cabrasmar 37, foto 5"
   },
   {
    "url": "/assets/img/lanchas/3373/06.webp",
    "url_p": "/assets/img/lanchas/3373/06-p.webp",
    "alt": "Cabrasmar 37, foto 6"
   },
   {
    "url": "/assets/img/lanchas/3373/07.webp",
    "url_p": "/assets/img/lanchas/3373/07-p.webp",
    "alt": "Cabrasmar 37, foto 7"
   },
   {
    "url": "/assets/img/lanchas/3373/08.webp",
    "url_p": "/assets/img/lanchas/3373/08-p.webp",
    "alt": "Cabrasmar 37, foto 8"
   },
   {
    "url": "/assets/img/lanchas/3373/09.webp",
    "url_p": "/assets/img/lanchas/3373/09-p.webp",
    "alt": "Cabrasmar 37, foto 9"
   }
  ],
  "ordem": 4
 },
 {
  "slug": "3363",
  "legado_id": 3363,
  "nome": "My Nega 30",
  "pes": 30.0,
  "passageiros": 10,
  "regiao": "Norte da Ilha",
  "itens": [
   "Cabinada com Frigobar e acessórios",
   "Banheiro",
   "Churrasqueira",
   "Stand up",
   "Tapete Flutuante",
   "Som Bluetooth",
   "Espaço Gourmet",
   "Quarto"
  ],
  "capa_url": "/assets/img/lanchas/3363.webp",
  "fotos": [
   {
    "url": "/assets/img/lanchas/3363/01.webp",
    "url_p": "/assets/img/lanchas/3363/01-p.webp",
    "alt": "My Nega 30, foto 1"
   },
   {
    "url": "/assets/img/lanchas/3363/02.webp",
    "url_p": "/assets/img/lanchas/3363/02-p.webp",
    "alt": "My Nega 30, foto 2"
   },
   {
    "url": "/assets/img/lanchas/3363/03.webp",
    "url_p": "/assets/img/lanchas/3363/03-p.webp",
    "alt": "My Nega 30, foto 3"
   },
   {
    "url": "/assets/img/lanchas/3363/04.webp",
    "url_p": "/assets/img/lanchas/3363/04-p.webp",
    "alt": "My Nega 30, foto 4"
   },
   {
    "url": "/assets/img/lanchas/3363/05.webp",
    "url_p": "/assets/img/lanchas/3363/05-p.webp",
    "alt": "My Nega 30, foto 5"
   },
   {
    "url": "/assets/img/lanchas/3363/06.webp",
    "url_p": "/assets/img/lanchas/3363/06-p.webp",
    "alt": "My Nega 30, foto 6"
   },
   {
    "url": "/assets/img/lanchas/3363/07.webp",
    "url_p": "/assets/img/lanchas/3363/07-p.webp",
    "alt": "My Nega 30, foto 7"
   },
   {
    "url": "/assets/img/lanchas/3363/08.webp",
    "url_p": "/assets/img/lanchas/3363/08-p.webp",
    "alt": "My Nega 30, foto 8"
   },
   {
    "url": "/assets/img/lanchas/3363/09.webp",
    "url_p": "/assets/img/lanchas/3363/09-p.webp",
    "alt": "My Nega 30, foto 9"
   }
  ],
  "ordem": 5
 },
 {
  "slug": "phantom29g",
  "legado_id": 1556,
  "nome": "Phantom 29 G",
  "pes": 29.0,
  "passageiros": 9,
  "regiao": "Leste da Ilha",
  "itens": [
   "Cabinada e espaçosa",
   "Banheiro elétrico",
   "Deck de popa",
   "Solarium na proa",
   "Som bluetooth",
   "Churrasqueira a carvão",
   "Kit de salvatagem",
   "Kit com Louças e Taças",
   "Piso antiderrapante",
   "Toldo e fechamento frontal e lateral",
   "Cooler",
   "Geladeira térmica",
   "Carvão e sal para o churrasco",
   "Boias tipo espaguete",
   "1 Stand Up Paddle",
   "1 Tapete Flutuante",
   "Máscara de mergulho"
  ],
  "capa_url": "/assets/img/lanchas/phantom29g.webp",
  "fotos": [
   {
    "url": "/assets/img/lanchas/phantom29g/01.webp",
    "url_p": "/assets/img/lanchas/phantom29g/01-p.webp",
    "alt": "Phantom 29 G, foto 1"
   },
   {
    "url": "/assets/img/lanchas/phantom29g/02.webp",
    "url_p": "/assets/img/lanchas/phantom29g/02-p.webp",
    "alt": "Phantom 29 G, foto 2"
   },
   {
    "url": "/assets/img/lanchas/phantom29g/03.webp",
    "url_p": "/assets/img/lanchas/phantom29g/03-p.webp",
    "alt": "Phantom 29 G, foto 3"
   },
   {
    "url": "/assets/img/lanchas/phantom29g/04.webp",
    "url_p": "/assets/img/lanchas/phantom29g/04-p.webp",
    "alt": "Phantom 29 G, foto 4"
   },
   {
    "url": "/assets/img/lanchas/phantom29g/05.webp",
    "url_p": "/assets/img/lanchas/phantom29g/05-p.webp",
    "alt": "Phantom 29 G, foto 5"
   },
   {
    "url": "/assets/img/lanchas/phantom29g/06.webp",
    "url_p": "/assets/img/lanchas/phantom29g/06-p.webp",
    "alt": "Phantom 29 G, foto 6"
   },
   {
    "url": "/assets/img/lanchas/phantom29g/07.webp",
    "url_p": "/assets/img/lanchas/phantom29g/07-p.webp",
    "alt": "Phantom 29 G, foto 7"
   }
  ],
  "ordem": 6
 },
 {
  "slug": "phantom-29-my-girl",
  "legado_id": 544,
  "nome": "Phantom 29 My Girls",
  "pes": 29.0,
  "passageiros": 9,
  "regiao": "Leste da Ilha",
  "itens": [
   "Cabinada e espaçosa",
   "Banheiro elétrico",
   "Deck de popa",
   "Solarium na proa",
   "Som bluetooth",
   "Churrasqueira a carvão",
   "Kit de salvatagem",
   "Kit com Louças",
   "Piso antiderrapante",
   "Toldo e fechamento frontal e lateral",
   "Cooler",
   "Geladeira térmica"
  ],
  "capa_url": "/assets/img/lanchas/phantom-29-my-girl.webp",
  "fotos": [
   {
    "url": "/assets/img/lanchas/phantom-29-my-girl/01.webp",
    "url_p": "/assets/img/lanchas/phantom-29-my-girl/01-p.webp",
    "alt": "Phantom 29 My Girls, foto 1"
   },
   {
    "url": "/assets/img/lanchas/phantom-29-my-girl/02.webp",
    "url_p": "/assets/img/lanchas/phantom-29-my-girl/02-p.webp",
    "alt": "Phantom 29 My Girls, foto 2"
   },
   {
    "url": "/assets/img/lanchas/phantom-29-my-girl/03.webp",
    "url_p": "/assets/img/lanchas/phantom-29-my-girl/03-p.webp",
    "alt": "Phantom 29 My Girls, foto 3"
   },
   {
    "url": "/assets/img/lanchas/phantom-29-my-girl/04.webp",
    "url_p": "/assets/img/lanchas/phantom-29-my-girl/04-p.webp",
    "alt": "Phantom 29 My Girls, foto 4"
   },
   {
    "url": "/assets/img/lanchas/phantom-29-my-girl/05.webp",
    "url_p": "/assets/img/lanchas/phantom-29-my-girl/05-p.webp",
    "alt": "Phantom 29 My Girls, foto 5"
   }
  ],
  "ordem": 7
 },
 {
  "slug": "phantom-29",
  "legado_id": 362,
  "nome": "Phantom 29 Bravo",
  "pes": 29.0,
  "passageiros": 9,
  "regiao": "Leste da Ilha",
  "itens": [
   "Cabinada e espaçosa",
   "Banheiro elétrico",
   "Deck de popa",
   "Solarium na proa",
   "Som bluetooth",
   "Iluminação e luz subaquática",
   "Churrasqueira a carvão",
   "Kit de salvatagem",
   "Kit com Louças",
   "Piso antiderrapante",
   "Toldo e fechamento frontal e lateral",
   "Cooler",
   "Geladeira térmica",
   "Tapete Flutuante"
  ],
  "capa_url": "/assets/img/lanchas/phantom-29.webp",
  "fotos": [
   {
    "url": "/assets/img/lanchas/phantom-29/01.webp",
    "url_p": "/assets/img/lanchas/phantom-29/01-p.webp",
    "alt": "Phantom 29 Bravo, foto 1"
   },
   {
    "url": "/assets/img/lanchas/phantom-29/02.webp",
    "url_p": "/assets/img/lanchas/phantom-29/02-p.webp",
    "alt": "Phantom 29 Bravo, foto 2"
   },
   {
    "url": "/assets/img/lanchas/phantom-29/03.webp",
    "url_p": "/assets/img/lanchas/phantom-29/03-p.webp",
    "alt": "Phantom 29 Bravo, foto 3"
   },
   {
    "url": "/assets/img/lanchas/phantom-29/04.webp",
    "url_p": "/assets/img/lanchas/phantom-29/04-p.webp",
    "alt": "Phantom 29 Bravo, foto 4"
   },
   {
    "url": "/assets/img/lanchas/phantom-29/05.webp",
    "url_p": "/assets/img/lanchas/phantom-29/05-p.webp",
    "alt": "Phantom 29 Bravo, foto 5"
   },
   {
    "url": "/assets/img/lanchas/phantom-29/06.webp",
    "url_p": "/assets/img/lanchas/phantom-29/06-p.webp",
    "alt": "Phantom 29 Bravo, foto 6"
   },
   {
    "url": "/assets/img/lanchas/phantom-29/07.webp",
    "url_p": "/assets/img/lanchas/phantom-29/07-p.webp",
    "alt": "Phantom 29 Bravo, foto 7"
   },
   {
    "url": "/assets/img/lanchas/phantom-29/08.webp",
    "url_p": "/assets/img/lanchas/phantom-29/08-p.webp",
    "alt": "Phantom 29 Bravo, foto 8"
   },
   {
    "url": "/assets/img/lanchas/phantom-29/09.webp",
    "url_p": "/assets/img/lanchas/phantom-29/09-p.webp",
    "alt": "Phantom 29 Bravo, foto 9"
   },
   {
    "url": "/assets/img/lanchas/phantom-29/10.webp",
    "url_p": "/assets/img/lanchas/phantom-29/10-p.webp",
    "alt": "Phantom 29 Bravo, foto 10"
   },
   {
    "url": "/assets/img/lanchas/phantom-29/11.webp",
    "url_p": "/assets/img/lanchas/phantom-29/11-p.webp",
    "alt": "Phantom 29 Bravo, foto 11"
   }
  ],
  "ordem": 8
 },
 {
  "slug": "hd26-lulu",
  "legado_id": 1597,
  "nome": "HD 26 Lulu",
  "pes": 26.0,
  "passageiros": 9,
  "regiao": "Leste da Ilha",
  "itens": [
   "Cabine",
   "Banheiro elétrico",
   "Som Bluetooth",
   "Churrasqueira a carvão",
   "Sonda e GPS",
   "Toldo e fechamento frontal e lateral",
   "Chuveiro de popa",
   "Deck de proa",
   "Piso antiderrapante",
   "Cooler",
   "Porta objetos",
   "Popa fechada",
   "Sistema de luz",
   "Carregador 12v",
   "Mesa",
   "Kit de louça, copos e taças",
   "Tapete flutuante"
  ],
  "capa_url": "/assets/img/lanchas/hd26-lulu.webp",
  "fotos": [
   {
    "url": "/assets/img/lanchas/hd26-lulu/01.webp",
    "url_p": "/assets/img/lanchas/hd26-lulu/01-p.webp",
    "alt": "HD 26 Lulu, foto 1"
   },
   {
    "url": "/assets/img/lanchas/hd26-lulu/02.webp",
    "url_p": "/assets/img/lanchas/hd26-lulu/02-p.webp",
    "alt": "HD 26 Lulu, foto 2"
   },
   {
    "url": "/assets/img/lanchas/hd26-lulu/03.webp",
    "url_p": "/assets/img/lanchas/hd26-lulu/03-p.webp",
    "alt": "HD 26 Lulu, foto 3"
   },
   {
    "url": "/assets/img/lanchas/hd26-lulu/04.webp",
    "url_p": "/assets/img/lanchas/hd26-lulu/04-p.webp",
    "alt": "HD 26 Lulu, foto 4"
   },
   {
    "url": "/assets/img/lanchas/hd26-lulu/05.webp",
    "url_p": "/assets/img/lanchas/hd26-lulu/05-p.webp",
    "alt": "HD 26 Lulu, foto 5"
   },
   {
    "url": "/assets/img/lanchas/hd26-lulu/06.webp",
    "url_p": "/assets/img/lanchas/hd26-lulu/06-p.webp",
    "alt": "HD 26 Lulu, foto 6"
   },
   {
    "url": "/assets/img/lanchas/hd26-lulu/07.webp",
    "url_p": "/assets/img/lanchas/hd26-lulu/07-p.webp",
    "alt": "HD 26 Lulu, foto 7"
   },
   {
    "url": "/assets/img/lanchas/hd26-lulu/08.webp",
    "url_p": "/assets/img/lanchas/hd26-lulu/08-p.webp",
    "alt": "HD 26 Lulu, foto 8"
   }
  ],
  "ordem": 9
 },
 {
  "slug": "hd-26-pes-lanai",
  "legado_id": 1295,
  "nome": "HD 26 Lanai",
  "pes": 26.0,
  "passageiros": 9,
  "regiao": "Leste da Ilha",
  "itens": [
   "Cabine",
   "Banheiro elétrico",
   "Som Bluetooth",
   "Churrasqueira a carvão",
   "Sonda e GPS",
   "Toldo",
   "Chuveiro de popa",
   "Deck de proa",
   "Piso antiderrapante",
   "Cooler",
   "Porta objetos",
   "Popa fechada",
   "Sistema de luz",
   "Carregador 12v",
   "Mesa",
   "Kit churrasco",
   "Aluguel de Tapete flutuante"
  ],
  "capa_url": "/assets/img/lanchas/hd-26-pes-lanai.webp",
  "fotos": [
   {
    "url": "/assets/img/lanchas/hd-26-pes-lanai/01.webp",
    "url_p": "/assets/img/lanchas/hd-26-pes-lanai/01-p.webp",
    "alt": "HD 26 Lanai, foto 1"
   },
   {
    "url": "/assets/img/lanchas/hd-26-pes-lanai/02.webp",
    "url_p": "/assets/img/lanchas/hd-26-pes-lanai/02-p.webp",
    "alt": "HD 26 Lanai, foto 2"
   },
   {
    "url": "/assets/img/lanchas/hd-26-pes-lanai/03.webp",
    "url_p": "/assets/img/lanchas/hd-26-pes-lanai/03-p.webp",
    "alt": "HD 26 Lanai, foto 3"
   },
   {
    "url": "/assets/img/lanchas/hd-26-pes-lanai/04.webp",
    "url_p": "/assets/img/lanchas/hd-26-pes-lanai/04-p.webp",
    "alt": "HD 26 Lanai, foto 4"
   },
   {
    "url": "/assets/img/lanchas/hd-26-pes-lanai/05.webp",
    "url_p": "/assets/img/lanchas/hd-26-pes-lanai/05-p.webp",
    "alt": "HD 26 Lanai, foto 5"
   }
  ],
  "ordem": 10
 },
 {
  "slug": "hd-26-caluga",
  "legado_id": 518,
  "nome": "HD 26 Caluga",
  "pes": 26.0,
  "passageiros": 9,
  "regiao": "Leste da Ilha",
  "itens": [
   "Cabine",
   "Banheiro elétrico",
   "Som Bluetooth",
   "Churrasqueira a carvão",
   "Sonda e GPS",
   "Toldo",
   "Chuveiro de popa",
   "Deck de proa",
   "Piso antiderrapante",
   "Cooler",
   "Porta objetos",
   "Popa fechada",
   "Sistema de luz",
   "Carregador 12v",
   "Mesa",
   "Kit de louça, copos e taças",
   "Tapete flutuante"
  ],
  "capa_url": "/assets/img/lanchas/hd-26-caluga.webp",
  "fotos": [
   {
    "url": "/assets/img/lanchas/hd-26-caluga/01.webp",
    "url_p": "/assets/img/lanchas/hd-26-caluga/01-p.webp",
    "alt": "HD 26 Caluga, foto 1"
   },
   {
    "url": "/assets/img/lanchas/hd-26-caluga/02.webp",
    "url_p": "/assets/img/lanchas/hd-26-caluga/02-p.webp",
    "alt": "HD 26 Caluga, foto 2"
   },
   {
    "url": "/assets/img/lanchas/hd-26-caluga/03.webp",
    "url_p": "/assets/img/lanchas/hd-26-caluga/03-p.webp",
    "alt": "HD 26 Caluga, foto 3"
   },
   {
    "url": "/assets/img/lanchas/hd-26-caluga/04.webp",
    "url_p": "/assets/img/lanchas/hd-26-caluga/04-p.webp",
    "alt": "HD 26 Caluga, foto 4"
   },
   {
    "url": "/assets/img/lanchas/hd-26-caluga/05.webp",
    "url_p": "/assets/img/lanchas/hd-26-caluga/05-p.webp",
    "alt": "HD 26 Caluga, foto 5"
   },
   {
    "url": "/assets/img/lanchas/hd-26-caluga/06.webp",
    "url_p": "/assets/img/lanchas/hd-26-caluga/06-p.webp",
    "alt": "HD 26 Caluga, foto 6"
   },
   {
    "url": "/assets/img/lanchas/hd-26-caluga/07.webp",
    "url_p": "/assets/img/lanchas/hd-26-caluga/07-p.webp",
    "alt": "HD 26 Caluga, foto 7"
   },
   {
    "url": "/assets/img/lanchas/hd-26-caluga/08.webp",
    "url_p": "/assets/img/lanchas/hd-26-caluga/08-p.webp",
    "alt": "HD 26 Caluga, foto 8"
   },
   {
    "url": "/assets/img/lanchas/hd-26-caluga/09.webp",
    "url_p": "/assets/img/lanchas/hd-26-caluga/09-p.webp",
    "alt": "HD 26 Caluga, foto 9"
   },
   {
    "url": "/assets/img/lanchas/hd-26-caluga/10.webp",
    "url_p": "/assets/img/lanchas/hd-26-caluga/10-p.webp",
    "alt": "HD 26 Caluga, foto 10"
   },
   {
    "url": "/assets/img/lanchas/hd-26-caluga/11.webp",
    "url_p": "/assets/img/lanchas/hd-26-caluga/11-p.webp",
    "alt": "HD 26 Caluga, foto 11"
   },
   {
    "url": "/assets/img/lanchas/hd-26-caluga/12.webp",
    "url_p": "/assets/img/lanchas/hd-26-caluga/12-p.webp",
    "alt": "HD 26 Caluga, foto 12"
   },
   {
    "url": "/assets/img/lanchas/hd-26-caluga/13.webp",
    "url_p": "/assets/img/lanchas/hd-26-caluga/13-p.webp",
    "alt": "HD 26 Caluga, foto 13"
   },
   {
    "url": "/assets/img/lanchas/hd-26-caluga/14.webp",
    "url_p": "/assets/img/lanchas/hd-26-caluga/14-p.webp",
    "alt": "HD 26 Caluga, foto 14"
   }
  ],
  "ordem": 11
 },
 {
  "slug": "phantom-24-horus",
  "legado_id": 3383,
  "nome": "Phantom 24 Horus",
  "pes": 24.0,
  "passageiros": 7,
  "regiao": "Leste da Ilha",
  "itens": [
   "Cabinada",
   "Banheiro",
   "Churrasqueira",
   "Proa fechada",
   "Tapete Flutuante"
  ],
  "capa_url": "/assets/img/lanchas/phantom-24-horus.webp",
  "fotos": [
   {
    "url": "/assets/img/lanchas/phantom-24-horus/01.webp",
    "url_p": "/assets/img/lanchas/phantom-24-horus/01-p.webp",
    "alt": "Phantom 24 Horus, foto 1"
   },
   {
    "url": "/assets/img/lanchas/phantom-24-horus/02.webp",
    "url_p": "/assets/img/lanchas/phantom-24-horus/02-p.webp",
    "alt": "Phantom 24 Horus, foto 2"
   },
   {
    "url": "/assets/img/lanchas/phantom-24-horus/03.webp",
    "url_p": "/assets/img/lanchas/phantom-24-horus/03-p.webp",
    "alt": "Phantom 24 Horus, foto 3"
   },
   {
    "url": "/assets/img/lanchas/phantom-24-horus/04.webp",
    "url_p": "/assets/img/lanchas/phantom-24-horus/04-p.webp",
    "alt": "Phantom 24 Horus, foto 4"
   },
   {
    "url": "/assets/img/lanchas/phantom-24-horus/05.webp",
    "url_p": "/assets/img/lanchas/phantom-24-horus/05-p.webp",
    "alt": "Phantom 24 Horus, foto 5"
   },
   {
    "url": "/assets/img/lanchas/phantom-24-horus/06.webp",
    "url_p": "/assets/img/lanchas/phantom-24-horus/06-p.webp",
    "alt": "Phantom 24 Horus, foto 6"
   },
   {
    "url": "/assets/img/lanchas/phantom-24-horus/07.webp",
    "url_p": "/assets/img/lanchas/phantom-24-horus/07-p.webp",
    "alt": "Phantom 24 Horus, foto 7"
   },
   {
    "url": "/assets/img/lanchas/phantom-24-horus/08.webp",
    "url_p": "/assets/img/lanchas/phantom-24-horus/08-p.webp",
    "alt": "Phantom 24 Horus, foto 8"
   },
   {
    "url": "/assets/img/lanchas/phantom-24-horus/09.webp",
    "url_p": "/assets/img/lanchas/phantom-24-horus/09-p.webp",
    "alt": "Phantom 24 Horus, foto 9"
   },
   {
    "url": "/assets/img/lanchas/phantom-24-horus/10.webp",
    "url_p": "/assets/img/lanchas/phantom-24-horus/10-p.webp",
    "alt": "Phantom 24 Horus, foto 10"
   },
   {
    "url": "/assets/img/lanchas/phantom-24-horus/11.webp",
    "url_p": "/assets/img/lanchas/phantom-24-horus/11-p.webp",
    "alt": "Phantom 24 Horus, foto 11"
   }
  ],
  "ordem": 12
 },
 {
  "slug": "focker24d",
  "legado_id": 1582,
  "nome": "Focker 24",
  "pes": 24.0,
  "passageiros": 7,
  "regiao": "Leste da Ilha",
  "itens": [
   "Popa Aberta e espaçosa",
   "Banheiro",
   "Som sistema Bluetooth",
   "Churrasqueira a carvão",
   "Toldo rebatível",
   "Ducha de popa",
   "Sistema de iluminação",
   "Mesa",
   "Geladeira Térmica",
   "Pia com água doce",
   "Boias flutuação"
  ],
  "capa_url": "/assets/img/lanchas/focker24d.webp",
  "fotos": [
   {
    "url": "/assets/img/lanchas/focker24d/01.webp",
    "url_p": "/assets/img/lanchas/focker24d/01-p.webp",
    "alt": "Focker 24, foto 1"
   },
   {
    "url": "/assets/img/lanchas/focker24d/02.webp",
    "url_p": "/assets/img/lanchas/focker24d/02-p.webp",
    "alt": "Focker 24, foto 2"
   },
   {
    "url": "/assets/img/lanchas/focker24d/03.webp",
    "url_p": "/assets/img/lanchas/focker24d/03-p.webp",
    "alt": "Focker 24, foto 3"
   },
   {
    "url": "/assets/img/lanchas/focker24d/04.webp",
    "url_p": "/assets/img/lanchas/focker24d/04-p.webp",
    "alt": "Focker 24, foto 4"
   },
   {
    "url": "/assets/img/lanchas/focker24d/05.webp",
    "url_p": "/assets/img/lanchas/focker24d/05-p.webp",
    "alt": "Focker 24, foto 5"
   },
   {
    "url": "/assets/img/lanchas/focker24d/06.webp",
    "url_p": "/assets/img/lanchas/focker24d/06-p.webp",
    "alt": "Focker 24, foto 6"
   },
   {
    "url": "/assets/img/lanchas/focker24d/07.webp",
    "url_p": "/assets/img/lanchas/focker24d/07-p.webp",
    "alt": "Focker 24, foto 7"
   },
   {
    "url": "/assets/img/lanchas/focker24d/08.webp",
    "url_p": "/assets/img/lanchas/focker24d/08-p.webp",
    "alt": "Focker 24, foto 8"
   },
   {
    "url": "/assets/img/lanchas/focker24d/09.webp",
    "url_p": "/assets/img/lanchas/focker24d/09-p.webp",
    "alt": "Focker 24, foto 9"
   },
   {
    "url": "/assets/img/lanchas/focker24d/10.webp",
    "url_p": "/assets/img/lanchas/focker24d/10-p.webp",
    "alt": "Focker 24, foto 10"
   },
   {
    "url": "/assets/img/lanchas/focker24d/11.webp",
    "url_p": "/assets/img/lanchas/focker24d/11-p.webp",
    "alt": "Focker 24, foto 11"
   },
   {
    "url": "/assets/img/lanchas/focker24d/12.webp",
    "url_p": "/assets/img/lanchas/focker24d/12-p.webp",
    "alt": "Focker 24, foto 12"
   },
   {
    "url": "/assets/img/lanchas/focker24d/13.webp",
    "url_p": "/assets/img/lanchas/focker24d/13-p.webp",
    "alt": "Focker 24, foto 13"
   }
  ],
  "ordem": 13
 },
 {
  "slug": "phantom-23-5-maninha",
  "legado_id": 583,
  "nome": "Phantom 23.5 M",
  "pes": 23.5,
  "passageiros": 7,
  "regiao": "Leste da Ilha",
  "itens": [
   "Popa Aberta e espaçosa",
   "Banheiro",
   "Som sistema Bluetooth",
   "Churrasqueira a carvão",
   "Toldo rebatível com fechamento frontal e lateral",
   "Ducha de popa",
   "Sistema de iluminação",
   "Carregador 12v para celular",
   "Mesa",
   "Geladeira Térmica",
   "Pia com água doce"
  ],
  "capa_url": "/assets/img/lanchas/phantom-23-5-maninha.webp",
  "fotos": [
   {
    "url": "/assets/img/lanchas/phantom-23-5-maninha/01.webp",
    "url_p": "/assets/img/lanchas/phantom-23-5-maninha/01-p.webp",
    "alt": "Phantom 23.5 M, foto 1"
   },
   {
    "url": "/assets/img/lanchas/phantom-23-5-maninha/02.webp",
    "url_p": "/assets/img/lanchas/phantom-23-5-maninha/02-p.webp",
    "alt": "Phantom 23.5 M, foto 2"
   },
   {
    "url": "/assets/img/lanchas/phantom-23-5-maninha/03.webp",
    "url_p": "/assets/img/lanchas/phantom-23-5-maninha/03-p.webp",
    "alt": "Phantom 23.5 M, foto 3"
   },
   {
    "url": "/assets/img/lanchas/phantom-23-5-maninha/04.webp",
    "url_p": "/assets/img/lanchas/phantom-23-5-maninha/04-p.webp",
    "alt": "Phantom 23.5 M, foto 4"
   },
   {
    "url": "/assets/img/lanchas/phantom-23-5-maninha/05.webp",
    "url_p": "/assets/img/lanchas/phantom-23-5-maninha/05-p.webp",
    "alt": "Phantom 23.5 M, foto 5"
   },
   {
    "url": "/assets/img/lanchas/phantom-23-5-maninha/06.webp",
    "url_p": "/assets/img/lanchas/phantom-23-5-maninha/06-p.webp",
    "alt": "Phantom 23.5 M, foto 6"
   },
   {
    "url": "/assets/img/lanchas/phantom-23-5-maninha/07.webp",
    "url_p": "/assets/img/lanchas/phantom-23-5-maninha/07-p.webp",
    "alt": "Phantom 23.5 M, foto 7"
   },
   {
    "url": "/assets/img/lanchas/phantom-23-5-maninha/08.webp",
    "url_p": "/assets/img/lanchas/phantom-23-5-maninha/08-p.webp",
    "alt": "Phantom 23.5 M, foto 8"
   },
   {
    "url": "/assets/img/lanchas/phantom-23-5-maninha/09.webp",
    "url_p": "/assets/img/lanchas/phantom-23-5-maninha/09-p.webp",
    "alt": "Phantom 23.5 M, foto 9"
   }
  ],
  "ordem": 14
 },
 {
  "slug": "phantom-23-5",
  "legado_id": 538,
  "nome": "Phantom 23.5 G",
  "pes": 23.5,
  "passageiros": 7,
  "regiao": "Leste da Ilha",
  "itens": [
   "Popa Aberta e espaçosa",
   "Banheiro",
   "Som sistema Bluetooth",
   "Churrasqueira a carvão",
   "Toldo rebatível com fechamento frontal e lateral",
   "Ducha de popa",
   "Sistema de iluminação",
   "Carregador 12v para celular",
   "Mesa",
   "Geladeira Térmica",
   "Tapete Flutuante",
   "Pia com água doce"
  ],
  "capa_url": "/assets/img/lanchas/phantom-23-5.webp",
  "fotos": [
   {
    "url": "/assets/img/lanchas/phantom-23-5/01.webp",
    "url_p": "/assets/img/lanchas/phantom-23-5/01-p.webp",
    "alt": "Phantom 23.5 G, foto 1"
   },
   {
    "url": "/assets/img/lanchas/phantom-23-5/02.webp",
    "url_p": "/assets/img/lanchas/phantom-23-5/02-p.webp",
    "alt": "Phantom 23.5 G, foto 2"
   },
   {
    "url": "/assets/img/lanchas/phantom-23-5/03.webp",
    "url_p": "/assets/img/lanchas/phantom-23-5/03-p.webp",
    "alt": "Phantom 23.5 G, foto 3"
   },
   {
    "url": "/assets/img/lanchas/phantom-23-5/04.webp",
    "url_p": "/assets/img/lanchas/phantom-23-5/04-p.webp",
    "alt": "Phantom 23.5 G, foto 4"
   },
   {
    "url": "/assets/img/lanchas/phantom-23-5/05.webp",
    "url_p": "/assets/img/lanchas/phantom-23-5/05-p.webp",
    "alt": "Phantom 23.5 G, foto 5"
   },
   {
    "url": "/assets/img/lanchas/phantom-23-5/06.webp",
    "url_p": "/assets/img/lanchas/phantom-23-5/06-p.webp",
    "alt": "Phantom 23.5 G, foto 6"
   },
   {
    "url": "/assets/img/lanchas/phantom-23-5/07.webp",
    "url_p": "/assets/img/lanchas/phantom-23-5/07-p.webp",
    "alt": "Phantom 23.5 G, foto 7"
   },
   {
    "url": "/assets/img/lanchas/phantom-23-5/08.webp",
    "url_p": "/assets/img/lanchas/phantom-23-5/08-p.webp",
    "alt": "Phantom 23.5 G, foto 8"
   },
   {
    "url": "/assets/img/lanchas/phantom-23-5/09.webp",
    "url_p": "/assets/img/lanchas/phantom-23-5/09-p.webp",
    "alt": "Phantom 23.5 G, foto 9"
   }
  ],
  "ordem": 15
 },
 {
  "slug": "fs230-pes",
  "legado_id": 1715,
  "nome": "FS 230",
  "pes": 23.0,
  "passageiros": 7,
  "regiao": "Leste da Ilha",
  "itens": [
   "Cabine",
   "Banheiro",
   "Solário de Proa e popa",
   "Pia",
   "Som Bluetooth",
   "Churrasqueira",
   "Tapete Flutuante",
   "Carvão",
   "Cooler com gelo",
   "Água"
  ],
  "capa_url": "/assets/img/lanchas/fs230-pes.webp",
  "fotos": [
   {
    "url": "/assets/img/lanchas/fs230-pes/01.webp",
    "url_p": "/assets/img/lanchas/fs230-pes/01-p.webp",
    "alt": "FS 230, foto 1"
   },
   {
    "url": "/assets/img/lanchas/fs230-pes/02.webp",
    "url_p": "/assets/img/lanchas/fs230-pes/02-p.webp",
    "alt": "FS 230, foto 2"
   },
   {
    "url": "/assets/img/lanchas/fs230-pes/03.webp",
    "url_p": "/assets/img/lanchas/fs230-pes/03-p.webp",
    "alt": "FS 230, foto 3"
   },
   {
    "url": "/assets/img/lanchas/fs230-pes/04.webp",
    "url_p": "/assets/img/lanchas/fs230-pes/04-p.webp",
    "alt": "FS 230, foto 4"
   },
   {
    "url": "/assets/img/lanchas/fs230-pes/05.webp",
    "url_p": "/assets/img/lanchas/fs230-pes/05-p.webp",
    "alt": "FS 230, foto 5"
   },
   {
    "url": "/assets/img/lanchas/fs230-pes/06.webp",
    "url_p": "/assets/img/lanchas/fs230-pes/06-p.webp",
    "alt": "FS 230, foto 6"
   },
   {
    "url": "/assets/img/lanchas/fs230-pes/07.webp",
    "url_p": "/assets/img/lanchas/fs230-pes/07-p.webp",
    "alt": "FS 230, foto 7"
   },
   {
    "url": "/assets/img/lanchas/fs230-pes/08.webp",
    "url_p": "/assets/img/lanchas/fs230-pes/08-p.webp",
    "alt": "FS 230, foto 8"
   },
   {
    "url": "/assets/img/lanchas/fs230-pes/09.webp",
    "url_p": "/assets/img/lanchas/fs230-pes/09-p.webp",
    "alt": "FS 230, foto 9"
   },
   {
    "url": "/assets/img/lanchas/fs230-pes/10.webp",
    "url_p": "/assets/img/lanchas/fs230-pes/10-p.webp",
    "alt": "FS 230, foto 10"
   },
   {
    "url": "/assets/img/lanchas/fs230-pes/11.webp",
    "url_p": "/assets/img/lanchas/fs230-pes/11-p.webp",
    "alt": "FS 230, foto 11"
   },
   {
    "url": "/assets/img/lanchas/fs230-pes/12.webp",
    "url_p": "/assets/img/lanchas/fs230-pes/12-p.webp",
    "alt": "FS 230, foto 12"
   },
   {
    "url": "/assets/img/lanchas/fs230-pes/13.webp",
    "url_p": "/assets/img/lanchas/fs230-pes/13-p.webp",
    "alt": "FS 230, foto 13"
   }
  ],
  "ordem": 16
 }
]$carga$::jsonb)
    as x(slug text, legado_id int, nome text, pes numeric, passageiros int, regiao text, itens jsonb, capa_url text, fotos jsonb, ordem int)
on conflict (slug) do nothing;

insert into public.bb_roteiros (slug, nome, resumo, duracao_horas, distancia_milhas, trajeto_texto, paradas, regras, fotos, palavras_chave, ordem)
select slug, nome, resumo, duracao_horas, distancia_milhas, trajeto_texto, paradas, regras, fotos, palavras_chave, ordem
  from jsonb_to_recordset($carga$[
 {
  "slug": "ilha-do-campeche",
  "nome": "Ilha do Campeche",
  "resumo": "O roteiro mais pedido da Barra Boat: água cristalina e areia branca, no lugar que muita gente chama de Caribe brasileiro.",
  "duracao_horas": 8,
  "distancia_milhas": 10.4,
  "trajeto_texto": "30 a 40 min por trajeto",
  "palavras_chave": "campeche, ilha do campeche, caribe",
  "ordem": 0,
  "paradas": [
   {
    "nome": "Canal da Barra da Lagoa",
    "texto": "Embarque no canal, ao lado da ponte pênsil. Daqui a lancha sai para o mar aberto.",
    "foto": "/assets/img/fotos/canal-barra.webp",
    "alt": "Lancha passando pelo Canal da Barra da Lagoa, com as casas e os barcos de pesca na margem"
   },
   {
    "nome": "Prainha da Barra",
    "texto": "Vista panorâmica da Prainha logo na saída do canal.",
    "foto": "/assets/img/paginas/campeche-rota.webp",
    "alt": "Prainha da Barra e a saída do canal vistas do alto, com uma lancha indo para o mar"
   },
   {
    "nome": "Piscinas naturais da Barra",
    "texto": "Piscinas de água salgada formadas entre as pedras, no costão.",
    "foto": "/assets/img/paginas/sobre-11.webp",
    "alt": "Costão de pedras da Barra da Lagoa com a água entrando entre as rochas"
   },
   {
    "nome": "Praia da Galheta",
    "texto": "Praia de natureza preservada, sem acesso de carro, entre a Mole e a Barra.",
    "foto": "/assets/img/paginas/sobre-07.webp",
    "alt": "Praia da Galheta com o costão de pedras em primeiro plano"
   },
   {
    "nome": "Ponta do Gravatá",
    "texto": "Costão com trilhas e mirantes, já na direção do Campeche.",
    "foto": "/assets/img/fotos/campeche-pedras.webp",
    "alt": "Lancha navegando perto de um costão de pedras no caminho para o Campeche"
   },
   {
    "nome": "Ilha do Campeche",
    "texto": "A lancha fica ancorada em frente à ilha. Dia de banho, mergulho com snorkel, tapete flutuante e churrasco a bordo.",
    "foto": "/assets/img/paginas/sobre-06.webp",
    "alt": "Ilha do Campeche vista do alto, com a faixa de areia branca e lanchas ancoradas"
   }
  ],
  "fotos": [
   {
    "url": "/assets/img/paginas/campeche-ilha.webp",
    "alt": "Faixa de areia branca da Ilha do Campeche com a água cristalina"
   },
   {
    "url": "/assets/img/fotos/campeche-mergulho.webp",
    "alt": "Pessoa mergulhando com snorkel em água transparente"
   },
   {
    "url": "/assets/img/paginas/sobre-02.webp",
    "alt": "Grupo de amigos brindando a bordo da lancha"
   },
   {
    "url": "/assets/img/fotos/tapete.webp",
    "alt": "Grupo sentado no tapete flutuante ao lado da lancha"
   },
   {
    "url": "/assets/img/paginas/sobre-10.webp",
    "alt": "Mergulhadora nadando sobre o fundo de areia clara"
   }
  ],
  "regras": [
   "Não é permitido alimentar os quatis.",
   "Não é permitido retirar plantas, conchas ou pedras da ilha.",
   "Churrasco e acampamento são proibidos na praia e no interior da ilha. O churrasco é feito a bordo.",
   "Trilhas e costões só com monitores credenciados.",
   "Sem som alto e sem cadeiras na areia.",
   "Recolha o seu lixo e evite canudos e copos descartáveis."
  ]
 },
 {
  "slug": "costa-da-lagoa",
  "nome": "Costa da Lagoa",
  "resumo": "Um dia em águas calmas na Lagoa da Conceição, com cachoeira, prainhas e restaurantes de frutos do mar à beira da água.",
  "duracao_horas": 6,
  "distancia_milhas": null,
  "trajeto_texto": "Águas calmas, saída da Barra ou da Lagoa",
  "palavras_chave": "costa da lagoa, lagoa, lagoa da conceição, cachoeira",
  "ordem": 1,
  "paradas": [
   {
    "nome": "Castelinho",
    "texto": "Construção histórica à beira da Lagoa, ligada aos primeiros moradores da região.",
    "foto": "/assets/img/paginas/costa-castelinho.webp",
    "alt": "Castelinho de pedra entre as árvores da Costa da Lagoa"
   },
   {
    "nome": "Praia do Saquinho",
    "texto": "Prainha de areia clara e água tranquila para banho.",
    "foto": "/assets/img/paginas/costa-saquinho.webp",
    "alt": "Praia do Saquinho vista do alto, com a água calma da Lagoa"
   },
   {
    "nome": "Cachoeira da Costa",
    "texto": "Queda alta com uma piscina natural embaixo. Não é permitido subir até o topo; o banho é na piscina.",
    "foto": "/assets/img/paginas/costa-cachoeira.webp",
    "alt": "Cachoeira da Costa da Lagoa caindo entre as pedras e a mata"
   },
   {
    "nome": "Pedra do Navio",
    "texto": "Canto da Lagoa da Conceição também chamado de Bia Funda, bom para parar e nadar.",
    "foto": "/assets/img/paginas/costa-lagoa.webp",
    "alt": "Lagoa da Conceição cercada de morros e mata"
   },
   {
    "nome": "Restaurantes da Costa",
    "texto": "Vários restaurantes à beira da água. A dica da casa: sequência de frutos do mar e caipirinha de pitanga.",
    "foto": "/assets/img/paginas/costa-gastronomia.webp",
    "alt": "Mesa com frutos do mar em um restaurante à beira da Lagoa"
   }
  ],
  "fotos": [],
  "regras": []
 }
]$carga$::jsonb)
    as x(slug text, nome text, resumo text, duracao_horas numeric, distancia_milhas numeric, trajeto_texto text,
         paradas jsonb, regras jsonb, fotos jsonb, palavras_chave text, ordem int)
on conflict (slug) do nothing;
