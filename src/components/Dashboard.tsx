import React, { useMemo } from "react";
import { Program } from "../types";
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
} from "lucide-react";

interface DashboardProps {
  programs: Program[];
}

export default function Dashboard({ programs }: DashboardProps) {
  const stats = useMemo(() => {
    const total = programs.length;
    const completed = programs.filter((p) => p.status === "Selesai").length;
    const planned = programs.filter(
      (p) => !p.status || p.status === "Dirancang",
    ).length;
    const cancelled = programs.filter((p) => p.status === "Batal").length;

    let zakatSum = 0;
    let wakafSum = 0;
    let zakatParticipants = 0;
    let wakafParticipants = 0;
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

      (p.collections || []).forEach((c) => {
        const amount = Number(c.amount || 0);
        const payers = Number(c.payers_count || 0);
        if (c.collection_type === "Zakat") {
          programZakatSum += amount;
          programZakatParticipants += payers;
        } else if (c.collection_type === "Wakaf") {
          programWakafSum += amount;
          programWakafParticipants += payers;
        }
      });

      zakatSum += programZakatSum;
      wakafSum += programWakafSum;
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

    return {
      total,
      completed,
      planned,
      cancelled,
      zoneData,
      activityData,
      zakatSum,
      wakafSum,
      collectionDistribution,
      zoneCollectionData,
    };
  }, [programs]);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
            <ActivityIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
              Jumlah Program
            </p>
            <p className="text-xl font-bold text-slate-800">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="bg-amber-50 text-amber-600 p-3 rounded-lg">
            <ClockIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
              Dirancang
            </p>
            <p className="text-xl font-bold text-slate-800">{stats.planned}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg">
            <CheckCircle2Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
              Selesai
            </p>
            <p className="text-xl font-bold text-slate-800">
              {stats.completed}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="bg-red-50 text-red-600 p-3 rounded-lg">
            <XCircleIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
              Batal
            </p>
            <p className="text-xl font-bold text-slate-800">
              {stats.cancelled}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg">
            <WalletIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
              Kutipan Zakat (RM)
            </p>
            <p className="text-xl font-bold text-slate-800">
              {stats.zakatSum.toLocaleString("en-MY", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-lg">
            <HandHeartIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
              Kutipan Wakaf (RM)
            </p>
            <p className="text-xl font-bold text-slate-800">
              {stats.wakafSum.toLocaleString("en-MY", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[350px] flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ActivityIcon className="w-5 h-5 text-emerald-600" /> Pecahan Jenis
            Aktiviti
          </h3>
          {stats.activityData.length > 0 ? (
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={stats.activityData}
                    cx="50%"
                    cy="50%"
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
                    height={36}
                    iconType="circle"
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[350px] flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
            <WalletIcon className="w-5 h-5 text-emerald-600" /> Pecahan Kutipan
            Mengikut Aktiviti
          </h3>
          {stats.collectionDistribution.length > 0 ? (
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={stats.collectionDistribution}
                    cx="50%"
                    cy="50%"
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
                    height={36}
                    iconType="circle"
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
    </div>
  );
}
