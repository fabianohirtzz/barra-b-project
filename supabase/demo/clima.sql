-- ============================================================
-- Barra Boat Floripa: PREVISÃO FICTÍCIA para mostrar o alerta de clima.
-- Precisa da migração 2026-11-19-06-clima.sql e dos dados de carregar.sql.
--
-- Rodar no SQL Editor NO DIA DA APRESENTAÇÃO (pode rodar de novo quantas vezes
-- quiser): monta a previsão de hoje e dos próximos 3 dias a partir da data
-- atual, com vento sul forte e chuva no primeiro dia, a partir de hoje, que
-- tiver passeio marcado. Os outros dias ficam com tempo bom.
-- Tudo com fonte = 'demo'; o apagar.sql remove.
-- ============================================================

delete from public.bb_clima where fonte = 'demo';

with base as (
  select (now() at time zone 'America/Sao_Paulo')::date as hoje
), ruim as (
  select coalesce(min(p.dia), (select hoje from base)) as dia
    from public.bb_passeios p, base
   where p.status <> 'cancelado' and p.dia between base.hoje and base.hoje + 3
)
insert into public.bb_clima (dia, vento_kmh, rajada_kmh, direcao_graus, chuva_mm, chuva_prob, resumo, fonte)
select g::date,
       case when g::date = ruim.dia then 38 else 12 + (extract(day from g) % 4) * 2 end,
       case when g::date = ruim.dia then 56 else 20 + (extract(day from g) % 4) * 3 end,
       case when g::date = ruim.dia then 190 else 45 end,           -- sul / nordeste
       case when g::date = ruim.dia then 14 else 0 end,
       case when g::date = ruim.dia then 85 else 10 end,
       case when g::date = ruim.dia then 'Frente fria com vento sul e chuva a partir do meio da manhã' else 'Sol entre nuvens' end,
       'demo'
  from base, ruim, generate_series(base.hoje, base.hoje + 3, interval '1 day') g;

select dia, vento_kmh, rajada_kmh, direcao_graus, chuva_mm, chuva_prob, resumo,
       (select count(*) from public.bb_passeios p where p.dia = c.dia and p.status <> 'cancelado') as passeios
  from public.bb_clima c where fonte = 'demo' order by dia;
