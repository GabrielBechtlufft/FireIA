import React, { useState, useEffect } from 'react';
import { MOCK_VEHICLES } from '../constants';
import { Incident, IncidentPriority, IncidentStatus, Note } from '../types';
import { suggestResources } from '../services/geminiService';
import { fetchIncidents, createIncident, updateIncident, deleteIncident, addNote as apiAddNote } from '../services/api';
import { Filter, Search, Plus, MapPin, Ambulance, ChevronRight, MessageSquare, Send, CheckCircle, Trash2, Share2 } from 'lucide-react';
import { notify } from '../components/Layout';

export const Incidents = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'ACTIVE'>('ALL');
  const [newNote, setNewNote] = useState('');

  // 1. Fetch Real Data
  const loadData = async () => {
      try {
          const data = await fetchIncidents();
          setIncidents(data);
          
          // Update selected if exists
          if (selectedIncident) {
              const updated = data.find(i => i.id === selectedIncident.id);
              if (updated) setSelectedIncident(updated);
          }
      } catch (e) {
          console.error("Failed to load incidents", e);
      }
  };

  useEffect(() => {
      loadData();
      const interval = setInterval(loadData, 3000); // Poll every 3s
      return () => clearInterval(interval);
  }, []);

  // 2. WhatsApp Integration
  const handleShare = (inc: Incident) => {
      const text = `🚨 *ALERTA COE* 🚨\n\n*Tipo:* ${inc.type}\n*Prioridade:* ${inc.priority}\n*Status:* ${inc.status}\n*Local:* ${inc.address}\n\n📍 *Coords:* https://maps.google.com/?q=${inc.location.lat},${inc.location.lon}`;
      const url = `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  // 3. Delete Integration
  const handleDelete = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (!confirm("Tem certeza que deseja apagar este registro?")) return;
      
      await deleteIncident(id);
      notify("Registro apagado.", "success");
      if (selectedIncident?.id === id) setSelectedIncident(null);
      loadData();
  };

  // ... rest of logic updated to use API ...

  // Search Logic
  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = inc.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inc.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inc.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterMode === 'ALL' ? true : (inc.status !== IncidentStatus.RESOLVED && inc.status !== IncidentStatus.CLOSED);
    return matchesSearch && matchesFilter;
  });

  const handleSuggest = async (inc: Incident) => {
      notify("Consultando IA...", "info");
      setSuggestion("Analisando...");
      const text = await suggestResources(inc, MOCK_VEHICLES);
      setSuggestion(text);
  };

  const handleCreateIncident = async () => {
    try {
        const newInc = await createIncident({
            type: "Nova Ocorrência Manual",
            priority: IncidentPriority.MEDIUM,
            status: IncidentStatus.NEW,
            address: "Local Manual",
            description: "Criado pelo operador."
        });
        await loadData();
        setSelectedIncident(newInc);
        notify(`Ocorrência ${newInc.id} criada.`, "success");
    } catch (e) {
        notify("Erro ao criar ocorrência", "info");
    }
  };

  const handleDispatch = () => {
    if (!selectedIncident) return;
    
    // Update local state
    const updated = {
        ...selectedIncident,
        status: IncidentStatus.IN_PROGRESS,
        assignedVehicles: [...selectedIncident.assignedVehicles, "V-99 (Sim)"]
    };

    setIncidents(incidents.map(i => i.id === updated.id ? updated : i));
    setSelectedIncident(updated);
    notify("Recursos despachados para o local.", "success");
  };

  const handleAddNote = async () => {
    if (!selectedIncident || !newNote.trim()) return;

    try {
        const note = await apiAddNote(selectedIncident.id, "Op. COE", newNote);
        
        // Update local state
        const updated = {
            ...selectedIncident,
            notes: [...selectedIncident.notes, note]
        };
        setIncidents(incidents.map(i => i.id === updated.id ? updated : i));
        setSelectedIncident(updated);
        setNewNote('');
        notify("Nota adicionada.", "success");
    } catch (e) {
        notify("Erro ao adicionar nota", "info");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      
      {/* List Panel */}
      <div className={`flex-1 flex flex-col bg-coe-800 border border-coe-700 rounded-xl overflow-hidden ${selectedIncident ? 'hidden lg:flex' : 'flex'}`}>
        {/* Toolbar */}
        <div className="p-4 border-b border-coe-700 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Ocorrências</h2>
            <button 
                onClick={handleCreateIncident}
                className="bg-coe-accent hover:bg-coe-accent-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-coe-accent/20"
            >
              <Plus size={16} /> Nova Ocorrência
            </button>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por ID, endereço ou tipo..." 
                className="w-full bg-coe-900 border border-coe-700 text-slate-200 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-coe-accent"
              />
            </div>
            <button 
                onClick={() => {
                    setFilterMode(prev => prev === 'ALL' ? 'ACTIVE' : 'ALL');
                    notify(filterMode === 'ALL' ? "Filtrando: Apenas Ativos" : "Filtrando: Todos", "info");
                }}
                className={`p-2 border rounded-lg transition-colors ${filterMode === 'ACTIVE' ? 'bg-coe-accent text-white border-coe-accent' : 'bg-coe-900 border-coe-700 text-slate-400 hover:text-white'}`}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredIncidents.length === 0 ? (
             <div className="p-8 text-center text-slate-500 text-sm">Nenhuma ocorrência encontrada.</div>
          ) : (
             filteredIncidents.map(incident => (
                <div 
                  key={incident.id}
                  onClick={() => { setSelectedIncident(incident); setSuggestion(null); }}
                  className={`p-4 border-b border-coe-700 cursor-pointer hover:bg-coe-700/50 transition-colors ${selectedIncident?.id === incident.id ? 'bg-coe-accent/10 border-l-4 border-l-coe-accent' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-500">#{incident.id}</span>
                        <span className={`w-2 h-2 rounded-full ${incident.status === IncidentStatus.IN_PROGRESS ? 'bg-coe-alert animate-pulse' : 'bg-emerald-500'}`}></span>
                        <span className="text-sm font-medium text-slate-200">{incident.type}</span>
                     </div>
                     <span className="text-xs text-slate-500">
                        {new Date(incident.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <MapPin size={12} />
                    <span className="truncate">{incident.address}</span>
                  </div>
                  <div className="flex gap-2">
                      {incident.assignedVehicles.map(v => (
                          <span key={v} className="text-[10px] px-1.5 py-0.5 bg-coe-900 rounded border border-coe-700 text-slate-300">{v}</span>
                      ))}
                      <div className="flex-1"></div>
                      <button onClick={(e) => handleShare(incident)} className="text-slate-500 hover:text-emerald-500 transition-colors" title="Compartilhar no WhatsApp">
                          <Share2 size={14} />
                      </button>
                      <button onClick={(e) => handleDelete(e, incident.id)} className="text-slate-500 hover:text-red-500 transition-colors" title="Excluir Ocorrência">
                          <Trash2 size={14} />
                      </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedIncident ? (
        <div className="flex-[1.5] bg-coe-800 border border-coe-700 rounded-xl overflow-hidden flex flex-col animate-fadeIn shadow-2xl">
           <div className="p-6 border-b border-coe-700 flex justify-between items-start bg-coe-900/50">
              <div>
                <button 
                  onClick={() => setSelectedIncident(null)} 
                  className="lg:hidden mb-4 text-slate-400 flex items-center gap-1 text-sm"
                >
                    ← Voltar
                </button>
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">{selectedIncident.type}</h2>
                    <span className={`px-2 py-0.5 rounded text-white text-xs font-bold uppercase tracking-wide ${selectedIncident.priority === 'Crítica' ? 'bg-coe-alert' : 'bg-coe-600'}`}>{selectedIncident.priority}</span>
                </div>
                <p className="text-slate-400 flex items-center gap-2">
                    <MapPin size={16} /> {selectedIncident.address}
                </p>
              </div>
              <div className="text-right">
                  <p className="text-3xl font-mono text-slate-500">#{selectedIncident.id}</p>
                  <p className="text-xs text-coe-accent uppercase font-bold mt-1">{selectedIncident.status}</p>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="bg-coe-900/50 p-4 rounded-lg border border-coe-700">
                  <h4 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Descrição</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{selectedIncident.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                        <Ambulance size={16} /> Recursos Alocados
                    </h4>
                    <div className="space-y-2">
                        {selectedIncident.assignedVehicles.length > 0 ? selectedIncident.assignedVehicles.map(v => (
                            <div key={v} className="flex justify-between items-center bg-coe-900 p-3 rounded border border-coe-700">
                                <span className="font-mono text-sm text-coe-accent font-bold">{v}</span>
                                <span className="text-xs text-emerald-500 flex items-center gap-1"><CheckCircle size={10} /> No Local</span>
                            </div>
                        )) : <p className="text-sm text-slate-500 italic">Nenhuma viatura atribuída.</p>}
                        
                        <button 
                            onClick={() => handleSuggest(selectedIncident)}
                            className="mt-2 text-xs text-coe-accent hover:text-white underline"
                        >
                            Pedir sugestão à IA
                        </button>
                        {suggestion && (
                            <div className="mt-2 p-2 bg-coe-900 border border-coe-600 rounded text-xs text-slate-300">
                                {suggestion}
                            </div>
                        )}
                    </div>
                 </div>

                 <div>
                    <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                        <MessageSquare size={16} /> Log Operacional
                    </h4>
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2 relative before:absolute before:left-2 before:top-2 before:bottom-0 before:w-0.5 before:bg-coe-700">
                        {selectedIncident.notes.map(note => (
                            <div key={note.id} className="relative pl-6">
                                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-coe-900 border-2 border-coe-500 z-10"></div>
                                <div className="bg-coe-900 p-3 rounded border border-coe-700">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-xs text-slate-300">{note.author}</span>
                                        <span className="text-[10px] text-slate-600">{new Date(note.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-xs text-slate-400">{note.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="p-4 border-t border-coe-700 bg-coe-900 flex flex-col md:flex-row justify-end gap-3">
               <div className="flex-1 flex gap-2">
                   <input 
                    type="text" 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Adicionar nota ao log..."
                    className="flex-1 bg-coe-800 border border-coe-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-coe-accent"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                   />
                   <button 
                    onClick={handleAddNote}
                    disabled={!newNote}
                    className="p-2 bg-coe-700 rounded-lg text-white hover:bg-coe-600 disabled:opacity-50"
                   >
                       <Send size={16} />
                   </button>
               </div>
               <button 
                onClick={handleDispatch}
                className="px-4 py-2 rounded-lg bg-coe-accent hover:bg-coe-accent-hover text-white font-bold text-sm shadow-lg shadow-coe-accent/20 uppercase tracking-wide"
               >
                 Despachar Recursos
               </button>
           </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-[1.5] bg-coe-800/50 border border-coe-700 rounded-xl border-dashed items-center justify-center flex-col text-slate-500">
            <div className="p-6 rounded-full bg-coe-800 mb-4">
                <ChevronRight size={32} />
            </div>
            <p>Selecione um incidente para ver detalhes</p>
        </div>
      )}
    </div>
  );
};
