#!/usr/bin/env python3
"""
Scraper de Tabelas Salariais da SEPLAG MT
Focado nos cargos de ANALISTA (40H) do Governo do Estado de Mato Grosso.
"""

import sys
import os
import json
import csv
import argparse
import urllib.request
import urllib.parse
from datetime import datetime

BASE_URL = "https://servicos.seplag.mt.gov.br/apiportalservidor/publicos/tabelaSalarial"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json"
}

# Mapeamento amigável de órgãos / carreiras
ORGAO_MAP = {
    "Profissionais da Area Meio do Poder Executivo Estadual": "Poder Executivo (Área Meio)",
    "Profissionais de Meio Ambiente": "SEMA (Meio Ambiente)",
    "Profissionais do Instituto de Defesa Agropecuario": "INDEA (Defesa Agropecuária)",
    "Profissionais do Instituto de Terras de Mato Grosso": "INTERMAT (Terras)",
    "Profissionais Analistas Reguladores": "AGER (Agência Reguladora)",
    "Prof.do Quadro Administrativo da Proc. Geral do Estado": "PGE (Procuradoria Geral)",
    "Prof. do Sistema Nacional de Transito de MT": "DETRAN (Trânsito)",
    "Profissionais de Desenvolvimento Econômico e Social": "SEDEC (Desenv. Econômico)",
    "Profissionais do Sistema Sócio Educativo": "Socioeducativo",
    "Profissionais de Metrologia e Qualidade Industrial": "IPEM (Metrologia)"
}

def request_json(url, method="GET", data=None):
    req_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=req_data, headers=HEADERS, method=method)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def listar_carreiras():
    return request_json(f"{BASE_URL}/listarCarreira")

def listar_cargos(carreira):
    url = f"{BASE_URL}/listarCargo?" + urllib.parse.urlencode({"carreira": carreira})
    return request_json(url)

def listar_periodos(carreira, cargo):
    url = f"{BASE_URL}/listarPeriodo?" + urllib.parse.urlencode({"carreira": carreira, "cargo": cargo})
    return request_json(url)

def listar_jornadas(carreira, cargo, data_periodo):
    payload = {
        "carreira": carreira,
        "cargo": cargo,
        "periodo": data_periodo
    }
    return request_json(f"{BASE_URL}/listarJornada", method="PUT", data=payload)

def obter_tabela_salarial(carreira, cargo, data_periodo, jornada):
    payload = {
        "carreira": carreira,
        "cargo": cargo,
        "periodo": data_periodo,
        "jornada": jornada
    }
    return request_json(BASE_URL, method="PUT", data=payload)

def parse_referencia(ref):
    """Extrai classe (A, B, C, D) e nivel numérico (1..12) de referências como A-001 ou D-012."""
    if not ref or "-" not in ref:
        return ref, 0
    parts = ref.split("-")
    classe = parts[0].strip()
    try:
        nivel = int(parts[1].strip())
    except ValueError:
        nivel = 0
    return classe, nivel

def scrape_data(only_analistas=True, jornada_target="40H"):
    print("Iniciando coleta de dados do Portal SEPLAG MT...")
    carreiras = listar_carreiras()
    print(f"Total de carreiras encontradas: {len(carreiras)}")
    
    cargos_selecionados = []
    
    for carreira in carreiras:
        try:
            cargos = listar_cargos(carreira)
            for cargo in cargos:
                if only_analistas:
                    if "ANALISTA" in cargo.upper():
                        cargos_selecionados.append((carreira, cargo))
                else:
                    cargos_selecionados.append((carreira, cargo))
        except Exception as e:
            print(f"Aviso: Erro ao listar cargos de {carreira}: {e}")
            
    print(f"Total de cargos para extrair ({'ANALISTA' if only_analistas else 'TODOS'}): {len(cargos_selecionados)}")
    
    all_records = []
    cargos_resumo = []
    
    for idx, (carreira, cargo) in enumerate(cargos_selecionados, 1):
        print(f"[{idx}/{len(cargos_selecionados)}] Processando: {cargo} ({carreira})...")
        try:
            periodos = listar_periodos(carreira, cargo)
            if not periodos:
                print(f"   -> Nenhum período encontrado para {cargo}")
                continue
                
            periodo_raw = periodos[0]  # Ex: "01/01/2026 - ATUAL"
            data_periodo = periodo_raw.split(" ")[0].strip()
            
            jornadas = listar_jornadas(carreira, cargo, data_periodo)
            if jornada_target not in jornadas:
                print(f"   -> Jornada {jornada_target} não disponível para {cargo} (Disponíveis: {jornadas})")
                continue
                
            tabela = obter_tabela_salarial(carreira, cargo, data_periodo, jornada_target)
            
            orgao = ORGAO_MAP.get(carreira, carreira)
            
            # Enriquecer os registros
            tabela_sorted = sorted(tabela, key=lambda x: (x.get("referencia", "")))
            valores = [item["valor"] for item in tabela_sorted]
            piso = min(valores) if valores else 0
            teto = max(valores) if valores else 0
            
            cargo_info = {
                "carreira": carreira,
                "orgao": orgao,
                "cargo": cargo,
                "jornada": jornada_target,
                "periodo_vigencia": periodo_raw,
                "data_vigencia": data_periodo,
                "total_steps": len(tabela_sorted),
                "piso_inicial": piso,
                "teto_final": teto,
                "amplitude_salarial_rs": round(teto - piso, 2),
                "amplitude_salarial_pct": round(((teto / piso) - 1) * 100, 2) if piso > 0 else 0
            }
            cargos_resumo.append(cargo_info)
            
            for item in tabela_sorted:
                classe, nivel = parse_referencia(item.get("referencia", ""))
                rec = {
                    "id": item.get("idReg"),
                    "carreira": carreira,
                    "orgao": orgao,
                    "cargo": cargo,
                    "jornada": item.get("jornada"),
                    "referencia": item.get("referencia"),
                    "classe": classe,
                    "nivel": nivel,
                    "valor": float(item.get("valor", 0)),
                    "data_inicio": item.get("dataIni"),
                    "periodo": periodo_raw
                }
                all_records.append(rec)
                
            print(f"   -> Sucesso: {len(tabela_sorted)} steps | Piso: R$ {piso:,.2f} | Teto: R$ {teto:,.2f}")
        except Exception as e:
            print(f"   -> Erro ao extrair {cargo}: {e}")
            
    return cargos_resumo, all_records

def save_outputs(cargos_resumo, all_records, output_dir="data"):
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. JSON Principal
    json_path = os.path.join(output_dir, "salarios_analistas_40h.json")
    dataset = {
        "metadata": {
            "fonte": "SEPLAG MT - Portal do Servidor",
            "url": "https://servicos.seplag.mt.gov.br/portalservidor/publico/tabela-salarial",
            "data_extracao": datetime.now().isoformat(),
            "total_cargos": len(cargos_resumo),
            "total_registros": len(all_records),
            "jornada": "40H",
            "periodo_referencia": "01/01/2026 - ATUAL"
        },
        "cargos": cargos_resumo,
        "registros": all_records
    }
    
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    print(f"Salvo arquivo JSON: {json_path}")
    
    # 2. CSV para Excel/Sheets
    csv_path = os.path.join(output_dir, "salarios_analistas_40h.csv")
    fieldnames = [
        "id", "orgao", "carreira", "cargo", "jornada", 
        "referencia", "classe", "nivel", "valor", "data_inicio", "periodo"
    ]
    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=";")
        writer.writeheader()
        writer.writerows(all_records)
    print(f"Salvo arquivo CSV: {csv_path}")

    # 3. Também salvar na pasta public/data se existir
    public_dir = os.path.join("public", "data")
    os.makedirs(public_dir, exist_ok=True)
    public_json = os.path.join(public_dir, "salarios_analistas_40h.json")
    with open(public_json, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    print(f"Sincronizado com public/data: {public_json}")

def verify_dataset(json_path="data/salarios_analistas_40h.json"):
    print("\nExecutando verificação de integridade do dataset...")
    if not os.path.exists(json_path):
        print(f"Erro: Arquivo {json_path} não encontrado!")
        sys.exit(1)
        
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    cargos = data.get("cargos", [])
    registros = data.get("registros", [])
    
    print(f"✔ Cargos carregados: {len(cargos)} (esperado: 10)")
    assert len(cargos) == 10, f"Esperado 10 cargos, obtido {len(cargos)}"
    
    print(f"✔ Total de registros: {len(registros)} (esperado entre 400 e 480)")
    assert len(registros) >= 400, "Registros insuficientes!"
    
    # Verificar valores e classes
    classes_esperadas = {"A", "B", "C", "D"}
    for r in registros:
        assert r["valor"] > 0, f"Registro com valor inválido: {r}"
        assert r["jornada"] == "40H", f"Jornada divergente: {r}"
        assert r["classe"] in classes_esperadas, f"Classe inválida: {r}"
        assert 1 <= r["nivel"] <= 12, f"Nível inválido: {r}"
        
    print("✔ Todos os registros validados com sucesso!")
    print("✔ Verificação de integridade concluída com 100% de aprovação.")

def main():
    parser = argparse.ArgumentParser(description="Scraper Tabela Salarial SEPLAG MT")
    parser.add_argument("--verify", action="store_true", help="Executa apenas a verificação de integridade")
    parser.add_argument("--all", action="store_true", help="Extrai todos os cargos do governo, não apenas Analistas")
    parser.add_argument("--output-dir", default="data", help="Diretório de saída")
    args = parser.parse_args()
    
    if args.verify:
        verify_dataset(os.path.join(args.output_dir, "salarios_analistas_40h.json"))
        return
        
    cargos_resumo, all_records = scrape_data(only_analistas=not args.all)
    save_outputs(cargos_resumo, all_records, output_dir=args.output_dir)
    verify_dataset(os.path.join(args.output_dir, "salarios_analistas_40h.json"))

if __name__ == "__main__":
    main()
