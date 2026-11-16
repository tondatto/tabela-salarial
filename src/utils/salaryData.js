/**
 * Utilitários de processamento e agregação para os dados salariais dos Analistas SEPLAG MT
 */

export const BASELINE_CARGO_DEFAULT = "ANALISTA ADMINISTRATIVO L 10052";

export function computeSummaryMetrics(cargos, registros) {
  if (!cargos || cargos.length === 0 || !registros || registros.length === 0) {
    return null;
  }

  // Filtrar A-001 (Pisos iniciais)
  const a001Records = registros.filter(r => r.classe === 'A' && r.nivel === 1);
  const pisos = a001Records.map(r => ({ cargo: r.cargo, orgao: r.orgao, valor: r.valor }));
  pisos.sort((a, b) => a.valor - b.valor);

  const minPisoVal = pisos[0].valor;
  const maxPisoVal = pisos[pisos.length - 1].valor;
  const minPisoOrgaos = pisos.filter(p => p.valor === minPisoVal).map(p => p.orgao.split(' (')[0]);
  const maxPisoOrgaos = pisos.filter(p => p.valor === maxPisoVal).map(p => p.orgao.split(' (')[0]);

  const minPiso = {
    ...pisos[0],
    orgao: minPisoOrgaos.length > 1 ? minPisoOrgaos.join(' / ') : pisos[0].orgao
  };
  const maxPiso = {
    ...pisos[pisos.length - 1],
    orgao: maxPisoOrgaos.length > 1 ? maxPisoOrgaos.join(' / ') : pisos[pisos.length - 1].orgao
  };
  const avgPiso = pisos.reduce((sum, p) => sum + p.valor, 0) / pisos.length;

  // Filtrar tetos (maior valor de cada cargo)
  const tetos = cargos.map(c => ({
    cargo: c.cargo,
    orgao: c.orgao,
    valor: c.teto_final
  }));
  tetos.sort((a, b) => a.valor - b.valor);

  const minTetoVal = tetos[0].valor;
  const maxTetoVal = tetos[tetos.length - 1].valor;
  const minTetoOrgaos = tetos.filter(t => t.valor === minTetoVal).map(t => t.orgao.split(' (')[0]);
  const maxTetoOrgaos = tetos.filter(t => t.valor === maxTetoVal).map(t => t.orgao.split(' (')[0]);

  const minTeto = {
    ...tetos[0],
    orgao: minTetoOrgaos.length > 1 ? minTetoOrgaos.join(' / ') : tetos[0].orgao
  };
  const maxTeto = {
    ...tetos[tetos.length - 1],
    orgao: maxTetoOrgaos.length > 1 ? maxTetoOrgaos.join(' / ') : tetos[tetos.length - 1].orgao
  };
  const avgTeto = tetos.reduce((sum, t) => sum + t.valor, 0) / tetos.length;

  // Dispersão do piso inicial: (maxPiso / minPiso - 1) * 100
  const dispersaoPisoPct = minPiso && minPiso.valor > 0 
    ? ((maxPiso.valor - minPiso.valor) / minPiso.valor) * 100 
    : 0;

  // Dispersão do teto:
  const dispersaoTetoPct = minTeto && minTeto.valor > 0 
    ? ((maxTeto.valor - minTeto.valor) / minTeto.valor) * 100 
    : 0;

  // Ganhos médios por progressão de classe (A->B, B->C, C->D no nível 1)
  const classProgressionGains = cargos.map(c => {
    const rA = registros.find(r => r.cargo === c.cargo && r.classe === 'A' && r.nivel === 1);
    const rB = registros.find(r => r.cargo === c.cargo && r.classe === 'B' && r.nivel === 1);
    const rC = registros.find(r => r.cargo === c.cargo && r.classe === 'C' && r.nivel === 1);
    const rD = registros.find(r => r.cargo === c.cargo && r.classe === 'D' && r.nivel === 1);

    const gainAB = rA && rB ? ((rB.valor / rA.valor) - 1) * 100 : 0;
    const gainBC = rB && rC ? ((rC.valor / rB.valor) - 1) * 100 : 0;
    const gainCD = rC && rD ? ((rD.valor / rC.valor) - 1) * 100 : 0;
    const gainTotalAD = rA && rD ? ((rD.valor / rA.valor) - 1) * 100 : 0;

    return { cargo: c.cargo, orgao: c.orgao, gainAB, gainBC, gainCD, gainTotalAD };
  });

  const avgGainAB = classProgressionGains.reduce((acc, t) => acc + t.gainAB, 0) / classProgressionGains.length;
  const avgGainBC = classProgressionGains.reduce((acc, t) => acc + t.gainBC, 0) / classProgressionGains.length;
  const avgGainCD = classProgressionGains.reduce((acc, t) => acc + t.gainCD, 0) / classProgressionGains.length;
  const avgGainTotalAD = classProgressionGains.reduce((acc, t) => acc + t.gainTotalAD, 0) / classProgressionGains.length;

  return {
    totalCargos: cargos.length,
    minPiso,
    maxPiso,
    avgPiso,
    minTeto,
    maxTeto,
    avgTeto,
    dispersaoPisoPct,
    dispersaoTetoPct,
    avgGainAB,
    avgGainBC,
    avgGainCD,
    avgGainTotalAD,
    classProgressionGains
  };
}

/**
 * Constrói a matriz (linhas = níveis 1..12, colunas = classes A, B, C, D)
 * para um cargo específico, incluindo percentuais de avanço horizontal e vertical.
 */
export function buildMatrixForCargo(cargoName, registros) {
  const cargoRecords = registros.filter(r => r.cargo === cargoName);
  const classes = ['A', 'B', 'C', 'D'];
  const maxNivel = cargoRecords.length > 0 ? Math.max(...cargoRecords.map(r => r.nivel)) : 12;

  // Mapear records por chave `${classe}-${nivel}`
  const map = new Map();
  cargoRecords.forEach(r => {
    map.set(`${r.classe}-${r.nivel}`, r.valor);
  });

  const matrix = [];
  for (let n = 1; n <= maxNivel; n++) {
    const row = { nivel: n, values: {}, stepsH: {}, stepsV: {} };
    for (const c of classes) {
      const val = map.get(`${c}-${n}`) || null;
      row.values[c] = val;

      // Passo horizontal (vs nível anterior na mesma classe)
      if (val && n > 1) {
        const prevVal = map.get(`${c}-${n - 1}`);
        if (prevVal) {
          row.stepsH[c] = ((val / prevVal) - 1) * 100;
        }
      }

      // Passo vertical (vs classe anterior no mesmo nível)
      if (val) {
        const classIdx = classes.indexOf(c);
        if (classIdx > 0) {
          const prevClass = classes[classIdx - 1];
          const prevClassVal = map.get(`${prevClass}-${n}`);
          if (prevClassVal) {
            row.stepsV[c] = ((val / prevClassVal) - 1) * 100;
          }
        }
      }
    }
    matrix.push(row);
  }

  return { maxNivel, matrix };
}

/**
 * Compara dois cargos nível a nível
 */
export function compareCargos(cargo1Name, cargo2Name, classe, registros) {
  const c1Records = registros.filter(r => r.cargo === cargo1Name && (!classe || r.classe === classe));
  const c2Records = registros.filter(r => r.cargo === cargo2Name && (!classe || r.classe === classe));

  const c1Map = new Map();
  c1Records.forEach(r => c1Map.set(`${r.classe}-${r.nivel}`, r));

  const c2Map = new Map();
  c2Records.forEach(r => c2Map.set(`${r.classe}-${r.nivel}`, r));

  // Todas as combinações classe/nível presentes em ambos
  const allKeys = Array.from(new Set([...c1Map.keys(), ...c2Map.keys()]));
  allKeys.sort((a, b) => {
    const [cA, nA] = a.split('-');
    const [cB, nB] = b.split('-');
    if (cA !== cB) return cA.localeCompare(cB);
    return parseInt(nA) - parseInt(nB);
  });

  const comparisons = allKeys.map(key => {
    const r1 = c1Map.get(key);
    const r2 = c2Map.get(key);
    const val1 = r1 ? r1.valor : null;
    const val2 = r2 ? r2.valor : null;
    const deltaBRL = (val1 !== null && val2 !== null) ? (val2 - val1) : null;
    const deltaPct = (val1 !== null && val2 !== null && val1 > 0) ? ((val2 / val1) - 1) * 100 : null;

    const [cls, niv] = key.split('-');
    return {
      key,
      classe: cls,
      nivel: parseInt(niv),
      val1,
      val2,
      deltaBRL,
      deltaPct
    };
  });

  return comparisons;
}
