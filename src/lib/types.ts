export type UserRole = 'reporter' | 'approver' | 'admin';

export type ReportStatus = 'empty' | 'draft' | 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  user_email: string;
  action: 'APPROVE' | 'REJECT' | 'SUBMIT' | 'CREATE_USER' | 'UPDATE_ROLE' | 'DELETE_USER';
  details: string;
  created_at: string;
}

export interface MonthlyReport {
  id: string;
  year: number; // e.g. 2569 (2026)
  month: number; // 1 - 12
  status: ReportStatus;
  reject_reason?: string | null;
  submitted_category?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ReportData {
  id?: string;
  report_id: string;
  reporter_name: string;
  reporter_id: string;
  approver_name?: string;
  report_date: string;
  submitted_category?: string;
  
  // Legacy / Compatibility fields
  production_cassava: number;
  production_modified: number;
  hours_cassava: number;
  hours_modified: number;
  electricity_kwh: number;
  electricity_baht: number;
  renewable_biogas_m3: number;
  renewable_solar_kwh: number;

  // --- หมวดที่ 1: ตะกอน (Sludge) ---
  sludge_datetime?: string;
  sludge_removal_desc?: string;
  sludge_tons?: number;
  sludge_trips?: number;
  sludge_disposal_price?: number;
  sludge_trip_price?: number;
  sludge_total_baht?: number;
  
  // Checkbox รถดูดตะกอน
  sludge_use_vacuum_truck?: boolean;
  sludge_vac_datetime?: string;
  sludge_vac_removal_desc?: string;
  sludge_vac_tons?: number;
  sludge_vac_trips?: number;
  sludge_vac_disposal_price?: number;
  sludge_vac_trip_price?: number;
  sludge_vac_total_baht?: number;
  sludge_grand_total_baht?: number;

  // --- หมวดที่ 2: การผลิต (Production) ---
  production_ms1?: number; // MS1 (ตัน)
  production_ms2?: number; // MS2 (ตัน)
  production_ms3?: number; // MS3 (ตัน)
  production_total_ms?: number; // รวม 3 MS (ตัน)

  // --- หมวดที่ 3: เชื้อเพลิง (Fuel & Gas) ---
  // น้ำมันเตา A (ขึ้นก่อน): MS1, MS2, MS3 (ลิตร)
  fuel_oil_a_ms1_liter?: number; // MS1 (ลิตร)
  fuel_oil_a_ms2_liter?: number; // MS2 (ลิตร)
  fuel_oil_a_ms3_liter?: number; // MS3 (ลิตร)
  fuel_oil_a_total_liter?: number; // รวมน้ำมันเตา A (ลิตร)
  fuel_oil_a_liter?: number; // ปริมาณน้ำมันเตา A รวม
  fuel_oil_a_baht?: number; // ค่าน้ำมันเตา A (บาท)

  // ก๊าซชีวภาพ/แก๊ส (ลำดับสอง): MS1, MS2, MS3 (m³)
  gas_ms1_m3?: number; // แก๊ส MS1 (m³)
  gas_ms2_m3?: number; // แก๊ส MS2 (m³)
  gas_ms3_m3?: number; // แก๊ส MS3 (m³)
  gas_total_m3?: number; // รวมแก๊ส (m³)

  // --- หมวดที่ 4: ไฟฟ้า (Electricity & Solar Meters) ---
  // 1. MS3, MS1, TF (KWH)
  elec_ms3_ms1_tf_on_peak?: number;
  elec_ms3_ms1_tf_off_peak?: number;
  elec_meter1_ms1_ms3_tf?: number; // มิเตอร์ 1 MS1, MS3, TF (kWh)

  // 2. MS 2 MIX (KWH)
  elec_ms2_mix_on_peak?: number;
  elec_ms2_mix_off_peak?: number;
  elec_meter3_ms2_mix?: number; // มิเตอร์ 3 MS2 Mix (kWh)

  // 3. UTL (KWH)
  elec_utl_on_peak?: number;
  elec_utl_off_peak?: number;
  elec_meter2_utl?: number; // มิเตอร์ 2 UTL (kWh)

  // 4. SOLAR (KWH)
  solar_meter1_ms2?: number; // มิเตอร์ 1 (MS2) (kWh)
  solar_meter2_tf?: number; // มิเตอร์ 2 (TF) (kWh)
  elec_total_pea_kwh?: number;
  elec_total_solar_kwh?: number;
  elec_grand_total_kwh?: number;

  // --- หมวดที่ 5: บำบัดน้ำเสีย & ก๊าซชีวภาพ (WWT & Biogas) ---
  // WWT (ฝั่งซ้าย)
  wwt_cod_native?: number;
  wwt_codt_mix1?: number;
  wwt_vfa_mix1?: number;
  wwt_ph_mix2?: number;
  wwt_cod_loading?: number; // (Kg/day) < 18,000
  wwt_cod_eff_as?: number;

  // Biogas (ฝั่งขวา)
  biogas_flow_feed_mix2?: number;
  biogas_generate?: number;
  biogas_flare?: number;
  biogas_boiler_consumption?: number;
  biogas_pct_ch4?: number;
  biogas_pct_h2s?: number;
  biogas_removal?: number;
  biogas_sv60_eff?: number;

  // Biogas Additional Parameters (Flow, Temp, แรงดัน, การเดรนน้ำ Air Dryer, Flare, กระแสมอเตอร์)
  biogas_flow?: number;
  biogas_temp?: number;
  biogas_pressure?: number;
  biogas_air_dryer_drain?: string;
  biogas_motor_current?: number;

  // --- การใช้สารเคมี (Chemical Usage & Stock) ---
  // 1. LIME 90% (20 KG)
  chem_lime_received?: number;
  chem_lime_usage?: number;
  chem_lime_available?: number;

  // 2. POLYMER (25 KG)
  chem_polymer_received?: number;
  chem_polymer_usage?: number;
  chem_polymer_available?: number;

  // 3. ODOR CONTROLLER (20 L)
  chem_odor_received?: number;
  chem_odor_usage?: number;
  chem_odor_available?: number;

  // 4. FOG CONTROLLER (20 L)
  chem_fog_received?: number;
  chem_fog_usage?: number;
  chem_fog_available?: number;

  // 5. หลอด COD
  chem_cod_tube_received?: number;
  chem_cod_tube_usage?: number;
  chem_cod_tube_available?: number;

  created_at?: string;
  updated_at?: string;
}

export interface FullMonthlyReportData {
  report: MonthlyReport;
  data: ReportData;
}

export interface ComputedMetrics {
  totalProductionTons: number;
  totalHours: number;
  electricityMJ: number;
  renewableBiogasMJ: number;
  renewableSolarMJ: number;
  renewableTotalMJ: number;
  fuelOilMJ: number;
  totalEnergyMJ: number;
  totalCostBaht: number;
  secMJPerTon: number;
  renewablePercentage: number;

  // Category specific computed totals
  sludgeGrandTotalBaht: number;
  productionTotalMS: number;
  fuelOilTotalLiter: number;
  gasTotalM3: number;
  elecTotalPeaKwh: number;
  elecTotalSolarKwh: number;
  elecGrandTotalKwh: number;
}

export interface CategorySubmission {
  id: string;
  year: number;
  month: number;
  report_date: string;
  category_key: 'cat1' | 'cat2' | 'cat3' | 'cat4' | 'cat5' | 'cat6';
  category_name: string;
  status: 'pending' | 'approved' | 'rejected';
  reporter_name: string;
  reporter_id: string;
  approver_name?: string;
  reject_reason?: string | null;
  data: Partial<ReportData>;
  created_at: string;
}
