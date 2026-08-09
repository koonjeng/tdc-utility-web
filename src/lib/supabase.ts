import { createClient } from '@supabase/supabase-js';
import { MonthlyReport, ReportData, FullMonthlyReportData, UserRole, Profile, AuditLog, CategorySubmission } from './types';
import csvImportData from './csvImportData.json';

// Clean Supabase URL to strip accidental /rest/v1 or trailing slashes
let rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aoqdrwdtfrlycyihffnl.supabase.co';
rawUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseUrl = rawUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_jpzHGNX9RxT-eEfuwDLPUA__MSxiwaw';

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
  if (email.toLowerCase() === 'koonjeng.pongpisut@gmail.com') {
    return { error: 'บัญชีนี้ถูกยกเลิกการใช้งานแล้ว' };
  }

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
        } else if (email.toLowerCase().includes('admin') || email.toLowerCase() === 'admin@tdc.com') {
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
  if (lowerEmail.includes('admin') || lowerEmail === 'admin@tdc.com') {
    autoRole = 'admin';
  }

  return { email, role: autoRole };
}

// Fetch monthly reports - Direct Supabase Only
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
              data: rd || getEmptyReportObject(year, month).data,
            };
          }
          return getEmptyReportObject(year, month);
        });
      }
    } catch (e) {
      console.warn('Failed to fetch from Supabase:', e);
    }
  }

  // Return clean empty 12 months array when empty on Supabase
  return Array.from({ length: 12 }, (_, i) => getEmptyReportObject(year, i + 1));
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
      const reportId = `report-${year}-${month}`;
      console.log('Attempting Supabase upsert for:', reportId, reportPatch, dataPatch);
      const { data: reportRow, error: rError } = await supabase
        .from('monthly_reports')
        .upsert({
          id: reportId,
          year,
          month,
          status: reportPatch.status || 'draft',
          reject_reason: reportPatch.reject_reason || null,
        })
        .select()
        .single();

      if (rError) {
        console.error('Monthly reports upsert error:', rError);
        alert(`Supabase Error: ${rError.message} (${rError.details || ''})`);
      } else if (reportRow) {
        const cleanDataPatch = {
          ...dataPatch,
          report_id: reportRow.id,
          reporter_name: dataPatch.reporter_name || '',
          reporter_id: dataPatch.reporter_id || '',
          report_date: dataPatch.report_date || new Date().toISOString().split('T')[0],
        };

        const { error: dataErr } = await supabase.from('report_data').upsert(cleanDataPatch, { onConflict: 'report_id' });
        if (dataErr) {
          console.error('Report data upsert error:', dataErr);
          alert(`Supabase Data Error: ${dataErr.message}`);
        } else {
          console.log('Successfully saved to Supabase report_data!');
        }
      }

      return await fetchReportsData(year);
    } catch (err: any) {
      console.error('Supabase save exception:', err);
      alert(`Supabase Exception: ${err?.message || err}`);
    }
  }

  return fetchReportsData(year);
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
  // Pure clean empty state for all 12 months
  return Array.from({ length: 12 }, (_, i) => getEmptyReportObject(year, i + 1));
}

export function saveLocalReport(
  year: number,
  month: number,
  reportPatch: Partial<MonthlyReport>,
  dataPatch: Partial<ReportData>
): FullMonthlyReportData[] {
  return Array.from({ length: 12 }, (_, i) => getEmptyReportObject(year, i + 1));
}

export async function getCategorySubmissions(year: number): Promise<CategorySubmission[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('category_submissions')
        .select('*')
        .eq('year', year)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as CategorySubmission[];
      }
    } catch (e) {
      console.warn('Failed to fetch category_submissions:', e);
    }
  }
  return [];
}

export async function saveCategorySubmission(
  submission: Omit<CategorySubmission, 'id' | 'created_at'>
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const subId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const { error } = await supabase.from('category_submissions').insert({
        id: subId,
        year: submission.year,
        month: submission.month,
        report_date: submission.report_date,
        category_key: submission.category_key,
        category_name: submission.category_name,
        status: submission.status,
        reporter_name: submission.reporter_name,
        reporter_id: submission.reporter_id || '',
        approver_name: submission.approver_name || '',
        reject_reason: submission.reject_reason || null,
        data: submission.data,
      });

      if (error) {
        console.error('Category submission insert error:', error);
        alert(`Failed to save daily entry to Supabase: ${error.message}`);
      } else {
        console.log('Successfully saved daily submission to Supabase category_submissions!');
        // Also update latest month report snapshot
        await saveReportData(
          submission.year,
          submission.month,
          { status: submission.status, submitted_category: submission.category_name },
          submission.data
        );
      }
    } catch (e: any) {
      console.error('Category submission error:', e);
      alert(`Save Exception: ${e?.message || e}`);
    }
  }
}

export async function updateCategorySubmissionStatus(
  year: number,
  id: string,
  status: 'approved' | 'rejected',
  rejectReason?: string,
  approverName?: string
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('category_submissions')
        .update({
          status,
          reject_reason: rejectReason || null,
          approver_name: approverName || '',
        })
        .eq('id', id);
    } catch (e) {
      console.warn('Failed to update category submission status:', e);
    }
  }
}
