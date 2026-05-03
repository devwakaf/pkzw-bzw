import React, { useState } from 'react';
import { api } from '../services/api';
import { BzwSetting } from '../types';
import { CalendarIcon, SaveIcon, Trash2Icon, Edit2Icon } from 'lucide-react';

interface Props {
  bzwSettings: BzwSetting[];
  refreshSettings: () => void;
}

export default function BzwSettings({ bzwSettings, refreshSettings }: Props) {
  const [formData, setFormData] = useState({ year: new Date().getFullYear(), start_date: '', end_date: '', hijri_year: '' });
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date) return;
    try {
      setLoading(true);
      await api.saveBzwSetting(formData.year, formData.start_date, formData.end_date, formData.hijri_year);
      refreshSettings();
      setFormData({ year: formData.year + 1, start_date: '', end_date: '', hijri_year: '' });
    } catch (err) {
      alert("Gagal menyimpan tetapan");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (s: BzwSetting) => {
    setFormData({
      year: s.year,
      start_date: s.start_date,
      end_date: s.end_date,
      hijri_year: s.hijri_year || ''
    });
  };

  const handleDelete = async (year: number) => {
    if (!window.confirm(`Padam tetapan untuk ${year}?`)) return;
    try {
      setLoading(true);
      await api.deleteBzwSetting(year);
      refreshSettings();
    } catch (err) {
      alert("Gagal memadam tetapan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
        <CalendarIcon className="w-5 h-5 text-amber-500" /> Tetapan Tarikh Bulan Zakat & Wakaf
      </h2>
      <p className="text-sm text-slate-500 mb-6 font-medium">Tetapkan tarikh mula dan akhir bagi bulan-bulan yang terbabit dengan aktiviti pada tahun berkenaan (bermula 2023). Hanya zon dan tempoh di dalam tarikh ini akan dipaparkan.</p>
      
      <form onSubmit={handleSave} className="flex gap-2 mb-6 flex-wrap items-end">
        <div className="flex-1 min-w-[80px]">
          <label className="block text-xs font-bold text-slate-500 mb-1">Tahun</label>
          <input type="number" required min="2023" value={formData.year || ''} onChange={(e) => setFormData({...formData, year: parseInt(e.target.value) || new Date().getFullYear()})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
        </div>
        <div className="flex-[2] min-w-[120px]">
          <label className="block text-xs font-bold text-slate-500 mb-1">Tahun Hijriah</label>
          <input type="text" placeholder="Cth: 1445H / 1446H" value={formData.hijri_year || ''} onChange={(e) => setFormData({...formData, hijri_year: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
        </div>
        <div className="flex-[2] min-w-[150px]">
          <label className="block text-xs font-bold text-slate-500 mb-1">Tarikh Mula</label>
          <input type="date" required value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
        </div>
        <div className="flex-[2] min-w-[150px]">
          <label className="block text-xs font-bold text-slate-500 mb-1">Tarikh Tamat</label>
          <input type="date" required value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
        </div>
        <button disabled={loading} type="submit" className="w-full xl:w-auto px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-amber-600">
          <SaveIcon className="w-4 h-4" /> Simpan
        </button>
      </form>

      <div className="overflow-x-auto border border-slate-100 rounded-lg">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Tahun & Hijriah</th>
              <th className="px-4 py-3">Tarikh Mula - Tamat</th>
              <th className="px-4 py-3 text-center">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(bzwSettings || []).map(s => (
              <tr key={s.year} className="hover:bg-slate-50 transition-colors group">
                <td className="px-4 py-3 font-bold text-slate-800">
                  {s.year} {s.hijri_year && <span className="text-slate-400 font-semibold text-xs ml-1">({s.hijri_year})</span>}
                </td>
                <td className="px-4 py-3 text-slate-600 font-medium">
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">{s.start_date.split('-').reverse().join('/')}</span> 
                  <span className="text-slate-400 mx-2 text-xs">hingga</span> 
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">{s.end_date.split('-').reverse().join('/')}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center items-center gap-1">
                    <button type="button" onClick={() => handleEdit(s)} className="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 p-1.5 rounded transition-colors" title="Kemaskini Tetapan">
                      <Edit2Icon className="w-4 h-4"/>
                    </button>
                    <button type="button" onClick={() => handleDelete(s.year)} className="text-red-400 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors" title="Padam Tetapan">
                      <Trash2Icon className="w-4 h-4"/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(!bzwSettings || bzwSettings.length === 0) && (
               <tr><td colSpan={3} className="p-8 text-center text-slate-400 font-medium text-sm">Tiada tetapan direkodkan. Sila tambah tetapan tahun baru.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
