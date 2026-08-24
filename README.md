# esDEV CRM

CRM interno da esDEV, para correr **localmente no teu computador**. É a implementação do
documento *esDEV — Sistema Operacional e Comercial v1.0*: pipeline comercial, briefing,
análise interna, calculadora de preços, propostas em três níveis, projetos, faturação,
manutenção e receita recorrente.

Os dados ficam num único ficheiro SQLite em `data/esdev.db`. Não há contas, servidores
externos nem nuvem: nada sai da tua máquina.

## Arrancar

Requisitos: Node.js 20 ou superior.

```bash
npm install
npm run dados-exemplo   # opcional: insere os dois exemplos do documento (§26 e §27)
npm run dev             # http://localhost:43127
```

Para uso normal do dia a dia, compila uma vez e corre em modo produção (arranca mais rápido):

```bash
npm run build
npm start               # http://localhost:43127
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
| **Referências** | As tabelas do documento sempre à mão: preços V1, extras, planos, processo, contrato, checklists. |

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
colunas da tabela do §8, e mapeiam diretamente nos níveis Essential, Business e Premium das
propostas (§10). A mensalidade sugerida escolhe o plano do §19 pelo peso do projeto e pela
categoria, posicionando o valor dentro da faixa do plano.

O valor/hora efetivo é mostrado sempre, comparado com a referência interna de 35 €/h (§7).
Fica vermelho quando o preço não paga as horas — é o sinal do §29 de que o orçamento precisa
de correção, não de desconto.

Onde afinar: `src/lib/pricing.ts` tem as tabelas de pacotes, extras, planos de manutenção e
todos os fatores no topo do ficheiro. É o único sítio a mexer para recalibrar preços.

## Calculadora em Excel

O repositório mantém também a versão em folha de cálculo, útil para orçamentar fora do CRM
ou para partilhar o raciocínio com terceiros:

```bash
python scripts/gerar_calculadora.py Calculadora_Precos_esDEV.xlsx
python scripts/verificar_calculadora.py   # avalia as fórmulas em 4 cenários
```

O modelo dela é independente (baseado em horas por fase e tarifas). O CRM é a fonte de
verdade; o Excel é o instrumento de apoio.

## Estrutura

```
src/app/           páginas (App Router, Server Components)
src/components/    calculadora, briefing, checklist, navegação e UI (shadcn/ui)
src/lib/pricing.ts motor de preços — tabelas §8/§9 e fatores §6
src/lib/dominio.ts pipeline, briefing, checklists e regras do documento
src/lib/db.ts      ligação SQLite local
src/lib/actions.ts escritas (Server Actions)
db/schema.sql      esquema da base de dados
scripts/           dados de exemplo e gerador da calculadora em Excel
```

Stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, SQLite via
better-sqlite3.

## Avisos

Os preços são referências internas V1 e devem ser revistos com custos e dados reais. O
modelo de contrato e as cláusulas listadas em Referências precisam de revisão jurídica antes
de uso definitivo, e o enquadramento fiscal deve ser validado com contabilista — tal como o
próprio documento indica.
