import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { formatBRL, formatPercent } from '../utils/formatters';
import { LineChart, Layers, Eye, EyeOff, SlidersHorizontal } from 'lucide-react';

const CLASSES = [
  { id: 'A', label: 'Classe A' },
  { id: 'B', label: 'Classe B' },
  { id: 'C', label: 'Classe C' },
  { id: 'D', label: 'Classe D' },
  { id: 'ALL', label: 'Trajetória Contínua' }
];

const VIEW_MODES = [
  { id: 'levels', label: 'Evolução por Níveis (1 a 12)' },
  { id: 'class_initial', label: 'Valor Inicial de cada Classe' },
  { id: 'class_final', label: 'Valor Final de cada Classe' }
];

// Paleta de cores para os 10 cargos
const CARGO_COLORS = [
  '#2563eb', // Azul (Base)
  '#10b981', // Esmeralda
  '#f59e0b', // Âmbar
  '#8b5cf6', // Violeta
  '#ec4899', // Rosa
  '#06b6d4', // Ciano
  '#14b8a6', // Teal
  '#f97316', // Laranja
  '#6366f1', // Indigo
  '#64748b'  // Slate
];

export default function ProgressionChart({
  cargos = [],
  registros = [],
  baselineCargo,
  isDarkMode
}) {
  const [viewMode, setViewMode] = useState('levels'); // 'levels' | 'class_initial' | 'class_final'
  const [selectedClasse, setSelectedClasse] = useState('A');
  const [visibleCargos, setVisibleCargos] = useState(() => {
    return new Set(cargos.map(c => c.cargo));
  });

  const toggleCargo = (cargoName) => {
    setVisibleCargos(prev => {
      const next = new Set(prev);
      if (next.has(cargoName)) {
        if (next.size > 1) next.delete(cargoName);
      } else {
        next.add(cargoName);
      }
      return next;
    });
  };

  const showAll = () => setVisibleCargos(new Set(cargos.map(c => c.cargo)));
  const showOnlyBaseAndTop = () => {
    const topCargo = cargos.reduce((prev, curr) => (curr.piso_inicial > prev.piso_inicial ? curr : prev), cargos[0]);
    const bottomCargo = cargos.reduce((prev, curr) => (curr.piso_inicial < prev.piso_inicial ? curr : prev), cargos[0]);
    setVisibleCargos(new Set([baselineCargo, topCargo?.cargo, bottomCargo?.cargo].filter(Boolean)));
  };

  // Preparar os dados para o gráfico
  const chartOption = useMemo(() => {
    const textColor = isDarkMode ? '#d4d4d8' : '#27272a';
    const splitLineColor = isDarkMode ? '#27272a' : '#f4f4f5';

    let xAxisData = [];
    if (viewMode === 'class_initial') {
      xAxisData = ['Classe A (Inicial)', 'Classe B (Inicial)', 'Classe C (Inicial)', 'Classe D (Inicial)'];
    } else if (viewMode === 'class_final') {
      xAxisData = ['Classe A (Final)', 'Classe B (Final)', 'Classe C (Final)', 'Classe D (Final)'];
    } else if (selectedClasse === 'ALL') {
      xAxisData = [
        'A-1', 'A-3', 'A-6', 'A-9', 'A-12',
        'B-1', 'B-3', 'B-6', 'B-9', 'B-12',
        'C-1', 'C-3', 'C-6', 'C-9', 'C-12',
        'D-1', 'D-3', 'D-6', 'D-9', 'D-12'
      ];
    } else {
      xAxisData = Array.from({ length: 12 }, (_, i) => `Nível ${i + 1}`);
    }

    const series = cargos.map((c, idx) => {
      const isVisible = visibleCargos.has(c.cargo);
      const isBase = c.cargo === baselineCargo;
      const color = isBase ? '#2563eb' : CARGO_COLORS[(idx + 1) % CARGO_COLORS.length];

      let dataPoints = [];

      if (viewMode === 'class_initial') {
        // Nível 1 de cada classe
        const classes = ['A', 'B', 'C', 'D'];
        dataPoints = classes.map(cls => {
          const rec = registros.find(r => r.cargo === c.cargo && r.classe === cls && r.nivel === 1);
          return rec ? rec.valor : null;
        });
      } else if (viewMode === 'class_final') {
        // Último nível de cada classe
        const classes = ['A', 'B', 'C', 'D'];
        dataPoints = classes.map(cls => {
          const cRecords = registros.filter(r => r.cargo === c.cargo && r.classe === cls);
          if (!cRecords || cRecords.length === 0) return null;
          const maxRec = cRecords.reduce((prev, curr) => (curr.nivel > prev.nivel ? curr : prev), cRecords[0]);
          return maxRec ? maxRec.valor : null;
        });
      } else if (selectedClasse === 'ALL') {
        const cRecords = registros.filter(r => r.cargo === c.cargo);
        const map = new Map();
        cRecords.forEach(r => map.set(`${r.classe}-${r.nivel}`, r.valor));

        const keys = [
          'A-1', 'A-3', 'A-6', 'A-9', 'A-12',
          'B-1', 'B-3', 'B-6', 'B-9', 'B-12',
          'C-1', 'C-3', 'C-6', 'C-9', 'C-12',
          'D-1', 'D-3', 'D-6', 'D-9', 'D-12'
        ];
        dataPoints = keys.map(k => map.get(k) || null);
      } else {
        const cRecords = registros.filter(r => r.cargo === c.cargo && r.classe === selectedClasse);
        const map = new Map();
        cRecords.forEach(r => map.set(r.nivel, r.valor));
        dataPoints = Array.from({ length: 12 }, (_, i) => map.get(i + 1) || null);
      }

      return {
        name: c.orgao,
        type: 'line',
        data: isVisible ? dataPoints : [],
        smooth: 0.25,
        symbol: isBase ? 'circle' : 'circle',
        symbolSize: isBase ? 8 : 6,
        lineStyle: {
          width: isBase ? 3.5 : 2,
          color: color,
          type: isBase ? 'solid' : 'solid'
        },
        itemStyle: {
          color: color
        },
        z: isBase ? 10 : 2
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
        borderColor: isDarkMode ? '#3f3f46' : '#e4e4e7',
        textStyle: { color: isDarkMode ? '#fafafa' : '#09090b', fontFamily: 'JetBrains Mono' },
        formatter: (params) => {
          if (!params || params.length === 0) return '';
          const axisValue = params[0].axisValue;
          let html = `<div class="font-bold font-sans text-sm pb-1 mb-1 border-b border-zinc-200 dark:border-zinc-700">${axisValue}</div>`;
          
          const sorted = [...params].filter(p => p.value !== null && p.value !== undefined)
            .sort((a, b) => b.value - a.value);

          sorted.forEach(p => {
            const isBase = p.seriesName.includes('Área Meio');
            const fontBold = isBase ? 'font-bold' : '';
            html += `
              <div class="flex items-center justify-between gap-4 text-xs py-0.5">
                <span class="flex items-center gap-1.5 ${fontBold}">
                  <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${p.color}"></span>
                  <span class="font-sans">${p.seriesName}:</span>
                </span>
                <span class="font-mono ${fontBold}">${formatBRL(p.value)}</span>
              </div>
            `;
          });
          return html;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        top: '6%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLabel: {
          color: textColor,
          fontFamily: 'DM Sans',
          fontSize: 11
        },
        axisLine: { lineStyle: { color: isDarkMode ? '#3f3f46' : '#e4e4e7' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: textColor,
          fontFamily: 'JetBrains Mono',
          fontSize: 11,
          formatter: (v) => `R$ ${(v / 1000).toFixed(0)}k`
        },
        splitLine: { lineStyle: { color: splitLineColor } }
      },
      series
    };
  }, [cargos, registros, selectedClasse, viewMode, visibleCargos, baselineCargo, isDarkMode]);

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
      
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
            <LineChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50">
              Curvas de Progressão Salarial
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {viewMode === 'levels' 
                ? 'Evolução horizontal nos 12 níveis por classe'
                : viewMode === 'class_initial'
                  ? 'Comparação dos valores iniciais (Nível 1) ao ingressar em cada classe'
                  : 'Comparação dos valores finais (Teto) alcançados em cada classe'
              }
            </p>
          </div>
        </div>

        {/* Controles de Modo & Filtro de Classe */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          
          {/* Seletor de Modo de Visualização */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  viewMode === mode.id
                    ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {mode.id === 'levels' ? 'Níveis (1 a 12)' : mode.id === 'class_initial' ? 'Inicial da Classe' : 'Final da Classe'}
              </button>
            ))}
          </div>

          {/* Seletor de Classe (ativo apenas no modo Níveis) */}
          {viewMode === 'levels' && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-zinc-400 dark:text-zinc-500 mr-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
              </span>
              {CLASSES.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClasse(cls.id)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                    selectedClasse === cls.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {cls.label}
                </button>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Controles de Filtro de Cargos na Legenda */}
      <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Clique no órgão para exibir/ocultar no gráfico:
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={showAll}
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Eye className="w-3 h-3" /> Exibir Todos
          </button>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <button
            onClick={showOnlyBaseAndTop}
            className="flex items-center gap-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Base + Extremos
          </button>
        </div>
      </div>

      {/* Pills dos Cargos */}
      <div className="flex flex-wrap gap-1.5">
        {cargos.map((c, idx) => {
          const isVisible = visibleCargos.has(c.cargo);
          const isBase = c.cargo === baselineCargo;
          const color = isBase ? '#2563eb' : CARGO_COLORS[(idx + 1) % CARGO_COLORS.length];

          return (
            <button
              key={c.cargo}
              onClick={() => toggleCargo(c.cargo)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                isVisible
                  ? 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-900/40 text-zinc-400 border-transparent opacity-60'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: isVisible ? color : '#a1a1aa' }}
              />
              <span>{c.orgao}</span>
              {isBase && (
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
                  (Base)
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Gráfico ECharts */}
      <div className="mt-2 w-full h-[400px]">
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
