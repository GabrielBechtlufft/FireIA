import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Flame, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { notify } from '../components/Layout';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            notify("Login realizado com sucesso!", "success");
            login(data.user);
            navigate('/');
        } else {
            notify(data.message || "Falha no login", "info");
        }
    } catch(err) {
        notify("Erro de conexão", "info");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-coe-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-coe-900 border border-coe-700 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
         {/* Decoration */}
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-coe-accent to-transparent"></div>
         <div className="absolute -top-10 -right-10 w-20 h-20 bg-coe-accent blur-[50px] opacity-20"></div>

         <div className="text-center mb-8">
            <div className="w-16 h-16 bg-coe-800 rounded-xl flex items-center justify-center mx-auto mb-4 border border-coe-700 shadow-lg relative group">
                <Flame size={32} className="text-coe-accent fill-coe-accent" />
                <div className="absolute inset-0 bg-coe-accent blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">COE SURVEILLANCE</h1>
            <p className="text-slate-400 text-sm mt-1">Acesso Restrito - Somente Pessoal Autorizado</p>
         </div>

         <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Usuário</label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-3 text-slate-500" size={18} />
                    <input 
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full bg-coe-950 border border-coe-700 rounded-lg py-2.5 pl-10 text-white focus:border-coe-accent focus:outline-none transition-colors"
                        placeholder="ID Operacional"
                        required
                    />
                </div>
            </div>
            
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Senha</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                    <input 
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-coe-950 border border-coe-700 rounded-lg py-2.5 pl-10 text-white focus:border-coe-accent focus:outline-none transition-colors"
                        placeholder="••••••••"
                        required
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-coe-accent hover:bg-coe-accent-hover text-white font-bold py-3 rounded-lg shadow-lg shadow-coe-accent/20 transition-all flex items-center justify-center gap-2 mt-6"
            >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'ACESSAR SISTEMA'}
            </button>
         </form>

         <div className="mt-8 text-center">
             <p className="text-xs text-slate-600">Sistema monitorado pelo Departamento de Inteligência.</p>
         </div>
      </div>
    </div>
  );
};