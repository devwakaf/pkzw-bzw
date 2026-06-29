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
    <div className="w-full space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-6 border-b border-slate-100 bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <TagIcon className="w-6 h-6 text-emerald-600" />
                Pengurusan Kategori
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Urus dan tambah kategori baru untuk digunakan dalam borang program.
              </p>
            </div>
            
            <form onSubmit={handleAdd} className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nama kategori baru..."
                className="flex-1 md:w-64 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm font-medium text-slate-700 transition-colors"
              />
              <button
                type="submit"
                disabled={!newCategoryName.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 text-sm font-bold transition-colors shadow-sm"
              >
                <PlusIcon className="w-4 h-4" /> <span className="hidden sm:inline">Tambah</span>
              </button>
            </form>
          </div>
        </div>

        <div className="p-6 bg-slate-50/50">
          {(!categories || categories.length === 0) ? (
            <div className="py-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                <TagIcon className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium">Tiada kategori direkodkan.</p>
              <p className="text-slate-400 text-sm mt-1">Sila tambah kategori baru di atas untuk bermula.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.map((category) => (
                <div key={category.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all group flex flex-col">
                  {editingId === category.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-1.5 border-2 border-emerald-500 rounded-lg focus:outline-none text-sm font-bold text-slate-800"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(category.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                      />
                      <button onClick={() => saveEdit(category.id)} className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors" title="Simpan">
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEdit} className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors" title="Batal">
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full h-full">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-600">
                          <TagIcon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-700 truncate" title={category.name}>{category.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => startEdit(category)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Kemaskini"
                        >
                          <Edit2Icon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(category)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Padam"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
