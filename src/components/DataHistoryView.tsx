'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Database,
  Droplets,
  Factory,
  Flame,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  Clock,
  FileEdit,
  Download,
  Eye,
  Edit3,
  Trash2,
  X,
  Save,
  BadgeCheck,
  FlaskConical,
} from 'lucide-react';
import { FullMonthlyReportData, CategorySubmission, ReportData, UserRole } from '@/lib/types';
import { calculateMetrics, MONTH_NAMES_TH } from '@/lib/calculations';
import { exportMonthlyReportsToExcel } from '@/lib/excelExport';
import { getCategorySubmissions, saveReportData, deleteCategorySubmission, deleteMonthlyReport, updateCategorySubmissionData } from '@/lib/supabase';
import { DataEntryForm } from './DataEntryForm';

interface RenderCategoryFormFieldsProps {
  categoryKey: string;
  data: Partial<ReportData>;
  readOnly: boolean;
  onChange?: (field: keyof ReportData, val: any) => void;
}

const CategoryFormFields: React.FC<RenderCategoryFormFieldsProps> = ({
  categoryKey,
  data,
  readOnly,
  onChange,
}) => {
  const handleChange = (field: keyof ReportData, val: any) => {
    if (!readOnly && onChange) {
      onChange(field, val);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Category 1: Sludge */}
      {categoryKey === 'cat1' && (
        <div className="space-y-3 bg-amber-50/60 p-4 rounded-xl border border-amber-200">
          <h4 className="font-extrabold text-amber-900 flex items-center gap-1.5 uppercase">
            <Droplets className="w-4 h-4 text-amber-600" />
            <span>หมวดที่ 1: ตะกอน (Sludge Removal)</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">รายละเอียดการขนกำจัด</label>
              <input
                type="text"
                disabled={readOnly}
                value={data.sludge_removal_desc || ''}
                onChange={(e) => handleChange('sludge_removal_desc', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ปริมาณตะกอน (ตัน)</label>
              <input
                type="number"
                disabled={readOnly}
                value={data.sludge_tons ?? ''}
                onChange={(e) => handleChange('sludge_tons', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">จำนวนเที่ยว</label>
              <input
                type="number"
                disabled={readOnly}
                value={data.sludge_trips ?? ''}
                onChange={(e) => handleChange('sludge_trips', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 font-bold text-slate-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* Category 2: Production */}
      {categoryKey === 'cat2' && (
        <div className="space-y-3 bg-blue-50/60 p-4 rounded-xl border border-blue-200">
          <h4 className="font-extrabold text-blue-900 flex items-center gap-1.5 uppercase">
            <Factory className="w-4 h-4 text-blue-600" />
            <span>หมวดที่ 2: การผลิต (Production)</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">MS1 (ตัน)</label>
              <input
                type="number"
                disabled={readOnly}
                value={data.production_ms1 ?? ''}
                onChange={(e) => handleChange('production_ms1', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">MS2 (ตัน)</label>
              <input
                type="number"
                disabled={readOnly}
                value={data.production_ms2 ?? ''}
                onChange={(e) => handleChange('production_ms2', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">MS3 (ตัน)</label>
              <input
                type="number"
                disabled={readOnly}
                value={data.production_ms3 ?? ''}
                onChange={(e) => handleChange('production_ms3', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 font-bold text-slate-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* Category 3: Fuel & Gas */}
      {categoryKey === 'cat3' && (
        <div className="space-y-3 bg-orange-50/60 p-4 rounded-xl border border-orange-200">
          <h4 className="font-extrabold text-orange-900 flex items-center gap-1.5 uppercase">
            <Flame className="w-4 h-4 text-orange-600" />
            <span>หมวดที่ 3: เชื้อเพลิง (Fuel & Gas)</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">น้ำมันเตา MS1 (ลิตร)</label>
              <input
                type="number"
                disabled={readOnly}
                value={data.fuel_oil_a_ms1_liter ?? ''}
                onChange={(e) => handleChange('fuel_oil_a_ms1_liter', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">น้ำมันเตา MS2 (ลิตร)</label>
              <input
                type="number"
                disabled={readOnly}
                value={data.fuel_oil_a_ms2_liter ?? ''}
                onChange={(e) => handleChange('fuel_oil_a_ms2_liter', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">น้ำมันเตา MS3 (ลิตร)</label>
              <input
                type="number"
                disabled={readOnly}
                value={data.fuel_oil_a_ms3_liter ?? ''}
                onChange={(e) => handleChange('fuel_oil_a_ms3_liter', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">แก๊สชีวภาพ MS1 (Nm³)</label>
              <input
                type="number"
                disabled={readOnly}
                value={data.gas_ms1_m3 ?? ''}
                onChange={(e) => handleChange('gas_ms1_m3', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">แก๊สชีวภาพ MS2 (Nm³)</label>
              <input
                type="number"
                disabled={readOnly}
                value={data.gas_ms2_m3 ?? ''}
                onChange={(e) => handleChange('gas_ms2_m3', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">แก๊สชีวภาพ MS3 (Nm³)</label>
              <input
                type="number"
                disabled={readOnly}
                value={data.gas_ms3_m3 ?? ''}
                onChange={(e) => handleChange('gas_ms3_m3', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 font-bold text-slate-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* Category 4: Electricity */}
      {categoryKey === 'cat4' && (
        <div className="space-y-3 bg-sky-50/60 p-4 rounded-xl border border-sky-200">
          <h4 className="font-extrabold text-sky-900 flex items-center gap-1.5 uppercase">
            <Zap className="w-4 h-4 text-sky-600" />
            <span>หมวดที่ 4: ไฟฟ้า & โซลาร์ (Electricity)</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">มิเตอร์ 1 MS1, MS3, TF (kWh)</label>
              <input
                type="number"
                disabled={readOnly}
                value={data.elec_meter1_ms1_ms3_tf ?? ''}
                onChange={(e) => handleChange('elec_meter1_ms1_ms3_tf', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">มิเตอร์ 2 UTL (kWh)</label>
              <input
                type="number"
                disabled={readOnly}
                value={data.elec_meter2_utl ?? ''}
                onChange={(e) => handleChange('elec_meter2_utl', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">มิเตอร์ 3 MS2 Mix (kWh)</label>
              <input
                type="number"
                disabled={readOnly}
                value={data.elec_meter3_ms2_mix ?? ''}
                onChange={(e) => handleChange('elec_meter3_ms2_mix', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">โซลาร์ มิเตอร์ 1 MS2 (kWh)</label>
              <input
                type="number"
                disabled={readOnly}
                value={data.solar_meter1_ms2 ?? ''}
                onChange={(e) => handleChange('solar_meter1_ms2', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">โซลาร์ มิเตอร์ 2 TF (kWh)</label>
              <input
                type="number"
                disabled={readOnly}
                value={data.solar_meter2_tf ?? ''}
                onChange={(e) => handleChange('solar_meter2_tf', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 font-bold text-slate-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* Category 5: WWT & Biogas */}
      {categoryKey === 'cat5' && (
        <div className="space-y-3 bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
          <h4 className="font-extrabold text-emerald-900 flex items-center gap-1.5 uppercase">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>หมวดที่ 5: WWT & Biogas</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Native COD</label>
              <input
                type="number"
                disabled={readOnly}
                value={data.wwt_cod_native ?? ''}
                onChange={(e) => handleChange('wwt_cod_native', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Biogas Flow Feed Mix2</label>
              <input
                type="number"
                disabled={readOnly}
                value={data.biogas_flow_feed_mix2 ?? ''}
                onChange={(e) => handleChange('biogas_flow_feed_mix2', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Biogas Generate (m³)</label>
              <input
                type="number"
                disabled={readOnly}
                value={data.biogas_generate ?? ''}
                onChange={(e) => handleChange('biogas_generate', Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 font-bold text-slate-900"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface DataHistoryViewProps {
  selectedYear: number;
  reportsData: FullMonthlyReportData[];
  onSelectMonth?: (month: number) => void;
  currentUser?: { email: string; role: UserRole } | null;
}

export const DataHistoryView: React.FC<DataHistoryViewProps> = ({
  selectedYear,
  reportsData,
  onSelectMonth,
  currentUser,
}) => {
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('cat1');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  // View, Edit, Delete Modal States
  const [viewModalItem, setViewModalItem] = useState<any | null>(null);
  const [editModalItem, setEditModalItem] = useState<any | null>(null);

  const handleDeleteItem = async (item: any) => {
    if (!window.confirm(`คุณต้องการลบข้อมูลรายการนี้ (วันที่ ${item.report_date || item.month}) ใช่หรือไม่?`)) {
      return;
    }
    if (item.id.startsWith('sub-')) {
      await deleteCategorySubmission(item.id);
    } else {
      await deleteMonthlyReport(item.id);
    }
    window.location.reload();
  };

  const handleSaveEditWithData = async (updatedData: Partial<ReportData>) => {
    if (!editModalItem) return;
    if (editModalItem.id.startsWith('sub-')) {
      await updateCategorySubmissionData(editModalItem.id, updatedData);
    } else {
      await saveReportData(
        selectedYear,
        editModalItem.month || 1,
        { status: editModalItem.status || 'approved' },
        updatedData
      );
    }

    setEditModalItem(null);
    window.location.reload();
  };

  const [categorySubmissions, setCategorySubmissions] = useState<CategorySubmission[]>([]);

  useEffect(() => {
    async function loadCategorySubs() {
      const subs = await getCategorySubmissions(selectedYear);
      setCategorySubmissions(subs);
    }
    loadCategorySubs();
  }, [selectedYear]);

  // Combine monthly reports and daily category submissions
  const allDisplayItems = useMemo(() => {
    const items: Array<{
      id: string;
      month: number;
      report_date: string;
      status: string;
      reporter_name: string;
      approver_name?: string;
      category_key?: string;
      data: Partial<ReportData>;
    }> = [];

    // 1. Add daily category submissions
    categorySubmissions.forEach((sub) => {
      items.push({
        id: sub.id,
        month: sub.month,
        report_date: sub.report_date,
        status: sub.status,
        reporter_name: sub.reporter_name,
        approver_name: sub.approver_name || (sub.data as any)?.approver_name,
        category_key: sub.category_key,
        data: sub.data,
      });
    });

    // 2. Add monthly reports
    reportsData.forEach((r) => {
      if (r.report.status !== 'empty') {
        items.push({
          id: r.report.id,
          month: r.report.month,
          report_date: r.data.report_date || '',
          status: r.report.status,
          reporter_name: r.data.reporter_name || '',
          approver_name: r.data.approver_name || '',
          data: r.data,
        });
      }
    });

    return items;
  }, [reportsData, categorySubmissions]);

  // Helper to check category data content
  const hasCategoryContent = (data: Partial<ReportData>, catKey: string): boolean => {
    if (!data) return false;
    if (catKey === 'cat1') {
      return Boolean(data.sludge_tons || data.sludge_removal_desc || data.sludge_trips || data.sludge_vac_tons);
    }
    if (catKey === 'cat2') {
      return Boolean(data.production_ms1 || data.production_ms2 || data.production_ms3 || data.production_total_ms);
    }
    if (catKey === 'cat3') {
      return Boolean(data.fuel_oil_a_ms1_liter || data.fuel_oil_a_ms2_liter || data.fuel_oil_a_ms3_liter || data.gas_ms1_m3 || data.gas_ms2_m3 || data.gas_ms3_m3);
    }
    if (catKey === 'cat4') {
      return Boolean(data.elec_meter1_ms1_ms3_tf || data.elec_meter2_utl || data.elec_meter3_ms2_mix || data.solar_meter1_ms2 || data.solar_meter2_tf);
    }
    if (catKey === 'cat5') {
      return Boolean(data.wwt_cod_native || data.wwt_codt_mix1 || data.biogas_flow_feed_mix2 || data.biogas_generate);
    }
    if (catKey === 'cat6') {
      return Boolean(
        data.chem_lime_received || data.chem_lime_usage || data.chem_lime_available ||
        data.chem_polymer_received || data.chem_polymer_usage || data.chem_polymer_available ||
        data.chem_odor_received || data.chem_odor_usage || data.chem_odor_available ||
        data.chem_fog_received || data.chem_fog_usage || data.chem_fog_available ||
        data.chem_cod_tube_received || data.chem_cod_tube_usage || data.chem_cod_tube_available
      );
    }
    return false;
  };

  // Filter logic
  const filteredReports = useMemo(() => {
    return allDisplayItems.filter((item) => {
      // Must match selected category
      const isCatMatch =
        item.category_key === selectedCategory ||
        hasCategoryContent(item.data, selectedCategory);

      if (!isCatMatch) return false;

      // Date range filter (Start Date & End Date)
      const reportDate = item.report_date || '';
      if (startDateFilter.trim() !== '') {
        if (!reportDate || reportDate < startDateFilter) {
          return false;
        }
      }
      if (endDateFilter.trim() !== '') {
        if (!reportDate || reportDate > endDateFilter) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // Search query filter (reporter_name, sludge_removal_desc)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const reporterMatch = (item.reporter_name || '').toLowerCase().includes(q);
        const descMatch = (item.data.sludge_removal_desc || '').toLowerCase().includes(q);
        if (!reporterMatch && !descMatch) return false;
      }

      return true;
    });
  }, [allDisplayItems, selectedCategory, startDateFilter, endDateFilter, statusFilter, searchQuery]);

  // Pagination calculation
  const totalItems = filteredReports.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Ensure currentPage is within bounds
  const safePage = Math.min(currentPage, totalPages);

  const paginatedReports = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, safePage, pageSize]);

  const handleExport = () => {
    const formattedReports: FullMonthlyReportData[] = filteredReports.map((item) => ({
      report: {
        id: item.id,
        year: selectedYear,
        month: item.month,
        status: item.status as any,
        reject_reason: null,
      },
      data: {
        ...item.data,
        report_id: item.id,
        reporter_name: item.reporter_name,
        report_date: item.report_date,
      } as any,
    }));
    exportMonthlyReportsToExcel(selectedYear, formattedReports);
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-[calc(100vh-73px)] space-y-6 pb-24">
      {/* HEADER & TOP CONTROLS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Database className="w-6 h-6 text-sky-600" />
            <span>ค้นหาและดูข้อมูลที่บันทึกไว้ (Data Explorer)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            เลือกหมวดหมู่ วันที่/เดือน และกรองดูรายละเอียดข้อมูลที่ลงบันทึกในระบบ
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all self-start md:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>ส่งออกข้อมูล Excel</span>
        </button>
      </div>

      {/* CATEGORY SELECTION TABS */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 pb-2">
          เลือกหมวดหมู่ที่ต้องการดูข้อมูล (Select Category)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">

          <button
            onClick={() => {
              setSelectedCategory('cat1');
              setCurrentPage(1);
            }}
            className={`px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${selectedCategory === 'cat1'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
          >
            <Droplets className="w-4 h-4 text-amber-500" />
            <span>1. ตะกอน (Sludge)</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory('cat2');
              setCurrentPage(1);
            }}
            className={`px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${selectedCategory === 'cat2'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
              }`}
          >
            <Factory className="w-4 h-4 text-blue-500" />
            <span>2. การผลิต (Production)</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory('cat3');
              setCurrentPage(1);
            }}
            className={`px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${selectedCategory === 'cat3'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-orange-50 text-orange-900 border border-orange-200 hover:bg-orange-100'
              }`}
          >
            <Flame className="w-4 h-4 text-orange-500" />
            <span>3. เชื้อเพลิง (Fuel)</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory('cat4');
              setCurrentPage(1);
            }}
            className={`px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${selectedCategory === 'cat4'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100'
              }`}
          >
            <Zap className="w-4 h-4 text-sky-500" />
            <span>4. ไฟฟ้า & โซลาร์</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory('cat5');
              setCurrentPage(1);
            }}
            className={`px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${selectedCategory === 'cat5'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
          >
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>5. WWT & Biogas</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory('cat6');
              setCurrentPage(1);
            }}
            className={`px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${selectedCategory === 'cat6'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
              }`}
          >
            <FlaskConical className="w-4 h-4 text-purple-500" />
            <span>6. สารเคมี (Chemical)</span>
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS BAR (Start Date, End Date, Status, Search) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Start Date Filter */}
        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
          <div className="flex-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">วันที่เริ่มต้น (Start Date)</span>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-transparent font-bold text-xs text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* End Date Filter */}
        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">วันที่สิ้นสุด (End Date)</span>
              {(startDateFilter || endDateFilter) && (
                <button
                  onClick={() => {
                    setStartDateFilter('');
                    setEndDateFilter('');
                    setCurrentPage(1);
                  }}
                  className="text-[10px] font-extrabold text-rose-600 hover:underline cursor-pointer"
                >
                  ล้างช่วงวัน
                </button>
              )}
            </div>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => {
                setEndDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-transparent font-bold text-xs text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">สถานะรายงาน</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-transparent font-bold text-xs text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">ทุกสถานะ (All Status)</option>
              <option value="approved">อนุมัติแล้ว (Approved)</option>
              <option value="pending">รออนุมัติ (Pending)</option>
              <option value="rejected">ตีกลับ (Rejected)</option>
            </select>
          </div>
        </div>

        {/* Search Query */}
        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 sm:col-span-2 lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="ค้นหาตามชื่อผู้ลงข้อมูล รหัสพนักงาน หรือ รายละเอียด..."
            className="w-full bg-transparent text-xs text-slate-800 font-medium focus:outline-none"
          />
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-200 uppercase tracking-wider font-bold border-b border-slate-800">
              <tr>
                <th className="p-3.5">วันที่ / ผู้บันทึก</th>
                <th className="p-3.5">สถานะ</th>

                {/* DYNAMIC CATEGORY COLUMNS */}
                {selectedCategory === 'cat1' && (
                  <>
                    <th className="p-3.5 bg-slate-800/80 text-sky-300">ขนตะกอน (ตัน)</th>
                    <th className="p-3.5 bg-slate-800/80 text-sky-300">รวมเงินตะกอน (บาท)</th>
                  </>
                )}

                {selectedCategory === 'cat2' && (
                  <>
                    <th className="p-3.5 bg-slate-800/80 text-sky-300">MS1/MS2/MS3 (ตัน)</th>
                    <th className="p-3.5 bg-slate-800/80 text-sky-300">รวมผลผลิต (ตัน)</th>
                  </>
                )}

                {selectedCategory === 'cat3' && (
                  <>
                    <th className="p-3.5 bg-slate-800/80 text-sky-300">น้ำมันเตา MS1-3 (ลิตร)</th>
                    <th className="p-3.5 bg-slate-800/80 text-sky-300">แก๊สชีวภาพ (Nm³)</th>
                  </>
                )}

                {selectedCategory === 'cat4' && (
                  <>
                    <th className="p-3.5 bg-slate-800/80 text-sky-300">มิเตอร์ PEA (kWh)</th>
                    <th className="p-3.5 bg-slate-800/80 text-amber-300">มิเตอร์ Solar (kWh)</th>
                    <th className="p-3.5 bg-slate-800/80 text-sky-300">รวมไฟฟ้าทั้งหมด (kWh)</th>
                  </>
                )}

                {selectedCategory === 'cat5' && (
                  <>
                    <th className="p-3.5 bg-slate-800/80 text-sky-300">น้ำเสียแป้งดัดแปร (m³)</th>
                    <th className="p-3.5 bg-slate-800/80 text-emerald-300">น้ำเสียแป้งดิบ (m³)</th>
                    <th className="p-3.5 bg-slate-800/80 text-cyan-300">รวมปริมาณน้ำเสีย (m³)</th>
                    <th className="p-3.5 bg-slate-800/80 text-purple-300">COD ขาออก (mg/l)</th>
                  </>
                )}

                {selectedCategory === 'cat6' && (
                  <>
                    <th className="p-3.5 bg-slate-800/80 text-sky-300">สารเคมี LIME / POLYMER</th>
                    <th className="p-3.5 bg-slate-800/80 text-sky-300">สารเคมี ODOR / FOG / COD</th>
                  </>
                )}

                <th className="p-3.5 text-center">จัดการ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedReports.length > 0 ? (
                paginatedReports.map((item) => {
                  const mName = MONTH_NAMES_TH[(item.month || 1) - 1];
                  const metrics = calculateMetrics(item.data);
                  const st = item.status;
                  const dateStr = item.report_date ? item.report_date.split('-').reverse().join('/') : '';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectMonth && onSelectMonth(item.month)}
                      className="hover:bg-sky-50/50 transition-colors cursor-pointer"
                    >
                      {/* DATE, REPORTER & APPROVER */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-sm">
                          {dateStr ? `วันที่ ${dateStr}` : `เดือน ${mName} ${selectedYear}`}
                        </div>
                        <div className="text-slate-600 text-[11px] font-semibold mt-0.5">
                          ผู้ลงข้อมูล: <span className="text-slate-800 font-bold">{item.reporter_name || 'ไม่ระบุชื่อ'}</span>
                        </div>
                        {item.approver_name && (
                          <div className="text-emerald-700 text-[10px] font-bold flex items-center gap-1 mt-0.5">
                            <BadgeCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>ผู้อนุมัติ: {item.approver_name}</span>
                          </div>
                        )}
                      </td>

                      {/* STATUS BADGE */}
                      <td className="p-3.5">
                        {st === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            อนุมัติแล้ว
                          </span>
                        )}
                        {(st === 'pending' || st === 'draft') && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                            <Clock className="w-3 h-3 text-sky-600" />
                            รออนุมัติ
                          </span>
                        )}
                        {st === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <X className="w-3 h-3 text-rose-600" />
                            ตีกลับ (Reject)
                          </span>
                        )}
                        {st === 'empty' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                            ยังไม่มีข้อมูล
                          </span>
                        )}
                      </td>

                      {/* CATEGORY 1: SLUDGE */}
                      {selectedCategory === 'cat1' && (
                        <>
                          <td className="p-3.5 font-bold text-slate-900">
                            {item.data.sludge_tons || 0} ตัน ({item.data.sludge_trips || 0} เที่ยว)
                          </td>
                          <td className="p-3.5 font-black text-sky-700">
                            ฿{metrics.sludgeGrandTotalBaht.toLocaleString('th-TH')}
                          </td>
                        </>
                      )}

                      {/* CATEGORY 2: PRODUCTION */}
                      {selectedCategory === 'cat2' && (
                        <>
                          <td className="p-3.5 font-bold text-slate-900">
                            {item.data.production_ms1 || 0} / {item.data.production_ms2 || 0} / {item.data.production_ms3 || 0}
                          </td>
                          <td className="p-3.5 font-black text-sky-700">
                            {metrics.totalProductionTons.toLocaleString('th-TH')} ตัน
                          </td>
                        </>
                      )}

                      {/* CATEGORY 3: FUEL & GAS */}
                      {selectedCategory === 'cat3' && (
                        <>
                          <td className="p-3.5 font-bold text-slate-900">
                            {metrics.fuelOilTotalLiter.toLocaleString('th-TH')} ลิตร
                          </td>
                          <td className="p-3.5 font-bold text-sky-700">
                            {metrics.gasTotalM3.toLocaleString('th-TH')} Nm³
                          </td>
                        </>
                      )}

                      {/* CATEGORY 4: ELECTRICITY & SOLAR */}
                      {selectedCategory === 'cat4' && (
                        <>
                          <td className="p-3.5 font-bold text-slate-900">
                            {metrics.elecTotalPeaKwh.toLocaleString('th-TH')} kWh
                          </td>
                          <td className="p-3.5 font-bold text-amber-600">
                            {metrics.elecTotalSolarKwh.toLocaleString('th-TH')} kWh
                          </td>
                          <td className="p-3.5 font-black text-sky-700">
                            {metrics.elecGrandTotalKwh.toLocaleString('th-TH')} kWh
                          </td>
                        </>
                      )}

                      {/* CATEGORY 5: WWT & BIOGAS */}
                      {selectedCategory === 'cat5' && (
                        <>
                          <td className="p-3.5 font-bold text-slate-900">
                            {(item.data.wwt_codt_mix1 || 0).toLocaleString('th-TH')} m³
                          </td>
                          <td className="p-3.5 font-bold text-emerald-700">
                            {(item.data.wwt_cod_native || 0).toLocaleString('th-TH')} m³
                          </td>
                          <td className="p-3.5 font-black text-sky-700">
                            {(item.data.wwt_cod_loading || 0).toLocaleString('th-TH')} m³
                          </td>
                          <td className="p-3.5 font-bold text-purple-700">
                            {item.data.wwt_cod_eff_as ? `${item.data.wwt_cod_eff_as} mg/l` : '-'}
                          </td>
                        </>
                      )}

                      {/* CATEGORY 6: CHEMICAL */}
                      {selectedCategory === 'cat6' && (
                        <>
                          <td className="p-3.5 font-bold text-slate-900">
                            LIME: {item.data.chem_lime_usage || 0} ถุง | POLYMER: {item.data.chem_polymer_usage || 0} ถุง
                          </td>
                          <td className="p-3.5 font-bold text-purple-700">
                            ODOR: {item.data.chem_odor_usage || 0} แกลลอน | FOG: {item.data.chem_fog_usage || 0} | COD: {item.data.chem_cod_tube_usage || 0} หลอด
                          </td>
                        </>
                      )}

                      {/* ACTION BUTTONS */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setViewModalItem(item)}
                            title="ดูข้อมูล"
                            className="p-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setEditModalItem(item)}
                            title="แก้ไขข้อมูล"
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteItem(item)}
                            title="ลบข้อมูล"
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 font-medium">
                    ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span>แสดง</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 focus:outline-none"
            >
              <option value={5}>5 รายการ</option>
              <option value={10}>10 รายการ</option>
              <option value={30}>30 รายการ</option>
              <option value={50}>50 รายการ</option>
            </select>
            <span>จากทั้งหมด <strong className="text-slate-900 font-black">{totalItems}</strong> รายการ</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">
              หน้าที่ <strong className="text-slate-900">{safePage}</strong> จาก {totalPages}
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-slate-700" />
              </button>

              <button
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-slate-700" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {viewModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-start p-2 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in my-auto relative">
            <div className="sticky top-0 z-30 bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-sky-400" />
                <h3 className="text-base font-bold">
                  ดูข้อมูลแบบฟอร์ม (วันที่ {viewModalItem.report_date ? viewModalItem.report_date.split('-').reverse().join('/') : viewModalItem.month})
                </h3>
              </div>
              <button
                onClick={() => setViewModalItem(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 max-h-[80vh] overflow-y-auto pb-24">
              <DataEntryForm
                selectedYear={selectedYear}
                selectedMonth={viewModalItem.month || 1}
                setSelectedMonth={() => {}}
                reportsData={reportsData}
                currentUser={currentUser || null}
                onSaveDraft={() => {}}
                onSubmitApproval={() => {}}
                onApproveReport={() => {}}
                onRejectReport={() => {}}
                initialData={viewModalItem.data}
                initialCategory={viewModalItem.category_key || selectedCategory}
                isReadOnlyMode={true}
                onCloseModal={() => setViewModalItem(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* EDIT DATA MODAL */}
      {editModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-start p-2 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in my-auto relative">
            <div className="sticky top-0 z-30 bg-amber-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <Edit3 className="w-6 h-6 text-amber-300" />
                <h3 className="text-base font-bold">
                  แก้ไขข้อมูลแบบฟอร์ม (วันที่ {editModalItem.report_date ? editModalItem.report_date.split('-').reverse().join('/') : editModalItem.month})
                </h3>
              </div>
              <button
                onClick={() => setEditModalItem(null)}
                className="p-1.5 rounded-xl bg-amber-950 hover:bg-amber-800 text-amber-200 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 max-h-[80vh] overflow-y-auto pb-24">
              <DataEntryForm
                selectedYear={selectedYear}
                selectedMonth={editModalItem.month || 1}
                setSelectedMonth={() => {}}
                reportsData={reportsData}
                currentUser={currentUser || null}
                onSaveDraft={() => {}}
                onSubmitApproval={() => {}}
                onApproveReport={() => {}}
                onRejectReport={() => {}}
                initialData={editModalItem.data}
                initialCategory={editModalItem.category_key || selectedCategory}
                isReadOnlyMode={false}
                onCloseModal={() => setEditModalItem(null)}
                onSaveEditItem={handleSaveEditWithData}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
