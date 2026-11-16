import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  ArrowLeftRight, 
  Scale, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  ScatterChart as ScatterIcon,
  HelpCircle
} from 'lucide-react';
import { compareCargos } from '../utils/salaryData';
import { formatBRL, formatDeltaBRL, formatPercent, CLASSE_LABELS } from '../utils/formatters';

export default function SideBySideCompare({
  cargos = [],
  registros = [],
  baselineCargo,
  isDarkMode
}) {
  const [cargo1, setCargo1] = useState(baselineCargo || cargos[0]?.cargo);
  const [cargo2, setCargo2] = useState(() => {
    const other = cargos.find(c => c.cargo !== baselineCargo);
    return other ? other.cargo : cargos[1]?.cargo || cargos[0]?.cargo;
  });
  const [filterClasse, setFilterClasse] = useState('ALL');
  const [scatterMode, setScatterMode] = useState('parity'); // 'parity' | 'delta'

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

  // Opções do Gráfico de Dispersão ECharts (responsivo ao filtro de classe)
  const scatterOption = useMemo(() => {
    const textColor = isDarkMode ? '#d4d4d8' : '#27272a';
    const splitLineColor = isDarkMode ? '#27272a' : '#f4f4f5';

    // Apenas registros válidos presentes em ambos
    const validPairs = comparisons.filter(c => c.val1 !== null && c.val2 !== null);
    if (validPairs.length === 0) return {};

    if (scatterMode === 'parity') {
      // Modo Paridade (X = Salário Cargo 1, Y = Salário Cargo 2)
      const allVals = validPairs.flatMap(c => [c.val1, c.val2]);
      const minVal = Math.max(0, Math.floor((Math.min(...allVals) * 0.92) / 1000) * 1000);
      const maxVal = Math.ceil((Math.max(...allVals) * 1.06) / 1000) * 1000;

      const scatterData = validPairs.map(c => {
        const isHigher = c.val2 > c.val1;
        const isLower = c.val2 < c.val1;
        const color = isHigher ? '#10b981' : isLower ? '#f43f5e' : '#64748b';

        return {
          value: [c.val1, c.val2],
          itemStyle: {
            color: color,
            borderColor: isDarkMode ? '#18181b' : '#ffffff',
            borderWidth: 1.5,
            shadowBlur: 4,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          },
          raw: c
        };
      });

      return {
        tooltip: {
          trigger: 'item',
          backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
          borderColor: isDarkMode ? '#3f3f46' : '#e4e4e7',
          textStyle: { color: isDarkMode ? '#fafafa' : '#09090b', fontFamily: 'JetBrains Mono' },
          formatter: (params) => {
            const raw = params.data.raw;
            const diffColor = raw.deltaBRL >= 0 ? '#10b981' : '#f43f5e';
            return `
              <div class="p-1">
                <div class="font-bold font-sans text-sm pb-1 mb-1 border-b border-zinc-200 dark:border-zinc-700">
                  Referência: <span class="font-mono text-blue-500">${raw.key}</span> (Classe ${raw.classe} • Nível ${raw.nivel})
                </div>
                <div class="text-xs py-0.5">
                  <span class="font-sans text-zinc-400">${c1Obj?.orgao}:</span> 
                  <strong class="font-mono text-zinc-900 dark:text-zinc-100">${formatBRL(raw.val1)}</strong>
                </div>
                <div class="text-xs py-0.5">
                  <span class="font-sans text-zinc-400">${c2Obj?.orgao}:</span> 
                  <strong class="font-mono text-zinc-900 dark:text-zinc-100">${formatBRL(raw.val2)}</strong>
                </div>
                <div class="mt-1 pt-1 border-t border-zinc-200 dark:border-zinc-700 text-xs font-sans">
                  Diferença: <strong style="color: ${diffColor}; font-family: JetBrains Mono;">${formatDeltaBRL(raw.deltaBRL)} (${formatPercent(raw.deltaPct)})</strong>
                </div>
              </div>
            `;
          }
        },
        grid: {
          left: 88,
          right: 36,
          bottom: 52,
          top: 28,
          containLabel: false
        },
        xAxis: {
          type: 'value',
          name: `${c1Obj?.orgao} (R$)`,
          nameLocation: 'middle',
          nameGap: 32,
          nameTextStyle: { color: textColor, fontSize: 12, fontWeight: 600, fontFamily: 'DM Sans' },
          min: minVal,
          max: maxVal,
          axisLabel: {
            color: textColor,
            fontFamily: 'JetBrains Mono',
            fontSize: 11,
            formatter: (v) => `R$ ${(v / 1000).toFixed(0)}k`
          },
          splitLine: { lineStyle: { color: splitLineColor } }
        },
        yAxis: {
          type: 'value',
          name: `${c2Obj?.orgao} (R$)`,
          nameLocation: 'middle',
          nameGap: 68,
          nameTextStyle: { color: textColor, fontSize: 12, fontWeight: 600, fontFamily: 'DM Sans' },
          min: minVal,
          max: maxVal,
          axisLabel: {
            color: textColor,
            fontFamily: 'JetBrains Mono',
            fontSize: 11,
            formatter: (v) => `R$ ${(v / 1000).toFixed(0)}k`
          },
          splitLine: { lineStyle: { color: splitLineColor } }
        },
        series: [
          {
            type: 'scatter',
            symbolSize: 12,
            data: scatterData,
            markLine: {
              silent: true,
              symbol: 'none',
              lineStyle: {
                color: isDarkMode ? '#3b82f6' : '#2563eb',
                type: 'dashed',
                width: 2,
                opacity: 0.7
              },
              data: [
                [
                  { coord: [minVal, minVal] },
                  { coord: [maxVal, maxVal] }
                ]
              ],
              label: {
                formatter: 'Linha de Isonomia (45°)',
                position: 'insideEndTop',
                color: isDarkMode ? '#93c5fd' : '#1d4ed8',
                fontSize: 10,
                fontFamily: 'DM Sans'
              }
            }
          }
        ]
      };
    } else {
      // Modo Delta (X = Referência, Y = Diferença em R$)
      const xLabels = validPairs.map(c => c.key);
      const deltaData = validPairs.map(c => ({
        value: c.deltaBRL,
        itemStyle: {
          color: c.deltaBRL >= 0 ? '#10b981' : '#f43f5e',
          borderColor: isDarkMode ? '#18181b' : '#ffffff',
          borderWidth: 1.5
        },
        raw: c
      }));

      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
          borderColor: isDarkMode ? '#3f3f46' : '#e4e4e7',
          textStyle: { color: isDarkMode ? '#fafafa' : '#09090b', fontFamily: 'JetBrains Mono' },
          formatter: (params) => {
            const p = params[0];
            const raw = p.data.raw;
            const diffColor = raw.deltaBRL >= 0 ? '#10b981' : '#f43f5e';
            return `
              <div class="p-1">
                <div class="font-bold font-sans text-sm pb-1 mb-1 border-b border-zinc-200 dark:border-zinc-700">
                  Step: <span class="font-mono text-blue-500">${raw.key}</span>
                </div>
                <div class="text-xs py-0.5">
                  <span class="font-sans text-zinc-400">${c1Obj?.orgao}:</span> <strong>${formatBRL(raw.val1)}</strong>
                </div>
                <div class="text-xs py-0.5">
                  <span class="font-sans text-zinc-400">${c2Obj?.orgao}:</span> <strong>${formatBRL(raw.val2)}</strong>
                </div>
                <div class="mt-1 pt-1 border-t border-zinc-200 dark:border-zinc-700 text-xs font-sans">
                  Diferença: <strong style="color: ${diffColor}; font-family: JetBrains Mono;">${formatDeltaBRL(raw.deltaBRL)} (${formatPercent(raw.deltaPct)})</strong>
                </div>
              </div>
            `;
          }
        },
        grid: {
          left: '4%',
          right: '4%',
          bottom: '8%',
          top: '8%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: xLabels,
          axisLabel: {
            color: textColor,
            fontFamily: 'JetBrains Mono',
            fontSize: 10,
            interval: 0,
            rotate: validPairs.length > 20 ? 45 : 0
          },
          axisLine: { lineStyle: { color: isDarkMode ? '#3f3f46' : '#e4e4e7' } }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            color: textColor,
            fontFamily: 'JetBrains Mono',
            fontSize: 11,
            formatter: (v) => `${formatDeltaBRL(v)}`
          },
          splitLine: { lineStyle: { color: splitLineColor } }
        },
        series: [
          {
            type: 'scatter',
            symbolSize: 10,
            data: deltaData,
            markLine: {
              silent: true,
              data: [{ yAxis: 0 }],
              lineStyle: { color: isDarkMode ? '#71717a' : '#a1a1aa', type: 'dashed' }
            }
          }
        ]
      };
    }
  }, [comparisons, scatterMode, c1Obj, c2Obj, isDarkMode]);

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

          <div className="flex items-center justify-center sm:pt-5">
            <button
              type="button"
              onClick={() => {
                setCargo1(cargo2);
                setCargo2(cargo1);
              }}
              title="Inverter Cargo 1 e Cargo 2"
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
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
        <div className="overflow-x-auto max-h-[420px]">
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
                    <td className="py-2 px-3 text-right">
                      {hasBoth ? (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isPositive
                            ? 'bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                            : isNegative
                              ? 'bg-rose-100/80 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}>
                          {formatPercent(c.deltaPct)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-2 px-3">
                      {hasBoth ? (
                        <div className="relative w-full bg-zinc-200/80 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden flex items-center">
                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-400 dark:bg-zinc-600 z-10" />
                          {isPositive ? (
                            <div
                              className="h-full bg-emerald-500 rounded-r-full"
                              style={{
                                marginLeft: '50%',
                                width: `${Math.min(50, Math.abs(pctClamped))}%`
                              }}
                            />
                          ) : isNegative ? (
                            <div
                              className="h-full bg-rose-500 rounded-l-full"
                              style={{
                                marginLeft: `${50 - Math.min(50, Math.abs(pctClamped))}%`,
                                width: `${Math.min(50, Math.abs(pctClamped))}%`
                              }}
                            />
                          ) : null}
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

      {/* NOVO: Gráfico de Dispersão Responsivo aos Filtros */}
      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
              <ScatterIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                Gráfico de Dispersão Salarial
                <span className="text-[11px] font-normal text-zinc-400">
                  ({filterClasse === 'ALL' ? 'Todas as Classes' : `Classe ${filterClasse}`})
                </span>
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {scatterMode === 'parity' 
                  ? 'Dispersão de paridade: pontos na linha tracejada representam isonomia salarial exata'
                  : 'Dispersão de delta em R$ ao longo das referências da carreira'
                }
              </p>
            </div>
          </div>

          {/* Alternador do Modo de Dispersão */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setScatterMode('parity')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                scatterMode === 'parity'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Paridade (X vs Y)
            </button>
            <button
              onClick={() => setScatterMode('delta')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                scatterMode === 'delta'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Delta (R$) por Step
            </button>
          </div>
        </div>

        {/* Legenda do Gráfico de Dispersão */}
        {scatterMode === 'parity' && (
          <div className="flex flex-wrap items-center justify-end gap-4 text-xs text-zinc-500 dark:text-zinc-400 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>{c2Obj?.orgao} maior</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>{c1Obj?.orgao} maior</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 border-b-2 border-dashed border-blue-500"></span>
              <span>Linha de 45° (Isonomia)</span>
            </div>
          </div>
        )}

        {/* Componente ECharts */}
        <div className="w-full h-[360px] bg-zinc-50/40 dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800 p-2">
          <ReactECharts
            option={scatterOption}
            style={{ height: '100%', width: '100%' }}
            notMerge={true}
            lazyUpdate={true}
          />
        </div>
      </div>

    </div>
  );
}
