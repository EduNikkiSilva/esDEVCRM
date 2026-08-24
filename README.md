# Calculadora de Preços esDEV

Calculadora de orçamentos em Excel para a esDEV: introduzem-se as características de um
projeto e o ficheiro devolve **Preço Mínimo / Recomendado / Premium**, horas estimadas,
prazo, plano de pagamento e **mensalidade de manutenção**.

O `.xlsx` não é um ficheiro estático: é gerado por script e contém fórmulas nativas de
Excel (`VLOOKUP`, `ROUND`, `MAX`, …), logo recalcula tudo no Excel, LibreOffice, Numbers
ou Google Sheets sem precisar de macros.

## Ficheiros

| Ficheiro | O que é |
|---|---|
| `Calculadora_Precos_esDEV.xlsx` | O ficheiro a usar no dia a dia |
| `scripts/gerar_calculadora.py` | Gera o `.xlsx` (fonte de verdade do modelo) |
| `scripts/verificar_calculadora.py` | Avalia as fórmulas e imprime 4 cenários de teste |

## Como usar

Abrir `Calculadora_Precos_esDEV.xlsx` e preencher **apenas as células amarelas** da folha
`Calculadora`. Tudo o resto é fórmula.

Folhas:

- **Calculadora** — inputs e resultados. É a única folha que se toca a orçamentar.
- **Detalhe** — auditoria: horas e euros fase a fase, para justificar o preço ao cliente
  (ou a ti mesmo) sem adivinhar.
- **Parametros** — tarifas, tabelas de horas por tipo de projeto, fatores e planos de
  manutenção. **É aqui que se calibra o modelo**, nunca nas fórmulas.
- **Proposta** — resumo já em texto corrido, pronto a copiar para o e-mail de proposta.

## Modelo de cálculo

```
horas por fase   = horas base do tipo de projeto
                   + páginas extra × horas/página   (40% design, 60% frontend)
                   + integrações extra × horas/integração
                   + horas de conteúdos + horas de SEO

fator por fase   = complexidade
                   × nível de design      (só UX/Design e Frontend)
                   × idiomas adicionais   (Frontend, QA, conteúdos, SEO)

valor            = Σ (horas ajustadas × tarifa da fase)
                   + gestão de projeto (15% das horas técnicas)
                   + buffer de risco (10%)

preço base       = valor × fator de urgência × fator de perfil de cliente

Mínimo           = MAX(piso do tipo de projeto, preço base × 0,85) arredondado a 25 €
Recomendado      = MAX(piso do tipo de projeto, preço base)        arredondado a 25 €
Premium          = MAX(piso do tipo de projeto, preço base × 1,30) arredondado a 25 €
                   ... e a todos: − desconto comercial + custos externos a repassar

manutenção/mês   = MAX(mínimo do plano, % do preço recomendado)
                   Essencial 2,0% (mín. 39 €) · Pro 3,5% (mín. 89 €) · Premium 5,5% (mín. 149 €)
```

Os três escalões existem para negociar com números, não com instinto: o **Mínimo** é o
piso abaixo do qual o projeto se recusa, o **Recomendado** é o valor que vai na proposta,
o **Premium** cobre prioridade na fila, revisões extra e acompanhamento próximo.

## Regenerar o ficheiro

```bash
pip install openpyxl
python scripts/gerar_calculadora.py Calculadora_Precos_esDEV.xlsx
```

Verificar que as fórmulas dão os valores esperados em vários cenários:

```bash
pip install formulas
python scripts/verificar_calculadora.py
```

Saída atual (arredondada) com os parâmetros por defeito:

| Cenário | Horas | Mínimo | Recomendado | Premium | Manutenção Pro |
|---|---|---|---|---|---|
| Landing page simples, template | 23 h | 750 € | 875 € | 1 150 € | 89 €/mês |
| Site institucional, 5 páginas | 81 h | 3 025 € | 3 575 € | 4 650 € | 125 €/mês |
| E-commerce 25 pág., 2 idiomas, urgente | 582 h | 37 450 € | 44 050 € | 57 275 € | 1 542 €/mês |
| Web app crítica, corporate, −10% | 653 h | 27 710 € | 32 548 € | 42 200 € | 1 139 €/mês |

## Calibração — ler antes de usar em produção

Os números de partida são estimativas de mercado para uma operação pequena em Portugal,
não os teus custos reais. Dois pontos a afinar primeiro:

1. **Tarifas e horas base** (`Parametros`, blocos 1 e 3). Compara com 2 ou 3 projetos já
   fechados: mete os inputs desses projetos na calculadora e ajusta as horas base até o
   Recomendado aterrar perto do que faturaste.
2. **Os multiplicadores acumulam.** Complexidade × design × urgência × perfil de cliente
   pode chegar a ~3,2×. É intencional (um e-commerce à medida, multilingue e urgente para
   um cliente corporate *é* outro projeto), mas se sentires o topo da tabela agressivo, o
   ajuste certo é baixar os fatores em `Parametros`, não descontar no fim — o desconto
   comercial sai direto da margem e vê-se na célula "Valor/hora efetivo".
