import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Flame, Users, BarChart3, Settings, Bell, LogOut, ShieldAlert, Video } from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

const SidebarItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border border-transparent ${
        isActive
          ? 'bg-coe-accent text-white shadow-lg shadow-coe-accent/20 font-bold border-coe-accent-hover'
          : 'text-slate-400 hover:bg-coe-800 hover:text-white hover:border-coe-700'
      }`
    }
  >
    <Icon size={20} />
    <span className="">{label}</span>
  </NavLink>
);

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [toast, setToast] = useState<{msg: string, type: 'info' | 'success'} | null>(null);

  useEffect(() => {
    const handleToast = (e: any) => {
      setToast({ msg: e.detail.message, type: e.detail.type || 'info' });
      setTimeout(() => setToast(null), 3000);
    };
    window.addEventListener('toast', handleToast);
    return () => window.removeEventListener('toast', handleToast);
  }, []);

  return (
    <div className="flex h-screen w-full bg-coe-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-coe-900 border-r border-coe-700 flex flex-col hidden md:flex relative z-10">
        <div className="p-6 flex items-center gap-3 border-b border-coe-800/50">
          <div className="w-10 h-10 bg-coe-accent rounded-lg flex items-center justify-center shadow-lg shadow-coe-accent/20">
            <Flame className="text-white fill-white" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide text-white">FIRE CMD</h1>
            <p className="text-xs text-coe-accent font-semibold uppercase tracking-wider">COE System v2.0</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem to="/monitor" icon={Video} label="Monitoramento" />
          <SidebarItem to="/incidents" icon={ShieldAlert} label="Ocorrências" />
          <SidebarItem to="/analytics" icon={BarChart3} label="Estatísticas" />
        </nav>

        <div className="p-4 border-t border-coe-700 bg-coe-800/30">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-coe-800 border border-coe-700 mb-3">
            <div className="w-9 h-9 rounded-full bg-coe-700 flex items-center justify-center text-sm font-bold border-2 border-coe-600">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-coe-accent hover:border-coe-accent-hover border border-transparent rounded-lg transition-all"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden pb-16 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-coe-900 border-b border-coe-700 flex items-center justify-between px-4">
           <div className="flex items-center gap-2">
            <Flame className="text-coe-accent fill-coe-accent" size={20} />
            <span className="font-bold">FIRE CMD</span>
           </div>
           <button onClick={onLogout} className="text-slate-400"><LogOut size={20} /></button>
        </header>
        
        <div className="flex-1 overflow-auto p-4 md:p-6 relative">
           {children}
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-coe-900/95 backdrop-blur border-t border-coe-700 flex items-center justify-around px-2 z-50">
            <SidebarItem to="/" icon={LayoutDashboard} label="" />
            <SidebarItem to="/monitor" icon={Video} label="" />
            <SidebarItem to="/incidents" icon={ShieldAlert} label="" />
            <SidebarItem to="/analytics" icon={BarChart3} label="" />
        </nav>

        {/* Toast Notification */}
        {toast && (
          <div className="absolute bottom-20 md:bottom-6 right-6 z-50 animate-fadeIn">
            <div className={`px-6 py-3 rounded-lg shadow-2xl border flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-500 text-emerald-100' : 'bg-coe-800/90 border-coe-accent text-white'
            }`}>
              {toast.type === 'success' ? <div className="w-2 h-2 rounded-full bg-emerald-400" /> : <Flame size={16} className="text-coe-accent" />}
              <span className="font-medium text-sm">{toast.msg}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Helper for other components
export const notify = (message: string, type: 'info' | 'success' = 'info') => {
  window.dispatchEvent(new CustomEvent('toast', { detail: { message, type } }));
};