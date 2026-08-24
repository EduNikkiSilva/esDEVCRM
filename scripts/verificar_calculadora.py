"""Avalia as fórmulas do .xlsx gerado e imprime os resultados de vários cenários.

Serve para garantir que o ficheiro abre no Excel já com valores corretos e que
nenhuma referência (VLOOKUP, tarifas, escalões) ficou trocada.

Uso:
    python scripts/verificar_calculadora.py [ficheiro.xlsx]
"""

from __future__ import annotations

import os
import sys

import formulas

SAIDAS = {
    "Horas totais": "CALCULADORA!C20",
    "Prazo (semanas)": "CALCULADORA!C21",
    "Preço base": "CALCULADORA!C22",
    "Preço Mínimo": "CALCULADORA!C26",
    "Preço Recomendado": "CALCULADORA!C27",
    "Preço Premium": "CALCULADORA!C28",
    "Valor/hora efetivo": "CALCULADORA!C29",
    "Manutenção Essencial": "CALCULADORA!C32",
    "Manutenção Pro": "CALCULADORA!C33",
    "Manutenção Premium": "CALCULADORA!C34",
}

# Cada cenário sobrepõe as células de input da folha Calculadora.
CENARIOS = [
    ("Cenário por defeito (site institucional, 5 páginas)", {}),
    (
        "Landing page simples, template, cliente fornece conteúdos",
        {
            "C6": "Landing page (1 página)",
            "C7": "Simples — pouco conteúdo, sem lógica",
            "C8": 1,
            "C9": "Template adaptado",
            "C13": "Sem SEO",
            "C15": "Startup / Negócio local",
        },
    ),
    (
        "E-commerce, 25 produtos/páginas, 2 idiomas, 3 integrações, urgente",
        {
            "C6": "Loja online (e-commerce)",
            "C7": "Alta — regras de negócio próprias",
            "C8": 25,
            "C9": "100% à medida",
            "C10": 2,
            "C11": 3,
            "C12": "esDEV produz textos e imagens",
            "C13": "SEO avançado (estrutura + performance)",
            "C14": "Urgente (fora de horas / fila)",
            "C15": "Corporate / Institucional",
        },
    ),
    (
        "Web app crítica, corporate, com desconto de 10%",
        {
            "C6": "Web app / Dashboard",
            "C7": "Muito alta — crítico / à medida",
            "C8": 14,
            "C11": 2,
            "C15": "Corporate / Institucional",
            "C16": 0.10,
            "C17": 350,
        },
    ),
]


def main(caminho: str) -> None:
    livro = os.path.basename(caminho)
    ref = lambda cel: f"'[{livro}]{cel}'".replace("!", "'!").replace("''", "'")
    modelo = formulas.ExcelModel().loads(caminho).finish()

    for titulo, inputs in CENARIOS:
        chaves = {f"'[{livro}]CALCULADORA'!{c}": v for c, v in inputs.items()}
        solucao = modelo.calculate(inputs=chaves) if chaves else modelo.calculate()
        print(f"\n{titulo}")
        print("-" * len(titulo))
        for nome, cel in SAIDAS.items():
            folha, celula = cel.split("!")
            valor = solucao[f"'[{livro}]{folha}'!{celula}"].value[0, 0]
            try:
                print(f"  {nome:<24} {float(valor):>12,.2f}")
            except (TypeError, ValueError):
                print(f"  {nome:<24} {valor}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "Calculadora_Precos_esDEV.xlsx")
