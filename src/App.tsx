import React, { useState, useEffect } from 'react';
import { CalendarIcon, FileTextIcon, HomeIcon, PlusIcon, SettingsIcon, CheckCircle2Icon, AlertCircleIcon, XIcon, LogOutIcon, ListIcon, Trash2Icon, ShieldCheckIcon, KeyIcon } from 'lucide-react';
import CalendarView from './components/CalendarView';
import ReportView from './components/ReportView';
import ProgramForm from './components/ProgramForm';
import Dashboard from './components/Dashboard';
import SettingsView from './components/SettingsView';
import CategoryManager from './components/CategoryManager';
import TrashView from './components/TrashView';
import Login from './components/Login';
import { Program, ActivityCategory } from './types';
import { api } from './services/api';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'reports' | 'categories' | 'settings' | 'trash'>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [bzwSettings, setBzwSettings] = useState<any[]>([]);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [deleteProgramId, setDeleteProgramId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    setActiveTab('dashboard');
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedPrograms, fetchedCategories, fetchedSettings] = await Promise.all([
        api.getPrograms(),
        api.getCategories(),
        api.getBzwSettings().catch(() => []) // Silent catch in case of error
      ]);
      setPrograms(fetchedPrograms || []);
      setCategories(fetchedCategories || []);
      setBzwSettings(fetchedSettings || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      showToast(error.message || "Ralat menyambung ke pangkalan data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupDb = async () => {
    try {
      setLoading(true);
      await api.setupDb();
      showToast("Setup pangkalan data berjaya! Sila tambah data.", "success");
      fetchData();
    } catch (error) {
      showToast("Setup gagal. Periksa log ralat.", "error");
      setLoading(false);
    }
  };

  const handleAddProgram = async (programData: Program | Program[]) => {
    try {
      const programs = Array.isArray(programData) ? programData : [programData];
      for (const p of programs) {
        await api.addProgram(p);
      }
      fetchData();
      setIsFormOpen(false);
      showToast(programs.length > 1 ? `${programs.length} Program berjaya ditambah!` : "Program berjaya ditambah!", "success");
    } catch (error) {
      showToast("Gagal menambah program.", "error");
    }
  };

  const handleUpdateProgram = async (updatedProgram: Program | Program[]) => {
    try {
      if (Array.isArray(updatedProgram)) return;
      await api.updateProgram(updatedProgram.id, updatedProgram);
      fetchData();
      setIsFormOpen(false);
      setEditingProgram(null);
      showToast("Program berjaya dikemaskini!", "success");
    } catch (error) {
      showToast("Gagal mengemaskini program.", "error");
    }
  };

  const handleDeleteProgram = (id: string) => {
    setDeleteProgramId(id);
    setDeletePassword('');
  };

  const confirmDelete = async () => {
    if (!deleteProgramId || !deletePassword) return;
    
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('bzw_token');
      const res = await fetch(`/api/programs/${deleteProgramId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ password: deletePassword })
      });

      if (res.ok) {
        showToast("Program berjaya dipadam secara sementara dan dialihkan ke Bakul Sampah!", "success");
        setDeleteProgramId(null);
        setDeletePassword('');
        fetchData();
      } else {
        const error = await res.json();
        showToast(error.error || "Gagal memadam program.", "error");
      }
    } catch (error) {
      showToast("Ralat sistem semasa memadam.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRecoverProgram = async (id: string) => {
    try {
      const token = localStorage.getItem('bzw_token');
      const res = await fetch(`/api/programs/recover/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Program berjaya dipulihkan!", "success");
        fetchData();
      } else {
        showToast("Gagal memulihkan program.", "error");
      }
    } catch (error) {
       showToast("Ralat sistem semasa memulihkan.", "error");
    }
  };

  const handleHardDeleteProgram = async (id: string) => {
    try {
      const token = localStorage.getItem('bzw_token');
      const res = await fetch(`/api/programs/hard/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Program berjaya dipadam secara kekal!", "success");
        fetchData();
      } else {
        showToast("Gagal memadam secara kekal.", "error");
      }
    } catch (error) {
       showToast("Ralat sistem semasa memadam kekal.", "error");
    }
  };

  const handleCategoryUpdate = async (newCategories: ActivityCategory[]) => {
    try {
      setLoading(true);
      // Compare and apply changes
      const targetCategories = categories || [];
      const targetNewCategories = newCategories || [];
      const currentIds = targetCategories.map(c => c.id);
      const newIds = targetNewCategories.map(c => c.id);
  
      // Added
      for (const cat of targetNewCategories) {
        if (!currentIds.includes(cat.id)) {
          await api.addCategory(cat);
        }
      }
  
      // Deleted
      for (const cat of targetCategories) {
        if (!newIds.includes(cat.id)) {
          await api.deleteCategory(cat.id);
        }
      }
  
      // Updated
      for (const cat of targetNewCategories) {
        const existing = targetCategories.find(c => c.id === cat.id);
        if (existing && existing.name !== cat.name) {
          await api.updateCategory(cat.id, cat.name);
        }
      }
  
      await fetchData();
      showToast("Kategori berjaya dikemaskini!", "success");
    } catch (err) {
      showToast("Gagal mengemaskini kategori.", "error");
      setLoading(false);
    }
  };

  const editProgram = (program: Program) => {
    setEditingProgram(program);
    setIsFormOpen(true);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">Memuatkan sistem...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden print:overflow-visible print:bg-white">
      {/* Top Header & Navbar */}
      <header className="bg-emerald-800 text-white shadow-md z-20 shrink-0 print:hidden">
        <div className="px-6 md:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-white/20 to-white/5 p-0.5 rounded-lg shrink-0 border border-white/20 shadow-inner group transition-transform hover:scale-105">
              <div className="bg-emerald-900/40 px-2 py-1 rounded-md flex items-center justify-center border border-white/5">
                <span className="font-black text-xl tracking-tighter bg-gradient-to-b from-white to-emerald-200 bg-clip-text text-transparent drop-shadow-sm">BZW</span>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-tight">Sistem BZW 2026</h1>
              <p className="text-[10px] sm:text-xs text-emerald-100 opacity-90 uppercase tracking-widest mt-0.5">
                Bulan Zakat & Wakaf
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            {user ? (
              <>
                <span className="hidden md:inline text-emerald-100 text-sm opacity-90 border-r border-emerald-700 pr-3 mr-1">
                  Hi, {user.name}
                </span>
                <button
                  onClick={() => {
                    setEditingProgram(null);
                    setIsFormOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                >
                  <PlusIcon className="w-4 h-4" /> <span className="hidden sm:inline">Rekod Aktiviti</span>
                </button>
                <button 
                  onClick={logout} 
                  className="p-2 bg-emerald-700/50 hover:bg-red-600/20 hover:text-red-200 rounded-lg text-emerald-100 border border-emerald-600 transition-colors flex items-center gap-2 px-3"
                  title="Log Keluar"
                >
                  <LogOutIcon className="w-4 h-4" />
                  <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Keluar</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-emerald-700/50 hover:bg-emerald-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors border border-emerald-600 text-emerald-100 uppercase tracking-wider"
              >
                Log Masuk
              </button>
            )}
          </div>
        </div>
        
        {/* Navigation Bar */}
        <div className="bg-emerald-900/60 px-6 md:px-8 border-t border-emerald-700/50 flex gap-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 px-2 flex items-center gap-2 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-emerald-200 hover:text-white hover:border-emerald-400/50'
            }`}
          >
            <HomeIcon className="w-4 h-4" /> Utama
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-3 px-2 flex items-center gap-2 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'calendar'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-emerald-200 hover:text-white hover:border-emerald-400/50'
            }`}
          >
            <CalendarIcon className="w-4 h-4" /> Kalendar
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-3 px-2 flex items-center gap-2 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'reports'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-emerald-200 hover:text-white hover:border-emerald-400/50'
            }`}
          >
            <FileTextIcon className="w-4 h-4" /> Senarai & Laporan
          </button>
          {user && (
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-3 px-2 flex items-center gap-2 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'categories'
                  ? 'border-emerald-400 text-white'
                  : 'border-transparent text-emerald-200 hover:text-white hover:border-emerald-400/50'
              }`}
            >
              <ListIcon className="w-4 h-4" /> Senarai Kategori
            </button>
          )}
          {user?.role === 'superadmin' && (
            <button
              onClick={() => setActiveTab('trash')}
              className={`py-3 px-2 flex items-center gap-2 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'trash'
                  ? 'border-emerald-400 text-white'
                  : 'border-transparent text-emerald-200 hover:text-white hover:border-emerald-400/50'
              }`}
            >
              <Trash2Icon className="w-4 h-4" /> Bakul Sampah
            </button>
          )}
          {user?.role === 'superadmin' && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-3 px-2 flex items-center gap-2 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'settings'
                  ? 'border-emerald-400 text-white'
                  : 'border-transparent text-emerald-200 hover:text-white hover:border-emerald-400/50'
              }`}
            >
              <SettingsIcon className="w-4 h-4" /> {user ? 'Tetapan Sistem' : 'Log Masuk'}
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full p-4 md:p-6 pb-24 relative print:overflow-visible print:p-0 print:pb-0">
        {loading && (
          <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-sm z-30 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-500">Memuatkan data...</p>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white font-medium animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}>
            {toast.type === 'success' ? <CheckCircle2Icon className="w-5 h-5" /> : <AlertCircleIcon className="w-5 h-5" />}
            {toast.message}
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80">
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="max-w-[1600px] mx-auto">
          {activeTab === 'dashboard' ? (
            <Dashboard programs={programs} />
          ) : activeTab === 'calendar' ? (
            <CalendarView programs={programs} user={user} onEdit={editProgram} onDelete={handleDeleteProgram} bzwSettings={bzwSettings} />
          ) : activeTab === 'reports' ? (
            <ReportView programs={programs} user={user} onEdit={editProgram} onDelete={handleDeleteProgram} bzwSettings={bzwSettings} />
          ) : activeTab === 'categories' && user ? (
            <CategoryManager categories={categories} onUpdate={handleCategoryUpdate} />
          ) : activeTab === 'trash' && user?.role === 'superadmin' ? (
            <TrashView onRecover={handleRecoverProgram} onHardDelete={handleHardDeleteProgram} />
          ) : activeTab === 'settings' && user ? (
            <SettingsView onSetupDb={handleSetupDb} bzwSettings={bzwSettings} refreshSettings={fetchData} />
          ) : (
            <Dashboard programs={programs} />
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteProgramId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-red-600 p-6 text-white text-center">
              <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">Pengesahan Padam</h3>
              <p className="text-red-100 text-xs mt-1 font-bold uppercase tracking-wider opacity-80">
                Tindakan: Padam Sementara (Kemasuk Bakul Sampah)
              </p>
            </div>
            
            <div className="p-8">
              <p className="text-slate-600 text-sm mb-6 text-center font-medium">
                Sila masukkan kata laluan anda untuk mengesahkan pemadaman aktiviti ini.
              </p>
              
              <div className="space-y-4">
                <div className="relative">
                  <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    placeholder="Kata Laluan Anda"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && confirmDelete()}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all font-bold tracking-widest"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => {
                      setDeleteProgramId(null);
                      setDeletePassword('');
                    }}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={confirmDelete}
                    disabled={!deletePassword || isDeleting}
                    className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isDeleting ? 'Memadam...' : 'Sahkan Padam'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoginModalOpen && (
        <Login 
          onSuccess={handleLoginSuccess} 
          onClose={() => setIsLoginModalOpen(false)} 
        />
      )}

      {isFormOpen && (
        <ProgramForm
          program={editingProgram}
          categories={categories}
          onClose={() => {
            setIsFormOpen(false);
            setEditingProgram(null);
          }}
          onSubmit={editingProgram ? handleUpdateProgram : handleAddProgram}
        />
      )}
    </div>
  );
}

export default App;
