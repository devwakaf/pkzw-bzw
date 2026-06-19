import React, { useState } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  parseISO,
  isSameDay,
  isWithinInterval,
} from "date-fns";
import { ms } from "date-fns/locale"; // Malay locale
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  ClockIcon,
  UsersIcon,
  LayoutListIcon,
  CalendarIcon,
  Trash2Icon,
  XIcon,
  EditIcon,
  TargetIcon,
  UserCircleIcon,
} from "lucide-react";
import { Program, Zone, BzwSetting } from "../types";

interface CalendarViewProps {
  programs: Program[];
  user: any;
  onEdit: (p: Program) => void;
  onDelete: (id: string) => void;
  bzwSettings?: BzwSetting[];
}

const zoneColors: Record<Zone, string> = {
  HQ: "bg-slate-800 text-white",
  "Zon Timur": "bg-blue-600 text-white",
  "Zon Tengah": "bg-amber-500 text-amber-950",
  "Zon Barat": "bg-emerald-600 text-white",
};

const formatTime12 = (timeStr?: string | null) => {
  if (!timeStr) return "-";
  try {
    const [h, m] = timeStr.split(":");
    if (!h || !m) return timeStr;
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
};

export default function CalendarView({
  programs,
  user,
  onEdit,
  onDelete,
  bzwSettings,
}: CalendarViewProps) {
  const [zoneFilter, setZoneFilter] = useState<Zone | "All">("All");

  // Year Filter
  const availableYears =
    bzwSettings && bzwSettings.length > 0
      ? [...bzwSettings.map((s) => s.year)].sort((a, b) => b - a)
      : [new Date().getFullYear()];

  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0]);

  const currentBzwSetting = bzwSettings?.find((s) => s.year === selectedYear);
  const getLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const cleaned = dateStr.split("T")[0].split(" ")[0];
    const [y, m, d] = cleaned.split("-").map(Number);
    return new Date(y, m - 1, d); // Creates local midnight Date
  };
  const [jakimMap, setJakimMap] = useState<Record<string, string>>({});

  const defaultBzwPeriod = React.useMemo(() => {
    let start = new Date(selectedYear, 6, 7);
    for (let m = 0; m < 12; m++) {
      for (let d = 1; d <= 31; d++) {
        const dt = new Date(selectedYear, m, d);
        if (dt.getMonth() !== m) continue;
        const fmt = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
          month: "numeric",
          day: "numeric",
        }).format(dt);
        if (fmt === "1/1") {
          start = dt;
          m = 12;
          break;
        }
      }
    }
    const end = new Date(start);
    end.setDate(end.getDate() + 29); // approx 1 month
    return { start, end };
  }, [selectedYear]);

  // We find the exact 1/1 start date from JAKIM map if available around our default date
  const jakaStartString = React.useMemo(() => {
    const candidates = [0, 1, -1, 2, -2].map((offset) => {
      const d = new Date(defaultBzwPeriod.start);
      d.setDate(d.getDate() + offset);
      return { str: format(d, "yyyy-MM-dd"), date: d };
    });
    for (const c of candidates) {
      if (jakimMap[c.str] && jakimMap[c.str].endsWith("-01-01")) {
        return c.date;
      }
    }
    return defaultBzwPeriod.start;
  }, [jakimMap, defaultBzwPeriod.start]);

  const muharramStart = currentBzwSetting
    ? getLocalDate(currentBzwSetting.start_date)
    : jakaStartString;
  const muharramEnd = currentBzwSetting
    ? getLocalDate(currentBzwSetting.end_date)
    : new Date(jakaStartString.getTime() + 29 * 24 * 60 * 60 * 1000);

  const [currentDate, setCurrentDate] = useState(
    () => new Date(muharramStart.getFullYear(), muharramStart.getMonth(), 1),
  );

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);

  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  React.useEffect(() => {
    let active = true;
    const syncJakim = async () => {
      try {
        const d1 = new Date(startDate);
        const d2 = new Date(endDate);
        const monthsStr = new Set([
          `${d1.getFullYear()}-${d1.getMonth() + 1}`,
          `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`,
          `${d2.getFullYear()}-${d2.getMonth() + 1}`,
        ]);

        const newMap: Record<string, string> = {};
        for (const ym of monthsStr) {
          const [yyyy, mm] = ym.split("-");
          const res = await fetch(
            `https://api.waktusolat.app/v2/solat/SGR01?year=${yyyy}&month=${mm}`,
          );
          if (!res.ok) continue;
          const data = await res.json();
          for (const p of data.prayers) {
            const gregorian = `${yyyy}-${mm.padStart(2, "0")}-${p.day.toString().padStart(2, "0")}`;
            newMap[gregorian] = p.hijri;
          }
        }
        if (!active) return;
        setJakimMap((prev) => ({ ...prev, ...newMap }));
      } catch (e) {
        console.error("Failed to sync JAKIM date:", e);
      }
    };
    syncJakim();
    return () => {
      active = false;
    };
  }, [startDate.toISOString(), endDate.toISOString()]);

  // When year changes, jump to start date
  React.useEffect(() => {
    if (currentBzwSetting) {
      const start = getLocalDate(currentBzwSetting.start_date);
      if (!isNaN(start.getTime())) {
        setCurrentDate(new Date(start.getFullYear(), start.getMonth(), 1));
      }
      setSelectedDayObj(null);
    }
  }, [selectedYear, currentBzwSetting]);

  const handlePrevMonth = () => {
    const prev = subMonths(currentDate, 1);
    if (
      !isWithinInterval(prev, {
        start: startOfMonth(muharramStart),
        end: endOfMonth(muharramEnd),
      })
    )
      return;
    setCurrentDate(prev);
  };
  const handleNextMonth = () => {
    const next = addMonths(currentDate, 1);
    if (
      !isWithinInterval(next, {
        start: startOfMonth(muharramStart),
        end: endOfMonth(muharramEnd),
      })
    )
      return;
    setCurrentDate(next);
  };

  const isPrevDisabled = !isWithinInterval(subMonths(currentDate, 1), {
    start: startOfMonth(muharramStart),
    end: endOfMonth(muharramEnd),
  });
  const isNextDisabled = !isWithinInterval(addMonths(currentDate, 1), {
    start: startOfMonth(muharramStart),
    end: endOfMonth(muharramEnd),
  });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const filteredPrograms =
    zoneFilter === "All"
      ? programs
      : programs.filter((p) => p.zone === zoneFilter);

  const programsByDate = days.reduce(
    (acc, day) => {
      const formattedDate = format(day, "yyyy-MM-dd");
      acc[formattedDate] = filteredPrograms.filter((p) => {
        if (!p.date) return false;
        const pDateClean = p.date.split("T")[0].split(" ")[0];
        return pDateClean === formattedDate;
      });
      return acc;
    },
    {} as Record<string, Program[]>,
  );

  const [selectedDayObj, setSelectedDayObj] = useState<Date | null>(null);
  const [viewingProgram, setViewingProgram] = useState<Program | null>(null);
  const [viewingTab, setViewingTab] = useState<'maklumat' | 'kewangan'>('maklumat');

  React.useEffect(() => {
    if (viewingProgram) {
      setViewingTab('maklumat');
    }
  }, [viewingProgram]);

  const calculateProgramStats = (p: Program) => {
    const zakat = (p.collections || [])
      .filter((c) => c.collection_type === "Zakat")
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const wakaf = (p.collections || [])
      .filter((c) => c.collection_type === "Wakaf")
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const bilZakat = (p.collections || [])
      .filter((c) => c.collection_type === "Zakat")
      .reduce((sum, c) => sum + Number(c.payers_count || 0), 0);
    const bilWakaf = (p.collections || [])
      .filter((c) => c.collection_type === "Wakaf")
      .reduce((sum, c) => sum + Number(c.payers_count || 0), 0);
    const ttlKutipan = zakat + wakaf;
    const ttlBil = bilZakat + bilWakaf;
    const pc = Number(p.program_cost || 0);
    const roiNum = pc > 0 ? ((ttlKutipan - pc) / pc) * 100 : null;
    const roi = roiNum !== null ? roiNum.toFixed(0) + "%" : "-";
    return { zakat, wakaf, bilZakat, bilWakaf, ttlKutipan, ttlBil, pc, roi };
  };

  const renderSelectedDayPanel = () => {
    if (!selectedDayObj) {
      return (
        <div className="w-full lg:w-80 xl:w-96 bg-white border border-slate-200 rounded-xl p-6 shadow-sm shrink-0 flex flex-col items-center justify-center text-center text-slate-400 min-h-[300px]">
          <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm">
            Klik pada mana-mana tarikh kalendar untuk melihat aktiviti.
          </p>
        </div>
      );
    }

    const dateStr = format(selectedDayObj, "yyyy-MM-dd");
    const dayPrograms = programsByDate[dateStr] || [];

    return (
      <div className="w-full lg:w-80 xl:w-96 bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm shrink-0 overflow-hidden min-h-[300px] lg:sticky lg:top-6">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-emerald-100 text-emerald-700 w-10 h-10 rounded-lg flex flex-col items-center justify-center leading-tight">
            <span className="text-[10px] font-bold uppercase">
              {format(selectedDayObj, "MMM", { locale: ms })}
            </span>
            <span className="text-sm font-bold">
              {format(selectedDayObj, "dd")}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Senarai Aktiviti
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {format(selectedDayObj, "EEEE, d MMMM yyyy", { locale: ms })}
            </p>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto no-scrollbar">
          {dayPrograms.length === 0 ? (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center h-full">
              <span className="text-sm">Tiada program direkodkan.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {dayPrograms.map((p) => {
                const bgClass = zoneColors[p.zone]
                  .split(" ")[0]
                  .replace("neutral-", "slate-");
                return (
                  <div
                    key={p.id}
                    className={`group relative bg-white border border-slate-200 p-2.5 rounded-lg hover:border-emerald-300 hover:shadow-sm transition-all overflow-hidden cursor-pointer`}
                    onClick={() => setViewingProgram(p)}
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${bgClass}`}
                    ></div>
                    <div className="pl-2">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className="font-bold text-slate-800 text-[11px] sm:text-xs leading-snug">
                          {p.title}
                        </h4>
                        {user && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(p.id);
                            }}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors -mt-1 -mr-1"
                            title="Padam"
                          >
                            <Trash2Icon className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-600">
                          <ClockIcon className="w-[10px] h-[10px] text-slate-400 shrink-0" />
                          <span className="font-medium whitespace-nowrap">
                            {formatTime12(p.time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-600 min-w-0 max-w-[120px]">
                          <MapPinIcon className="w-[10px] h-[10px] text-slate-400 shrink-0" />
                          <span className="font-medium truncate">
                            {p.location || "-"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 text-[8px] sm:text-[9px] font-bold tracking-wider uppercase mt-0.5 w-full">
                          <span className="text-slate-400">{p.zone}</span>
                          {p.sector && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className={p.sector === "Zakat" ? "text-blue-500" : p.sector === "Wakaf" ? "text-emerald-500" : "text-slate-500"}>{p.sector}</span>
                            </>
                          )}
                          {p.activityType && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-400">{p.activityType}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-slate-50 text-emerald-600 p-1.5 rounded border border-slate-200 shadow-sm">
                          <LayoutListIcon className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Zone Filter */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-2 items-center flex-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
            Filter Zon:
          </span>
          <button
            onClick={() => setZoneFilter("All")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              zoneFilter === "All"
                ? "bg-slate-800 text-white shadow-md"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            KESELURUHAN
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] ${zoneFilter === "All" ? "bg-white/20" : "bg-slate-200 text-slate-600"}`}
            >
              {programs.length}
            </span>
          </button>
          {(["HQ", "Zon Timur", "Zon Tengah", "Zon Barat"] as Zone[]).map(
            (z) => {
              const count = programs.filter((p) => p.zone === z).length;
              return (
                <button
                  key={z}
                  onClick={() => setZoneFilter(z)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    zoneFilter === z
                      ? `${zoneColors[z]} shadow-md`
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {z.toUpperCase()}
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] ${zoneFilter === z ? "bg-black/20 text-white" : "bg-slate-200 text-slate-600"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            },
          )}
        </div>

        {/* Year Filter */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3 w-full sm:w-auto shrink-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">
            Tahun :
          </span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-1.5 bg-sky-50 border border-sky-100 text-sky-700 font-bold rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500 transition-shadow appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%230284c7' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: `right 0.5rem center`,
              backgroundRepeat: `no-repeat`,
              backgroundSize: `1.5em 1.5em`,
              paddingRight: `2.5rem`,
            }}
          >
            {availableYears.map((yr) => {
              const s = bzwSettings?.find((b) => b.year === yr);
              return (
                <option key={yr} value={yr}>
                  BZW {yr} {s?.hijri_year ? `(${s.hijri_year})` : ""}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="bg-sky-50/50 rounded-xl shadow-sm border border-sky-100 p-4 md:p-6 flex-1 w-full min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-sky-700">
                {format(currentDate, "MMMM yyyy", { locale: ms })}
              </span>
              {isWithinInterval(currentDate, {
                start: startOfMonth(muharramStart),
                end: endOfMonth(muharramEnd),
              }) && (
                <>
                  <span className="hidden sm:inline text-sky-300 font-normal">
                    /
                  </span>
                  <span className="text-amber-500 uppercase text-[10px] sm:text-xs tracking-widest font-black flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    Bulan Zakat & Wakaf {selectedYear}
                  </span>
                </>
              )}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={handlePrevMonth}
                disabled={isPrevDisabled}
                className={`p-2 rounded-lg border transition-colors ${isPrevDisabled ? "border-sky-50 text-sky-200 bg-transparent cursor-not-allowed" : "border-slate-200 text-slate-600 hover:bg-slate-100 bg-white shadow-sm"}`}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                disabled={isNextDisabled}
                className={`p-2 rounded-lg border transition-colors ${isNextDisabled ? "border-sky-50 text-sky-200 bg-transparent cursor-not-allowed" : "border-slate-200 text-slate-600 hover:bg-slate-100 bg-white shadow-sm"}`}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-hidden pb-2 -mb-2">
            <div className="grid grid-cols-7 min-w-[700px] border-t border-l border-sky-100 shadow-sm rounded-lg overflow-hidden">
              {[
                "Ahad",
                "Isnin",
                "Selasa",
                "Rabu",
                "Khamis",
                "Jumaat",
                "Sabtu",
              ].map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-[10px] font-black text-sky-400 bg-sky-100/50 border-r border-b border-sky-100 uppercase tracking-tight"
                >
                  {day.substring(0, 3)}
                </div>
              ))}

              {days.map((day, i) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const dayPrograms = programsByDate[dateStr] || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);
                const isSelected =
                  selectedDayObj && isSameDay(day, selectedDayObj);
                const isMuharram = isWithinInterval(day, {
                  start: muharramStart,
                  end: muharramEnd,
                });

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDayObj(day)}
                    className={`
                    min-h-[70px] md:min-h-[100px] border-r border-b border-sky-100 p-1 md:p-2 transition-all cursor-pointer flex flex-col items-start
                    ${!isCurrentMonth ? "text-slate-300 bg-slate-50/10" : "text-slate-400 font-bold"}
                    ${isMuharram && isCurrentMonth ? "bg-amber-50/70" : "bg-white/80"}
                    ${isTodayDate ? "ring-2 ring-sky-600 z-10 bg-sky-100/50 text-sky-800" : "hover:bg-sky-50"}
                    ${isSelected && !isTodayDate ? "bg-sky-50 ring-1 ring-sky-300 z-10" : ""}
                  `}
                  >
                    <div className="flex justify-between items-start w-full relative">
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={`${isTodayDate ? "text-sky-700 font-black" : isCurrentMonth ? (isMuharram ? "text-amber-700" : "text-slate-600") : ""} leading-none`}
                        >
                          {format(day, "d")}
                        </span>
                        <span
                          className={`text-[8px] md:text-[9px] tracking-tighter ${isCurrentMonth ? (isMuharram ? "text-amber-500" : "text-slate-400") : "text-slate-300"} leading-none`}
                        >
                          {(() => {
                            const dateStr = format(day, "yyyy-MM-dd");
                            if (jakimMap[dateStr]) {
                              const hijriMonths = [
                                "Muh.",
                                "Saf.",
                                "Rab. I",
                                "Rab. II",
                                "Jam. I",
                                "Jam. II",
                                "Rej.",
                                "Syaa.",
                                "Ram.",
                                "Syaw.",
                                "Zulk.",
                                "Zulh.",
                              ];
                              const [y, m, d] = jakimMap[dateStr].split("-");
                              return `${parseInt(d)} ${hijriMonths[parseInt(m) - 1]}`;
                            }
                            return new Intl.DateTimeFormat(
                              "ms-MY-u-ca-islamic-umalqura",
                              { day: "numeric", month: "short" },
                            ).format(day);
                          })()}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        {isMuharram && isCurrentMonth && (
                          <span className="text-[8px] font-black text-amber-500/50 uppercase tracking-tighter hidden md:block leading-none mb-1">
                            BZW
                          </span>
                        )}
                        {dayPrograms.length > 0 && !isTodayDate && (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 w-full flex flex-col gap-0.5 md:gap-1 overflow-x-hidden no-scrollbar mt-1">
                      {Object.entries(
                        dayPrograms.reduce(
                          (acc, p) => {
                            acc[p.zone] = (acc[p.zone] || 0) + 1;
                            return acc;
                          },
                          {} as Record<string, number>,
                        ),
                      ).map(([zone, count]) => {
                        const bgAndText =
                          zoneColors[zone as Zone] || "bg-slate-500 text-white";
                        const [bgClass, textClass] = bgAndText.split(" ");
                        const finalBg = bgClass.replace("neutral-", "slate-");
                        const finalTxt = textClass
                          ? textClass.replace("neutral-", "slate-")
                          : "text-white";

                        return (
                          <div
                            key={zone}
                            className={`text-[8px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded flex justify-between items-center ${finalBg} ${finalTxt}`}
                            title={`${count} Program di ${zone}`}
                          >
                            <span className="truncate max-w-[70%] font-medium">
                              {zone === "HQ" ? "HQ" : zone.replace("Zon ", "")}
                            </span>
                            {count >= 1 && (
                              <span className="font-bold bg-black/10 px-1 rounded-sm leading-tight text-[8px] sm:text-[9px] ml-1">
                                {count}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {renderSelectedDayPanel()}
      </div>

      {/* Program Details Modal */}
      {viewingProgram && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-350"
          onClick={() => setViewingProgram(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[92vh] animate-in zoom-in-95 duration-205"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                  {viewingProgram.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className={`inline-block px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded border ${
                      viewingProgram.status === "Selesai"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : viewingProgram.status === "Batal"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {viewingProgram.status || "Dirancang"}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
                    {viewingProgram.zone}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingProgram(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors self-start shrink-0 ml-4"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs for details */}
            <div className="flex border-b border-slate-100 bg-slate-50/20 p-1.5 gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setViewingTab('maklumat')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                  viewingTab === 'maklumat'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LayoutListIcon className="w-3.5 h-3.5" />
                <span>Maklumat</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingTab('kewangan')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                  viewingTab === 'kewangan'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <TargetIcon className="w-3.5 h-3.5" />
                <span>Kutipan & Impak</span>
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto no-scrollbar flex-1">
              
              {/* TAB 1: MAKLUMAT */}
              {viewingTab === 'maklumat' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Timing & Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex bg-slate-50/50 p-3 items-start rounded-xl border border-slate-100/50 gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                        <CalendarIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          Tarikh & Masa
                        </div>
                        <div className="text-xs font-semibold text-slate-700 truncate">
                          {viewingProgram.date ? (() => {
                            const [y, m, d] = viewingProgram.date.split('T')[0].split(' ')[0].split('-');
                            return `${d}/${m}/${y}`;
                          })() : ''}{" "}
                        </div>
                        <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                          {formatTime12(viewingProgram.time)}
                        </div>
                      </div>
                    </div>
                    <div className="flex bg-slate-50/50 p-3 items-start rounded-xl border border-slate-100/50 gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPinIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          Lokasi
                        </div>
                        <div className="text-xs font-semibold text-slate-700 break-words mt-0.5">
                          {viewingProgram.location || "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detail list */}
                  <div className="space-y-3.5 text-sm text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
                    {viewingProgram.activityType && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                          Jenis Aktiviti
                        </div>
                        <div className="font-semibold text-slate-700 text-xs sm:text-sm">
                          {viewingProgram.activityType}
                        </div>
                      </div>
                    )}
                    {viewingProgram.sector && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                          Sektor Program
                        </div>
                        <div className="font-semibold text-slate-700 text-xs sm:text-sm">
                          {viewingProgram.sector}
                        </div>
                      </div>
                    )}
                    {user && viewingProgram.description && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                          Penerangan
                        </div>
                        <div className="font-medium text-slate-700 text-xs sm:text-sm">
                          {viewingProgram.description}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex flex-row items-center gap-1.5">
                          <UserCircleIcon className="w-3.5 h-3.5 text-slate-400" /> PIC Program
                        </div>
                        <div className="font-semibold text-slate-750 text-xs truncate">
                          {viewingProgram.pic_program || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex flex-row items-center gap-1.5">
                          <UsersIcon className="w-3.5 h-3.5 text-slate-400" /> Kumpulan Sasar
                        </div>
                        <div className="font-semibold text-slate-755 text-xs truncate">
                          {viewingProgram.participants || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: KEWANGAN & IMPAK */}
              {viewingTab === 'kewangan' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Financial Stats */}
                  {(() => {
                    const stats = calculateProgramStats(viewingProgram);
                    const fmtAmt = (num: number) =>
                      Number(num).toLocaleString("en-MY", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      });
                    const fmtBil = (num: number) =>
                      Number(num).toLocaleString("en-MY");

                    return (
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                          <TargetIcon className="w-3.5 h-3.5 text-slate-400" /> Data Kutipan & Impak
                        </h4>

                        <div className="space-y-3">
                          {user && (
                            <div className="flex justify-between items-center text-xs sm:text-sm border-b border-slate-200/40 pb-2.5">
                              <span className="text-slate-500 font-medium">
                                Kos Program
                              </span>
                              <span className="font-bold text-rose-600">
                                RM {fmtAmt(stats.pc)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-xs sm:text-sm border-b border-slate-200/40 pb-2.5">
                            <span className="text-slate-500 font-medium">
                              Kutipan Zakat
                            </span>
                            <div className="text-right">
                              <span className="font-bold text-slate-800">
                                RM {fmtAmt(stats.zakat)}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-1.5 font-bold">
                                ({fmtBil(stats.bilZakat)} org)
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-xs sm:text-sm border-b border-slate-200/40 pb-2.5">
                            <span className="text-slate-500 font-medium">
                              Kutipan Wakaf
                            </span>
                            <div className="text-right">
                              <span className="font-bold text-slate-800">
                                RM {fmtAmt(stats.wakaf)}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-1.5 font-bold">
                                ({fmtBil(stats.bilWakaf)} org)
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100/40 mt-2">
                            <span>Jumlah Kutipan</span>
                            <span>RM {fmtAmt(stats.ttlKutipan)}</span>
                          </div>
                          {user && (
                            <div className="flex justify-between items-center text-xs sm:text-sm font-bold bg-slate-100 p-2.5 rounded-lg text-slate-700 mt-2">
                              <span>ROI (Kadar Impak)</span>
                              <span>{stats.roi}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {user && (
              <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 mt-auto shrink-0">
                <button
                  onClick={() => setViewingProgram(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    const prog = viewingProgram;
                    setViewingProgram(null);
                    onEdit(prog);
                  }}
                  className="px-4 py-2 bg-slate-900 border border-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2"
                >
                  <EditIcon className="w-4 h-4" />
                  Kemaskini
                </button>
              </div>
            )}
            {!user && (
              <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex justify-center w-full mt-auto shrink-0">
                <button
                  onClick={() => setViewingProgram(null)}
                  className="w-full py-2 bg-slate-900 border border-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Kembali
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
