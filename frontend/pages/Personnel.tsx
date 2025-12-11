import React, { useState } from 'react';
import { MOCK_PERSONNEL } from '../constants';
import { PersonnelStatus } from '../types';
import { ShieldCheck, Calendar, Clock, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { notify } from '../components/Layout';

export const PersonnelPage = () => {
  const [personnel] = useState(MOCK_PERSONNEL);
  const [page, setPage] = useState(0);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(personnel.length / itemsPerPage);
  const paginatedPersonnel = personnel.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  const getStatusColor = (status: PersonnelStatus) => {
      switch(status) {
          case PersonnelStatus.READY: return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
          case PersonnelStatus.REST: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
          case PersonnelStatus.TRAINING: return 'text-coe-accent bg-coe-accent/10 border-coe-accent/20';
          default: return 'text-slate-400';
      }
  };

  const handleExport = () => {
      notify("Gerando arquivo CSV do contingente...", "info");
      setTimeout(() => notify("Download iniciado: contingente_coe.csv", "success"), 1500);
  };

  const handleAutoSchedule = () => {
      notify("Calculando escala otimizada...", "info");
      setTimeout(() => notify("Escala automática gerada e salva.", "success"), 2000);
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white">Contingente Operacional</h2>
                <p className="text-slate-400 text-sm">Gestão de escala e disponibilidade da base.</p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={handleExport}
                    className="px-4 py-2 bg-coe-800 hover:bg-coe-700 border border-coe-700 rounded-lg text-slate-300 text-sm flex items-center gap-2 transition-colors"
                >
                    <Download size={16} /> Exportar
                </button>
                <button 
                    onClick={handleAutoSchedule}
                    className="px-4 py-2 bg-coe-accent hover:bg-coe-accent-hover rounded-lg text-white text-sm font-bold transition-colors shadow-lg shadow-coe-accent/20"
                >
                    Gerar Escala Automática
                </button>
            </div>
        </div>

        <div className="bg-coe-800 border border-coe-700 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-coe-900 border-b border-coe-700 text-slate-400 text-xs uppercase tracking-wider">
                            <th className="p-4 font-semibold">ID</th>
                            <th className="p-4 font-semibold">Nome / Função</th>
                            <th className="p-4 font-semibold">Base</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold">Saúde</th>
                            <th className="p-4 font-semibold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-coe-700">
                        {paginatedPersonnel.map(p => (
                            <tr key={p.id} className="hover:bg-coe-700/30 transition-colors">
                                <td className="p-4 text-sm font-mono text-slate-500">{p.id}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-coe-700 flex items-center justify-center font-bold text-xs text-slate-300 border border-coe-600">
                                            {p.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-200">{p.name}</div>
                                            <div className="text-xs text-slate-500">{p.role}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-slate-400">{p.base}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(p.status)}`}>
                                        {p.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <ShieldCheck size={14} className="text-emerald-500" />
                                        {p.lastHealthCheck}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => notify(`Visualizando detalhes de ${p.name}`, "info")}
                                        className="text-coe-accent hover:text-white text-sm font-medium underline decoration-coe-accent/30 hover:decoration-white"
                                    >
                                        Detalhes
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="p-4 border-t border-coe-700 bg-coe-900/50 flex justify-between items-center text-sm text-slate-400">
                <span>Mostrando {paginatedPersonnel.length} de {personnel.length} bombeiros</span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-3 py-1 rounded border border-coe-700 hover:bg-coe-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button 
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-3 py-1 rounded border border-coe-700 hover:bg-coe-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};