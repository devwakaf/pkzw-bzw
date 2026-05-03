import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { LockIcon, UserIcon, XIcon } from 'lucide-react';

export default function Login({ onSuccess, onClose }: { onSuccess?: () => void, onClose?: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login({ username, password });
      login(data.token, data.user);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Log masuk gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-emerald-800 text-white p-8 text-center relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg text-emerald-200 hover:bg-emerald-700 hover:text-white transition-colors"
              type="button"
            >
              <XIcon className="w-5 h-5" />
            </button>
          )}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-white/20 to-white/5 p-1 rounded-xl border border-white/20 shadow-inner">
              <div className="bg-emerald-900/40 px-4 py-3 rounded-lg flex items-center justify-center border border-white/5">
                <span className="font-black text-3xl tracking-tighter bg-gradient-to-b from-white to-emerald-200 bg-clip-text text-transparent drop-shadow-sm">BZW</span>
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sistem BZW 2026</h1>
          <p className="text-emerald-200 mt-2 text-sm">Log masuk untuk teruskan</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 w-full rounded-lg border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-slate-50 p-2.5 border outline-none"
                  placeholder="Masukkan username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kata Laluan</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full rounded-lg border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-slate-50 p-2.5 border outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white rounded-lg py-3 font-medium mt-8 hover:bg-emerald-500 transition-colors disabled:opacity-70"
          >
            {loading ? 'Sila tunggu...' : 'Log Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
