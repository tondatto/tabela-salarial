import React, { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, Copy, Check, Database } from 'lucide-react';

export default function ExportToolbar({ metadata, dataset }) {
  const [copied, setCopied] = useState(false);

  const downloadFile = (filename, content, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(dataset, null, 2);
    downloadFile('salarios_analistas_mt_40h.json', jsonStr, 'application/json');
  };

  const handleDownloadCSV = () => {
    if (!dataset || !dataset.registros) return;
    const headers = ["id", "orgao", "carreira", "cargo", "jornada", "referencia", "classe", "nivel", "valor", "data_inicio", "periodo"];
    const rows = dataset.registros.map(r => 
      headers.map(h => `"${r[h] !== undefined ? r[h] : ''}"`).join(';')
    );
    const csvContent = "\uFEFF" + [headers.join(';'), ...rows].join('\n');
    downloadFile('salarios_analistas_mt_40h.csv', csvContent, 'text/csv;charset=utf-8;');
  };

  const handleCopyClipboard = () => {
    if (!dataset || !dataset.cargos) return;
    let text = `TABELA COMPARATIVA DE SALÁRIOS - ANALISTAS 40H (GOVERNO DE MT)\n`;
    text += `Período: 01/01/2026 - ATUAL\n\n`;
    dataset.cargos.forEach(c => {
      text += `- ${c.orgao} (${c.cargo}): Piso Inicial R$ ${c.piso_inicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Teto R$ ${c.teto_final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    });
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-5">
      
      {/* Título & Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Exportação de Dados
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Baixe a base de dados tratada em formato CSV ou JSON para análises externas
          </p>
        </div>

        {/* Botões de Download */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Baixar CSV (Excel)
          </button>

          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white shadow-xs transition-colors"
          >
            <FileJson className="w-3.5 h-3.5" />
            Baixar JSON
          </button>

          <button
            onClick={handleCopyClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar Resumo'}
          </button>
        </div>
      </div>

      {/* Metadados da Base de Dados */}
      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-200/80 dark:border-zinc-800 pb-2.5">
          <div className="font-semibold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Informações sobre o Dataset Consolidado
          </div>
          <div className="text-[11px] font-mono text-zinc-500">
            Jornada: 40 Horas semanais • Vigência: 01/01/2026 - ATUAL
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60">
            <div className="text-zinc-400 text-[11px] mb-0.5">Total de Cargos Mapeados</div>
            <div className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100">
              {metadata?.total_cargos || 10} carreiras
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60">
            <div className="text-zinc-400 text-[11px] mb-0.5">Registros / Steps Salariais</div>
            <div className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100">
              {metadata?.total_registros || 456} linhas
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60">
            <div className="text-zinc-400 text-[11px] mb-0.5">Fonte Oficial dos Dados</div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
              Portal do Servidor (SEPLAG MT)
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
