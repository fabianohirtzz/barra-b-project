-- Carga do conteúdo que estava fixo no HTML (gerado por tools/extrair_conteudo.py).
-- Perguntas frequentes e avaliações da home; paradas e regras dos roteiros.
-- Só preenche o que está vazio: rodar de novo não apaga o que a Michele mudou no painel.
-- Rodar inteiro de uma vez (a tabela temporária vive só nesta execução).
-- Depende da migração 2026-11-24-10-conteudo.sql (coluna idioma das avaliações).
drop table if exists _carga;
create temp table _carga as select $carga${
 "faq": [
  {
   "pergunta": "Onde é o embarque?",
   "resposta": "Todos os embarques são no Canal da Barra da Lagoa, na Rod. Jorn. Manoel de Menezes, 3007. Dá para combinar outro ponto, desde que a lancha consiga manobrar. Embarcar na Lagoa da Conceição tem acréscimo de R$ 100,00.",
   "ordem": 0
  },
  {
   "pergunta": "O valor é por pessoa ou por lancha?",
   "resposta": "Por lancha, nunca por pessoa, e ela é só do seu grupo. Combustível do roteiro e marinheiro já estão inclusos. O valor muda conforme a lancha e a data, por isso passamos pelo WhatsApp.",
   "ordem": 1
  },
  {
   "pergunta": "Quanto tempo dura o passeio?",
   "resposta": "A diária é de 7 horas: das 10h às 17h. O horário de embarque precisa ser respeitado, porque atrasos do grupo não estendem a diária.",
   "ordem": 2
  },
  {
   "pergunta": "Como funciona o pagamento?",
   "resposta": "50% na reserva e 50% no dia do passeio, em Pix ou dinheiro. Cartão de crédito ou moeda estrangeira são aceitos com as taxas calculadas à parte. Você recebe um contrato com os dados da reserva.",
   "ordem": 3
  },
  {
   "pergunta": "Posso levar comida e bebida?",
   "resposta": "Pode. Traga as carnes e as bebidas que o marinheiro prepara o churrasco. Todas as lanchas têm churrasqueira, som, toldo e utensílios.",
   "ordem": 4
  },
  {
   "pergunta": "E se o tempo virar?",
   "resposta": "Com chuva, vento forte ou aviso de mau tempo da Marinha, o passeio é remarcado conforme a disponibilidade ou o valor pago é devolvido. O cancelamento por chuva é decidido no dia. Trocar a data por vontade do grupo tem taxa de 10% sobre o contrato.",
   "ordem": 5
  }
 ],
 "avaliacoes": [
  {
   "nome": "Juan M. Dulce",
   "texto": "Foi uma ótima experiência, super recomendado! Desde o primeiro contato com a Michelle, todo o processo de alugar a lancha foi muito claro. O ponto de chegada é bem fácil de identificar. O marinheiro Márcio foi ótimo, teve os cuidados necessários e fez o churrasco na frente da Ilha do Campeche. A lancha traz muita segurança. Dá para perceber o esforço em dar o melhor serviço!",
   "nota": 5,
   "data_label": "março de 2025",
   "idioma": "pt",
   "ordem": 0
  },
  {
   "nome": "Luiza Constantino",
   "texto": "Nosso passeio foi incrível e o marinheiro Diego é um ótimo churrasqueiro! A atendente Michele muito atenciosa. Valeu a pena!",
   "nota": 5,
   "data_label": "março de 2025",
   "idioma": "pt",
   "ordem": 1
  },
  {
   "nome": "Andrea Caribaux",
   "texto": "Una experiencia súper recomendable para conocer Ilha do Campeche y Lagoa. Adultos y niños la pasan muy bien! Michelle desde el inicio nos buscó una propuesta acorde a lo que queríamos y superó nuestras expectativas. Leo, el capitán, nos armó un asado increíble.",
   "nota": 5,
   "data_label": "fevereiro de 2025",
   "idioma": "es",
   "ordem": 2
  },
  {
   "nome": "Ana Tobar",
   "texto": "Que serviço incrível! A lancha estava em perfeitas condições. O atendimento do Márcio foi além das nossas expectativas, e a Michelle nos atendeu com muita atenção e profissionalismo. Recomendo de olhos fechados!",
   "nota": 5,
   "data_label": "março de 2025",
   "idioma": "pt",
   "ordem": 3
  },
  {
   "nome": "Mitsuo Shibata",
   "texto": "Michele e Neto são muito atenciosos e o tour foi excelente. Barco bem conservado, limpo e motor redondo. Dia de sol, ótimo passeio em família e Neto um grande churrasqueiro.",
   "nota": 5,
   "data_label": "março de 2025",
   "idioma": "pt",
   "ordem": 4
  },
  {
   "nome": "Cynthia Raquel Romero",
   "texto": "Quiero agradecer el excelente servicio que nos brindó Diego en la conducción del paseo. Fue muy atento, amable y profesional. Tuvimos un día muy hermoso en familia.",
   "nota": 5,
   "data_label": "fevereiro de 2025",
   "idioma": "es",
   "ordem": 5
  }
 ],
 "roteiros": [
  {
   "slug": "ilha-do-campeche",
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
   "regras": [
    "Não é permitido alimentar os quatis.",
    "Não é permitido retirar plantas, conchas ou pedras da ilha.",
    "Churrasco e acampamento são proibidos na praia e no interior da ilha. O churrasco é feito a bordo.",
    "Trilhas e costões só com monitores credenciados.",
    "Sem som alto e sem cadeiras na areia.",
    "Recolha o seu lixo e evite canudos e copos descartáveis.",
    "Animais de estimação não podem entrar na ilha, por isso não embarcam neste roteiro. Para passear com o seu pet, escolha a Costa da Lagoa."
   ],
   "fichas": [
    {
     "rotulo": "Distância",
     "valor": "10,4 milhas"
    },
    {
     "rotulo": "Cada trajeto",
     "valor": "30 a 40 min"
    },
    {
     "rotulo": "Diária",
     "valor": "7 horas"
    },
    {
     "rotulo": "Saída",
     "valor": "Canal da Barra"
    }
   ]
  },
  {
   "slug": "costa-da-lagoa",
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
   "regras": [],
   "fichas": [
    {
     "rotulo": "Mar",
     "valor": "Águas calmas"
    },
    {
     "rotulo": "Saída",
     "valor": "Barra ou Lagoa"
    },
    {
     "rotulo": "Diária",
     "valor": "6 horas"
    },
    {
     "rotulo": "Paradas",
     "valor": "5"
    }
   ]
  }
 ]
}$carga$::jsonb as d;

insert into public.bb_faq (pergunta, resposta, ordem)
select x->>'pergunta', x->>'resposta', (x->>'ordem')::int from _carga c, jsonb_array_elements(c.d->'faq') x
 where not exists (select 1 from public.bb_faq);

insert into public.bb_avaliacoes (nome, texto, nota, data_label, idioma, ordem)
select x->>'nome', x->>'texto', (x->>'nota')::smallint, x->>'data_label', x->>'idioma', (x->>'ordem')::int
  from _carga c, jsonb_array_elements(c.d->'avaliacoes') x
 where not exists (select 1 from public.bb_avaliacoes);

-- roteiros: paradas e regras como estão hoje no site (inclui a regra dos pets de 19/11).
-- Só antes de 26/11: rodar de novo depois disso não desfaz o que a Michele mudou no painel.
update public.bb_roteiros r set paradas = x->'paradas', regras = x->'regras'
  from _carga c, jsonb_array_elements(c.d->'roteiros') x
 where r.slug = x->>'slug' and now() < '2026-11-26';

drop table _carga;

select (select count(*) from public.bb_faq) as perguntas, (select count(*) from public.bb_avaliacoes) as avaliacoes,
       (select string_agg(slug || ': ' || jsonb_array_length(paradas) || ' paradas, ' || jsonb_array_length(regras) || ' regras', '; ') from public.bb_roteiros) as roteiros;
