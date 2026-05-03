import React from 'react';
import UserManagement from './UserManagement';
import BzwSettings from './BzwSettings';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseIcon, LogOutIcon } from 'lucide-react';
import { BzwSetting } from '../types';

interface SettingsViewProps {
  onSetupDb: () => void;
  bzwSettings: BzwSetting[];
  refreshSettings: () => void;
}

export default function SettingsView({ onSetupDb, bzwSettings, refreshSettings }: SettingsViewProps) {
  const { user, logout } = useAuth();
  
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdminOrSuperAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Tetapan Sistem</h1>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium text-sm"
        >
          <LogOutIcon className="w-4 h-4" /> Log Keluar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Database Setup - Admin/Superadmin only */}
        {isAdminOrSuperAdmin && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
              <DatabaseIcon className="w-5 h-5 text-emerald-600" /> Pengurusan Pangkalan Data
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Jalankan setup awal jika pangkalan data kosong, atau struktur table berubah.
            </p>
            <button
               onClick={() => {
                  if (window.confirm("Pasti ingin mulakan setup pangkalan data?")) {
                      onSetupDb();
                  }
               }}
               className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block"
            >
               Jalankan Setup
            </button>
          </div>
        )}

        {/* BZW Settings - Superadmin only */}
        {isSuperAdmin && (
          <BzwSettings bzwSettings={bzwSettings} refreshSettings={refreshSettings} />
        )}

        {/* Users - Superadmin only */}
        {isSuperAdmin && (
             <UserManagement />
        )}
      </div>
    </div>
  );
}
