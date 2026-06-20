import React, { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ms } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Program, Zone, BzwSetting, ActivityCategory } from '../types';
import { SearchIcon, FilterIcon, FileTextIcon, TrashIcon, Edit2Icon, CalendarIcon, DownloadIcon, AlertCircleIcon, TagsIcon } from 'lucide-react';

interface ReportViewProps {
  programs: Program[];
  user: any;
  onEdit: (p: Program) => void;
  onDelete: (id: string) => void;
  bzwSettings?: BzwSetting[];
  categories?: ActivityCategory[];
}

export default function ReportView({ programs, user, onEdit, onDelete, bzwSettings, categories }: ReportViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState<Zone | 'All'>('All');
  const [sectorFilter, setSectorFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  
  const availableYears = bzwSettings && bzwSettings.length > 0 
    ? [...bzwSettings.map(s => s.year)].sort((a,b) => b - a) 
    : [new Date().getFullYear()];
    
  const [selectedYear, setSelectedYear] = useState<number | 'Semua'>(availableYears[0]);

  const filteredPrograms = useMemo(() => {
    return programs
      .filter(p => zoneFilter === 'All' || p.zone === zoneFilter)
      .filter(p => sectorFilter === 'All' || p.sector === sectorFilter)
      .filter(p => categoryFilter === 'All' || p.activityType === categoryFilter)
      .filter(p => {
        if (selectedYear === 'Semua') return true;
        const [y] = p.date.split('-');
        return parseInt(y, 10) === selectedYear;
      })
      .filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [programs, searchTerm, zoneFilter, sectorFilter, categoryFilter, selectedYear, bzwSettings]);

  const calculateProgramStats = (p: Program) => {
    const zakat = (p.collections || []).filter(c => c.collection_type === 'Zakat').reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const wakaf = (p.collections || []).filter(c => c.collection_type === 'Wakaf').reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const bilZakat = (p.collections || []).filter(c => c.collection_type === 'Zakat').reduce((sum, c) => sum + Number(c.payers_count || 0), 0);
    const bilWakaf = (p.collections || []).filter(c => c.collection_type === 'Wakaf').reduce((sum, c) => sum + Number(c.payers_count || 0), 0);
    const ttlKutipan = zakat + wakaf;
    const ttlBil = bilZakat + bilWakaf;
    const pc = Number(p.program_cost || 0);
    const roiNum = pc > 0 ? ((ttlKutipan - pc) / pc * 100) : null;
    const roi = roiNum !== null ? roiNum.toFixed(0) + '%' : '-';
    
    return { zakat, wakaf, bilZakat, bilWakaf, ttlKutipan, ttlBil, pc, roi };
  };

  const handleExportCSV = () => {
    // 1. Define headers
    const headers = ['Tajuk', 'Tarikh', 'Masa', 'Zon', 'Jenis Aktiviti', 'Lokasi', 'PIC Program', 'Peserta', 'Status', 'Catatan'];
    
    // 2. Format rows
    const rows = filteredPrograms.map(p => [
      `"${p.title.replace(/"/g, '""')}"`,
      p.date,
      p.time || '',
      p.zone,
      p.activityType || '',
      `"${(p.location || '').replace(/"/g, '""')}"`,
      `"${(p.pic_program || '').replace(/"/g, '""')}"`,
      `"${(p.participants || '').replace(/"/g, '""')}"`,
      p.status || 'Dirancang',
      `"${(p.description || '').replace(/"/g, '""')}"`
    ]);
    
    // 3. Combine to CSV string
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    // 4. Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Aktiviti_BZW_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    
    // Add Report Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(selectedYear === 'Semua' ? "REKOD AKTIVITI KESELURUHAN BULAN ZAKAT & WAKAF" : `REKOD AKTIVITI BULAN ZAKAT & WAKAF ${selectedYear}`, 10, 20);
    
    // Add filter status
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    const subTitle = zoneFilter !== 'All' ? `LAPORAN PENGURUSAN AKTIVITI - ${zoneFilter}` : 'SENARAI KESELURUHAN AKTIVITI MENGIKUT ZON';
    doc.text(subTitle, 10, 26);
    
    // Add print date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    const printDate = `Dicetak pada: ${format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: ms })}`;
    doc.text(printDate, 10, 32);

    if (activeZones.length === 0) {
      doc.text("Tiada program ditemui berdasarkan carian atau filter anda.", 10, 45);
    } else {
      let currentY = 40;

      activeZones.forEach((zone) => {
        // Add new page if Y gets too close to bottom before adding title
        if (currentY > 180) {
          doc.addPage();
          currentY = 20;
        }

        const zonePrograms = groupedPrograms[zone];
        
        // Zone Title
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(`${zone.toUpperCase()} (${zonePrograms.length} Aktiviti)`, 10, currentY);

        const tableColumn = ["Tarikh", "Program / Aktiviti", "Lokasi & PIC", "Jumlah Kutipan", "Status"];
        const tableRows = zonePrograms.map(p => {
          const { zakat, wakaf, bilZakat, bilWakaf, ttlKutipan, ttlBil, pc, roi } = calculateProgramStats(p);
          
          const fmtAmt = (num: number) => Number(num).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const fmtBil = (num: number) => Number(num).toLocaleString('en-MY') + ' orang';
          
          return [
            `${p.date ? (() => {
              const [y, m, d] = p.date.split('T')[0].split('-');
              return `${d}/${m}/${y.substring(2)}`;
            })() : ''}\n${p.time || '-'}`,
            `${p.title}${p.activityType ? `\nJenis: ${p.activityType}` : ''}${p.sector ? `\nSektor: ${p.sector}` : ''}`,
            `${p.location || '-'}\nPIC: ${p.pic_program || '-'}`,
            `Zakat: ${fmtBil(bilZakat)} | RM ${fmtAmt(zakat)}\nWakaf: ${fmtBil(bilWakaf)} | RM ${fmtAmt(wakaf)}\n--------------------------\nJumlah: ${fmtBil(ttlBil)} | RM ${fmtAmt(ttlKutipan)}`,
            p.status || 'Dirancang'
          ];
        });

        autoTable(doc, {
          startY: currentY + 4,
          head: [tableColumn],
          body: tableRows,
          theme: 'grid',
          headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: 'bold', lineColor: [226, 232, 240], lineWidth: 0.1 },
          bodyStyles: { textColor: [51, 65, 85], lineColor: [226, 232, 240], lineWidth: 0.1 },
          alternateRowStyles: { fillColor: [253, 254, 255] },
          styles: { font: 'helvetica', fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 55 },
            3: { cellWidth: 50 },
            4: { cellWidth: 20 }
          },
          margin: { left: 10, right: 10 }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 12;
      });
    }

    const pdfBlobUrl = doc.output('bloburl');
    window.open(pdfBlobUrl, '_blank');
  };

  const groupedPrograms = useMemo(() => {
    const zones: Zone[] = ['HQ', 'Zon Timur', 'Zon Tengah', 'Zon Barat'];
    const groups: Record<string, Program[]> = {};
    
    zones.forEach(z => {
      groups[z] = filteredPrograms.filter(p => p.zone === z);
    });
    
    return groups;
  }, [filteredPrograms]);

  const zoneColors: Record<Zone, string> = {
    'HQ': 'bg-slate-800 text-white',
    'Zon Timur': 'bg-blue-600 text-white',
    'Zon Tengah': 'bg-amber-500 text-amber-950',
    'Zon Barat': 'bg-emerald-600 text-white',
  };

  const activeZones = useMemo(() => {
    return Object.keys(groupedPrograms).filter(z => groupedPrograms[z].length > 0);
  }, [groupedPrograms]);

  return (
    <div className="space-y-6">
      {/* Controls (Hidden when printing) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:hidden">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative">
              <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari program atau lokasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-slate-700"
              />
            </div>
            
            <div className="relative">
              <FilterIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value as any)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-slate-700 appearance-none"
              >
                <option value="All">Semua Zon</option>
                <option value="HQ">HQ</option>
                <option value="Zon Timur">Zon Timur</option>
                <option value="Zon Tengah">Zon Tengah</option>
                <option value="Zon Barat">Zon Barat</option>
              </select>
            </div>

            <div className="relative">
              <FilterIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-slate-700 appearance-none"
              >
                <option value="All">Semua Sektor</option>
                <option value="Zakat">Zakat</option>
                <option value="Wakaf">Wakaf</option>
              </select>
            </div>

            <div className="relative">
              <TagsIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-slate-700 appearance-none"
              >
                <option value="All">Semua Kategori</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <CalendarIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value === 'Semua' ? 'Semua' : parseInt(e.target.value))}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-slate-700 appearance-none"
              >
                <option value="Semua">Semua Tahun</option>
                {availableYears.map(yr => {
                  const s = bzwSettings?.find(b => b.year === yr);
                  return <option key={yr} value={yr}>BZW {yr} {s?.hijri_year ? `(${s.hijri_year})` : ''}</option>;
                })}
              </select>
            </div>
          </div>

          {user && (
            <div className="w-full md:w-auto flex flex-wrap gap-2">
              <button 
                onClick={handleExportCSV}
                title="Eksport ke CSV"
                className="flex-1 min-w-[120px] md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200"
              >
                <DownloadIcon className="w-4 h-4" />
                <span className="hidden sm:inline">CSV</span>
              </button>

              <button 
                onClick={handleExportPDF}
                title="Pratinjau PDF"
                className="flex-1 min-w-[120px] md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors border border-emerald-700"
              >
                <FileTextIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Pratinjau PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Printable Report Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 print:shadow-none print:border-none print:p-0 print:text-black">
        <div className="text-center mb-8 pb-6 border-b-2 border-slate-200 print:mb-6 print:pb-4">
          <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight print:text-lg">
            {selectedYear === 'Semua' ? 'REKOD AKTIVITI KESELURUHAN BULAN ZAKAT & WAKAF' : `REKOD AKTIVITI BULAN ZAKAT & WAKAF ${selectedYear}`}
          </h2>
          <p className="text-slate-500 mt-2 font-semibold print:text-sm print:text-slate-600 uppercase">
            {zoneFilter !== 'All' ? `LAPORAN PENGURUSAN AKTIVITI - ${zoneFilter}` : 'SENARAI KESELURUHAN AKTIVITI MENGIKUT ZON'}
          </p>
          <p className="hidden print:block text-xs mt-1 text-slate-400">
            Dicetak pada: {format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: ms })}
          </p>
        </div>

        {activeZones.length === 0 ? (
          <div className="text-center py-12 text-slate-400 flex flex-col items-center">
            <FileTextIcon className="w-12 h-12 mb-3 opacity-20" />
            <p>Tiada program ditemui berdasarkan carian atau filter anda.</p>
          </div>
        ) : (
          <div className="space-y-12 print:space-y-8">
            {activeZones.map((zone) => (
              <div key={zone} className="print:break-inside-avoid">
                <div className="flex items-center gap-3 mb-4 border-b pb-2 border-slate-100">
                  <h3 className={`px-4 py-1.5 rounded-lg font-bold text-sm tracking-widest uppercase shadow-sm ${zoneColors[zone as Zone]}`}>
                    {zone}
                  </h3>
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
                    {groupedPrograms[zone].length} Aktiviti
                  </span>
                </div>

                <div className="overflow-x-auto bg-white border border-slate-100 rounded-lg shadow-sm print:overflow-visible print:shadow-none print:border-none print:rounded-none">
                  <table className="w-full text-left border-collapse min-w-[1000px] md:min-w-full print:min-w-full print:border print:border-slate-400">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-200 print:bg-slate-100 print:text-black print:border-b-2 print:border-slate-400">
                      <tr>
                        <th className="px-3 py-3 w-[10%] print:border print:border-slate-400">Tarikh</th>
                        <th className="px-3 py-3 w-[28%] print:border print:border-slate-400">Program / Aktiviti</th>
                        <th className="px-3 py-3 w-[22%] print:border print:border-slate-400">Lokasi & PIC</th>
                        <th className="px-3 py-3 w-[20%] print:border print:border-slate-400">{user ? 'Impak Kewangan' : 'Jumlah Kutipan'}</th>
                        <th className="px-3 py-3 w-[10%] text-center print:border print:border-slate-400">Status</th>
                        {user && <th className="px-3 py-3 w-[10%] text-center print:hidden">Tindakan</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-slate-400">
                      {groupedPrograms[zone].map((program) => {
                        const { zakat, wakaf, bilZakat, bilWakaf, ttlKutipan, ttlBil, pc, roi } = calculateProgramStats(program);
                        
                        const fmtAmt = (num: number) => Number(num).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        const fmtBil = (num: number) => Number(num).toLocaleString('en-MY') + ' orang';
                        
                        return (
                        <tr key={program.id} className="group hover:bg-slate-50 transition-colors text-[11px] print:hover:bg-transparent text-slate-800 print:text-black">
                          <td className="px-3 py-3 align-top leading-tight print:border print:border-slate-400">
                            <div className="font-bold text-slate-800 print:text-black">
                               {program.date ? (() => {
                                  const [y, m, d] = program.date.split('T')[0].split('-');
                                  return `${d}/${m}/${y.substring(2)}`;
                               })() : ''}
                            </div>
                            <div className="text-slate-400 print:text-slate-600 font-medium text-[10px] mt-0.5">{program.time || ''}</div>
                          </td>
                          <td className="px-3 py-3 align-top print:border print:border-slate-400">
                            <div className="font-bold text-slate-800 print:text-black leading-tight">
                              {program.title}
                            </div>
                            {(program.activityType || program.sector) && (
                              <div className="mt-0.5 flex flex-wrap gap-1 items-center text-[9px] font-bold uppercase tracking-tight">
                                {program.activityType && <span className="text-emerald-600 print:text-emerald-800">{program.activityType}</span>}
                                {program.activityType && program.sector && <span className="text-slate-300 print:text-slate-400">|</span>}
                                {program.sector && <span className="text-blue-600 print:text-blue-800">{program.sector}</span>}
                              </div>
                            )}
                            {program.description && (
                              <div className="mt-1 text-slate-500 print:text-slate-700 text-[10px] italic line-clamp-2 print:line-clamp-none">
                                {program.description}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 align-top print:border print:border-slate-400">
                            <div className="font-medium text-slate-600 print:text-black leading-tight break-words">{program.location || '-'}</div>
                            <div className="text-slate-700 print:text-black font-semibold mt-1">PIC: {program.pic_program || '-'}</div>
                            {program.participants && (
                               <div className="text-[10px] text-slate-400 print:text-slate-600 mt-0.5 line-clamp-1 print:line-clamp-none">{program.participants}</div>
                            )}
                          </td>
                          <td className="px-3 py-3 align-top print:border print:border-slate-400">
                            <div className="flex flex-col gap-1 text-[10px] print:text-black">
                              {user && (
                                <div className="flex justify-between text-slate-600 print:text-black">
                                  <span className="text-slate-400 print:text-slate-700">Kos Program:</span> <span className="font-semibold text-rose-600 print:text-rose-800">RM {fmtAmt(pc)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-slate-600 print:text-black">
                                <span className="text-slate-400 print:text-slate-700">Zakat:</span> <span>{fmtBil(bilZakat)} <span className="text-slate-300 print:text-slate-500 mx-0.5">|</span> RM {fmtAmt(zakat)}</span>
                              </div>
                              <div className="flex justify-between text-slate-600 print:text-black">
                                <span className="text-slate-400 print:text-slate-700">Wakaf:</span> <span>{fmtBil(bilWakaf)} <span className="text-slate-300 print:text-slate-500 mx-0.5">|</span> RM {fmtAmt(wakaf)}</span>
                              </div>
                              <div className="border-t border-slate-200 print:border-slate-400 mt-0.5 mb-1"></div>
                              <div className="flex justify-between font-bold text-slate-800 print:text-black">
                                <span className="text-slate-500 print:text-slate-700">Jumlah:</span> <span className="text-emerald-600 print:text-emerald-800">{fmtBil(ttlBil)} <span className="text-emerald-200 print:text-slate-300 mx-0.5">|</span> RM {fmtAmt(ttlKutipan)}</span>
                              </div>
                              {user && (
                                <div className="flex justify-between font-bold text-slate-800 print:text-black">
                                  <span className="text-slate-500 print:text-slate-700">ROI:</span> <span className="text-emerald-600 print:text-emerald-800 bg-emerald-50 print:bg-transparent print:border-none px-1 rounded">{roi}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 align-top text-center print:border print:border-slate-400">
                              <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded border print:border-none print:px-0 print:py-0 print:text-black ${
                                program.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                program.status === 'Batal' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {program.status || 'Dirancang'}
                              </span>
                          </td>
                          {user && (
                            <td className="px-3 py-3 align-top text-center print:hidden">
                              <div className="flex justify-center gap-1">
                                <button onClick={() => onEdit(program)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit2Icon className="w-3.5 h-3.5"/></button>
                                <button onClick={() => onDelete(program.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Padam"><TrashIcon className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          )}
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Print-only footer */}
      <div className="hidden print:block text-center mt-8 text-slate-500 text-sm">
        <p>Dicetak pada: {format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: ms })}</p>
      </div>
    </div>
  );
}
