import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
import RankingChart from './components/RankingChart';
import ProgressionChart from './components/ProgressionChart';
import SideBySideCompare from './components/SideBySideCompare';
import SalaryMatrixTable from './components/SalaryMatrixTable';
import ExportToolbar from './components/ExportToolbar';

import { computeSummaryMetrics, BASELINE_CARGO_DEFAULT } from './utils/salaryData';
import initialData from '../data/salarios_analistas_40h.json';

import { 
  BarChart3, 
  LineChart, 
  ArrowLeftRight, 
  Table as TableIcon, 
  Download,
  Info
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
            <span className="p-1.5 rounded-lg bg-blue-600 text-white">
              <Info className="w-4 h-4" />
            </span>
            <div>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Comparativo de Isonomia Salarial entre 10 Carreiras de Analista (40 Horas):
              </span>{' '}
              Governo de Mato Grosso (SEPLAG MT). Cargo base ativo:{' '}
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
              <ProgressionChart
                cargos={cargos}
                registros={registros}
                baselineCargo={baselineCargo}
                isDarkMode={isDarkMode}
              />
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
              <RankingChart
                cargos={cargos}
                registros={registros}
                baselineCargo={baselineCargo}
                isDarkMode={isDarkMode}
              />
            </div>
          )}

          {activeTab === 'comparator' && (
            <SideBySideCompare
              cargos={cargos}
              registros={registros}
              baselineCargo={baselineCargo}
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
            Painel Analítico de Remuneração dos Servidores Públicos de Mato Grosso • Fonte: SEPLAG MT
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
