import React from 'react';
import { Sun, Moon, Building2, Clock, Calendar, CheckCircle2 } from 'lucide-react';

export default function Header({
  isDarkMode,
  setIsDarkMode,
  baselineCargo,
  setBaselineCargo,
  cargos = []
}) {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] sticky top-0 z-40 transition-colors shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Título & Badges */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                  Tabela Salarial MT
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Cargos de ANALISTA
                </span>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 40 Horas
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 flex flex-wrap items-center gap-x-2">
                <span>Governo do Estado de Mato Grosso — SEPLAG MT</span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="inline-flex items-center gap-1 font-mono text-zinc-600 dark:text-zinc-300">
                  <Calendar className="w-3.5 h-3.5" /> Vigência: 01/01/2026 - ATUAL
                </span>
              </p>
            </div>
          </div>

          {/* Controles: Baseline Cargo & Theme Toggle */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* Seletor de Cargo Base */}
            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl text-xs sm:text-sm">
              <span className="text-zinc-500 dark:text-zinc-400 whitespace-nowrap font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Base:
              </span>
              <select
                value={baselineCargo}
                onChange={(e) => setBaselineCargo(e.target.value)}
                className="bg-transparent font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer max-w-[220px] sm:max-w-[280px] truncate"
                title="Selecione o cargo de referência para comparar deltas (R$ e %)"
              >
                {cargos.map((c) => (
                  <option key={c.cargo} value={c.cargo} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                    {c.orgao} ({c.cargo.split(' ')[0]} {c.cargo.split(' ')[1] || ''})
                  </option>
                ))}
              </select>
            </div>

            {/* Alternador de Tema Claro / Escuro */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Alternar modo escuro"
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
