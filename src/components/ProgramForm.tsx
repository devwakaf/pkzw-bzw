import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Program, Zone, ActivityCategory } from '../types';
import { XIcon } from 'lucide-react';

interface ProgramFormProps {
  program?: Program | null;
  categories: ActivityCategory[];
  onClose: () => void;
  onSubmit: (p: Program | Program[]) => void;
}

export default function ProgramForm({ program, categories, onClose, onSubmit }: ProgramFormProps) {
  const [formData, setFormData] = useState<Partial<Program>>({
    title: '',
    date: '',
    time: '',
    location: '',
    zone: 'HQ',
    activityType: '',
    pic_program: '',
    participants: '',
    description: '',
    status: 'Dirancang',
    program_cost: 0,
    collections: [],
  });

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState('daily');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  useEffect(() => {
    if (program) {
      setFormData(program);
    }
  }, [program]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: any = value;
    if (type === 'number') {
      parsedValue = value === '' ? 0 : parseFloat(value);
    }
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const addCollection = () => {
    const currentList = Array.isArray(formData.collections) ? formData.collections : [];
    setFormData(prev => ({
      ...prev,
      collections: [...currentList, { collection_type: 'Zakat', amount: 0, payers_count: 0, payment_type: '' }]
    }));
  };

  const updateCollection = (index: number, field: string, value: string | number) => {
    const currentList = Array.isArray(formData.collections) ? [...formData.collections] : [];
    currentList[index] = { ...currentList[index], [field]: value };
    setFormData(prev => ({ ...prev, collections: currentList }));
  };

  const removeCollection = (index: number) => {
    const currentList = Array.isArray(formData.collections) ? [...formData.collections] : [];
    currentList.splice(index, 1);
    setFormData(prev => ({ ...prev, collections: currentList }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!program && isRecurring && recurrenceEndDate && formData.date) {
      const start = new Date(formData.date);
      const end = new Date(recurrenceEndDate);
      const programs: Program[] = [];
      let current = new Date(start);

      while (current <= end) {
        programs.push({
          ...formData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          date: current.toISOString().split('T')[0],
        } as Program);

        if (recurrencePattern === 'daily') {
          current.setDate(current.getDate() + 1);
        } else if (recurrencePattern === 'weekly') {
          current.setDate(current.getDate() + 7);
        } else if (recurrencePattern === 'monthly') {
          current.setMonth(current.getMonth() + 1);
        } else {
          break;
        }
      }
      
      if (programs.length > 0) {
        onSubmit(programs);
        return;
      }
    }

    onSubmit({
      ...formData,
      id: program?.id || uuidv4(),
      createdAt: program?.createdAt || new Date().toISOString(),
    } as Program);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto w-full">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-8 relative flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-xl shrink-0">
          <h2 className="text-xl font-bold text-slate-800">
            {program ? 'Kemaskini Program' : 'Rekod Program Baru'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto border-b border-slate-100">
          <form id="program-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Nama Program / Aktiviti <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="title" 
                  required
                  value={formData.title} 
                  onChange={handleChange}
                  placeholder="Cth: Edaran Brochure Pasar Malam"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800"
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Tarikh <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    name="date" 
                    required
                    value={formData.date} 
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Masa</label>
                  <input 
                    type="time" 
                    name="time" 
                    value={formData.time} 
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>
              </div>

              {!program && (
                <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="isRecurring" className="ml-2 block text-sm font-bold text-slate-700">
                      Program Berulang (Recurring)
                    </label>
                  </div>
                  
                  {isRecurring && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Kekerapan</label>
                         <select
                           value={recurrencePattern}
                           onChange={(e) => setRecurrencePattern(e.target.value)}
                           className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white font-medium text-slate-800"
                         >
                           <option value="daily">Harian</option>
                           <option value="weekly">Mingguan</option>
                           <option value="monthly">Bulanan</option>
                         </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Tarikh Tamat <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          required={isRecurring}
                          value={recurrenceEndDate}
                          onChange={(e) => setRecurrenceEndDate(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Zon <span className="text-red-500">*</span></label>
                  <select 
                    name="zone" 
                    required
                    value={formData.zone} 
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white font-medium text-slate-800"
                  >
                    <option value="HQ">HQ</option>
                    <option value="Zon Timur">Zon Timur</option>
                    <option value="Zon Tengah">Zon Tengah</option>
                    <option value="Zon Barat">Zon Barat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Jenis Aktiviti</label>
                  <select 
                    name="activityType" 
                    value={formData.activityType || ''} 
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white font-medium text-slate-800"
                  >
                    <option value="">Pilih Jenis Aktiviti</option>
                    {(categories || []).map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Status Program</label>
                  <select 
                    name="status" 
                    value={formData.status || 'Dirancang'} 
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white font-medium text-slate-800"
                  >
                    <option value="Dirancang">Dirancang</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Batal">Batal</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Lokasi</label>
                <input 
                  type="text" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleChange}
                  placeholder="Cth: Masjid Sg Ular"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">PIC Program</label>
                <input 
                  type="text" 
                  name="pic_program" 
                  value={formData.pic_program} 
                  onChange={handleChange}
                  placeholder="Nama pegawai / kumpulan"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Kumpulan Sasar / Peserta</label>
                <input 
                  type="text" 
                  name="participants" 
                  value={formData.participants || ''} 
                  onChange={handleChange}
                  placeholder="Cth: Jemaah / Awam / 50 orang"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800"
                />
              </div>

              <div className="md:col-span-2 pt-4 mt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800">Maklumat Kutipan (Zakat / Wakaf)</h3>
                  <button type="button" onClick={addCollection} className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg font-bold transition-colors">
                    + Tambah Kutipan
                  </button>
                </div>
                
                <div className="space-y-4">
                  {(formData.collections || []).map((coll, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                      <button type="button" onClick={() => removeCollection(idx)} className="absolute top-3 right-3 text-red-500 hover:bg-red-100 hover:text-red-700 p-1 rounded transition-colors" title="Padam Kutipan">
                        <XIcon className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-1 pr-6">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Jenis <span className="text-red-500">*</span></label>
                          <select required value={coll.collection_type} onChange={(e) => updateCollection(idx, 'collection_type', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-white outline-none">
                            <option value="Zakat">Zakat</option>
                            <option value="Wakaf">Wakaf</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Amaun (RM) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0" step="0.01" value={coll.amount || ''} onChange={(e) => updateCollection(idx, 'amount', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Bil. Pembayar <span className="text-red-500">*</span></label>
                          <input type="number" required min="1" step="1" value={coll.payers_count || ''} onChange={(e) => updateCollection(idx, 'payers_count', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Cara Bayar <span className="text-red-500">*</span></label>
                          <select required value={coll.payment_type || ''} onChange={(e) => updateCollection(idx, 'payment_type', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-white outline-none">
                            <option value="">Pilih...</option>
                            <option value="Tunai">Tunai</option>
                            <option value="Online">Online / Transfer</option>
                            <option value="Cek">Cek</option>
                            <option value="Potongan Gaji">Potongan Gaji</option>
                            <option value="Campuran">Campuran</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!formData.collections || formData.collections.length === 0) && (
                    <div className="text-center py-6 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-slate-400 text-sm font-medium">
                      Tiada rekod kutipan. Tekan butang "+ Tambah Kutipan"
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="max-w-xs">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Kos Program (RM)</label>
                    <input 
                      type="number" 
                      name="program_cost" 
                      min="0"
                      step="0.01"
                      value={formData.program_cost || ''} 
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Catatan Tambahan</label>
                <textarea 
                  name="description" 
                  rows={3}
                  value={formData.description || ''} 
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none font-medium text-slate-800"
                  placeholder="Maklumat tambahan berkenaan program..."
                ></textarea>
              </div>

            </div>

          </form>
        </div>

        <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 rounded-b-xl flex justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-slate-600 font-semibold hover:bg-slate-200 transition-colors"
          >
            Batal
          </button>
          <button 
            type="submit"
            form="program-form"
            className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm transition-colors"
          >
            Simpan Program
          </button>
        </div>
      </div>
    </div>
  );
}
