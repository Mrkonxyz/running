import { hybridPlan } from "./hybridPlan";
import { pst34Plan } from "./pst34Plan";

export const PLANS = [hybridPlan, pst34Plan];

export function getPlanById(id) {
  return PLANS.find((p) => p.id === id) || PLANS[0];
}

export const YEARLY_DATA = {
  2026: {
    yearBE: 2569,
    yearCE: 2026,
    headline: "ปีแห่งการปูฐานวิ่งเทรล PST34 (25W) & เปลี่ยนผ่านสู่ Hybrid Physique",
    summaryMetrics: [
      { label: "แผนซ้อมในปีนี้", value: "2 แผนหลัก", sub: "PST34 Trail ➔ Hybrid Physique" },
      { label: "ระยะทาง/ภารกิจใหญ่", value: "PST30 Finisher", sub: "31.94 km | 06:00:27 Chip (14 พ.ย.)" },
      { label: "การเปลี่ยนแปลงร่างกาย", value: "-8.8 kg Fat", sub: "ขา 10.6/10.6 kg | RHR 45 bpm" },
      { label: "โฟกัสปลายปี (พ.ย.–ธ.ค.)", value: "Recovery + Cut I", sub: "150–170g โปรตีน + Diet Break ปีใหม่" },
    ],
    milestones: [
      { date: "25 พ.ค. 69", title: "เริ่มแผน PST34 (Week 1)", planId: "pst34-2026", week: 1, tag: "Start" },
      { date: "21–27 ก.ย. 69", title: "Peak Volume Long Run (4 ชม. 40 น.)", planId: "pst34-2026", week: 18, tag: "Peak" },
      { date: "14 พ.ย. 69", title: "🏁 จบ PST30 เชียงใหม่ (31.94 km, D+ 1,115m)", planId: "pst34-2026", week: 25, tag: "Race" },
      { date: "18 พ.ย. 69", title: "🚦 D+4 Morning Gate (HRV/RHR + เข่า 0/10)", planId: "hybrid-2026", week: 1, tag: "Gate" },
      { date: "30 พ.ย. 69", title: "🔓 ปลดล็อกเดินชัน 8–10% + Active Cut I", planId: "hybrid-2026", week: 3, tag: "Phase 1" },
      { date: "28 ธ.ค. 69", title: "🎄 Year-End Diet Break (Maintenance 14 วัน)", planId: "hybrid-2026", week: 7, tag: "Reset" },
    ],
    months: [
      { month: "ม.ค.", planId: null, status: "pre", label: "Baseline Fitness", detail: "วิ่งพื้นฐาน Chatuchak & เตรียมตัวก่อนเข้าโปรแกรม", hours: 8 },
      { month: "ก.พ.", planId: null, status: "pre", label: "Baseline Fitness", detail: "วิ่งสะสมระยะพื้นฐาน", hours: 9 },
      { month: "มี.ค.", planId: null, status: "pre", label: "Baseline Fitness", detail: "เตรียมร่างกายเข้าตาราง 25 สัปดาห์", hours: 10 },
      { month: "เม.ย.", planId: null, status: "pre", label: "Pre-Plan Prep", detail: "ปรับจังหวะสัปดาห์ 5 วัน", hours: 10 },
      { month: "พ.ค.", planId: "pst34-2026", week: 1, status: "pst34", label: "PST34: Phase 1 Base (W1)", detail: "เริ่มโปรแกรม 25 พ.ค. | วิ่ง Z2 60น. + เวทเข่า", hours: 13 },
      { month: "มิ.ย.", planId: "pst34-2026", week: 3, status: "pst34", label: "PST34: Base ➔ Endurance (W2–W6)", detail: "ขยับ Long Run แตะ 2 ชม. + เริ่มฝึกสะพายเป้น้ำ", hours: 16 },
      { month: "ก.ค.", planId: "pst34-2026", week: 7, status: "pst34", label: "PST34: Endurance (W7–W10)", detail: "Long Run 2 ชม. 15 น.–2 ชม. 45 น. + ฝึกกินเจลทุก 45 น.", hours: 18 },
      { month: "ส.ค.", planId: "pst34-2026", week: 11, status: "pst34", label: "PST34: Endurance Peak ➔ Peak (W11–W15)", detail: "Long Run 3–4 ชม. + เดินชัน 12% สัปดาห์ละ 60 น.", hours: 21 },
      { month: "ก.ย.", planId: "pst34-2026", week: 17, status: "pst34", label: "PST34: Peak Volume (W16–W19)", detail: "สัปดาห์พีคสุด 4 ชม. 40 น. (W18) ต้านตะคริว", hours: 22 },
      { month: "ต.ค.", planId: "pst34-2026", week: 21, status: "pst34", label: "PST34: Taper (W20–W23)", detail: "ลดระยะถนอมกล้ามเนื้อ + ตั้ง HRR Zone บน Garmin", hours: 14 },
      { month: "พ.ย.", planId: "hybrid-2026", week: 1, status: "hybrid", label: "🏁 PST30 Race ➔ Phase 0 Recovery (W1–W2)", detail: "14 พ.ย. จบ PST30! ➔ 15–29 พ.ย. พักฟื้น & ตรวจ Gate", hours: 10 },
      { month: "ธ.ค.", planId: "hybrid-2026", week: 3, status: "hybrid", label: "Hybrid: Phase 1 Cut I & Diet Break (W3–W7)", detail: "ปลดล็อกเดินชัน 8–10% + Stage 2 Knee + Year-End Break", hours: 14 },
    ],
  },
  2027: {
    yearBE: 2570,
    yearCE: 2027,
    headline: "ปีแห่งการพิชิตหุ่น 18.0% BF, V-Taper & Lean Athletic Lifestyle",
    summaryMetrics: [
      { label: "เป้าหมายหลัก Q1", value: "18.0% BF", sub: "~77.0–78.0 kg (ก.พ. – มี.ค. 2570)" },
      { label: "ความแข็งแกร่งท่อนบน", value: "V-Taper 2x/wk", sub: "Double Progression (เพิ่มเหล็กต่อเนื่อง)" },
      { label: "คาร์ดิโอตลอดปี", value: "3x / สัปดาห์", sub: "Chill Z2 + เดินชัน 8–12% + เตะฟุตบอล" },
      { label: "ตรวจสุขภาพประจำปี", value: "ก.พ.–มี.ค. 70", sub: "Lipid, CBC, Ferritin, Vit D + Hep B Booster" },
    ],
    milestones: [
      { date: "10 ม.ค. 70", title: "🎊 จบ Diet Break & ปิด Phase 1 (~20% BF)", planId: "hybrid-2026", week: 8, tag: "Checkpoint" },
      { date: "11 ม.ค. 70", title: "⚡ เข้า Phase 2 + Stage 3 Bulgarian Split Squat", planId: "hybrid-2026", week: 9, tag: "Phase 2" },
      { date: "22–28 ก.พ. 70", title: "👑 พิชิต 18.0% BF + ตรวจเลือด & Hep B Booster", planId: "hybrid-2026", week: 15, tag: "Target" },
      { date: "8 มี.ค. 70+", title: "🏆 Phase 3: Maintenance (2,300–2,550 kcal)", planId: "hybrid-2026", week: 17, tag: "Lifestyle" },
    ],
    months: [
      { month: "ม.ค.", planId: "hybrid-2026", week: 9, status: "hybrid", label: "Hybrid: Phase 2 V-Taper Push (W8–W11)", detail: "ปลดล็อก Stage 3 Knee Armor & เดินชัน 8–12% + Cut II", hours: 15 },
      { month: "ก.พ.", planId: "hybrid-2026", week: 13, status: "hybrid", label: "Hybrid: 18.0% BF Final Conquest (W12–W15)", detail: "รีดไขมันโค้งสุดท้ายสู่ 18% BF + ตรวจเลือด & Hep B", hours: 15 },
      { month: "มี.ค.", planId: "hybrid-2026", week: 17, status: "lifestyle", label: "Phase 3: Lean Athletic Maintenance (W16–W17+)", detail: "ขยับแคลอรีสู่ Maintenance รักษาหุ่น 18% BF ระยะยาว", hours: 15 },
      { month: "เม.ย.", planId: "hybrid-2026", week: 17, status: "lifestyle", label: "Phase 3: Lifestyle & Football", detail: "1 Activity/Day ต่อเนื่อง (3x Cardio + 2x Strength)", hours: 14 },
      { month: "พ.ค.", planId: "hybrid-2026", week: 17, status: "lifestyle", label: "Phase 3: Lifestyle & Lean Gain Option", detail: "คง VO2 Max 40–42+ และความแข็งแรง V-Taper", hours: 14 },
      { month: "มิ.ย.", planId: "hybrid-2026", week: 17, status: "lifestyle", label: "Phase 3: Mid-Year Review", detail: "ประเมิน Fitdays Mid-Year & เป้าหมายถัดไป", hours: 14 },
      { month: "ก.ค.", planId: "hybrid-2026", week: 17, status: "lifestyle", label: "Phase 3: Maintenance", detail: "Chill Z2 + เตะฟุตบอล + เวท 2x/wk", hours: 14 },
      { month: "ส.ค.", planId: "hybrid-2026", week: 17, status: "lifestyle", label: "Phase 3: Maintenance", detail: "Chill Z2 + เดินชัน 8–12% + เวท 2x/wk", hours: 14 },
      { month: "ก.ย.", planId: "hybrid-2026", week: 17, status: "lifestyle", label: "Phase 3: Maintenance", detail: "รักษากล้ามเนื้อและ %BF ให้อยู่ในโซน 17–18%", hours: 14 },
      { month: "ต.ค.", planId: "hybrid-2026", week: 17, status: "lifestyle", label: "Phase 3: Maintenance", detail: "พร้อมสำหรับทุกกิจกรรมกีฬาหรือลงสนามสนุกๆ", hours: 14 },
      { month: "พ.ย.", planId: "hybrid-2026", week: 17, status: "lifestyle", label: "Phase 3: ครบรอบ 1 ปี PST", detail: "ความฟิตระยะยาว & รูปร่างแข็งแรงสมส่วน", hours: 14 },
      { month: "ธ.ค.", planId: "hybrid-2026", week: 17, status: "lifestyle", label: "Phase 3: Year-End Balance", detail: "คุมสมดุลสุขภาพตลอดทั้งปี 2570", hours: 14 },
    ],
  },
};
