# esDEV CRM

CRM interno da esDEV, para correr **localmente no teu computador**. É a implementação do
documento *esDEV — Sistema Operacional e Comercial v1.0*: pipeline comercial, briefing,
análise interna, calculadora de preços, propostas em três níveis, projetos, faturação,
manutenção e receita recorrente.

Os dados ficam num único ficheiro SQLite em `data/esdev.db`. Não há contas, servidores
externos nem nuvem: nada sai da tua máquina.

## Arrancar

**Windows:** duplo clique em `esdev-crm.bat`. Instala, compila e abre o CRM numa janela
própria, sem barra de endereço, como uma app de desktop. **macOS / Linux:** `./esdev-crm.sh`.

O guia completo de instalação — onde guardar a pasta, como afixar no menu Iniciar, backups e
acesso pelo telemóvel — está em **[INSTALACAO.md](INSTALACAO.md)**.

Manualmente, com Node.js 20 ou superior:

```bash
npm install
npm run dados-exemplo   # opcional: insere os dois exemplos do documento (§26 e §27)
npm run dev             # desenvolvimento, http://localhost:43127
npm run build && npm start   # uso normal, arranca mais rápido
```

Não corras `npm run build` com o `npm run dev` ligado: partilham a pasta `.next` e o
servidor de desenvolvimento passa a devolver 403 aos ficheiros de JavaScript, deixando a
página sem interatividade.

Para verificar que as interações do lado do cliente estão de pé (tema, paleta `Ctrl+K`,
calculadora, menu em telemóvel, arrastar no pipeline, gráfico e notificações), com a app a
correr:

```bash
npx playwright install chromium   # uma vez
npm run teste-interface
```

A base de dados é criada automaticamente no primeiro arranque. Para a guardar noutro sítio
(uma pasta sincronizada, por exemplo), define `ESDEV_DB`:

```bash
# Windows PowerShell
$env:ESDEV_DB="C:\Users\eduar\OneDrive\esdev\esdev.db"; npm start
```

**Cópia de segurança:** copia `data/esdev.db`. É o sistema todo.

## O que está lá dentro

| Página | O que faz |
|---|---|
| **Dashboard** | Pipeline aberto, recebido, em falta, receita recorrente, projetos ativos, rentabilidade real (§29) e regras de ouro (§25). |
| **Pipeline** | Quadro com as 12 fases do §24, de Novo Lead a Manutenção, com valor por coluna. |
| **Lead** | Cinco separadores: dados, briefing completo do §5, análise interna + calculadora, propostas e conversão em projeto. |
| **Calculadora** | Pacote base (§8) + extras (§9) + complexidade (§6) + urgência + risco + custos externos → mínimo, recomendado, premium e mensalidade sugerida. |
| **Propostas** | Todas as propostas, estado (rascunho / enviada / aceite / recusada) e taxa de aceitação. |
| **Clientes** | Dados de faturação, projetos, faturas e manutenção por cliente. |
| **Projetos** | Fase de desenvolvimento (§16), horas estimadas vs reais, €/h efetivo, checklist de entrega (§17), tarefas e faturas do projeto. |
| **Faturação** | Marcos de pagamento, trabalho adicional e custos de terceiros; pago vs pendente. |
| **Manutenção** | Contratos recorrentes, planos Basic/Business/Pro e receita mensal e anualizada. |
| **Referências** | As tabelas do documento sempre à mão: preços, mercado, extras, planos, processo, contrato, checklists. |

Transversal à app:

- **Tema claro e escuro**, com opção "sistema", no fundo da barra lateral.
- **Paleta de comandos** com `Ctrl+K`: salta para qualquer página, lead, cliente ou projeto.
- **Pipeline com arrastar-e-largar**: mover um cartão entre colunas muda a fase da lead e
  grava logo na base de dados.
- **Responsivo**: em telemóvel a barra lateral vira painel deslizante, útil para consultar uma
  lead numa reunião.

### O fluxo pensado para o dia a dia

1. Entra um contacto → **Nova lead** (fase *Novo Lead*).
2. Reunião → preencher o **briefing** no separador do lead. A barra mostra quanto falta.
3. **Análise & preço**: mexer nos pacotes, extras e nas notas de 1 a 5. Guardar fixa os três
   escalões na lead e atualiza o valor estimado.
4. **Propostas**: criar Essential, Business ou Premium a partir da análise, com âmbito,
   exclusões e rondas de alterações. Marcar como *Enviada* move a lead no pipeline.
5. Proposta aceite → **Converter em projeto**: cria o cliente, o projeto, as faturas do plano
   de pagamento escolhido (50/50 ou 40/30/30) e o contrato de manutenção.
6. Durante o projeto: registar horas reais, avançar a fase, marcar faturas pagas e fechar a
   checklist de entrega.
7. Entregue → o contrato de manutenção passa a contar na receita recorrente.

## Preços — calibração V2 (agosto de 2026)

As tabelas não são as do documento V1: foram recalibradas com preços praticados em Portugal
em 2026, recolhidos de publicações portuguesas de referência. O posicionamento é o do §2 —
acima do freelancer de entrada, abaixo da agência.

| Serviço | Freelancer (mercado) | Agência (mercado) | esDEV |
|---|---|---|---|
| Landing page | 300–1.000 € | 500–2.000 € | 600–1.200 € |
| Site institucional (5–10 páginas) | 1.000–5.000 € | 2.000–10.000 € | 1.900–3.400 € |
| Site médio (10–15 páginas) | 3.500–7.000 € | 3.000–6.000 € | 3.000–5.500 € |
| E-commerce (até 100 produtos) | 2.000–8.000 € | 3.000–15.000 € | 2.400–10.000 € |
| E-commerce à medida / ERP | — | 10.000–50.000 € | 10.000–22.000 € |
| Webapp / plataforma à medida | 8.000–30.000 € | 15.000–80.000 € | 9.000–25.000 € |
| CRM PME pequena | — | 3.000–8.000 € | 4.500–8.000 € |
| CRM PME média | — | 8.000–25.000 € | 9.000–18.000 € |
| Manutenção técnica | — | 40–150 €/mês | 45–95 €/mês (Basic) |
| Manutenção com conteúdos | — | 150–400 €/mês | 130–280 €/mês (Business) |
| Gestão completa com SEO | — | 400–750 €/mês | 320–650 €/mês (Pro) |
| Trabalho avulso | 20–60 €/h · 40–80 €/h | — | 50–75 €/h |

O valor/hora interno mínimo passou de 35 € para **45 €/h**: é o piso abaixo do qual um projeto
não paga custos, impostos e tempo não faturável, num mercado onde programadores freelance
cobram 30–80 €/h.

As faixas de mercado e as fontes (com links) estão na página **Referências** da aplicação e em
`src/lib/mercado.ts`. Revê-las anualmente, ou assim que houver 10 projetos fechados com horas
reais medidas — a partir daí os dados próprios valem mais do que qualquer artigo.

## Como o preço é calculado

```
preço técnico = (pacote base + extras)
                × fator de complexidade      média das 7 notas do §6, de ×0,80 a ×1,20
                × (1 + urgência)             0% a +30%
                × (1 + prioritário)          +10% quando ativo
                × (1 + margem de risco)      0% a +20%
                + custos externos            não multiplicados

preço final = preço técnico ± ajuste comercial, arredondado a 10 €
```

Os três escalões (mínimo, recomendado, premium) percorrem a mesma fórmula partindo das três
colunas da tabela de pacotes, e mapeiam diretamente nos níveis Essential, Business e Premium
das propostas (§10). A mensalidade sugerida escolhe o plano do §19 pelo peso do projeto e pela
categoria, posicionando o valor dentro da faixa do plano.

O valor/hora efetivo é mostrado sempre, comparado com o mínimo interno de 45 €/h. Fica
vermelho quando o preço não paga as horas — é o sinal do §29 de que o orçamento precisa de
correção, não de desconto.

Onde afinar: `src/lib/pricing.ts` tem as tabelas de pacotes, extras, planos de manutenção e
todos os fatores no topo do ficheiro. É o único sítio a mexer para recalibrar preços. Cada
pacote traz um campo `mercado` com a faixa observada, que aparece na calculadora — serve para
justificar o valor numa negociação.

## Calculadora em Excel

O repositório mantém também a versão em folha de cálculo, útil para orçamentar fora do CRM
ou para partilhar o raciocínio com terceiros:

```bash
python scripts/gerar_calculadora.py Calculadora_Precos_esDEV.xlsx
python scripts/verificar_calculadora.py   # avalia as fórmulas em 4 cenários
```

O modelo dela é independente — parte de horas por fase e tarifas horárias (55–70 €/h,
alinhadas com o mercado), enquanto o CRM parte de pacotes fechados. Os dois convergem nos
mesmos valores para os casos típicos (um institucional de 5 páginas dá 2.950 € no Excel e
2.600 € no CRM), mas o CRM é a fonte de verdade; o Excel é o instrumento de apoio.

## Estrutura

```
esdev-crm.bat        arranque com um clique no Windows
esdev-crm.sh         arranque em macOS / Linux
src/app/             páginas (App Router, Server Components)
src/components/      calculadora, briefing, quadro de pipeline, gráficos, navegação e UI
src/lib/pricing.ts   motor de preços — tabelas de pacotes, extras e fatores
src/lib/mercado.ts   faixas de mercado e fontes usadas na calibração
src/lib/dominio.ts   pipeline, briefing, checklists e regras do documento
src/lib/db.ts        ligação SQLite local
src/lib/actions.ts   escritas (Server Actions)
db/schema.sql        esquema da base de dados
scripts/             dados de exemplo e gerador da calculadora em Excel
```

Stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Recharts, next-themes e
SQLite via better-sqlite3.

## Avisos

Os preços são referências internas calibradas com o mercado, não uma tabela pública, e devem
ser confirmados com os teus custos reais e com o teu enquadramento fiscal (a Segurança Social
representa cerca de 15% da faturação bruta a partir do segundo ano de atividade). O
modelo de contrato e as cláusulas listadas em Referências precisam de revisão jurídica antes
de uso definitivo, e o enquadramento fiscal deve ser validado com contabilista — tal como o
próprio documento indica.
