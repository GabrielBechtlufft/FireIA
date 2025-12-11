import React, { useEffect, useState } from 'react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Flame, Activity, PieChart as PieIcon, TrendingUp } from 'lucide-react';

export const Analytics = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const res = await fetch('/api/stats');
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error("Failed to fetch stats", e);
        }
    };
    fetchData();
  }, []);

  if (!data) return <div className="p-8 text-center text-slate-500">Carregando estatísticas...</div>;

  return (
    <div className="space-y-6 animate-fadeIn">
       <div className="flex items-center justify-between mb-6">
           <div>
               <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                   <Activity size={28} className="text-coe-accent" />
                   Estatísticas Operacionais
               </h1>
               <p className="text-slate-400">Análise de dados e métricas de desempenho</p>
           </div>
           
           <div className="flex gap-4">
               <div className="bg-coe-800 p-3 rounded-xl border border-coe-700 flex flex-col items-center min-w-[120px]">
                    <span className="text-xs text-slate-400 uppercase font-bold">Hoje</span>
                    <span className="text-2xl font-bold text-white flex items-center gap-2">
                        <Flame size={18} className="text-red-500" /> {data.dailyFireCount}
                    </span>
               </div>
               <div className="bg-coe-800 p-3 rounded-xl border border-coe-700 flex flex-col items-center min-w-[120px]">
                    <span className="text-xs text-slate-400 uppercase font-bold">Mês Atual</span>
                    <span className="text-2xl font-bold text-white flex items-center gap-2">
                        <TrendingUp size={18} className="text-emerald-500" /> {data.monthlyFireCount}
                    </span>
               </div>
           </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Activity Chart */}
           <div className="bg-coe-800 border border-coe-700 p-6 rounded-xl">
               <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                   <BarChart size={20} className="text-coe-accent" />
                   Atividade Diária (Incêndios)
               </h3>
               <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={data.activityData}>
                           <defs>
                               <linearGradient id="colorFires" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                   <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                               </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                           <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                           <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                           <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                                itemStyle={{ color: '#ef4444' }}
                           />
                           <Area type="monotone" dataKey="fires" stroke="#ef4444" fillOpacity={1} fill="url(#colorFires)" />
                       </AreaChart>
                   </ResponsiveContainer>
               </div>
           </div>

           {/* Status Pie Chart */}
           <div className="bg-coe-800 border border-coe-700 p-6 rounded-xl">
               <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                   <PieIcon size={20} className="text-coe-accent" />
                   Status de Ocorrências
               </h3>
               <div className="h-64 flex flex-col md:flex-row items-center justify-center gap-8">
                   <div className="h-full w-full md:w-1/2 min-h-[200px]">
                       <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                               <Pie
                                   data={data.statusBreakdown}
                                   cx="50%"
                                   cy="50%"
                                   innerRadius={60}
                                   outerRadius={80}
                                   paddingAngle={5}
                                   dataKey="value"
                               >
                                   {data.statusBreakdown.map((entry: any, index: number) => (
                                       <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                   ))}
                               </Pie>
                               <RechartsTooltip 
                                   contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                               />
                           </PieChart>
                       </ResponsiveContainer>
                   </div>
                   <div className="flex flex-col gap-3">
                        {data.statusBreakdown.map((item: any) => (
                            <div key={item.name} className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-slate-300">{item.name}</span>
                                <span className="text-white font-bold ml-auto">{item.value}</span>
                            </div>
                        ))}
                   </div>
               </div>
           </div>
       </div>
    </div>
  );
};
