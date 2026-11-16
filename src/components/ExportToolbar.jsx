import React, { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, Copy, Check, Terminal, ExternalLink } from 'lucide-react';

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
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
      
      {/* Título & Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Exportação de Dados & Atualização
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Baixe a base de dados tratada ou atualize os dados com o scraper Python
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

      {/* Instruções do Scraper e Metadados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        
        {/* Metadados da Coleta */}
        <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-zinc-600 dark:text-zinc-400">
          <div className="font-semibold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
            Fonte Oficial dos Dados:
          </div>
          <div>Portal do Servidor (SEPLAG MT)</div>
          <div className="font-mono text-[11px] text-zinc-500 truncate">
            {metadata?.url || 'https://servicos.seplag.mt.gov.br/portalservidor/publico/tabela-salarial'}
          </div>
          <div className="pt-1 flex items-center justify-between text-[11px]">
            <span>Registros consolidados: <strong>{metadata?.total_registros || 456}</strong></span>
            <span>Cargos: <strong>{metadata?.total_cargos || 10}</strong></span>
          </div>
        </div>

        {/* Comando CLI de Atualização */}
        <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
          <div className="font-semibold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Para atualizar os dados a qualquer momento:
          </div>
          <p className="text-zinc-500 dark:text-zinc-400">
            Execute no terminal na raiz do projeto:
          </p>
          <div className="p-2 rounded bg-zinc-900 text-zinc-100 dark:bg-black font-mono text-[11px] flex items-center justify-between">
            <code>python3 scripts/scrape_salarios.py</code>
          </div>
        </div>

      </div>

    </div>
  );
}
