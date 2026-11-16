import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
import RankingChart from './components/RankingChart';
import ProgressionChart from './components/ProgressionChart';
import SideBySideCompare from './components/SideBySideCompare';
import SalaryMatrixTable from './components/SalaryMatrixTable';
import ExportToolbar from './components/ExportToolbar';

import { computeSummaryMetrics, BASELINE_CARGO_DEFAULT } from './utils/salaryData';
import { formatBRL, formatPercent } from './utils/formatters';
import initialData from '../data/salarios_analistas_40h.json';

import { 
  BarChart3, 
  LineChart, 
  ArrowLeftRight, 
  Table as TableIcon, 
  Download,
  Info,
  Layers
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Visão Geral & Ranking', icon: BarChart3 },
  { id: 'progression', label: 'Curvas de Progressão', icon: LineChart },
  { id: 'comparator', label: 'Comparador Lado a Lado', icon: ArrowLeftRight },
  { id: 'matrix', label: 'Matriz Completa (4×12)', icon: TableIcon },
  { id: 'export', label: 'Exportar / Atualizar', icon: Download },
];

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [baselineCargo, setBaselineCargo] = useState(BASELINE_CARGO_DEFAULT);
  const [activeTab, setActiveTab] = useState('overview');

  // Aplicar classe dark no HTML
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const { cargos, registros, metadata } = initialData;

  const metrics = useMemo(() => {
    return computeSummaryMetrics(cargos, registros);
  }, [cargos, registros]);

  // Tabela síntese executiva das 10 carreiras para a aba de Visão Geral
  const overviewRows = useMemo(() => {
    const baseRecA1 = registros.find(r => r.cargo === baselineCargo && r.classe === 'A' && r.nivel === 1);
    const basePiso = baseRecA1 ? baseRecA1.valor : 0;

    return [...cargos]
      .sort((a, b) => b.piso_inicial - a.piso_inicial)
      .map(c => {
        const cRegs = registros.filter(r => r.cargo === c.cargo);
        const maxNivel = cRegs.length > 0 ? Math.max(...cRegs.map(r => r.nivel)) : 12;
        const b1 = cRegs.find(r => r.classe === 'B' && r.nivel === 1)?.valor || 0;
        const c1 = cRegs.find(r => r.classe === 'C' && r.nivel === 1)?.valor || 0;
        const d1 = cRegs.find(r => r.classe === 'D' && r.nivel === 1)?.valor || 0;
        const deltaBasePct = basePiso > 0 ? ((c.piso_inicial / basePiso) - 1) * 100 : 0;
        return {
          ...c,
          maxNivel,
          b1,
          c1,
          d1,
          deltaBasePct,
          isBase: c.cargo === baselineCargo
        };
      });
  }, [cargos, registros, baselineCargo]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100">
      
      {/* Header Fixo */}
      <Header
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        baselineCargo={baselineCargo}
        setBaselineCargo={setBaselineCargo}
        cargos={cargos}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Banner Informativo Rápido */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-200/60 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-zinc-600 dark:text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0">
              <Info className="w-4 h-4" />
            </span>
            <div>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Painel independente de comparação salarial entre 10 carreiras de Analista (40 Horas):
              </span>{' '}
              Cargos do Executivo Estadual (MT). Cargo base ativo:{' '}
              <strong className="text-blue-600 dark:text-blue-400 font-mono">
                {cargos.find(c => c.cargo === baselineCargo)?.orgao || baselineCargo}
              </strong>.
            </div>
          </div>
          <div className="font-mono text-zinc-500 dark:text-zinc-400 shrink-0">
            10 cargos • 456 steps salariais
          </div>
        </div>

        {/* Métricas Principais (KPIs) */}
        <KpiCards
          metrics={metrics}
          baselineCargo={baselineCargo}
          cargos={cargos}
        />

        {/* Barra de Navegação por Abas */}
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px" aria-label="Abas">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                    isActive
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold'
                      : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Conteúdo da Aba Ativa */}
        <div className="pt-2">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <RankingChart
                cargos={cargos}
                registros={registros}
                baselineCargo={baselineCargo}
                isDarkMode={isDarkMode}
              />

              {/* Quadro Síntese das 10 Carreiras */}
              <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50">
                      Quadro Síntese das 10 Carreiras de Analista (40H)
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Resumo comparativo do piso de cada classe, teto final, quantidade de níveis e diferença em relação à base
                    </p>
                  </div>
                </div>

                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                          <th className="py-3 px-3">Órgão</th>
                          <th className="py-3 px-3">Cargo Oficial</th>
                          <th className="py-3 px-3 text-center">Níveis</th>
                          <th className="py-3 px-3 text-right">Início Classe A</th>
                          <th className="py-3 px-3 text-right">Início Classe B</th>
                          <th className="py-3 px-3 text-right">Início Classe C</th>
                          <th className="py-3 px-3 text-right">Início Classe D</th>
                          <th className="py-3 px-3 text-right">Teto Final</th>
                          <th className="py-3 px-3 text-right">Amplitude</th>
                          <th className="py-3 px-3 text-right">vs Base (Piso)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-mono">
                        {overviewRows.map((row) => (
                          <tr
                            key={row.cargo}
                            className={`transition-colors ${
                              row.isBase
                                ? 'bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-950/50'
                                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-sans font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>{row.orgao}</span>
                                {row.isBase && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-600 text-white uppercase">
                                    Base
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400 text-[11px] whitespace-nowrap">
                              {row.cargo}
                            </td>
                            <td className="py-2.5 px-3 text-center text-zinc-600 dark:text-zinc-400">
                              {row.maxNivel}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-zinc-900 dark:text-zinc-100">
                              {formatBRL(row.piso_inicial)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-zinc-700 dark:text-zinc-300">
                              {formatBRL(row.b1)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-zinc-700 dark:text-zinc-300">
                              {formatBRL(row.c1)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-zinc-700 dark:text-zinc-300">
                              {formatBRL(row.d1)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-purple-600 dark:text-purple-400">
                              {formatBRL(row.teto_final)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-blue-600 dark:text-blue-400 font-semibold">
                              +{row.amplitude_salarial_pct}%
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {row.isBase ? (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-sans font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                  Referência
                                </span>
                              ) : (
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  row.deltaBasePct > 0.01
                                    ? 'bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                    : row.deltaBasePct < -0.01
                                      ? 'bg-rose-100/80 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                }`}>
                                  {formatPercent(row.deltaBasePct)}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'progression' && (
            <div className="space-y-6">
              <ProgressionChart
                cargos={cargos}
                registros={registros}
                baselineCargo={baselineCargo}
                isDarkMode={isDarkMode}
              />

              {/* Resumo de Saltos entre Classes */}
              {metrics?.classProgressionGains && (
                <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                        Percentuais de Salto Vertical entre Classes (Nível 1)
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Ganho percentual ao progredir de Classe A → B, B → C, C → D e acumulado A → D
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {metrics.classProgressionGains.map((g) => {
                      const isBase = g.cargo === baselineCargo;
                      return (
                        <div
                          key={g.cargo}
                          className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                            isBase
                              ? 'border-blue-300 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20'
                              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40'
                          }`}
                        >
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate flex items-center justify-between gap-1">
                            <span className="truncate">{g.orgao}</span>
                            {isBase && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white uppercase shrink-0">
                                Base
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 font-mono text-[11px]">
                            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                              <span>Classe A → B:</span>
                              <strong className="text-emerald-600 dark:text-emerald-400">{formatPercent(g.gainAB)}</strong>
                            </div>
                            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                              <span>Classe B → C:</span>
                              <strong className="text-emerald-600 dark:text-emerald-400">{formatPercent(g.gainBC)}</strong>
                            </div>
                            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                              <span>Classe C → D:</span>
                              <strong className="text-emerald-600 dark:text-emerald-400">{formatPercent(g.gainCD)}</strong>
                            </div>
                            <div className="pt-1 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-zinc-900 dark:text-zinc-100">
                              <span className="font-sans font-semibold">Total A → D:</span>
                              <strong className="text-blue-600 dark:text-blue-400">{formatPercent(g.gainTotalAD)}</strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comparator' && (
            <SideBySideCompare
              cargos={cargos}
              registros={registros}
              baselineCargo={baselineCargo}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'matrix' && (
            <SalaryMatrixTable
              cargos={cargos}
              registros={registros}
              baselineCargo={baselineCargo}
            />
          )}

          {activeTab === 'export' && (
            <ExportToolbar
              metadata={metadata}
              dataset={initialData}
            />
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] py-4 mt-8 transition-colors">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <div>
            Painel independente de análise salarial dos servidores de MT • Dados públicos: Portal do Servidor (SEPLAG MT)
          </div>
          <div className="flex items-center gap-3">
            <span>Vigência: 2026</span>
            <span>•</span>
            <span>Jornada: 40H Semanal</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
