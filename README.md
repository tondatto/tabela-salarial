# Comparativo Salarial: Cargos de ANALISTA (40H) — Governo de Mato Grosso (SEPLAG MT)

Dashboard analítico e pipeline de extração de dados da tabela salarial oficial do Poder Executivo do Estado de Mato Grosso (SEPLAG MT) para todos os cargos de **ANALISTA** com jornada de **40 Horas semanais**.

---

## 📌 Contexto & Objetivos

No Governo do Estado de Mato Grosso, diversos órgãos e autarquias possuem planos de cargos e carreiras próprios para a função de **Analista** (nível superior). 

Este projeto permite aos servidores públicos e pesquisadores:
- **Comparar a isonomia salarial** entre os 10 órgãos/carreiras estaduais que contam com cargos de Analista.
- **Examinar a evolução nas classes** (Classes A, B, C e D) e nos **níveis horizontais** (1 a 12).
- **Calcular as discrepâncias salariais (R$ e %)** tomando como referência o cargo da Área Meio (`ANALISTA ADMINISTRATIVO L 10052`) ou qualquer outro cargo selecionado como base.
- **Identificar os percentuais de avanço** por tempo de serviço e por progressão de classes.
- **Exportar os dados tratados** em formatos CSV (pronto para Excel/Planilhas) e JSON estruturado.

---

## 🏛️ Cargos Mapeados no Estado (10 Órgãos)

| Órgão / Carreira | Cargo Oficial | Piso Inicial (A-1) | Teto Máximo (D-12) | Amplitude |
| :--- | :--- | :---: | :---: | :---: |
| **Área Meio (Poder Executivo)** | ANALISTA ADMINISTRATIVO L 10052 | **R$ 8.269,16** | **R$ 26.539,30** | +220,94% |
| **SEMA (Meio Ambiente)** | ANALISTA DE MEIO AMBIENTE L 10083/2014 | **R$ 10.491,97** | **R$ 28.980,07** | +176,21% |
| **INDEA (Defesa Agropecuária)** | ANALISTA ADM EST DEF AGRO E FLOR L9070 | **R$ 10.493,79** | **R$ 32.272,39** | +207,54% |
| **INTERMAT (Terras)** | ANALISTA FUNDIARIO E AGRARIO L 10042 | **R$ 10.493,79** | **R$ 32.272,39** | +207,54% |
| **AGER (Agência Reguladora)** | ANALISTA REGULADOR LC 467 | **R$ 9.581,50** | **R$ 27.760,39** | +189,73% |
| **PGE (Procuradoria Geral)** | ANALISTA DA PGE - LEI 10004/2013 | **R$ 9.053,91** | **R$ 26.202,19** | +189,40% |
| **Desenv. Econômico** | ANALISTA DESENV ECON SOCIAL L 10050 | **R$ 8.269,16** | **R$ 26.539,30** | +220,94% |
| **Socioeducativo** | ANALISTA DO SIST. SOCIOEDUCATIVO | **R$ 8.321,05** | **R$ 24.942,88** | +199,76% |
| **DETRAN (Trânsito)** | ANALISTA DO SERVICO TRANSITO LC 505/13 | **R$ 7.876,65** | **R$ 25.279,66** | +220,95% |
| **IPEM (Metrologia)** | ANALISTA FISCAL METROLOGICO | **R$ 7.867,71** | **R$ 26.084,51** | +231,54% |

*Vigência dos valores: Janeiro/2026 em diante (Período `01/01/2026 - ATUAL`).*

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js** (v18+) e `npm`
- **Python** (3.8+) com módulos padrão (`urllib`, `json`, `csv`)

### 1. Iniciar o Dashboard Web
```bash
npm run dev
```
Acesse no navegador: `http://localhost:5173`

### 2. Gerar Versão de Produção (Build)
```bash
npm run build
npm run preview
```

### 3. Atualizar os Dados da SEPLAG MT (Scraper)
Caso o governo publique reajustes (RGA) ou novas tabelas, atualize a base a qualquer momento:
```bash
npm run scrape
# ou diretamente via Python:
python3 scripts/scrape_salarios.py
```
Para apenas validar a integridade dos dados sem re-baixar:
```bash
python3 scripts/scrape_salarios.py --verify
```

---

## 📊 Estrutura do Dashboard

- **Visão Geral & Ranking:** KPI cards executivos com pisos, tetos, médias e dispersão estadual, acompanhados de gráfico de ranking ordenado com destaque para o cargo base e visualização de deltas em R$ e %.
- **Curvas de Progressão:** Gráfico interativo com as linhas de evolução ao longo dos 12 níveis para as classes A (Graduação), B (Especialização), C (Mestrado) e D (Doutorado) ou trajetória contínua.
- **Comparador Lado a Lado:** Selecione 2 cargos quaisquer para inspecionar passo a passo as diferenças salariais nível a nível, com barras de equilíbrio visual e resumo executivo de deltas.
- **Matriz Completa (4×12):** Tabela matricial oficial do cargo selecionado contendo valores nominais em R$, percentual de avanço horizontal (`↑ +X%`) e ganho por progressão entre classes (`→ +X%`).
- **Exportação de Dados:** Download direto dos arquivos `.csv` e `.json` consolidados e cópia de resumo para área de transferência.

---

## 📁 Estrutura de Arquivos

```
tabela-salarial/
├── data/
│   ├── salarios_analistas_40h.json # Dataset tratado em JSON
│   └── salarios_analistas_40h.csv  # Dataset tratado em CSV (; delimitado)
├── public/
│   └── data/                       # Cópia servida estaticamente
├── scripts/
│   └── scrape_salarios.py          # Script de extração da API SEPLAG MT
├── src/
│   ├── components/                 # Componentes React (Cards, Charts, Tables)
│   ├── utils/                      # Funções de cálculo, formatação BRL e agregações
│   ├── App.jsx                     # Aplicação e controle de estado
│   ├── main.jsx                    # Entrada React
│   └── index.css                   # Estilos Tailwind e fontes
├── package.json
├── vite.config.js
└── README.md
```
