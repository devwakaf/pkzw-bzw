import { Program, ActivityCategory } from '../types';

const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('bzw_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  login: async (credentials: any) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },
  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  // Users Management (Superadmin)
  getUsers: async () => {
    const res = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },
  addUser: async (user: any) => {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(user)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add user');
    }
    return res.json();
  },
  updateUser: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update user');
    }
    return res.json();
  },
  deleteUser: async (id: string) => {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete user');
    return res.json();
  },

  // Database Setup
  setupDb: async () => {
    const res = await fetch(`${API_BASE}/db/setup`, { 
        method: 'POST',
        headers: getHeaders() 
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to setup DB (Status ${res.status})`);
    }
    return res.json();
  },

  // Categories
  getCategories: async (): Promise<ActivityCategory[]> => {
    const res = await fetch(`${API_BASE}/categories`, { headers: getHeaders() });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error("Unauthorized");
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch categories (Status ${res.status})`);
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error('Expected array from API for categories, got:', data);
      return [];
    }
    return data;
  },
  addCategory: async (category: ActivityCategory) => {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(category)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add category');
    }
    return res.json();
  },
  updateCategory: async (id: string, name: string) => {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update category');
    }
    return res.json();
  },
  deleteCategory: async (id: string) => {
    const res = await fetch(`${API_BASE}/categories/${id}`, { 
        method: 'DELETE',
        headers: getHeaders() 
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete category');
    }
    return res.json();
  },

  // Programs
  getPrograms: async (): Promise<Program[]> => {
    const res = await fetch(`${API_BASE}/programs`, { headers: getHeaders() });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error("Unauthorized");
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch programs (Status ${res.status})`);
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error('Expected array from API, got:', data);
      return [];
    }
    return data.map((p: any) => ({
      ...p,
      date: typeof p.date === 'string' ? p.date.split('T')[0] : p.date // MySQL returns ISO date or object, we need YYYY-MM-DD
    }));
  },
  addProgram: async (program: Program) => {
    const res = await fetch(`${API_BASE}/programs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(program)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add program');
    }
    return res.json();
  },
  updateProgram: async (id: string, program: Program) => {
    const res = await fetch(`${API_BASE}/programs/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(program)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update program');
    }
    return res.json();
  },
  deleteProgram: async (id: string) => {
    const res = await fetch(`${API_BASE}/programs/${id}`, { 
        method: 'DELETE',
        headers: getHeaders() 
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete program');
    }
    return res.json();
  },

  // BZW Settings
  getBzwSettings: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/bzw-settings`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch settings");
    return res.json();
  },
  saveBzwSetting: async (year: number, start_date: string, end_date: string, hijri_year?: string) => {
    const res = await fetch(`${API_BASE}/bzw-settings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ year, start_date, end_date, hijri_year })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save setting');
    }
    return res.json();
  },
  deleteBzwSetting: async (year: number) => {
    const res = await fetch(`${API_BASE}/bzw-settings/${year}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete setting');
    }
    return res.json();
  }
};
