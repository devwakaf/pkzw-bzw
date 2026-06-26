import React, { useMemo, useState } from "react";
import { Program, BzwSetting } from "../types";
import { format, parseISO, isToday, isBefore, isAfter, startOfDay } from "date-fns";
import { ms } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  ActivityIcon,
  CheckCircle2Icon,
  ClockIcon,
  MapIcon,
  XCircleIcon,
  WalletIcon,
  HandHeartIcon,
  TargetIcon,
  CalendarIcon,
  MapPinIcon,
  LayoutListIcon,
  TrophyIcon
} from "lucide-react";

interface DashboardProps {
  programs: Program[];
  bzwSettings?: BzwSetting[];
}

type ProgramTab = 'Semua' | 'Akan Datang' | 'Sedang Berlangsung' | 'Selesai' | 'Batal';

export default function Dashboard({ programs, bzwSettings }: DashboardProps) {
  const [programTab, setProgramTab] = useState<ProgramTab>('Semua');

  const stats = useMemo(() => {
    const total = programs.length;
    const completed = programs.filter((p) => p.status === "Selesai").length;
    const planned = programs.filter(
      (p) => !p.status || p.status === "Dirancang",
    ).length;
    const cancelled = programs.filter((p) => p.status === "Batal").length;

    let zakatSum = 0;
    let wakafSum = 0;
    let kempenDigitalSum = 0;
    let zakatParticipants = 0;
    let wakafParticipants = 0;
    
    // Segment Stats
    let zakatPbkSum = 0, zakatPbkCount = 0;
    let zakatPzbSum = 0, zakatPzbCount = 0;
    let zakatDigitalSum = 0, zakatDigitalCount = 0;
    
    let wakafPbkSum = 0, wakafPbkCount = 0;
    let wakafPgwSum = 0, wakafPgwCount = 0;
    let wakafDigitalSum = 0, wakafDigitalCount = 0;

    let zakatBaruSum = 0;
    let zakatBaruCount = 0;
    let zakatLamaSum = 0;
    let zakatLamaCount = 0;
    let wakafBaruSum = 0;
    let wakafBaruCount = 0;
    let wakafLamaSum = 0;
    let wakafLamaCount = 0;
    let digitalBaruSum = 0;
    let digitalBaruCount = 0;
    let digitalLamaSum = 0;
    let digitalLamaCount = 0;
    const activityCollectionStats: Record<
      string,
      { name: string; value: number; participants: number }
    > = {};
    const zoneCollectionStats: Record<
      string,
      { zone: string; Zakat: number; Wakaf: number }
    > = {};
    const zoneCount: Record<string, number> = {};
    const activityCount: Record<string, number> = {};

    programs.forEach((p) => {
      const activity = p.activityType || "Lain-lain";
      const zone = p.zone || "Lain-lain";

      // Init stats
      if (!activityCollectionStats[activity]) {
        activityCollectionStats[activity] = {
          name: activity,
          value: 0,
          participants: 0,
        };
      }
      if (!zoneCollectionStats[zone]) {
        zoneCollectionStats[zone] = { zone, Zakat: 0, Wakaf: 0 };
      }

      let programZakatSum = 0;
      let programWakafSum = 0;
      let programZakatParticipants = 0;
      let programWakafParticipants = 0;
      
      let pZakatBaruSum = 0;
      let pZakatBaruCount = 0;
      let pZakatLamaSum = 0;
      let pZakatLamaCount = 0;
      let pWakafBaruSum = 0;
      let pWakafBaruCount = 0;
      let pWakafLamaSum = 0;
      let pWakafLamaCount = 0;

      const isDigital = p.activityType?.toLowerCase().includes('kempen digital');

      (p.collections || []).forEach((c) => {
        const amount = Number(c.amount || 0);
        const payers = Number(c.payers_count || 0);
        const isBaru = c.payer_category === 'Baru';
        const isLama = c.payer_category === 'Lama';
        const isPotonganGaji = c.payment_type === 'Potongan Gaji';
        const isKaunter = isBaru && !isPotonganGaji && !isDigital;

        if (c.collection_type === "Zakat") {
          programZakatSum += amount;
          programZakatParticipants += payers;
          if (isBaru) { pZakatBaruSum += amount; pZakatBaruCount += payers; }
          if (isLama) { pZakatLamaSum += amount; pZakatLamaCount += payers; }
          
          if (isBaru) {
            if (isDigital) { zakatDigitalSum += amount; zakatDigitalCount += payers; }
            else if (isPotonganGaji) { zakatPzbSum += amount; zakatPzbCount += payers; }
            else { zakatPbkSum += amount; zakatPbkCount += payers; }
          }
        } else if (c.collection_type === "Wakaf") {
          programWakafSum += amount;
          programWakafParticipants += payers;
          if (isBaru) { pWakafBaruSum += amount; pWakafBaruCount += payers; }
          if (isLama) { pWakafLamaSum += amount; pWakafLamaCount += payers; }
          
          if (isBaru) {
            if (isDigital) { wakafDigitalSum += amount; wakafDigitalCount += payers; }
            else if (isPotonganGaji) { wakafPgwSum += amount; wakafPgwCount += payers; }
            else { wakafPbkSum += amount; wakafPbkCount += payers; }
          }
        }
      });

      zakatSum += programZakatSum;
      wakafSum += programWakafSum;
      
      zakatBaruSum += pZakatBaruSum;
      zakatBaruCount += pZakatBaruCount;
      zakatLamaSum += pZakatLamaSum;
      zakatLamaCount += pZakatLamaCount;
      wakafBaruSum += pWakafBaruSum;
      wakafBaruCount += pWakafBaruCount;
      wakafLamaSum += pWakafLamaSum;
      wakafLamaCount += pWakafLamaCount;
      
      if (p.activityType?.toLowerCase().includes('kempen digital')) {
        kempenDigitalSum += programZakatSum + programWakafSum;
        digitalBaruSum += pZakatBaruSum + pWakafBaruSum;
        digitalBaruCount += pZakatBaruCount + pWakafBaruCount;
        digitalLamaSum += pZakatLamaSum + pWakafLamaSum;
        digitalLamaCount += pZakatLamaCount + pWakafLamaCount;
      }
      zakatParticipants += programZakatParticipants;
      wakafParticipants += programWakafParticipants;

      activityCollectionStats[activity].value +=
        programZakatSum + programWakafSum;
      activityCollectionStats[activity].participants +=
        programZakatParticipants + programWakafParticipants;

      zoneCollectionStats[zone].Zakat += programZakatSum;
      zoneCollectionStats[zone].Wakaf += programWakafSum;

      // Zone & Activity Counts
      const safeZone = p.zone || "Tiada Zon";
      zoneCount[safeZone] = (zoneCount[safeZone] || 0) + 1;

      if (p.activityType) {
        activityCount[p.activityType] =
          (activityCount[p.activityType] || 0) + 1;
      }
    });

    const collectionDistribution = Object.values(
      activityCollectionStats,
    ).filter((d) => d.value > 0);
    const zoneCollectionData = Object.values(zoneCollectionStats);
    const zoneData = Object.entries(zoneCount).map(([name, value]) => ({
      name,
      value,
    }));
    const activityData = Object.entries(activityCount).map(([name, value]) => ({
      name,
      value,
    }));

    let zakatTargetSum = 0;
    let wakafTargetSum = 0;
    let kempenDigitalTargetSum = 0;
    let targetPbkZakatSum = 0;
    let targetPbkWakafSum = 0;
    let targetPzbSum = 0;
    let targetPgwSum = 0;
    let targetDigitalZakatSum = 0;
    let targetDigitalWakafSum = 0;
    
    let targetCountPbkZakat = 0;
    let targetCountPbkWakaf = 0;
    let targetCountPzb = 0;
    let targetCountPgw = 0;
    let targetCountDigitalZakat = 0;
    let targetCountDigitalWakaf = 0;

    if (bzwSettings) {
      bzwSettings.forEach(s => {
        zakatTargetSum += Number(s.zakat_target || 0);
        wakafTargetSum += Number(s.wakaf_target || 0);
        kempenDigitalTargetSum += Number(s.kempen_digital_target || 0);
        targetPbkZakatSum += Number(s.target_pbk_zakat || 0);
        targetPbkWakafSum += Number(s.target_pbk_wakaf || 0);
        targetPzbSum += Number(s.target_pzb || 0);
        targetPgwSum += Number(s.target_pgw || 0);
        targetDigitalZakatSum += Number(s.target_digital_zakat || 0);
        targetDigitalWakafSum += Number(s.target_digital_wakaf || 0);
        targetCountPbkZakat += Number(s.target_count_kaunter_zakat || 0);
        targetCountPbkWakaf += Number(s.target_count_kaunter_wakaf || 0);
        targetCountPzb += Number(s.target_count_pzb || 0);
        targetCountPgw += Number(s.target_count_pgw || 0);
        targetCountDigitalZakat += Number(s.target_count_digital_zakat || 0);
        targetCountDigitalWakaf += Number(s.target_count_digital_wakaf || 0);
      });
    }

    const sortedPrograms = [...programs].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      // sort descending
      return dateB - dateA; 
    });

    return {
      total,
      completed,
      planned,
      cancelled,
      zoneData,
      activityData,
      zakatSum,
      wakafSum,
      kempenDigitalSum,
      zakatTargetSum,
      wakafTargetSum,
      kempenDigitalTargetSum,
      targetPbkZakatSum,
      targetPbkWakafSum,
      targetPzbSum,
      targetPgwSum,
      targetDigitalZakatSum,
      targetDigitalWakafSum,
      targetCountPbkZakat,
      targetCountPbkWakaf,
      targetCountPzb,
      targetCountPgw,
      targetCountDigitalZakat,
      targetCountDigitalWakaf,
      collectionDistribution,
      zoneCollectionData,
      sortedPrograms,
      zakatPbkSum, zakatPbkCount,
      zakatPzbSum, zakatPzbCount,
      zakatDigitalSum, zakatDigitalCount,
      wakafPbkSum, wakafPbkCount,
      wakafPgwSum, wakafPgwCount,
      wakafDigitalSum, wakafDigitalCount,
      zakatBaruSum, zakatBaruCount, zakatLamaSum, zakatLamaCount,
      wakafBaruSum, wakafBaruCount, wakafLamaSum, wakafLamaCount,
      digitalBaruSum, digitalBaruCount, digitalLamaSum, digitalLamaCount,
    };
  }, [programs, bzwSettings]);

  const zoneColors: Record<string, string> = {
    HQ: "#1e293b", // slate-800
    "Zon Timur": "#2563eb", // blue-600
    "Zon Tengah": "#f59e0b", // amber-500
    "Zon Barat": "#059669", // emerald-600
  };

  const COLORS = [
    "#059669",
    "#3b82f6",
    "#f59e0b",
    "#6366f1",
    "#ec4899",
    "#8b5cf6",
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="bg-blue-50 text-blue-600 p-2 sm:p-3 rounded-lg flex-shrink-0">
            <ActivityIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-tighter sm:tracking-tight truncate">
              Jumlah Program
            </p>
            <p className="text-lg sm:text-xl font-bold text-slate-800">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="bg-amber-50 text-amber-600 p-2 sm:p-3 rounded-lg flex-shrink-0">
            <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-tighter sm:tracking-tight truncate">
              Dirancang
            </p>
            <p className="text-lg sm:text-xl font-bold text-slate-800">{stats.planned}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="bg-emerald-50 text-emerald-600 p-2 sm:p-3 rounded-lg flex-shrink-0">
            <CheckCircle2Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-tighter sm:tracking-tight truncate">
              Selesai
            </p>
            <p className="text-lg sm:text-xl font-bold text-slate-800">
              {stats.completed}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="bg-red-50 text-red-600 p-2 sm:p-3 rounded-lg flex-shrink-0">
            <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-tighter sm:tracking-tight truncate">
              Batal
            </p>
            <p className="text-lg sm:text-xl font-bold text-slate-800">
              {stats.cancelled}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-emerald-50 rounded-xl shadow-sm border border-emerald-200 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 text-emerald-600 p-3 rounded-lg shadow-sm">
              <WalletIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-emerald-600/80 uppercase tracking-tight">
                Kutipan Zakat
              </p>
              <div className="flex flex-col gap-0.5 mt-1">
                <p className="text-xl font-bold text-emerald-900 leading-none">
                  <span className="text-sm font-medium mr-1 text-emerald-700">Semasa:</span>
                  RM {stats.zakatSum.toLocaleString("en-MY", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <div className="flex justify-between items-end gap-2">
                  <p className="text-sm font-bold text-emerald-800/60 flex items-center mt-1 shrink min-w-0">
                    <TargetIcon className="w-3 h-3 shrink-0 mr-1" />
                    <span className="font-medium mr-1 hidden sm:inline">Target:</span>
                    <span className="truncate">RM {stats.zakatTargetSum.toLocaleString("en-MY", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</span>
                  </p>
                  {stats.zakatTargetSum > 0 && (
                    <p className="text-xl font-bold text-emerald-700 shrink-0">
                      {Math.round((stats.zakatSum / stats.zakatTargetSum) * 100)}%
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="w-full bg-emerald-200/50 rounded-full h-2.5 mt-1 overflow-hidden">
            <div 
              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${Math.min((stats.zakatSum / Math.max(stats.zakatTargetSum, 1)) * 100, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-emerald-200/50">
            <div className="flex justify-between items-center text-[10px] font-bold text-emerald-800">
              <span>Kaunter ({stats.zakatPbkCount} / {stats.targetCountPbkZakat} org)</span>
              <span className="text-right">RM {stats.zakatPbkSum.toLocaleString("en-MY")} / {stats.targetPbkZakatSum.toLocaleString("en-MY")}</span>
            </div>
            <div className="w-full bg-emerald-200/50 rounded-full h-1 overflow-hidden mb-1 flex">
              <div className="bg-emerald-500 h-1" style={{ width: `${Math.min((stats.zakatPbkSum / Math.max(stats.targetPbkZakatSum, 1)) * 100, 100)}%` }}></div>
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-bold text-emerald-800">
              <span>PZB ({stats.zakatPzbCount} / {stats.targetCountPzb} org)</span>
              <span className="text-right">RM {stats.zakatPzbSum.toLocaleString("en-MY")} / {stats.targetPzbSum.toLocaleString("en-MY")}</span>
            </div>
            <div className="w-full bg-emerald-200/50 rounded-full h-1 overflow-hidden mb-1 flex">
              <div className="bg-emerald-500 h-1" style={{ width: `${Math.min((stats.zakatPzbSum / Math.max(stats.targetPzbSum, 1)) * 100, 100)}%` }}></div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold text-emerald-800">
              <span>Digital ({stats.zakatDigitalCount} / {stats.targetCountDigitalZakat} org)</span>
              <span className="text-right">RM {stats.zakatDigitalSum.toLocaleString("en-MY")} / {stats.targetDigitalZakatSum.toLocaleString("en-MY")}</span>
            </div>
            <div className="w-full bg-emerald-200/50 rounded-full h-1 overflow-hidden flex">
              <div className="bg-emerald-500 h-1" style={{ width: `${Math.min((stats.zakatDigitalSum / Math.max(stats.targetDigitalZakatSum, 1)) * 100, 100)}%` }}></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-emerald-200/50">
            <div className="bg-emerald-100/50 rounded p-2">
              <p className="text-[9px] text-emerald-600 font-bold uppercase mb-0.5">Pembayar Baru</p>
              <p className="text-[11px] font-bold text-emerald-900">{stats.zakatBaruCount} org</p>
              <p className="text-[10px] font-semibold text-emerald-700">RM {stats.zakatBaruSum.toLocaleString("en-MY")}</p>
            </div>
            <div className="bg-emerald-100/50 rounded p-2">
              <p className="text-[9px] text-emerald-600 font-bold uppercase mb-0.5">Pembayar Lama</p>
              <p className="text-[11px] font-bold text-emerald-900">{stats.zakatLamaCount} org</p>
              <p className="text-[10px] font-semibold text-emerald-700">RM {stats.zakatLamaSum.toLocaleString("en-MY")}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl shadow-sm border border-purple-200 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 text-purple-600 p-3 rounded-lg shadow-sm">
              <HandHeartIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-purple-600/80 uppercase tracking-tight">
                Kutipan Wakaf
              </p>
              <div className="flex flex-col gap-0.5 mt-1">
                <p className="text-xl font-bold text-purple-900 leading-none">
                  <span className="text-sm font-medium mr-1 text-purple-700">Semasa:</span>
                  RM {stats.wakafSum.toLocaleString("en-MY", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <div className="flex justify-between items-end gap-2">
                  <p className="text-sm font-bold text-purple-800/60 flex items-center mt-1 shrink min-w-0">
                    <TargetIcon className="w-3 h-3 shrink-0 mr-1" />
                    <span className="font-medium mr-1 hidden sm:inline">Target:</span>
                    <span className="truncate">RM {stats.wakafTargetSum.toLocaleString("en-MY", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</span>
                  </p>
                  {stats.wakafTargetSum > 0 && (
                    <p className="text-xl font-bold text-purple-700 shrink-0">
                      {Math.round((stats.wakafSum / stats.wakafTargetSum) * 100)}%
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="w-full bg-purple-200/50 rounded-full h-2.5 mt-1 overflow-hidden">
            <div 
              className="bg-purple-500 h-2.5 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${Math.min((stats.wakafSum / Math.max(stats.wakafTargetSum, 1)) * 100, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-purple-200/50">
            <div className="flex justify-between items-center text-[10px] font-bold text-purple-800">
              <span>Kaunter ({stats.wakafPbkCount} / {stats.targetCountPbkWakaf} org)</span>
              <span className="text-right">RM {stats.wakafPbkSum.toLocaleString("en-MY")} / {stats.targetPbkWakafSum.toLocaleString("en-MY")}</span>
            </div>
            <div className="w-full bg-purple-200/50 rounded-full h-1 overflow-hidden mb-1 flex">
              <div className="bg-purple-500 h-1" style={{ width: `${Math.min((stats.wakafPbkSum / Math.max(stats.targetPbkWakafSum, 1)) * 100, 100)}%` }}></div>
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-bold text-purple-800">
              <span>PGW ({stats.wakafPgwCount} / {stats.targetCountPgw} org)</span>
              <span className="text-right">RM {stats.wakafPgwSum.toLocaleString("en-MY")} / {stats.targetPgwSum.toLocaleString("en-MY")}</span>
            </div>
            <div className="w-full bg-purple-200/50 rounded-full h-1 overflow-hidden mb-1 flex">
              <div className="bg-purple-500 h-1" style={{ width: `${Math.min((stats.wakafPgwSum / Math.max(stats.targetPgwSum, 1)) * 100, 100)}%` }}></div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold text-purple-800">
              <span>Digital ({stats.wakafDigitalCount} / {stats.targetCountDigitalWakaf} org)</span>
              <span className="text-right">RM {stats.wakafDigitalSum.toLocaleString("en-MY")} / {stats.targetDigitalWakafSum.toLocaleString("en-MY")}</span>
            </div>
            <div className="w-full bg-purple-200/50 rounded-full h-1 overflow-hidden flex">
              <div className="bg-purple-500 h-1" style={{ width: `${Math.min((stats.wakafDigitalSum / Math.max(stats.targetDigitalWakafSum, 1)) * 100, 100)}%` }}></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-purple-200/50">
            <div className="bg-purple-100/50 rounded p-2">
              <p className="text-[9px] text-purple-600 font-bold uppercase mb-0.5">Pembayar Baru</p>
              <p className="text-[11px] font-bold text-purple-900">{stats.wakafBaruCount} org</p>
              <p className="text-[10px] font-semibold text-purple-700">RM {stats.wakafBaruSum.toLocaleString("en-MY")}</p>
            </div>
            <div className="bg-purple-100/50 rounded p-2">
              <p className="text-[9px] text-purple-600 font-bold uppercase mb-0.5">Pembayar Lama</p>
              <p className="text-[11px] font-bold text-purple-900">{stats.wakafLamaCount} org</p>
              <p className="text-[10px] font-semibold text-purple-700">RM {stats.wakafLamaSum.toLocaleString("en-MY")}</p>
            </div>
          </div>
        </div>

        <div className="bg-rose-50 rounded-xl shadow-sm border border-rose-200 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className="bg-rose-100 text-rose-600 p-3 rounded-lg shadow-sm">
              <LayoutListIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-rose-600/80 uppercase tracking-tight">
                Kempen Digital
              </p>
              <div className="flex flex-col gap-0.5 mt-1">
                <p className="text-xl font-bold text-rose-900 leading-none">
                  <span className="text-sm font-medium mr-1 text-rose-700">Semasa:</span>
                  RM {stats.kempenDigitalSum.toLocaleString("en-MY", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <div className="flex justify-between items-end gap-2">
                  <p className="text-sm font-bold text-rose-800/60 flex items-center mt-1 shrink min-w-0">
                    <TargetIcon className="w-3 h-3 shrink-0 mr-1" />
                    <span className="font-medium mr-1 hidden sm:inline">Target:</span>
                    <span className="truncate">RM {stats.kempenDigitalTargetSum.toLocaleString("en-MY", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</span>
                  </p>
                  {stats.kempenDigitalTargetSum > 0 && (
                    <p className="text-xl font-bold text-rose-700 shrink-0">
                      {Math.round((stats.kempenDigitalSum / stats.kempenDigitalTargetSum) * 100)}%
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="w-full bg-rose-200/50 rounded-full h-2.5 mt-1 overflow-hidden">
            <div 
              className="bg-rose-500 h-2.5 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${Math.min((stats.kempenDigitalSum / Math.max(stats.kempenDigitalTargetSum, 1)) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-rose-200/50">
            <div className="flex justify-between items-center text-[10px] font-bold text-rose-800">
              <span>Zakat ({stats.zakatDigitalCount} / {stats.targetCountDigitalZakat} org)</span>
              <span className="text-right">RM {stats.zakatDigitalSum.toLocaleString("en-MY")} / {stats.targetDigitalZakatSum.toLocaleString("en-MY")}</span>
            </div>
            <div className="w-full bg-rose-200/50 rounded-full h-1 overflow-hidden mb-1 flex">
              <div className="bg-rose-500 h-1" style={{ width: `${Math.min((stats.zakatDigitalSum / Math.max(stats.targetDigitalZakatSum, 1)) * 100, 100)}%` }}></div>
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-bold text-rose-800">
              <span>Wakaf ({stats.wakafDigitalCount} / {stats.targetCountDigitalWakaf} org)</span>
              <span className="text-right">RM {stats.wakafDigitalSum.toLocaleString("en-MY")} / {stats.targetDigitalWakafSum.toLocaleString("en-MY")}</span>
            </div>
            <div className="w-full bg-rose-200/50 rounded-full h-1 overflow-hidden flex">
              <div className="bg-rose-500 h-1" style={{ width: `${Math.min((stats.wakafDigitalSum / Math.max(stats.targetDigitalWakafSum, 1)) * 100, 100)}%` }}></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-rose-200/50">
            <div className="bg-rose-100/50 rounded p-2">
              <p className="text-[9px] text-rose-600 font-bold uppercase mb-0.5">Pembayar Baru</p>
              <p className="text-[11px] font-bold text-rose-900">{stats.digitalBaruCount} org</p>
              <p className="text-[10px] font-semibold text-rose-700">RM {stats.digitalBaruSum.toLocaleString("en-MY")}</p>
            </div>
            <div className="bg-rose-100/50 rounded p-2">
              <p className="text-[9px] text-rose-600 font-bold uppercase mb-0.5">Pembayar Lama</p>
              <p className="text-[11px] font-bold text-rose-900">{stats.digitalLamaCount} org</p>
              <p className="text-[10px] font-semibold text-rose-700">RM {stats.digitalLamaSum.toLocaleString("en-MY")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[350px] flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-emerald-600" /> Program Mengikut
            Zon
          </h3>
          {stats.zoneData.length > 0 ? (
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  data={stats.zoneData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                    {stats.zoneData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={zoneColors[entry.name] || "#059669"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Tiada data direkodkan
            </div>
          )}
        </div>

        {/* Activity Type Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-2 sm:mb-6 flex items-center gap-2">
            <ActivityIcon className="w-5 h-5 text-emerald-600" /> Pecahan Jenis
            Aktiviti
          </h3>
          {stats.activityData.length > 0 ? (
            <div className="flex-1 min-h-[350px] sm:min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={stats.activityData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stats.activityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px', paddingBottom: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Tiada jenis aktiviti direkodkan
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zakat & Wakaf Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[350px] flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ActivityIcon className="w-5 h-5 text-emerald-600" /> Trend Kutipan
            Mengikut Zon
          </h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={stats.zoneCollectionData}
                margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="zone"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickFormatter={(value) =>
                    value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
                  }
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) =>
                    `RM ${value.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  }
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar
                  dataKey="Zakat"
                  stackId="a"
                  fill="#059669"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="Wakaf"
                  stackId="a"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Collection Distribution Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-2 sm:mb-6 flex items-center gap-2">
            <WalletIcon className="w-5 h-5 text-emerald-600" /> Pecahan Kutipan
            Mengikut Aktiviti
          </h3>
          {stats.collectionDistribution.length > 0 ? (
            <div className="flex-1 min-h-[350px] sm:min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={stats.collectionDistribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stats.collectionDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `RM ${value.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${props.payload.participants} org)`,
                      name,
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px', paddingBottom: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Tiada kutipan direkodkan
            </div>
          )}
        </div>
      </div>

      {/* Senarai Program Terkini */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col mt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600" /> Senarai Program Terkini
          </h3>
          <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto no-scrollbar">
            {['Semua', 'Akan Datang', 'Sedang Berlangsung', 'Selesai', 'Batal'].map((tab) => (
              <button
                key={tab}
                onClick={() => setProgramTab(tab as ProgramTab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                  programTab === tab
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1 select-none">
          {(() => {
            const displayPrograms = stats.sortedPrograms.map(prog => {
              const progDate = parseISO(prog.date);
              const today = startOfDay(new Date());
              const progDay = startOfDay(progDate);
              const past = isBefore(progDay, today);
              const current = isToday(progDate);
              
              let visualStatus = 'Akan Datang';
              let statusClasses = 'bg-blue-50 text-blue-700 border-blue-200';
              
              if (prog.status === 'Batal') {
                visualStatus = 'Batal';
                statusClasses = 'bg-red-50 text-red-700 border-red-200';
              } else if (current) {
                visualStatus = 'Sedang Berlangsung';
                statusClasses = 'bg-amber-50 text-amber-700 border-amber-200';
              } else if (past) {
                visualStatus = 'Selesai';
                statusClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              }
              
              return { ...prog, visualStatus, statusClasses, progDate };
            }).filter(prog => {
              if (programTab === 'Semua') return true;
              return prog.visualStatus === programTab;
            });

            if (displayPrograms.length === 0) return <div className="text-center text-slate-400 text-sm py-8">Tiada program direkodkan untuk kategori ini.</div>;

            return displayPrograms.map((prog, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{prog.title}</h4>
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${prog.statusClasses}`}>
                      {prog.visualStatus}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium">{format(prog.progDate, "dd MMM yyyy", { locale: ms })} • {prog.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium truncate max-w-[150px]">{prog.location || '-'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">{prog.zone}</span>
                    </div>
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
