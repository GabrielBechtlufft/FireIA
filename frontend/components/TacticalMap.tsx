import React, { useMemo, useState } from 'react';
import { Vehicle, Incident, Coordinates, VehicleStatus, IncidentPriority } from '../types';
import { CITY_CENTER } from '../constants';
import { Car, Flame, Info } from 'lucide-react';

interface TacticalMapProps {
  vehicles: Vehicle[];
  incidents: Incident[];
  onVehicleClick?: (v: Vehicle) => void;
  onIncidentClick?: (i: Incident) => void;
  height?: string;
}

// Helper to convert lat/lon to % X/Y relative to center for a mock city grid
const project = (coords: Coordinates, center: Coordinates, scale: number = 2000) => {
  const dx = (coords.lon - center.lon) * scale;
  const dy = (center.lat - coords.lat) * scale; // Latitude increases northward (up), screen Y increases downward
  // Center is 50,50
  return { x: 50 + dx, y: 50 + dy };
};

export const TacticalMap: React.FC<TacticalMapProps> = ({ vehicles, incidents, onVehicleClick, onIncidentClick, height = "h-[500px]" }) => {
  const [hoverInfo, setHoverInfo] = useState<string | null>(null);

  const gridLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i <= 100; i += 10) {
      lines.push(<line key={`v${i}`} x1={i} y1={0} x2={i} y2={100} stroke="#1e293b" strokeWidth="0.5" />);
      lines.push(<line key={`h${i}`} x1={0} y1={i} x2={100} y2={i} stroke="#1e293b" strokeWidth="0.5" />);
    }
    return lines;
  }, []);

  return (
    <div className={`relative w-full ${height} bg-coe-900 rounded-xl border border-coe-700 overflow-hidden group`}>
      <div className="absolute inset-0 bg-slate-900/50 pointer-events-none" />
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-coe-900/90 backdrop-blur border border-coe-700 p-3 rounded-lg z-10 text-xs shadow-xl">
        <h4 className="font-bold mb-2 text-slate-300">Legenda Tática</h4>
        <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-coe-alert"></span> Incidente</div>
        <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Viatura Disp.</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Em Missão</div>
      </div>

      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        {/* City Grid Background */}
        {gridLines}

        {/* Radar Rings Effect */}
        <circle cx="50" cy="50" r="10" stroke="#334155" strokeWidth="0.2" fill="none" />
        <circle cx="50" cy="50" r="25" stroke="#334155" strokeWidth="0.2" fill="none" />
        <circle cx="50" cy="50" r="40" stroke="#334155" strokeWidth="0.2" fill="none" />

        {/* Vehicles */}
        {vehicles.map(v => {
          const pos = project(v.location, CITY_CENTER);
          const color = v.status === VehicleStatus.AVAILABLE ? '#3b82f6' : v.status === VehicleStatus.ON_SCENE ? '#eab308' : '#64748b';
          
          return (
            <g key={v.id} onClick={() => onVehicleClick && onVehicleClick(v)} className="cursor-pointer transition-all duration-300 hover:opacity-80">
              <circle cx={pos.x} cy={pos.y} r="1.5" fill={color} fillOpacity="0.2" className="animate-pulse" />
              <circle cx={pos.x} cy={pos.y} r="0.8" fill={color} stroke="#0f172a" strokeWidth="0.2" />
              <text x={pos.x} y={pos.y - 1.5} fontSize="1.5" fill="white" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity select-none bg-black">
                {v.id}
              </text>
            </g>
          );
        })}

        {/* Incidents */}
        {incidents.filter(i => i.status !== 'Encerrado').map(inc => {
          const pos = project(inc.location, CITY_CENTER);
          const isCritical = inc.priority === IncidentPriority.CRITICAL;
          
          return (
            <g key={inc.id} onClick={() => onIncidentClick && onIncidentClick(inc)} className="cursor-pointer">
              {/* Ripple for incidents */}
              <circle cx={pos.x} cy={pos.y} r="3" fill="#ef4444" fillOpacity="0.2">
                <animate attributeName="r" from="1" to="4" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
              </circle>
              
              <polygon points={`${pos.x},${pos.y-1.5} ${pos.x+1.2},${pos.y+0.8} ${pos.x-1.2},${pos.y+0.8}`} fill="#ef4444" stroke="#7f1d1d" strokeWidth="0.2" />
              <text x={pos.x} y={pos.y + 2.5} fontSize="1.5" fill="#fca5a5" textAnchor="middle" className="select-none font-bold">
                {inc.type}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};