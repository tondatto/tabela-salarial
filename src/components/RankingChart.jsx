import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { formatBRL, formatDeltaBRL, formatPercent } from '../utils/formatters';
import { BarChart3, Filter } from 'lucide-react';

const STAGES = [
  { id: 'A-1', label: 'Piso Inicial (A-1: Graduação)', classe: 'A', nivel: 1 },
  { id: 'B-1', label: 'Início Pós-Graduação (B-1)', classe: 'B', nivel: 1 },
  { id: 'C-1', label: 'Início Mestrado (C-1)', classe: 'C', nivel: 1 },
  { id: 'D-1', label: 'Início Doutorado (D-1)', classe: 'D', nivel: 1 },
  { id: 'TETO', label: 'Teto Final da Carreira (Último Nível)', isTeto: true }
];

export default function RankingChart({ 
  cargos = [], 
  registros = [], 
  baselineCargo, 
  isDarkMode 
}) {
  const [selectedStage, setSelectedStage] = useState('A-1');

  const rankingData = useMemo(() => {
    const stage = STAGES.find(s => s.id === selectedStage);
    if (!stage) return [];

    let items = [];

    if (stage.isTeto) {
      items = cargos.map(c => {
        // Encontrar o último registro do cargo (maior classe/nível)
        const cRecords = registros.filter(r => r.cargo === c.cargo);
        const maxRec = cRecords.reduce((prev, curr) => (curr.valor > prev.valor ? curr : prev), cRecords[0]);
        return {
          cargo: c.cargo,
          orgao: c.orgao,
          valor: maxRec ? maxRec.valor : c.teto_final,
          referencia: maxRec ? maxRec.referencia : 'Teto'
        };
      });
    } else {
      items = cargos.map(c => {
        const rec = registros.find(
          r => r.cargo === c.cargo && r.classe === stage.classe && r.nivel === stage.nivel
        );
        return {
          cargo: c.cargo,
          orgao: c.orgao,
          valor: rec ? rec.valor : 0,
          referencia: rec ? rec.referencia : `${stage.classe}-${stage.nivel}`
        };
      });
    }

    // Ordenar do menor para o maior (para o ECharts renderizar o maior no topo)
    items.sort((a, b) => a.valor - b.valor);

    // Calcular delta em relação ao cargo base
    const baseItem = items.find(i => i.cargo === baselineCargo);
    const baseVal = baseItem ? baseItem.valor : null;

    return items.map(item => {
      const deltaBRL = baseVal !== null ? item.valor - baseVal : 0;
      const deltaPct = baseVal !== null && baseVal > 0 ? ((item.valor / baseVal) - 1) * 100 : 0;
      const isBase = item.cargo === baselineCargo;
      return {
        ...item,
        deltaBRL,
        deltaPct,
        isBase
      };
    });
  }, [cargos, registros, selectedStage, baselineCargo]);

  // Configuração do ECharts
  const chartOption = useMemo(() => {
    const textColor = isDarkMode ? '#d4d4d8' : '#27272a';
    const splitLineColor = isDarkMode ? '#27272a' : '#f4f4f5';

    const yAxisData = rankingData.map(d => `${d.orgao}`);
    const seriesData = rankingData.map(d => ({
      value: d.valor,
      itemStyle: {
        color: d.isBase 
          ? '#2563eb' // Azul royal para o cargo base
          : d.deltaBRL > 0 
            ? '#10b981' // Verde esmeralda se maior que a base
            : d.deltaBRL < 0
              ? '#f43f5e' // Rosa/vermelho se menor que a base
              : '#64748b',
        borderRadius: [0, 6, 6, 0]
      },
      raw: d
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
          const isBase = raw.isBase;
          let diffHtml = '';
          if (isBase) {
            diffHtml = `<div class="mt-1 text-xs text-blue-500 font-semibold font-sans">★ CARGO DE REFERÊNCIA (BASE)</div>`;
          } else {
            const colorClass = raw.deltaBRL >= 0 ? 'color: #10b981;' : 'color: #f43f5e;';
            diffHtml = `
              <div class="mt-1.5 pt-1.5 border-t border-zinc-200 dark:border-zinc-700 text-xs font-sans">
                Diferença vs Base: <strong style="${colorClass}">${formatDeltaBRL(raw.deltaBRL)} (${formatPercent(raw.deltaPct)})</strong>
              </div>
            `;
          }
          return `
            <div class="p-1">
              <div class="font-bold font-sans text-sm">${raw.orgao}</div>
              <div class="text-xs text-zinc-400 font-sans mb-1">${raw.cargo}</div>
              <div class="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">${formatBRL(raw.valor)}</div>
              <div class="text-[11px] text-zinc-500 font-mono">Ref: ${raw.referencia}</div>
              ${diffHtml}
            </div>
          `;
        }
      },
      grid: {
        left: '3%',
        right: '12%',
        bottom: '3%',
        top: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: textColor,
          fontFamily: 'JetBrains Mono',
          fontSize: 11,
          formatter: (v) => `R$ ${(v / 1000).toFixed(0)}k`
        },
        splitLine: { lineStyle: { color: splitLineColor } }
      },
      yAxis: {
        type: 'category',
        data: yAxisData,
        axisLabel: {
          color: textColor,
          fontSize: 12,
          fontWeight: 500
        },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: isDarkMode ? '#3f3f46' : '#e4e4e7' } }
      },
      series: [
        {
          type: 'bar',
          data: seriesData,
          barMaxWidth: 24,
          label: {
            show: true,
            position: 'right',
            color: textColor,
            fontFamily: 'JetBrains Mono',
            fontSize: 11,
            fontWeight: 600,
            formatter: (p) => formatBRL(p.value)
          }
        }
      ]
    };
  }, [rankingData, isDarkMode]);

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
      
      {/* Cabeçalho do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50">
              Ranking Salarial dos Analistas
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Comparação ordenada por fase de carreira e discrepância contra a base
            </p>
          </div>
        </div>

        {/* Seletor de Fase */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-zinc-400 dark:text-zinc-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Fase:
          </span>
          {STAGES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStage(s.id)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                selectedStage === s.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {s.id === 'A-1' ? 'Piso (A-1)' : s.id === 'B-1' ? 'Pós (B-1)' : s.id === 'C-1' ? 'Mestrado (C-1)' : s.id === 'D-1' ? 'Doutorado (D-1)' : 'Teto Final'}
            </button>
          ))}
        </div>
      </div>

      {/* Legenda de Cores */}
      <div className="flex items-center justify-end gap-4 text-xs mt-3 text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-blue-600"></span>
          <span>Cargo Base (Referência)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
          <span>Maior que a Base</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-rose-500"></span>
          <span>Menor que a Base</span>
        </div>
      </div>

      {/* Gráfico ECharts */}
      <div className="mt-2 w-full h-[380px]">
        <ReactECharts
          option={chartOption}
          style={{ height: '100%', width: '100%' }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>

    </div>
  );
}
