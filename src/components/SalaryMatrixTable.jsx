import React, { useState } from 'react';
import { Table, Building, Sparkles, TrendingUp } from 'lucide-react';
import { buildMatrixForCargo } from '../utils/salaryData';
import { formatBRL, formatPercent, CLASSE_LABELS, CLASSE_SHORT_LABELS } from '../utils/formatters';

export default function SalaryMatrixTable({
  cargos = [],
  registros = [],
  baselineCargo
}) {
  const [selectedCargo, setSelectedCargo] = useState(baselineCargo || cargos[0]?.cargo);

  const cargoObj = cargos.find(c => c.cargo === selectedCargo);
  const { maxNivel, matrix } = buildMatrixForCargo(selectedCargo, registros);

  const classes = ['A', 'B', 'C', 'D'];

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-5">
      
      {/* Cabeçalho do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50">
              Matriz da Tabela Salarial (Classe × Nível)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Visualização oficial completa com percentuais de avanço horizontal e vertical
            </p>
          </div>
        </div>

        {/* Seletor do Cargo para a Matriz */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Cargo:
          </span>
          <select
            value={selectedCargo}
            onChange={(e) => setSelectedCargo(e.target.value)}
            className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {cargos.map(c => (
              <option key={c.cargo} value={c.cargo}>
                {c.orgao} — {c.cargo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Info Bar do Cargo Selecionado */}
      {cargoObj && (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {cargoObj.orgao}
            </span>
            <span className="text-zinc-400">•</span>
            <span className="text-zinc-500 dark:text-zinc-400 font-mono">
              {cargoObj.cargo}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-zinc-600 dark:text-zinc-300">
            <div>
              <span className="text-zinc-400">Estrutura: </span>
              <strong className="font-mono text-zinc-900 dark:text-zinc-100">4 Classes × {maxNivel} Níveis</strong>
            </div>
            <div>
              <span className="text-zinc-400">Piso (A-1): </span>
              <strong className="font-mono text-zinc-900 dark:text-zinc-100">{formatBRL(cargoObj.piso_inicial)}</strong>
            </div>
            <div>
              <span className="text-zinc-400">Teto (Final): </span>
              <strong className="font-mono text-zinc-900 dark:text-zinc-100">{formatBRL(cargoObj.teto_final)}</strong>
            </div>
            <div>
              <span className="text-zinc-400">Amplitude: </span>
              <strong className="font-mono text-blue-600 dark:text-blue-400">+{cargoObj.amplitude_salarial_pct}%</strong>
            </div>
          </div>
        </div>
      )}

      {/* Tabela Matricial */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold border-b border-zinc-200 dark:border-zinc-800">
              <tr className="divide-x divide-zinc-200/80 dark:divide-zinc-800">
                <th className="py-3 px-4 w-28">Nível</th>
                {classes.map(c => (
                  <th key={c} className="py-3 px-5 text-right">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                        Classe {c}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-mono">
              {matrix.map((row) => (
                <tr 
                  key={row.nivel}
                  className="divide-x divide-zinc-100 dark:divide-zinc-800/70 hover:bg-blue-50/30 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-50/70 dark:bg-zinc-900/40 whitespace-nowrap">
                    Nível {row.nivel}
                  </td>
                  {classes.map(c => {
                    const val = row.values[c];
                    const stepH = row.stepsH[c];
                    const stepV = row.stepsV[c];

                    return (
                      <td key={c} className="py-3 px-5 text-right align-top">
                        {val ? (
                          <div>
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                              {formatBRL(val)}
                            </div>
                            <div className="flex items-center justify-end gap-1.5 text-[10px] mt-0.5 text-zinc-500 dark:text-zinc-400">
                              {stepH !== undefined && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium" title="Avanço sobre o nível anterior (horizontal)">
                                  ↑ {formatPercent(stepH)}
                                </span>
                              )}
                              {stepH !== undefined && stepV !== undefined && (
                                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                              )}
                              {stepV !== undefined && (
                                <span className="text-blue-600 dark:text-blue-400 font-medium" title="Avanço sobre a classe anterior (vertical)">
                                  → {formatPercent(stepV)}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-700">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legenda explicativa */}
      <div className="flex flex-wrap items-center justify-end gap-4 text-xs text-zinc-500 dark:text-zinc-400 pt-1">
        <div className="flex items-center gap-1">
          <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">↑ +X%</span>
          <span>= Progressão horizontal (tempo/avaliação)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-blue-600 dark:text-blue-400 font-bold font-mono">→ +X%</span>
          <span>= Progressão vertical entre classes</span>
        </div>
      </div>

    </div>
  );
}
