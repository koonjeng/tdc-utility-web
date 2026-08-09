'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { LandingPage } from '@/components/LandingPage';
import { DashboardView } from '@/components/DashboardView';
import { DataEntryForm } from '@/components/DataEntryForm';
import { PendingApprovalsView } from '@/components/PendingApprovalsView';
import { PlaybookView } from '@/components/PlaybookView';
import { UserManagementView } from '@/components/UserManagementView';
import { AccountSettingsView } from '@/components/AccountSettingsView';
import { DataHistoryView } from '@/components/DataHistoryView';
import { MaintenanceView } from '@/components/MaintenanceView';
import { TroubleshootingView } from '@/components/TroubleshootingView';
import { EnergyReportView } from '@/components/EnergyReportView';
import { LoadingScreen } from '@/components/LoadingScreen';
import { UserRole, FullMonthlyReportData, ReportData } from '@/lib/types';
import { fetchReportsData, saveReportData, addAuditLog } from '@/lib/supabase';
import { MONTH_NAMES_TH } from '@/lib/calculations';

export default function Home() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewState, setViewState] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedYear, setSelectedYear] = useState<number>(2569);
  const [availableYears, setAvailableYears] = useState<number[]>([2570, 2569, 2568, 2567, 2566]);
  const [selectedMonth, setSelectedMonth] = useState<number>(5); // May by default
  const [currentUser, setCurrentUser] = useState<{ email: string; role: UserRole } | null>(null);

  const [reportsData, setReportsData] = useState<FullMonthlyReportData[]>([]);
  const [prevReportsData, setPrevReportsData] = useState<FullMonthlyReportData[]>([]);

  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Restore user session & active tab on initial mount
  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem('tdc_auth_user');
      const savedTab = localStorage.getItem('tdc_active_tab');
      if (savedUserStr) {
        if (savedUserStr === 'reporter_guest') {
          setCurrentUser(null);
          setViewState('app');
          setActiveTab(savedTab || 'data-entry');
        } else {
          const user = JSON.parse(savedUserStr);
          setCurrentUser(user);
          setViewState('app');
          setActiveTab(savedTab || 'dashboard');
        }
      }
    } catch {}
    setIsInitialized(true);
  }, []);

  // Load data whenever selectedYear changes
  useEffect(() => {
    async function loadData() {
      const currentData = await fetchReportsData(selectedYear);
      const prevData = await fetchReportsData(selectedYear - 1);
      setReportsData(currentData);
      setPrevReportsData(prevData);
    }
    loadData();
  }, [selectedYear]);

  // Handlers
  const handleContinueAsReporter = () => {
    setCurrentUser(null); // Reporter role without login
    setViewState('app');
    setActiveTab('data-entry');
    localStorage.setItem('tdc_auth_user', 'reporter_guest');
    localStorage.setItem('tdc_active_tab', 'data-entry');
  };

  const handleLoginSuccess = (user: { email: string; role: UserRole }) => {
    setCurrentUser(user);
    setViewState('app');
    setActiveTab('dashboard');
    localStorage.setItem('tdc_auth_user', JSON.stringify(user));
    localStorage.setItem('tdc_active_tab', 'dashboard');
  };

  if (!isInitialized || isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  if (viewState === 'landing') {
    return (
      <LandingPage
        onContinueAsReporter={handleContinueAsReporter}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem('tdc_active_tab', tab);
  };

  // Add next year dynamically
  const handleAddNextYear = () => {
    const maxYear = Math.max(...availableYears);
    const nextYear = maxYear + 1;
    setAvailableYears((prev) => [nextYear, ...prev]);
    setSelectedYear(nextYear);
  };

  // Handlers
  const handleLogout = () => {
    setCurrentUser(null);
    setViewState('landing');
    localStorage.removeItem('tdc_auth_user');
    localStorage.removeItem('tdc_active_tab');
  };

  const handleOpenLogin = () => {
    setViewState('landing');
  };

  const handleSaveDraft = async (month: number, data: Partial<ReportData>) => {
    const updated = await saveReportData(selectedYear, month, { status: 'draft', reject_reason: null }, data);
    setReportsData([...updated]);
  };

  const handleSubmitApproval = async (month: number, data: Partial<ReportData>) => {
    const updated = await saveReportData(selectedYear, month, { status: 'pending' }, data);
    setReportsData([...updated]);

    await addAuditLog(
      currentUser?.email || 'Reporter',
      'SUBMIT',
      `ส่งคำขออนุมัติรายงานประจำเดือน ${MONTH_NAMES_TH[month - 1]} พ.ศ. ${selectedYear}`
    );
  };

  const handleApproveReport = async (month: number) => {
    const current = reportsData.find((r) => r.report.month === month);
    const updated = await saveReportData(selectedYear, month, { status: 'approved' }, current?.data || {});
    setReportsData([...updated]);

    await addAuditLog(
      currentUser?.email || 'Approver',
      'APPROVE',
      `อนุมัติรายงานประจำเดือน ${MONTH_NAMES_TH[month - 1]} พ.ศ. ${selectedYear}`
    );
  };

  const handleRejectReport = async (month: number, reason: string) => {
    const current = reportsData.find((r) => r.report.month === month);
    const updated = await saveReportData(
      selectedYear,
      month,
      { status: 'draft', reject_reason: reason },
      current?.data || {}
    );
    setReportsData([...updated]);

    await addAuditLog(
      currentUser?.email || 'Approver',
      'REJECT',
      `ตีกลับรายงานประจำเดือน ${MONTH_NAMES_TH[month - 1]} พ.ศ. ${selectedYear} (เหตุผล: ${reason})`
    );
  };

  const handleSelectMonthFromDashboard = (month: number) => {
    setSelectedMonth(month);
    setActiveTab('data-entry');
  };

  const handleInspectFromPending = (month: number) => {
    setSelectedMonth(month);
    setActiveTab('data-entry');
  };

  const getTitle = () => {
    if (activeTab === 'dashboard') return 'แดชบอร์ดแผนกพลังงาน';
    if (activeTab === 'data-entry') return 'ลงข้อมูลรายวัน';
    if (activeTab === 'energy-report') return 'รายงานพลังงานองค์รวม (Energy Report)';
    if (activeTab === 'maintenance') return 'แผนงานและประวัติซ่อมบำรุง (Maintenance PM)';
    if (activeTab === 'troubleshooting') return 'คู่มือวิเคราะห์และแก้ไขปัญหา (Troubleshooting Guide)';
    if (activeTab === 'history') return 'ค้นหาและดูข้อมูลที่บันทึกไว้ (Data Explorer)';
    if (activeTab === 'pending') return 'รายการรออนุมัติ (Pending Approvals)';
    if (activeTab === 'users') return 'จัดการผู้ใช้งานและประวัติการอนุมัติ (Admin Console)';
    if (activeTab === 'settings') return 'ตั้งค่าบัญชีผู้ใช้';
    return 'Playbook (คู่มือการทำงาน)';
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        currentUser={currentUser}
        reportsData={reportsData}
        onLogout={handleLogout}
        onOpenLogin={handleOpenLogin}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={getTitle()}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          availableYears={availableYears}
          onAddNextYear={handleAddNextYear}
          currentUser={currentUser}
          reportsData={reportsData}
        />

        <main className="flex-1">
          {activeTab === 'dashboard' && (
            Boolean(currentUser && (currentUser.role === 'admin' || currentUser.role === 'approver')) ? (
              <DashboardView
                selectedYear={selectedYear}
                reportsData={reportsData}
                prevReportsData={prevReportsData}
                onSelectMonth={handleSelectMonthFromDashboard}
              />
            ) : (
              <div className="p-8 text-center bg-white m-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-rose-600">จำกัดสิทธิ์การเข้าถึง (Access Denied)</h3>
                <p className="text-xs text-slate-500">
                  หน้า Dashboard อนุญาตให้เฉพาะผู้ใช้งานที่มีสิทธิ์อนุมัติ (Approver / Admin) เข้าดูข้อมูลได้เท่านั้น
                </p>
              </div>
            )
          )}

          {activeTab === 'data-entry' && (
            <DataEntryForm
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              reportsData={reportsData}
              currentUser={currentUser}
              onSaveDraft={handleSaveDraft}
              onSubmitApproval={handleSubmitApproval}
              onApproveReport={handleApproveReport}
              onRejectReport={handleRejectReport}
            />
          )}

          {activeTab === 'energy-report' && (
            <EnergyReportView
              selectedYear={selectedYear}
              reportsData={reportsData}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'maintenance' && <MaintenanceView currentUser={currentUser} />}

          {activeTab === 'troubleshooting' && <TroubleshootingView />}

          {activeTab === 'history' && (
            Boolean(currentUser && (currentUser.role === 'admin' || currentUser.role === 'approver')) ? (
              <DataHistoryView
                selectedYear={selectedYear}
                reportsData={reportsData}
                currentUser={currentUser}
                onSelectMonth={handleSelectMonthFromDashboard}
              />
            ) : (
              <div className="p-8 text-center bg-white m-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-rose-600">จำกัดสิทธิ์การเข้าถึง (Access Denied)</h3>
                <p className="text-xs text-slate-500">
                  หน้านี้อนุญาตให้เฉพาะผู้ใช้งานที่มีสิทธิ์อนุมัติ (Approver / Admin) เข้าดูข้อมูลได้เท่านั้น
                </p>
              </div>
            )
          )}

          {activeTab === 'pending' && (
            <PendingApprovalsView
              selectedYear={selectedYear}
              reportsData={reportsData}
              currentUser={currentUser}
              onApproveReport={handleApproveReport}
              onRejectReport={handleRejectReport}
              onInspectReport={handleInspectFromPending}
            />
          )}

          {activeTab === 'playbook' && (
            Boolean(currentUser && (currentUser.role === 'admin' || currentUser.role === 'approver')) ? (
              <PlaybookView />
            ) : (
              <div className="p-8 text-center bg-white m-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-rose-600">จำกัดสิทธิ์การเข้าถึง (Access Denied)</h3>
                <p className="text-xs text-slate-500">
                  หน้า Playbook (คู่มือการทำงาน) อนุญาตให้เฉพาะผู้ใช้งานที่มีสิทธิ์อนุมัติ (Approver / Admin) เข้าดูได้เท่านั้น
                </p>
              </div>
            )
          )}

          {activeTab === 'users' && <UserManagementView currentUser={currentUser} />}

          {activeTab === 'settings' && <AccountSettingsView currentUser={currentUser} />}
        </main>
      </div>
    </div>
  );
}
