import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ActivityCategory } from '../types';
import { TrashIcon, Edit2Icon, CheckIcon, XIcon, PlusIcon, TagIcon } from 'lucide-react';

interface CategoryManagerProps {
  categories: ActivityCategory[];
  onUpdate: (categories: ActivityCategory[]) => void;
}

export default function CategoryManager({ categories, onUpdate }: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; categoryId: string | null; name: string }>({
    isOpen: false,
    categoryId: null,
    name: ''
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    const newCategory: ActivityCategory = {
      id: uuidv4(),
      name: newCategoryName.trim()
    };
    
    onUpdate([...categories, newCategory]);
    setNewCategoryName('');
  };

  const openDeleteModal = (category: ActivityCategory) => {
    setDeleteModal({ isOpen: true, categoryId: category.id, name: category.name });
  };

  const confirmDelete = () => {
    if (deleteModal.categoryId) {
      onUpdate(categories.filter(c => c.id !== deleteModal.categoryId));
    }
    setDeleteModal({ isOpen: false, categoryId: null, name: '' });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, categoryId: null, name: '' });
  };

  const startEdit = (category: ActivityCategory) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) return;
    onUpdate(categories.map(c => c.id === id ? { ...c, name: editName.trim() } : c));
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-3xl mx-auto">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-emerald-600" />
            Pengurusan Kategori Aktiviti
          </h2>
          <p className="text-sm text-slate-500 mt-1">Tambah, kemaskini atau padam kategori untuk borang program.</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Add New */}
        <form onSubmit={handleAdd} className="flex gap-3">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nama kategori baru (Cth: Ceramah Perdana)"
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-700"
          />
          <button
            type="submit"
            disabled={!newCategoryName.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <PlusIcon className="w-4 h-4" /> Tambah
          </button>
        </form>

        {/* List */}
        <div className="border border-slate-100 rounded-lg divide-y divide-slate-100">
          {(!categories || categories.length === 0) ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Tiada kategori direkodkan. Sila tambah kategori baru.
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                {editingId === category.id ? (
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-emerald-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-800"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(category.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <button onClick={() => saveEdit(category.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded" title="Simpan">
                      <CheckIcon className="w-4 h-4" />
                    </button>
                    <button onClick={cancelEdit} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded" title="Batal">
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium text-slate-700">{category.name}</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => startEdit(category)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Kemaskini"
                      >
                        <Edit2Icon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openDeleteModal(category)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Padam"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm shadow-2xl">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="p-4 bg-red-600 text-white flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-lg shrink-0 mt-0.5 border border-white/10 shadow-sm">
                <TrashIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Pengesahan Padam</h3>
                <p className="text-white/80 text-xs mt-1 font-bold uppercase tracking-wider mb-2">
                  Padam Kategori
                </p>
                <p className="text-sm font-medium mt-1 leading-snug">
                  "{deleteModal.name}"
                </p>
              </div>
            </div>
            
            <div className="p-6 text-center text-slate-600 text-sm font-medium leading-relaxed">
              Adakah anda pasti untuk memadam kategori ini? Program yang menggunakan kategori ini mungkin terjejas.
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={closeDeleteModal}
                className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold text-sm shadow-sm transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-2.5 px-4 rounded-lg font-bold text-sm shadow-sm transition-colors text-white bg-red-600 hover:bg-red-700 shadow-red-500/20"
              >
                Ya, Padam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
