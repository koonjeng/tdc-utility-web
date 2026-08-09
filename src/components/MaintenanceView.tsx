'use client';

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Plus,
  Clock,
  Check,
  AlertCircle,
  HelpCircle,
  User,
  History,
  Send,
  X,
  FileCheck,
  Edit,
  Trash2,
} from 'lucide-react';
import { UserRole } from '@/lib/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface MaintenanceTask {
  id: string;
  equipment: string; // อุปกรณ์
  taskName: string; // งาน
  cycleDays: number; // รอบ (วัน)
  lastDoneDate: string; // ทำล่าสุด (YYYY-MM-DD)
  reporterName?: string; // ผู้รายงานล่าสุด
  status?: 'approved' | 'pending'; // สถานะอนุมัติ (ถ้าไม่มีสิทธิ์/ไม่มียศ จะเป็น pending)
}

export interface MaintenanceHistoryRecord {
  id: string;
  taskId: string;
  equipment: string;
  taskName: string;
  doneDate: string;
  reporterName: string;
  status: 'approved' | 'pending';
  submittedAt: string;
}

const DEFAULT_TASKS: MaintenanceTask[] = [
  {
    id: 'm1',
    equipment: 'In-line pH Meter',
    taskName: 'ล้างหัว probe',
    cycleDays: 7,
    lastDoneDate: '',
    status: 'approved',
  },
  {
    id: 'm2',
    equipment: 'In-line pH Meter',
    taskName: 'สอบเทียบ (Calibrate)',
    cycleDays: 30,
    lastDoneDate: '',
  },
  {
    id: 'm3',
    equipment: 'Gas Blower',
    taskName: 'สลับตัวเดิน',
    cycleDays: 15,
    lastDoneDate: '',
  },
  {
    id: 'm4',
    equipment: 'Gas Blower',
    taskName: 'อัดจาระบี/เช็คมอเตอร์และ Bearing',
    cycleDays: 30,
    lastDoneDate: '',
  },
  {
    id: 'm5',
    equipment: 'ปั๊มน้ำเสียทุกตัว',
    taskName: 'ตรวจเช็คทั่วไป',
    cycleDays: 30,
    lastDoneDate: '',
  },
  {
    id: 'm6',
    equipment: 'ท่อจ่ายน้ำเสีย (Distribution Loop)',
    taskName: 'Back Flushing / Pressurizing',
    cycleDays: 30,
    lastDoneDate: '',
  },
  {
    id: 'm7',
    equipment: 'เครื่องรีดตะกอน (Screw/Belt Press)',
    taskName: 'ตรวจสอบสายพาน/หล่อลื่น',
    cycleDays: 30,
    lastDoneDate: '',
  },
  {
    id: 'm8',
    equipment: 'Gas Flow Meter',
    taskName: 'สอบเทียบโดยหน่วยงานภายนอก',
    cycleDays: 182,
    lastDoneDate: '',
  },
  {
    id: 'm9',
    equipment: 'Methane Analyzer',
    taskName: 'สอบเทียบโดยหน่วยงานภายนอก',
    cycleDays: 182,
    lastDoneDate: '',
  },
  {
    id: 'm10',
    equipment: 'Pressure Transmitter',
    taskName: 'สอบเทียบโดยหน่วยงานภายนอก',
    cycleDays: 182,
    lastDoneDate: '',
  },
  {
    id: 'm11',
    equipment: 'Flame Arrester',
    taskName: 'ตรวจเช็คและล้างทำความสะอาด',
    cycleDays: 182,
    lastDoneDate: '',
  },
  {
    id: 'm12',
    equipment: 'Wastewater Flow Meter',
    taskName: 'สอบเทียบโดยหน่วยงานภายนอก',
    cycleDays: 365,
    lastDoneDate: '',
  },
  {
    id: 'm13',
    equipment: 'Flame Ignition',
    taskName: 'ตรวจเช็ค',
    cycleDays: 365,
    lastDoneDate: '',
  },
  {
    id: 'm14',
    equipment: 'Air Blower (AS)',
    taskName: 'ตรวจสอบเสียง/อุณหภูมิ',
    cycleDays: 7,
    lastDoneDate: '',
  },
];

interface MaintenanceViewProps {
  currentUser: { email: string; role: UserRole } | null;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ currentUser }) => {
  const [tasks, setTasks] = useState<MaintenanceTask[]>(DEFAULT_TASKS);
  const [historyRecords, setHistoryRecords] = useState<MaintenanceHistoryRecord[]>([]);

  // Sync PM Tasks & History directly from Supabase Database
  useEffect(() => {
    async function loadPMData() {
      if (!isSupabaseConfigured || !supabase) return;
      try {
        const { data: dbTasks, error: tErr } = await supabase.from('maintenance_tasks').select('*');
        if (!tErr && dbTasks && dbTasks.length >= DEFAULT_TASKS.length) {
          setTasks(
            dbTasks.map((t: any) => ({
              id: t.id,
              equipment: t.equipment,
              taskName: t.task_name,
              cycleDays: t.cycle_days,
              lastDoneDate: t.last_done_date,
              reporterName: t.reporter_name,
              status: t.status,
            }))
          );
        } else {
          // Auto-seed / Upsert ALL DEFAULT_TASKS to Supabase to guarantee all 14 items exist
          const seedPayload = DEFAULT_TASKS.map((t) => ({
            id: t.id,
            equipment: t.equipment,
            task_name: t.taskName,
            cycle_days: t.cycleDays,
            last_done_date: t.lastDoneDate || '',
            reporter_name: t.reporterName || '',
            status: t.status || 'approved',
          }));
          await supabase.from('maintenance_tasks').upsert(seedPayload, { onConflict: 'id' });
          const { data: freshTasks } = await supabase.from('maintenance_tasks').select('*');
          if (freshTasks && freshTasks.length > 0) {
            setTasks(
              freshTasks.map((t: any) => ({
                id: t.id,
                equipment: t.equipment,
                taskName: t.task_name,
                cycleDays: t.cycle_days,
                lastDoneDate: t.last_done_date,
                reporterName: t.reporter_name,
                status: t.status,
              }))
            );
          }
        }

        const { data: dbHist, error: hErr } = await supabase.from('maintenance_history').select('*').order('created_at', { ascending: false });
        if (!hErr && dbHist) {
          setHistoryRecords(
            dbHist.map((h: any) => ({
              id: h.id,
              taskId: h.task_id,
              equipment: h.equipment,
              taskName: h.task_name,
              doneDate: h.done_date,
              reporterName: h.reporter_name,
              status: h.status,
              submittedAt: h.submitted_at || h.created_at,
            }))
          );
        }
      } catch (err) {
        console.warn('Failed to load PM data from Supabase:', err);
      }
    }
    loadPMData();
  }, []);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(null);

  // Modal State for "ทำวันนี้"
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [targetTask, setTargetTask] = useState<MaintenanceTask | null>(null);
  const [reporterNameInput, setReporterNameInput] = useState<string>('');
  const [selectedDoneDate, setSelectedDoneDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  const triggerNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Admin Task Management Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [taskFormEquipment, setTaskFormEquipment] = useState<string>('');
  const [taskFormTaskName, setTaskFormTaskName] = useState<string>('');
  const [taskFormCycleDays, setTaskFormCycleDays] = useState<number>(30);

  const isAdmin = currentUser?.role === 'admin';
  const hasRole = Boolean(currentUser && (currentUser.role === 'admin' || currentUser.role === 'approver'));

  const handleOpenAddTaskModal = () => {
    setEditingTask(null);
    setTaskFormEquipment('');
    setTaskFormTaskName('');
    setTaskFormCycleDays(30);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTaskModal = (task: MaintenanceTask) => {
    setEditingTask(task);
    setTaskFormEquipment(task.equipment);
    setTaskFormTaskName(task.taskName);
    setTaskFormCycleDays(task.cycleDays);
    setIsTaskModalOpen(true);
  };

  const handleSaveTaskForm = () => {
    if (!taskFormEquipment.trim() || !taskFormTaskName.trim()) {
      alert('กรุณากรอกชื่ออุปกรณ์และชื่องาน');
      return;
    }

    if (editingTask) {
      // Edit existing task
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                equipment: taskFormEquipment.trim(),
                taskName: taskFormTaskName.trim(),
                cycleDays: taskFormCycleDays || 1,
              }
            : t
        )
      );
      triggerNotify(`แก้ไขรายการ "${taskFormEquipment}" เรียบร้อยแล้ว`);
    } else {
      // Add new task
      const newTask: MaintenanceTask = {
        id: `m_${Date.now()}`,
        equipment: taskFormEquipment.trim(),
        taskName: taskFormTaskName.trim(),
        cycleDays: taskFormCycleDays || 1,
        lastDoneDate: '',
      };
      setTasks((prev) => [...prev, newTask]);
      triggerNotify(`เพิ่มรายการซ่อมบำรุง "${newTask.equipment}" เรียบร้อยแล้ว`);
    }

    setIsTaskModalOpen(false);
  };

  const handleDeleteTask = (id: string, equipment: string) => {
    if (confirm(`คุณต้องการลบรายการซ่อมบำรุง "${equipment}" ใช่หรือไม่?`)) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      triggerNotify(`ลบรายการซ่อมบำรุง "${equipment}" เรียบร้อยแล้ว`);
    }
  };

  // Helper to calculate status
  const getTaskStatus = (lastDoneDate: string, cycleDays: number) => {
    if (!lastDoneDate) {
      return { type: 'not_set', text: 'ยังไม่กรอกวันที่', daysOverdue: 0, daysRemaining: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const doneDate = new Date(lastDoneDate);
    doneDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - doneDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > cycleDays) {
      const overdue = diffDays - cycleDays;
      return { type: 'overdue', text: `เลยกำหนด (${overdue} วัน)`, daysOverdue: overdue, daysRemaining: 0 };
    }

    const remaining = cycleDays - diffDays;
    if (remaining <= 3) {
      return { type: 'due_soon', text: `ใกล้ถึงกำหนด (${remaining} วัน)`, daysOverdue: 0, daysRemaining: remaining };
    }

    return { type: 'ok', text: `ปกติ (เหลือ ${remaining} วัน)`, daysOverdue: 0, daysRemaining: remaining };
  };

  // Open Form Dialog when clicking "ทำวันนี้"
  const handleOpenSubmitModal = (task: MaintenanceTask) => {
    setTargetTask(task);

    let defaultName = currentUser?.email || '';
    if (currentUser?.email) {
      try {
        const savedName = localStorage.getItem(`tdc_user_display_name_${currentUser.email}`);
        if (savedName) defaultName = savedName;
        else defaultName = currentUser.email.split('@')[0];
      } catch {}
    }

    setReporterNameInput(defaultName);
    setSelectedDoneDate(new Date().toISOString().split('T')[0]);
    setIsSubmitModalOpen(true);
  };

  // Confirm Submit Maintenance Form
  const handleConfirmSubmit = () => {
    if (!targetTask) return;
    if (!reporterNameInput.trim()) {
      alert('กรุณาระบุชื่อผู้รายงาน');
      return;
    }

    const isAutoApproved = hasRole;
    const newStatus: 'approved' | 'pending' = isAutoApproved ? 'approved' : 'pending';

    // Create history record
    const newRecord: MaintenanceHistoryRecord = {
      id: `mrec-${Date.now()}`,
      taskId: targetTask.id,
      equipment: targetTask.equipment,
      taskName: targetTask.taskName,
      doneDate: selectedDoneDate,
      reporterName: reporterNameInput.trim(),
      status: newStatus,
      submittedAt: new Date().toISOString(),
    };

    setHistoryRecords((prev) => [newRecord, ...prev]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('maintenance_history').upsert({
        id: newRecord.id,
        task_id: newRecord.taskId,
        equipment: newRecord.equipment,
        task_name: newRecord.taskName,
        done_date: newRecord.doneDate,
        reporter_name: newRecord.reporterName,
        status: newRecord.status,
        submitted_at: newRecord.submittedAt,
      }).then(({ error }) => {
        if (error) console.warn('Supabase PM history upsert error:', error);
      });
    }

    // If auto approved (hasRole), update the task's lastDoneDate immediately
    if (isAutoApproved) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === targetTask.id
            ? {
                ...t,
                lastDoneDate: selectedDoneDate,
                reporterName: reporterNameInput.trim(),
                status: 'approved',
              }
            : t
        )
      );

      if (isSupabaseConfigured && supabase) {
        supabase.from('maintenance_tasks').upsert({
          id: targetTask.id,
          equipment: targetTask.equipment,
          task_name: targetTask.taskName,
          cycle_days: targetTask.cycleDays,
          last_done_date: selectedDoneDate,
          reporter_name: reporterNameInput.trim(),
          status: 'approved',
        }).then(({ error }) => {
          if (error) console.warn('Supabase PM task update error:', error);
        });
      }

      triggerNotify(`อนุมัติและบันทึกการซ่อมบำรุง "${targetTask.equipment}" เรียบร้อยแล้ว`);
    } else {
      // Guest / Reporter -> Send to Pending Approvals queue
      setTasks((prev) =>
        prev.map((t) =>
          t.id === targetTask.id ? { ...t, status: 'pending' } : t
        )
      );
      triggerNotify(`ส่งรายการซ่อมบำรุง "${targetTask.equipment}" ไปยังรายการ "รออนุมัติ" เรียบร้อยแล้ว`);
    }

    setIsSubmitModalOpen(false);
    setTargetTask(null);
  };

  const handleDateChange = (id: string, dateStr: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, lastDoneDate: dateStr } : t))
    );
    const target = tasks.find((t) => t.id === id);
    if (target && isSupabaseConfigured && supabase) {
      supabase.from('maintenance_tasks').upsert({
        id: target.id,
        equipment: target.equipment,
        task_name: target.taskName,
        cycle_days: target.cycleDays,
        last_done_date: dateStr,
        reporter_name: target.reporterName || '',
        status: target.status || 'approved',
      }).then(({ error }) => {
        if (error) console.warn('Supabase PM date change error:', error);
      });
    }
  };

  const handleResetDate = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, lastDoneDate: '', status: undefined } : t))
    );
    const target = tasks.find((t) => t.id === id);
    if (target && isSupabaseConfigured && supabase) {
      supabase.from('maintenance_tasks').upsert({
        id: target.id,
        equipment: target.equipment,
        task_name: target.taskName,
        cycle_days: target.cycleDays,
        last_done_date: '',
        reporter_name: '',
        status: 'approved',
      }).then(({ error }) => {
        if (error) console.warn('Supabase PM reset date error:', error);
      });
    }
    triggerNotify('รีเซ็ตวันที่สำเร็จ');
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.taskName.toLowerCase().includes(searchQuery.toLowerCase());

    const status = getTaskStatus(t.lastDoneDate, t.cycleDays);

    if (statusFilter === 'overdue') return matchesSearch && status.type === 'overdue';
    if (statusFilter === 'due_soon') return matchesSearch && status.type === 'due_soon';
    if (statusFilter === 'ok') return matchesSearch && status.type === 'ok';
    if (statusFilter === 'not_set') return matchesSearch && status.type === 'not_set';

    return matchesSearch;
  });

  // Summary counts
  const overdueCount = tasks.filter((t) => getTaskStatus(t.lastDoneDate, t.cycleDays).type === 'overdue').length;
  const notSetCount = tasks.filter((t) => getTaskStatus(t.lastDoneDate, t.cycleDays).type === 'not_set').length;
  const okCount = tasks.filter((t) => getTaskStatus(t.lastDoneDate, t.cycleDays).type === 'ok').length;

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-[calc(100vh-73px)] space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-8 z-50 bg-sky-950 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-sky-600 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-sky-400" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* HEADER CARD WITH HISTORY BUTTON */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-600/20">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">แผนงานและประวัติซ่อมบำรุง (Maintenance PM)</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-extrabold border border-sky-200">
                {tasks.length} รายการ
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              ติดตามรอบการบำรุงรักษา สอบเทียบเครื่องมือวัด และงานดูแลเครื่องจักรในระบบ
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {isAdmin && (
            <button
              onClick={handleOpenAddTaskModal}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มรายการ PM ใหม่</span>
            </button>
          )}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <History className="w-4 h-4 text-sky-400" />
            <span>ประวัติย้อนหลัง ({historyRecords.length})</span>
          </button>
        </div>
      </div>

      {/* SUMMARY BADGES ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">งานทั้งหมด</p>
            <p className="text-xl font-black text-slate-900">{tasks.length}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
            {tasks.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-600 font-bold">เลยกำหนด</p>
            <p className="text-xl font-black text-rose-600">{overdueCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-600 font-bold">ยังไม่ลงวันที่</p>
            <p className="text-xl font-black text-amber-600">{notSetCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
            <HelpCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-600 font-bold">ตามกำหนด</p>
            <p className="text-xl font-black text-emerald-600">{okCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตามชื่ออุปกรณ์ หรือ ชนิดงาน..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-700 cursor-pointer w-full sm:w-auto"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="overdue">เลยกำหนด</option>
            <option value="due_soon">ใกล้ถึงกำหนด</option>
            <option value="ok">ตามกำหนดปกติ</option>
            <option value="not_set">ยังไม่กรอกวันที่</option>
          </select>
        </div>
      </div>

      {/* MAINTENANCE TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-700 tracking-wider uppercase">
                <th className="px-6 py-4">อุปกรณ์</th>
                <th className="px-6 py-4">งาน</th>
                <th className="px-6 py-4 text-center">รอบ (วัน)</th>
                <th className="px-6 py-4">ทำล่าสุด</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTasks.map((t) => {
                const status = getTaskStatus(t.lastDoneDate, t.cycleDays);
                const parts = t.lastDoneDate ? t.lastDoneDate.split('-') : [];
                const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : '';

                return (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                      {t.equipment}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium min-w-[200px]">
                      {t.taskName}
                    </td>
                    <td className="px-6 py-4 text-center font-extrabold text-slate-700 whitespace-nowrap">
                      {t.cycleDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative inline-flex items-center">
                        <input
                          type="date"
                          value={t.lastDoneDate}
                          onChange={(e) => handleDateChange(t.id, e.target.value)}
                          className="w-36 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium cursor-pointer"
                          style={{ color: 'transparent', caretColor: 'transparent' }}
                        />
                        <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                          <span className="text-xs font-medium text-slate-800">
                            {displayDate || 'dd/mm/yyyy'}
                          </span>
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {t.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          รออนุมัติ
                        </span>
                      )}
                      {t.status !== 'pending' && status.type === 'overdue' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {status.text}
                        </span>
                      )}
                      {t.status !== 'pending' && status.type === 'due_soon' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          {status.text}
                        </span>
                      )}
                      {t.status !== 'pending' && status.type === 'ok' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          {status.text}
                        </span>
                      )}
                      {t.status !== 'pending' && status.type === 'not_set' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {status.text}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenSubmitModal(t)}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-sky-900 to-sky-800 hover:from-sky-800 hover:to-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-95 flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>ทำวันนี้</span>
                        </button>
                        {hasRole && (
                          <button
                            onClick={() => handleResetDate(t.id)}
                            title="รีเซ็ตวันที่ (เฉพาะผู้มีสิทธิ์)"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border border-slate-200 shadow-2xs cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEditTaskModal(t)}
                              title="แก้ไขรายการนี้ (เฉพาะ Admin)"
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors border border-amber-200 shadow-2xs cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(t.id, t.equipment)}
                              title="ลบรายการนี้ (เฉพาะ Admin)"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-200 shadow-2xs cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    ไม่พบรายการข้อมูลตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUBMIT MAINTENANCE FORM MODAL */}
      {isSubmitModalOpen && targetTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">บันทึกผลการซ่อมบำรุง</h3>
                  <p className="text-xs text-slate-500">{targetTask.equipment}</p>
                </div>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-700">ชื่องาน: <span className="font-normal text-slate-600">{targetTask.taskName}</span></p>
                <p className="font-bold text-slate-700">รอบการทำงาน: <span className="font-normal text-slate-600">{targetTask.cycleDays} วัน</span></p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ชื่อผู้รายงาน / ผู้ปฏิบัติงาน <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={reporterNameInput}
                    onChange={(e) => setReporterNameInput(e.target.value)}
                    placeholder="ระบุชื่อผู้ปฏิบัติงาน..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">วันที่ปฏิบัติงาน</label>
                <div className="relative inline-flex items-center w-full">
                  <input
                    type="date"
                    value={selectedDoneDate}
                    onChange={(e) => setSelectedDoneDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold disabled:opacity-60 cursor-pointer"
                    style={{ color: 'transparent', caretColor: 'transparent' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                    <span className="text-xs font-bold text-slate-800">
                      {selectedDoneDate
                        ? (() => {
                          const parts = selectedDoneDate.split('-');
                          return parts.length === 3 ? `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}` : selectedDoneDate;
                        })()
                        : 'dd/mm/yyyy'}
                    </span>
                    <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                  </div>
                </div>
              </div>

              {!hasRole && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-[11px] text-amber-900 font-medium">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    เนื่องจากบัญชีนี้เป็นโหมดพนักงานทั่วไป (ไม่มีสิทธิ์อนุมัติ) รายการนี้จะถูกส่งไปยังหมวด <strong>"รออนุมัติ"</strong> เพื่อให้ Approver หรือ Admin ตรวจสอบอนุมัติก่อนอัปเดตระบบ
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-5 py-2 text-xs font-extrabold text-white bg-sky-700 hover:bg-sky-600 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{hasRole ? 'บันทึกทันที' : 'ส่งขออนุมัติ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY MODAL DIALOG */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">ประวัติการซ่อมบำรุงย้อนหลัง</h3>
                  <p className="text-xs text-slate-500">บันทึกประวัติการทำ PM ทั้งหมดในระบบ</p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {historyRecords.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  ยังไม่มีประวัติการซ่อมบำรุงในระบบ
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-700 border-b border-slate-200 uppercase">
                      <th className="p-3">วันที่ทำ</th>
                      <th className="p-3">อุปกรณ์</th>
                      <th className="p-3">งาน</th>
                      <th className="p-3">ผู้รายงาน</th>
                      <th className="p-3">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyRecords.map((r) => {
                      const parts = r.doneDate ? r.doneDate.split('-') : [];
                      const displayD = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : r.doneDate;

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80">
                          <td className="p-3 font-bold text-slate-900">{displayD}</td>
                          <td className="p-3 font-medium text-slate-800">{r.equipment}</td>
                          <td className="p-3 text-slate-600">{r.taskName}</td>
                          <td className="p-3 text-slate-700 font-semibold">{r.reporterName}</td>
                          <td className="p-3">
                            {r.status === 'approved' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                อนุมัติแล้ว
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                รออนุมัติ
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ADMIN ADD/EDIT TASK MODAL */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  {editingTask ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingTask ? 'แก้ไขรายการซ่อมบำรุง (PM)' : 'เพิ่มรายการซ่อมบำรุง (PM) ใหม่'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">เฉพาะผู้ใช้งานระดับ Admin เท่านั้น</p>
                </div>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ชื่ออุปกรณ์ / เครื่องจักร <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={taskFormEquipment}
                  onChange={(e) => setTaskFormEquipment(e.target.value)}
                  placeholder="เช่น In-line pH Meter, Gas Blower"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ชื่องานซ่อมบำรุง / กิจกรรม <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={taskFormTaskName}
                  onChange={(e) => setTaskFormTaskName(e.target.value)}
                  placeholder="เช่น สอบเทียบ (Calibrate), ล้างหัว probe"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  รอบระยะเวลาบำรุงรักษา (จำนวนวัน) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={taskFormCycleDays || ''}
                  onChange={(e) => setTaskFormCycleDays(Number(e.target.value))}
                  placeholder="เช่น 7, 15, 30"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveTaskForm}
                className="px-5 py-2 text-white font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{editingTask ? 'บันทึกการแก้ไข' : 'ยืนยันเพิ่มรายการ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
