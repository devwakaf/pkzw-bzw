export interface BzwSetting {
  year: number;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  hijri_year?: string;
  zakat_target?: number;
  wakaf_target?: number;
}

export type Zone = 'HQ' | 'Zon Timur' | 'Zon Tengah' | 'Zon Barat';

export interface ActivityCategory {
  id: string;
  name: string;
}

export interface ProgramCollection {
  id?: string;
  program_id?: string;
  collection_type: 'Zakat' | 'Wakaf';
  amount?: number;
  payers_count?: number;
  payment_type?: string;
}

export interface Program {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  zone: Zone;
  sector?: string; // 'Zakat' | 'Wakaf'
  activityType: string;
  pic_program: string;
  participants: string;
  description: string;
  createdAt: string;
  status?: string; // 'Dirancang' | 'Selesai' | 'Batal'
  program_cost?: number;
  collections?: ProgramCollection[];
  is_deleted?: number;
  deleted_by?: string;
  deleted_by_name?: string;
  deleted_at?: string;
}
