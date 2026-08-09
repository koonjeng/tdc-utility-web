import * as XLSX from 'xlsx';
import { FullMonthlyReportData } from './types';
import { calculateMetrics, MONTH_NAMES_TH } from './calculations';

export function exportMonthlyReportsToExcel(year: number, reports: FullMonthlyReportData[]) {
  const exportRows = reports.map((item) => {
    const monthName = MONTH_NAMES_TH[item.report.month - 1];
    const metrics = calculateMetrics(item.data);

    let statusText = 'ว่าง';
    if (item.report.status === 'draft') statusText = 'ร่าง (Draft)';
    if (item.report.status === 'pending') statusText = 'รออนุมัติ (Pending)';
    if (item.report.status === 'approved') statusText = 'อนุมัติแล้ว (Approved)';

    return {
      'ปี (พ.ศ.)': year,
      'เดือน': monthName,
      'สถานะ': statusText,
      'ผู้ลงข้อมูล': item.data.reporter_name || '-',
      'รหัสพนักงาน': item.data.reporter_id || '-',
      'วันที่รายงาน': item.data.report_date || '-',
      
      // หมวดที่ 1: ตะกอน
      'รายการขนตะกอน': item.data.sludge_removal_desc || '-',
      'ขนตะกอน (ตัน)': item.data.sludge_tons || 0,
      'จำนวนเที่ยว': item.data.sludge_trips || 0,
      'ราคากำจัด (บาท/ตัน)': item.data.sludge_disposal_price || 0,
      'ราคาเที่ยว (บาท/เที่ยว)': item.data.sludge_trip_price || 0,
      'เปิดใช้รถดูดตะกอน': item.data.sludge_use_vacuum_truck ? 'ใช่' : 'ไม่',
      'รวมเงินหมวดตะกอน (บาท)': metrics.sludgeGrandTotalBaht,

      // หมวดที่ 2: การผลิต
      'การผลิต MS1 (ตัน)': item.data.production_ms1 || 0,
      'การผลิต MS2 (ตัน)': item.data.production_ms2 || 0,
      'การผลิต MS3 (ตัน)': item.data.production_ms3 || 0,
      'รวมผลผลิต 3 MS (ตัน)': metrics.totalProductionTons,

      // หมวดที่ 3: เชื้อเพลิง (สลับน้ำมันเตาขึ้นก่อน + MS1-3 ลิตร)
      'น้ำมันเตา MS1 (ลิตร)': item.data.fuel_oil_a_ms1_liter || 0,
      'น้ำมันเตา MS2 (ลิตร)': item.data.fuel_oil_a_ms2_liter || 0,
      'น้ำมันเตา MS3 (ลิตร)': item.data.fuel_oil_a_ms3_liter || 0,
      'รวมน้ำมันเตา (ลิตร)': metrics.fuelOilTotalLiter,
      'ค่าน้ำมันเตา (บาท)': item.data.fuel_oil_a_baht || 0,
      'แก๊สที่ใช้ MS1 (m³)': item.data.gas_ms1_m3 || 0,
      'แก๊สที่ใช้ MS2 (m³)': item.data.gas_ms2_m3 || 0,
      'แก๊สที่ใช้ MS3 (m³)': item.data.gas_ms3_m3 || 0,
      'รวมแก๊สที่ใช้ (m³)': metrics.gasTotalM3,

      // หมวดที่ 4: ไฟฟ้า
      'มิเตอร์ 1 MS1, MS3, TF (kWh)': item.data.elec_meter1_ms1_ms3_tf || 0,
      'มิเตอร์ 2 UTL (kWh)': item.data.elec_meter2_utl || 0,
      'มิเตอร์ 3 MS2 Mix (kWh)': item.data.elec_meter3_ms2_mix || 0,
      'มิเตอร์ 1 โซลาร์ MS2 (kWh)': item.data.solar_meter1_ms2 || 0,
      'มิเตอร์ 2 โซลาร์ TF (kWh)': item.data.solar_meter2_tf || 0,
      'รวมไฟฟ้า PEA (kWh)': metrics.elecTotalPeaKwh,
      'รวมไฟฟ้าโซลาร์ (kWh)': metrics.elecTotalSolarKwh,
      'รวมไฟฟ้าทั้งหมด (kWh)': metrics.elecGrandTotalKwh,
      'ค่าไฟฟ้า (บาท)': item.data.electricity_baht || 0,

      // หมวดที่ 5: WWT & Biogas
      'COD Native': item.data.wwt_cod_native || 0,
      'CODt Mix1': item.data.wwt_codt_mix1 || 0,
      'VFA Mix1': item.data.wwt_vfa_mix1 || 0,
      'pH Mix2': item.data.wwt_ph_mix2 || 0,
      'COD Loading (Kg/day)': item.data.wwt_cod_loading || 0,
      'COD eff AS': item.data.wwt_cod_eff_as || 0,
      'Flow Feed Mix2': item.data.biogas_flow_feed_mix2 || 0,
      'Biogas Generate': item.data.biogas_generate || 0,
      'Biogas Flare': item.data.biogas_flare || 0,
      'Boiler Consumption': item.data.biogas_boiler_consumption || 0,
      '% CH4': item.data.biogas_pct_ch4 || 0,
      '% H2S': item.data.biogas_pct_h2s || 0,
      'Removal': item.data.biogas_removal || 0,
      'SV60 eff Biogas': item.data.biogas_sv60_eff || 0,
      'Biogas Flow': item.data.biogas_flow || 0,
      'Biogas Temp (°C)': item.data.biogas_temp || 0,
      'Biogas แรงดัน': item.data.biogas_pressure || 0,
      'การเดรนน้ำ Air Dryer': item.data.biogas_air_dryer_drain || '-',
      'กระแสมอเตอร์ (A)': item.data.biogas_motor_current || 0,

      // สารเคมี (Chemical Usage & Stock)
      'LIME 90% (Received kg)': item.data.chem_lime_received || 0,
      'LIME 90% (Usage bags)': item.data.chem_lime_usage || 0,
      'LIME 90% (Available bags)': item.data.chem_lime_available || 0,
      'POLYMER (Received bags)': item.data.chem_polymer_received || 0,
      'POLYMER (Usage bags)': item.data.chem_polymer_usage || 0,
      'POLYMER (Available bags)': item.data.chem_polymer_available || 0,
      'ODOR CONTROLLER (Received gal)': item.data.chem_odor_received || 0,
      'ODOR CONTROLLER (Usage gal)': item.data.chem_odor_usage || 0,
      'ODOR CONTROLLER (Available gal)': item.data.chem_odor_available || 0,
      'FOG CONTROLLER (Received gal)': item.data.chem_fog_received || 0,
      'FOG CONTROLLER (Usage gal)': item.data.chem_fog_usage || 0,
      'FOG CONTROLLER (Available gal)': item.data.chem_fog_available || 0,
      'หลอด COD (Received หลอด)': item.data.chem_cod_tube_received || 0,
      'หลอด COD (Usage หลอด)': item.data.chem_cod_tube_usage || 0,
      'หลอด COD (Available หลอด)': item.data.chem_cod_tube_available || 0,

      // ตัวเลขสรุปหลัก
      'พลังงานรวม (MJ)': Math.round(metrics.totalEnergyMJ),
      'ค่าใช้จ่ายพลังงานรวม (บาท)': metrics.totalCostBaht,
      'SEC (MJ/ตัน)': Math.round(metrics.secMJPerTon * 100) / 100,
      '% พลังงานหมุนเวียน': Math.round(metrics.renewablePercentage * 100) / 100 + '%',
      'เหตุผลที่ตีกลับ': item.report.reject_reason || '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `TDC_Energy_Report_${year}`);

  // Download XLSX file
  XLSX.writeFile(workbook, `TDC_Energy_Report_${year}.xlsx`);
}
