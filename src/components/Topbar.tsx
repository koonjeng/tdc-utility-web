'use client';

import React from 'react';
import { Download, Shield } from 'lucide-react';
import { UserRole, FullMonthlyReportData } from '@/lib/types';
import { exportMonthlyReportsToExcel } from '@/lib/excelExport';

interface TopbarProps {
  title: string;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
  onAddNextYear: () => void;
  currentUser: { email: string; role: UserRole } | null;
  reportsData: FullMonthlyReportData[];
}

export const Topbar: React.FC<TopbarProps> = ({
  title,
  selectedYear,
  currentUser,
  reportsData,
}) => {
  const handleExportExcel = () => {
    exportMonthlyReportsToExcel(selectedYear, reportsData);
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 md:py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs sticky top-0 z-10">
      <div className="flex items-center gap-2.5 flex-wrap">
        <h2 className="text-base md:text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-between md:justify-end">
        {/* Role Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs shrink-0">
          <Shield className="w-3.5 h-3.5 text-sky-400" />
          <span>{currentUser ? currentUser.role.toUpperCase() : 'REPORTER'}</span>
        </div>
      </div>
    </header>
  );
};
