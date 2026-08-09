'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Leaf,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileEdit,
  History,
  BarChart3,
  Calendar,
  Layers,
  Droplets,
  Factory,
  Flame,
  Zap,
  Sun,
  Activity,
  FlaskConical,
  Filter,
  ArrowRightLeft,
  PieChart as PieIcon,
  ShieldAlert,
  Inbox,
  Sparkles,
  ChevronDown,
  RotateCcw,
  Settings,
  X,
  SlidersHorizontal,
  Eye,
  CheckSquare,
  Square,
  LayoutGrid,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { FullMonthlyReportData, ReportData, CategorySubmission } from '@/lib/types';
import { calculateMetrics, MONTH_NAMES_TH, MONTH_SHORT_TH } from '@/lib/calculations';
import { getCategorySubmissions } from '@/lib/supabase';

interface DashboardViewProps {
  selectedYear: number;
  reportsData: FullMonthlyReportData[];
  prevReportsData: FullMonthlyReportData[];
  onSelectMonth: (month: number) => void;
}

// Compact Number Formatter (e.g. 11.84M, 28.3k, 418)
function formatCompact(num: number, decimals: number = 1): string {
  if (!num || isNaN(num)) return '0';
  if (Math.abs(num) >= 1_000_000) {
    return (num / 1_000_000).toFixed(decimals).replace(/\.0$/, '') + 'M';
  }
  if (Math.abs(num) >= 100_000) {
    return (num / 1_000).toFixed(decimals).replace(/\.0$/, '') + 'k';
  }
  return num.toLocaleString('th-TH', { maximumFractionDigits: decimals });
}

// Format YYYY-MM-DD to DD/MM/YYYY (Standard AD Year ค.ศ. ปกติ)
function formatDateTH(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  let yearNum = parseInt(y, 10);
  if (yearNum > 2500) {
    yearNum -= 543;
  }
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${yearNum}`;
}

// Custom DatePicker Component ensuring 100% DD/MM/YYYY formatting
const DatePickerTH: React.FC<{
  value: string;
  onChange: (val: string) => void;
  className?: string;
}> = ({ value, onChange, className = '' }) => {
  const formattedDisplay = useMemo(() => formatDateTH(value), [value]);

  return (
    <div className="relative inline-flex items-center">
      <div className={`bg-white px-2.5 py-1 rounded-lg border border-slate-300 text-slate-900 font-extrabold text-xs flex items-center justify-between gap-1.5 cursor-pointer min-w-[110px] shadow-2xs hover:border-sky-500 transition-colors ${className}`}>
        <span>{formattedDisplay || 'dd/mm/yyyy'}</span>
        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </div>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
      />
    </div>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  selectedYear,
  reportsData,
  prevReportsData,
  onSelectMonth,
}) => {
  // Calendar Date Range Filter State (Default to current year full range or current date)
  const [startDate, setStartDate] = useState<string>(`${selectedYear}-01-01`);
  const [endDate, setEndDate] = useState<string>(`${selectedYear}-12-31`);

  // Date Comparison State
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [compStartDate, setCompStartDate] = useState<string>(`${selectedYear - 1}-01-01`);
  const [compEndDate, setCompEndDate] = useState<string>(`${selectedYear - 1}-12-31`);

  // Chart View Mode Control State (Daily / Monthly / YoY)
  const [chartMode, setChartMode] = useState<'daily' | 'monthly' | 'yoy'>('monthly');
  // Target month for Daily (1 month) chart view (1-12)
  const [selectedDailyMonth, setSelectedDailyMonth] = useState<number>(new Date().getMonth() + 1);
  // Comparison year for YoY mode
  const [yoyCompYear, setYoyCompYear] = useState<number>(selectedYear - 1);

  // Customization Settings Modal State for Top KPIs, Middle Panels, and Bottom Charts
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'kpi' | 'panel' | 'chart'>('kpi');

  // Helper: load saved settings from localStorage
  const loadSavedSetting = <T extends Record<string, boolean>>(key: string, defaults: T): T => {
    if (typeof window === 'undefined') return defaults;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults so new keys are included
        return { ...defaults, ...parsed };
      }
    } catch { }
    return defaults;
  };

  // Default values
  const defaultKpis: Record<string, boolean> = {
    sludge: true,
    oil: true,
    electric: true,
    solar: false,
    production: true,
    oilPerTonFg: true,
    wwtEff: true,
    biogasEff: true,
    kpiCost: true,
  };
  const defaultPanels: Record<string, boolean> = { wwtp: true, biogas: true };
  const defaultCharts: Record<string, boolean> = {
    sludge: true,
    oil: true,
    electric: true,
    wwtEff: true,
    biogasEff: true,
  };

  // State for top KPI card visibility customization (persisted)
  const [selectedKpis, setSelectedKpis] = useState<Record<string, boolean>>(() =>
    loadSavedSetting('tdc_dashboard_kpis', defaultKpis)
  );

  // State for middle parameter panel visibility customization (persisted)
  const [selectedPanels, setSelectedPanels] = useState<Record<string, boolean>>(() =>
    loadSavedSetting('tdc_dashboard_panels', defaultPanels)
  );

  // State for bottom chart visibility customization (persisted)
  const [selectedCharts, setSelectedCharts] = useState<Record<string, boolean>>(() =>
    loadSavedSetting('tdc_dashboard_charts', defaultCharts)
  );

  // Auto-save settings to localStorage whenever selections change
  useEffect(() => {
    try {
      localStorage.setItem('tdc_dashboard_kpis', JSON.stringify(selectedKpis));
    } catch { }
  }, [selectedKpis]);

  useEffect(() => {
    try {
      localStorage.setItem('tdc_dashboard_panels', JSON.stringify(selectedPanels));
    } catch { }
  }, [selectedPanels]);

  useEffect(() => {
    try {
      localStorage.setItem('tdc_dashboard_charts', JSON.stringify(selectedCharts));
    } catch { }
  }, [selectedCharts]);
  const toggleKpi = (key: string) => {
    setSelectedKpis((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllKpis = (select: boolean) => {
    setSelectedKpis({
      sludge: select,
      oil: select,
      electric: select,
      solar: select,
      production: select,
      oilPerTonFg: select,
      wwtEff: select,
      biogasEff: select,
      kpiCost: select,
    });
  };

  const togglePanel = (key: string) => {
    setSelectedPanels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllPanels = (select: boolean) => {
    setSelectedPanels({
      wwtp: select,
      biogas: select,
    });
  };

  const toggleChart = (key: string) => {
    setSelectedCharts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllCharts = (select: boolean) => {
    setSelectedCharts({
      sludge: select,
      oil: select,
      electric: select,
      wwtEff: select,
      biogasEff: select,
    });
  };

  // Toggle comparison mode and auto-switch chart mode to daily
  const handleToggleCompare = () => {
    const nextVal = !isComparing;
    setIsComparing(nextVal);
    if (nextVal) {
      setChartMode('daily');
    }
  };

  const [currentCategorySubmissions, setCurrentCategorySubmissions] = useState<CategorySubmission[]>([]);
  const [prevCategorySubmissions, setPrevCategorySubmissions] = useState<CategorySubmission[]>([]);

  const targetCompYear = useMemo(() => {
    return chartMode === 'yoy' ? yoyCompYear : selectedYear - 1;
  }, [chartMode, yoyCompYear, selectedYear]);

  useEffect(() => {
    async function loadDashSubs() {
      const curr = await getCategorySubmissions(selectedYear);
      const prev = await getCategorySubmissions(targetCompYear);
      setCurrentCategorySubmissions(curr);
      setPrevCategorySubmissions(prev);
    }
    loadDashSubs();
  }, [selectedYear, targetCompYear]);

  // Derived Month Range Bounds from Selected Dates
  const startMonth = useMemo(() => {
    if (!startDate) return 1;
    const parts = startDate.split('-');
    const m = parts.length > 1 ? parseInt(parts[1], 10) : 1;
    return isNaN(m) || m < 1 || m > 12 ? 1 : m;
  }, [startDate]);

  const endMonth = useMemo(() => {
    if (!endDate) return 12;
    const parts = endDate.split('-');
    const m = parts.length > 1 ? parseInt(parts[1], 10) : 12;
    return isNaN(m) || m < 1 || m > 12 ? 12 : m;
  }, [endDate]);

  // Derived Month Range Bounds for Comparison
  const compStartMonth = useMemo(() => {
    if (!compStartDate) return 1;
    const parts = compStartDate.split('-');
    const m = parts.length > 1 ? parseInt(parts[1], 10) : 1;
    return isNaN(m) || m < 1 || m > 12 ? 1 : m;
  }, [compStartDate]);

  const compEndMonth = useMemo(() => {
    if (!compEndDate) return 12;
    const parts = compEndDate.split('-');
    const m = parts.length > 1 ? parseInt(parts[1], 10) : 12;
    return isNaN(m) || m < 1 || m > 12 ? 12 : m;
  }, [compEndDate]);

  // Helper: Accumulate numeric fields from a submission into merged data
  const accumulateMerge = (base: Partial<ReportData>, incoming: Partial<ReportData>): Partial<ReportData> => {
    const result: any = { ...base };
    const skip = new Set(['report_id', 'reporter_name', 'reporter_id', 'report_date', 'submitted_category', 'sludge_removal_desc', 'sludge_vac_removal_desc', 'biogas_air_dryer_drain', 'sludge_use_vacuum_truck']);
    for (const key of Object.keys(incoming)) {
      const val = (incoming as any)[key];
      if (skip.has(key) || val === undefined || val === null || val === '') continue;
      if (typeof val === 'number') {
        result[key] = (Number(result[key]) || 0) + val;
      } else if (typeof val === 'boolean') {
        result[key] = val;
      } else {
        // For string fields not in skip, keep the latest value
        result[key] = val;
      }
    }
    return result;
  };

  // Comprehensive Merge of Monthly Reports + Per-Category Submissions for Current Year
  const mergedMonthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => {
      const monthNum = idx + 1;
      const monthlyReportObj = reportsData.find((r) => r.report.month === monthNum);
      const catSubs = currentCategorySubmissions.filter((c) => c.month === monthNum);

      let mergedData: Partial<ReportData> = {
        report_id: `m_${monthNum}`,
        reporter_name: '',
        reporter_id: '',
        report_date: '',
        production_cassava: 0,
        production_modified: 0,
        hours_cassava: 0,
        hours_modified: 0,
        electricity_kwh: 0,
        electricity_baht: 0,
        renewable_biogas_m3: 0,
        renewable_solar_kwh: 0,
      };

      if (monthlyReportObj && monthlyReportObj.report.status !== 'empty') {
        mergedData = { ...mergedData, ...monthlyReportObj.data };
      }

      catSubs.forEach((sub) => {
        mergedData = accumulateMerge(mergedData, sub.data);
        mergedData.reporter_name = sub.reporter_name || mergedData.reporter_name;
        mergedData.reporter_id = sub.reporter_id || mergedData.reporter_id;
        mergedData.report_date = sub.report_date || mergedData.report_date;
      });

      const hasData =
        (monthlyReportObj && monthlyReportObj.report.status !== 'empty') || catSubs.length > 0;

      return {
        month: monthNum,
        hasData,
        data: mergedData,
        status: monthlyReportObj?.report?.status || (catSubs.length > 0 ? catSubs[0].status : 'empty'),
      };
    });
  }, [reportsData, currentCategorySubmissions]);

  // Filtered Monthly Data matching Selected Date Range
  const filteredMonthlyData = useMemo(() => {
    return mergedMonthlyData.filter((item) => item.month >= startMonth && item.month <= endMonth);
  }, [mergedMonthlyData, startMonth, endMonth]);

  // Comprehensive Merge for Previous Year (YoY)
  const prevMergedMonthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => {
      const monthNum = idx + 1;
      const monthlyReportObj = prevReportsData.find((r) => r.report.month === monthNum);
      const catSubs = prevCategorySubmissions.filter((c) => c.month === monthNum);

      let mergedData: Partial<ReportData> = {
        report_id: `m_prev_${monthNum}`,
        reporter_name: '',
        reporter_id: '',
        report_date: '',
        production_cassava: 0,
        production_modified: 0,
        hours_cassava: 0,
        hours_modified: 0,
        electricity_kwh: 0,
        electricity_baht: 0,
        renewable_biogas_m3: 0,
        renewable_solar_kwh: 0,
      };

      if (monthlyReportObj && monthlyReportObj.report.status !== 'empty') {
        mergedData = { ...mergedData, ...monthlyReportObj.data };
      }

      catSubs.forEach((sub) => {
        mergedData = accumulateMerge(mergedData, sub.data);
        mergedData.reporter_name = sub.reporter_name || mergedData.reporter_name;
        mergedData.reporter_id = sub.reporter_id || mergedData.reporter_id;
        mergedData.report_date = sub.report_date || mergedData.report_date;
      });

      const hasData =
        (monthlyReportObj && monthlyReportObj.report.status !== 'empty') || catSubs.length > 0;

      return {
        month: monthNum,
        hasData,
        data: mergedData,
        status: monthlyReportObj?.report?.status || (catSubs.length > 0 ? catSubs[0].status : 'empty'),
      };
    });
  }, [prevReportsData, prevCategorySubmissions]);

  // Filtered Comparison Monthly Data
  const compFilteredMonthlyData = useMemo(() => {
    return prevMergedMonthlyData.filter((item) => item.month >= compStartMonth && item.month <= compEndMonth);
  }, [prevMergedMonthlyData, compStartMonth, compEndMonth]);

  // Filtered Category Submissions for Selected Dates
  const filteredSubmissions = useMemo(() => {
    return currentCategorySubmissions.filter((sub) => {
      if (sub.report_date) {
        if (startDate && sub.report_date < startDate) return false;
        if (endDate && sub.report_date > endDate) return false;
      } else if (sub.month) {
        if (sub.month < startMonth || sub.month > endMonth) return false;
      }
      return true;
    });
  }, [currentCategorySubmissions, startDate, endDate, startMonth, endMonth]);

  // Aggregate Metrics Summary REACTIVE to Selected Calendar Range
  const currentMetricsSummary = useMemo(() => {
    let ytdProduction = 0;
    let ytdCost = 0;
    let totalBiogasM3 = 0;
    let totalSolarKwh = 0;
    let totalPeaKwh = 0;
    let totalSludgeTons = 0;
    let fuelOilLiterTotal = 0;

    filteredMonthlyData.forEach((item) => {
      if (item.hasData) {
        const m = calculateMetrics(item.data);
        ytdProduction += m.totalProductionTons;
        ytdCost += m.totalCostBaht;
        totalBiogasM3 += m.gasTotalM3 || item.data.renewable_biogas_m3 || 0;
        totalSolarKwh += m.elecTotalSolarKwh;
        totalPeaKwh += m.elecTotalPeaKwh;
        totalSludgeTons += item.data.sludge_tons || 0;
        fuelOilLiterTotal += m.fuelOilTotalLiter;
      }
    });

    const costPerTon = ytdProduction > 0 ? ytdCost / ytdProduction : 0;

    return {
      ytdProduction,
      ytdCost,
      costPerTon,
      totalBiogasM3,
      totalSolarKwh,
      totalPeaKwh,
      totalSludgeTons,
      fuelOilLiterTotal,
    };
  }, [filteredMonthlyData]);

  // Aggregate Comparison Metrics Summary REACTIVE to Comparison Calendar Range
  const compMetricsSummary = useMemo(() => {
    let ytdProduction = 0;
    let ytdCost = 0;
    let totalSolarKwh = 0;
    let totalPeaKwh = 0;
    let totalSludgeTons = 0;
    let fuelOilLiterTotal = 0;

    compFilteredMonthlyData.forEach((item) => {
      if (item.hasData) {
        const m = calculateMetrics(item.data);
        ytdProduction += m.totalProductionTons;
        ytdCost += m.totalCostBaht;
        totalSolarKwh += m.elecTotalSolarKwh;
        totalPeaKwh += m.elecTotalPeaKwh;
        totalSludgeTons += item.data.sludge_tons || 0;
        fuelOilLiterTotal += m.fuelOilTotalLiter;
      }
    });

    const costPerTon = ytdProduction > 0 ? ytdCost / ytdProduction : 0;

    return {
      ytdProduction,
      ytdCost,
      costPerTon,
      totalSolarKwh,
      totalPeaKwh,
      totalSludgeTons,
      fuelOilLiterTotal,
    };
  }, [compFilteredMonthlyData]);

  // Fuel Oil Liter Per Ton Finished Goods (Formula: Oil Liters / Production Tons)
  const oilPerTonFgVal = useMemo(() => {
    return currentMetricsSummary.ytdProduction > 0
      ? currentMetricsSummary.fuelOilLiterTotal / currentMetricsSummary.ytdProduction
      : 0;
  }, [currentMetricsSummary]);

  const compOilPerTonFgVal = useMemo(() => {
    return compMetricsSummary.ytdProduction > 0
      ? compMetricsSummary.fuelOilLiterTotal / compMetricsSummary.ytdProduction
      : 0;
  }, [compMetricsSummary]);

  // Latest Category 5 WWT & Biogas parameters for Middle Panels
  const latestCat5Data = useMemo(() => {
    const cat5Subs = filteredSubmissions
      .filter((s) => s.category_key === 'cat5' || Boolean(s.data.wwt_cod_native || s.data.biogas_generate || s.data.biogas_pct_h2s))
      .sort((a, b) => (b.report_date || '').localeCompare(a.report_date || ''));

    if (cat5Subs.length > 0) {
      return cat5Subs[0].data;
    }

    const mData = filteredMonthlyData.find((m) => m.hasData && (m.data.wwt_cod_native || m.data.biogas_generate));
    return mData ? mData.data : {};
  }, [filteredSubmissions, filteredMonthlyData]);

  // Dynamic System-Based WWT Efficiency (%) Calculation
  const wwtEfficiencyVal = useMemo(() => {
    const codIn = Number(latestCat5Data.wwt_cod_native) || Number(latestCat5Data.wwt_cod_loading) || 0;
    const codOut = Number(latestCat5Data.wwt_codt_mix1) || Number(latestCat5Data.wwt_cod_eff_as) || 0;
    if (codIn > 0) {
      return Math.min(100, Math.max(0, ((codIn - codOut) / codIn) * 100));
    }
    return 0;
  }, [latestCat5Data]);

  // Dynamic System-Based Biogas Efficiency (%) Calculation
  const biogasEfficiencyVal = useMemo(() => {
    if (latestCat5Data.biogas_removal) return Number(latestCat5Data.biogas_removal);
    const h2s = Number(latestCat5Data.biogas_pct_h2s) || 0;
    if (h2s > 0) return Math.max(0, 100 - h2s / 100);
    if (latestCat5Data.biogas_pct_ch4) return Number(latestCat5Data.biogas_pct_ch4);
    return 0;
  }, [latestCat5Data]);

  // Days count for selected target month (e.g. 28, 30, or 31 days)
  const selectedMonthDaysCount = useMemo(() => {
    const targetM = chartMode === 'daily' ? selectedDailyMonth : startMonth;
    return new Date(selectedYear, targetM, 0).getDate();
  }, [selectedYear, startMonth, selectedDailyMonth, chartMode]);

  // Daily Chart Items (Day 1 to Day 31 comparison within 1 month)
  const dailyMonthChartItems = useMemo(() => {
    const items = [];
    const activeM = chartMode === 'daily' ? selectedDailyMonth : startMonth;
    const targetMonthStr = String(activeM).padStart(2, '0');
    const compMonthStr = String(compStartMonth).padStart(2, '0');
    const compYear = isComparing && compStartDate ? compStartDate.split('-')[0] : String(selectedYear - 1);

    for (let day = 1; day <= selectedMonthDaysCount; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dKeyCurr = `${selectedYear}-${targetMonthStr}-${dayStr}`;
      const dKeyComp = `${compYear}-${compMonthStr}-${dayStr}`;

      // Primary Month Entry
      const subCurr = currentCategorySubmissions.find((s) => s.report_date === dKeyCurr);
      const dDataCurr = subCurr ? subCurr.data : {};
      const mCurr = calculateMetrics(dDataCurr);

      const codInCurr = Number(dDataCurr.wwt_cod_native) || Number(dDataCurr.wwt_cod_loading) || 0;
      const codOutCurr = Number(dDataCurr.wwt_codt_mix1) || Number(dDataCurr.wwt_cod_eff_as) || 0;
      const wwtEffCurr = codInCurr > 0 ? Math.min(100, Math.max(0, ((codInCurr - codOutCurr) / codInCurr) * 100)) : 0;
      const h2sCurr = Number(dDataCurr.biogas_pct_h2s) || 0;
      const biogasEffCurr = Number(dDataCurr.biogas_removal) || (h2sCurr > 0 ? Math.max(0, 100 - h2sCurr / 100) : 0);

      // Comparison Month Entry
      const subPrev =
        prevCategorySubmissions.find((s) => s.report_date === dKeyComp) ||
        currentCategorySubmissions.find((s) => s.report_date === dKeyComp);
      const dDataPrev = subPrev ? subPrev.data : {};
      const mPrev = calculateMetrics(dDataPrev);

      const codInPrev = Number(dDataPrev.wwt_cod_native) || Number(dDataPrev.wwt_cod_loading) || 0;
      const codOutPrev = Number(dDataPrev.wwt_codt_mix1) || Number(dDataPrev.wwt_cod_eff_as) || 0;
      const wwtEffPrev = codInPrev > 0 ? Math.min(100, Math.max(0, ((codInPrev - codOutPrev) / codInPrev) * 100)) : 0;
      const h2sPrev = Number(dDataPrev.biogas_pct_h2s) || 0;
      const biogasEffPrev = Number(dDataPrev.biogas_removal) || (h2sPrev > 0 ? Math.max(0, 100 - h2sPrev / 100) : 0);

      items.push({
        dayLabel: `${day}`,
        sludgeTons: Number(dDataCurr.sludge_tons || 0),
        sludgePrev: Number(dDataPrev.sludge_tons || 0),
        oilLiters: mCurr.fuelOilTotalLiter,
        oilPrev: mPrev.fuelOilTotalLiter,
        elecKwh: mCurr.elecTotalPeaKwh + mCurr.elecTotalSolarKwh,
        elecPrev: mPrev.elecTotalPeaKwh + mPrev.elecTotalSolarKwh,
        wwtEff: wwtEffCurr,
        wwtEffPrev,
        biogasEff: biogasEffCurr,
        biogasEffPrev,
      });
    }

    return items;
  }, [selectedMonthDaysCount, startMonth, selectedDailyMonth, chartMode, compStartMonth, selectedYear, currentCategorySubmissions, prevCategorySubmissions, isComparing, compStartDate]);

  // --- DYNAMIC DATASETS FOR THE 5 BOTTOM TREND CHARTS (Daily / Monthly / YoY) ---

  // 1. Sludge Removal Chart Data
  const sludgeChartData = useMemo(() => {
    if (chartMode === 'daily') {
      return dailyMonthChartItems.map((item) => ({
        month: item.dayLabel,
        tons: item.sludgeTons,
        currentYear: item.sludgeTons,
        prevYear: item.sludgePrev,
      }));
    }

    return filteredMonthlyData.map((item) => {
      const pItem = prevMergedMonthlyData.find((p) => p.month === item.month);
      const val = item.hasData ? Number(item.data.sludge_tons || 0) : 0;
      const prevVal = pItem?.hasData ? Number(pItem.data.sludge_tons || 0) : 0;
      return {
        month: MONTH_SHORT_TH[item.month - 1],
        tons: val,
        currentYear: val,
        prevYear: prevVal,
      };
    });
  }, [filteredMonthlyData, prevMergedMonthlyData, dailyMonthChartItems, chartMode]);

  // 2. Oil Usage Chart Data
  const oilChartData = useMemo(() => {
    if (chartMode === 'daily') {
      return dailyMonthChartItems.map((item) => ({
        month: item.dayLabel,
        liters: item.oilLiters,
        currentYear: item.oilLiters,
        prevYear: item.oilPrev,
      }));
    }

    return filteredMonthlyData.map((item) => {
      const pItem = prevMergedMonthlyData.find((p) => p.month === item.month);
      const mCurr = calculateMetrics(item.data);
      const mPrev = pItem ? calculateMetrics(pItem.data) : null;
      const val = item.hasData ? mCurr.fuelOilTotalLiter : 0;
      const prevVal = pItem?.hasData && mPrev ? mPrev.fuelOilTotalLiter : 0;
      return {
        month: MONTH_SHORT_TH[item.month - 1],
        liters: val,
        currentYear: val,
        prevYear: prevVal,
      };
    });
  }, [filteredMonthlyData, prevMergedMonthlyData, dailyMonthChartItems, chartMode]);

  // 3. Electric Usage Chart Data
  const electricChartData = useMemo(() => {
    if (chartMode === 'daily') {
      return dailyMonthChartItems.map((item) => ({
        month: item.dayLabel,
        kwh: item.elecKwh,
        currentYear: item.elecKwh,
        prevYear: item.elecPrev,
      }));
    }

    return filteredMonthlyData.map((item) => {
      const pItem = prevMergedMonthlyData.find((p) => p.month === item.month);
      const mCurr = calculateMetrics(item.data);
      const mPrev = pItem ? calculateMetrics(pItem.data) : null;
      const val = item.hasData ? mCurr.elecTotalPeaKwh + mCurr.elecTotalSolarKwh : 0;
      const prevVal = pItem?.hasData && mPrev ? mPrev.elecTotalPeaKwh + mPrev.elecTotalSolarKwh : 0;
      return {
        month: MONTH_SHORT_TH[item.month - 1],
        kwh: val,
        currentYear: val,
        prevYear: prevVal,
      };
    });
  }, [filteredMonthlyData, prevMergedMonthlyData, dailyMonthChartItems, chartMode]);

  // 4. WWT Efficiency Chart Data
  const wwtEffChartData = useMemo(() => {
    if (chartMode === 'daily') {
      return dailyMonthChartItems.map((item) => ({
        month: item.dayLabel,
        efficiency: item.wwtEff,
        currentYear: item.wwtEff,
        prevYear: item.wwtEffPrev,
      }));
    }

    return filteredMonthlyData.map((item) => {
      const pItem = prevMergedMonthlyData.find((p) => p.month === item.month);
      const codInCurr = Number(item.data.wwt_cod_native) || Number(item.data.wwt_cod_loading) || 0;
      const codOutCurr = Number(item.data.wwt_codt_mix1) || Number(item.data.wwt_cod_eff_as) || 0;
      const effCurr = codInCurr > 0 ? Math.min(100, Math.max(0, ((codInCurr - codOutCurr) / codInCurr) * 100)) : 0;

      const codInPrev = pItem ? Number(pItem.data.wwt_cod_native) || Number(pItem.data.wwt_cod_loading) || 0 : 0;
      const codOutPrev = pItem ? Number(pItem.data.wwt_codt_mix1) || Number(pItem.data.wwt_cod_eff_as) || 0 : 0;
      const effPrev = codInPrev > 0 ? Math.min(100, Math.max(0, ((codInPrev - codOutPrev) / codInPrev) * 100)) : 0;

      return {
        month: MONTH_SHORT_TH[item.month - 1],
        efficiency: effCurr,
        currentYear: effCurr,
        prevYear: effPrev,
      };
    });
  }, [filteredMonthlyData, prevMergedMonthlyData, dailyMonthChartItems, chartMode]);

  // 5. Biogas Efficiency Chart Data
  const biogasEffChartData = useMemo(() => {
    if (chartMode === 'daily') {
      return dailyMonthChartItems.map((item) => ({
        month: item.dayLabel,
        efficiency: item.biogasEff,
        currentYear: item.biogasEff,
        prevYear: item.biogasEffPrev,
      }));
    }

    return filteredMonthlyData.map((item) => {
      const pItem = prevMergedMonthlyData.find((p) => p.month === item.month);
      const h2sCurr = Number(item.data.biogas_pct_h2s) || 0;
      const effCurr = Number(item.data.biogas_removal) || (h2sCurr > 0 ? Math.max(0, 100 - h2sCurr / 100) : 0);

      const h2sPrev = pItem ? Number(pItem.data.biogas_pct_h2s) || 0 : 0;
      const effPrev = pItem ? Number(pItem.data.biogas_pct_h2s) || 0 : 0;

      return {
        month: MONTH_SHORT_TH[item.month - 1],
        efficiency: effCurr,
        currentYear: effCurr,
        prevYear: effPrev,
      };
    });
  }, [filteredMonthlyData, prevMergedMonthlyData, dailyMonthChartItems, chartMode]);

  // Quick Date Preset Handler
  const handleResetDates = () => {
    setStartDate(`${selectedYear}-01-01`);
    setEndDate(`${selectedYear}-12-31`);
    setIsComparing(false);
    setChartMode('monthly');
  };

  const visibleKpiCount = Object.values(selectedKpis).filter(Boolean).length;
  const visiblePanelCount = Object.values(selectedPanels).filter(Boolean).length;
  const visibleChartCount = Object.values(selectedCharts).filter(Boolean).length;

  // DYNAMICALLY BALANCED GRID COLUMN CLASSES ACCORDING TO VISIBLE ITEM COUNTS
  const kpiGridClass = useMemo(() => {
    switch (visibleKpiCount) {
      case 1:
        return 'grid grid-cols-1 gap-4';
      case 2:
        return 'grid grid-cols-1 sm:grid-cols-2 gap-4';
      case 3:
        return 'grid grid-cols-1 sm:grid-cols-3 gap-4';
      case 4:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';
      case 5:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4';
      case 6:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4';
      case 7:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';
      case 8:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';
      default:
        return 'grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4';
    }
  }, [visibleKpiCount]);

  const chartGridClass = useMemo(() => {
    switch (visibleChartCount) {
      case 1:
        return 'grid grid-cols-1 gap-6';
      case 2:
        return 'grid grid-cols-1 md:grid-cols-2 gap-6';
      case 4:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    }
  }, [visibleChartCount]);

  // COMBINED TOTAL ELECTRICITY = PEA + SOLAR
  const totalCombinedElectricKwh = currentMetricsSummary.totalPeaKwh + currentMetricsSummary.totalSolarKwh;
  const compTotalCombinedElectricKwh = compMetricsSummary.totalPeaKwh + compMetricsSummary.totalSolarKwh;

  return (
    <div className="space-y-6 p-4 md:p-8 bg-slate-50 min-h-[calc(100vh-73px)] pb-24 font-sans text-slate-800">
      {/* TOP HEADER CONTAINER WITH CALENDAR DATE RANGE PICKER & COMPARISON TOGGLE */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>TDC-Utility Dashboard</span>
              <span className="text-xs bg-sky-100 text-sky-800 font-extrabold px-2.5 py-0.5 rounded-full border border-sky-200">
                ระบบวิเคราะห์ข้อมูลสด
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              รายงานสถิติพลังงาน สิ่งแวดล้อม และต้นทุนการดำเนินงานตามช่วงวันที่เลือก
            </p>
          </div>

          {/* Interactive Date Filter & Customization Settings Toggle Badge */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Display Configuration Button (TOP HEADER) */}
            <button
              onClick={() => {
                setSettingsTab('kpi');
                setIsSettingsOpen(true);
              }}
              className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <Settings className="w-4 h-4 text-sky-600" />
              <span>ตั้งค่าเลือกแสดงผล</span>
            </button>

            {/* Primary Date Range Calendar Picker (DD/MM/YYYY FORMATTED) */}
            <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200 text-xs font-bold">
              <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="text-slate-500">ช่วงวัน:</span>
              <DatePickerTH value={startDate} onChange={setStartDate} />
              <span className="text-slate-400">-</span>
              <DatePickerTH value={endDate} onChange={setEndDate} />

              <button
                onClick={handleResetDates}
                title="แสดงข้อมูลทั้งปี"
                className="p-1 text-slate-400 hover:text-slate-700 transition-colors ml-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Compare Toggle Button */}
            <button
              onClick={handleToggleCompare}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${isComparing
                ? 'bg-sky-600 text-white border border-sky-500 shadow-sky-500/20'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{isComparing ? 'ยกเลิกการเปรียบเทียบ' : 'เปิดโหมดเปรียบเทียบ'}</span>
            </button>
          </div>
        </div>

        {/* COMPARISON DATE PICKER BAR (IF COMPARISON MODE IS OPEN) */}
        {isComparing && (
          <div className="bg-sky-50/80 p-3.5 rounded-xl border border-sky-200 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-700 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-700 shrink-0" />
              <span className="text-sky-900 font-extrabold">ช่วงวันสำหรับเปรียบเทียบ:</span>
              <DatePickerTH value={compStartDate} onChange={setCompStartDate} />
              <span className="text-slate-400">-</span>
              <DatePickerTH value={compEndDate} onChange={setCompEndDate} />
            </div>

            <span className="text-sky-800 text-[11px] font-semibold">
              เปรียบเทียบสถิติช่วงแรก ({formatDateTH(startDate)} ~ {formatDateTH(endDate)}) กับช่วงเปรียบเทียบ ({formatDateTH(compStartDate)} ~ {formatDateTH(compEndDate)})
            </span>
          </div>
        )}
      </div>

      {/* TOP ROW: EXECUTIVE KPI SUMMARY CARDS (DYNAMICALLY BALANCED GRID) */}
      {visibleKpiCount > 0 && (
        <div className={kpiGridClass}>
          {/* Card 1: Sludge removal */}
          {selectedKpis.sludge && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col justify-between h-[135px] hover:shadow-md transition-all relative overflow-hidden group w-full">
              <span className="text-xs font-extrabold tracking-wide text-slate-600 uppercase flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-amber-500" />
                <span>Sludge removal</span>
              </span>
              <div className="text-center my-auto">
                <div className="text-2xl font-black tracking-wider text-slate-900">
                  {currentMetricsSummary.totalSludgeTons > 0 ? currentMetricsSummary.totalSludgeTons.toLocaleString('th-TH') : '0'}{' '}
                  <span className="text-sm font-bold text-slate-500">Ton</span>
                </div>
                {isComparing && (
                  <div className="text-[11px] font-bold text-sky-700 mt-0.5">
                    เทียบ: {compMetricsSummary.totalSludgeTons.toLocaleString('th-TH')} Ton
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card 2: Oil */}
          {selectedKpis.oil && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col justify-between h-[135px] hover:shadow-md transition-all relative overflow-hidden group w-full">
              <span className="text-xs font-extrabold tracking-wide text-slate-600 uppercase flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Oil</span>
              </span>
              <div className="text-center my-auto">
                <div className="text-2xl font-black tracking-wider text-slate-900">
                  {currentMetricsSummary.fuelOilLiterTotal > 0 ? formatCompact(currentMetricsSummary.fuelOilLiterTotal, 1) : '0'}{' '}
                  <span className="text-sm font-bold text-slate-500">L</span>
                </div>
                {isComparing && (
                  <div className="text-[11px] font-bold text-sky-700 mt-0.5">
                    เทียบ: {formatCompact(compMetricsSummary.fuelOilLiterTotal, 1)} L
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card 3: Electric */}
          {selectedKpis.electric && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col justify-between h-[135px] hover:shadow-md transition-all relative overflow-hidden group w-full">
              <span className="text-xs font-extrabold tracking-wide text-slate-600 uppercase flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-sky-500" />
                <span>Electric</span>
              </span>
              <div className="text-center my-auto">
                <div className="text-2xl font-black tracking-wider text-slate-900">
                  {currentMetricsSummary.totalPeaKwh > 0 ? formatCompact(currentMetricsSummary.totalPeaKwh, 1) : '0'}{' '}
                  <span className="text-sm font-bold text-slate-500">Kwh</span>
                </div>
                <div className="text-[11px] font-extrabold text-amber-600 mt-0.5 flex items-center justify-center gap-1">
                  <Sun className="w-3 h-3 text-amber-500 shrink-0 inline" />
                  <span>Solar: {formatCompact(currentMetricsSummary.totalSolarKwh, 1)} Kwh</span>
                </div>
                {isComparing && (
                  <div className="text-[11px] font-bold text-sky-700 mt-0.5">
                    เทียบ: {formatCompact(compMetricsSummary.totalPeaKwh, 1)} Kwh
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card 4: Solar (Optional Standalone) */}
          {selectedKpis.solar && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col justify-between h-[135px] hover:shadow-md transition-all relative overflow-hidden group w-full">
              <span className="text-xs font-extrabold tracking-wide text-slate-600 uppercase flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Solar</span>
              </span>
              <div className="text-center my-auto">
                <div className="text-2xl font-black tracking-wider text-amber-600">
                  {currentMetricsSummary.totalSolarKwh > 0 ? formatCompact(currentMetricsSummary.totalSolarKwh, 1) : '0'}{' '}
                  <span className="text-sm font-bold text-slate-500">Kwh</span>
                </div>
                {isComparing && (
                  <div className="text-[11px] font-bold text-sky-700 mt-0.5">
                    เทียบ: {formatCompact(compMetricsSummary.totalSolarKwh, 1)} Kwh
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card 5: Product */}
          {selectedKpis.production && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col justify-between h-[135px] hover:shadow-md transition-all relative overflow-hidden group w-full">
              <span className="text-xs font-extrabold tracking-wide text-slate-600 uppercase flex items-center gap-1.5">
                <Factory className="w-4 h-4 text-indigo-500" />
                <span>Product</span>
              </span>
              <div className="text-center my-auto">
                <div className="text-2xl font-black tracking-wider text-slate-900">
                  {currentMetricsSummary.ytdProduction > 0 ? currentMetricsSummary.ytdProduction.toLocaleString('th-TH') : '0'}{' '}
                  <span className="text-sm font-bold text-slate-500">Ton</span>
                </div>
                {isComparing && (
                  <div className="text-[11px] font-bold text-sky-700 mt-0.5">
                    เทียบ: {compMetricsSummary.ytdProduction.toLocaleString('th-TH')} Ton
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card 6: น้ำมันเตา Liter/TonFG (Formula: Oil Liters / Production Tons) */}
          {selectedKpis.oilPerTonFg && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col justify-between h-[135px] hover:shadow-md transition-all relative overflow-hidden group w-full">
              <span className="text-xs font-extrabold tracking-wide text-slate-600 uppercase flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>Liter/TonFG</span>
              </span>
              <div className="text-center my-auto">
                <div className="text-2xl font-black tracking-wider text-slate-900">
                  {oilPerTonFgVal > 0 ? oilPerTonFgVal.toFixed(2) : '0'}{' '}
                  <span className="text-sm font-bold text-slate-500">L/Ton</span>
                </div>
                {isComparing && (
                  <div className="text-[11px] font-bold text-sky-700 mt-0.5">
                    เทียบ: {compOilPerTonFgVal.toFixed(2)} L/Ton
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card 7: ประสิทธิภาพ WWT */}
          {selectedKpis.wwtEff && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col justify-between h-[135px] hover:shadow-md transition-all relative overflow-hidden group w-full">
              <span className="text-xs font-extrabold tracking-wide text-slate-600 uppercase flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>ประสิทธิภาพ WWT</span>
              </span>
              <div className="text-center my-auto">
                <div className="text-2xl font-black tracking-wider text-emerald-600">
                  {wwtEfficiencyVal > 0 ? wwtEfficiencyVal.toFixed(1) : '0'}{' '}
                  <span className="text-sm font-bold text-slate-500">%</span>
                </div>
              </div>
            </div>
          )}

          {/* Card 8: ประสิทธิภาพ biogas */}
          {selectedKpis.biogasEff && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/90 flex flex-col justify-between h-[135px] hover:shadow-md transition-all relative overflow-hidden group w-full">
              <span className="text-xs font-extrabold tracking-wide text-slate-600 uppercase flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-emerald-600" />
                <span>ประสิทธิภาพ biogas</span>
              </span>
              <div className="text-center my-auto">
                <div className="text-2xl font-black tracking-wider text-emerald-600">
                  {biogasEfficiencyVal > 0 ? biogasEfficiencyVal.toFixed(1) : '0'}{' '}
                  <span className="text-sm font-bold text-slate-500">%</span>
                </div>
              </div>
            </div>
          )}

          {/* Card 9: KPI ต้นทุนดำเนินการ */}
          {selectedKpis.kpiCost && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 rounded-2xl shadow-sm border border-amber-200/80 flex flex-col justify-between h-[135px] hover:shadow-md transition-all relative overflow-hidden group w-full">
              <span className="text-xs font-extrabold tracking-wide text-amber-800 uppercase flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span>KPI ต้นทุนดำเนินการ</span>
              </span>
              <div className="text-center my-auto">
                <div className="text-xl font-black tracking-wider text-amber-900">
                  ฿{formatCompact(currentMetricsSummary.ytdCost, 2)}{' '}
                  <span className="text-xs font-bold text-slate-500">บาท</span>
                </div>
                <div className="text-[11px] font-extrabold text-amber-700 mt-0.5">
                  เฉลี่ย ฿{Math.round(currentMetricsSummary.costPerTon).toLocaleString()} บาท/ตัน
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MIDDLE ROW: 2 LARGE PARAMETER PANELS (WWTP & BIOGAS, DYNAMICALLY TOGGLEABLE & BALANCED) */}
      {(selectedPanels.wwtp || selectedPanels.biogas) && (
        <div
          className={`grid gap-6 ${selectedPanels.wwtp && selectedPanels.biogas
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1'
            }`}
        >
          {/* Panel 1: WWTP Parameters */}
          {selectedPanels.wwtp && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/90 space-y-4 hover:shadow-md transition-all w-full">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-lg font-black tracking-wide text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-sky-600" />
                  <span>WWTP</span>
                </h3>
                <span className="text-xs font-bold text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                  Wastewater Treatment Parameters
                </span>
              </div>

              <div className="space-y-2.5 text-sm font-semibold text-slate-700">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">COD Native</span>
                  <span className="font-extrabold text-slate-900">
                    {latestCat5Data.wwt_cod_native ? `${latestCat5Data.wwt_cod_native.toLocaleString()} mg/l` : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">CODt Mix1</span>
                  <span className="font-extrabold text-slate-900">
                    {latestCat5Data.wwt_codt_mix1 ? `${latestCat5Data.wwt_codt_mix1.toLocaleString()} mg/l` : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">VFA Mix1</span>
                  <span className="font-extrabold text-slate-900">
                    {latestCat5Data.wwt_vfa_mix1 ? `${latestCat5Data.wwt_vfa_mix1.toLocaleString()}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">pH Mix2</span>
                  <span className="font-extrabold text-slate-900">
                    {latestCat5Data.wwt_ph_mix2 ? latestCat5Data.wwt_ph_mix2.toFixed(1) : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">COD Loading (Kg/day)</span>
                  <span className="font-extrabold text-emerald-600">
                    {latestCat5Data.wwt_cod_loading ? `${latestCat5Data.wwt_cod_loading.toLocaleString()} kg/day` : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500">COD eff AS</span>
                  <span className="font-extrabold text-slate-900">
                    {latestCat5Data.wwt_cod_eff_as ? `${latestCat5Data.wwt_cod_eff_as.toLocaleString()}` : '-'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Panel 2: Biogas Parameters */}
          {selectedPanels.biogas && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/90 space-y-4 hover:shadow-md transition-all w-full">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-lg font-black tracking-wide text-slate-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-600" />
                  <span>Biogas</span>
                </h3>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  Biogas Operations & Scrubber
                </span>
              </div>

              <div className="space-y-2 text-sm font-semibold text-slate-700">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Flow Feed Mix2</span>
                  <span className="font-extrabold text-slate-900">
                    {latestCat5Data.biogas_flow_feed_mix2 ? `${latestCat5Data.biogas_flow_feed_mix2.toLocaleString()}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Biogas Generate</span>
                  <span className="font-extrabold text-slate-900">
                    {latestCat5Data.biogas_generate ? `${latestCat5Data.biogas_generate.toLocaleString()} Nm³` : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Biogas flare</span>
                  <span className="font-extrabold text-slate-900">
                    {latestCat5Data.biogas_flare ? `${latestCat5Data.biogas_flare.toLocaleString()}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Boiler Consumtion</span>
                  <span className="font-extrabold text-slate-900">
                    {latestCat5Data.biogas_boiler_consumption ? `${latestCat5Data.biogas_boiler_consumption.toLocaleString()}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <span className="text-slate-500">% CH4</span>
                  <span className="font-extrabold text-emerald-600">
                    {latestCat5Data.biogas_pct_ch4 ? `${latestCat5Data.biogas_pct_ch4}%` : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <span className="text-slate-500">% H2S</span>
                  <span className="font-extrabold text-rose-600">
                    {latestCat5Data.biogas_pct_h2s ? `${latestCat5Data.biogas_pct_h2s} ppm` : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Removal</span>
                  <span className="font-extrabold text-emerald-600">
                    {latestCat5Data.biogas_removal ? `${latestCat5Data.biogas_removal}%` : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-slate-500">SV60 eff Biogas</span>
                  <span className="font-extrabold text-slate-900">
                    {latestCat5Data.biogas_sv60_eff ? `${latestCat5Data.biogas_sv60_eff}` : '-'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM SECTION: CHARTS GRID WITH CUSTOM SETTINGS BUTTON & VIEW SWITCHER */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            <span>
              {chartMode === 'daily'
                ? `กราฟเปรียบเทียบสถิติรายวันประจำเดือน ${MONTH_NAMES_TH[selectedDailyMonth - 1]}`
                : chartMode === 'yoy'
                  ? `กราฟเปรียบเทียบสถิติรายปี (พ.ศ. ${selectedYear} vs พ.ศ. ${yoyCompYear})`
                  : 'กราฟแนวโน้มแสดงผลสถิติ (Historical Trend Analytics Grid)'}
            </span>
            <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
              แสดงอยู่ {visibleChartCount}/5 กราฟ
            </span>
          </h3>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {/* Chart Customization Settings Button */}
            <button
              onClick={() => {
                setSettingsTab('chart');
                setIsSettingsOpen(true);
              }}
              className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <Settings className="w-3.5 h-3.5 text-sky-600" />
              <span>ตั้งค่าเลือกแสดงกราฟ</span>
            </button>

            {/* Chart Mode Switcher Buttons */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-bold">
              <button
                onClick={() => setChartMode('monthly')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${chartMode === 'monthly'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                รายเดือน
              </button>

              <button
                onClick={() => setChartMode('daily')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${chartMode === 'daily'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                รายวัน (1 เดือน)
              </button>

              {chartMode === 'daily' && (
                <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">เดือน:</span>
                  <select
                    value={selectedDailyMonth}
                    onChange={(e) => setSelectedDailyMonth(parseInt(e.target.value, 10))}
                    className="bg-slate-50 border border-slate-300 text-sky-900 font-extrabold text-xs rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  >
                    {MONTH_NAMES_TH.map((mName, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {mName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => setChartMode('yoy')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${chartMode === 'yoy'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                เปรียบเทียบต่อปี (YoY)
              </button>

              {chartMode === 'yoy' && (
                <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">เทียบกับปี:</span>
                  <select
                    value={yoyCompYear}
                    onChange={(e) => setYoyCompYear(parseInt(e.target.value, 10))}
                    className="bg-slate-50 border border-slate-300 text-sky-900 font-extrabold text-xs rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  >
                    {[2570, 2569, 2568, 2567, 2566].map((yr) => (
                      <option key={yr} value={yr}>
                        พ.ศ. {yr}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CHARTS GRID (DYNAMICALLY BALANCED GRID ACCORDING TO VISIBLE CHARTS) */}
        {visibleChartCount === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
            <Eye className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-extrabold text-base text-slate-700">ไม่มีกราฟที่ถูกเลือกแสดงผล</h4>
            <p className="text-xs text-slate-500">กรุณากดปุ่ม "ตั้งค่าเลือกแสดงผล" เพื่อเลือกกราฟที่ต้องการให้แสดงบนแดชบอร์ด</p>
            <button
              onClick={() => setAllCharts(true)}
              className="bg-sky-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-sky-700 transition-colors cursor-pointer"
            >
              แสดงกราฟทั้งหมด
            </button>
          </div>
        ) : (
          <div className={chartGridClass}>
            {/* Chart 1: Sludge Removal Trend */}
            {selectedCharts.sludge && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3 hover:shadow-md transition-all w-full">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-amber-600" />
                    <span>1. แนวโน้ม Sludge removal (Ton)</span>
                  </span>
                </h4>
                <div className="h-[200px] w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sludgeChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => formatCompact(v, 0)} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                      {isComparing || chartMode === 'yoy' ? (
                        <>
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Bar dataKey="currentYear" name="เดือนหลัก" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="prevYear" name="เดือนเปรียบเทียบ" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                        </>
                      ) : (
                        <Bar dataKey="tons" name="Sludge Removal (Ton)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Chart 2: Oil Usage Trend */}
            {selectedCharts.oil && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3 hover:shadow-md transition-all w-full">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-600" />
                    <span>2. แนวโน้ม Oil Usage (Liters)</span>
                  </span>
                </h4>
                <div className="h-[200px] w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={oilChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => formatCompact(v, 0)} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                      {isComparing || chartMode === 'yoy' ? (
                        <>
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Bar dataKey="currentYear" name="เดือนหลัก" fill="#f97316" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="prevYear" name="เดือนเปรียบเทียบ" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                        </>
                      ) : (
                        <Bar dataKey="liters" name="Oil Usage (L)" fill="#f97316" radius={[4, 4, 0, 0]} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Chart 3: Electric Usage Trend */}
            {selectedCharts.electric && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3 hover:shadow-md transition-all w-full">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-sky-600" />
                    <span>3. แนวโน้ม Electric Usage (kWh)</span>
                  </span>
                </h4>
                <div className="h-[200px] w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={electricChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => formatCompact(v, 0)} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                      {isComparing || chartMode === 'yoy' ? (
                        <>
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Bar dataKey="currentYear" name="เดือนหลัก" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="prevYear" name="เดือนเปรียบเทียบ" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                        </>
                      ) : (
                        <Bar dataKey="kwh" name="Electric (kWh)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Chart 4: WWT Efficiency Trend */}
            {selectedCharts.wwtEff && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3 hover:shadow-md transition-all w-full">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>4. แนวโน้ม ประสิทธิภาพ WWT (%)</span>
                  </span>
                </h4>
                <div className="h-[200px] w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={wwtEffChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                      {isComparing || chartMode === 'yoy' ? (
                        <>
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Line type="monotone" dataKey="currentYear" name="เดือนหลัก" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="prevYear" name="เดือนเปรียบเทียบ" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                        </>
                      ) : (
                        <Line type="monotone" dataKey="efficiency" name="WWT Efficiency (%)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Chart 5: Biogas Efficiency Trend */}
            {selectedCharts.biogasEff && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3 hover:shadow-md transition-all w-full">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-emerald-600" />
                    <span>5. แนวโน้ม ประสิทธิภาพ Biogas (%)</span>
                  </span>
                </h4>
                <div className="h-[200px] w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={biogasEffChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                      {isComparing || chartMode === 'yoy' ? (
                        <>
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Line type="monotone" dataKey="currentYear" name="เดือนหลัก" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="prevYear" name="เดือนเปรียบเทียบ" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                        </>
                      ) : (
                        <Line type="monotone" dataKey="efficiency" name="Biogas Removal Efficiency (%)" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DASHBOARD DISPLAY CUSTOMIZATION SETTINGS MODAL (FOR KPI CARDS, MIDDLE PANELS & CHARTS) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden space-y-0">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">ตั้งค่าเลือกแสดงผลแดชบอร์ด</h3>
                  <p className="text-xs text-slate-500 font-medium">เลือก KPI Cards, ตารางพารามิเตอร์ และ กราฟแนวโน้ม</p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs: KPI vs Panel vs Charts */}
            <div className="flex border-b border-slate-200 px-5 pt-3 gap-2 bg-slate-50/30">
              <button
                onClick={() => setSettingsTab('kpi')}
                className={`pb-2.5 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${settingsTab === 'kpi'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>KPI Cards ({visibleKpiCount}/9)</span>
              </button>

              <button
                onClick={() => setSettingsTab('panel')}
                className={`pb-2.5 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${settingsTab === 'panel'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>พารามิเตอร์ ({visiblePanelCount}/2)</span>
              </button>

              <button
                onClick={() => setSettingsTab('chart')}
                className={`pb-2.5 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${settingsTab === 'chart'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>กราฟแนวโน้ม ({visibleChartCount}/5)</span>
              </button>
            </div>

            {/* Modal Content - Checkbox Lists */}
            <div className="p-5 space-y-3 max-h-[55vh] overflow-y-auto">
              {settingsTab === 'kpi' && (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-500">
                    <span>รายการ KPI Cards ทั้งหมด ({visibleKpiCount}/9)</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAllKpis(true)}
                        className="text-sky-600 hover:underline cursor-pointer"
                      >
                        เลือกทั้งหมด
                      </button>
                      <span>|</span>
                      <button
                        onClick={() => setAllKpis(false)}
                        className="text-slate-500 hover:underline cursor-pointer"
                      >
                        ยกเลิกทั้งหมด
                      </button>
                    </div>
                  </div>

                  {/* KPI 1: Sludge */}
                  <div
                    onClick={() => toggleKpi('sludge')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${selectedKpis.sludge
                      ? 'bg-amber-50/60 border-amber-300 text-amber-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Droplets className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-extrabold">1. Sludge removal (Ton)</span>
                    </div>
                    {selectedKpis.sludge ? (
                      <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </div>

                  {/* KPI 2: Oil */}
                  <div
                    onClick={() => toggleKpi('oil')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${selectedKpis.oil
                      ? 'bg-orange-50/60 border-orange-300 text-orange-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Flame className="w-4 h-4 text-orange-600 shrink-0" />
                      <span className="text-xs font-extrabold">2. Oil (Liters)</span>
                    </div>
                    {selectedKpis.oil ? (
                      <CheckSquare className="w-4 h-4 text-orange-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </div>

                  {/* KPI 3: Electric */}
                  <div
                    onClick={() => toggleKpi('electric')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${selectedKpis.electric
                      ? 'bg-sky-50/60 border-sky-300 text-sky-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="text-xs font-extrabold">3. Electric (PEA + Solar) (kWh)</span>
                    </div>
                    {selectedKpis.electric ? (
                      <CheckSquare className="w-4 h-4 text-sky-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </div>

                  {/* KPI 4: Solar */}
                  <div
                    onClick={() => toggleKpi('solar')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${selectedKpis.solar
                      ? 'bg-amber-50/60 border-amber-300 text-amber-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-xs font-extrabold">4. Solar (kWh)</span>
                    </div>
                    {selectedKpis.solar ? (
                      <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </div>

                  {/* KPI 5: Product */}
                  <div
                    onClick={() => toggleKpi('production')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${selectedKpis.production
                      ? 'bg-indigo-50/60 border-indigo-300 text-indigo-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Factory className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="text-xs font-extrabold">5. Product (Ton)</span>
                    </div>
                    {selectedKpis.production ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </div>

                  {/* KPI 6: L/TonFG */}
                  <div
                    onClick={() => toggleKpi('oilPerTonFg')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${selectedKpis.oilPerTonFg
                      ? 'bg-rose-50/60 border-rose-300 text-rose-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Flame className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="text-xs font-extrabold">6. น้ำมันเตา Liter/TonFG (ลิตร/ตัน)</span>
                    </div>
                    {selectedKpis.oilPerTonFg ? (
                      <CheckSquare className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </div>

                  {/* KPI 7: ประสิทธิภาพ WWT */}
                  <div
                    onClick={() => toggleKpi('wwtEff')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${selectedKpis.wwtEff
                      ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-extrabold">7. ประสิทธิภาพ WWT (%)</span>
                    </div>
                    {selectedKpis.wwtEff ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </div>

                  {/* KPI 8: ประสิทธิภาพ biogas */}
                  <div
                    onClick={() => toggleKpi('biogasEff')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${selectedKpis.biogasEff
                      ? 'bg-cyan-50/60 border-cyan-300 text-cyan-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Flame className="w-4 h-4 text-cyan-600 shrink-0" />
                      <span className="text-xs font-extrabold">8. ประสิทธิภาพ biogas (%)</span>
                    </div>
                    {selectedKpis.biogasEff ? (
                      <CheckSquare className="w-4 h-4 text-cyan-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </div>

                  {/* KPI 9: KPI ต้นทุนดำเนินการ */}
                  <div
                    onClick={() => toggleKpi('kpiCost')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${selectedKpis.kpiCost
                      ? 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-extrabold">9. KPI ต้นทุนดำเนินการ (บาท)</span>
                    </div>
                    {selectedKpis.kpiCost ? (
                      <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </div>
                </>
              )}

              {settingsTab === 'panel' && (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-500">
                    <span>รายการตารางพารามิเตอร์ ({visiblePanelCount}/2)</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAllPanels(true)}
                        className="text-sky-600 hover:underline cursor-pointer"
                      >
                        เลือกทั้งหมด
                      </button>
                      <span>|</span>
                      <button
                        onClick={() => setAllPanels(false)}
                        className="text-slate-500 hover:underline cursor-pointer"
                      >
                        ยกเลิกทั้งหมด
                      </button>
                    </div>
                  </div>

                  {/* Panel WWTP */}
                  <div
                    onClick={() => togglePanel('wwtp')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${selectedPanels.wwtp
                      ? 'bg-sky-50/60 border-sky-300 text-sky-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="text-xs font-extrabold">1. พารามิเตอร์ WWTP (Wastewater Treatment)</span>
                    </div>
                    {selectedPanels.wwtp ? (
                      <CheckSquare className="w-4 h-4 text-sky-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </div>

                  {/* Panel Biogas */}
                  <div
                    onClick={() => togglePanel('biogas')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${selectedPanels.biogas
                      ? 'bg-amber-50/60 border-amber-300 text-amber-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Flame className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-extrabold">2. พารามิเตอร์ Biogas Operations & Scrubber</span>
                    </div>
                    {selectedPanels.biogas ? (
                      <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </div>
                </>
              )}

              {settingsTab === 'chart' && (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-500">
                    <span>รายการกราฟที่มีในระบบ ({visibleChartCount}/5)</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAllCharts(true)}
                        className="text-sky-600 hover:underline cursor-pointer"
                      >
                        เลือกทั้งหมด
                      </button>
                      <span>|</span>
                      <button
                        onClick={() => setAllCharts(false)}
                        className="text-slate-500 hover:underline cursor-pointer"
                      >
                        ยกเลิกทั้งหมด
                      </button>
                    </div>
                  </div>

                  {/* Chart 1 */}
                  <div
                    onClick={() => toggleChart('sludge')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${selectedCharts.sludge
                      ? 'bg-amber-50/60 border-amber-300 text-amber-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Droplets className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-extrabold">1. แนวโน้ม Sludge removal (Ton)</span>
                    </div>
                    {selectedCharts.sludge ? (
                      <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </div>

                  {/* Chart 2 */}
                  <div
                    onClick={() => toggleChart('oil')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${selectedCharts.oil
                      ? 'bg-orange-50/60 border-orange-300 text-orange-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Flame className="w-4 h-4 text-orange-600 shrink-0" />
                      <span className="text-xs font-extrabold">2. แนวโน้ม Oil Usage (Liters)</span>
                    </div>
                    {selectedCharts.oil ? (
                      <CheckSquare className="w-4 h-4 text-orange-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </div>

                  {/* Chart 3 */}
                  <div
                    onClick={() => toggleChart('electric')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${selectedCharts.electric
                      ? 'bg-sky-50/60 border-sky-300 text-sky-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="text-xs font-extrabold">3. แนวโน้ม Electric Usage (kWh)</span>
                    </div>
                    {selectedCharts.electric ? (
                      <CheckSquare className="w-4 h-4 text-sky-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </div>

                  {/* Chart 4 */}
                  <div
                    onClick={() => toggleChart('wwtEff')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${selectedCharts.wwtEff
                      ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-extrabold">4. แนวโน้ม ประสิทธิภาพ WWT (%)</span>
                    </div>
                    {selectedCharts.wwtEff ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </div>

                  {/* Chart 5 */}
                  <div
                    onClick={() => toggleChart('biogasEff')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${selectedCharts.biogasEff
                      ? 'bg-cyan-50/60 border-cyan-300 text-cyan-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Flame className="w-4 h-4 text-cyan-600 shrink-0" />
                      <span className="text-xs font-extrabold">5. แนวโน้ม ประสิทธิภาพ Biogas (%)</span>
                    </div>
                    {selectedCharts.biogasEff ? (
                      <CheckSquare className="w-4 h-4 text-cyan-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {settingsTab === 'kpi'
                  ? `เลือกแสดงแล้ว ${visibleKpiCount}/9 KPI Cards`
                  : settingsTab === 'panel'
                    ? `เลือกแสดงแล้ว ${visiblePanelCount}/2 พารามิเตอร์`
                    : `เลือกแสดงผลแล้ว ${visibleChartCount}/5 กราฟ`}
              </span>
              <button
                onClick={() => {
                  try {
                    localStorage.setItem('tdc_dashboard_kpis', JSON.stringify(selectedKpis));
                    localStorage.setItem('tdc_dashboard_panels', JSON.stringify(selectedPanels));
                    localStorage.setItem('tdc_dashboard_charts', JSON.stringify(selectedCharts));
                  } catch { }
                  setIsSettingsOpen(false);
                }}
                className="bg-sky-600 text-white font-extrabold text-xs px-5 py-2 rounded-xl shadow-xs hover:bg-sky-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>บันทึกการตั้งค่า</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
