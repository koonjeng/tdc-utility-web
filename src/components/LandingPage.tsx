'use client';

import React, { useState } from 'react';
import { Zap, ArrowRight, Lock, Mail, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { UserRole } from '@/lib/types';
import { signInUser } from '@/lib/supabase';

interface LandingPageProps {
  onContinueAsReporter: () => void;
  onLoginSuccess: (user: { email: string; role: UserRole }) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onContinueAsReporter,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setLoading(true);

    try {
      const result = await signInUser(email, password);
      setLoading(false);

      if ('error' in result) {
        setError(result.error);
        return;
      }

      // Direct login based on auto-detected profile role!
      onLoginSuccess({
        email: result.email,
        role: result.role,
      });
    } catch (err: any) {
      setLoading(false);
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorator */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header / Logo */}
      <div className="text-center mb-8 z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/20 mb-4">
          <Zap className="w-8 h-8 fill-slate-950" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">TDC Utility</h1>
        <p className="text-sm text-slate-400 mt-1">
          ระบบบันทึกและอนุมัติข้อมูลการใช้พลังงานประจำเดือน
        </p>
      </div>

      {/* Main Dual-Action White Card (Matching User Reference Image) */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-10 border border-slate-200">
        {/* TOP SECTION: Reporter Fast Entry (Green Card) */}
        <div className="p-6 bg-gradient-to-b from-emerald-50 to-white border-b border-emerald-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              สำหรับพนักงานกรอกข้อมูล
            </span>
          </div>

          <button
            onClick={onContinueAsReporter}
            className="w-full group py-4 px-5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 rounded-xl font-bold text-base shadow-lg shadow-emerald-500/25 transition-all duration-200 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 text-left">
              <CheckCircle2 className="w-6 h-6 text-slate-950 flex-shrink-0" />
              <div>
                <span className="block text-slate-950 leading-tight">
                  พนักงานลงข้อมูล — เข้าใช้งานได้เลย
                </span>
                <span className="block text-xs font-semibold text-slate-900/80">
                  ไม่ต้องใช้รหัสผ่าน (No Login Required)
                </span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-950 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* DIVIDER */}
        <div className="relative py-2 bg-slate-50 flex items-center justify-center border-b border-slate-200">
          <div className="absolute inset-0 flex items-center px-6">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative px-3 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            หรือ เข้าสู่ระบบสำหรับผู้อนุมัติ
          </span>
        </div>

        {/* BOTTOM SECTION: Clean Login Form (No Role Selector needed!) */}
        <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-800">
              เข้าสู่ระบบผู้อนุมัติ (Approver / Admin)
            </h3>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">อีเมล (Email)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-800 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">รหัสผ่าน (Password)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-900 active:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <span>เข้าสู่ระบบ (Sign In)</span>
            )}
          </button>
        </form>
      </div>

      <p className="text-xs text-slate-500 mt-6 z-10 font-medium">
        TDC Energy Management System © 2026. All rights reserved.
      </p>
    </div>
  );
};
