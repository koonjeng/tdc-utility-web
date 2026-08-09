const fs = require('fs');
const XLSX = require('xlsx');

const workbook = XLSX.readFile('TDC-UTL.xlsx');
console.log('Sheet Names:', workbook.SheetNames);

const monthMap = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

// Date parser helper
function parseDateStrToKey(dVal) {
  if (!dVal) return null;
  if (typeof dVal === 'number') {
    // Excel Serial Date
    const d = XLSX.SSF.parse_date_code(dVal);
    if (d) {
      const yr = d.y > 2000 ? d.y : 2000 + d.y;
      return `${yr}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    }
  }
  const str = String(dVal).trim();
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const mStr = parts[1];
      const mNum = monthMap[mStr] || parseInt(mStr, 10);
      let yr = parseInt(parts[2], 10);
      if (yr < 100) yr += 2000;
      if (mNum) {
        return `${yr}-${String(mNum).padStart(2, '0')}-${day}`;
      }
    }
  }
  return null;
}

const masterDataByDate = {};

function getOrCreateDayData(dateKey) {
  if (!masterDataByDate[dateKey]) {
    const parts = dateKey.split('-');
    const m = parseInt(parts[1], 10);
    masterDataByDate[dateKey] = {
      report_date: dateKey,
      reporter_name: 'ระบบนำเข้าไฟล์ Excel (Auto Import)',
      approver_name: 'ระบบอนุมัติอัตโนมัติ (CSV/Excel Import)',
      year: 2569,
      month: m,
      data: {
        report_date: dateKey,
        reporter_name: 'ระบบนำเข้าไฟล์ Excel (Auto Import)',
        approver_name: 'ระบบอนุมัติอัตโนมัติ (CSV/Excel Import)',
      },
    };
  }
  return masterDataByDate[dateKey];
}

// 1. SHEET: ปริมาณน้ำเสีย
if (workbook.SheetNames.includes('ปริมาณน้ำเสีย')) {
  const sheet = workbook.Sheets['ปริมาณน้ำเสีย'];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log('Inspecting ปริมาณน้ำเสีย total rows:', json.length);

  for (let r = 7; r < json.length; r++) {
    const row = json[r];
    if (!row || !row[0]) continue;
    const dateKey = parseDateStrToKey(row[0]);
    if (!dateKey) continue;

    const dayObj = getOrCreateDayData(dateKey);
    const fMod = parseFloat(row[14]) || 0;
    const fNat = parseFloat(row[15]) || 0;
    const codOut = parseFloat(row[11]) || 0;

    dayObj.data.wwt_codt_mix1 = fMod;
    dayObj.data.wwt_cod_native = fNat;
    dayObj.data.wwt_cod_loading = fMod + fNat;
    if (codOut > 0) dayObj.data.wwt_cod_eff_as = codOut;
  }
}

// 2. SHEET: %CH4,H2S
if (workbook.SheetNames.includes('%CH4,H2S')) {
  const sheet = workbook.Sheets['%CH4,H2S'];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log('Inspecting %CH4,H2S total rows:', json.length);

  for (let r = 2; r < json.length; r++) {
    const row = json[r];
    if (!row || !row[0]) continue;
    const dateKey = parseDateStrToKey(row[0]);
    if (!dateKey) continue;

    const dayObj = getOrCreateDayData(dateKey);
    const ch4 = parseFloat(row[1]) || parseFloat(row[2]) || 0;
    const h2s = parseFloat(row[3]) || parseFloat(row[4]) || 0;
    if (ch4 > 0) dayObj.data.biogas_pct_ch4 = ch4;
    if (h2s > 0) dayObj.data.biogas_pct_h2s = h2s;
  }
}

// 3. SHEET: PEA&Solar 69
if (workbook.SheetNames.includes('PEA&Solar 69')) {
  const sheet = workbook.Sheets['PEA&Solar 69'];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log('Inspecting PEA&Solar 69 total rows:', json.length);

  for (let r = 2; r < json.length; r++) {
    const row = json[r];
    if (!row || !row[0]) continue;
    const dateKey = parseDateStrToKey(row[0]);
    if (!dateKey) continue;

    const dayObj = getOrCreateDayData(dateKey);
    const peaM1 = parseFloat(row[1]) || 0;
    const peaM2 = parseFloat(row[2]) || 0;
    const peaM3 = parseFloat(row[3]) || 0;
    const solar1 = parseFloat(row[4]) || 0;
    const solar2 = parseFloat(row[5]) || 0;

    if (peaM1 > 0) dayObj.data.elec_meter1_ms1_ms3_tf = peaM1;
    if (peaM2 > 0) dayObj.data.elec_meter2_utl = peaM2;
    if (peaM3 > 0) dayObj.data.elec_meter3_ms2_mix = peaM3;
    if (solar1 > 0) dayObj.data.solar_meter1_ms2 = solar1;
    if (solar2 > 0) dayObj.data.solar_meter2_tf = solar2;

    dayObj.data.elec_total_pea_kwh = peaM1 + peaM2 + peaM3;
    dayObj.data.elec_total_solar_kwh = solar1 + solar2;
    dayObj.data.elec_grand_total_kwh = peaM1 + peaM2 + peaM3 + solar1 + solar2;
  }
}

// 4. SHEET: Sludge removal
if (workbook.SheetNames.includes('Sludge removal')) {
  const sheet = workbook.Sheets['Sludge removal'];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log('Inspecting Sludge removal total rows:', json.length);

  for (let r = 2; r < json.length; r++) {
    const row = json[r];
    if (!row || !row[0]) continue;
    const dateKey = parseDateStrToKey(row[0]);
    if (!dateKey) continue;

    const dayObj = getOrCreateDayData(dateKey);
    const tons = parseFloat(row[1]) || parseFloat(row[2]) || 0;
    const trips = parseFloat(row[3]) || 1;
    if (tons > 0) {
      dayObj.data.sludge_tons = tons;
      dayObj.data.sludge_trips = trips;
      dayObj.data.sludge_disposal_price = 450;
      dayObj.data.sludge_trip_price = 1500;
      dayObj.data.sludge_grand_total_baht = ((tons * 450) + 1500) * trips;
    }
  }
}

// Transform masterDataByDate to Submissions array
const yearSubmissionsMap = { 2569: [] };
const categories = [
  { key: 'cat1', name: 'หมวดที่ 1: ตะกอน (Sludge)' },
  { key: 'cat2', name: 'หมวดที่ 2: การผลิต (Production)' },
  { key: 'cat3', name: 'หมวดที่ 3: เชื้อเพลิง (Fuel & Gas)' },
  { key: 'cat4', name: 'หมวดที่ 4: ไฟฟ้า & โซลาร์ (Electricity & Solar)' },
  { key: 'cat5', name: 'หมวดที่ 5: WWT & Biogas' },
  { key: 'cat6', name: 'หมวดที่ 6: สารเคมี (Chemical Usage)' },
];

Object.keys(masterDataByDate).sort().forEach((dateKey) => {
  const day = masterDataByDate[dateKey];
  categories.forEach((cat) => {
    yearSubmissionsMap[2569].push({
      id: `sub_excel_${dateKey}_${cat.key}`,
      year: 2569,
      month: day.month,
      category_key: cat.key,
      category_name: cat.name,
      report_date: dateKey,
      reporter_name: day.reporter_name,
      approver_name: day.approver_name,
      status: 'approved',
      created_at: new Date().toISOString(),
      data: day.data,
    });
  });
});

fs.writeFileSync('src/lib/csvImportData.json', JSON.stringify(yearSubmissionsMap, null, 2));
console.log('Successfully Parsed Excel TDC-UTL.xlsx! Total Submissions Generated:', yearSubmissionsMap[2569].length);
