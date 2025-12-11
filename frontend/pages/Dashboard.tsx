import React, { useState, useEffect } from 'react';
import { MOCK_INCIDENTS, MOCK_VEHICLES } from '../constants';
import { VehicleStatus, IncidentStatus } from '../types';
import { TacticalMap } from '../components/TacticalMap';
import { generateSituationReport } from '../services/geminiService';
import { Activity, Truck, Users, AlertTriangle, RefreshCw, Radio } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { notify } from '../components/Layout';

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, iconBg }: any) => (
  <div className="bg-coe-800 border border-coe-700 rounded-xl p-5 flex items-start justify-between hover:border-coe-accent/50 transition-all shadow-lg group">
    <div>
      <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-white">{value}</h3>
      {subtext && <p className="text-xs text-slate-500 mt-2">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${iconBg} group-hover:scale-110 transition-transform`}>
      <Icon className={colorClass} size={24} />
    </div>
  </div>
);

export const Dashboard = () => {
  const [vehicles] = useState(MOCK_VEHICLES);
  const [incidents] = useState(MOCK_INCIDENTS);
  const [aiReport, setAiReport] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [mapMode, setMapMode] = useState<'vector' | 'satellite'>('vector');
  const [statsData, setStatsData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStatsData(data))
      .catch(err => console.error("Error fetching stats:", err));
  }, []);

  const availableVehicles = vehicles.filter(v => v.status === VehicleStatus.AVAILABLE).length;
  const activeIncidents = incidents.filter(i => i.status !== IncidentStatus.RESOLVED && i.status !== IncidentStatus.CLOSED).length;
  
  const handleGenerateReport = async () => {
    setLoadingAi(true);
    notify("Solicitando análise à IA...", "info");
    const report = await generateSituationReport(incidents, vehicles);
    setAiReport(report);
    setLoadingAi(false);
    notify("Relatório SITREP gerado com sucesso.", "success");
  };

  const toggleMap = (mode: 'vector' | 'satellite') => {
    setMapMode(mode);
    notify(`Modo de mapa alterado para: ${mode === 'vector' ? 'Vetorial' : 'Satélite'}`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Viaturas Totais" 
          value={vehicles.length} 
          subtext={`${availableVehicles} Disponíveis`} 
          icon={Truck} 
          colorClass="text-coe-accent"
          iconBg="bg-coe-accent/10"
        />
        <StatCard 
          title="Incidentes Ativos" 
          value={activeIncidents} 
          subtext="2 Críticos" 
          icon={AlertTriangle} 
          colorClass="text-white" 
          iconBg="bg-coe-alert"
        />
        <StatCard 
          title="Contingente Base" 
          value="112" 
          subtext="98% Operacional" 
          icon={Users} 
          colorClass="text-emerald-400"
          iconBg="bg-emerald-400/10"
        />
        <StatCard 
          title="Tempo Resposta" 
          value="4m 12s" 
          subtext="Média últimas 24h" 
          icon={Activity} 
          colorClass="text-orange-400" 
          iconBg="bg-orange-400/10"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map Section */}
        {/* Right Panel: Feed & AI (Now taking full width of grid) */}
        <div className="lg:col-span-3 space-y-6">

          {/* Stats Preview (Replaces Camera) */}
          <div className="bg-coe-800 border border-coe-700 rounded-xl p-6 relative overflow-hidden group shadow-lg">
             <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-white flex items-center gap-2">
                   <Activity size={20} className="text-coe-accent" />
                   Atividade Recente
                 </h3>
                 <span className="text-xs text-slate-400 bg-coe-900 px-2 py-1 rounded border border-coe-700">Últimas 24h</span>
             </div>
             
             <div className="h-64 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={statsData?.activityData || []}>
                        <defs>
                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                             contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="fires" stroke="#ef4444" fillOpacity={1} fill="url(#colorVal)" />
                    </AreaChart>
                 </ResponsiveContainer>
             </div>
          </div>
          
          {/* AI Assistant */}
          <div className="bg-coe-800 border border-coe-700 rounded-xl p-5 relative overflow-hidden">
            {/* Red accent for firefighter theme */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-coe-accent/10 rounded-bl-full pointer-events-none"></div>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-coe-accent">⚡</span> COE Inteligência
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Gere relatórios de situação em tempo real baseados nos dados operacionais.
            </p>
            
            {aiReport ? (
              <div className="bg-coe-900/50 p-3 rounded border border-coe-700 text-sm text-slate-300 mb-4 max-h-40 overflow-y-auto">
                {aiReport}
              </div>
            ) : null}

            <button 
              onClick={handleGenerateReport}
              disabled={loadingAi}
              className="w-full py-2 bg-coe-accent hover:bg-coe-accent-hover text-white rounded-lg font-medium transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingAi ? <RefreshCw className="animate-spin" size={16} /> : "Gerar SITREP"}
            </button>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-coe-800 border border-coe-700 rounded-xl p-0 overflow-hidden">
            <div className="p-4 border-b border-coe-700 bg-coe-800/50">
               <h3 className="font-bold text-white">Últimos Alertas</h3>
            </div>
            <div className="max-h-[350px] overflow-y-auto">
              {incidents.map(inc => (
                <div key={inc.id} className="p-4 border-b border-coe-700 last:border-0 hover:bg-coe-700/30 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${inc.priority === 'Crítica' ? 'bg-coe-alert/20 text-coe-alert' : 'bg-coe-600/30 text-slate-300'}`}>
                      {inc.priority}
                    </span>
                    <span className="text-xs text-slate-500">{new Date(inc.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200 group-hover:text-coe-accent transition-colors">{inc.type}</h4>
                  <p className="text-xs text-slate-400 truncate">{inc.address}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};