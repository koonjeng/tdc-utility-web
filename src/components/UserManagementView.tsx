'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Trash2,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCheck,
  Activity,
  Check,
  XCircle,
  Send,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Profile, UserRole, AuditLog } from '@/lib/types';
import {
  fetchUserProfiles,
  createUserAccount,
  updateUserRole,
  deleteUserAccount,
  fetchAuditLogs,
  addAuditLog,
} from '@/lib/supabase';

interface UserManagementViewProps {
  currentUser?: { email: string; role: UserRole } | null;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'audit-logs'>('users');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination states for Audit Logs
  const [auditLogPage, setAuditLogPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  // Pagination states for Users
  const [userPage, setUserPage] = useState<number>(1);
  const [usersPerPage, setUsersPerPage] = useState<number>(10);

  // Form states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newRole, setNewRole] = useState<UserRole>('approver');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const users = await fetchUserProfiles();
    const logs = await fetchAuditLogs();
    setProfiles(users);
    setAuditLogs(logs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerNotify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) {
      triggerNotify('error', 'กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    const res = await createUserAccount(newEmail, newPassword, newRole);
    setSubmitting(false);

    if (res.success) {
      await addAuditLog(
        currentUser?.email || 'Admin',
        'CREATE_USER',
        `สร้างบัญชีผู้ใช้ใหม่ ${newEmail} (${newRole.toUpperCase()})`
      );
      triggerNotify('success', `สร้างบัญชี ${newEmail} สำเร็จแล้ว`);
      setNewEmail('');
      setNewPassword('');
      setNewRole('approver');
      setShowCreateModal(false);
      loadData();
    } else {
      triggerNotify('error', res.error || 'เกิดข้อผิดพลาดในการสร้างบัญชี');
    }
  };

  const handleRoleChange = async (userId: string, userEmail: string, targetRole: UserRole) => {
    const res = await updateUserRole(userId, targetRole);
    if (res.success) {
      await addAuditLog(
        currentUser?.email || 'Admin',
        'UPDATE_ROLE',
        `เปลี่ยนสิทธิ์ผู้ใช้ ${userEmail} เป็น ${targetRole.toUpperCase()}`
      );
      triggerNotify('success', 'อัปเดตสิทธิ์การใช้งานสำเร็จแล้ว');
      loadData();
    } else {
      triggerNotify('error', res.error || 'ไม่สามารถอัปเดตสิทธิ์ได้');
    }
  };

  const handleDeleteUser = async (user: Profile) => {
    if (confirm(`คุณต้องการลบบัญชีผู้ใช้งาน ${user.email} หรือไม่?`)) {
      const res = await deleteUserAccount(user.id);
      if (res.success) {
        await addAuditLog(
          currentUser?.email || 'Admin',
          'DELETE_USER',
          `ลบบัญชีผู้ใช้ ${user.email}`
        );
        triggerNotify('success', `ลบบัญชี ${user.email} สำเร็จแล้ว`);
        loadData();
      } else {
        triggerNotify('error', 'เกิดข้อผิดพลาดในการลบบัญชี');
      }
    }
  };

  const adminCount = profiles.filter((p) => p.role === 'admin').length;
  const approverCount = profiles.filter((p) => p.role === 'approver').length;

  // Pagination Calculations for Audit Logs
  const totalAuditLogPages = Math.ceil(auditLogs.length / itemsPerPage) || 1;
  const startAuditIndex = (auditLogPage - 1) * itemsPerPage;
  const endAuditIndex = Math.min(startAuditIndex + itemsPerPage, auditLogs.length);
  const currentAuditLogs = auditLogs.slice(startAuditIndex, endAuditIndex);

  // Pagination Calculations for Users
  const totalUserPages = Math.ceil(profiles.length / usersPerPage) || 1;
  const startUserIndex = (userPage - 1) * usersPerPage;
  const endUserIndex = Math.min(startUserIndex + usersPerPage, profiles.length);
  const currentProfiles = profiles.slice(startUserIndex, endUserIndex);

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-[calc(100vh-73px)] space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-8 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border animate-bounce ${notification.type === 'success'
              ? 'bg-slate-900 text-white border-emerald-500/50'
              : 'bg-rose-900 text-white border-rose-500/50'
            }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {/* HEADER CARD WITH SUB-TAB TOGGLE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center shrink-0 shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">จัดการผู้ใช้งานและสิทธิ์ (Admin Console)</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              ดูแลสิทธิ์บัญชีผู้ใช้ และตรวจสอบประวัติการอนุมัติงานในระบบ (Audit Logs)
            </p>
          </div>
        </div>

        {/* SUB-TABS: USER LIST vs AUDIT LOGS */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'users'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>รายชื่อผู้ใช้ ({profiles.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('audit-logs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'audit-logs'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <Activity className="w-3.5 h-3.5 text-sky-600" />
            <span>ประวัติการอนุมัติ (Audit Logs)</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: USER LIST */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          {/* SUMMARY METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  ผู้ใช้งานทั้งหมด
                </span>
                <span className="block text-2xl font-black text-slate-900 mt-1">
                  {profiles.length} <span className="text-xs font-normal text-slate-500">คน</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  ผู้ดูแลระบบ (Admin)
                </span>
                <span className="block text-2xl font-black text-emerald-600 mt-1">
                  {adminCount} <span className="text-xs font-normal text-slate-500">คน</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  ผู้อนุมัติ (Approver)
                </span>
                <span className="block text-2xl font-black text-purple-600 mt-1">
                  {approverCount} <span className="text-xs font-normal text-slate-500">คน</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* USER LIST TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">รายชื่อผู้ใช้งานในระบบ</h3>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                <span>เพิ่มผู้ใช้งานใหม่</span>
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังโหลดรายชื่อผู้ใช้...</span>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3.5">อีเมลผู้ใช้งาน</th>
                        <th className="px-6 py-3.5">สิทธิ์การใช้งาน (Role)</th>
                        <th className="px-6 py-3.5">วันที่ลงทะเบียน</th>
                        <th className="px-6 py-3.5 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                      {currentProfiles.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">
                              {user.email.substring(0, 2).toUpperCase()}
                            </div>
                            <span>{user.email}</span>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, user.email, e.target.value as UserRole)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border focus:outline-none cursor-pointer ${user.role === 'admin'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-purple-50 text-purple-700 border-purple-300'
                                }`}
                            >
                              <option value="approver">Approver (ผู้อนุมัติ)</option>
                              <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString('th-TH') : '-'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="ลบบัญชีผู้ใช้"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* USER PAGINATION FOOTER */}
                {profiles.length > 0 && (
                  <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium">
                    <div>
                      แสดง <span className="font-bold text-slate-900">{startUserIndex + 1}</span> -{' '}
                      <span className="font-bold text-slate-900">{endUserIndex}</span> จากทั้งหมด{' '}
                      <span className="font-bold text-slate-900">{profiles.length}</span> รายการ
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setUserPage((p) => Math.max(p - 1, 1))}
                        disabled={userPage === 1}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 disabled:opacity-40 rounded-lg border border-slate-200 flex items-center gap-1 font-semibold"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>ย้อนกลับ</span>
                      </button>

                      <span className="px-3 py-1 font-bold text-slate-800">
                        {userPage} / {totalUserPages}
                      </span>

                      <button
                        onClick={() => setUserPage((p) => Math.min(p + 1, totalUserPages))}
                        disabled={userPage === totalUserPages}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 disabled:opacity-40 rounded-lg border border-slate-200 flex items-center gap-1 font-semibold"
                      >
                        <span>ถัดไป</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ADMIN AUDIT LOGS WITH PAGINATION */}
      {activeSubTab === 'audit-logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-400" />
              <div>
                <h3 className="font-bold text-sm">บันทึกประวัติการอนุมัติและกิจกรรมระบบ (Admin Audit Logs)</h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  แสดงประวัติการอนุมัติ ตีกลับ ส่งข้อมูล และการปรับสิทธิ์โดยผู้ใช้งานทุกคน
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-sky-300 border border-slate-700">
              เฉพาะ Admin
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>กำลังโหลดประวัติการอนุมัติ...</span>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold">
              ยังไม่มีบันทึกประวัติการอนุมัติในระบบ
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">วัน-เวลา (Timestamp)</th>
                      <th className="px-6 py-3.5">ผู้ดำเนินการ (User)</th>
                      <th className="px-6 py-3.5">กิจกรรม (Action)</th>
                      <th className="px-6 py-3.5">รายละเอียด (Details)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                    {currentAuditLogs.map((log) => {
                      let actionBadge: { bg: string; label: string } = {
                        bg: 'bg-slate-100 text-slate-700 border-slate-300',
                        label: log.action,
                      };

                      if (log.action === 'APPROVE') {
                        actionBadge = {
                          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
                          label: 'อนุมัติงาน',
                        };
                      } else if (log.action === 'REJECT') {
                        actionBadge = {
                          bg: 'bg-rose-50 text-rose-800 border-rose-300',
                          label: 'ตีกลับงาน',
                        };
                      } else if (log.action === 'SUBMIT') {
                        actionBadge = {
                          bg: 'bg-amber-50 text-amber-800 border-amber-300',
                          label: 'ส่งขออนุมัติ',
                        };
                      } else if (log.action === 'CREATE_USER' || log.action === 'UPDATE_ROLE' || log.action === 'DELETE_USER') {
                        actionBadge = {
                          bg: 'bg-sky-50 text-sky-800 border-sky-300',
                          label: 'จัดการผู้ใช้',
                        };
                      }

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString('th-TH')}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">
                            {log.user_email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold border ${actionBadge.bg}`}
                            >
                              {actionBadge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-700 font-semibold">
                            {log.details}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* AUDIT LOG PAGINATION FOOTER */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">แสดงต่อหน้า:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setAuditLogPage(1);
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-bold text-slate-800 focus:outline-none cursor-pointer shadow-2xs"
                  >
                    <option value={5}>5 รายการ</option>
                    <option value={10}>10 รายการ</option>
                    <option value={20}>20 รายการ</option>
                    <option value={50}>50 รายการ</option>
                  </select>
                  <span>
                    แสดง <span className="font-bold text-slate-900">{startAuditIndex + 1}</span> -{' '}
                    <span className="font-bold text-slate-900">{endAuditIndex}</span> จากทั้งหมด{' '}
                    <span className="font-bold text-slate-900">{auditLogs.length}</span> รายการ
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAuditLogPage((p) => Math.max(p - 1, 1))}
                    disabled={auditLogPage === 1}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 rounded-xl border border-slate-200 flex items-center gap-1 font-bold text-slate-700 shadow-2xs transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                    <span>ย้อนกลับ</span>
                  </button>

                  <span className="px-3 py-1 font-extrabold text-slate-800 bg-white rounded-lg border border-slate-200">
                    {auditLogPage} / {totalAuditLogPages}
                  </span>

                  <button
                    onClick={() => setAuditLogPage((p) => Math.min(p + 1, totalAuditLogPages))}
                    disabled={auditLogPage === totalAuditLogPages}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 rounded-xl border border-slate-200 flex items-center gap-1 font-bold text-slate-700 shadow-2xs transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span>ถัดไป</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE NEW USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">เพิ่มผู้ใช้งานใหม่</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">อีเมล (Email)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="newuser@tdcenergy.com"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-800"
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
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600">กำหนดสิทธิ์ (Role)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-800 font-semibold"
                >
                  <option value="approver">Approver (ผู้อนุมัติ)</option>
                  <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>สร้างผู้ใช้</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
