'use client';

import React, { useState, useEffect } from 'react';
import { Settings, KeyRound, Lock, CheckCircle2, AlertCircle, ShieldCheck, User, Save, Loader2 } from 'lucide-react';
import { UserRole } from '@/lib/types';
import { changeUserPassword } from '@/lib/supabase';

interface AccountSettingsViewProps {
  currentUser: { email: string; role: UserRole } | null;
}

export const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({ currentUser }) => {
  const [displayName, setDisplayName] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load display name from localStorage
  useEffect(() => {
    if (currentUser?.email) {
      try {
        const savedName = localStorage.getItem(`tdc_user_display_name_${currentUser.email}`);
        if (savedName) {
          setDisplayName(savedName);
        } else {
          setDisplayName(currentUser.email.split('@')[0]);
        }
      } catch {}
    }
  }, [currentUser]);

  const handleSaveDisplayName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.email) return;
    if (!displayName.trim()) {
      setNotification({ type: 'error', message: 'กรุณากรอกชื่อแสดงในระบบ' });
      return;
    }

    try {
      localStorage.setItem(`tdc_user_display_name_${currentUser.email}`, displayName.trim());
      setNotification({ type: 'success', message: 'บันทึกชื่อแสดงในระบบ (Usrdisplay) เรียบร้อยแล้ว! ชื่อนี้จะถูกนำไปใช้ในรายงานโดยอัตโนมัติ' });
    } catch {
      setNotification({ type: 'error', message: 'ไม่สามารถบันทึกข้อมูลได้' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!newPassword || !confirmPassword) {
      setNotification({ type: 'error', message: 'กรุณากรอกรหัสผ่านใหม่ให้ครบถ้วน' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotification({ type: 'error', message: 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน' });
      return;
    }

    if (newPassword.length < 6) {
      setNotification({ type: 'error', message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
      return;
    }

    setLoading(true);
    const res = await changeUserPassword(currentPassword, newPassword);
    setLoading(false);

    if (res.success) {
      setNotification({ type: 'success', message: 'เปลี่ยนรหัสผ่านสำเร็จแล้ว!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setNotification({ type: 'error', message: res.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้' });
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-[calc(100vh-73px)] space-y-6 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 shadow-md">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">ตั้งค่าบัญชีผู้ใช้ (Account Settings)</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            จัดการรหัสผ่านและข้อมูลความปลอดภัยส่วนบุคคล
          </p>
        </div>
      </div>

      {/* CURRENT USER PROFILE CARD */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>ข้อมูลบัญชีผู้ใช้ปัจจุบัน</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block text-slate-500 mb-1">อีเมลผู้ใช้งาน</span>
            <span className="block text-sm font-bold text-slate-900">{currentUser?.email || '-'}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block text-slate-500 mb-1">สิทธิ์การใช้งาน (Role)</span>
            <span className="inline-block px-2.5 py-0.5 text-xs font-extrabold uppercase rounded bg-emerald-500/20 text-emerald-700 border border-emerald-500/30">
              {currentUser?.role || 'REPORTER'}
            </span>
          </div>
        </div>
      </div>

      {/* DISPLAY NAME (Usrdisplay) CARD */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-sky-600" />
          <span>ตั้งค่าชื่อแสดงในระบบ (Usrdisplay)</span>
        </h3>

        <form onSubmit={handleSaveDisplayName} className="space-y-4 max-w-md">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">
              ชื่อแสดงในรายงานอัตโนมัติ (Display Name) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="เช่น นายสมชาย ใจดี"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 font-bold"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              * ชื่อนี้จะถูกเติมลงในช่อง <strong>"ผู้ลงข้อมูล / ผู้รายงาน"</strong> ในฟอร์มทำรายงานและบันทึกผลการซ่อมบำรุงโดยอัตโนมัติ
            </p>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-sky-700 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกชื่อแสดงในระบบ</span>
          </button>
        </form>
      </div>

      {/* CHANGE PASSWORD FORM */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-slate-700" />
          <span>เปลี่ยนรหัสผ่าน (Change Password)</span>
        </h3>

        {notification && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">
              รหัสผ่านปัจจุบัน (Current Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">
              รหัสผ่านใหม่ (New Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">
              ยืนยันรหัสผ่านใหม่ (Confirm New Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : null}
            <span>บันทึกรหัสผ่านใหม่</span>
          </button>
        </form>
      </div>
    </div>
  );
};
