import React, { useState, useEffect } from 'react';
import { Program } from '../types';
import { format, parseISO } from 'date-fns';
import { ms } from 'date-fns/locale';
import { Trash2Icon, RotateCcwIcon, SearchIcon, CalendarIcon, UserIcon, MapPinIcon, InfoIcon } from 'lucide-react';
import { api } from '../services/api';

interface TrashViewProps {
  onRecover: (id: string) => Promise<void>;
  onHardDelete: (id: string) => Promise<void>;
}

export default function TrashView({ onRecover, onHardDelete }: TrashViewProps) {
  const [deletedPrograms, setDeletedPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [actionModal, setActionModal] = useState<{ isOpen: boolean; type: 'recover' | 'hardDelete'; programId: string | null; title: string }>({
    isOpen: false,
    type: 'recover',
    programId: null,
    title: ''
  });

  const fetchDeleted = async () => {
    try {
      setLoading(true);
      const data = await api.getDeletedPrograms();
      setDeletedPrograms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeleted();
  }, []);

  const openRecoverModal = (id: string, title: string) => {
    setActionModal({ isOpen: true, type: 'recover', programId: id, title });
  };

  const openHardDeleteModal = (id: string, title: string) => {
    setActionModal({ isOpen: true, type: 'hardDelete', programId: id, title });
  };

  const confirmAction = async () => {
    if (!actionModal.programId) return;
    
    if (actionModal.type === 'recover') {
      await onRecover(actionModal.programId);
    } else {
      await onHardDelete(actionModal.programId);
    }
    
    setActionModal({ isOpen: false, type: 'recover', programId: null, title: '' });
    fetchDeleted();
  };

  const closeModal = () => {
    setActionModal({ isOpen: false, type: 'recover', programId: null, title: '' });
  };

  const filtered = deletedPrograms.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.pic_program || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Trash2Icon className="w-5 h-5 text-red-500" />
            Bakul Sampah (Rekod Padam)
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">Khas untuk Super Admin sahaja</p>
        </div>

        <div className="relative w-full md:w-72">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari dalam bakul sampah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-bold animate-pulse uppercase tracking-wider text-xs">Menunggu data tong sampah...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 py-16 text-center shadow-sm">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Trash2Icon className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-slate-700 font-black">Bakul Sampah Kosong</h3>
          <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto uppercase tracking-tighter">Tiada rekod aktiviti yang dipadam secara sementara dalam sistem.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                <tr>
                  <th className="px-4 py-3 w-[15%]">Tarikh Program</th>
                  <th className="px-4 py-3 w-[30%]">Nama Program</th>
                  <th className="px-4 py-3 w-[10%] text-center">Status</th>
                  <th className="px-4 py-3 w-[15%]">Dipadam Oleh</th>
                  <th className="px-4 py-3 w-[15%]">Tarikh Padam</th>
                  <th className="px-4 py-3 w-[15%] text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        {p.date ? (() => {
                             const [y, m, d] = p.date.split('T')[0].split('-');
                             const dt = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
                             return format(dt, 'dd MMM yyyy', { locale: ms });
                        })() : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-bold text-slate-800 text-[11px] md:text-xs leading-snug">
                        {p.title}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-center">
                       <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-red-50 text-red-600 border border-red-100">
                         {p.status || 'Dirancang'}
                       </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="text-[11px] font-semibold text-slate-700">
                        {p.deleted_by_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="text-[11px] text-slate-600 font-medium">
                        {p.deleted_at ? format(new Date(p.deleted_at), 'dd MMM yyyy, HH:mm', { locale: ms }) : '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center justify-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openRecoverModal(p.id, p.title)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded bg-white border border-slate-200 hover:border-emerald-300 shadow-sm transition-all"
                          title="Pulihkan"
                        >
                          <RotateCcwIcon className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => openHardDeleteModal(p.id, p.title)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded bg-white border border-slate-200 hover:border-red-300 shadow-sm transition-all"
                          title="Padam Kekal"
                        >
                          <Trash2Icon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm shadow-2xl">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
            <div className={`p-4 ${actionModal.type === 'recover' ? 'bg-emerald-600' : 'bg-red-600'} text-white flex items-start gap-3`}>
              <div className="bg-white/20 p-2 rounded-lg shrink-0 mt-0.5 border border-white/10 shadow-sm">
                {actionModal.type === 'recover' ? <RotateCcwIcon className="w-5 h-5" /> : <Trash2Icon className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Pengesahan Tindakan</h3>
                <p className="text-white/80 text-xs mt-1 font-bold uppercase tracking-wider mb-2">
                  {actionModal.type === 'recover' ? 'Pulihkan Aktiviti' : 'Padam Secara Kekal'}
                </p>
                <p className="text-sm font-medium mt-1 leading-snug">
                  "{actionModal.title}"
                </p>
              </div>
            </div>
            
            <div className="p-6 text-center text-slate-600 text-sm font-medium leading-relaxed">
              {actionModal.type === 'recover' 
                ? 'Adakah anda pasti untuk memulihkan aktiviti ini? Ia akan dikembalikan ke senarai utama dan boleh disunting atau dipos semula.'
                : 'Adakah anda benar-benar pasti? Tindakan padam secara kekal ini TIDAK BOLEH diundur. Segala data dan laporan akan dihapuskan.'}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={closeModal}
                className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold text-sm shadow-sm transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmAction}
                className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm shadow-sm transition-colors text-white ${
                  actionModal.type === 'recover' 
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' 
                  : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                }`}
              >
                {actionModal.type === 'recover' ? 'Ya, Pulihkan' : 'Ya, Padam Kekal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
