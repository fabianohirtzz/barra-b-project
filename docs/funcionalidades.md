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
    itens a bordo, dono (próprio ou parceiro), cor no calendário.
16. **Roteiros:** cadastrar, editar, excluir, ocultar do site; paradas, distância, tempos, fotos.
17. **Avaliações:** escolher quais aparecem; começa com as do Google.
18. **Instagram:** escolher e ordenar os vídeos.
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
