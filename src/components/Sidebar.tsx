'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  BookOpen,
  Zap,
  LogOut,
  ShieldCheck,
  UserCheck,
  Users,
  Settings,
  Clock,
  Menu,
  X,
  Database,
  Wrench,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import { UserRole, FullMonthlyReportData } from '@/lib/types';
import { getCategorySubmissions } from '@/lib/supabase';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: { email: string; role: UserRole } | null;
  reportsData: FullMonthlyReportData[];
  onLogout: () => void;
  onOpenLogin: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: number | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  reportsData,
  onLogout,
  onOpenLogin,
}) => {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const monthlyPendingCount = reportsData.filter((r) => r.report.status === 'pending').length;
  const pendingCount = monthlyPendingCount;

  const hasRole = Boolean(currentUser && (currentUser.role === 'admin' || currentUser.role === 'approver'));

  const menuItems: MenuItem[] = [];

  if (hasRole) {
    menuItems.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null });
    menuItems.push({ id: 'energy-report', label: 'A4 Report', icon: FileText, badge: null });
  }
  menuItems.push({ id: 'data-entry', label: 'Daily Report', icon: FileSpreadsheet, badge: null });
  menuItems.push({ id: 'maintenance', label: 'PM', icon: Wrench, badge: null });
  if (hasRole) {
    menuItems.push({
      id: 'pending',
      label: 'Pending',
      icon: Clock,
      badge: pendingCount > 0 ? pendingCount : null,
    });
    menuItems.push({ id: 'history', label: 'History', icon: Database, badge: null });
    menuItems.push({ id: 'troubleshooting', label: 'Troubleshoot', icon: ShieldAlert, badge: null });

    menuItems.push({ id: 'playbook', label: 'คู่มือ', icon: BookOpen, badge: null });
  }

  if (currentUser?.role === 'admin') {
    menuItems.push({ id: 'users', label: 'จัดการผู้ใช้งาน', icon: Users, badge: null });
  }

  if (currentUser) {
    menuItems.push({ id: 'settings', label: 'ตั้งค่าบัญชี', icon: Settings, badge: null });
  }

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Top Header & Menu */}
      <div className="flex flex-col min-h-0 overflow-y-auto">
        {/* Brand Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <Zap className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div className="overflow-hidden">
              <h1 className="font-bold text-lg leading-tight tracking-wide text-slate-100 truncate">
                TDC Utility
              </h1>
            </div>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5 flex-1">
          <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            เมนูหลัก
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-sky-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-black rounded-full ${isActive ? 'bg-slate-950 text-sky-400' : 'bg-amber-500 text-slate-950 animate-pulse'
                      }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Info / Role Footer */}
      <div className="p-4 border-t border-slate-700/60 bg-slate-900/80 shrink-0 mt-auto">
        {currentUser ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs font-semibold text-slate-200 truncate"
                  title={currentUser.email}
                >
                  {currentUser.email}
                </p>
                <span className="inline-block px-1.5 py-0.5 text-[10px] uppercase font-extrabold rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {currentUser.role}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onLogout();
                setMobileOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800/90 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800/50 rounded-xl border border-slate-700 transition-all shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <UserCheck className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="truncate">โหมดพนักงานลงข้อมูล (No Login)</span>
            </div>
            <button
              onClick={() => {
                onOpenLogin();
                setMobileOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-600 rounded-xl transition-all border border-sky-600 shadow-sm"
            >
              เข้าสู่ระบบสำหรับ ผู้อนุมัติ
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE TOP BAR (Only visible on screens < md) */}
      <div className="w-full md:hidden bg-[#1e293b] text-white px-4 py-3 border-b border-slate-700 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-400 to-cyan-500 flex items-center justify-center shadow-md">
            <Zap className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100 leading-tight">TDC Utility</h1>
            <p className="text-[10px] text-sky-300 font-medium">Utility Report</p>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl border border-slate-700 transition-all"
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 bg-[#1e293b] text-white flex flex-col h-full shadow-2xl z-50 animate-in slide-in-from-left duration-200 border-r border-slate-700">
            {navContent}
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR (Visible on screens >= md) */}
      <aside className="hidden md:flex w-64 bg-[#1e293b] text-white flex-col justify-between h-screen sticky top-0 shadow-xl z-20 shrink-0 border-r border-slate-700/50">
        {navContent}
      </aside>
    </>
  );
};
