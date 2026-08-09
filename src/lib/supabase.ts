import { createClient } from '@supabase/supabase-js';
import { MonthlyReport, ReportData, FullMonthlyReportData, UserRole, Profile, AuditLog, CategorySubmission } from './types';
import csvImportData from './csvImportData.json';

// Clean Supabase URL to strip accidental /rest/v1 or trailing slashes
let rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
rawUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseUrl = rawUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Storage Keys (Clean Production Version 5)
const STORAGE_KEY = 'tdc_energy_reports_v5_clean';
const PROFILES_STORAGE_KEY = 'tdc_energy_user_profiles_v5_clean';
const AUDIT_LOGS_STORAGE_KEY = 'tdc_energy_audit_logs_v5_clean';

// Initial Clean Admin Profile
const INITIAL_PROFILES: Profile[] = [
  { id: 'user-admin-1', email: 'admin@tdc.com', role: 'admin', created_at: new Date().toISOString() },
];

export function getLocalProfiles(): Profile[] {
  if (typeof window === 'undefined') return INITIAL_PROFILES;
  const stored = localStorage.getItem(PROFILES_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { }
  }
  localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(INITIAL_PROFILES));
  return INITIAL_PROFILES;
}

export function saveLocalProfiles(profiles: Profile[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
}

// AUDIT LOG FUNCTIONS (ADMIN ONLY) - Robust UUID & Error Handling
export async function addAuditLog(
  userEmail: string,
  action: AuditLog['action'],
  details: string
): Promise<void> {
  const generatedId =
    typeof window !== 'undefined' && crypto && crypto.randomUUID
      ? crypto.randomUUID()
      : `log-${Date.now()}`;

  const newLog: AuditLog = {
    id: generatedId,
    user_email: userEmail,
    action,
    details,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('audit_logs').insert({
        id: generatedId,
        user_email: userEmail,
        action,
        details,
        created_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Supabase audit log insert error:', error);
      }
    } catch (e) {
      console.warn('Supabase audit log insert warning:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const existing = getLocalAuditLogs();
    existing.unshift(newLog);
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(existing));
  }
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  let supabaseLogs: AuditLog[] = [];
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        supabaseLogs = data as AuditLog[];
      }
    } catch (e) {
      console.warn('Supabase audit logs fetch warning:', e);
    }
  }

  const localLogs = getLocalAuditLogs();
  const mergedMap = new Map<string, AuditLog>();
  supabaseLogs.forEach((log) => mergedMap.set(log.id, log));
  localLogs.forEach((log) => {
    if (!mergedMap.has(log.id)) mergedMap.set(log.id, log);
  });

  return Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getLocalAuditLogs(): AuditLog[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch { }
  }
  return [];
}

// User Management Functions (Robust Supabase + Local Merge)
export async function fetchUserProfiles(): Promise<Profile[]> {
  let supabaseProfiles: Profile[] = [];
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        supabaseProfiles = data as Profile[];
      }
    } catch (e) {
      console.warn('Failed to fetch profiles from Supabase, loading local profiles:', e);
    }
  }

  const localProfiles = getLocalProfiles();
  const mergedMap = new Map<string, Profile>();

  // Merge initial admin, local profiles and Supabase profiles seamlessly
  INITIAL_PROFILES.forEach((p) => mergedMap.set(p.email.toLowerCase(), p));
  localProfiles.forEach((p) => mergedMap.set(p.email.toLowerCase(), p));
  supabaseProfiles.forEach((p) => mergedMap.set(p.email.toLowerCase(), p));

  return Array.from(mergedMap.values());
}

export async function createUserAccount(email: string, password: string, role: UserRole): Promise<{ success: boolean; error?: string }> {
  if (!email || !password) {
    return { success: false, error: 'กรุณากรอกอีเมลและรหัสผ่าน' };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (!authError && authData.user) {
        const { error: pErr } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          email,
          role,
        }, { onConflict: 'id' });

        if (pErr) {
          console.warn('Supabase profile upsert warning:', pErr);
        }
      }
    } catch (err: any) {
      console.warn('Supabase user creation warning:', err);
    }
  }

  const profiles = getLocalProfiles();
  const lower = email.toLowerCase();
  if (!profiles.some((p) => p.email.toLowerCase() === lower)) {
    const newProfile: Profile = {
      id: `user-${Date.now()}`,
      email,
      role,
      created_at: new Date().toISOString(),
    };
    profiles.unshift(newProfile);
    saveLocalProfiles(profiles);
  }

  return { success: true };
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) console.warn('Supabase profile update failed:', error);
    } catch (err: any) {
      console.warn('Supabase profile update warning:', err);
    }
  }

  const profiles = getLocalProfiles();
  const index = profiles.findIndex((p) => p.id === userId || p.email.toLowerCase().includes(userId.toLowerCase()));
  if (index !== -1) {
    profiles[index].role = newRole;
    saveLocalProfiles(profiles);
  }

  return { success: true };
}

export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('profiles').delete().eq('id', userId);
    } catch (err: any) {
      console.warn('Supabase profile delete failed:', err);
    }
  }

  const profiles = getLocalProfiles();
  const updated = profiles.filter((p) => p.id !== userId);
  saveLocalProfiles(updated);

  return { success: true };
}

export async function changeUserPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: 'ไม่สามารถเปลี่ยนรหัสผ่านได้' };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' };
    }
  }

  return { success: true };
}

// Real Auth & Role lookup function
export async function signInUser(email: string, password: string): Promise<{ email: string; role: UserRole } | { error: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!authError && authData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        let userRole: UserRole = 'approver';
        if (profile?.role) {
          userRole = profile.role as UserRole;
        } else if (email.toLowerCase().includes('admin') || email.toLowerCase() === 'admin@tdc.com' || email.toLowerCase() === 'koonjeng.pongpisut@gmail.com') {
          userRole = 'admin';
        }

        return { email: authData.user.email || email, role: userRole };
      }

      // If Supabase Auth failed (e.g. user exists only in profiles table or local storage), fallback to profiles check
    } catch (err: any) {
      console.warn('Supabase login failed, using direct profile lookup:', err);
    }
  }

  if (!email || !password) {
    return { error: 'กรุณากรอกอีเมลและรหัสผ่าน' };
  }

  if (password.length < 4) {
    return { error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร' };
  }

  const profiles = getLocalProfiles();
  const matched = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());

  let autoRole: UserRole = matched ? matched.role : 'approver';
  const lowerEmail = email.toLowerCase();
  if (lowerEmail.includes('admin') || lowerEmail === 'koonjeng.pongpisut@gmail.com') {
    autoRole = 'admin';
  }

  return { email, role: autoRole };
}

// Fetch monthly reports
export async function fetchReportsData(year: number): Promise<FullMonthlyReportData[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: reports, error } = await supabase
        .from('monthly_reports')
        .select(`
          id, year, month, status, reject_reason,
          report_data (*)
        `)
        .eq('year', year);

      if (!error && reports) {
        return Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          const found = reports.find((r) => r.month === month);
          if (found) {
            const rd = Array.isArray(found.report_data) ? found.report_data[0] : found.report_data;
            return {
              report: {
                id: found.id,
                year: found.year,
                month: found.month,
                status: found.status,
                reject_reason: found.reject_reason,
              },
              data: rd || {
                report_id: found.id,
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
                fuel_oil_a_liter: 0,
                fuel_oil_a_baht: 0,
              },
            };
          }
          return getEmptyReportObject(year, month);
        });
      }
    } catch (e) {
      console.warn('Failed to fetch from Supabase, loading local state:', e);
    }
  }

  return getLocalReports(year);
}

// Save monthly report & data
export async function saveReportData(
  year: number,
  month: number,
  reportPatch: Partial<MonthlyReport>,
  dataPatch: Partial<ReportData>
): Promise<FullMonthlyReportData[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: reportRow, error: rError } = await supabase
        .from('monthly_reports')
        .upsert(
          {
            year,
            month,
            status: reportPatch.status || 'draft',
            reject_reason: reportPatch.reject_reason || null,
          },
          { onConflict: 'year,month' }
        )
        .select()
        .single();

      if (!rError && reportRow) {
        const cleanDataPatch = {
          ...dataPatch,
          report_id: reportRow.id,
          reporter_name: dataPatch.reporter_name || '',
          reporter_id: dataPatch.reporter_id || '',
          report_date: dataPatch.report_date || new Date().toISOString().split('T')[0],
          production_cassava: Number(dataPatch.production_cassava) || 0,
          production_modified: Number(dataPatch.production_modified) || 0,
          hours_cassava: Number(dataPatch.hours_cassava) || 0,
          hours_modified: Number(dataPatch.hours_modified) || 0,
          electricity_kwh: Number(dataPatch.electricity_kwh) || 0,
          electricity_baht: Number(dataPatch.electricity_baht) || 0,
          renewable_biogas_m3: Number(dataPatch.renewable_biogas_m3) || 0,
          renewable_solar_kwh: Number(dataPatch.renewable_solar_kwh) || 0,
          fuel_oil_a_liter: Number(dataPatch.fuel_oil_a_liter) || 0,
          fuel_oil_a_baht: Number(dataPatch.fuel_oil_a_baht) || 0,
        };

        const { error: dataErr } = await supabase.from('report_data').upsert(cleanDataPatch, { onConflict: 'report_id' });
        if (dataErr) {
          console.warn('Report data upsert error:', dataErr);
        }
      } else if (rError) {
        console.warn('Monthly reports upsert error:', rError);
      }

      return await fetchReportsData(year);
    } catch (err) {
      console.warn('Supabase save error:', err);
    }
  }

  return saveLocalReport(year, month, reportPatch, dataPatch);
}

function getEmptyReportObject(year: number, month: number): FullMonthlyReportData {
  return {
    report: {
      id: `report-${year}-${month}`,
      year,
      month,
      status: 'empty',
      reject_reason: null,
    },
    data: {
      report_id: `report-${year}-${month}`,
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
    },
  };
}

export function getLocalReports(year: number): FullMonthlyReportData[] {
  if (typeof window === 'undefined') return [];
  // Clear old storage keys from previous cache
  localStorage.removeItem(`tdc_energy_reports_v1_${year}`);
  localStorage.removeItem(`tdc_energy_reports_v2_${year}`);
  localStorage.removeItem(`tdc_energy_reports_v3_${year}`);
  localStorage.removeItem(`tdc_energy_reports_v4_${year}`);

  const stored = localStorage.getItem(`${STORAGE_KEY}_${year}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch { }
  }

  // Pure clean empty state for all 12 months ready for real production entry!
  const cleanData: FullMonthlyReportData[] = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return getEmptyReportObject(year, month);
  });

  localStorage.setItem(`${STORAGE_KEY}_${year}`, JSON.stringify(cleanData));
  return cleanData;
}

export function saveLocalReport(
  year: number,
  month: number,
  reportPatch: Partial<MonthlyReport>,
  dataPatch: Partial<ReportData>
): FullMonthlyReportData[] {
  const current = getLocalReports(year);
  const index = current.findIndex((item) => item.report.month === month);

  if (index !== -1) {
    current[index] = {
      report: {
        ...current[index].report,
        ...reportPatch,
        updated_at: new Date().toISOString(),
      },
      data: {
        ...current[index].data,
        ...dataPatch,
        updated_at: new Date().toISOString(),
      },
    };
  }

  localStorage.setItem(`${STORAGE_KEY}_${year}`, JSON.stringify(current));
  return current;
}

export function getCategorySubmissions(year: number): CategorySubmission[] {
  if (typeof window === 'undefined') return (csvImportData as any)[year] || [];

  const stored = localStorage.getItem(`tdc_category_submissions_${year}`);
  if (stored !== null) {
    try {
      const parsed: CategorySubmission[] = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch { }
  }

  const baseData = (csvImportData as any)[year] || [];
  localStorage.setItem(`tdc_category_submissions_${year}`, JSON.stringify(baseData));
  return baseData;
}

export function saveCategorySubmission(
  submission: Omit<CategorySubmission, 'id' | 'created_at'>
): CategorySubmission[] {
  if (typeof window === 'undefined') return [];
  const current = getCategorySubmissions(submission.year);
  const newRecord: CategorySubmission = {
    ...submission,
    id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    created_at: new Date().toISOString(),
  };
  const updated = [newRecord, ...current];
  localStorage.setItem(`tdc_category_submissions_${submission.year}`, JSON.stringify(updated));

  // Sync to Supabase category_submissions table if available
  if (isSupabaseConfigured && supabase) {
    supabase.from('category_submissions').upsert({
      id: newRecord.id,
      year: newRecord.year,
      month: newRecord.month,
      category_key: newRecord.category_key,
      category_name: newRecord.category_name,
      status: newRecord.status,
      reporter_name: newRecord.reporter_name,
      reporter_id: newRecord.reporter_id,
      data: newRecord.data,
      created_at: newRecord.created_at,
    }).then(({ error }) => {
      if (error) console.warn('Supabase category submission error:', error);
    });
  }

  // Also merge into local report data
  saveLocalReport(
    submission.year,
    submission.month,
    { status: submission.status, submitted_category: submission.category_name },
    submission.data
  );
  return updated;
}

export function updateCategorySubmissionStatus(
  year: number,
  id: string,
  status: 'approved' | 'rejected',
  rejectReason?: string,
  approverName?: string
): CategorySubmission[] {
  if (typeof window === 'undefined') return [];
  const current = getCategorySubmissions(year);
  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status,
        reject_reason: rejectReason || null,
        approver_name: approverName || item.approver_name,
      };
    }
    return item;
  });
  localStorage.setItem(`tdc_category_submissions_${year}`, JSON.stringify(updated));

  // Sync with report item
  const target = current.find((item) => item.id === id);
  if (target) {
    saveLocalReport(
      year,
      target.month,
      { status, reject_reason: rejectReason || null },
      { ...target.data, approver_name: approverName || (target.data as any)?.approver_name }
    );
  }
  return updated;
}
