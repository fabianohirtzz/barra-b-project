# Funcionalidades — escopo fechado (2026-11-12)

Base: proposta de 20/10/2026 + ajustes do Fabiano nesta data.

## Site (cortesia)

1. Layout novo, pensado primeiro para o celular. Multi-página.
2. Todas as lanchas e roteiros migrados do site atual.
3. **Página de cada lancha:** fotos grandes, pés, passageiros, região, itens a bordo e um
   **calendário de disponibilidade** (dias livres em destaque; dias reservados em cinza,
   riscados) para o visitante escolher outra lancha que case com a data dele. Só mostra
   livre/ocupado, nunca nomes ou valores.
4. **Página de cada roteiro** (Campeche, Costa da Lagoa…) com paradas, distância e tempo,
   em URL própria (o robô do WhatsApp manda o link direto, ex.: `/campeche`).
5. Avaliações do Google em galeria de destaque, com a nota **4,8**. Escolhidas no painel.
6. Vídeos do Instagram, escolhidos e ordenados no painel.
7. WhatsApp sempre à mão, com **rastreamento de origem** em cada clique (Google Ads, orgânico,
   Instagram, outras redes, direto). Mantém o GTM-5FJVHJRJ atual.
8. **Selo Cadastur** (empresa certificada no Ministério do Turismo), como na PO Turismo.
9. Tradução para mais de 40 idiomas (recurso do Encanto da Ponte).
10. SEO e GEO: JSON-LD, FAQ, sitemap, `llms.txt`, títulos e descrições por página.
11. Política de cancelamento/reembolso e de privacidade padrão.
12. Sem preço no site. Sem pagamento ou reserva automática.
13. Assinatura Freela In Home animada no rodapé.
14. Hospedagem na ErêHost (como hoje). Prévia no GitHub Pages com `noindex`.

## Painel (estrutura da PO Turismo)

15. **Lanchas:** cadastrar, editar, excluir, ocultar do site; fotos, pés, passageiros, região,
    itens a bordo, dono (próprio ou parceiro), cor no calendário. Fotos passam pelo
    **tratamento automático na importação** (ver abaixo).
16. **Roteiros:** cadastrar, editar, excluir, ocultar do site; paradas, distância, tempos, fotos.
17. **Avaliações:** escolher quais aparecem; começa com as do Google.
18. **Instagram:** escolher e ordenar os vídeos. Vídeos passam pela **compressão automática
    na importação** (ver abaixo).
19. **Leads e funil** em 5 etapas (contato feito, qualificado, proposta enviada, contrato
    assinado, perdido), com **gaveta do lead**: histórico da conversa, lancha, roteiro, data,
    pessoas, **valor orçado, valor fechado**, custos do passeio, sinal e saldo, motivo de perda.
20. **Relatórios completos** de dona de empresa (ver `painel-relatorios.md`): financeiro,
    ROI, ROAS, CPL, CAC, ticket médio por orçamento e por venda, leads por origem, ocupação
    por lancha, sazonalidade.
21. **Calendário de reservas** por dia e por lancha, uma cor por parceiro.
22. **Agenda dos parceiros:** leitura automática de Google Agenda ou planilha do Google;
    lançamento manual para quem não usa nenhum dos dois.
23. **Acesso dos parceiros:** os parceiros que revendem os passeios das lanchas da Michele
    (e ganham comissão) entram com login próprio e **enxergam a disponibilidade** das lanchas
    liberadas para eles; podem pedir bloqueio de data; veem só as próprias vendas e comissões.
24. **Comissões:** registro do parceiro que vendeu, % ou valor, status (a pagar / pago).
25. **Importação de contatos da agenda** (como na PO).
26. **Revisão** (como na PO).
27. **Transmissão / campanha** para a base, com prévia de quantas pessoas e custo antes de enviar.
28. **Textos do robô:** saudações e respostas por palavra-chave editáveis.
29. **Contrato preenchido sozinho** com os dados da conversa e do painel.

## Importação de mídia sem trabalho manual (combinado com a Michele, 2026-11-13)

A Michele não tem experiência em recortar, tratar ou comprimir imagens. O painel faz tudo
sozinho na hora em que ela importa: ela só escolhe o arquivo (do celular ou do computador).

**Fotos das lanchas (e dos roteiros):**
1. **Melhoria com IA** quando a foto é pequena ou borrada (mesmo método usado nas fotos do
   site antigo: Real-ESRGAN x4plus). Foto com lado maior a partir de 1600 px não precisa.
2. **Recorte quadrado** quando a foto não é quadrada, centralizado na lancha. Ela vê a prévia
   e pode arrastar o enquadramento se quiser; se não mexer, vale o recorte automático.
3. **Compressão** para WebP no tamanho que o site usa (capa 900 px, galeria 1400 px).
   O original fica guardado, para refazer o tratamento se um dia precisar.

**Vídeos do Instagram:**
- **Compressão na importação**: reduz o peso **sem perder resolução** (mantém largura e altura
  originais; só recodifica em H.264/MP4 com qualidade constante e `faststart` para começar a
  tocar antes de baixar inteiro). Gera também a capa (primeiro quadro) em WebP.
- Mostra o antes e depois do peso (ex.: 48 MB para 9 MB) para ela saber que deu certo.

**Onde roda (a confirmar no build):** a hospedagem compartilhada da ErêHost não aguenta IA
nem ffmpeg no PHP. O tratamento roda **no navegador** de quem importa: IA com
`onnxruntime-web` (WebGPU, com WASM de reserva), recorte e WebP no canvas, vídeo com
`ffmpeg.wasm` ou WebCodecs. O PHP só recebe o arquivo pronto e salva. Se o aparelho for
fraco demais para a IA, a foto sobe só com recorte e compressão e fica marcada para
reprocessar depois.

## WhatsApp (API oficial da Meta, coexistência)

30. Respostas automáticas por palavra-chave com link para a página certa do site.
31. Qualificação automática: data do passeio e quantidade de pessoas.
32. Atendimento em PT, EN e ES.
33. Automação silencia no contato quando a Michele responde.
34. Comandos curtos na conversa movem o cartão no funil.
35. IA da Meta desligada.

## Fora do escopo

Pagamento/reserva automática no site, custo das campanhas (Meta), impressos, remoção de
avaliações do Google, assinatura eletrônica com validade jurídica.

## Decisões de 2026-11-16 (Fabiano)

**Princípio do painel:** a Michele tem muita dificuldade com tecnologia. O painel precisa ser
simples a ponto de ela usar sem treinamento: poucas telas, botões grandes com texto (nada de
ícone sozinho), uma ação principal por tela, linguagem do dia a dia dela ("Quem vai no passeio",
não "lead"), nada de configuração técnica exposta, e ajuda curta na própria tela. Somente em
português (o site continua multi-idioma, como no Encanto da Ponte).

**Aprovados (entram no escopo):**
36. Lembrete automático na véspera (horário, endereço com mapa, o que levar, saldo a pagar).
37. Pedido de avaliação no Google automático no dia seguinte ao passeio.
38. Alerta de clima: vento e chuva previstos para os passeios dos próximos 3 dias.
39. Escala de marinheiros: quem vai em cada passeio; cada marinheiro vê a própria agenda.
40. Bloqueio de datas por manutenção e vencimentos da lancha (seguro, documentação, revisão),
    com aviso antes de vencer.
41. Notificação no celular quando chega lead novo; painel instalável como aplicativo (PWA).
42. Textos do site editáveis: FAQ, chamadas da home, selo Cadastur.
43. Usuários e permissões: dona, atendente, parceiro, marinheiro; registro de quem alterou o quê.
44. Modelos da Meta no painel (necessário para lembrete, avaliação e campanha fora da janela de 24 h).
45. **Despesas (o "caderno" da Michele):** lançar gasto em 3 toques (valor, categoria, data;
    foto do recibo opcional; lancha ou passeio opcional). Categorias prontas: combustível,
    marinheiro, gelo/carvão/frutas, manutenção, marina/vaga, seguro, documentação, anúncios,
    repasse a parceiro, comissão, outros. Despesa fixa mensal se repete sozinha. Resumo do mês
    por categoria.
46. **Ticket médio** de venda: bruto (valor fechado) e líquido (bruto menos custos do passeio,
    repasses, comissões e a parte das despesas). Também por lancha, roteiro e mês.
47. **Relatórios com gráficos simples:** cada número importante com um gráfico fácil de ler
    (barras por mês, linha comparando com o ano anterior, rosca de despesas por categoria,
    barras de ocupação por lancha), uma frase explicando o que o gráfico mostra e comparação
    com o mês anterior em texto ("12% a mais que outubro").
48. **Agenda do parceiro conectada na própria aba da lancha**, sem depender do Fabiano:
    botão "Conectar agenda do dono", com três caminhos: Google Agenda (o parceiro manda o
    "endereço secreto no formato iCal" e ela cola), planilha do Google (link de publicação) ou
    lançamento manual. O painel testa o link na hora e mostra "Conectada: X dias ocupados nos
    próximos 90 dias"; depois lê sozinho a cada 15 min. Botão "Mandar instruções ao parceiro"
    abre o WhatsApp com o passo a passo pronto e o link de um **vídeo curto** (feito no
    videos-project) mostrando onde o parceiro acha esse endereço no Google Agenda.

**Fora:** pagamento online (continua fora do escopo).

**A decidir:** lista de passageiros (item 8 da sugestão); editor visual do fluxo, simulador do
robô e aba Clientes (como na PO); robô com IA (Claude) ou só por palavra-chave.
