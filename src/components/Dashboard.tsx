import React, { useMemo, useState } from "react";
import { Program, BzwSetting } from "../types";
import {
  format,
  parseISO,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { ms } from "date-fns/locale";
import {
  ActivityIcon,
  CheckCircle2Icon,
  ClockIcon,
  MapIcon,
  XCircleIcon,
  WalletIcon,
  HandHeartIcon,
  CalendarIcon,
  MapPinIcon,
  LayoutListIcon,
  TrophyIcon,
} from "lucide-react";

interface DashboardProps {
  programs: Program[];
  bzwSettings?: BzwSetting[];
}

export default function Dashboard({ programs, bzwSettings }: DashboardProps) {
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    if (bzwSettings) bzwSettings.forEach((s) => years.add(s.year));
    programs.forEach((p) => {
      if (p.date) years.add(new Date(p.date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [programs, bzwSettings]);

  const [selectedYear, setSelectedYear] = useState<number | "Semua">("Semua");

  const stats = useMemo(() => {
    const filteredPrograms =
      selectedYear === "Semua"
        ? programs
        : programs.filter(
            (p) => p.date && new Date(p.date).getFullYear() === selectedYear,
          );
    const filteredSettings =
      selectedYear === "Semua"
        ? bzwSettings
        : bzwSettings?.filter((s) => s.year === selectedYear);

    const total = filteredPrograms.length;
    const completed = filteredPrograms.filter(
      (p) => p.status === "Selesai",
    ).length;
    const planned = filteredPrograms.filter(
      (p) => !p.status || p.status === "Dirancang",
    ).length;
    const cancelled = filteredPrograms.filter(
      (p) => p.status === "Batal",
    ).length;

    let zakatSum = 0;
    let wakafSum = 0;
    let kempenDigitalSum = 0;
    let zakatParticipants = 0;
    let wakafParticipants = 0;

    // Segment Stats
    let zakatPbkSum = 0,
      zakatPbkCount = 0;
    let zakatPzbSum = 0,
      zakatPzbCount = 0;
    let zakatDigitalSum = 0,
      zakatDigitalCount = 0;

    let wakafPbkSum = 0,
      wakafPbkCount = 0;
    let wakafPgwSum = 0,
      wakafPgwCount = 0;
    let wakafDigitalSum = 0,
      wakafDigitalCount = 0;

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
      {
        name: string;
        value: number;
        participants: number;
        Zakat: number;
        Wakaf: number;
      }
    > = {};
    const zoneCollectionStats: Record<
      string,
      { zone: string; Zakat: number; Wakaf: number }
    > = {};
    const zoneStats: Record<string, { total: number; completed: number }> = {};
    const activityStats: Record<string, { total: number; completed: number }> =
      {};

    filteredPrograms.forEach((p) => {
      const activity = p.activityType || "Lain-lain";
      const zone = p.zone || "Lain-lain";

      // Init stats
      if (!activityCollectionStats[activity]) {
        activityCollectionStats[activity] = {
          name: activity,
          value: 0,
          participants: 0,
          Zakat: 0,
          Wakaf: 0,
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

      const isDigital = p.activityType
        ?.toLowerCase()
        .includes("kempen digital");

      (p.collections || []).forEach((c) => {
        const amount = Number(c.amount || 0);
        const payers = Number(c.payers_count || 0);
        const isBaru = c.payer_category === "Baru";
        const isLama = c.payer_category === "Lama";
        const isPotonganGaji = c.payment_type === "Potongan Gaji";
        const isKaunter = isBaru && !isPotonganGaji && !isDigital;

        if (c.collection_type === "Zakat") {
          programZakatSum += amount;
          programZakatParticipants += payers;
          if (isBaru) {
            pZakatBaruSum += amount;
            pZakatBaruCount += payers;
          }
          if (isLama) {
            pZakatLamaSum += amount;
            pZakatLamaCount += payers;
          }

          if (isBaru) {
            if (isDigital) {
              zakatDigitalSum += amount;
              zakatDigitalCount += payers;
            } else if (isPotonganGaji) {
              zakatPzbSum += amount;
              zakatPzbCount += payers;
            } else {
              zakatPbkSum += amount;
              zakatPbkCount += payers;
            }
          }
        } else if (c.collection_type === "Wakaf") {
          programWakafSum += amount;
          programWakafParticipants += payers;
          if (isBaru) {
            pWakafBaruSum += amount;
            pWakafBaruCount += payers;
          }
          if (isLama) {
            pWakafLamaSum += amount;
            pWakafLamaCount += payers;
          }

          if (isBaru) {
            if (isDigital) {
              wakafDigitalSum += amount;
              wakafDigitalCount += payers;
            } else if (isPotonganGaji) {
              wakafPgwSum += amount;
              wakafPgwCount += payers;
            } else {
              wakafPbkSum += amount;
              wakafPbkCount += payers;
            }
          }
        }
      });

      if (p.activityType?.toLowerCase().includes("kempen digital")) {
        kempenDigitalSum += programZakatSum + programWakafSum;
        digitalBaruSum += pZakatBaruSum + pWakafBaruSum;
        digitalBaruCount += pZakatBaruCount + pWakafBaruCount;
        digitalLamaSum += pZakatLamaSum + pWakafLamaSum;
        digitalLamaCount += pZakatLamaCount + pWakafLamaCount;
      } else {
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

        zakatParticipants += programZakatParticipants;
        wakafParticipants += programWakafParticipants;
      }

      activityCollectionStats[activity].value +=
        programZakatSum + programWakafSum;
      activityCollectionStats[activity].participants +=
        programZakatParticipants + programWakafParticipants;
      activityCollectionStats[activity].Zakat += programZakatSum;
      activityCollectionStats[activity].Wakaf += programWakafSum;

      zoneCollectionStats[zone].Zakat += programZakatSum;
      zoneCollectionStats[zone].Wakaf += programWakafSum;

      // Zone & Activity Counts
      const safeZone = p.zone || "Tiada Zon";
      if (!zoneStats[safeZone]) {
        zoneStats[safeZone] = { total: 0, completed: 0 };
      }
      zoneStats[safeZone].total += 1;
      if (p.status === "Selesai") {
        zoneStats[safeZone].completed += 1;
      }

      if (p.activityType) {
        if (!activityStats[p.activityType]) {
          activityStats[p.activityType] = { total: 0, completed: 0 };
        }
        activityStats[p.activityType].total += 1;
        if (p.status === "Selesai") {
          activityStats[p.activityType].completed += 1;
        }
      }
    });

    const collectionDistribution = Object.values(
      activityCollectionStats,
    ).filter((d) => d.value > 0);
    const zoneCollectionData = Object.values(zoneCollectionStats);
    const zoneData = Object.entries(zoneStats).map(([name, stats]) => ({
      name,
      value: stats.total, // For sorting
      completed: stats.completed,
      total: stats.total,
    }));
    const activityData = Object.entries(activityStats).map(([name, stats]) => ({
      name,
      value: stats.total, // Total used for sorting/sizing
      completed: stats.completed,
      total: stats.total,
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

    if (filteredSettings) {
      filteredSettings.forEach((s) => {
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

    const sortedPrograms = [...filteredPrograms].sort((a, b) => {
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
      zakatPbkSum,
      zakatPbkCount,
      zakatPzbSum,
      zakatPzbCount,
      zakatDigitalSum,
      zakatDigitalCount,
      wakafPbkSum,
      wakafPbkCount,
      wakafPgwSum,
      wakafPgwCount,
      wakafDigitalSum,
      wakafDigitalCount,
      zakatBaruSum,
      zakatBaruCount,
      zakatLamaSum,
      zakatLamaCount,
      wakafBaruSum,
      wakafBaruCount,
      wakafLamaSum,
      wakafLamaCount,
      digitalBaruSum,
      digitalBaruCount,
      digitalLamaSum,
      digitalLamaCount,
    };
  }, [programs, bzwSettings, selectedYear]);

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

  const insights = useMemo(() => {
    const items = [];

    if (stats.zoneCollectionData.length > 0) {
      const highestZone = [...stats.zoneCollectionData].sort(
        (a, b) => b.Zakat + b.Wakaf - (a.Zakat + a.Wakaf),
      )[0];
      if (highestZone && highestZone.Zakat + highestZone.Wakaf > 0) {
        items.push({
          icon: "🔥",
          text: `${highestZone.zone} mencatatkan kutipan tertinggi keseluruhan sebanyak RM ${(highestZone.Zakat + highestZone.Wakaf).toLocaleString("en-MY")}.`,
        });
      }
    }

    if (stats.kempenDigitalTargetSum > 0) {
      const pct = Math.round(
        (stats.kempenDigitalSum / stats.kempenDigitalTargetSum) * 100,
      );
      if (pct >= 80) {
        items.push({
          icon: "🎯",
          text: `Tahniah, sasaran Kempen Digital telah mencapai ${pct}%!`,
        });
      }
    }

    const totalWakafBaruLama = stats.wakafBaruCount + stats.wakafLamaCount;
    if (totalWakafBaruLama > 0) {
      const pctBaru = Math.round(
        (stats.wakafBaruCount / totalWakafBaruLama) * 100,
      );
      if (pctBaru > 30) {
        items.push({
          icon: "💡",
          text: `${pctBaru}% penyumbang Wakaf adalah pembayar baharu.`,
        });
      }
    }

    if (stats.zakatTargetSum > 0) {
      const pct = Math.round((stats.zakatSum / stats.zakatTargetSum) * 100);
      if (pct >= 100) {
        items.push({
          icon: "⭐",
          text: `Sasaran Zakat keseluruhan telah dicapai sepenuhnya!`,
        });
      } else if (pct >= 50) {
        items.push({
          icon: "📈",
          text: `Prestasi Zakat berjalan lancar pada tahap ${pct}% dari sasaran.`,
        });
      }
    }

    if (items.length === 0) {
      items.push({
        icon: "📊",
        text: "Data sedang dikumpul. Teruskan usaha untuk mencapai sasaran.",
      });
    }

    return items;
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Papan Pemuka BZW
          </h2>
          <p className="text-sm text-slate-500">
            Ringkasan prestasi kutipan Zakat, Wakaf dan Kempen Digital.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-slate-400" />
          <select
            className="w-full sm:w-auto bg-white border border-slate-300 text-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm font-medium"
            value={selectedYear}
            onChange={(e) =>
              setSelectedYear(
                e.target.value === "Semua" ? "Semua" : parseInt(e.target.value),
              )
            }
          >
            <option value="Semua">Semua Tahun</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Master Progress Overview */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <TrophyIcon className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">
            Keseluruhan Pencapaian
          </p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
            <div>
              <p className="text-4xl font-extrabold tracking-tight">
                <span className="text-2xl text-slate-400 font-bold mr-1">
                  RM
                </span>
                {(
                  stats.zakatSum +
                  stats.wakafSum +
                  stats.kempenDigitalSum
                ).toLocaleString("en-MY", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm text-slate-400 font-medium">
                Sasaran Tahunan
              </p>
              <p className="text-lg font-bold text-slate-300">
                RM{" "}
                {(
                  stats.zakatTargetSum +
                  stats.wakafTargetSum +
                  stats.kempenDigitalTargetSum
                ).toLocaleString("en-MY", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          <div className="w-full bg-slate-700/50 rounded-full h-3 mt-5 overflow-hidden border border-slate-600/50 shadow-inner">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-3 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.min(((stats.zakatSum + stats.wakafSum + stats.kempenDigitalSum) / Math.max(stats.zakatTargetSum + stats.wakafTargetSum + stats.kempenDigitalTargetSum, 1)) * 100, 100)}%`,
              }}
            ></div>
          </div>

          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-slate-400">
              Pencapaian dari jumlah sasaran
            </p>
            {stats.zakatTargetSum +
              stats.wakafTargetSum +
              stats.kempenDigitalTargetSum >
              0 && (
              <p className="text-sm font-bold text-emerald-400">
                {Math.round(
                  ((stats.zakatSum + stats.wakafSum + stats.kempenDigitalSum) /
                    (stats.zakatTargetSum +
                      stats.wakafTargetSum +
                      stats.kempenDigitalTargetSum)) *
                    100,
                )}
                % capai
              </p>
            )}
          </div>
        </div>
      </div>

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
            <p className="text-lg sm:text-xl font-bold text-slate-800">
              {stats.total}
            </p>
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
            <p className="text-lg sm:text-xl font-bold text-slate-800">
              {stats.planned}
            </p>
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

      {/* Key Insights */}
      <div className="grid grid-cols-1 gap-4">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 items-start shadow-sm transition hover:shadow-md"
          >
            <span className="text-2xl leading-none">{insight.icon}</span>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {insight.text}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Zakat Card (Bento) */}
        <div className="bg-emerald-50 rounded-2xl shadow-sm border border-emerald-200 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-xl shadow-sm">
              <WalletIcon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide">
              Kutipan Zakat
            </h3>
          </div>

          <div>
            <p className="text-3xl font-extrabold text-emerald-900 tracking-tight">
              <span className="text-lg text-emerald-700 font-bold mr-1">
                RM
              </span>
              {stats.zakatSum.toLocaleString("en-MY", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] font-semibold text-emerald-700/70">
                Sasaran: RM{" "}
                {stats.zakatTargetSum.toLocaleString("en-MY", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              {stats.zakatTargetSum > 0 && (
                <span className="text-[10px] font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">
                  {Math.round((stats.zakatSum / stats.zakatTargetSum) * 100)}%
                </span>
              )}
            </div>
            <div className="w-full bg-emerald-200/50 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min((stats.zakatSum / Math.max(stats.zakatTargetSum, 1)) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-auto">
            <div className="bg-white/60 border border-emerald-100 rounded-xl p-3 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-emerald-600 uppercase mb-0.5">
                Kaunter (Baru)
              </p>
              <p className="text-xs font-bold text-emerald-900">
                RM {stats.zakatPbkSum.toLocaleString("en-MY")}{" "}
                <span className="text-[10px] text-emerald-700/80 font-medium">
                  / RM {stats.targetPbkZakatSum.toLocaleString("en-MY")}
                </span>
              </p>
              <div className="w-full bg-emerald-100 rounded-full h-1 mt-1 mb-1">
                <div
                  className="bg-emerald-400 h-1 rounded-full"
                  style={{
                    width: `${Math.min((stats.zakatPbkSum / Math.max(stats.targetPbkZakatSum, 1)) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-[9px] text-emerald-700 font-medium">
                {stats.zakatPbkCount} / {stats.targetCountPbkZakat} org
              </p>
            </div>
            <div className="bg-white/60 border border-emerald-100 rounded-xl p-3 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-emerald-600 uppercase mb-0.5">
                PZB (Baru)
              </p>
              <p className="text-xs font-bold text-emerald-900">
                RM {stats.zakatPzbSum.toLocaleString("en-MY")}{" "}
                <span className="text-[10px] text-emerald-700/80 font-medium">
                  / RM {stats.targetPzbSum.toLocaleString("en-MY")}
                </span>
              </p>
              <div className="w-full bg-emerald-100 rounded-full h-1 mt-1 mb-1">
                <div
                  className="bg-emerald-400 h-1 rounded-full"
                  style={{
                    width: `${Math.min((stats.zakatPzbSum / Math.max(stats.targetPzbSum, 1)) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-[9px] text-emerald-700 font-medium">
                {stats.zakatPzbCount} / {stats.targetCountPzb} org
              </p>
            </div>

            <div className="bg-emerald-600 text-white rounded-xl p-3 col-span-2 grid grid-cols-2 gap-4 shadow-sm">
              <div className="flex flex-col justify-center border-r border-emerald-500/50 pr-4">
                <p className="text-[9px] font-bold text-emerald-200 uppercase mb-0.5">
                  Pembayar Baru
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-xs font-bold">
                    {stats.zakatBaruCount} org
                  </p>
                  <p className="text-[10px] font-medium text-emerald-200">
                    RM {stats.zakatBaruSum.toLocaleString("en-MY")}
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center pl-1">
                <p className="text-[9px] font-bold text-emerald-200 uppercase mb-0.5">
                  Pembayar Lama
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-xs font-bold">
                    {stats.zakatLamaCount} org
                  </p>
                  <p className="text-[10px] font-medium text-emerald-200">
                    RM {stats.zakatLamaSum.toLocaleString("en-MY")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wakaf Card (Bento) */}
        <div className="bg-purple-50 rounded-2xl shadow-sm border border-purple-200 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 text-purple-600 p-2.5 rounded-xl shadow-sm">
              <HandHeartIcon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wide">
              Kutipan Wakaf
            </h3>
          </div>

          <div>
            <p className="text-3xl font-extrabold text-purple-900 tracking-tight">
              <span className="text-lg text-purple-700 font-bold mr-1">RM</span>
              {stats.wakafSum.toLocaleString("en-MY", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] font-semibold text-purple-700/70">
                Sasaran: RM{" "}
                {stats.wakafTargetSum.toLocaleString("en-MY", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              {stats.wakafTargetSum > 0 && (
                <span className="text-[10px] font-bold bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                  {Math.round((stats.wakafSum / stats.wakafTargetSum) * 100)}%
                </span>
              )}
            </div>
            <div className="w-full bg-purple-200/50 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-purple-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min((stats.wakafSum / Math.max(stats.wakafTargetSum, 1)) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-auto">
            <div className="bg-white/60 border border-purple-100 rounded-xl p-3 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-purple-600 uppercase mb-0.5">
                Kaunter (Baru)
              </p>
              <p className="text-xs font-bold text-purple-900">
                RM {stats.wakafPbkSum.toLocaleString("en-MY")}{" "}
                <span className="text-[10px] text-purple-700/80 font-medium">
                  / RM {stats.targetPbkWakafSum.toLocaleString("en-MY")}
                </span>
              </p>
              <div className="w-full bg-purple-100 rounded-full h-1 mt-1 mb-1">
                <div
                  className="bg-purple-400 h-1 rounded-full"
                  style={{
                    width: `${Math.min((stats.wakafPbkSum / Math.max(stats.targetPbkWakafSum, 1)) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-[9px] text-purple-700 font-medium">
                {stats.wakafPbkCount} / {stats.targetCountPbkWakaf} org
              </p>
            </div>
            <div className="bg-white/60 border border-purple-100 rounded-xl p-3 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-purple-600 uppercase mb-0.5">
                PGW (Baru)
              </p>
              <p className="text-xs font-bold text-purple-900">
                RM {stats.wakafPgwSum.toLocaleString("en-MY")}{" "}
                <span className="text-[10px] text-purple-700/80 font-medium">
                  / RM {stats.targetPgwSum.toLocaleString("en-MY")}
                </span>
              </p>
              <div className="w-full bg-purple-100 rounded-full h-1 mt-1 mb-1">
                <div
                  className="bg-purple-400 h-1 rounded-full"
                  style={{
                    width: `${Math.min((stats.wakafPgwSum / Math.max(stats.targetPgwSum, 1)) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-[9px] text-purple-700 font-medium">
                {stats.wakafPgwCount} / {stats.targetCountPgw} org
              </p>
            </div>

            <div className="bg-purple-600 text-white rounded-xl p-3 col-span-2 grid grid-cols-2 gap-4 shadow-sm">
              <div className="flex flex-col justify-center border-r border-purple-500/50 pr-4">
                <p className="text-[9px] font-bold text-purple-200 uppercase mb-0.5">
                  Pembayar Baru
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-xs font-bold">
                    {stats.wakafBaruCount} org
                  </p>
                  <p className="text-[10px] font-medium text-purple-200">
                    RM {stats.wakafBaruSum.toLocaleString("en-MY")}
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center pl-1">
                <p className="text-[9px] font-bold text-purple-200 uppercase mb-0.5">
                  Pembayar Lama
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-xs font-bold">
                    {stats.wakafLamaCount} org
                  </p>
                  <p className="text-[10px] font-medium text-purple-200">
                    RM {stats.wakafLamaSum.toLocaleString("en-MY")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kempen Digital Card (Bento) */}
        <div className="bg-rose-50 rounded-2xl shadow-sm border border-rose-200 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-rose-100 text-rose-600 p-2.5 rounded-xl shadow-sm">
              <LayoutListIcon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-rose-800 uppercase tracking-wide">
              Kempen Digital
            </h3>
          </div>

          <div>
            <p className="text-3xl font-extrabold text-rose-900 tracking-tight">
              <span className="text-lg text-rose-700 font-bold mr-1">RM</span>
              {stats.kempenDigitalSum.toLocaleString("en-MY", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] font-semibold text-rose-700/70">
                Sasaran: RM{" "}
                {stats.kempenDigitalTargetSum.toLocaleString("en-MY", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              {stats.kempenDigitalTargetSum > 0 && (
                <span className="text-[10px] font-bold bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full">
                  {Math.round(
                    (stats.kempenDigitalSum / stats.kempenDigitalTargetSum) *
                      100,
                  )}
                  %
                </span>
              )}
            </div>
            <div className="w-full bg-rose-200/50 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-rose-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min((stats.kempenDigitalSum / Math.max(stats.kempenDigitalTargetSum, 1)) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-auto">
            <div className="bg-white/60 border border-rose-100 rounded-xl p-3 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-rose-600 uppercase mb-0.5">
                Zakat (Baru)
              </p>
              <p className="text-xs font-bold text-rose-900">
                RM {stats.zakatDigitalSum.toLocaleString("en-MY")}{" "}
                <span className="text-[10px] text-rose-700/80 font-medium">
                  / RM {stats.targetDigitalZakatSum.toLocaleString("en-MY")}
                </span>
              </p>
              <div className="w-full bg-rose-100 rounded-full h-1 mt-1 mb-1">
                <div
                  className="bg-rose-400 h-1 rounded-full"
                  style={{
                    width: `${Math.min((stats.zakatDigitalSum / Math.max(stats.targetDigitalZakatSum, 1)) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-[9px] text-rose-700 font-medium">
                {stats.zakatDigitalCount} / {stats.targetCountDigitalZakat} org
              </p>
            </div>
            <div className="bg-white/60 border border-rose-100 rounded-xl p-3 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-rose-600 uppercase mb-0.5">
                Wakaf (Baru)
              </p>
              <p className="text-xs font-bold text-rose-900">
                RM {stats.wakafDigitalSum.toLocaleString("en-MY")}{" "}
                <span className="text-[10px] text-rose-700/80 font-medium">
                  / RM {stats.targetDigitalWakafSum.toLocaleString("en-MY")}
                </span>
              </p>
              <div className="w-full bg-rose-100 rounded-full h-1 mt-1 mb-1">
                <div
                  className="bg-rose-400 h-1 rounded-full"
                  style={{
                    width: `${Math.min((stats.wakafDigitalSum / Math.max(stats.targetDigitalWakafSum, 1)) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-[9px] text-rose-700 font-medium">
                {stats.wakafDigitalCount} / {stats.targetCountDigitalWakaf} org
              </p>
            </div>

            <div className="bg-rose-600 text-white rounded-xl p-3 col-span-2 grid grid-cols-2 gap-4 shadow-sm">
              <div className="flex flex-col justify-center border-r border-rose-500/50 pr-4">
                <p className="text-[9px] font-bold text-rose-200 uppercase mb-0.5">
                  Pembayar Baru
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-xs font-bold">
                    {stats.digitalBaruCount} org
                  </p>
                  <p className="text-[10px] font-medium text-rose-200">
                    RM {stats.digitalBaruSum.toLocaleString("en-MY")}
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center pl-1">
                <p className="text-[9px] font-bold text-rose-200 uppercase mb-0.5">
                  Pembayar Lama
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-xs font-bold">
                    {stats.digitalLamaCount} org
                  </p>
                  <p className="text-[10px] font-medium text-rose-200">
                    RM {stats.digitalLamaSum.toLocaleString("en-MY")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Zone Chart (List) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[400px]">
          <h3 className="text-base font-bold text-slate-800 mb-4 shrink-0 flex items-center gap-2 border-b border-slate-100 pb-4">
            <MapIcon className="w-5 h-5 text-emerald-600" /> Program Mengikut
            Zon
          </h3>
          {stats.zoneData.length > 0 ? (
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-5 pb-2">
              {(() => {
                const sorted = [...stats.zoneData].sort(
                  (a, b) => b.value - a.value,
                );
                return sorted.map((entry, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-semibold text-slate-700">
                        {entry.name}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {entry.completed} / {entry.total} Selesai{" "}
                        <span className="text-slate-400 font-medium ml-1">
                          (
                          {Math.round(
                            (entry.completed / Math.max(entry.total, 1)) * 100,
                          )}
                          %)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{
                          width: `${(entry.completed / Math.max(entry.total, 1)) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Tiada data direkodkan
            </div>
          )}
        </div>

        {/* Activity Type Chart (List) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[400px]">
          <h3 className="text-base font-bold text-slate-800 mb-4 shrink-0 flex items-center gap-2 border-b border-slate-100 pb-4">
            <ActivityIcon className="w-5 h-5 text-emerald-600" /> Pecahan Jenis
            Aktiviti
          </h3>
          {stats.activityData.length > 0 ? (
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-5 pb-2">
              {(() => {
                const sorted = [...stats.activityData].sort(
                  (a, b) => b.value - a.value,
                );
                return sorted.map((entry, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-semibold text-slate-700">
                        {entry.name}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {entry.completed} / {entry.total} Selesai{" "}
                        <span className="text-slate-400 font-medium ml-1">
                          (
                          {Math.round(
                            (entry.completed / Math.max(entry.total, 1)) * 100,
                          )}
                          %)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(entry.completed / Math.max(entry.total, 1)) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Tiada jenis aktiviti direkodkan
            </div>
          )}
        </div>

        {/* Zakat & Wakaf Trend (List) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[400px]">
          <h3 className="text-base font-bold text-slate-800 mb-4 shrink-0 flex items-center gap-2 border-b border-slate-100 pb-4">
            <ActivityIcon className="w-5 h-5 text-emerald-600" /> Jumlah Kutipan
            Mengikut Zon
          </h3>
          {stats.zoneCollectionData.length > 0 ? (
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 pb-2">
              {(() => {
                const sorted = [...stats.zoneCollectionData].sort(
                  (a, b) => b.Zakat + b.Wakaf - (a.Zakat + a.Wakaf),
                );
                return sorted.map((entry, idx) => {
                  const total = entry.Zakat + entry.Wakaf;
                  if (total === 0) return null;
                  return (
                    <div
                      key={idx}
                      className="flex flex-col gap-2 p-3 rounded-lg border border-slate-100 bg-slate-50/50"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-slate-800">
                          {entry.zone}
                        </span>
                        <span className="text-sm font-extrabold text-emerald-600">
                          RM{" "}
                          {total.toLocaleString("en-MY", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-emerald-50 px-2 py-1.5 rounded border border-emerald-100 flex flex-col">
                          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                            Zakat
                          </span>
                          <span className="text-xs font-bold text-emerald-900">
                            RM {entry.Zakat.toLocaleString("en-MY")}
                          </span>
                        </div>
                        <div className="bg-blue-50 px-2 py-1.5 rounded border border-blue-100 flex flex-col">
                          <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                            Wakaf
                          </span>
                          <span className="text-xs font-bold text-blue-900">
                            RM {entry.Wakaf.toLocaleString("en-MY")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Tiada kutipan direkodkan
            </div>
          )}
        </div>

        {/* Collection Distribution Chart (List) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[400px]">
          <h3 className="text-base font-bold text-slate-800 mb-4 shrink-0 flex items-center gap-2 border-b border-slate-100 pb-4">
            <WalletIcon className="w-5 h-5 text-emerald-600" /> Jumlah Kutipan
            Mengikut Aktiviti
          </h3>
          {stats.collectionDistribution.length > 0 ? (
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 pb-2">
              {(() => {
                const sorted = [...stats.collectionDistribution].sort(
                  (a, b) => b.value - a.value,
                );
                return sorted.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 p-3 rounded-lg border border-slate-100 bg-slate-50/50"
                  >
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 leading-tight">
                          {entry.name}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 mt-0.5">
                          {entry.participants} Penyumbang
                        </span>
                      </div>
                      <span className="text-sm font-extrabold text-emerald-600 shrink-0">
                        RM{" "}
                        {entry.value.toLocaleString("en-MY", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-emerald-50 px-2 py-1.5 rounded border border-emerald-100 flex flex-col">
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                          Zakat
                        </span>
                        <span className="text-xs font-bold text-emerald-900">
                          RM {entry.Zakat.toLocaleString("en-MY")}
                        </span>
                      </div>
                      <div className="bg-blue-50 px-2 py-1.5 rounded border border-blue-100 flex flex-col">
                        <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                          Wakaf
                        </span>
                        <span className="text-xs font-bold text-blue-900">
                          RM {entry.Wakaf.toLocaleString("en-MY")}
                        </span>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Tiada kutipan direkodkan
            </div>
          )}
        </div>
      </div>

      {/* Aktiviti Terkini (Timeline) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 flex flex-col mt-6">
        <div className="flex items-center justify-between gap-4 mb-4 border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-emerald-600" /> Aktiviti Terkini
          </h3>
        </div>

        <div className="max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="relative pl-4 sm:pl-5 border-l-2 border-slate-100 space-y-4 py-1">
            {(() => {
              const todayTime = startOfDay(new Date()).getTime();
              const closestPrograms = [...stats.sortedPrograms].sort((a, b) => {
                const dateA = startOfDay(parseISO(a.date)).getTime();
                const dateB = startOfDay(parseISO(b.date)).getTime();
                return Math.abs(dateA - todayTime) - Math.abs(dateB - todayTime);
              });
              const displayPrograms = closestPrograms.slice(0, 10).sort((a, b) => {
                return new Date(a.date).getTime() - new Date(b.date).getTime();
              });

              if (displayPrograms.length === 0)
                return (
                  <div className="text-slate-400 text-sm py-2">
                    Tiada aktiviti direkodkan.
                  </div>
                );

              return displayPrograms.map((prog, idx) => {
                const progDate = parseISO(prog.date);
                const today = startOfDay(new Date());
                const progDay = startOfDay(progDate);
                const past = isBefore(progDay, today);
                const current = isToday(progDate);

                let visualStatus = "Akan Datang";
                let statusColor = "bg-blue-400";
                let badgeClasses = "bg-blue-50 text-blue-700 border-blue-200";

                if (prog.status === "Batal") {
                  visualStatus = "Batal";
                  statusColor = "bg-red-400";
                  badgeClasses = "bg-red-50 text-red-700 border-red-200";
                } else if (current) {
                  visualStatus = "Sedang Berlangsung";
                  statusColor = "bg-amber-400";
                  badgeClasses = "bg-amber-50 text-amber-700 border-amber-200";
                } else if (past) {
                  visualStatus = "Selesai";
                  statusColor = "bg-emerald-400";
                  badgeClasses =
                    "bg-emerald-50 text-emerald-700 border-emerald-200";
                }

                return (
                  <div key={idx} className="relative">
                    {/* Timeline dot */}
                    <div
                      className={`absolute -left-[21px] sm:-left-[25px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${statusColor} shadow-sm`}
                    ></div>

                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 hover:shadow-sm transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1.5">
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">
                          {prog.title}
                        </h4>
                        <span
                          className={`self-start sm:self-auto inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${badgeClasses}`}
                        >
                          {visualStatus}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-slate-400" />
                          <span className="font-medium">
                            {format(progDate, "dd MMM yyyy", { locale: ms })} •{" "}
                            {prog.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="w-3 h-3 text-slate-400" />
                          <span className="font-medium">
                            {prog.location || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ActivityIcon className="w-3 h-3 text-slate-400" />
                          <span className="font-medium text-emerald-600 bg-emerald-50 px-1 rounded">
                            {prog.zone}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
