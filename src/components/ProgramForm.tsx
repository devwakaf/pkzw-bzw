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
  const [activeTab, setActiveTab] = useState<'asas' | 'butiran' | 'kutipan'>('asas');

  useEffect(() => {
    if (program) {
      setFormData(program);
    }
  }, [program]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: any = value;
    if (type === 'number') {
      parsedValue = value === '' ? '' : parseFloat(value);
    }
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const addCollection = () => {
    const currentList = Array.isArray(formData.collections) ? formData.collections : [];
    setFormData(prev => ({
      ...prev,
      collections: [...currentList, { collection_type: 'Zakat', amount: '' as any, payers_count: '' as any, payment_type: '' }]
    }));
  };

  const updateCollection = (index: number, field: string, value: any) => {
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
    
    const sanitizedCollections = (formData.collections || []).map(coll => ({
      ...coll,
      amount: coll.amount === '' ? 0 : (parseFloat(coll.amount as any) || 0),
      payers_count: coll.payers_count === '' ? 0 : (parseInt(coll.payers_count as any) || 0)
    }));
    
    const sanitizedProgramCost = formData.program_cost === '' ? 0 : (parseFloat(formData.program_cost as any) || 0);
    
    const finalFormData = {
      ...formData,
      program_cost: sanitizedProgramCost,
      collections: sanitizedCollections
    };

    if (!program && isRecurring && recurrenceEndDate && finalFormData.date) {
      const [sy, sm, sd] = finalFormData.date.split('-').map(Number);
      const start = new Date(Date.UTC(sy, sm - 1, sd));
      
      const [ey, em, ed] = recurrenceEndDate.split('-').map(Number);
      const end = new Date(Date.UTC(ey, em - 1, ed));
      
      const programs: Program[] = [];
      let current = new Date(start);

      while (current <= end) {
        programs.push({
          ...finalFormData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          date: current.toISOString().split('T')[0],
        } as Program);

        if (recurrencePattern === 'daily') {
          current.setUTCDate(current.getUTCDate() + 1);
        } else if (recurrencePattern === 'weekly') {
          current.setUTCDate(current.getUTCDate() + 7);
        } else if (recurrencePattern === 'monthly') {
          current.setUTCMonth(current.getUTCMonth() + 1);
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
      ...finalFormData,
      id: program?.id || uuidv4(),
      createdAt: program?.createdAt || new Date().toISOString(),
    } as Program);
  };

  const handleNext = () => {
    if (activeTab === 'asas') {
      if (!formData.title || !formData.date || !formData.zone) {
        const form = document.getElementById('program-form') as HTMLFormElement;
        form?.reportValidity();
        return;
      }
      setActiveTab('butiran');
    } else if (activeTab === 'butiran') {
      setActiveTab('kutipan');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-hidden w-full">
      <div className="bg-white shadow-2xl w-full max-w-3xl relative flex flex-col rounded-xl max-h-[90vh] transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-slate-50/85 rounded-t-xl shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              {program ? 'Kemaskini Program' : 'Rekod Program Baru'}
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">
              Sila lengkapkan maklumat mengikut langkah yang disediakan.
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/80 rounded-lg transition-colors text-slate-500 hover:text-slate-800"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-step Tab Indicator Bar */}
        <div className="flex border-b border-slate-100 bg-slate-50/40 p-1.5 gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('asas')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all text-center min-w-[70px] ${
              activeTab === 'asas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="hidden sm:inline">1. Maklumat Asas</span>
            <span className="inline sm:hidden">Asas</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'asas' && (!formData.title || !formData.date || !formData.zone)) {
                const form = document.getElementById('program-form') as HTMLFormElement;
                form?.reportValidity();
                return;
              }
              setActiveTab('butiran');
            }}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all text-center min-w-[70px] ${
              activeTab === 'butiran'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="hidden sm:inline">2. Butiran Tambahan</span>
            <span className="inline sm:hidden">Butiran</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'asas' && (!formData.title || !formData.date || !formData.zone)) {
                const form = document.getElementById('program-form') as HTMLFormElement;
                form?.reportValidity();
                return;
              }
              setActiveTab('kutipan');
            }}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all text-center min-w-[70px] relative ${
              activeTab === 'kutipan'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="hidden sm:inline">3. Kutipan & Kewangan</span>
            <span className="inline sm:hidden">Kutipan</span>
            {formData.collections && formData.collections.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] rounded-full font-extrabold">
                {formData.collections.length}
              </span>
            )}
          </button>
        </div>

        {/* Form Body Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <form id="program-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* TAB 1: ASAS */}
            {activeTab === 'asas' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Nama Program / Aktiviti <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="title" 
                    required
                    value={formData.title} 
                    onChange={handleChange}
                    placeholder="Cth: Edaran Brochure Pasar Malam"
                    className="w-full px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Tarikh <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      name="date" 
                      required
                      value={formData.date} 
                      onChange={handleChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Masa</label>
                    <input 
                      type="time" 
                      name="time" 
                      value={formData.time} 
                      onChange={handleChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Jenis Aktiviti</label>
                    <select 
                      name="activityType" 
                      value={formData.activityType || ''} 
                      onChange={handleChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white font-medium text-slate-800 text-sm"
                    >
                      <option value="">Pilih...</option>
                      {(categories || []).map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Zon <span className="text-red-500">*</span></label>
                    <select 
                      name="zone" 
                      required
                      value={formData.zone} 
                      onChange={handleChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white font-medium text-slate-800 text-sm"
                    >
                      <option value="HQ">HQ</option>
                      <option value="Zon Timur">Zon Timur</option>
                      <option value="Zon Tengah">Zon Tengah</option>
                      <option value="Zon Barat">Zon Barat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Status Program</label>
                    <select 
                      name="status" 
                      value={formData.status || 'Dirancang'} 
                      onChange={handleChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white font-medium text-slate-800 text-sm"
                    >
                      <option value="Dirancang">Dirancang</option>
                      <option value="Selesai">Selesai</option>
                      <option value="Batal">Batal</option>
                    </select>
                  </div>
                </div>

                {!program && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 mt-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isRecurring"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                      <label htmlFor="isRecurring" className="ml-2 block text-sm font-bold text-slate-700 cursor-pointer">
                        Program Berulang (Recurring)
                      </label>
                    </div>
                    
                    {isRecurring && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Kekerapan</label>
                           <select
                             value={recurrencePattern}
                             onChange={(e) => setRecurrencePattern(e.target.value)}
                             className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white font-medium text-slate-800 text-sm"
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
                            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: BUTIRAN LANJUT */}
            {activeTab === 'butiran' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Lokasi</label>
                  <input 
                    type="text" 
                    name="location" 
                    value={formData.location} 
                    onChange={handleChange}
                    placeholder="Cth: Masjid Sg Ular"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">PIC Program</label>
                    <input 
                      type="text" 
                      name="pic_program" 
                      value={formData.pic_program} 
                      onChange={handleChange}
                      placeholder="Nama pegawai / kumpulan"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Kumpulan Sasar</label>
                    <input 
                      type="text" 
                      name="participants" 
                      value={formData.participants || ''} 
                      onChange={handleChange}
                      placeholder="Cth: Jemaah / Awam / 50 orang"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Kos Program (RM)</label>
                  <input 
                    type="number" 
                    name="program_cost" 
                    min="0"
                    step="0.01"
                    value={formData.program_cost || ''} 
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Catatan Tambahan</label>
                  <textarea 
                    name="description" 
                    rows={3}
                    value={formData.description || ''} 
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none font-medium text-slate-800 text-sm"
                    placeholder="Maklumat tambahan berkenaan program..."
                  ></textarea>
                </div>
              </div>
            )}

            {/* TAB 3: KUTIPAN */}
            {activeTab === 'kutipan' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Senarai Kutipan</h3>
                    <p className="text-[10px] text-slate-500">Rekod kutipan zakat atau wakaf untuk program ini.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={addCollection} 
                    className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg font-bold transition-all shadow-xs shrink-0"
                  >
                    + Tambah Kutipan
                  </button>
                </div>
                
                <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                  {(formData.collections || []).map((coll, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative animate-in slide-in-from-bottom-2 duration-150">
                      <button 
                        type="button" 
                        onClick={() => removeCollection(idx)} 
                        className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors border border-transparent hover:border-red-100 animate-none" 
                        title="Padam Kutipan"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-1 pr-6 sm:pr-0">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Jenis <span className="text-red-500">*</span></label>
                          <select required value={coll.collection_type} onChange={(e) => updateCollection(idx, 'collection_type', e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-white outline-none text-xs font-semibold text-slate-800">
                            <option value="Zakat">Zakat</option>
                            <option value="Wakaf">Wakaf</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Amaun (RM) <span className="text-red-500">*</span></label>
                          <input type="number" required min="0" step="0.01" value={coll.amount !== undefined && coll.amount !== null ? coll.amount : ''} onChange={(e) => updateCollection(idx, 'amount', e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-semibold text-slate-800" placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Bil. Pembayar <span className="text-red-500">*</span></label>
                          <input type="number" required min="1" step="1" value={coll.payers_count !== undefined && coll.payers_count !== null ? coll.payers_count : ''} onChange={(e) => updateCollection(idx, 'payers_count', e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-semibold text-slate-800" placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Cara Bayar <span className="text-red-500">*</span></label>
                          <select required value={coll.payment_type || ''} onChange={(e) => updateCollection(idx, 'payment_type', e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-white outline-none text-xs font-semibold text-slate-800">
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
                    <div className="text-center py-6 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-slate-400 text-xs font-medium">
                      Tiada rekod kutipan. Tekan butang "+ Tambah Kutipan"
                    </div>
                  )}
                </div>
              </div>
            )}

          </form>
        </div>

        {/* Footer Navigation Bar */}
        <div className="p-3 px-4 sm:p-4 sm:px-6 bg-slate-50 border-t border-slate-100 rounded-b-xl flex justify-between items-center shrink-0">
          <div>
            <button 
              type="button"
              onClick={onClose}
              className="text-xs sm:text-sm text-slate-500 hover:text-slate-800 font-semibold px-3 py-2 rounded-lg hover:bg-slate-200/50 transition-colors"
            >
              Batal
            </button>
          </div>
          
          <div className="flex gap-2.5">
            {activeTab !== 'asas' && (
              <button 
                type="button"
                onClick={() => {
                  if (activeTab === 'butiran') setActiveTab('asas');
                  if (activeTab === 'kutipan') setActiveTab('butiran');
                }}
                className="px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-slate-700 font-semibold hover:bg-slate-200 border border-slate-200 transition-colors text-xs sm:text-sm"
              >
                Kembali
              </button>
            )}
            
            {activeTab !== 'kutipan' ? (
              <button 
                type="button"
                onClick={handleNext}
                className="px-4 py-2 sm:px-5 sm:py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-xs transition-colors text-xs sm:text-sm"
              >
                Seterusnya
              </button>
            ) : (
              <button 
                type="submit"
                form="program-form"
                className="px-4 py-2 sm:px-5 sm:py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-xs transition-colors text-xs sm:text-sm"
              >
                Simpan Program
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
