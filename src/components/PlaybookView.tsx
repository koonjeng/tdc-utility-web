'use client';

import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileEdit,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  FileSpreadsheet,
  FileText,
  Calendar,
  Search,
  Wrench,
  AlertTriangle,
  Zap,
} from 'lucide-react';

export const PlaybookView: React.FC = () => {
  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-[calc(100vh-73px)] space-y-8 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center flex-shrink-0 shadow-md">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">TDC Utility — Playbook & คู่มือการใช้งานระบบ</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            คู่มือขั้นตอนการทำงานล่าสุด ระบบอนุมัติแยกหมวดหมู่ รายงานพลังงาน A4 และประวัติการบันทึกข้อมูล
          </p>
        </div>
      </div>

      {/* 1. NEW WORKFLOW CATEGORY SUBMISSION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-sky-600" />
          <span>1. ระบบลงข้อมูลและส่งอนุมัติแยกหมวดหมู่ (Category Submissions)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-200 space-y-2">
            <h4 className="font-bold text-xs text-sky-900 flex items-center gap-1.5">
              <FileEdit className="w-4 h-4 text-sky-600" />
              <span>การบันทึกข้อมูล 6 หมวดหมู่</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              ผู้ใช้งานสามารถลงข้อมูลเฉพาะหมวดหมู่ที่รับผิดชอบได้ เช่น ตะกอน (Sludge), การผลิต, เชื้อเพลิง, ไฟฟ้า & โซลาร์, WWT & Biogas และสารเคมี โดยระบบจะบันทึกพร้อมระบุ <b>วันที่ลงข้อมูล (Report Date)</b> ชัดเจน
            </p>
          </div>

          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-2">
            <h4 className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>การส่งขออนุมัติแยกหมวด</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              เมื่อบันทึกข้อมูล ข้อมูลจะถูกจัดเก็บในสถานะ <span className="font-bold text-amber-700">รออนุมัติ (Pending)</span> แยกตามหมวดหมู่ พนักงานสามารถส่งอนุมัติหลายหมวดในวันเดียวกันได้อย่างอิสระ
            </p>
          </div>

          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-2">
            <h4 className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>การอนุมัติและระบุชื่อผู้อนุมัติ</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              ผู้อนุมัติ (Approver/Admin) ตรวจสอบและกดอนุมัติในหน้า "รออนุมัติ" ระบบจะลงบันทึก <b>ชื่อผู้ลงข้อมูล</b> และ <b>ชื่อผู้อนุมัติ</b> พร้อมวันเวลาแสดงในหน้ารายงาน
            </p>
          </div>
        </div>
      </div>

      {/* 2. ENERGY REPORT A4 FUNCTIONALITY */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          <span>2. หน้ารายงานพลังงานองค์รวม (A4 Energy Report & Export PNG)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>ฟิลเตอร์เลือกช่วงวันที่ (Date Range Aggregation)</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              สามารถกรองดูข้อมูลแบบรายเดือน หรือเลือกระบุช่วงวันที่เริ่มต้น–สิ้นสุด (Start Date - End Date) เพื่อดึงยอดรวมมิเตอร์ไฟฟ้า, โซลาร์เซลล์, น้ำมันเตา และตะกอนทุกรายการที่บันทึกไว้มารวมกันในรายงาน A4 อัตโนมัติ
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>ส่งออกภาพรายงาน PNG 2 หน้า</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              กดปุ่ม "ดาวน์โหลด หน้า 1 (PNG)" หรือ "ดาวน์โหลด หน้า 2 (PNG)" ระบบจะแปลงแบบฟอร์ม A4 พร้อมกราฟแนวโน้มเป็นไฟล์รูปภาพ PNG ความละเอียดสูงระดับ 2x สำหรับนำไปพิมพ์หรือนำเสนอผู้บริหารได้ทันที
            </p>
          </div>
        </div>
      </div>

      {/* 3. ROLES & PERMISSIONS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
          3. สิทธิ์ผู้ใช้งานปัจจุบัน (Roles & Permissions)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>1. Reporter (พนักงานลงข้อมูล)</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
              <li>เข้าใช้งานแบบ Guest หรือ พนักงานทั่วไป</li>
              <li>ลงข้อมูลและเลือกวันบันทึกย้อนหลังได้</li>
              <li>ส่งคำขออนุมัติแยกตามหมวดหมู่</li>
              <li>ดูข้อมูลในเมนู "ค้นหาข้อมูลที่บันทึกไว้" และ "ทำรายงาน A4"</li>
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>2. Approver (ผู้อนุมัติ)</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
              <li>เข้าสู่ระบบด้วยสิทธิ์ Approver</li>
              <li>อนุมัติ (Approve) หรือ ตีกลับ (Reject) รายงานย่อย</li>
              <li>ดูแดชบอร์ดสรุปแผนก (Department Dashboard)</li>
              <li>บันทึกชื่อผู้อนุมัติประทับตราเข้าสู่ระบบอัตโนมัติ</li>
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>3. Admin (ผู้ดูแลระบบ)</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
              <li>สิทธิ์สูงสุดในการเข้าถึงทุกเมนู</li>
              <li>จัดการสิทธิ์ เพิ่ม/ลบ บัญชีผู้ใช้งานในระบบ</li>
              <li>ลบหรือแก้ไขข้อมูลประวัติที่บันทึกไว้ย้อนหลัง</li>
              <li>เข้าถึงเมนู PM, Troubleshooting และ Playbook</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
