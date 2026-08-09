import { ReportData, ComputedMetrics } from './types';

export function calculateMetrics(data: Partial<ReportData>): ComputedMetrics {
  // --- หมวดที่ 1: ตะกอน (Sludge Calculations) ---
  const sludgeTons = Number(data.sludge_tons) || 0;
  const sludgeTrips = Number(data.sludge_trips) || 0;
  const sludgeDisposalPrice = Number(data.sludge_disposal_price) || 0;
  const sludgeTripPrice = Number(data.sludge_trip_price) || 0;
  const sludgeTotalBaht = ((sludgeTons * sludgeDisposalPrice) + sludgeTripPrice) * sludgeTrips;

  const useVac = Boolean(data.sludge_use_vacuum_truck);
  const vacTons = Number(data.sludge_vac_tons) || 0;
  const vacTrips = Number(data.sludge_vac_trips) || 0;
  const vacDisposalPrice = Number(data.sludge_vac_disposal_price) || 0;
  const vacTripPrice = Number(data.sludge_vac_trip_price) || 0;
  const sludgeVacTotalBaht = useVac ? (((vacTons * vacDisposalPrice) + vacTripPrice) * vacTrips) : 0;

  const sludgeGrandTotalBaht = sludgeTotalBaht + sludgeVacTotalBaht;

  // --- หมวดที่ 2: การผลิต (Production MS1 + MS2 + MS3) ---
  const ms1Tons = Number(data.production_ms1) || 0;
  const ms2Tons = Number(data.production_ms2) || 0;
  const ms3Tons = Number(data.production_ms3) || 0;
  const productionTotalMS = ms1Tons + ms2Tons + ms3Tons;

  const cassavaTons = Number(data.production_cassava) || 0;
  const modifiedTons = Number(data.production_modified) || 0;
  const totalProductionTons = productionTotalMS > 0 ? productionTotalMS : (cassavaTons + modifiedTons);

  const cassavaHrs = Number(data.hours_cassava) || 0;
  const modifiedHrs = Number(data.hours_modified) || 0;
  const totalHours = cassavaHrs + modifiedHrs;

  // --- หมวดที่ 3: เชื้อเพลิง (Fuel & Gas) ---
  // 1. น้ำมันเตา A (ขึ้นก่อน): MS1, MS2, MS3 (ลิตร)
  const fuelMs1 = Number(data.fuel_oil_a_ms1_liter) || 0;
  const fuelMs2 = Number(data.fuel_oil_a_ms2_liter) || 0;
  const fuelMs3 = Number(data.fuel_oil_a_ms3_liter) || 0;
  const fuelOilTotalLiter = fuelMs1 + fuelMs2 + fuelMs3;

  const legacyFuelLiter = Number(data.fuel_oil_a_liter) || 0;
  const fuelLiter = fuelOilTotalLiter > 0 ? fuelOilTotalLiter : legacyFuelLiter;
  const fuelBaht = Number(data.fuel_oil_a_baht) || 0;

  // 2. ก๊าซชีวภาพ/แก๊ส (ลำดับสอง): MS1, MS2, MS3 (m³)
  const gasMs1 = Number(data.gas_ms1_m3) || 0;
  const gasMs2 = Number(data.gas_ms2_m3) || 0;
  const gasMs3 = Number(data.gas_ms3_m3) || 0;
  const gasTotalM3 = gasMs1 + gasMs2 + gasMs3;

  const legacyBiogasM3 = Number(data.renewable_biogas_m3) || 0;
  const biogasM3 = gasTotalM3 > 0 ? gasTotalM3 : legacyBiogasM3;

  // --- หมวดที่ 4: ไฟฟ้า (Electricity & Solar Meters) ---
  const elecMS1OnPeak = Number(data.elec_ms3_ms1_tf_on_peak) || 0;
  const elecMS1OffPeak = Number(data.elec_ms3_ms1_tf_off_peak) || 0;
  const elecMeter1 = (elecMS1OnPeak || elecMS1OffPeak) ? (elecMS1OnPeak + elecMS1OffPeak) : (Number(data.elec_meter1_ms1_ms3_tf) || 0);

  const elecMS2OnPeak = Number(data.elec_ms2_mix_on_peak) || 0;
  const elecMS2OffPeak = Number(data.elec_ms2_mix_off_peak) || 0;
  const elecMeter3 = (elecMS2OnPeak || elecMS2OffPeak) ? (elecMS2OnPeak + elecMS2OffPeak) : (Number(data.elec_meter3_ms2_mix) || 0);

  const elecUtlOnPeak = Number(data.elec_utl_on_peak) || 0;
  const elecUtlOffPeak = Number(data.elec_utl_off_peak) || 0;
  const elecMeter2 = (elecUtlOnPeak || elecUtlOffPeak) ? (elecUtlOnPeak + elecUtlOffPeak) : (Number(data.elec_meter2_utl) || 0);

  const elecTotalPeaKwh = elecMeter1 + elecMeter2 + elecMeter3;

  const solarMeter1 = Number(data.solar_meter1_ms2) || 0;
  const solarMeter2 = Number(data.solar_meter2_tf) || 0;
  const elecTotalSolarKwh = solarMeter1 + solarMeter2;

  const elecGrandTotalKwh = elecTotalPeaKwh + elecTotalSolarKwh;

  const legacyElecKwh = Number(data.electricity_kwh) || 0;
  const legacySolarKwh = Number(data.renewable_solar_kwh) || 0;

  const elecKwh = elecTotalPeaKwh > 0 ? elecTotalPeaKwh : legacyElecKwh;
  const solarKwh = elecTotalSolarKwh > 0 ? elecTotalSolarKwh : legacySolarKwh;
  const elecBaht = Number(data.electricity_baht) || 0;

  // --- Energy Conversions to MJ ---
  // 1 kWh = 3.6 MJ
  // 1 m³ Biogas ≈ 20 MJ
  // 1 Liter Fuel Oil A ≈ 40 MJ
  const electricityMJ = elecKwh * 3.6;
  const renewableBiogasMJ = biogasM3 * 20;
  const renewableSolarMJ = solarKwh * 3.6;
  const renewableTotalMJ = renewableBiogasMJ + renewableSolarMJ;
  const fuelOilMJ = fuelLiter * 40;

  const totalEnergyMJ = electricityMJ + renewableTotalMJ + fuelOilMJ;
  const totalCostBaht = elecBaht + fuelBaht + sludgeGrandTotalBaht;

  const secMJPerTon = totalProductionTons > 0 ? totalEnergyMJ / totalProductionTons : 0;
  const renewablePercentage = totalEnergyMJ > 0 ? (renewableTotalMJ / totalEnergyMJ) * 100 : 0;

  return {
    totalProductionTons,
    totalHours,
    electricityMJ,
    renewableBiogasMJ,
    renewableSolarMJ,
    renewableTotalMJ,
    fuelOilMJ,
    totalEnergyMJ,
    totalCostBaht,
    secMJPerTon,
    renewablePercentage,

    // Category specific totals
    sludgeGrandTotalBaht,
    productionTotalMS,
    fuelOilTotalLiter,
    gasTotalM3,
    elecTotalPeaKwh,
    elecTotalSolarKwh,
    elecGrandTotalKwh,
  };
}

export const MONTH_NAMES_TH = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

export const MONTH_SHORT_TH = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

/**
 * Format any date string (YYYY-MM-DD or ISO string) to Thai standard format: dd/mm/yyyy
 */
export function formatDateTh(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const cleanDate = dateStr.split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
  } catch (e) {}
  return dateStr;
}
