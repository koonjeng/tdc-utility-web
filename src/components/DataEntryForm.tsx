'use client';

import React, { useState, useEffect } from 'react';
import {
  Save,
  Send,
  CheckCircle2,
  AlertTriangle,
  Lock,
  User,
  BadgeCheck,
  Calendar,
  Factory,
  Zap,
  Flame,
  XCircle,
  Droplets,
  Activity,
  Layers,
  Check,
  Plus,
  Truck,
  FlaskConical,
} from 'lucide-react';
import { FullMonthlyReportData, ReportData, ReportStatus, UserRole } from '@/lib/types';
import { calculateMetrics, MONTH_NAMES_TH, MONTH_SHORT_TH } from '@/lib/calculations';
import { saveCategorySubmission } from '@/lib/supabase';

interface DataEntryFormProps {
  selectedYear: number;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  reportsData: FullMonthlyReportData[];
  currentUser: { email: string; role: UserRole } | null;
  onSaveDraft: (month: number, data: Partial<ReportData>) => void;
  onSubmitApproval: (month: number, data: Partial<ReportData>) => void;
  onApproveReport: (month: number) => void;
  onRejectReport: (month: number, reason: string) => void;
  initialData?: Partial<ReportData>;
  initialCategory?: string;
  isReadOnlyMode?: boolean;
  hideCategoryTabs?: boolean;
  onCloseModal?: () => void;
  onSaveEditItem?: (updatedData: Partial<ReportData>) => void;
}

export const DataEntryForm: React.FC<DataEntryFormProps> = ({
  selectedYear,
  selectedMonth,
  setSelectedMonth,
  reportsData,
  currentUser,
  onSaveDraft,
  onSubmitApproval,
  onApproveReport,
  onRejectReport,
  initialData,
  initialCategory,
  isReadOnlyMode,
  hideCategoryTabs,
  onCloseModal,
  onSaveEditItem,
}) => {
  const currentReportObj = reportsData.find((r) => r.report.month === selectedMonth);

  const status: ReportStatus = currentReportObj?.report.status || 'empty';
  const rejectReason = currentReportObj?.report.reject_reason || '';

  // Active Category state: 'cat1' | 'cat2' | 'cat3' | 'cat4' | 'cat5'
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory || 'cat1');

  // Local state for form fields
  const [formData, setFormData] = useState<ReportData>({
    report_id: `report-${selectedYear}-${selectedMonth}`,
    reporter_name: '',
    reporter_id: '',
    report_date: new Date().toISOString().split('T')[0],

    // Legacy fields
    production_cassava: 0,
    production_modified: 0,
    hours_cassava: 0,
    hours_modified: 0,
    electricity_kwh: 0,
    electricity_baht: 0,
    renewable_biogas_m3: 0,
    renewable_solar_kwh: 0,
    fuel_oil_a_liter: 0,
    fuel_oil_a_baht: 0,

    // หมวดที่ 1: ตะกอน
    sludge_datetime: '',
    sludge_removal_desc: '',
    sludge_tons: 0,
    sludge_trips: 0,
    sludge_disposal_price: 0,
    sludge_trip_price: 0,
    sludge_total_baht: 0,

    sludge_use_vacuum_truck: false,
    sludge_vac_datetime: '',
    sludge_vac_removal_desc: '',
    sludge_vac_tons: 0,
    sludge_vac_trips: 0,
    sludge_vac_disposal_price: 0,
    sludge_vac_trip_price: 0,
    sludge_vac_total_baht: 0,
    sludge_grand_total_baht: 0,

    // หมวดที่ 2: การผลิต
    production_ms1: 0,
    production_ms2: 0,
    production_ms3: 0,
    production_total_ms: 0,

    // หมวดที่ 3: เชื้อเพลิง
    gas_ms1_m3: 0,
    gas_ms2_m3: 0,
    gas_ms3_m3: 0,
    gas_total_m3: 0,

    // หมวดที่ 4: ไฟฟ้า
    elec_ms3_ms1_tf_on_peak: 0,
    elec_ms3_ms1_tf_off_peak: 0,
    elec_meter1_ms1_ms3_tf: 0,
    elec_ms2_mix_on_peak: 0,
    elec_ms2_mix_off_peak: 0,
    elec_meter3_ms2_mix: 0,
    elec_utl_on_peak: 0,
    elec_utl_off_peak: 0,
    elec_meter2_utl: 0,
    solar_meter1_ms2: 0,
    solar_meter2_tf: 0,
    elec_total_pea_kwh: 0,
    elec_total_solar_kwh: 0,
    elec_grand_total_kwh: 0,

    // หมวดที่ 5: WWT & Biogas
    wwt_cod_native: 0,
    wwt_codt_mix1: 0,
    wwt_vfa_mix1: 0,
    wwt_ph_mix2: 0,
    wwt_cod_loading: 0,
    wwt_cod_eff_as: 0,

    biogas_flow_feed_mix2: 0,
    biogas_generate: 0,
    biogas_flare: 0,
    biogas_boiler_consumption: 0,
    biogas_pct_ch4: 0,
    biogas_pct_h2s: 0,
    biogas_removal: 0,
    biogas_sv60_eff: 0,
  });

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectInputReason, setRejectInputReason] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Sync form data when month or reportsData changes
  useEffect(() => {
    let defaultReporterName = '';
    if (currentUser?.email) {
      try {
        const savedName = localStorage.getItem(`tdc_user_display_name_${currentUser.email}`);
        if (savedName) defaultReporterName = savedName;
        else defaultReporterName = currentUser.email.split('@')[0];
      } catch { }
    }

    if (currentReportObj?.data) {
      setFormData({
        ...currentReportObj.data,
        reporter_name: currentReportObj.data.reporter_name || defaultReporterName,
        report_date: currentReportObj.data.report_date || new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        report_id: `report-${selectedYear}-${selectedMonth}`,
        reporter_name: defaultReporterName,
        reporter_id: '',
        report_date: new Date().toISOString().split('T')[0],
        production_cassava: 0,
        production_modified: 0,
        hours_cassava: 0,
        hours_modified: 0,
        electricity_kwh: 0,
        electricity_baht: 0,
        renewable_biogas_m3: 0,
        renewable_solar_kwh: 0,
        fuel_oil_a_liter: 0,
        fuel_oil_a_baht: 0,

        sludge_datetime: '',
        sludge_removal_desc: '',
        sludge_tons: 0,
        sludge_trips: 0,
        sludge_disposal_price: 0,
        sludge_trip_price: 0,
        sludge_total_baht: 0,

        sludge_use_vacuum_truck: false,
        sludge_vac_datetime: '',
        sludge_vac_removal_desc: '',
        sludge_vac_tons: 0,
        sludge_vac_trips: 0,
        sludge_vac_disposal_price: 0,
        sludge_vac_trip_price: 0,
        sludge_vac_total_baht: 0,
        sludge_grand_total_baht: 0,

        production_ms1: 0,
        production_ms2: 0,
        production_ms3: 0,
        production_total_ms: 0,

        gas_ms1_m3: 0,
        gas_ms2_m3: 0,
        gas_ms3_m3: 0,
        gas_total_m3: 0,

        elec_meter1_ms1_ms3_tf: 0,
        elec_meter2_utl: 0,
        elec_meter3_ms2_mix: 0,
        solar_meter1_ms2: 0,
        solar_meter2_tf: 0,
        elec_total_pea_kwh: 0,
        elec_total_solar_kwh: 0,
        elec_grand_total_kwh: 0,

        wwt_cod_native: 0,
        wwt_codt_mix1: 0,
        wwt_vfa_mix1: 0,
        wwt_ph_mix2: 0,
        wwt_cod_loading: 0,
        wwt_cod_eff_as: 0,

        biogas_flow_feed_mix2: 0,
        biogas_generate: 0,
        biogas_flare: 0,
        biogas_boiler_consumption: 0,
        biogas_pct_ch4: 0,
        biogas_pct_h2s: 0,
        biogas_removal: 0,
        biogas_sv60_eff: 0,

        biogas_flow: 0,
        biogas_temp: 0,
        biogas_pressure: 0,
        biogas_air_dryer_drain: '',
        biogas_motor_current: 0,

        chem_lime_received: 0,
        chem_lime_usage: 0,
        chem_lime_available: 0,
        chem_polymer_received: 0,
        chem_polymer_usage: 0,
        chem_polymer_available: 0,
        chem_odor_received: 0,
        chem_odor_usage: 0,
        chem_odor_available: 0,
        chem_fog_received: 0,
        chem_fog_usage: 0,
        chem_fog_available: 0,
        chem_cod_tube_received: 0,
        chem_cod_tube_usage: 0,
        chem_cod_tube_available: 0,
      });
    }
  }, [selectedMonth, currentReportObj, selectedYear, currentUser]);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  // Form is locked if explicitly set in read-only mode
  const isFormLocked = Boolean(isReadOnlyMode);
  const isHideCategoryTabs = Boolean(hideCategoryTabs || isReadOnlyMode || onSaveEditItem);

  // Compute metrics in real-time
  const computed = calculateMetrics(formData);

  const triggerNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleInputChange = (field: keyof ReportData, val: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const isElevatedUser = Boolean(
    currentUser && (currentUser.role === 'admin' || currentUser.role === 'approver')
  );

  const getCategoryFields = (catKey: string): (keyof ReportData)[] => {
    if (catKey === 'cat1') {
      return [
        'sludge_removal_desc', 'sludge_tons', 'sludge_trips', 'sludge_disposal_price', 'sludge_trip_price',
        'sludge_total_baht', 'sludge_use_vacuum_truck', 'sludge_vac_removal_desc', 'sludge_vac_tons',
        'sludge_vac_trips', 'sludge_vac_disposal_price', 'sludge_vac_trip_price', 'sludge_vac_total_baht', 'sludge_grand_total_baht'
      ];
    } else if (catKey === 'cat2') {
      return ['production_ms1', 'production_ms2', 'production_ms3', 'production_total_ms'];
    } else if (catKey === 'cat3') {
      return ['fuel_oil_a_ms1_liter', 'fuel_oil_a_ms2_liter', 'fuel_oil_a_ms3_liter', 'fuel_oil_a_total_liter', 'fuel_oil_a_baht', 'gas_ms1_m3', 'gas_ms2_m3', 'gas_ms3_m3', 'gas_total_m3'];
    } else if (catKey === 'cat4') {
      return [
        'elec_ms3_ms1_tf_on_peak', 'elec_ms3_ms1_tf_off_peak', 'elec_meter1_ms1_ms3_tf',
        'elec_ms2_mix_on_peak', 'elec_ms2_mix_off_peak', 'elec_meter3_ms2_mix',
        'elec_utl_on_peak', 'elec_utl_off_peak', 'elec_meter2_utl',
        'solar_meter1_ms2', 'solar_meter2_tf', 'elec_total_pea_kwh', 'elec_total_solar_kwh', 'elec_grand_total_kwh', 'electricity_baht'
      ];
    } else if (catKey === 'cat5') {
      return ['wwt_cod_native', 'wwt_codt_mix1', 'wwt_vfa_mix1', 'wwt_ph_mix2', 'wwt_cod_loading', 'wwt_cod_eff_as', 'biogas_flow_feed_mix2', 'biogas_generate', 'biogas_flare', 'biogas_boiler_consumption', 'biogas_pct_ch4', 'biogas_pct_h2s', 'biogas_removal', 'biogas_sv60_eff', 'biogas_flow', 'biogas_temp', 'biogas_pressure', 'biogas_air_dryer_drain', 'biogas_motor_current'];
    } else if (catKey === 'cat6') {
      return [
        'chem_lime_received', 'chem_lime_usage', 'chem_lime_available',
        'chem_polymer_received', 'chem_polymer_usage', 'chem_polymer_available',
        'chem_odor_received', 'chem_odor_usage', 'chem_odor_available',
        'chem_fog_received', 'chem_fog_usage', 'chem_fog_available',
        'chem_cod_tube_received', 'chem_cod_tube_usage', 'chem_cod_tube_available',
      ];
    }
    return [];
  };

  const handleSaveCategory = (catKey: string, categoryName: string) => {
    const catFields = getCategoryFields(catKey);

    const catPatch: Partial<ReportData> = {
      reporter_name: formData.reporter_name,
      reporter_id: formData.reporter_id,
      report_date: formData.report_date || new Date().toISOString().split('T')[0],
      submitted_category: categoryName,
    };
    catFields.forEach((field) => {
      (catPatch as any)[field] = formData[field];
    });

    if (!formData.reporter_name) {
      alert('กรุณากรอก ชื่อ-นามสกุล ผู้ลงข้อมูลก่อนส่งหมวดนี้');
      return;
    }

    saveCategorySubmission({
      year: selectedYear,
      month: selectedMonth,
      report_date: formData.report_date || new Date().toISOString().split('T')[0],
      category_key: catKey as any,
      category_name: categoryName,
      status: isElevatedUser ? 'approved' : 'pending',
      reporter_name: formData.reporter_name,
      reporter_id: formData.reporter_id,
      data: catPatch,
    });

    onSubmitApproval(selectedMonth, catPatch);
    triggerNotify(`ส่งคำขออนุมัติ ${categoryName} เรียบร้อยแล้ว!`);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleSubmitClick = () => {
    if (!formData.reporter_name) {
      alert('กรุณากรอก ชื่อ-นามสกุล ผู้ลงข้อมูลก่อนบันทึก/ส่งขออนุมัติ');
      return;
    }

    const filledCategories: Array<{ key: 'cat1' | 'cat2' | 'cat3' | 'cat4' | 'cat5' | 'cat6'; name: string }> = [];

    if (formData.sludge_tons || formData.sludge_removal_desc || formData.sludge_trips || formData.sludge_vac_tons) {
      filledCategories.push({ key: 'cat1', name: 'หมวดที่ 1: ตะกอน (Sludge)' });
    }
    if (formData.production_ms1 || formData.production_ms2 || formData.production_ms3) {
      filledCategories.push({ key: 'cat2', name: 'หมวดที่ 2: การผลิต (Production)' });
    }
    if (
      formData.fuel_oil_a_ms1_liter ||
      formData.fuel_oil_a_ms2_liter ||
      formData.fuel_oil_a_ms3_liter ||
      formData.gas_ms1_m3 ||
      formData.gas_ms2_m3 ||
      formData.gas_ms3_m3
    ) {
      filledCategories.push({ key: 'cat3', name: 'หมวดที่ 3: เชื้อเพลิง (Fuel & Gas)' });
    }
    if (
      formData.elec_meter1_ms1_ms3_tf ||
      formData.elec_meter2_utl ||
      formData.elec_meter3_ms2_mix ||
      formData.solar_meter1_ms2 ||
      formData.solar_meter2_tf
    ) {
      filledCategories.push({ key: 'cat4', name: 'หมวดที่ 4: ไฟฟ้า (Electricity & Solar)' });
    }
    if (formData.wwt_cod_native || formData.wwt_codt_mix1 || formData.biogas_flow_feed_mix2 || formData.biogas_flow) {
      filledCategories.push({ key: 'cat5', name: 'หมวดที่ 5: WWT & Biogas' });
    }
    if (
      formData.chem_lime_received || formData.chem_lime_usage || formData.chem_lime_available ||
      formData.chem_polymer_received || formData.chem_polymer_usage || formData.chem_polymer_available ||
      formData.chem_odor_received || formData.chem_odor_usage || formData.chem_odor_available ||
      formData.chem_fog_received || formData.chem_fog_usage || formData.chem_fog_available ||
      formData.chem_cod_tube_received || formData.chem_cod_tube_usage || formData.chem_cod_tube_available
    ) {
      filledCategories.push({ key: 'cat6', name: 'หมวดที่ 6: สารเคมี (Chemical)' });
    }

    if (filledCategories.length === 0) {
      alert('กรุณากรอกข้อมูลอย่างน้อย 1 หมวดหมูก่อนกดบันทึก/ส่งขออนุมัติ');
      return;
    }

    filledCategories.forEach((cat) => {
      const catFields = getCategoryFields(cat.key);
      const catPatch: Partial<ReportData> = {
        reporter_name: formData.reporter_name,
        reporter_id: formData.reporter_id,
        report_date: formData.report_date || new Date().toISOString().split('T')[0],
        submitted_category: cat.name,
      };
      catFields.forEach((f) => {
        (catPatch as any)[f] = (formData as any)[f];
      });

      saveCategorySubmission({
        year: selectedYear,
        month: selectedMonth,
        report_date: formData.report_date || new Date().toISOString().split('T')[0],
        category_key: cat.key,
        category_name: cat.name,
        status: isElevatedUser ? 'approved' : 'pending',
        reporter_name: formData.reporter_name,
        reporter_id: formData.reporter_id,
        data: catPatch,
      });
    });

    const catNames = filledCategories.map((c) => c.name).join(', ');
    if (isElevatedUser) {
      triggerNotify(`บันทึกข้อมูลเรียบร้อยแล้ว (${catNames})`);
    } else {
      triggerNotify(`ส่งคำขออนุมัติแยกเป็น ${filledCategories.length} หมวดหมู่เรียบร้อยแล้ว! (${catNames})`);
    }

    // Reset Form Fields back to empty/blank for fresh entry!
    setFormData({
      report_id: `report-${selectedYear}-${selectedMonth}`,
      reporter_name: currentUser?.email ? currentUser.email.split('@')[0] : '',
      reporter_id: '',
      report_date: new Date().toISOString().split('T')[0],
      production_cassava: 0,
      production_modified: 0,
      hours_cassava: 0,
      hours_modified: 0,
      electricity_kwh: 0,
      electricity_baht: 0,
      renewable_biogas_m3: 0,
      renewable_solar_kwh: 0,
      fuel_oil_a_liter: 0,
      fuel_oil_a_baht: 0,

      sludge_datetime: '',
      sludge_removal_desc: '',
      sludge_tons: 0,
      sludge_trips: 0,
      sludge_disposal_price: 0,
      sludge_trip_price: 0,
      sludge_total_baht: 0,

      sludge_use_vacuum_truck: false,
      sludge_vac_datetime: '',
      sludge_vac_removal_desc: '',
      sludge_vac_tons: 0,
      sludge_vac_trips: 0,
      sludge_vac_disposal_price: 0,
      sludge_vac_trip_price: 0,
      sludge_vac_total_baht: 0,
      sludge_grand_total_baht: 0,

      production_ms1: 0,
      production_ms2: 0,
      production_ms3: 0,
      production_total_ms: 0,

      fuel_oil_a_ms1_liter: 0,
      fuel_oil_a_ms2_liter: 0,
      fuel_oil_a_ms3_liter: 0,
      fuel_oil_a_total_liter: 0,

      gas_ms1_m3: 0,
      gas_ms2_m3: 0,
      gas_ms3_m3: 0,
      gas_total_m3: 0,

      elec_ms3_ms1_tf_on_peak: 0,
      elec_ms3_ms1_tf_off_peak: 0,
      elec_meter1_ms1_ms3_tf: 0,
      elec_ms2_mix_on_peak: 0,
      elec_ms2_mix_off_peak: 0,
      elec_meter3_ms2_mix: 0,
      elec_utl_on_peak: 0,
      elec_utl_off_peak: 0,
      elec_meter2_utl: 0,
      solar_meter1_ms2: 0,
      solar_meter2_tf: 0,
      elec_total_pea_kwh: 0,
      elec_total_solar_kwh: 0,
      elec_grand_total_kwh: 0,

      wwt_cod_native: 0,
      wwt_codt_mix1: 0,
      wwt_vfa_mix1: 0,
      wwt_ph_mix2: 0,
      wwt_cod_loading: 0,
      wwt_cod_eff_as: 0,

      biogas_flow_feed_mix2: 0,
      biogas_generate: 0,
      biogas_flare: 0,
      biogas_boiler_consumption: 0,
      biogas_pct_ch4: 0,
      biogas_pct_h2s: 0,
      biogas_removal: 0,
      biogas_sv60_eff: 0,

      biogas_flow: 0,
      biogas_temp: 0,
      biogas_pressure: 0,
      biogas_air_dryer_drain: '',
      biogas_motor_current: 0,

      chem_lime_received: 0,
      chem_lime_usage: 0,
      chem_lime_available: 0,
      chem_polymer_received: 0,
      chem_polymer_usage: 0,
      chem_polymer_available: 0,
      chem_odor_received: 0,
      chem_odor_usage: 0,
      chem_odor_available: 0,
      chem_fog_received: 0,
      chem_fog_usage: 0,
      chem_fog_available: 0,
      chem_cod_tube_received: 0,
      chem_cod_tube_usage: 0,
      chem_cod_tube_available: 0,
    });
  };

  const handleApproveClick = () => {
    onApproveReport(selectedMonth);
    triggerNotify('อนุมัติรายงานประจำเดือนเรียบร้อยแล้ว!');
  };

  const handleConfirmReject = () => {
    if (!rejectInputReason.trim()) {
      alert('กรุณาระบุเหตุผลการตีกลับ');
      return;
    }
    onRejectReport(selectedMonth, rejectInputReason);
    setRejectModalOpen(false);
    setRejectInputReason('');
    triggerNotify('ตีกลับรายงานไปยังสถานะร่างเรียบร้อยแล้ว');
  };

  // Calculations for Category 1 Sludge Formulas
  const mainSludgeTotal =
    ((Number(formData.sludge_tons) || 0) * (Number(formData.sludge_disposal_price) || 0) +
      (Number(formData.sludge_trip_price) || 0)) *
    (Number(formData.sludge_trips) || 0);

  const vacSludgeTotal = formData.sludge_use_vacuum_truck
    ? ((Number(formData.sludge_vac_tons) || 0) * (Number(formData.sludge_vac_disposal_price) || 0) +
      (Number(formData.sludge_vac_trip_price) || 0)) *
    (Number(formData.sludge_vac_trips) || 0)
    : 0;

  const grandSludgeTotal = mainSludgeTotal + vacSludgeTotal;

  // Category 2 Production Total
  const prodTotalMS =
    (Number(formData.production_ms1) || 0) +
    (Number(formData.production_ms2) || 0) +
    (Number(formData.production_ms3) || 0);

  // Category 3 Fuel Oil Total
  const fuelOilTotalLiter =
    (Number(formData.fuel_oil_a_ms1_liter) || 0) +
    (Number(formData.fuel_oil_a_ms2_liter) || 0) +
    (Number(formData.fuel_oil_a_ms3_liter) || 0);

  // Category 3 Gas Total
  const gasTotalM3 =
    (Number(formData.gas_ms1_m3) || 0) +
    (Number(formData.gas_ms2_m3) || 0) +
    (Number(formData.gas_ms3_m3) || 0);

  // Category 4 Electricity Totals
  const elecPeaTotal =
    (Number(formData.elec_meter1_ms1_ms3_tf) || 0) +
    (Number(formData.elec_meter2_utl) || 0) +
    (Number(formData.elec_meter3_ms2_mix) || 0);

  const elecSolarTotal =
    (Number(formData.solar_meter1_ms2) || 0) + (Number(formData.solar_meter2_tf) || 0);

  const elecGrandTotal = elecPeaTotal + elecSolarTotal;

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-[calc(100vh-73px)] space-y-6 pb-28">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-4 md:right-8 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}



      {/* STATUS & REJECT REASON ALERT */}
      {rejectReason && status === 'draft' && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-xs">คำขอถูกตีกลับจากผู้อนุมัติ</h4>
            <p className="text-xs text-rose-700 mt-0.5">{rejectReason}</p>
          </div>
        </div>
      )}

      {/* REPORTER IDENTIFICATION CARD */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">ข้อมูลผู้บันทึกรายงาน</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto">
          <input
            type="text"
            disabled={isFormLocked}
            value={formData.reporter_name}
            onChange={(e) => handleInputChange('reporter_name', e.target.value)}
            placeholder="ชื่อ-นามสกุล ผู้บันทึก *"
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 font-medium text-slate-800 disabled:opacity-60 min-w-[200px]"
          />
          <div className="relative inline-flex items-center min-w-[130px]">
            <input
              type="date"
              disabled={isFormLocked}
              value={formData.report_date}
              onChange={(e) => handleInputChange('report_date', e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 font-medium disabled:opacity-60 cursor-pointer"
              style={{ color: 'transparent', caretColor: 'transparent' }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
              <span className="text-xs font-medium text-slate-800">
                {formData.report_date
                  ? (() => {
                    const parts = formData.report_date.split('-');
                    if (parts.length === 3) {
                      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
                    }
                    return formData.report_date;
                  })()
                  : 'dd/mm/yyyy'}
              </span>
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* 5 CATEGORY SELECTION HUB TABS */}
      {!isHideCategoryTabs && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1 pb-2">
            เลือกหมวดข้อมูลที่ต้องการกรอก (Select Category)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">

            <button
              onClick={() => setActiveCategory('cat1')}
              className={`px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${activeCategory === 'cat1'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                }`}
            >
              <Droplets className="w-4 h-4 text-amber-500" />
              <span>1. ตะกอน (Sludge)</span>
            </button>

            <button
              onClick={() => setActiveCategory('cat2')}
              className={`px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${activeCategory === 'cat2'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
                }`}
            >
              <Factory className="w-4 h-4 text-blue-500" />
              <span>2. การผลิต (Production)</span>
            </button>

            <button
              onClick={() => setActiveCategory('cat3')}
              className={`px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${activeCategory === 'cat3'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-orange-50 text-orange-900 border border-orange-200 hover:bg-orange-100'
                }`}
            >
              <Flame className="w-4 h-4 text-orange-500" />
              <span>3. เชื้อเพลิง (Fuel)</span>
            </button>

            <button
              onClick={() => setActiveCategory('cat4')}
              className={`px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${activeCategory === 'cat4'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100'
                }`}
            >
              <Zap className="w-4 h-4 text-sky-500" />
              <span>4. ไฟฟ้า & โซลาร์</span>
            </button>

            <button
              onClick={() => setActiveCategory('cat5')}
              className={`px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${activeCategory === 'cat5'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                }`}
            >
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>5. WWT & Biogas</span>
            </button>

            <button
              onClick={() => setActiveCategory('cat6')}
              className={`px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${activeCategory === 'cat6'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
                }`}
            >
              <FlaskConical className="w-4 h-4 text-purple-500" />
              <span>6. สารเคมี (Chemical)</span>
            </button>
          </div>
        </div>
      )}

      {/* CATEGORY 1: ตะกอน (SLUDGE) */}
      {activeCategory === 'cat1' && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm">
                1
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <span>หมวดที่ 1: ตะกอน (Sludge Removal)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  กรอกข้อมูลขนกำจัดตะกอนและรถดูดตะกอน คำนวณราคารวมอัตโนมัติ
                </p>
              </div>
            </div>
          </div>

          {/* MAIN SLUDGE REMOVAL FIELDS */}
          <div className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
            <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-600" />
              <span>ข้อมูลการขนกำจัดตะกอน (ทั่วไป)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sludge Removal (รายละเอียดการขนกำจัด)</label>
                <input
                  type="text"
                  disabled={isFormLocked}
                  value={formData.sludge_removal_desc || ''}
                  onChange={(e) => handleInputChange('sludge_removal_desc', e.target.value)}
                  placeholder="เช่น ขนกำจัดตะกอนระบบบำบัดน้ำเสีย ล็อตที่ 1"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ขนกำจัดตะกอน (ตัน)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.sludge_tons || ''}
                  onChange={(e) => handleInputChange('sludge_tons', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">จำนวนเที่ยว (เที่ยว)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.sludge_trips || ''}
                  onChange={(e) => handleInputChange('sludge_trips', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ราคากำจัด (บาท/ตัน)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.sludge_disposal_price || ''}
                  onChange={(e) => handleInputChange('sludge_disposal_price', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ราคาเที่ยว (บาท/เที่ยว)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.sludge_trip_price || ''}
                  onChange={(e) => handleInputChange('sludge_trip_price', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div className="sm:col-span-2 bg-amber-100/70 p-3 rounded-xl border border-amber-200 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">
                  รวม (บาท) = ((จำนวนขนตะกอน × ราคากำจัด) + ราคาเที่ยว) × จำนวนเที่ยว:
                </span>
                <span className="text-base font-black text-amber-900">
                  {mainSludgeTotal.toLocaleString('th-TH', { maximumFractionDigits: 2 })} <span className="text-xs font-semibold">บาท</span>
                </span>
              </div>
            </div>
          </div>

          {/* CHECKBOX: รถดูดตะกอน */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all">
              <input
                type="checkbox"
                disabled={isFormLocked}
                checked={Boolean(formData.sludge_use_vacuum_truck)}
                onChange={(e) => handleInputChange('sludge_use_vacuum_truck', e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-xs font-extrabold text-slate-900">
                ☑️ เพิ่มข้อมูล "รถดูดตะกอน" (เปิดช่องกรอกเพิ่มเติมสำหรับรถดูดตะกอน)
              </span>
            </label>
          </div>

          {/* VACUUM TRUCK EXPANDABLE FORM */}
          {formData.sludge_use_vacuum_truck && (
            <div className="space-y-3 bg-amber-100/40 p-4 rounded-xl border border-amber-300 animate-in fade-in zoom-in-95">
              <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-700" />
                <span>ข้อมูลรถดูดตะกอน (Vacuum Truck Removal)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sludge Removal (รายละเอียดรถดูด)</label>
                  <input
                    type="text"
                    disabled={isFormLocked}
                    value={formData.sludge_vac_removal_desc || ''}
                    onChange={(e) => handleInputChange('sludge_vac_removal_desc', e.target.value)}
                    placeholder="เช่น รถดูดตะกอนบ่อตกตะกอน Mix2"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ปริมาณดูดตะกอน (ตัน)</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.sludge_vac_tons || ''}
                    onChange={(e) => handleInputChange('sludge_vac_tons', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">จำนวนเที่ยว (เที่ยว)</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.sludge_vac_trips || ''}
                    onChange={(e) => handleInputChange('sludge_vac_trips', Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ราคากำจัด (บาท/ตัน)</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.sludge_vac_disposal_price || ''}
                    onChange={(e) => handleInputChange('sludge_vac_disposal_price', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ราคาเที่ยว (บาท/เที่ยว)</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.sludge_vac_trip_price || ''}
                    onChange={(e) => handleInputChange('sludge_vac_trip_price', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div className="sm:col-span-2 bg-amber-200/80 p-3 rounded-xl border border-amber-300 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950">
                    รวมรถดูดตะกอน (บาท):
                  </span>
                  <span className="text-base font-black text-amber-950">
                    {vacSludgeTotal.toLocaleString('th-TH', { maximumFractionDigits: 2 })} <span className="text-xs font-semibold">บาท</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* GRAND TOTAL SLUDGE SUMMARY */}
          <div className="bg-amber-900 text-white p-4 rounded-xl flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
              ยอดเงินรวมหมวดตะกอนทั้งหมด (Grand Total Sludge Cost):
            </span>
            <span className="text-xl font-black text-amber-300">
              {grandSludgeTotal.toLocaleString('th-TH', { maximumFractionDigits: 2 })}{' '}
              <span className="text-xs font-normal text-white">บาท</span>
            </span>
          </div>
        </div>
      )}

      {/* CATEGORY 2: การผลิต (PRODUCTION) */}
      {activeCategory === 'cat2' && (
        <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                2
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Factory className="w-5 h-5 text-blue-600" />
                  <span>หมวดที่ 2: การผลิต (Production)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  กรอกข้อมูลผลผลิต MS1, MS2, MS3 คำนวณรวม 3 MS อัตโนมัติ
                </p>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">MS1 (ตัน)</label>
              <input
                type="number"
                disabled={isFormLocked}
                value={formData.production_ms1 || ''}
                onChange={(e) => handleInputChange('production_ms1', Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">MS2 (ตัน)</label>
              <input
                type="number"
                disabled={isFormLocked}
                value={formData.production_ms2 || ''}
                onChange={(e) => handleInputChange('production_ms2', Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">MS3 (ตัน)</label>
              <input
                type="number"
                disabled={isFormLocked}
                value={formData.production_ms3 || ''}
                onChange={(e) => handleInputChange('production_ms3', Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="bg-blue-900 text-white p-4 rounded-xl flex items-center justify-between shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              รวมผลผลิต 3 MS ทั้งหมด (Total Production MS1 + MS2 + MS3):
            </span>
            <span className="text-xl font-black text-blue-300">
              {prodTotalMS.toLocaleString('th-TH', { maximumFractionDigits: 2 })}{' '}
              <span className="text-xs font-normal text-white">ตัน</span>
            </span>
          </div>
        </div>
      )}

      {/* CATEGORY 3: เชื้อเพลิง (FUEL & GAS) */}
      {activeCategory === 'cat3' && (
        <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-black text-sm">
                3
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-600" />
                  <span>หมวดที่ 3: เชื้อเพลิง (Fuel & Gas)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  ปริมาณแก๊สที่ใช้ MS1, MS2, MS3 และ น้ำมันเตา A
                </p>
              </div>
            </div>

          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. น้ำมันเตา (Bunker oil)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">MS1 (ลิตร)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.fuel_oil_a_ms1_liter || ''}
                  onChange={(e) => handleInputChange('fuel_oil_a_ms1_liter', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">MS2 (ลิตร)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.fuel_oil_a_ms2_liter || ''}
                  onChange={(e) => handleInputChange('fuel_oil_a_ms2_liter', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">MS3 (ลิตร)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.fuel_oil_a_ms3_liter || ''}
                  onChange={(e) => handleInputChange('fuel_oil_a_ms3_liter', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-orange-100/70 p-3 rounded-xl border border-orange-200 flex items-center justify-between">
                <span className="text-xs font-bold text-orange-950">รวมน้ำมันเตาทั้งหมด (ลิตร):</span>
                <span className="text-base font-black text-orange-950">
                  {fuelOilTotalLiter.toLocaleString('th-TH', { maximumFractionDigits: 2 })} ลิตร
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ค่าน้ำมันเตา (บาท)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.fuel_oil_a_baht || ''}
                  onChange={(e) => handleInputChange('fuel_oil_a_baht', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pt-2">
              2. ปริมาณแก๊สที่ใช้ (Biogas Consumption)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ปริมาณแก๊ส MS1 (Nm³)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.gas_ms1_m3 || ''}
                  onChange={(e) => handleInputChange('gas_ms1_m3', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ปริมาณแก๊ส MS2 (Nm³)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.gas_ms2_m3 || ''}
                  onChange={(e) => handleInputChange('gas_ms2_m3', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ปริมาณแก๊ส MS3 (Nm³)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.gas_ms3_m3 || ''}
                  onChange={(e) => handleInputChange('gas_ms3_m3', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="bg-orange-100/70 p-3 rounded-xl border border-orange-200 flex items-center justify-between">
              <span className="text-xs font-bold text-orange-950">รวมแก๊สที่ใช้ทั้งหมด (Nm³):</span>
              <span className="text-base font-black text-orange-950">
                {gasTotalM3.toLocaleString('th-TH', { maximumFractionDigits: 2 })} Nm³
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 4: ไฟฟ้า & โซลาร์ (ELECTRICITY & SOLAR METERS) */}
      {activeCategory === 'cat4' && (
        <div className="bg-white rounded-2xl border border-sky-200 shadow-sm overflow-hidden space-y-6 p-6 font-sans">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black text-base">
                4
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2 tracking-wide">
                  <Zap className="w-5 h-5 text-sky-600" />
                  <span>หมวดที่ 4: ไฟฟ้า (Electricity & Solar Meters)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  กรอกข้อมูลมิเตอร์ไฟฟ้า On Peak / Off Peak และ มิเตอร์ Solar
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. MS3, MS1, TF (KWH) */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-sky-700 uppercase tracking-wider">
                    MS3, MS1, TF (KWH)
                  </h4>
                  <span className="text-[11px] font-extrabold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded-md">
                    รวม: {((Number(formData.elec_ms3_ms1_tf_on_peak) || 0) + (Number(formData.elec_ms3_ms1_tf_off_peak) || 0)).toLocaleString('th-TH')} kWh
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">On Peak</label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.elec_ms3_ms1_tf_on_peak || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleInputChange('elec_ms3_ms1_tf_on_peak', val);
                        const off = Number(formData.elec_ms3_ms1_tf_off_peak) || 0;
                        handleInputChange('elec_meter1_ms1_ms3_tf', val + off);
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Off Peak</label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.elec_ms3_ms1_tf_off_peak || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleInputChange('elec_ms3_ms1_tf_off_peak', val);
                        const on = Number(formData.elec_ms3_ms1_tf_on_peak) || 0;
                        handleInputChange('elec_meter1_ms1_ms3_tf', on + val);
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* 2. MS 2 MIX (KWH) */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-sky-700 uppercase tracking-wider">
                    MS 2 MIX (KWH)
                  </h4>
                  <span className="text-[11px] font-extrabold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded-md">
                    รวม: {((Number(formData.elec_ms2_mix_on_peak) || 0) + (Number(formData.elec_ms2_mix_off_peak) || 0)).toLocaleString('th-TH')} kWh
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">On Peak</label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.elec_ms2_mix_on_peak || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleInputChange('elec_ms2_mix_on_peak', val);
                        const off = Number(formData.elec_ms2_mix_off_peak) || 0;
                        handleInputChange('elec_meter3_ms2_mix', val + off);
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Off Peak</label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.elec_ms2_mix_off_peak || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleInputChange('elec_ms2_mix_off_peak', val);
                        const on = Number(formData.elec_ms2_mix_on_peak) || 0;
                        handleInputChange('elec_meter3_ms2_mix', on + val);
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* 3. UTL (KWH) */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-sky-700 uppercase tracking-wider">
                    UTL (KWH)
                  </h4>
                  <span className="text-[11px] font-extrabold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded-md">
                    รวม: {((Number(formData.elec_utl_on_peak) || 0) + (Number(formData.elec_utl_off_peak) || 0)).toLocaleString('th-TH')} kWh
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">On Peak</label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.elec_utl_on_peak || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleInputChange('elec_utl_on_peak', val);
                        const off = Number(formData.elec_utl_off_peak) || 0;
                        handleInputChange('elec_meter2_utl', val + off);
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Off Peak</label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.elec_utl_off_peak || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleInputChange('elec_utl_off_peak', val);
                        const on = Number(formData.elec_utl_on_peak) || 0;
                        handleInputChange('elec_meter2_utl', on + val);
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* 4. SOLAR (KWH) */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-sky-700 uppercase tracking-wider">
                    SOLAR (KWH)
                  </h4>
                  <span className="text-[11px] font-extrabold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded-md">
                    รวม: {((Number(formData.solar_meter1_ms2) || 0) + (Number(formData.solar_meter2_tf) || 0)).toLocaleString('th-TH')} kWh
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">มิเตอร์ 1 (MS2)</label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.solar_meter1_ms2 || ''}
                      onChange={(e) => handleInputChange('solar_meter1_ms2', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">มิเตอร์ 2 (TF)</label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.solar_meter2_tf || ''}
                      onChange={(e) => handleInputChange('solar_meter2_tf', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. ค่าไฟฟ้า (บาท) */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                ค่าไฟฟ้าประจำเดือน (บาท)
              </h4>
              <input
                type="number"
                disabled={isFormLocked}
                value={formData.electricity_baht || ''}
                onChange={(e) => handleInputChange('electricity_baht', Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
              />
            </div>

            {/* OVERALL ON PEAK / OFF PEAK SUMMARY BADGES */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-sky-50 p-3 rounded-xl border border-sky-200 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-sky-800 uppercase">รวม On Peak ทั้งหมด</span>
                <span className="text-sm font-black text-sky-900">
                  {((Number(formData.elec_ms3_ms1_tf_on_peak) || 0) + (Number(formData.elec_ms2_mix_on_peak) || 0) + (Number(formData.elec_utl_on_peak) || 0)).toLocaleString('th-TH')} <span className="text-[10px] font-medium text-slate-500">kWh</span>
                </span>
              </div>

              <div className="bg-sky-50 p-3 rounded-xl border border-sky-200 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-sky-800 uppercase">รวม Off Peak ทั้งหมด</span>
                <span className="text-sm font-black text-sky-900">
                  {((Number(formData.elec_ms3_ms1_tf_off_peak) || 0) + (Number(formData.elec_ms2_mix_off_peak) || 0) + (Number(formData.elec_utl_off_peak) || 0)).toLocaleString('th-TH')} <span className="text-[10px] font-medium text-slate-500">kWh</span>
                </span>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-amber-800 uppercase">รวม Solar ทั้งหมด</span>
                <span className="text-sm font-black text-amber-900">
                  {((Number(formData.solar_meter1_ms2) || 0) + (Number(formData.solar_meter2_tf) || 0)).toLocaleString('th-TH')} <span className="text-[10px] font-medium text-slate-500">kWh</span>
                </span>
              </div>
            </div>

            <div className="bg-sky-900 text-white p-3.5 rounded-xl flex items-center justify-between shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
                รวมไฟฟ้า PEA + โซลาร์ ทั้งหมด (Total Electricity kWh):
              </span>
              <span className="text-lg font-black text-sky-300">
                {elecGrandTotal.toLocaleString('th-TH', { maximumFractionDigits: 2 })}{' '}
                <span className="text-xs font-normal text-white">kWh</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 5: WWT & BIOGAS */}
      {activeCategory === 'cat5' && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
                5
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  <span>หมวดที่ 5: ระบบบำบัดน้ำเสีย & ก๊าซชีวภาพ (WWT & Biogas)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  ข้อมูลบำบัดน้ำเสีย (WWT) ฝั่งซ้าย และ ข้อมูลก๊าซชีวภาพ (Biogas) ฝั่งขวา
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* WWT SIDE (LEFT) */}
            <div className="space-y-4 bg-slate-50 text-slate-800 p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-sm font-black text-emerald-700 uppercase tracking-wider">
                  WWT (ระบบบำบัดน้ำเสีย)
                </h4>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Wastewater Treatment
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">COD Native</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.wwt_cod_native || ''}
                    onChange={(e) => handleInputChange('wwt_cod_native', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">CODt Mix1</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.wwt_codt_mix1 || ''}
                    onChange={(e) => handleInputChange('wwt_codt_mix1', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">VFA Mix1</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.wwt_vfa_mix1 || ''}
                    onChange={(e) => handleInputChange('wwt_vfa_mix1', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">pH Mix2</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.wwt_ph_mix2 || ''}
                    onChange={(e) => handleInputChange('wwt_ph_mix2', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900">COD Loading (Kg/day):</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                    เป้าหมาย &lt; 18,000
                  </span>
                </div>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.wwt_cod_loading || ''}
                  onChange={(e) => handleInputChange('wwt_cod_loading', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-black text-emerald-700 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 text-xs font-semibold">COD eff AS</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.wwt_cod_eff_as || ''}
                  onChange={(e) => handleInputChange('wwt_cod_eff_as', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>
            </div>

            {/* BIOGAS SIDE (RIGHT) */}
            <div className="space-y-4 bg-slate-50 text-slate-800 p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-sm font-black text-sky-700 uppercase tracking-wider">
                  Biogas (ระบบก๊าซชีวภาพ)
                </h4>
                <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold border border-sky-200">
                  Biogas Generation
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Flow Feed Mix2</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.biogas_flow_feed_mix2 || ''}
                    onChange={(e) => handleInputChange('biogas_flow_feed_mix2', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Biogas Generate</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.biogas_generate || ''}
                    onChange={(e) => handleInputChange('biogas_generate', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Biogas Flare</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.biogas_flare || ''}
                    onChange={(e) => handleInputChange('biogas_flare', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Boiler Consumption</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.biogas_boiler_consumption || ''}
                    onChange={(e) => handleInputChange('biogas_boiler_consumption', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">% CH4</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.biogas_pct_ch4 || ''}
                    onChange={(e) => handleInputChange('biogas_pct_ch4', Number(e.target.value))}
                    placeholder="0.00%"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">% H2S</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.biogas_pct_h2s || ''}
                    onChange={(e) => handleInputChange('biogas_pct_h2s', Number(e.target.value))}
                    placeholder="0.00%"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Removal</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.biogas_removal || ''}
                    onChange={(e) => handleInputChange('biogas_removal', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">SV60 eff Biogas</label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={formData.biogas_sv60_eff || ''}
                    onChange={(e) => handleInputChange('biogas_sv60_eff', Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ADDITIONAL BIOGAS MACHINE PARAMETERS CARD (Flow, Temp, แรงดัน, การเดรนน้ำ Air Dryer, Flare, กระแสมอเตอร์) */}
          <div className="bg-slate-50 text-slate-800 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                บันทึกค่าพารามิเตอร์เครื่องจักร Biogas (Flow, Temp, แรงดัน, Air Dryer, Flare, กระแส)
              </h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                Biogas Parameters
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Flow</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.biogas_flow ?? ''}
                  onChange={(e) => handleInputChange('biogas_flow', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Temp (°C)</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.biogas_temp ?? ''}
                  onChange={(e) => handleInputChange('biogas_temp', Number(e.target.value))}
                  placeholder="0.00 °C"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">แรงดัน</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.biogas_pressure ?? ''}
                  onChange={(e) => handleInputChange('biogas_pressure', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">การเดรนน้ำ Air Dryer</label>
                <input
                  type="text"
                  disabled={isFormLocked}
                  value={formData.biogas_air_dryer_drain || ''}
                  onChange={(e) => handleInputChange('biogas_air_dryer_drain', e.target.value)}
                  placeholder="เดรนน้ำ..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Flare</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.biogas_flare ?? ''}
                  onChange={(e) => handleInputChange('biogas_flare', Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">กระแสมอเตอร์</label>
                <input
                  type="number"
                  disabled={isFormLocked}
                  value={formData.biogas_motor_current ?? ''}
                  onChange={(e) => handleInputChange('biogas_motor_current', Number(e.target.value))}
                  placeholder="0.00 A"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 6: สารเคมี (CHEMICAL USAGE & STOCK) */}
      {activeCategory === 'cat6' && (
        <div className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm">
                6
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-purple-600" />
                  <span>หมวดที่ 6: สารเคมี (Chemical Usage & Stock)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  กรอกข้อมูลปริมาณสารเคมีที่ได้รับ การใช้งาน และสต็อกคงเหลือประจำวัน
                </p>
              </div>
            </div>
          </div>

          {/* CHEMICAL USAGE & STOCK CARD */}
          <div className="bg-slate-50 text-slate-800 p-5 rounded-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-black text-purple-700 uppercase tracking-wider">
                บันทึกปริมาณสารเคมี & สต็อกคงเหลือ (Chemical Usage & Stock)
              </h4>
              <span className="text-[10px] bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-bold border border-purple-200">
                Chemical Stock
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* 1. LIME 90% (20 KG) */}
              <div className="space-y-2">
                <h5 className="font-extrabold text-purple-800 text-xs tracking-wide">
                  LIME 90% (20 KG)
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Received <span className="text-slate-400 font-normal">(bags)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_lime_received ?? ''}
                      onChange={(e) => handleInputChange('chem_lime_received', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Usage <span className="text-slate-400 font-normal">(bags)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_lime_usage ?? ''}
                      onChange={(e) => handleInputChange('chem_lime_usage', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Available <span className="text-slate-400 font-normal">(bags)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_lime_available ?? ''}
                      onChange={(e) => handleInputChange('chem_lime_available', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* 2. POLYMER (25 KG) */}
              <div className="space-y-2 pt-1 border-t border-slate-200/80">
                <h5 className="font-extrabold text-purple-800 text-xs tracking-wide">
                  POLYMER (25 KG)
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Received <span className="text-slate-400 font-normal">(bags)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_polymer_received ?? ''}
                      onChange={(e) => handleInputChange('chem_polymer_received', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Usage <span className="text-slate-400 font-normal">(bags)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_polymer_usage ?? ''}
                      onChange={(e) => handleInputChange('chem_polymer_usage', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Available <span className="text-slate-400 font-normal">(bags)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_polymer_available ?? ''}
                      onChange={(e) => handleInputChange('chem_polymer_available', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* 3. ODOR CONTROLLER (20 L) */}
              <div className="space-y-2 pt-1 border-t border-slate-200/80">
                <h5 className="font-extrabold text-purple-800 text-xs tracking-wide">
                  ODOR CONTROLLER (20 L)
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Received <span className="text-slate-400 font-normal">(gallon)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_odor_received ?? ''}
                      onChange={(e) => handleInputChange('chem_odor_received', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Usage <span className="text-slate-400 font-normal">(gallon)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_odor_usage ?? ''}
                      onChange={(e) => handleInputChange('chem_odor_usage', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Available <span className="text-slate-400 font-normal">(gallon)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_odor_available ?? ''}
                      onChange={(e) => handleInputChange('chem_odor_available', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* 4. FOG CONTROLLER (20 L) */}
              <div className="space-y-2 pt-1 border-t border-slate-200/80">
                <h5 className="font-extrabold text-purple-800 text-xs tracking-wide">
                  FOG CONTROLLER (20 L)
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Received <span className="text-slate-400 font-normal">(gallon)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_fog_received ?? ''}
                      onChange={(e) => handleInputChange('chem_fog_received', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Usage <span className="text-slate-400 font-normal">(gallon)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_fog_usage ?? ''}
                      onChange={(e) => handleInputChange('chem_fog_usage', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Available <span className="text-slate-400 font-normal">(gallon)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_fog_available ?? ''}
                      onChange={(e) => handleInputChange('chem_fog_available', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* 5. หลอด COD */}
              <div className="space-y-2 pt-1 border-t border-slate-200/80">
                <h5 className="font-extrabold text-purple-800 text-xs tracking-wide">
                  หลอด COD
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Received <span className="text-slate-400 font-normal">(หลอด)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_cod_tube_received ?? ''}
                      onChange={(e) => handleInputChange('chem_cod_tube_received', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Usage <span className="text-slate-400 font-normal">(หลอด)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_cod_tube_usage ?? ''}
                      onChange={(e) => handleInputChange('chem_cod_tube_usage', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Available <span className="text-slate-400 font-normal">(หลอด)</span></label>
                    <input
                      type="number"
                      disabled={isFormLocked}
                      value={formData.chem_cod_tube_available ?? ''}
                      onChange={(e) => handleInputChange('chem_cod_tube_available', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 md:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 z-20 shadow-lg">
        <div className="flex items-center gap-2">
          {isFormLocked && (
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200">
              <Lock className="w-4 h-4 text-sky-600" />
              <span>แบบฟอร์มถูกล็อกเนื่องจากอยู่ระหว่างรออนุมัติหรือได้รับการอนุมัติแล้ว</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isReadOnlyMode && (
            <button
              onClick={onCloseModal}
              className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          )}

          {!isReadOnlyMode && onSaveEditItem && (
            <div className="flex items-center gap-3">
              <button
                onClick={onCloseModal}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => onSaveEditItem(formData)}
                className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการแก้ไข</span>
              </button>
            </div>
          )}

          {!isReadOnlyMode && !onSaveEditItem && (
            <>
              {(!isFormLocked || currentUser?.role === 'admin') && (
                <button
                  onClick={handleSubmitClick}
                  className="flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isElevatedUser ? (
                    <>
                      <BadgeCheck className="w-4 h-4 text-emerald-400" />
                      <span>บันทึกข้อมูล</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-emerald-400" />
                      <span>ส่งคำขออนุมัติ</span>
                    </>
                  )}
                </button>
              )}

              {(currentUser?.role === 'approver' || currentUser?.role === 'admin') &&
                status === 'pending' && (
                  <>
                    <button
                      onClick={() => setRejectModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>ตีกลับ (Reject)</span>
                    </button>

                    <button
                      onClick={handleApproveClick}
                      className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      <BadgeCheck className="w-4 h-4" />
                      <span>อนุมัติรายงาน (Approve)</span>
                    </button>
                  </>
                )}
            </>
          )}
        </div>
      </div>
      {/* REJECT MODAL DIALOG */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">
                ระบุเหตุผลในการตีกลับรายงาน (Reject)
              </h3>
            </div>

            <textarea
              rows={3}
              value={rejectInputReason}
              onChange={(e) => setRejectInputReason(e.target.value)}
              placeholder="ระบุข้อผิดพลาด เช่น ข้อมูลไฟฟ้าไม่ตรงกับใบแจ้งหนี้ PEA"
              className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
              >
                ยืนยันการตีกลับ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
