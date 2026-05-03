import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PlusIcon, EditIcon, Trash2Icon, UserIcon, ShieldIcon, AlertCircleIcon, TrashIcon } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'admin', name: '' });

  const [modal, setModal] = useState<{ isOpen: boolean; type: 'alert' | 'delete'; title: string; message: string; payload?: string }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat naik pengguna');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (user: any = null) => {
    setEditingUser(user);
    if (user) {
      setFormData({ username: user.username, password: '', role: user.role, name: user.name });
    } else {
      setFormData({ username: '', password: '', role: 'admin', name: '' });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
      } else {
        await api.addUser(formData);
      }
      setIsFormOpen(false);
      fetchUsers();
    } catch (err: any) {
      setModal({ isOpen: true, type: 'alert', title: 'Ralat', message: err.message || 'Ralat menyimpan pengguna' });
    }
  };

  const handleDelete = (id: string, role: string) => {
    if (role === 'superadmin') {
      setModal({ isOpen: true, type: 'alert', title: 'Akses Ditolak', message: 'Tidak boleh memadam pengguna superadmin!' });
      return;
    }
    setModal({ isOpen: true, type: 'delete', title: 'Pengesahan Padam', message: 'Pasti mahu memadam pengguna ini?', payload: id });
  };

  const confirmDelete = async () => {
    if (!modal.payload) return;
    try {
      setModal({ ...modal, isOpen: false });
      await api.deleteUser(modal.payload);
      fetchUsers();
    } catch (err: any) {
      setTimeout(() => {
        setModal({ isOpen: true, type: 'alert', title: 'Ralat', message: err.message || 'Ralat memadam pengguna' });
      }, 300);
    }
  };

  const closeModal = () => setModal({ ...modal, isOpen: false });

  if (loading && users.length === 0) return <div className="p-6">Memuatkan...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-emerald-600" /> Pengurusan Pengguna (Superadmin)
          </h2>
          <p className="text-sm text-slate-500 mt-1">Urus akses dan pendaftaran pengguna sistem.</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" /> Tambah Pengguna
        </button>
      </div>

      {error && (
        <div className="m-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Nama Penuh</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">Peranan</th>
              <th className="px-6 py-4">Tarikh Didaftar</th>
              <th className="px-6 py-4 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800">{user.name}</td>
                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{user.username}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'admin' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {user.role === 'superadmin' && <ShieldIcon className="w-3 h-3" />}
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button
                    onClick={() => handleOpenForm(user)}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Kemaskini"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                  {user.role !== 'superadmin' && (
                    <button
                      onClick={() => handleDelete(user.id, user.role)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Padam"
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">
                  Tiada rekod pengguna.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {editingUser ? 'Kemaskini Pengguna' : 'Tambah Pengguna Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Penuh</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full rounded-lg border-slate-200 p-2.5 border focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full rounded-lg border-slate-200 p-2.5 border focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kata Laluan {editingUser && '(Kosongkan jika tidak tukar)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full rounded-lg border-slate-200 p-2.5 border focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Peranan</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full rounded-lg border-slate-200 p-2.5 border focus:border-emerald-500 focus:ring-emerald-500"
                  disabled={editingUser && editingUser.role === 'superadmin'}
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirmation/Alert Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm shadow-2xl">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
            <div className={`p-4 ${modal.type === 'alert' ? 'bg-amber-500' : 'bg-red-600'} text-white flex items-start gap-3`}>
              <div className="bg-white/20 p-2 rounded-lg shrink-0 mt-0.5 border border-white/10 shadow-sm">
                {modal.type === 'alert' ? <AlertCircleIcon className="w-5 h-5" /> : <TrashIcon className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">{modal.title}</h3>
                <p className="text-sm font-medium mt-1 leading-snug">
                  {modal.message}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={closeModal}
                className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold text-sm shadow-sm transition-colors"
              >
                {modal.type === 'alert' ? 'Tutup' : 'Batal'}
              </button>
              {modal.type === 'delete' && (
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 px-4 rounded-lg font-bold text-sm shadow-sm transition-colors text-white bg-red-600 hover:bg-red-700 shadow-red-500/20"
                >
                  Ya, Padam
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
