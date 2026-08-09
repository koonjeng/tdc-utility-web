'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Zap,
  Sun,
  Flame,
  Truck,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { UserRole, FullMonthlyReportData, ReportData } from '@/lib/types';
import { calculateMetrics, MONTH_NAMES_TH, MONTH_SHORT_TH } from '@/lib/calculations';
import { getCategorySubmissions } from '@/lib/supabase';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

interface EnergyReportViewProps {
  selectedYear: number;
  reportsData: FullMonthlyReportData[];
  currentUser: { email: string; role: UserRole } | null;
}

export const EnergyReportView: React.FC<EnergyReportViewProps> = ({
  selectedYear,
  reportsData,
  currentUser,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Initial Daily Log Rows starting at 0
  const [dailyRows, setDailyRows] = useState<
    Array<{
      date: string;
      sludge: number;
      fuel: number;
      m1: number;
      m2: number;
      m3: number;
      solar1: number;
      solar2: number;
    }>
  >([
    { date: '1 พ.ค. 69', sludge: 0, fuel: 0, m1: 0, m2: 0, m3: 0, solar1: 0, solar2: 0 },
  ]);

  // Initial Sludge Ops Rows starting at 0
  const [opsRows, setOpsRows] = useState<
    Array<{
      dateRange: string;
      title: string;
      trips: number;
      tons: number;
      cost: number;
    }>
  >([
    { dateRange: '1–4 พ.ค.', title: 'กำจัดตะกอน', trips: 0, tons: 0, cost: 0 },
  ]);

  // Additional Cost Rows
  const [costRows, setCostRows] = useState<
    Array<{
      name: string;
      cost: number;
    }>
  >([]);

  // Summary & Efficiency Fields
  const [fuelLiter, setFuelLiter] = useState<number>(0);
  const [fuelCost, setFuelCost] = useState<number>(0);
  const [effGasOilRatio, setEffGasOilRatio] = useState<string>('Gas / Oil ratio 80/20%');
  const [effGasDaily, setEffGasDaily] = useState<string>('การใช้ Gas เฉลี่ย 0 Nm³/day');
  const [effLTons, setEffLTons] = useState<string>('L / Tons 0.00');
  const [effMs3LTons, setEffMs3LTons] = useState<string>('Ms3 L/Tons 0.00');

  // YoY Comparison Tables starting at 0
  const [elecYoy, setElecYoy] = useState([
    { name: 'มิเตอร์ 1 (MS1,3,TF)', v1: 0, v2: 0 },
    { name: 'มิเตอร์ 2 (UTL)', v1: 0, v2: 0 },
    { name: 'มิเตอร์ 3 (MS2)', v1: 0, v2: 0 },
  ]);

  const [solarYoy, setSolarYoy] = useState([
    { name: 'โซลาร์ MS2', v1: 0, v2: 0 },
    { name: 'โซลาร์ TF', v1: 0, v2: 0 },
  ]);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const triggerNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Sync exact data from system (Monthly Reports + Category Submissions) filtered by date range or month
  useEffect(() => {
    async function syncEnergyData() {
      let mergedData: Partial<ReportData> = {};
      const catSubmissionsList = await getCategorySubmissions(selectedYear);

      // 1. If date range is specified (startDate/endDate), fetch ALL matching submissions across months
      if (startDate || endDate) {
        const allSubs = catSubmissionsList.filter((s) => {
          if (s.status !== 'approved' && s.status !== 'pending') return false;
          if (startDate && s.report_date && s.report_date < startDate) return false;
          if (endDate && s.report_date && s.report_date > endDate) return false;
          return true;
        });

        let totalSludgeTons = 0;
        let totalSludgeTrips = 0;
        let totalSludgeCost = 0;
        let totalFuelLiter = 0;
        let totalFuelCost = 0;

        // Map to aggregate entries by date string
        const dateMap = new Map<string, { date: string; sludge: number; fuel: number; m1: number; m2: number; m3: number; solar1: number; solar2: number }>();

        allSubs.forEach((sub) => {
          const subData = sub.data || {};
          // Accumulate numeric fields instead of overwriting
          for (const key of Object.keys(subData)) {
            const val = (subData as any)[key];
            if (val === undefined || val === null || val === '') continue;
            if (typeof val === 'number') {
              (mergedData as any)[key] = (Number((mergedData as any)[key]) || 0) + val;
            } else {
              (mergedData as any)[key] = val;
            }
          }

          const m1 = (Number(subData.elec_ms3_ms1_tf_on_peak) || 0) + (Number(subData.elec_ms3_ms1_tf_off_peak) || 0) || Number(subData.elec_meter1_ms1_ms3_tf) || 0;
          const m2 = (Number(subData.elec_utl_on_peak) || 0) + (Number(subData.elec_utl_off_peak) || 0) || Number(subData.elec_meter2_utl) || 0;
          const m3 = (Number(subData.elec_ms2_mix_on_peak) || 0) + (Number(subData.elec_ms2_mix_off_peak) || 0) || Number(subData.elec_meter3_ms2_mix) || 0;

          const solar1 = Number(subData.solar_meter1_ms2) || 0;
          const solar2 = Number(subData.solar_meter2_tf) || 0;

          const sludge = (Number(subData.sludge_tons) || 0) + (Number(subData.sludge_vac_tons) || 0);
          const fuel = (Number(subData.fuel_oil_a_ms1_liter) || 0) + (Number(subData.fuel_oil_a_ms2_liter) || 0) + (Number(subData.fuel_oil_a_ms3_liter) || 0) || Number(subData.fuel_oil_a_total_liter) || Number(subData.fuel_oil_a_liter) || 0;
          const fuelBaht = Number(subData.fuel_oil_a_baht) || 0;
          const sludgeBaht = Number(subData.sludge_grand_total_baht) || Number(subData.sludge_total_baht) || 0;
          const sludgeTrips = Number(subData.sludge_trips) || 0;

          totalSludgeTons += sludge;
          totalSludgeTrips += sludgeTrips;
          totalSludgeCost += sludgeBaht;
          totalFuelLiter += fuel;
          totalFuelCost += fuelBaht;

          const dateStr = sub.report_date ? sub.report_date.split('-').reverse().join('/') : `1 ${MONTH_SHORT_TH[sub.month - 1]}`;

          if (dateMap.has(dateStr)) {
            const existing = dateMap.get(dateStr)!;
            existing.sludge += sludge;
            existing.fuel += fuel;
            existing.m1 += m1;
            existing.m2 += m2;
            existing.m3 += m3;
            existing.solar1 += solar1;
            existing.solar2 += solar2;
          } else {
            dateMap.set(dateStr, {
              date: dateStr,
              sludge,
              fuel,
              m1,
              m2,
              m3,
              solar1,
              solar2,
            });
          }
        });

        const dailyList = Array.from(dateMap.values());

        if (dailyList.length > 0) {
          setDailyRows(dailyList);
        } else {
          setDailyRows([
            {
              date: startDate && endDate ? `${startDate.split('-').reverse().join('/')} – ${endDate.split('-').reverse().join('/')}` : 'ช่วงวันที่เลือก',
              sludge: totalSludgeTons,
              fuel: totalFuelLiter,
              m1: Number(mergedData.elec_meter1_ms1_ms3_tf) || 0,
              m2: Number(mergedData.elec_meter2_utl) || 0,
              m3: Number(mergedData.elec_meter3_ms2_mix) || 0,
              solar1: Number(mergedData.solar_meter1_ms2) || 0,
              solar2: Number(mergedData.solar_meter2_tf) || 0,
            },
          ]);
        }

        setFuelLiter(totalFuelLiter);
        setFuelCost(totalFuelCost);

        setOpsRows([
          {
            dateRange: startDate && endDate ? `${startDate.split('-').reverse().join('/')} – ${endDate.split('-').reverse().join('/')}` : 'ช่วงวันที่เลือก',
            title: mergedData.sludge_removal_desc || 'กำจัดตะกอน',
            trips: totalSludgeTrips,
            tons: totalSludgeTons,
            cost: totalSludgeCost,
          },
        ]);
      } else {
        // 2. Default: Get base report data for selected month
        const reportObj = reportsData.find((r) => r.report.month === selectedMonth);
        mergedData = { ...(reportObj?.data || {}) };

        // Helper to check if submission belongs to selectedMonth
        const isSelectedMonthSub = (s: any) => {
          if (s.month === selectedMonth) return true;
          if (s.report_date) {
            const parts = s.report_date.split('-');
            if (parts.length === 3 && parseInt(parts[1], 10) === selectedMonth) {
              return true;
            }
          }
          return false;
        };

        const catSubs = catSubmissionsList.filter(
          (s) => isSelectedMonthSub(s) && (s.status === 'approved' || s.status === 'pending')
        );

      let totalSludgeTons = 0;
      let totalSludgeTrips = 0;
      let totalSludgeCost = 0;
      let totalFuelLiter = 0;
      let totalFuelCost = 0;

      // Map to aggregate entries by date string in month view
      const dateMap = new Map<string, { date: string; sludge: number; fuel: number; m1: number; m2: number; m3: number; solar1: number; solar2: number }>();

      catSubs.forEach((sub) => {
        const subData = sub.data || {};
        // Accumulate numeric fields instead of overwriting
        for (const key of Object.keys(subData)) {
          const val = (subData as any)[key];
          if (val === undefined || val === null || val === '') continue;
          if (typeof val === 'number') {
            (mergedData as any)[key] = (Number((mergedData as any)[key]) || 0) + val;
          } else {
            (mergedData as any)[key] = val;
          }
        }

        const m1 = (Number(subData.elec_ms3_ms1_tf_on_peak) || 0) + (Number(subData.elec_ms3_ms1_tf_off_peak) || 0) || Number(subData.elec_meter1_ms1_ms3_tf) || 0;
        const m2 = (Number(subData.elec_utl_on_peak) || 0) + (Number(subData.elec_utl_off_peak) || 0) || Number(subData.elec_meter2_utl) || 0;
        const m3 = (Number(subData.elec_ms2_mix_on_peak) || 0) + (Number(subData.elec_ms2_mix_off_peak) || 0) || Number(subData.elec_meter3_ms2_mix) || 0;

        const solar1 = Number(subData.solar_meter1_ms2) || 0;
        const solar2 = Number(subData.solar_meter2_tf) || 0;

        const sludge = (Number(subData.sludge_tons) || 0) + (Number(subData.sludge_vac_tons) || 0);
        const fuel = (Number(subData.fuel_oil_a_ms1_liter) || 0) + (Number(subData.fuel_oil_a_ms2_liter) || 0) + (Number(subData.fuel_oil_a_ms3_liter) || 0) || Number(subData.fuel_oil_a_total_liter) || Number(subData.fuel_oil_a_liter) || 0;
        const fuelBaht = Number(subData.fuel_oil_a_baht) || 0;
        const sludgeBaht = Number(subData.sludge_grand_total_baht) || Number(subData.sludge_total_baht) || 0;
        const sludgeTrips = Number(subData.sludge_trips) || 0;

        totalSludgeTons += sludge;
        totalSludgeTrips += sludgeTrips;
        totalSludgeCost += sludgeBaht;
        totalFuelLiter += fuel;
        totalFuelCost += fuelBaht;

        const dateStr = sub.report_date ? sub.report_date.split('-').reverse().join('/') : `1 ${MONTH_SHORT_TH[selectedMonth - 1]}`;

        if (dateMap.has(dateStr)) {
          const existing = dateMap.get(dateStr)!;
          existing.sludge += sludge;
          existing.fuel += fuel;
          existing.m1 += m1;
          existing.m2 += m2;
          existing.m3 += m3;
          existing.solar1 += solar1;
          existing.solar2 += solar2;
        } else {
          dateMap.set(dateStr, {
            date: dateStr,
            sludge,
            fuel,
            m1,
            m2,
            m3,
            solar1,
            solar2,
          });
        }
      });

      const dailyList = Array.from(dateMap.values());

      const d = mergedData;
      const metrics = calculateMetrics(d as ReportData);

      const m1Val = (Number(d.elec_ms3_ms1_tf_on_peak) || 0) + (Number(d.elec_ms3_ms1_tf_off_peak) || 0) || Number(d.elec_meter1_ms1_ms3_tf) || 0;
      const m2Val = (Number(d.elec_utl_on_peak) || 0) + (Number(d.elec_utl_off_peak) || 0) || Number(d.elec_meter2_utl) || 0;
      const m3Val = (Number(d.elec_ms2_mix_on_peak) || 0) + (Number(d.elec_ms2_mix_off_peak) || 0) || Number(d.elec_meter3_ms2_mix) || 0;

      const solar1Val = Number(d.solar_meter1_ms2) || 0;
      const solar2Val = Number(d.solar_meter2_tf) || 0;

      const sludgeVal = totalSludgeTons || (Number(d.sludge_tons) || 0) + (Number(d.sludge_vac_tons) || 0);
      const fuelLiterVal = totalFuelLiter || (Number(d.fuel_oil_a_ms1_liter) || 0) + (Number(d.fuel_oil_a_ms2_liter) || 0) + (Number(d.fuel_oil_a_ms3_liter) || 0) || metrics.fuelOilTotalLiter || Number(d.fuel_oil_a_total_liter) || Number(d.fuel_oil_a_liter) || 0;
      const fuelCostVal = totalFuelCost || Number(d.fuel_oil_a_baht) || 0;

      const monthNameShort = MONTH_SHORT_TH[selectedMonth - 1];

      if (dailyList.length > 0) {
        setDailyRows(dailyList);
      } else {
        setDailyRows([
          {
            date: `1 ${monthNameShort}`,
            sludge: sludgeVal,
            fuel: fuelLiterVal,
            m1: m1Val,
            m2: m2Val,
            m3: m3Val,
            solar1: solar1Val,
            solar2: solar2Val,
          },
        ]);
      }

      setFuelLiter(fuelLiterVal);
      setFuelCost(fuelCostVal);

      setOpsRows([
        {
          dateRange: `1–${monthNameShort}`,
          title: d.sludge_removal_desc || 'กำจัดตะกอน',
          trips: totalSludgeTrips || Number(d.sludge_trips) || 0,
          tons: sludgeVal,
          cost: totalSludgeCost || metrics.sludgeGrandTotalBaht || Number(d.sludge_total_baht) || 0,
        },
      ]);
    }

    // 3. YoY Comparison Calculation (Sync v2 from totalElecMeter and totalSolarMeter)
    const prevYear = selectedYear - 1;
    const isSelectedMonthSubPrev = (s: any) => {
      if (s.month === selectedMonth) return true;
      if (s.report_date) {
        const parts = s.report_date.split('-');
        if (parts.length === 3 && parseInt(parts[1], 10) === selectedMonth) {
          return true;
        }
      }
      return false;
    };

    const prevCatSubsList = await getCategorySubmissions(prevYear);
    const prevCatSubs = prevCatSubsList.filter(
      (s) => (startDate || endDate ? true : isSelectedMonthSubPrev(s)) && (s.status === 'approved' || s.status === 'pending')
    );
    let prevMergedData: Partial<ReportData> = {};
    prevCatSubs.forEach((sub) => {
      prevMergedData = { ...prevMergedData, ...sub.data };
    });

    const m1Prev = (Number(prevMergedData.elec_ms3_ms1_tf_on_peak) || 0) + (Number(prevMergedData.elec_ms3_ms1_tf_off_peak) || 0) || Number(prevMergedData.elec_meter1_ms1_ms3_tf) || 0;
    const m2Prev = (Number(prevMergedData.elec_utl_on_peak) || 0) + (Number(prevMergedData.elec_utl_off_peak) || 0) || Number(prevMergedData.elec_meter2_utl) || 0;
    const m3Prev = (Number(prevMergedData.elec_ms2_mix_on_peak) || 0) + (Number(prevMergedData.elec_ms2_mix_off_peak) || 0) || Number(prevMergedData.elec_meter3_ms2_mix) || 0;

    const solar1Prev = Number(prevMergedData.solar_meter1_ms2) || 0;
    const solar2Prev = Number(prevMergedData.solar_meter2_tf) || 0;

    // Current values from mergedData
    const m1Cur = (Number(mergedData.elec_ms3_ms1_tf_on_peak) || 0) + (Number(mergedData.elec_ms3_ms1_tf_off_peak) || 0) || Number(mergedData.elec_meter1_ms1_ms3_tf) || 0;
    const m2Cur = (Number(mergedData.elec_utl_on_peak) || 0) + (Number(mergedData.elec_utl_off_peak) || 0) || Number(mergedData.elec_meter2_utl) || 0;
    const m3Cur = (Number(mergedData.elec_ms2_mix_on_peak) || 0) + (Number(mergedData.elec_ms2_mix_off_peak) || 0) || Number(mergedData.elec_meter3_ms2_mix) || 0;
    const solar1Cur = Number(mergedData.solar_meter1_ms2) || 0;
    const solar2Cur = Number(mergedData.solar_meter2_tf) || 0;

    setElecYoy([
      { name: 'มิเตอร์ 1 (MS1,3,TF)', v1: m1Prev, v2: m1Cur },
      { name: 'มิเตอร์ 2 (UTL)', v1: m2Prev, v2: m2Cur },
      { name: 'มิเตอร์ 3 (MS2)', v1: m3Prev, v2: m3Cur },
    ]);

    setSolarYoy([
      { name: 'โซลาร์ MS2', v1: solar1Prev, v2: solar1Cur },
      { name: 'โซลาร์ TF', v1: solar2Prev, v2: solar2Cur },
    ]);
    }
    syncEnergyData();
  }, [selectedMonth, reportsData, selectedYear, startDate, endDate]);

  // Dynamic Calculations
  const totalElecMeter1 = dailyRows.reduce((sum, r) => sum + Number(r.m1 || 0), 0);
  const totalElecMeter2 = dailyRows.reduce((sum, r) => sum + Number(r.m2 || 0), 0);
  const totalElecMeter3 = dailyRows.reduce((sum, r) => sum + Number(r.m3 || 0), 0);
  const grandTotalElec = totalElecMeter1 + totalElecMeter2 + totalElecMeter3;

  const totalSolarMeter1 = dailyRows.reduce((sum, r) => sum + Number(r.solar1 || 0), 0);
  const totalSolarMeter2 = dailyRows.reduce((sum, r) => sum + Number(r.solar2 || 0), 0);
  const grandTotalSolar = totalSolarMeter1 + totalSolarMeter2;

  const totalSludgeTons = opsRows.reduce((sum, r) => sum + Number(r.tons || 0), 0);
  const totalSludgeTrips = opsRows.reduce((sum, r) => sum + Number(r.trips || 0), 0);
  const totalSludgeCost = opsRows.reduce((sum, r) => sum + Number(r.cost || 0), 0);

  const customCostsTotal = costRows.reduce((sum, r) => sum + Number(r.cost || 0), 0);
  const grandTotalCost = fuelCost + totalSludgeCost + customCostsTotal;

  // YoY Totals
  const elecYoyV1Total = elecYoy.reduce((sum, r) => sum + Number(r.v1 || 0), 0);
  const elecYoyV2Total = elecYoy.reduce((sum, r) => sum + Number(r.v2 || 0), 0);

  const solarYoyV1Total = solarYoy.reduce((sum, r) => sum + Number(r.v1 || 0), 0);
  const solarYoyV2Total = solarYoy.reduce((sum, r) => sum + Number(r.v2 || 0), 0);

  // Formatting helpers
  const fCom = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fCom0 = (n: number) => n.toLocaleString('th-TH', { maximumFractionDigits: 0 });

  // Download PDF / PNG Export using modern-screenshot
  const handleExportPage = async (pageId: string, pageNum: number) => {
    setIsExporting(true);
    const element = document.getElementById(pageId);
    if (!element) {
      alert('ไม่พบองค์ประกอบหน้าสำหรับการส่งออก');
      setIsExporting(false);
      return;
    }

    try {
      const { domToPng } = await import('modern-screenshot');

      const dataUrl = await domToPng(element, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `รายงานพลังงานองค์รวม_${MONTH_NAMES_TH[selectedMonth - 1]}_หน้า${pageNum}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerNotify(`ดาวน์โหลดรายงานหน้า ${pageNum} สำเร็จแล้ว!`);
    } catch (e: any) {
      console.error('Export failed details:', e);
      alert(`เกิดข้อผิดพลาดในการส่งออกไฟล์ PNG: ${e?.message || e}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-200 min-h-[calc(100vh-73px)] space-y-6 flex flex-col items-center">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-8 z-50 bg-sky-950 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-sky-600 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-sky-400" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* TOP ACTION CONTROL BAR */}
      <div className="w-full max-w-[210mm] bg-white p-4 rounded-2xl border border-slate-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">ออกรายงานสรุปพลังงานองค์รวม (A4 Report)</h2>
            <p className="text-xs text-slate-500">เลือกเดือนประจำรอบ และดาวน์โหลดเป็นไฟล์ PNG/PDF หรือพิมพ์รายงาน</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* MONTH SELECTOR */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            {MONTH_NAMES_TH.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>
                ประจำรอบ {m} {selectedYear}
              </option>
            ))}
          </select>

          {/* DATE RANGE FILTERS */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <div className="relative inline-flex items-center">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-24 bg-transparent text-[11px] font-semibold focus:outline-none cursor-pointer"
                style={{ color: 'transparent', caretColor: 'transparent' }}
                title="วันเริ่มต้น"
              />
              <span className="absolute left-0 pointer-events-none text-[11px] font-semibold text-slate-800">
                {startDate ? startDate.split('-').reverse().join('/') : 'dd/mm/yyyy'}
              </span>
            </div>
            <span className="text-slate-400 font-bold">-</span>
            <div className="relative inline-flex items-center">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-24 bg-transparent text-[11px] font-semibold focus:outline-none cursor-pointer"
                style={{ color: 'transparent', caretColor: 'transparent' }}
                title="วันสิ้นสุด"
              />
              <span className="absolute left-0 pointer-events-none text-[11px] font-semibold text-slate-800">
                {endDate ? endDate.split('-').reverse().join('/') : 'dd/mm/yyyy'}
              </span>
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-[10px] text-rose-600 hover:text-rose-800 font-bold ml-1 cursor-pointer"
                title="ล้างช่วงวันที่"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer no-print"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>พิมพ์รายงาน A4 (Print)</span>
          </button>

          <button
            onClick={() => handleExportPage('report-page-1', 1)}
            disabled={isExporting}
            className="px-4 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 no-print"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด หน้า 1 (PNG)</span>
          </button>

          <button
            onClick={() => handleExportPage('report-page-2', 2)}
            disabled={isExporting}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 no-print"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด หน้า 2 (PNG)</span>
          </button>
        </div>
      </div>

      {/* A4 REPORT DOCUMENT CONTAINER PAGE 1 */}
      <div
        id="report-page-1"
        className="w-[210mm] min-h-[297mm] bg-white shadow-2xl rounded-md overflow-hidden text-slate-800 font-sans flex flex-col justify-between border border-slate-300 relative text-[11px] print-page-break"
      >
        {/* HEADER BANNER */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-900 to-sky-700 text-white p-5 flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-xl shrink-0">

            </div>
            <div>
              <h1 className="text-base font-extrabold leading-tight">รายงานสรุปการใช้พลังงาน</h1>
              <p className="text-[10.5px] text-sky-200 mt-0.5">UTL Environmental</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-sky-200">ประจำรอบ</p>
            <span className="inline-flex items-center gap-1.5 bg-white/20 border border-white/30 px-3 py-1 rounded-full text-xs font-bold text-white mt-1">
              1–{MONTH_NAMES_TH[selectedMonth - 1]} {selectedYear}
            </span>
            <p className="text-[9px] text-sky-300 mt-1">หน้า 1 / 2</p>
          </div>
        </div>

        {/* KPI STRIP */}
        <div className="grid grid-cols-4 bg-slate-950 text-white text-center border-b border-slate-800">
          <div className="py-2.5 px-2 border-r border-white/10">
            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">ไฟฟ้ารวมทั้งหมด</p>
            <p className="text-base font-black text-emerald-400 mt-0.5">
              {fCom(grandTotalElec)} <span className="text-xs font-bold">kWh</span>
            </p>
          </div>
          <div className="py-2.5 px-2 border-r border-white/10">
            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">โซลาร์เซลล์รวม</p>
            <p className="text-base font-black text-emerald-400 mt-0.5">
              {fCom(grandTotalSolar)} <span className="text-xs font-bold">kWh</span>
            </p>
          </div>
          <div className="py-2.5 px-2 border-r border-white/10">
            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">ใช้น้ำมันเตารวม</p>
            <p className="text-base font-black text-emerald-400 mt-0.5">
              {fCom(fuelLiter)} <span className="text-xs font-bold">L</span>
            </p>
          </div>
          <div className="py-2.5 px-2">
            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">การกำจัดตะกอน</p>
            <p className="text-base font-black text-emerald-400 mt-0.5">
              {fCom(totalSludgeTons)} <span className="text-xs font-bold">Ton</span>
            </p>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="p-4 space-y-3.5 flex-1">
          {/* DAILY LOG TABLE */}
          <div className="bg-sky-50/50 border border-sky-200 rounded-xl overflow-hidden">
            <div className="bg-sky-100/80 px-3 py-1.5 font-black text-sky-900 text-xs flex items-center justify-between border-b border-sky-200">
              <span>บันทึกการใช้งานรายวัน (DAILY LOG)</span>
              {!isExporting && (
                <button
                  onClick={() =>
                    setDailyRows((prev) => [
                      ...prev,
                      {
                        date: `${prev.length + 1} พ.ค. 69`,
                        sludge: 0,
                        fuel: 0,
                        m1: 0,
                        m2: 0,
                        m3: 0,
                        solar1: 0,
                        solar2: 0,
                      },
                    ])
                  }
                  className="text-[10px] bg-sky-700 text-white px-2 py-0.5 rounded font-bold hover:bg-sky-600 cursor-pointer"
                >
                  + เพิ่มวัน
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-center text-[10px] border-collapse">
                <thead>
                  <tr className="bg-sky-100/40 text-sky-900 font-bold border-b border-sky-200">
                    <th className="p-1.5 border-r border-sky-200">วันที่</th>
                    <th className="p-1.5 border-r border-sky-200">กำจัดตะกอน</th>
                    <th className="p-1.5 border-r border-sky-200">น้ำมันเตา</th>
                    <th className="p-1.5 border-r border-sky-200">มิเตอร์ 1 MS1,3,TF (kWh)</th>
                    <th className="p-1.5 border-r border-sky-200">มิเตอร์ 2 UTL (kWh)</th>
                    <th className="p-1.5 border-r border-sky-200">มิเตอร์ 3 MS2 (kWh)</th>
                    <th className="p-1.5 border-r border-sky-200">โซลาร์ 1 MS2 (kWh)</th>
                    <th className={isExporting ? "p-1.5" : "p-1.5 border-r border-sky-200"}>โซลาร์ 2 TF (kWh)</th>
                    {!isExporting && <th className="p-1.5 w-8">จัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100">
                  {dailyRows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-white/80 group">
                      <td className="p-1 border-r border-sky-200">
                        <input
                          type="text"
                          value={r.date}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDailyRows((prev) => prev.map((item, i) => (i === idx ? { ...item, date: val } : item)));
                          }}
                          className="w-full text-center bg-transparent focus:outline-none font-medium"
                        />
                      </td>
                      <td className="p-1 border-r border-sky-200">
                        <input
                          type="number"
                          value={r.sludge || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setDailyRows((prev) => prev.map((item, i) => (i === idx ? { ...item, sludge: val } : item)));
                          }}
                          className="w-full text-center bg-transparent focus:outline-none font-bold"
                        />
                      </td>
                      <td className="p-1 border-r border-sky-200">
                        <input
                          type="number"
                          value={r.fuel || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setDailyRows((prev) => prev.map((item, i) => (i === idx ? { ...item, fuel: val } : item)));
                          }}
                          className="w-full text-center bg-transparent focus:outline-none font-bold"
                        />
                      </td>
                      <td className="p-1 border-r border-sky-200 font-bold">
                        <input
                          type="number"
                          value={r.m1 || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setDailyRows((prev) => prev.map((item, i) => (i === idx ? { ...item, m1: val } : item)));
                          }}
                          className="w-full text-center bg-transparent focus:outline-none font-extrabold"
                        />
                      </td>
                      <td className="p-1 border-r border-sky-200 font-bold">
                        <input
                          type="number"
                          value={r.m2 || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setDailyRows((prev) => prev.map((item, i) => (i === idx ? { ...item, m2: val } : item)));
                          }}
                          className="w-full text-center bg-transparent focus:outline-none font-extrabold"
                        />
                      </td>
                      <td className="p-1 border-r border-sky-200 font-bold">
                        <input
                          type="number"
                          value={r.m3 || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setDailyRows((prev) => prev.map((item, i) => (i === idx ? { ...item, m3: val } : item)));
                          }}
                          className="w-full text-center bg-transparent focus:outline-none font-extrabold"
                        />
                      </td>
                      <td className="p-1 border-r border-sky-200 font-bold">
                        <input
                          type="number"
                          value={r.solar1 || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setDailyRows((prev) => prev.map((item, i) => (i === idx ? { ...item, solar1: val } : item)));
                          }}
                          className="w-full text-center bg-transparent focus:outline-none font-extrabold"
                        />
                      </td>
                      <td className={isExporting ? "p-1 font-bold" : "p-1 border-r border-sky-200 font-bold"}>
                        <input
                          type="number"
                          value={r.solar2 || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setDailyRows((prev) => prev.map((item, i) => (i === idx ? { ...item, solar2: val } : item)));
                          }}
                          className="w-full text-center bg-transparent focus:outline-none font-extrabold"
                        />
                      </td>
                      {!isExporting && (
                        <td className="p-0.5 text-center">
                          <button
                            onClick={() => setDailyRows((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="ลบแถวนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 1: ELECTRICITY & SOLAR SUMMARY */}
          <div>
            <div className="font-extrabold text-sky-900 text-xs border-b-2 border-sky-600 pb-1 mb-2 uppercase flex items-center gap-1.5">

              <span>หมวดที่ 1 : ไฟฟ้า & โซลาร์เซลล์ (Electricity & Solar)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* ELEC CARD */}
              <div className="bg-gradient-to-br from-sky-50 to-sky-100/50 p-3 rounded-xl border border-sky-200 space-y-1.5">
                <div className="font-extrabold text-sky-900 text-[11px] border-b border-sky-200 pb-1 flex justify-between">
                  <span>สรุปรายงานไฟฟ้า (ELECTRICITY)</span>
                  <span>พลังงาน (kWh)</span>
                </div>
                <div className="flex justify-between text-[10.5px]">
                  <span>1 (MS1 , MS3 , TF)</span>
                  <span className="font-extrabold text-slate-900">{fCom(totalElecMeter1)}</span>
                </div>
                <div className="flex justify-between text-[10.5px]">
                  <span>2 (UTL)</span>
                  <span className="font-extrabold text-slate-900">{fCom(totalElecMeter2)}</span>
                </div>
                <div className="flex justify-between text-[10.5px]">
                  <span>3 (MS2)</span>
                  <span className="font-extrabold text-slate-900">{fCom(totalElecMeter3)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black text-sky-900 bg-sky-200/60 p-1.5 rounded-lg border border-sky-300">
                  <span>รวมทั้งหมด</span>
                  <span>{fCom(grandTotalElec)}</span>
                </div>
              </div>

              {/* SOLAR CARD */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-3 rounded-xl border border-amber-200 space-y-1.5">
                <div className="font-extrabold text-amber-900 text-[11px] border-b border-amber-200 pb-1 flex justify-between">
                  <span>สรุปรายงานโซลาร์เซลล์ (SOLAR)</span>
                  <span>พลังงาน (kWh)</span>
                </div>
                <div className="flex justify-between text-[10.5px]">
                  <span>1 MS2</span>
                  <span className="font-extrabold text-slate-900">{fCom(totalSolarMeter1)}</span>
                </div>
                <div className="flex justify-between text-[10.5px]">
                  <span>2 TF</span>
                  <span className="font-extrabold text-slate-900">{fCom(totalSolarMeter2)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black text-amber-900 bg-amber-200/60 p-1.5 rounded-lg border border-amber-300">
                  <span>รวมทั้งหมด</span>
                  <span>{fCom(grandTotalSolar)}</span>
                </div>
              </div>
            </div>

            {/* YOY COMPARISON GRID */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              {/* ELEC YOY TABLE */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 px-3 py-1 font-bold text-slate-800 text-[10.5px] border-b border-slate-200">
                  เปรียบเทียบการใช้ไฟฟ้า (YOY COMPARISON)
                </div>
                <table className="w-full text-center text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <th className="p-1 text-left pl-2">รายการ</th>
                      <th className="p-1">ปี 2568</th>
                      <th className="p-1">ปี 2569</th>
                      <th className="p-1">แนวโน้ม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {elecYoy.map((row, idx) => {
                      const diff = row.v1 ? ((row.v2 - row.v1) / row.v1) * 100 : 0;
                      const isDown = diff < 0;
                      return (
                        <tr key={idx}>
                          <td className="p-1 text-left pl-2 font-medium">{row.name}</td>
                          <td className="p-1 font-bold">
                            <input
                              type="number"
                              value={row.v1 || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setElecYoy((prev) => prev.map((item, i) => (i === idx ? { ...item, v1: val } : item)));
                              }}
                              className="w-full text-center bg-transparent focus:outline-none font-bold"
                            />
                          </td>
                          <td className="p-1 font-bold">
                            <input
                              type="number"
                              value={row.v2 || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setElecYoy((prev) => prev.map((item, i) => (i === idx ? { ...item, v2: val } : item)));
                              }}
                              className="w-full text-center bg-transparent focus:outline-none font-bold"
                            />
                          </td>
                          <td className={`p-1 font-extrabold whitespace-nowrap ${isDown ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {Math.abs(diff).toFixed(1)}% {isDown ? '▼' : '▲'}
                          </td>
                        </tr>
                      );
                    })}
                    {(() => {
                      const totalDiff = elecYoyV1Total ? ((elecYoyV2Total - elecYoyV1Total) / elecYoyV1Total) * 100 : 0;
                      const totalIsDown = totalDiff < 0;
                      return (
                        <tr className="bg-sky-50 font-black text-slate-900 border-t border-sky-200">
                          <td className="p-1 text-left pl-2">รวมไฟฟ้าทั้งหมด</td>
                          <td className="p-1">{fCom(elecYoyV1Total)}</td>
                          <td className="p-1">{fCom(elecYoyV2Total)}</td>
                          <td className={`p-1 font-black whitespace-nowrap ${totalIsDown ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {Math.abs(totalDiff).toFixed(1)}% {totalIsDown ? '▼' : '▲'}
                          </td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {/* SOLAR YOY TABLE */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 px-3 py-1 font-bold text-slate-800 text-[10.5px] border-b border-slate-200">
                  เปรียบเทียบผลิตโซลาร์ (SOLAR YOY)
                </div>
                <table className="w-full text-center text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <th className="p-1 text-left pl-2">ตำแหน่ง</th>
                      <th className="p-1">ปี 2568</th>
                      <th className="p-1">ปี 2569</th>
                      <th className="p-1">แนวโน้ม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {solarYoy.map((row, idx) => {
                      const diff = row.v1 ? ((row.v2 - row.v1) / row.v1) * 100 : 0;
                      const isUp = diff > 0;
                      return (
                        <tr key={idx}>
                          <td className="p-1 text-left pl-2 font-medium">{row.name}</td>
                          <td className="p-1 font-bold">
                            <input
                              type="number"
                              value={row.v1 || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setSolarYoy((prev) => prev.map((item, i) => (i === idx ? { ...item, v1: val } : item)));
                              }}
                              className="w-full text-center bg-transparent focus:outline-none font-bold"
                            />
                          </td>
                          <td className="p-1 font-bold">
                            <input
                              type="number"
                              value={row.v2 || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setSolarYoy((prev) => prev.map((item, i) => (i === idx ? { ...item, v2: val } : item)));
                              }}
                              className="w-full text-center bg-transparent focus:outline-none font-bold"
                            />
                          </td>
                          <td className={`p-1 font-extrabold whitespace-nowrap ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {Math.abs(diff).toFixed(1)}% {isUp ? '▲' : '▼'}
                          </td>
                        </tr>
                      );
                    })}
                    {(() => {
                      const totalDiff = solarYoyV1Total ? ((solarYoyV2Total - solarYoyV1Total) / solarYoyV1Total) * 100 : 0;
                      const totalIsUp = totalDiff > 0;
                      return (
                        <tr className="bg-amber-50 font-black text-slate-900 border-t border-amber-200">
                          <td className="p-1 text-left pl-2">รวมโซลาร์ทั้งหมด</td>
                          <td className="p-1">{fCom(solarYoyV1Total)}</td>
                          <td className="p-1">{fCom(solarYoyV2Total)}</td>
                          <td className={`p-1 font-black whitespace-nowrap ${totalIsUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {Math.abs(totalDiff).toFixed(1)}% {totalIsUp ? '▲' : '▼'}
                          </td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SECTION 2: FUEL OIL & EFFICIENCY */}
          <div>
            <div className="font-extrabold text-sky-900 text-xs border-b-2 border-sky-600 pb-1 mb-2 uppercase flex items-center gap-1.5">

              <span>หมวดที่ 2 : น้ำมันเตา & ประสิทธิภาพพลังงาน</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-200">
                <span className="text-[10px] font-bold text-sky-900 block">ปริมาณน้ำมันเตาที่ใช้</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <input
                    type="number"
                    value={fuelLiter}
                    onChange={(e) => setFuelLiter(Number(e.target.value))}
                    className="text-base font-black text-sky-900 bg-transparent focus:outline-none w-28"
                  />
                  <span className="text-xs font-bold text-sky-700">ลิตร (Liters)</span>
                </div>
              </div>

              <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-200">
                <span className="text-[10px] font-bold text-sky-900 block">ค่าใช้จ่ายน้ำมันเตา</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <input
                    type="number"
                    value={fuelCost}
                    onChange={(e) => setFuelCost(Number(e.target.value))}
                    className="text-base font-black text-sky-900 bg-transparent focus:outline-none w-28"
                  />
                  <span className="text-xs font-bold text-sky-700">บาท (THB)</span>
                </div>
              </div>
            </div>

            {/* EFFICIENCY BOX */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 mt-2 space-y-2">
              <span className="font-bold text-[10.5px] text-sky-900 block border-b border-slate-100 pb-1">
                ประสิทธิภาพพลังงาน
              </span>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold text-sky-900">
                <div className="bg-sky-50 p-2 rounded-lg border border-sky-200">
                  <input
                    type="text"
                    value={effGasOilRatio}
                    onChange={(e) => setEffGasOilRatio(e.target.value)}
                    className="w-full text-center bg-transparent focus:outline-none"
                  />
                </div>
                <div className="bg-sky-50 p-2 rounded-lg border border-sky-200">
                  <input
                    type="text"
                    value={effGasDaily}
                    onChange={(e) => setEffGasDaily(e.target.value)}
                    className="w-full text-center bg-transparent focus:outline-none"
                  />
                </div>
                <div className="bg-sky-50 p-2 rounded-lg border border-sky-200">
                  <input
                    type="text"
                    value={effLTons}
                    onChange={(e) => setEffLTons(e.target.value)}
                    className="w-full text-center bg-transparent focus:outline-none"
                  />
                </div>
                <div className="bg-sky-50 p-2 rounded-lg border border-sky-200">
                  <input
                    type="text"
                    value={effMs3LTons}
                    onChange={(e) => setEffMs3LTons(e.target.value)}
                    className="w-full text-center bg-transparent focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: SLUDGE & COSTS */}
          <div>
            <div className="font-extrabold text-sky-900 text-xs border-b-2 border-sky-600 pb-1 mb-2 uppercase flex items-center justify-between">
              <div className="flex items-center gap-1.5">

                <span>หมวดที่ 3 : การจัดการตะกอน & รวมค่าใช้จ่ายทั้งหมด</span>
              </div>
              {!isExporting && (
                <button
                  onClick={() =>
                    setOpsRows((prev) => [
                      ...prev,
                      { dateRange: '1–4 พ.ค.', title: 'รายการกำจัดตะกอนใหม่', trips: 0, tons: 0, cost: 0 },
                    ])
                  }
                  className="text-[10px] bg-sky-700 text-white px-2 py-0.5 rounded font-bold hover:bg-sky-600 cursor-pointer"
                >
                  + เพิ่มรายการตะกอน
                </button>
              )}
            </div>

            <table className="w-full text-center text-[10px] border-collapse bg-white rounded-xl border border-slate-200 overflow-hidden">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <th className="p-1.5 text-left pl-3">วันที่</th>
                  <th className="p-1.5 text-left">รายการ</th>
                  <th className="p-1.5">รอบรถ (เที่ยว)</th>
                  <th className="p-1.5">ปริมาณ (ตัน)</th>
                  <th className={isExporting ? "p-1.5 text-right pr-3" : "p-1.5 text-right pr-1"}>ค่าใช้จ่าย (บาท)</th>
                  {!isExporting && <th className="p-1.5 w-8">จัดการ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {opsRows.map((r, idx) => (
                  <tr key={idx}>
                    <td className="p-1 text-left pl-3">
                      <input
                        type="text"
                        value={r.dateRange}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOpsRows((prev) => prev.map((item, i) => (i === idx ? { ...item, dateRange: val } : item)));
                        }}
                        className="w-full bg-transparent focus:outline-none font-medium"
                      />
                    </td>
                    <td className="p-1 text-left">
                      <input
                        type="text"
                        value={r.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOpsRows((prev) => prev.map((item, i) => (i === idx ? { ...item, title: val } : item)));
                        }}
                        className="w-full bg-transparent focus:outline-none font-medium"
                      />
                    </td>
                    <td className="p-1 font-bold">
                      <input
                        type="number"
                        value={r.trips || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setOpsRows((prev) => prev.map((item, i) => (i === idx ? { ...item, trips: val } : item)));
                        }}
                        className="w-full text-center bg-transparent focus:outline-none font-bold"
                      />
                    </td>
                    <td className="p-1 font-bold">
                      <input
                        type="number"
                        value={r.tons || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setOpsRows((prev) => prev.map((item, i) => (i === idx ? { ...item, tons: val } : item)));
                        }}
                        className="w-full text-center bg-transparent focus:outline-none font-bold"
                      />
                    </td>
                    <td className={isExporting ? "p-1 text-right pr-3 font-bold" : "p-1 text-right pr-1 font-bold"}>
                      <input
                        type="number"
                        value={r.cost || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setOpsRows((prev) => prev.map((item, i) => (i === idx ? { ...item, cost: val } : item)));
                        }}
                        className="w-full text-right bg-transparent focus:outline-none font-extrabold"
                      />
                    </td>
                    {!isExporting && (
                      <td className="p-0.5 text-center">
                        <button
                          onClick={() => setOpsRows((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="ลบรายการนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-sky-50 font-black text-slate-900 border-t border-sky-200">
                  <td colSpan={2} className="p-1.5 text-right pr-3">
                    รวมตะกอน
                  </td>
                  <td className="p-1.5">{totalSludgeTrips} เที่ยว</td>
                  <td className="p-1.5">{fCom(totalSludgeTons)} ตัน</td>
                  <td className={isExporting ? "p-1.5 text-right pr-3 text-sky-900" : "p-1.5 text-right pr-1 text-sky-900"}>
                    {fCom(totalSludgeCost)} บาท
                  </td>
                  {!isExporting && <td></td>}
                </tr>
              </tfoot>
            </table>

            {/* GRAND COST SUMMARY BOX */}
            <div className="bg-slate-900 text-white rounded-xl overflow-hidden mt-3 p-3.5 space-y-2 shadow-md">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="font-extrabold text-xs">รวมค่าใช้จ่ายทั้งหมด (น้ำมันเตา + ตะกอน)</span>
                <span className="text-base font-black text-emerald-400">{fCom(grandTotalCost)} บาท</span>
              </div>
              <div className="space-y-1 text-[10.5px]">
                <div className="flex justify-between text-slate-300">
                  <span>ค่าน้ำมันเตา</span>
                  <span className="font-bold text-white">{fCom(fuelCost)} บาท</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>ค่ากำจัดตะกอนรวม</span>
                  <span className="font-bold text-white">{fCom(totalSludgeCost)} บาท</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-2 flex justify-between text-[9px] text-slate-500 font-semibold">
          <span>จัดทำโดย: UTL Environmental</span>
          <span>CONFIDENTIAL REPORT · หน้า 1 / 2</span>
        </div>
      </div>

      {/* A4 REPORT DOCUMENT CONTAINER PAGE 2 */}
      <div
        id="report-page-2"
        className="w-[210mm] min-h-[297mm] bg-white shadow-2xl rounded-md overflow-hidden text-slate-800 font-sans flex flex-col justify-between border border-slate-300 relative text-[11px] mt-6"
      >
        {/* HEADER BANNER */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-900 to-sky-700 text-white p-5 flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-xl shrink-0">
              📈
            </div>
            <div>
              <h1 className="text-base font-extrabold leading-tight">กราฟและแนวโน้มการใช้พลังงาน</h1>
              <p className="text-[10.5px] text-sky-200 mt-0.5">Energy Trend Charts · UTL Environmental</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-sky-200">ประจำรอบ</p>
            <span className="inline-flex items-center gap-1.5 bg-white/20 border border-white/30 px-3 py-1 rounded-full text-xs font-bold text-white mt-1">
              📅 1–{MONTH_NAMES_TH[selectedMonth - 1]} {selectedYear}
            </span>
            <p className="text-[9px] text-sky-300 mt-1">หน้า 2 / 2</p>
          </div>
        </div>

        {/* KPI STRIP */}
        <div className="grid grid-cols-4 bg-slate-950 text-white text-center border-b border-slate-800">
          <div className="py-2.5 px-2 border-r border-white/10">
            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">ไฟฟ้ารวม</p>
            <p className="text-base font-black text-emerald-400 mt-0.5">{fCom0(grandTotalElec)} <span className="text-xs font-bold">kWh</span></p>
          </div>
          <div className="py-2.5 px-2 border-r border-white/10">
            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">โซลาร์รวม</p>
            <p className="text-base font-black text-emerald-400 mt-0.5">{fCom0(grandTotalSolar)} <span className="text-xs font-bold">kWh</span></p>
          </div>
          <div className="py-2.5 px-2 border-r border-white/10">
            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">น้ำมันเตา</p>
            <p className="text-base font-black text-emerald-400 mt-0.5">{fCom0(fuelLiter)} <span className="text-xs font-bold">L</span></p>
          </div>
          <div className="py-2.5 px-2">
            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">การกำจัดตะกอน</p>
            <p className="text-base font-black text-emerald-400 mt-0.5">{fCom(totalSludgeTons)} <span className="text-xs font-bold">ตัน</span></p>
          </div>
        </div>

        {/* CHARTS GRID PAGE 2 */}
        <div className="p-5 space-y-4 flex-1">
          <div className="grid grid-cols-3 gap-4">
            {/* Chart 1: Electricity */}
            <div className="bg-white p-3 rounded-xl border border-sky-200 shadow-xs">
              <div className="font-extrabold text-[10.5px] text-sky-900 border-b border-sky-100 pb-1 mb-2 uppercase flex items-center justify-between">
                <span>การใช้พลังงานไฟฟ้า</span>
                <span className="text-[9px] text-sky-600 font-bold">(kWh)</span>
              </div>
              <div className="h-36 w-full text-[9px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyRows} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 8 }} />
                    <YAxis tick={{ fontSize: 8 }} />
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                    <Bar dataKey="m1" name="มิเตอร์ 1" fill="#0284c7" stackId="a" />
                    <Bar dataKey="m2" name="มิเตอร์ 2" fill="#0369a1" stackId="a" />
                    <Bar dataKey="m3" name="มิเตอร์ 3" fill="#075985" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Solar Generation */}
            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-xs">
              <div className="font-extrabold text-[10.5px] text-amber-900 border-b border-amber-100 pb-1 mb-2 uppercase flex items-center justify-between">
                <span>การผลิตโซลาร์เซลล์</span>
                <span className="text-[9px] text-amber-600 font-bold">(kWh)</span>
              </div>
              <div className="h-36 w-full text-[9px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyRows} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fef3c7" />
                    <XAxis dataKey="date" tick={{ fontSize: 8 }} />
                    <YAxis tick={{ fontSize: 8 }} />
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="solar1" name="โซลาร์ 1 MS2" stroke="#d97706" fill="#fef3c7" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="solar2" name="โซลาร์ 2 TF" stroke="#b45309" fill="#fde68a" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Total Power Comparison */}
            <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-xs">
              <div className="font-extrabold text-[10.5px] text-emerald-900 border-b border-emerald-100 pb-1 mb-2 uppercase flex items-center justify-between">
                <span>รวมไฟฟ้า & โซลาร์</span>
                <span className="text-[9px] text-emerald-600 font-bold">(kWh)</span>
              </div>
              <div className="h-36 w-full text-[9px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyRows.map((r) => ({
                      date: r.date,
                      elecTotal: (r.m1 || 0) + (r.m2 || 0) + (r.m3 || 0),
                      solarTotal: (r.solar1 || 0) + (r.solar2 || 0),
                    }))}
                    margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 8 }} />
                    <YAxis tick={{ fontSize: 8 }} />
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="elecTotal" name="รวมไฟฟ้า PEA" stroke="#0284c7" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="solarTotal" name="รวมโซลาร์" stroke="#d97706" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-1">
            {/* Chart 4: Fuel Oil Usage */}
            <div className="bg-white p-3 rounded-xl border border-sky-200 shadow-xs">
              <div className="font-extrabold text-[10.5px] text-sky-900 border-b border-sky-100 pb-1 mb-2 uppercase flex items-center justify-between">
                <span>การใช้น้ำมันเตา</span>
                <span className="text-[9px] text-sky-600 font-bold">(ลิตร)</span>
              </div>
              <div className="h-36 w-full text-[9px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyRows} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 8 }} />
                    <YAxis tick={{ fontSize: 8 }} />
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                    <Bar dataKey="fuel" name="น้ำมันเตา (ลิตร)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 5: Sludge Removal */}
            <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-xs">
              <div className="font-extrabold text-[10.5px] text-emerald-900 border-b border-emerald-100 pb-1 mb-2 uppercase flex items-center justify-between">
                <span>การกำจัดตะกอน</span>
                <span className="text-[9px] text-emerald-600 font-bold">(ตัน)</span>
              </div>
              <div className="h-36 w-full text-[9px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyRows} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 8 }} />
                    <YAxis tick={{ fontSize: 8 }} />
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                    <Bar dataKey="sludge" name="ปริมาณตะกอน (ตัน)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 6: Cost Breakdown */}
            <div className="bg-white p-3 rounded-xl border border-slate-300 shadow-xs">
              <div className="font-extrabold text-[10.5px] text-slate-900 border-b border-slate-100 pb-1 mb-2 uppercase flex items-center justify-between">
                <span>คชจ. น้ำมัน & ตะกอน</span>
                <span className="text-[9px] text-slate-500 font-bold">(บาท)</span>
              </div>
              <div className="h-36 w-full text-[9px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'น้ำมันเตา', cost: fuelCost },
                      { name: 'ค่ากำจัดตะกอน', cost: totalSludgeCost },
                    ]}
                    margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 8 }} />
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                    <Bar dataKey="cost" name="ค่าใช้จ่าย (บาท)" fill="#0f172a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-2 flex justify-between text-[9px] text-slate-500 font-semibold">
          <span>จัดทำโดย: UTL Environmental</span>
          <span>CONFIDENTIAL REPORT · หน้า 2 / 2</span>
        </div>
      </div>
    </div>
  );
};
