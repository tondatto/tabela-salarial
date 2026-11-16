import React, { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  Scale, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { compareCargos } from '../utils/salaryData';
import { formatBRL, formatDeltaBRL, formatPercent, CLASSE_LABELS } from '../utils/formatters';

export default function SideBySideCompare({
  cargos = [],
  registros = [],
  baselineCargo
}) {
  const [cargo1, setCargo1] = useState(baselineCargo || cargos[0]?.cargo);
  const [cargo2, setCargo2] = useState(() => {
    // Pegar o segundo cargo diferente da base
    const other = cargos.find(c => c.cargo !== baselineCargo);
    return other ? other.cargo : cargos[1]?.cargo || cargos[0]?.cargo;
  });
  const [filterClasse, setFilterClasse] = useState('ALL');

  const c1Obj = cargos.find(c => c.cargo === cargo1);
  const c2Obj = cargos.find(c => c.cargo === cargo2);

  const comparisons = useMemo(() => {
    const cls = filterClasse === 'ALL' ? null : filterClasse;
    return compareCargos(cargo1, cargo2, cls, registros);
  }, [cargo1, cargo2, filterClasse, registros]);

  // Métricas agregadas de comparação
  const metrics = useMemo(() => {
    if (!c1Obj || !c2Obj) return null;

    // Piso Inicial (A-1)
    const r1A1 = registros.find(r => r.cargo === cargo1 && r.classe === 'A' && r.nivel === 1);
    const r2A1 = registros.find(r => r.cargo === cargo2 && r.classe === 'A' && r.nivel === 1);
    const piso1 = r1A1?.valor || c1Obj.piso_inicial;
    const piso2 = r2A1?.valor || c2Obj.piso_inicial;
    const deltaPiso = piso2 - piso1;
    const deltaPisoPct = piso1 > 0 ? ((piso2 / piso1) - 1) * 100 : 0;

    // Teto Final (D-12 ou maior)
    const teto1 = c1Obj.teto_final;
    const teto2 = c2Obj.teto_final;
    const deltaTeto = teto2 - teto1;
    const deltaTetoPct = teto1 > 0 ? ((teto2 / teto1) - 1) * 100 : 0;

    return {
      piso1,
      piso2,
      deltaPiso,
      deltaPisoPct,
      teto1,
      teto2,
      deltaTeto,
      deltaTetoPct,
    };
  }, [c1Obj, c2Obj, cargo1, cargo2, registros]);

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-6">
      
      {/* Cabeçalho & Seletores */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50">
              Comparador Lado a Lado
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Compare as tabelas salariais de dois cargos passo a passo
            </p>
          </div>
        </div>

        {/* Seletores de Cargo 1 e Cargo 2 */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-auto">
            <label className="block text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mb-1">
              Cargo 1 (Referência):
            </label>
            <select
              value={cargo1}
              onChange={(e) => setCargo1(e.target.value)}
              className="w-full sm:w-[220px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {cargos.map(c => (
                <option key={`c1-${c.cargo}`} value={c.cargo}>
                  {c.orgao}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex items-center justify-center pt-5 text-zinc-400">
            <ArrowLeftRight className="w-4 h-4" />
          </div>

          <div className="w-full sm:w-auto">
            <label className="block text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mb-1">
              Cargo 2 (Comparado):
            </label>
            <select
              value={cargo2}
              onChange={(e) => setCargo2(e.target.value)}
              className="w-full sm:w-[220px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {cargos.map(c => (
                <option key={`c2-${c.cargo}`} value={c.cargo}>
                  {c.orgao}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards de Comparação Resumida */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card Piso Inicial */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="font-medium">Diferença no Piso Inicial (Classe A - Nível 1)</span>
              <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold ${
                metrics.deltaPiso >= 0
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
              }`}>
                {formatPercent(metrics.deltaPisoPct)}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xs text-zinc-500 font-sans">{c1Obj?.orgao}:</div>
                <div className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {formatBRL(metrics.piso1)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500 font-sans">{c2Obj?.orgao}:</div>
                <div className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {formatBRL(metrics.piso2)}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Delta Absoluto:</span>
              <span className={`font-mono font-bold ${
                metrics.deltaPiso >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {formatDeltaBRL(metrics.deltaPiso)}
              </span>
            </div>
          </div>

          {/* Card Teto de Carreira */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="font-medium">Diferença no Teto da Carreira (Classe D)</span>
              <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold ${
                metrics.deltaTeto >= 0
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
              }`}>
                {formatPercent(metrics.deltaTetoPct)}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xs text-zinc-500 font-sans">{c1Obj?.orgao}:</div>
                <div className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {formatBRL(metrics.teto1)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500 font-sans">{c2Obj?.orgao}:</div>
                <div className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {formatBRL(metrics.teto2)}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Delta Absoluto:</span>
              <span className={`font-mono font-bold ${
                metrics.deltaTeto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {formatDeltaBRL(metrics.deltaTeto)}
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Filtro por Classe */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Detalhamento Passo a Passo:
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterClasse('ALL')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              filterClasse === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            Todas as Classes
          </button>
          {['A', 'B', 'C', 'D'].map(cls => (
            <button
              key={cls}
              onClick={() => setFilterClasse(cls)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                filterClasse === cls
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
              }`}
            >
              Classe {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Comparação */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[460px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-zinc-100 dark:bg-zinc-900 sticky top-0 z-10 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Ref</th>
                <th className="py-2.5 px-3">Classe</th>
                <th className="py-2.5 px-3">Nível</th>
                <th className="py-2.5 px-3 text-right">{c1Obj?.orgao} (R$)</th>
                <th className="py-2.5 px-3 text-right">{c2Obj?.orgao} (R$)</th>
                <th className="py-2.5 px-3 text-right">Diferença (R$)</th>
                <th className="py-2.5 px-3 text-right">Diferença (%)</th>
                <th className="py-2.5 px-3 w-32">Equilíbrio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-mono">
              {comparisons.map((c) => {
                const hasBoth = c.val1 !== null && c.val2 !== null;
                const isPositive = c.deltaBRL > 0;
                const isNegative = c.deltaBRL < 0;

                // Barra proporcional de -50% a +50%
                const pctClamped = c.deltaPct !== null ? Math.max(-50, Math.min(50, c.deltaPct)) : 0;

                return (
                  <tr 
                    key={c.key} 
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="py-2 px-3 font-semibold text-zinc-800 dark:text-zinc-200">
                      {c.key}
                    </td>
                    <td className="py-2 px-3 font-sans text-zinc-500">
                      Classe {c.classe}
                    </td>
                    <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">
                      {c.nivel}
                    </td>
                    <td className="py-2 px-3 text-right text-zinc-800 dark:text-zinc-200">
                      {c.val1 !== null ? formatBRL(c.val1) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-zinc-800 dark:text-zinc-200">
                      {c.val2 !== null ? formatBRL(c.val2) : '-'}
                    </td>
                    <td className={`py-2 px-3 text-right font-bold ${
                      isPositive ? 'text-emerald-600 dark:text-emerald-400' : isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-400'
                    }`}>
                      {hasBoth ? formatDeltaBRL(c.deltaBRL) : '-'}
                    </td>
                    <td className={`py-2 px-3 text-right font-bold ${
                      isPositive ? 'text-emerald-600 dark:text-emerald-400' : isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-400'
                    }`}>
                      {hasBoth ? formatPercent(c.deltaPct) : '-'}
                    </td>
                    <td className="py-2 px-3">
                      {hasBoth ? (
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden flex items-center">
                          {isPositive ? (
                            <div 
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.abs(pctClamped) * 2)}%` }}
                            />
                          ) : isNegative ? (
                            <div 
                              className="h-full bg-rose-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.abs(pctClamped) * 2)}%` }}
                            />
                          ) : (
                            <div className="w-full h-full bg-zinc-400" />
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-sans">Sem paridade</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
