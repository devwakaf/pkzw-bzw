import React, { useState, useEffect } from 'react';
import { CalendarIcon, FileTextIcon, HomeIcon, PlusIcon, SettingsIcon, CheckCircle2Icon, AlertCircleIcon, XIcon, LogOutIcon, ListIcon, Trash2Icon, ShieldCheckIcon, KeyIcon, MenuIcon } from 'lucide-react';
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

const NavButton = ({ active, onClick, icon, label, isOpen }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; isOpen: boolean }) => (
  <button
    onClick={onClick}
    className={`w-full py-2.5 px-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-emerald-800 text-white shadow-inner'
        : 'text-emerald-100/70 hover:bg-emerald-800/50 hover:text-white'
    }`}
    title={!isOpen ? label : undefined}
  >
    {icon}
    {isOpen && <span className="whitespace-nowrap">{label}</span>}
  </button>
);

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      const res = await fetch(`/api/programs/${encodeURIComponent(deleteProgramId)}`, {
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
      const res = await fetch(`/api/programs/recover/${encodeURIComponent(id)}`, {
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
      const res = await fetch(`/api/programs/hard/${encodeURIComponent(id)}`, {
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

  const handleTabClick = (tab: any) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex overflow-hidden print:overflow-visible print:bg-white print:block">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 md:relative md:flex flex-col bg-emerald-900 text-white transition-all duration-300 ease-in-out shrink-0 shadow-xl print:hidden h-screen ${
          isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'
        }`}
      >
        {/* Logo/Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-emerald-800 shrink-0">
          <div className={`flex items-center gap-3 overflow-hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
            <div className="bg-gradient-to-br from-white/20 to-white/5 p-0.5 rounded-md shrink-0 border border-white/20 shadow-inner">
              <div className="bg-emerald-950/60 px-1.5 py-0.5 rounded flex items-center justify-center border border-white/5">
                <span className="font-black text-sm tracking-tighter bg-gradient-to-b from-white to-emerald-200 bg-clip-text text-transparent">BZW</span>
              </div>
            </div>
            <div className="whitespace-nowrap">
              <h1 className="text-sm font-bold tracking-tight leading-none">Sistem BZW 2026</h1>
            </div>
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-emerald-800 rounded-md text-emerald-100 transition-colors mx-auto shrink-0"
            title={isSidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
          >
            <MenuIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-3 custom-scrollbar">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => handleTabClick('dashboard')} 
            icon={<HomeIcon className="w-5 h-5 shrink-0" />} 
            label="Utama" 
            isOpen={isSidebarOpen} 
          />
          <NavButton 
            active={activeTab === 'calendar'} 
            onClick={() => handleTabClick('calendar')} 
            icon={<CalendarIcon className="w-5 h-5 shrink-0" />} 
            label="Kalendar" 
            isOpen={isSidebarOpen} 
          />
          <NavButton 
            active={activeTab === 'reports'} 
            onClick={() => handleTabClick('reports')} 
            icon={<FileTextIcon className="w-5 h-5 shrink-0" />} 
            label="Laporan" 
            isOpen={isSidebarOpen} 
          />
          {user && (
            <NavButton 
              active={activeTab === 'categories'} 
              onClick={() => handleTabClick('categories')} 
              icon={<ListIcon className="w-5 h-5 shrink-0" />} 
              label="Kategori" 
              isOpen={isSidebarOpen} 
            />
          )}
          {user?.role === 'superadmin' && (
            <NavButton 
              active={activeTab === 'trash'} 
              onClick={() => handleTabClick('trash')} 
              icon={<Trash2Icon className="w-5 h-5 shrink-0" />} 
              label="Sampah" 
              isOpen={isSidebarOpen} 
            />
          )}
          {user?.role === 'superadmin' && (
            <NavButton 
              active={activeTab === 'settings'} 
              onClick={() => handleTabClick('settings')} 
              icon={<SettingsIcon className="w-5 h-5 shrink-0" />} 
              label="Tetapan" 
              isOpen={isSidebarOpen} 
            />
          )}
        </div>

        {/* User / Actions Footer */}
        <div className="p-4 border-t border-emerald-800 flex flex-col gap-3 shrink-0">
          {user ? (
            <>
              {isSidebarOpen && (
                <div className="px-2 pb-2 border-b border-emerald-800">
                  <p className="text-xs text-emerald-300 font-medium">Log masuk sebagai</p>
                  <p className="text-sm font-bold text-white truncate">{user.name}</p>
                </div>
              )}
              
              <button
                onClick={() => {
                  setEditingProgram(null);
                  setIsFormOpen(true);
                }}
                className={`bg-emerald-500 hover:bg-emerald-400 py-2 rounded-md text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm border border-emerald-400/50 text-white ${!isSidebarOpen && 'px-0'}`}
                title="Rekod Aktiviti Baru"
              >
                <PlusIcon className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span>Rekod Baru</span>}
              </button>

              <button 
                onClick={logout} 
                className={`py-2 hover:bg-red-500/20 hover:text-red-300 rounded-md text-emerald-300/80 transition-colors flex items-center justify-center gap-2 ${!isSidebarOpen && 'px-0'}`}
                title="Log Keluar"
              >
                <LogOutIcon className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span className="text-xs font-bold uppercase tracking-wider">Keluar</span>}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className={`bg-emerald-700 hover:bg-emerald-600 py-2 rounded-md text-sm font-bold transition-colors border border-emerald-600/50 text-emerald-100 uppercase tracking-wider flex items-center justify-center gap-2 ${!isSidebarOpen && 'px-0'}`}
              title="Log Masuk"
            >
              <KeyIcon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span>Log Masuk</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
        {/* Mobile Header (Shows only on small screens) */}
        <header className="md:hidden bg-emerald-800 text-white h-16 flex items-center justify-between px-4 shrink-0 shadow-sm print:hidden z-20">
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1 hover:bg-emerald-700 rounded-md"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <div className="bg-emerald-900/40 px-1.5 py-0.5 rounded border border-white/5">
              <span className="font-black text-sm tracking-tighter text-white">BZW</span>
            </div>
            <h1 className="text-sm font-bold tracking-tight">Sistem BZW 2026</h1>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto w-full p-4 md:p-6 pb-24 relative custom-scrollbar print:overflow-visible print:p-0 print:pb-0">
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
            {activeTab === 'dashboard' && <Dashboard programs={programs} bzwSettings={bzwSettings} />}
            {activeTab === 'calendar' && <CalendarView programs={programs} user={user} onEdit={editProgram} onDelete={handleDeleteProgram} bzwSettings={bzwSettings} categories={categories} />}
            {activeTab === 'reports' && <ReportView programs={programs} user={user} onEdit={editProgram} onDelete={handleDeleteProgram} bzwSettings={bzwSettings} categories={categories} />}
            {activeTab === 'categories' && user && <CategoryManager categories={categories} onUpdate={handleCategoryUpdate} />}
            {activeTab === 'trash' && user?.role === 'superadmin' && <TrashView onRecover={handleRecoverProgram} onHardDelete={handleHardDeleteProgram} />}
            {activeTab === 'settings' && user && <SettingsView onSetupDb={handleSetupDb} bzwSettings={bzwSettings} refreshSettings={fetchData} />}
            {/* Fallback to dashboard if invalid state */}
            {!['dashboard', 'calendar', 'reports', 'categories', 'trash', 'settings'].includes(activeTab) && <Dashboard programs={programs} bzwSettings={bzwSettings} />}
          </div>
        </main>
      </div>

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
