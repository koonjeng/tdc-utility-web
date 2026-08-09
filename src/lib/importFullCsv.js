const fs = require('fs');

function parseCsv(str) {
  const arr = [];
  let quote = false;
  let row = [''];
  for (let c of str) {
    if (c === '"') {
      quote = !quote;
    } else if (c === ',' && !quote) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !quote) {
      if (c === '\n') {
        arr.push(row);
        row = [''];
      }
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== '') arr.push(row);
  return arr;
}

const content = fs.readFileSync('TDC-UTL(ปริมาณน้ำเสีย).csv', 'utf8');
const rows = parseCsv(content);
const monthMap = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};
const yearSubmissionsMap = {};
let count = 0;

for (let r = 0; r < rows.length; r++) {
  const cols = rows[r];
  const dateStr = (cols[0] || '').trim();
  if (!dateStr || !dateStr.includes('-')) continue;

  const parts = dateStr.split('-');
  if (parts.length !== 3) continue;

  const d = parts[0].padStart(2, '0');
  const mCode = parts[1];
  const monthNum = monthMap[mCode];
  if (!monthNum) continue;

  const monthStr = String(monthNum).padStart(2, '0');
  const reportDate = '2026-' + monthStr + '-' + d;

  const fMod = parseFloat((cols[14] || '0').replace(/[^\d.]/g, '')) || 0;
  const fNat = parseFloat((cols[15] || '0').replace(/[^\d.]/g, '')) || 0;
  const tempIn = parseFloat((cols[3] || '0').replace(/[^\d.]/g, '')) || 0;
  const tempOut = parseFloat((cols[7] || '0').replace(/[^\d.]/g, '')) || 0;
  const alkOut = parseFloat((cols[8] || '0').replace(/[^\d.]/g, '')) || 0;
  const vfaOut = parseFloat((cols[9] || '0').replace(/[^\d.]/g, '')) || 0;
  const vfaAlk = parseFloat((cols[10] || '0').replace(/[^\d.]/g, '')) || 0;
  const codOut = parseFloat((cols[11] || '0').replace(/[^\d.]/g, '')) || 0;

  const yr = 2569;
  if (!yearSubmissionsMap[yr]) yearSubmissionsMap[yr] = [];

  yearSubmissionsMap[yr].push({
    id: 'sub_csv_' + reportDate + '_cat5',
    year: yr,
    month: monthNum,
    category_key: 'cat5',
    category_name: 'หมวดที่ 5: WWT & Biogas',
    report_date: reportDate,
    reporter_name: 'ระบบนำเข้าไฟล์ CSV (Auto Import)',
    approver_name: 'ระบบอนุมัติอัตโนมัติ (CSV Import)',
    status: 'approved',
    created_at: new Date().toISOString(),
    data: {
      report_date: reportDate,
      reporter_name: 'ระบบนำเข้าไฟล์ CSV (Auto Import)',
      approver_name: 'ระบบอนุมัติอัตโนมัติ (CSV Import)',
      wwt_cod_native: fNat,
      wwt_codt_mix1: fMod,
      wwt_cod_loading: fMod + fNat,
      wwt_cod_eff_as: codOut,
      biogas_temp: tempOut || tempIn || 0,
      biogas_removal: vfaAlk || 0,
      biogas_pct_ch4: alkOut || 0,
      biogas_pct_h2s: vfaOut || 0,
    },
  });
  count++;
}

fs.writeFileSync('src/lib/csvImportData.json', JSON.stringify(yearSubmissionsMap, null, 2));
console.log('Successfully Imported All 365 Days! Total Records Saved:', count);
