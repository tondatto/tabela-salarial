import React from 'react';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  TrendingUp, 
  Scale, 
  GraduationCap, 
  Award 
} from 'lucide-react';
import { formatBRL, formatPercent } from '../utils/formatters';

export default function KpiCards({ metrics, baselineCargo, cargos = [] }) {
  if (!metrics) return null;

  const baselineItem = cargos.find(c => c.cargo === baselineCargo);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Menor Piso Inicial */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
          <span>Menor Piso Inicial (A-1)</span>
          <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
            <ArrowDownRight className="w-4 h-4" />
          </span>
        </div>
        <div className="font-mono text-2xl font-bold text-zinc-950 dark:text-zinc-50">
          {formatBRL(metrics.minPiso.valor)}
        </div>
        <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 truncate flex items-center justify-between">
          <span className="font-medium truncate text-zinc-800 dark:text-zinc-200">
            {metrics.minPiso.orgao}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            Mínimo
          </span>
        </div>
      </div>

      {/* 2. Maior Piso Inicial */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
          <span>Maior Piso Inicial (A-1)</span>
          <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>
        <div className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          {formatBRL(metrics.maxPiso.valor)}
        </div>
        <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 truncate flex items-center justify-between">
          <span className="font-medium truncate text-zinc-800 dark:text-zinc-200">
            {metrics.maxPiso.orgao}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold">
            {formatPercent(metrics.dispersaoPisoPct)} vs menor
          </span>
        </div>
      </div>

      {/* 3. Dispersão e Média Estadual */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
          <span>Média Estadual (Piso A-1)</span>
          <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
            <Scale className="w-4 h-4" />
          </span>
        </div>
        <div className="font-mono text-2xl font-bold text-zinc-950 dark:text-zinc-50">
          {formatBRL(metrics.avgPiso)}
        </div>
        <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
          <span>Dispersão entre órgãos:</span>
          <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
            {formatPercent(metrics.dispersaoPisoPct, false)}
          </span>
        </div>
      </div>

      {/* 4. Maior Teto de Carreira (D-12) */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
          <span>Maior Teto Estadual (D-12)</span>
          <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/60">
            <Award className="w-4 h-4" />
          </span>
        </div>
        <div className="font-mono text-2xl font-bold text-purple-600 dark:text-purple-400">
          {formatBRL(metrics.maxTeto.valor)}
        </div>
        <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 truncate flex items-center justify-between">
          <span className="font-medium truncate text-zinc-800 dark:text-zinc-200">
            {metrics.maxTeto.orgao}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold">
            Teto Máximo
          </span>
        </div>
      </div>

    </div>
  );
}
