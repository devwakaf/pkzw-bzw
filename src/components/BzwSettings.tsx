import React, { useState } from 'react';
import { api } from '../services/api';
import { BzwSetting } from '../types';
import { CalendarIcon, SaveIcon, Trash2Icon, Edit2Icon, PlusIcon, XIcon, TargetIcon } from 'lucide-react';
import { NumericFormat } from 'react-number-format';

interface Props {
  bzwSettings: BzwSetting[];
  refreshSettings: () => void;
}

const emptyForm = { year: new Date().getFullYear(), start_date: '', end_date: '', hijri_year: '', zakat_target: 0, wakaf_target: 0, kempen_digital_target: 0, target_pbk_zakat: 0, target_pbk_wakaf: 0, target_pzb: 0, target_pgw: 0, target_digital_zakat: 0, target_digital_wakaf: 0, target_count_kaunter_zakat: 0, target_count_kaunter_wakaf: 0, target_count_pzb: 0, target_count_pgw: 0, target_count_digital_zakat: 0, target_count_digital_wakaf: 0 };

export default function BzwSettings({ bzwSettings, refreshSettings }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date) return;
    try {
      setLoading(true);
      await api.saveBzwSetting({ ...formData });
      refreshSettings();
      setIsModalOpen(false);
      setFormData(emptyForm);
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
      hijri_year: s.hijri_year || '',
      zakat_target: s.zakat_target || 0,
      wakaf_target: s.wakaf_target || 0,
      kempen_digital_target: s.kempen_digital_target || 0,
      target_pbk_zakat: s.target_pbk_zakat || 0,
      target_pbk_wakaf: s.target_pbk_wakaf || 0,
      target_pzb: s.target_pzb || 0,
      target_pgw: s.target_pgw || 0,
      target_digital_zakat: s.target_digital_zakat || 0,
      target_digital_wakaf: s.target_digital_wakaf || 0,
      target_count_kaunter_zakat: s.target_count_kaunter_zakat || 0,
      target_count_kaunter_wakaf: s.target_count_kaunter_wakaf || 0,
      target_count_pzb: s.target_count_pzb || 0,
      target_count_pgw: s.target_count_pgw || 0,
      target_count_digital_zakat: s.target_count_digital_zakat || 0,
      target_count_digital_wakaf: s.target_count_digital_wakaf || 0,
    });
    setIsModalOpen(true);
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

  const openNewForm = () => {
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-amber-500" /> Tetapan Tarikh Bulan Zakat & Wakaf
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Urus tarikh mula/akhir dan tetapan target tahunan (bermula 2023).</p>
        </div>
        <button onClick={openNewForm} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-amber-600 shrink-0">
          <PlusIcon className="w-4 h-4" /> Tambah Tetapan
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-100 rounded-lg">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Tahun & Hijriah</th>
              <th className="px-4 py-3">Tarikh Mula - Tamat</th>
              <th className="px-4 py-3">Target Utama (RM)</th>
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
                <td className="px-4 py-3 text-[10px] sm:text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-emerald-600">Zakat: RM {Number(s.zakat_target || 0).toLocaleString()}</span>
                    <span className="font-bold text-purple-600">Wakaf: RM {Number(s.wakaf_target || 0).toLocaleString()}</span>
                    <span className="font-bold text-blue-600">Digital: RM {Number(s.kempen_digital_target || 0).toLocaleString()}</span>
                  </div>
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
               <tr><td colSpan={4} className="p-8 text-center text-slate-400 font-medium text-sm">Tiada tetapan direkodkan. Sila tambah tetapan tahun baru.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-amber-500" />
                {formData.year && bzwSettings.some(s => s.year === formData.year) ? 'Kemaskini Tetapan' : 'Tambah Tetapan Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form id="settingForm" onSubmit={handleSave} className="space-y-8">
                {/* Bahagian 1: Maklumat Asas */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                    1. Maklumat Tarikh
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Tahun <span className="text-red-500">*</span></label>
                      <input type="number" required min="2023" value={formData.year || ''} onChange={(e) => setFormData({...formData, year: parseInt(e.target.value) || new Date().getFullYear()})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Tahun Hijriah</label>
                      <input type="text" placeholder="Cth: 1445H / 1446H" value={formData.hijri_year || ''} onChange={(e) => setFormData({...formData, hijri_year: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Tarikh Mula <span className="text-red-500">*</span></label>
                      <input type="date" required value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Tarikh Tamat <span className="text-red-500">*</span></label>
                      <input type="date" required value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                    </div>
                  </div>
                </div>

                {/* Bahagian 2: Target Utama */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                    <TargetIcon className="w-4 h-4 text-emerald-500" /> 2. Target Keseluruhan (RM)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Zakat (Keseluruhan)</label>
                      <NumericFormat 
                        value={formData.zakat_target !== undefined ? formData.zakat_target : ''} 
                        onValueChange={(values) => setFormData({...formData, zakat_target: values.floatValue !== undefined ? values.floatValue : 0})}
                        thousandSeparator={true}
                        decimalScale={2}
                        fixedDecimalScale={true}
                        allowNegative={false}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
                        placeholder="0.00" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Wakaf (Keseluruhan)</label>
                      <NumericFormat 
                        value={formData.wakaf_target !== undefined ? formData.wakaf_target : ''} 
                        onValueChange={(values) => setFormData({...formData, wakaf_target: values.floatValue !== undefined ? values.floatValue : 0})}
                        thousandSeparator={true}
                        decimalScale={2}
                        fixedDecimalScale={true}
                        allowNegative={false}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
                        placeholder="0.00" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Kempen Digital</label>
                      <NumericFormat 
                        value={formData.kempen_digital_target !== undefined ? formData.kempen_digital_target : ''} 
                        onValueChange={(values) => setFormData({...formData, kempen_digital_target: values.floatValue !== undefined ? values.floatValue : 0})}
                        thousandSeparator={true}
                        decimalScale={2}
                        fixedDecimalScale={true}
                        allowNegative={false}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
                        placeholder="0.00" 
                      />
                    </div>
                  </div>
                </div>

                {/* Bahagian 3: Target Pembayar Baru */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-2">
                    <TargetIcon className="w-4 h-4 text-blue-500" /> 3. Target Perincian Zakat & Wakaf
                  </h3>

                  {/* ZAKAT SECTION */}
                  <div>
                    <h4 className="text-xs font-bold text-emerald-600 mb-3 uppercase tracking-wider bg-emerald-50 px-3 py-1.5 rounded-md inline-block">Zakat</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {/* Kaunter Zakat */}
                      <div className="flex flex-col gap-2">
                        <label className="block text-xs font-bold text-slate-700">Kaunter</label>
                        <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <div>
                            <span className="text-[10px] text-slate-500 font-medium block mb-1">Bil. Pembayar (Org)</span>
                            <NumericFormat 
                              value={formData.target_count_kaunter_zakat !== undefined ? formData.target_count_kaunter_zakat : ''} 
                              onValueChange={(values) => setFormData({...formData, target_count_kaunter_zakat: values.floatValue !== undefined ? values.floatValue : 0})}
                              thousandSeparator={true}
                              allowNegative={false}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
                              placeholder="0" 
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-medium block mb-1">Amaun (RM)</span>
                            <NumericFormat 
                              value={formData.target_pbk_zakat !== undefined ? formData.target_pbk_zakat : ''} 
                              onValueChange={(values) => setFormData({...formData, target_pbk_zakat: values.floatValue !== undefined ? values.floatValue : 0})}
                              thousandSeparator={true}
                              decimalScale={2}
                              fixedDecimalScale={true}
                              allowNegative={false}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
                              placeholder="0.00" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* PZB Zakat */}
                      <div className="flex flex-col gap-2">
                        <label className="block text-xs font-bold text-slate-700">Potongan Gaji Zakat (PZB)</label>
                        <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <div>
                            <span className="text-[10px] text-slate-500 font-medium block mb-1">Bil. Pembayar (Org)</span>
                            <NumericFormat 
                              value={formData.target_count_pzb !== undefined ? formData.target_count_pzb : ''} 
                              onValueChange={(values) => setFormData({...formData, target_count_pzb: values.floatValue !== undefined ? values.floatValue : 0})}
                              thousandSeparator={true}
                              allowNegative={false}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
                              placeholder="0" 
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-medium block mb-1">Amaun (RM)</span>
                            <NumericFormat 
                              value={formData.target_pzb !== undefined ? formData.target_pzb : ''} 
                              onValueChange={(values) => setFormData({...formData, target_pzb: values.floatValue !== undefined ? values.floatValue : 0})}
                              thousandSeparator={true}
                              decimalScale={2}
                              fixedDecimalScale={true}
                              allowNegative={false}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
                              placeholder="0.00" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Digital Zakat */}
                      <div className="flex flex-col gap-2">
                        <label className="block text-xs font-bold text-slate-700">Digital Zakat</label>
                        <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <div>
                            <span className="text-[10px] text-slate-500 font-medium block mb-1">Bil. Pembayar (Org)</span>
                            <NumericFormat 
                              value={formData.target_count_digital_zakat !== undefined ? formData.target_count_digital_zakat : ''} 
                              onValueChange={(values) => setFormData({...formData, target_count_digital_zakat: values.floatValue !== undefined ? values.floatValue : 0})}
                              thousandSeparator={true}
                              allowNegative={false}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
                              placeholder="0" 
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-medium block mb-1">Amaun (RM)</span>
                            <NumericFormat 
                              value={formData.target_digital_zakat !== undefined ? formData.target_digital_zakat : ''} 
                              onValueChange={(values) => setFormData({...formData, target_digital_zakat: values.floatValue !== undefined ? values.floatValue : 0})}
                              thousandSeparator={true}
                              decimalScale={2}
                              fixedDecimalScale={true}
                              allowNegative={false}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
                              placeholder="0.00" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* WAKAF SECTION */}
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-purple-600 mb-3 uppercase tracking-wider bg-purple-50 px-3 py-1.5 rounded-md inline-block">Wakaf</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {/* Kaunter Wakaf */}
                      <div className="flex flex-col gap-2">
                        <label className="block text-xs font-bold text-slate-700">Kaunter</label>
                        <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <div>
                            <span className="text-[10px] text-slate-500 font-medium block mb-1">Bil. Pembayar (Org)</span>
                            <NumericFormat 
                              value={formData.target_count_kaunter_wakaf !== undefined ? formData.target_count_kaunter_wakaf : ''} 
                              onValueChange={(values) => setFormData({...formData, target_count_kaunter_wakaf: values.floatValue !== undefined ? values.floatValue : 0})}
                              thousandSeparator={true}
                              allowNegative={false}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
                              placeholder="0" 
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-medium block mb-1">Amaun (RM)</span>
                            <NumericFormat 
                              value={formData.target_pbk_wakaf !== undefined ? formData.target_pbk_wakaf : ''} 
                              onValueChange={(values) => setFormData({...formData, target_pbk_wakaf: values.floatValue !== undefined ? values.floatValue : 0})}
                              thousandSeparator={true}
                              decimalScale={2}
                              fixedDecimalScale={true}
                              allowNegative={false}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
                              placeholder="0.00" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* PGW Wakaf */}
                      <div className="flex flex-col gap-2">
                        <label className="block text-xs font-bold text-slate-700">Potongan Gaji Wakaf (PGW)</label>
                        <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <div>
                            <span className="text-[10px] text-slate-500 font-medium block mb-1">Bil. Pembayar (Org)</span>
                            <NumericFormat 
                              value={formData.target_count_pgw !== undefined ? formData.target_count_pgw : ''} 
                              onValueChange={(values) => setFormData({...formData, target_count_pgw: values.floatValue !== undefined ? values.floatValue : 0})}
                              thousandSeparator={true}
                              allowNegative={false}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
                              placeholder="0" 
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-medium block mb-1">Amaun (RM)</span>
                            <NumericFormat 
                              value={formData.target_pgw !== undefined ? formData.target_pgw : ''} 
                              onValueChange={(values) => setFormData({...formData, target_pgw: values.floatValue !== undefined ? values.floatValue : 0})}
                              thousandSeparator={true}
                              decimalScale={2}
                              fixedDecimalScale={true}
                              allowNegative={false}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
                              placeholder="0.00" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Digital Wakaf */}
                      <div className="flex flex-col gap-2">
                        <label className="block text-xs font-bold text-slate-700">Digital Wakaf</label>
                        <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <div>
                            <span className="text-[10px] text-slate-500 font-medium block mb-1">Bil. Pembayar (Org)</span>
                            <NumericFormat 
                              value={formData.target_count_digital_wakaf !== undefined ? formData.target_count_digital_wakaf : ''} 
                              onValueChange={(values) => setFormData({...formData, target_count_digital_wakaf: values.floatValue !== undefined ? values.floatValue : 0})}
                              thousandSeparator={true}
                              allowNegative={false}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
                              placeholder="0" 
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-medium block mb-1">Amaun (RM)</span>
                            <NumericFormat 
                              value={formData.target_digital_wakaf !== undefined ? formData.target_digital_wakaf : ''} 
                              onValueChange={(values) => setFormData({...formData, target_digital_wakaf: values.floatValue !== undefined ? values.floatValue : 0})}
                              thousandSeparator={true}
                              decimalScale={2}
                              fixedDecimalScale={true}
                              allowNegative={false}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
                              placeholder="0.00" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                Batal
              </button>
              <button 
                disabled={loading} 
                type="submit" 
                form="settingForm"
                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-amber-600 shadow-sm"
              >
                <SaveIcon className="w-4 h-4" /> Simpan Tetapan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
