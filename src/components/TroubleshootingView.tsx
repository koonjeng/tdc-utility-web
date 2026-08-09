'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Wrench,
  ArrowRight,
  ShieldAlert,
  Lightbulb,
} from 'lucide-react';

export interface TroubleshootingGuide {
  id: string;
  symptom: string;
  cause: string;
  impact: string;
  solutions: string[];
  preventions: string[];
}

const TROUBLESHOOTING_DATA: TroubleshootingGuide[] = [
  {
    id: '0',
    symptom: 'COD เข้าระบบ MCL เพิ่มขึ้น',
    cause: 'มีการชะล้างแป้งหลุดจากกระบวนการผลิต, อัตราป้อนบ่อหมักสูงเกินไป หรือมีน้ำเสียเข้มข้นทะลักเข้าระบบ',
    impact: 'ภาระโหลด (COD Loading) สูงเกินเป้าหมาย ทำให้อัตราผลิตก๊าซชีวภาพผันผวน และอาจเกิดกรดสะสมในระบบ',
    solutions: [
      'ปรับลดอัตราการป้อนน้ำเสีย (Flow Feed) เข้าระบบบำบัดชั่วคราว',
      'ประสานงานฝ่ายผลิตเพื่อตรวจสอบจุดรั่วไหลของน้ำเสียแป้งเข้มข้น',
      'เพิ่มระยะเวลาพักน้ำในบ่อปรับสภาพ (Equalization / Mix Pond)',
      'สุ่มตรวจวัดค่า VFA และ pH ในถังหมักอย่างใกล้ชิด',
    ],
    preventions: [
      'ติดตั้งระบบแจ้งเตือน COD Loading แบบ Real-time',
      'ควบคุมมาตรฐานน้ำทิ้งจากแต่ละสายการผลิตก่อนปล่อยเข้าบ่อบำบัด',
    ],
  },
  {
    id: '1',
    symptom: 'อุณหภูมิใน MCL ต่ำกว่า 27°C',
    cause: 'สภาพอากาศเย็นภายนอก, ปริมาณน้ำเสียป้อนเข้าระบบมีอุณหภูมิต่ำ หรือระบบแลกเปลี่ยนความร้อนทำงานไม่เต็มประสิทธิภาพ',
    impact: 'กิจกรรมของจุลินทรีย์ผลิตก๊าซมีเทน (Methanogens) ลดลงอย่างมาก ส่งผลให้การย่อยสลาย COD ช้าลง',
    solutions: [
      'เพิ่มการหมุนเวียนน้ำเสียอุ่นจากกระบวนการอื่นกลับมาผสม',
      'ลดอัตราการจ่ายน้ำเสียเย็นเข้าระบบเพื่อรักษาความร้อนสะสม',
      'ตรวจสอบและเดินเครื่องระบบอุ่นน้ำเสีย/เกรทแลกเปลี่ยนความร้อน',
    ],
    preventions: [
      'หุ้มฉนวนท่อป้อนน้ำเสียและถังหมักในจุดที่มีการสูญเสียความร้อนสูง',
      'เฝ้าระวังอุณหภูมิน้ำเสียเข้าระบบล่วงหน้าในช่วงฤดูหนาว',
    ],
  },
  {
    id: '2',
    symptom: 'อุณหภูมิใน MCL สูงกว่า 39°C',
    cause: 'น้ำเสียจากกระบวนการผลิตมีอุณหภูมิสูงเกินไป (High-temp discharge) โดยไม่ผ่านการระบายความร้อนก่อน',
    impact: 'จุลินทรีย์กลุ่ม Mesophilic น็อคและตายลงอย่างรวดเร็ว ระบบบำบัดล้มเหลว (System Crash)',
    solutions: [
      'หยุดหรือลดการป้อนน้ำเสียความร้อนสูงเข้าระบบทันที',
      'เปิดพัดลมระบายความร้อน (Cooling Tower) หรือสเปรย์น้ำอุ่นเพื่อลดอุณหภูมิ',
      'ปั๊มน้ำเสียอุณหภูมิปกติเข้ามาผสมเพื่อปรับอุณหภูมิในถังหมักให้อยู่ในช่วง 35-37°C',
    ],
    preventions: [
      'บำรุงรักษาระบบ Cooling Tower ป้อนน้ำเสียให้พร้อมใช้งานเสมอ',
      'ติดตั้งระบบตัดการป้อนอัตโนมัติเมื่ออุณหภูมิน้ำเสียเกิน 40°C',
    ],
  },
  {
    id: '3',
    symptom: 'pH ใน UASB ต่ำกว่า 7',
    cause: 'เกิดภาวะกรดสะสม (Acidification) เนื่องจากสารอาหารเกิน, มี VFA สะสมสูง หรือแคลเซียม/ด่างไม่พอ',
    impact: 'จุลินทรีย์สร้างก๊าซมีเทนถูกยับยั้งการทำงาน ก๊าซมีเทนลดลง และเกิดกลิ่นเหม็นรุนแรง',
    solutions: [
      'เติมปูนขาว (Lime 90%) หรือ โซดาแอช เพื่อเพิ่มค่า Alkalinity และดึง pH กลับมาที่ 7.2-7.5',
      'ลดหรือหยุดการป้อนน้ำเสีย (Feed) เข้าระบบ UASB ชั่วคราว',
      'วนน้ำหมักภายในระบบ (Recirculation) เพื่อเจือจางกรดสะสม',
    ],
    preventions: [
      'ตรวจเช็คค่า VFA/Alk Ratio ประจำวันให้อยู่ต่ำกว่า 0.3',
      'เตรียมสำรองปูนขาวสำหรับสะเทินกรดให้พร้อมใช้งานเสมอ',
    ],
  },
  {
    id: '4',
    symptom: 'pH ใน UASB มากกว่า 8',
    cause: 'มีการเติมสารเคมีด่าง (ปูนขาว/โซดาไฟ) มากเกินไป หรือเกิดการสะสมของแอมโมเนียเข้มข้น',
    impact: 'ความเป็นพิษจากแอมโมเนียอิสระ (Free Ammonia Toxicity) เพิ่มขึ้น ยับยั้งจุลินทรีย์มีเทน',
    solutions: [
      'หยุดการเติมเคมีปรับสภาพด่างทุกชนิดทันที',
      'เพิ่มอัตราการป้อนน้ำเสียสดที่มีความเป็นกรดอ่อนเพื่อลด pH',
      'เจือจางน้ำในระบบด้วยน้ำรีไซเคิล pH ปกติ',
    ],
    preventions: [
      'คำนวณปริมาณการเติมปูนขาวตามค่า VFA และ Flow ให้ถูกต้อง',
      'สอบเทียบ (Calibrate) หัววัด pH Meter เป็นประจำทุกสัปดาห์',
    ],
  },
  {
    id: '5',
    symptom: 'ปริมาณเชื้อมีเทนไม่เพียงพอ',
    cause: 'ตะกอนจุลินทรีย์ (Granular Sludge) หลุดไหลออกนอกระบบ หรือจุลินทรีย์ฝ่อเนื่องจากขาดสารอาหารเป็นเวลานาน',
    impact: 'ประสิทธิภาพการบำบัด COD ต่ำกว่าเป้าหมาย และไม่สามารถรับโหลดน้ำเสียเพิ่มได้',
    solutions: [
      'เติมตะกอนเชื้อ (Seed Sludge / Anaerobic Granules) จากระบบที่สมบูรณ์เข้ามาเพิ่ม',
      'ลดอัตราการป้อนน้ำเสียเพื่อให้เชื้อเติบโตและปรับตัว (Acclimatization)',
      'ปรับอัตราการกวนและปรับความเร็วปั๊มวนเพื่อไม่ให้ตะกอนหลุด',
    ],
    preventions: [
      'ควบคุมความเร็วขึ้นของน้ำ (Upflow Velocity) ไม่ให้สูงเกินเกณฑ์กำหนด',
      'เสริมสารอาหารรองและธาตุอาหารที่จำเป็นกระตุ้นการสร้างเม็ดตะกอน',
    ],
  },
  {
    id: '6',
    symptom: 'ขาดแคลนสารอาหารหลัก (N, P)',
    cause: 'สัดส่วนสารอาหารในน้ำเสียดิบต่ำกว่าสัดส่วน BOD:N:P ที่ 100:2.5:0.5 สำหรับระบบไร้อากาศ',
    impact: 'การเติบโตของจุลินทรีย์ชะงัก การย่อยสลาย COD ต่ำลงอย่างเห็นได้ชัด',
    solutions: [
      'เติมปุ๋ยยูเรีย (Urea) เพื่อเพิ่มแหล่งไนโตรเจน (N)',
      'เติมปุ๋ยไดแอมโมเนียมฟอสเฟต (DAP) หรือ กรดฟอสฟอริก เพื่อเพิ่มฟอสฟอรัส (P)',
      'คำนวณสัดส่วนสารอาหารตามค่า COD Loading ประจำวัน',
    ],
    preventions: [
      'สุ่มวิเคราะห์ค่า TN และ TP ในน้ำเสียดิบสัปดาห์ละครั้ง',
      'ควบคุมการเติมสารอาหารผ่านปั๊มโดสเคมีอัตโนมัติ',
    ],
  },
  {
    id: '7',
    symptom: 'ขาดแคลนสารอาหารรอง',
    cause: 'ขาดธาตุอาหารรอยต่อ (Trace Elements) เช่น นิเกิล (Ni), โคบอลต์ (Co), เหล็ก (Fe), สังกะสี (Zn)',
    impact: 'เอนไซม์ของจุลินทรีย์สร้างมีเทนทำงานไม่สมบูรณ์ อัตราการเปลี่ยน VFA เป็นมีเทนตกต่ำ',
    solutions: [
      'เติมสารละลายธาตุอาหารรองผสม (Trace Element Solution) เข้าระบบตามโดสคำนวณ',
      'สลับใช้น้ำเสียดิบจากแหล่งที่มีธาตุอาหารสมบูรณ์เข้ามาผสม',
    ],
    preventions: [
      'เติมธาตุอาหารรองเป็นประจำตามตารางดูแลรักษาสภาพเชื้อ',
    ],
  },
  {
    id: '8',
    symptom: 'ค่าความเป็นพิษสูง',
    cause: 'มีสารพิษปนเปื้อนหลุดเข้าระบบ เช่น สารฟอกขาว, สารฆ่าเชื้อ (Disinfectant), โลหะหนัก หรือไฮโดรเจนซัลไฟด์เข้มข้น',
    impact: 'เชื้อจุลินทรีย์น็อคเฉียบพลัน ปริมาณก๊าซชีวภาพดิ่งลงอย่างรวดเร็ว',
    solutions: [
      'หยุดป้อนน้ำเสียที่มีสารพิษเข้าระบบทันที และกักน้ำเสียพิษไว้ในบ่อฉุกเฉิน',
      'ถ่ายน้ำเสียบางส่วนและเติมน้ำสะอาด/วนน้ำบำบัดเพื่อเจือจางสารพิษ',
      'เติมถ่านกัมมันต์ (Activated Carbon) ช่วยดูดซับสารพิษกรณีจำเป็น',
    ],
    preventions: [
      'เข้มงวดการใช้สารเคมีล้างเครื่องจักรในโรงงาน ไม่ให้ปนเปื้อนลงบ่อน้ำเสีย',
      'ทดสอบ Toxicity Test ก่อนปล่อยน้ำเสียสารเคมีเข้าระบบบำบัด',
    ],
  },
  {
    id: '9',
    symptom: 'ปริมาณก๊าซชีวภาพไม่สมดุลกับ COD ที่กำจัดได้',
    cause: 'เกิดการรั่วไหลของก๊าซชีวภาพตามท่อ/ผ้าคุมบ่อ, มิเตอร์วัดก๊าซคลาดเคลื่อน หรือเกิดปฏิกิริยาข้างเคียงแทรกแซง',
    impact: 'คำนวณปริมาณก๊าซได้ต่ำกว่าความเป็นจริง เสียโอกาสนำก๊าซชีวภาพไปใช้เป็นพลังงานทดแทน',
    solutions: [
      'ตรวจสอบรอยรั่วของผ้าคุมบ่อเมมเบรน ท่อส่งก๊าซ และเซฟตี้วาล์ว (Water Seal/Safety Valve)',
      'ทำการสอบเทียบ (Calibrate) เครื่องวัดปริมาณก๊าซ (Gas Flow Meter)',
      'ตรวจสอบเปอร์เซ็นต์มีเทน (%CH4) และกรดซัลไฟด์ (%H2S) เพื่อเช็คคุณภาพก๊าซ',
    ],
    preventions: [
      'ตรวจเช็ครอยรั่วก๊าซด้วยโฟมสบู่หรือ Gas Detector ทุกเดือน',
      'ส่งสอบเทียบ Gas Flow Meter ตามรอบ PM 6 เดือน',
    ],
  },
];

export const TroubleshootingView: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('');

  const selectedGuide = TROUBLESHOOTING_DATA.find((g) => g.id === selectedId);

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-[calc(100vh-73px)] space-y-6 max-w-5xl mx-auto">
      {/* HEADER CARD */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">คู่มือวิเคราะห์และแก้ไขปัญหา (Troubleshooting)</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold border border-amber-200">
                10 อาการยอดฮิต
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              แนวทางวิเคราะห์สาเหตุและขั้นตอนการแก้ไขปัญหาความผิดปกติในระบบบำบัดและก๊าซชีวภาพ
            </p>
          </div>
        </div>
      </div>

      {/* SELECTOR & CONTENT CONTAINER */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              เลือกอาการที่พบ (Select Symptom)
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="block w-full px-4 py-3 text-sm border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-xl border bg-slate-50 font-medium text-slate-800 cursor-pointer shadow-2xs"
            >
              <option value="">-- เลือกอาการที่พบ --</option>
              {TROUBLESHOOTING_DATA.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id === '0' ? '1.' : `${parseInt(item.id, 10) + 1}.`} {item.symptom}
                </option>
              ))}
            </select>
          </div>

          {/* EMPTY STATE */}
          {!selectedGuide ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/70 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-200/70 text-slate-400 flex items-center justify-center mx-auto">
                <Info className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">ยังไม่ได้เลือกอาการ</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                กรุณาเลือกอาการที่พบจากเมนูดรอปดาวน์ด้านบน เพื่อดูแนวทางการวิเคราะห์ สาเหตุ ผลกระทบ และขั้นตอนการแก้ไขปัญหาอย่างละเอียด
              </p>
            </div>
          ) : (
            /* DETAILED GUIDE DISPLAY */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* SYMPTOM TITLE BANNER */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-5 rounded-2xl shadow-md flex items-start gap-4">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs shrink-0">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-100">
                    อาการความผิดปกติที่ตรวจพบ
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5">{selectedGuide.symptom}</h3>
                </div>
              </div>

              {/* CAUSE & IMPACT GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 space-y-1.5">
                  <span className="text-xs font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>สาเหตุที่เป็นไปได้ (Possible Causes)</span>
                  </span>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {selectedGuide.cause}
                  </p>
                </div>

                <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-1.5">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>ผลกระทบต่อระบบ (System Impact)</span>
                  </span>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {selectedGuide.impact}
                  </p>
                </div>
              </div>

              {/* ACTION STEPS / SOLUTIONS */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-extrabold text-sky-800 uppercase tracking-wider flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-sky-600" />
                  <span>แนวทางการแก้ไขและฟื้นฟูระบบ (Corrective Actions)</span>
                </h4>
                <ul className="space-y-2.5">
                  {selectedGuide.solutions.map((sol, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-xs text-slate-800 font-medium bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="pt-0.5 leading-relaxed">{sol}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* PREVENTIONS */}
              {selectedGuide.preventions.length > 0 && (
                <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 space-y-3">
                  <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-emerald-600" />
                    <span>แนวทางการป้องกันในระยะยาว (Preventive Measures)</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700 font-medium">
                    {selectedGuide.preventions.map((prev, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{prev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
