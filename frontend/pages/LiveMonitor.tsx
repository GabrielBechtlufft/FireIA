import React, { useState } from 'react';
import { Camera, Radio, Maximize2, Mic, Volume2, Settings, Aperture, Video } from 'lucide-react';
import { notify } from '../components/Layout';

export const LiveMonitor = () => {
    const [isRecording, setIsRecording] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(false);

    const handleSnapshot = async () => {
        try {
            const res = await fetch('/api/snapshot', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                notify("Snapshot salvo com sucesso!", "success");
                window.open(data.url, '_blank');
            } else {
                notify("Erro ao salvar snapshot", "info");
            }
        } catch (e) {
            notify("Erro na requisição", "info");
        }
    };

    return (
        <div className="flex flex-col gap-4 h-full lg:h-full overflow-y-auto lg:overflow-hidden">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-3">
                        <Video size={24} className="text-coe-accent" />
                        Monitoramento Central
                    </h1>
                     {/* Hide subtitle on mobile to save space */}
                    <p className="text-slate-400 text-sm hidden lg:block">Visualização direta dos sistemas de vigilância</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-coe-800 border border-coe-700 rounded-lg px-3 py-1 lg:px-4 lg:py-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs lg:text-sm font-medium text-emerald-500">ONLINE</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 lg:min-h-0">
                {/* Main Camera Feed */}
                <div className="lg:col-span-3 bg-black rounded-xl border border-coe-700 relative overflow-hidden group shadow-2xl min-h-[50vh] flex flex-col justify-center">
                    <img 
                      src="/video_feed" 
                      alt="Main Feed" 
                      className="w-full h-full object-contain"
                    />

                    {/* Header Overlay */}
                    <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start pointer-events-none">
                        <div className="flex items-center gap-2">
                            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">CAM-01</span>
                            <span className="text-white/80 text-sm font-mono hidden sm:inline">Entrada Principal - Setor Norte</span>
                        </div>
                        <div className="flex gap-2">
                            {isRecording && (
                                <span className="flex items-center gap-1 bg-red-500/20 border border-red-500/50 text-red-500 px-2 py-1 rounded text-xs font-bold animate-pulse">
                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span> REC
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Tactical Overlays */}
                    <div className="absolute bottom-8 left-8 text-white/50 font-mono text-xs sm:text-sm hidden sm:block">
                        <p>COORD: -23.5505, -46.6333</p>
                        <p>TEL: 18mm | ISO: 400</p>
                    </div>

                    {/* Date/Time */}
                    <div className="absolute bottom-4 right-4 lg:bottom-8 lg:right-8 text-right pointer-events-none">
                        <p className="text-white font-mono text-lg lg:text-xl font-bold">{new Date().toLocaleTimeString()}</p>
                        <p className="text-white/50 font-mono text-xs sm:text-sm">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Controls & Mini Feeds */}
                <div className="space-y-4 flex flex-col pb-20 lg:pb-0">
                    <div className="bg-coe-800 border border-coe-700 p-4 rounded-xl flex-1">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Settings size={18} className="text-coe-accent" />
                            Controles
                        </h3>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                            <button 
                                onClick={() => {
                                    setIsRecording(!isRecording);
                                    notify(isRecording ? "Gravação Parada" : "Gravação Iniciada", "info");
                                }}
                                className={`w-full py-3 rounded-lg font-medium border transition-all flex items-center justify-center gap-2 ${ isRecording ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-coe-700 border-coe-600 text-slate-300 hover:text-white'}`}
                            >
                                <Radio size={18} className={isRecording ? 'animate-pulse' : ''} />
                                <span className="text-xs lg:text-sm">{isRecording ? 'PARAR' : 'GRAVAR'}</span>
                            </button>

                            <button 
                                onClick={() => setAudioEnabled(!audioEnabled)}
                                className={`w-full py-3 rounded-lg font-medium border transition-all flex items-center justify-center gap-2 ${ audioEnabled ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-coe-700 border-coe-600 text-slate-300 hover:text-white'}`}
                            >
                                {audioEnabled ? <Volume2 size={18} /> : <Mic size={18} />}
                                <span className="text-xs lg:text-sm">{audioEnabled ? 'ÁUDIO' : 'MUDO'}</span>
                            </button>

                            <button 
                                onClick={handleSnapshot}
                                className="w-full py-3 rounded-lg font-medium bg-coe-700 border border-coe-600 text-slate-300 hover:text-white hover:bg-coe-600 transition-all flex items-center justify-center gap-2"
                            >
                                <Aperture size={18} />
                                <span className="text-xs lg:text-sm">FOTO</span>
                            </button>

                            <button className="w-full py-3 rounded-lg font-medium bg-coe-700 border border-coe-600 text-slate-300 hover:text-white hover:bg-coe-600 transition-all flex items-center justify-center gap-2">
                                <Maximize2 size={18} />
                                <span className="text-xs lg:text-sm">TELA</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
