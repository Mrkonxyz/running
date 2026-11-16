import { useState } from 'react';

function VideoPlayer({ videoId }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center pl-[60px] pr-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
            isOpen ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-pocariBlue/10 text-pocariBlue hover:bg-pocariBlue/20'
          }`}
        >
          {isOpen ? '✕ ปิดวิดีโอ' : '📹 ดูวิดีโอสาธิต'}
        </button>
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-gray-400 hover:text-pocariBlue transition flex items-center gap-0.5"
        >
          เปิดใน YouTube ↗
        </a>
      </div>
      {isOpen && (
        <div className="mt-2 pl-[60px]">
          <div className="video-player-container">
            <iframe
              className="w-full aspect-video rounded-lg border border-slate-700"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseCard({ title, detail, svgContent, videoId, bgClass = "bg-purple-50/20 border-purple-100/50" }) {
  return (
    <div className={`exercise-card ${bgClass} p-2.5 rounded-xl border flex flex-col gap-1.5`}>
      <div className="flex gap-3 items-center">
        <div className="flex-shrink-0 w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden">
          {svgContent}
        </div>
        <div className="text-xs text-slate-800 flex-grow">
          <b className="text-xs block">{title}</b>
          <span className="text-gray-500 block text-[11px] mt-0.5">{detail}</span>
        </div>
      </div>
      {videoId && <VideoPlayer videoId={videoId} />}
    </div>
  );
}

export function GuideModal({ type, weekNum, planId, onClose, weeklyData }) {
  if (!type) return null;

  let labelTxt = "";
  let titleTxt = "";
  let bodyHTML = null;

  const wObj = weeklyData.find(d => d.week === weekNum);
  const isPhase0 = wObj?.phase === 'recovery';
  const isPst34 = planId === 'pst34-2026';

  if (isPst34 && wObj) {
    const mapInfo = {
      easy: { lbl: "อังคาร • Easy Road", ttl: "Easy Road Zone 2 (136–150 bpm)", det: wObj.tueDetail },
      str: { lbl: "พุธ • Lower & Upper Strength", ttl: "เวทเข่าเฟิร์ม + ช่วงบนรับเป้น้ำ", det: wObj.wedDetail },
      inc: { lbl: "พฤหัสบดี • Treadmill Incline 12%", ttl: "ซ้อมปีนเขาจำลองบนลู่วิ่ง", det: wObj.thuDetail },
      long: { lbl: "เสาร์ • Long Run / Race Day", ttl: wObj.satTarget, det: wObj.satDetail },
      rec: { lbl: "อาทิตย์ • Active Recovery", ttl: "จ๊อกเบา / ยืดเหยียด & Core", det: wObj.sunDetail },
    };
    const info = mapInfo[type] || mapInfo.easy;
    labelTxt = info.lbl;
    titleTxt = info.ttl;
    bodyHTML = (
      <div className="space-y-3 text-xs">
        <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
          <b>📋 รายละเอียดเซสชั่น (Week {weekNum}):</b><br />{info.det}
        </p>
        <p className="text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
          <b>🥤 โภชนาการสนาม:</b> {wObj.nutritionNote}
        </p>
      </div>
    );
  } else if (type === 'easy') {
    labelTxt = "อังคาร • Chill Z2 Cardio";
    titleTxt = "Chill Z2 Easy Run (Zero Pace Pressure)";
    bodyHTML = (
      <div className="space-y-3">
        <p className="text-xs text-gray-500">
          <b>🎯 วัตถุประสงค์:</b> เผาผลาญไขมันสูงสุด (FatMax) และรักษาฐานความอึดโดยไม่ทำลายกล้ามเนื้อ (Zero Interference Effect)
        </p>
        <div className="text-xs text-slate-700 bg-blue-50/50 p-3 rounded-xl border border-blue-100 space-y-1.5">
          <p><b>📋 เป้าหมายสัปดาห์นี้:</b> <span className="font-bold text-pocariBlue">{wObj?.tueTarget}</span></p>
          <p>• <b>โซนหัวใจหลัก:</b> True Zone 2 (<b>136 – 150 bpm</b> | เน้น FatMax 136–146 bpm)</p>
          <p>• <b>ความเร็ว & ความชัน:</b> ไม่ต้องสนเพซ (7:15–8:30 /km ได้หมด) ลู่ตั้งชัน <b>0.5%</b> หรือวิ่งทางราบสวนสาธารณะ</p>
          <p>• <b>รอบขา:</b> ก้าวสั้นนุ่มลงใต้สะโพก รอบขาธรรมชาติ <b>168–174 spm</b> เพื่อถนอมหน้าเข่า</p>
        </div>
        <div className="text-xs text-slate-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
          <b>🥗 โภชนาการวันอังคาร (Cardio Fuel):</b> <b>2,050–2,150 kcal</b> | โปรตีน 150–170g | คาร์บปานกลาง 185–215g
        </div>
      </div>
    );
  } else if (type === 'str') {
    labelTxt = "พุธ • Strength Day A (55–60 นาที)";
    titleTxt = "Lower Knee Armor + Upper Push/Pull Thickness";
    bodyHTML = (
      <div className="space-y-3">
        <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
          <b>🧪 ก่อนซ้อม 30–60 นาที:</b> ทาน <b>Collagen Peptides 15g + Vitamin C 50–100mg</b> (และเช้าวันพุธอย่าลืมชั่ง Fitdays ท้องว่าง!)
        </div>

        <div>
          <span className="font-bold text-purple-700 block text-xs uppercase tracking-wide mb-2">
            🦵 ช่วงที่ 1: Lower Body & 3-Phase Knee Armor (~25–30 นาที | 2–3 RIR)
          </span>
          <div className="space-y-2">
            <ExerciseCard
              title="A1. 3-Phase Knee Rehab (เลือกตามเฟส)"
              detail="Phase 0: Wall Sit/Spanish Squat (3–4×30–45s) • Phase 1: Slow Eccentric Step-Down 10–15cm (3×10–12) • Phase 2: DB Bulgarian Split Squat (3×8–10)"
              videoId="GT3WyYA2wNo"
              svgContent={
                <svg className="w-12 h-12" viewBox="0 0 100 100">
                  <line x1="20" y1="85" x2="80" y2="85" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
                  <g className="animate-squat">
                    <circle cx="50" cy="25" r="7" fill="#36b37e" />
                    <line x1="50" y1="32" x2="50" y2="55" stroke="#36b37e" strokeWidth="5" strokeLinecap="round" />
                    <line x1="50" y1="55" x2="50" y2="85" stroke="#00a3bf" strokeWidth="5" strokeLinecap="round" />
                  </g>
                </svg>
              }
            />
            <ExerciseCard
              title="A2. DB Romanian Deadlift (RDL) — 3 × 10–12"
              detail="พับสะโพกช้า 3 วินาที ดันขึ้น 1 วินาที (2 RIR) ป้องกันแฮมสตริงตึงเวลาสปรินต์เตะบอลและปั้นหลังขา"
              videoId="ZEnWV4kSQEg"
              svgContent={
                <svg className="w-12 h-12" viewBox="0 0 100 100">
                  <line x1="20" y1="85" x2="80" y2="85" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
                  <g className="animate-step">
                    <circle cx="50" cy="28" r="7" fill="#a855f7" />
                    <line x1="50" y1="35" x2="50" y2="62" stroke="#a855f7" strokeWidth="5" strokeLinecap="round" />
                    <line x1="50" y1="62" x2="50" y2="85" stroke="#0052cc" strokeWidth="5" strokeLinecap="round" />
                  </g>
                </svg>
              }
            />
            <ExerciseCard
              title="A3. Goblet Squat / 45° Leg Press — 3 × 10–12"
              detail="ลงช้า 3 วิ ดัน 1 วิ ไม่ล็อกเข่าสุด ล็อกมวลกล้ามเนื้อขา 10.6 kg ทั้งสองข้าง"
              svgContent={
                <svg className="w-12 h-12" viewBox="0 0 100 100">
                  <g className="animate-squat">
                    <circle cx="50" cy="25" r="7" fill="#00a3bf" />
                    <line x1="50" y1="32" x2="50" y2="58" stroke="#00a3bf" strokeWidth="5" strokeLinecap="round" />
                    <line x1="50" y1="58" x2="50" y2="85" stroke="#36b37e" strokeWidth="5" strokeLinecap="round" />
                  </g>
                </svg>
              }
            />
            <ExerciseCard
              title="A4. Single-Leg Calf Raises — 3 × 12–15/ข้าง"
              detail="ขึ้นสุดค้าง 2 วิ ลงช้า 3 วิ เสริม Soleus ซับแรงกระแทกก่อนถึงข้อเข่า"
              videoId="G4_m160r4oI"
              svgContent={
                <svg className="w-12 h-12" viewBox="0 0 100 100">
                  <line x1="20" y1="82" x2="80" y2="82" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
                  <g className="animate-calf">
                    <circle cx="50" cy="30" r="6" fill="#0052cc" />
                    <line x1="50" y1="36" x2="50" y2="82" stroke="#0052cc" strokeWidth="5" strokeLinecap="round" />
                  </g>
                </svg>
              }
            />
          </div>
        </div>

        <div>
          <span className="font-bold text-pocariBlue block text-xs uppercase tracking-wide mb-2">
            💪 ช่วงที่ 2: Upper Push/Pull Thickness (~25–30 นาที | 1–2 RIR)
          </span>
          <div className="space-y-2">
            <ExerciseCard
              bgClass="bg-blue-50/20 border-blue-100/60"
              title="A5. DB Bench Press + A6. Lat Pulldown / Row (3–4 × 8–12)"
              detail="Superset คู่ตรงข้าม อกกลาง + ปีกหลังด้านนอก เพื่อคุมเวลาให้จบภายใน 60 นาที"
              videoId="KjYak5vZO9s"
              svgContent={
                <svg className="w-12 h-12" viewBox="0 0 100 100">
                  <line x1="25" y1="75" x2="75" y2="75" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
                  <g className="animate-press">
                    <line x1="32" y1="35" x2="68" y2="35" stroke="#00a3bf" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="32" cy="35" r="5" fill="#f59e0b" />
                    <circle cx="68" cy="35" r="5" fill="#f59e0b" />
                  </g>
                </svg>
              }
            />
            <ExerciseCard
              bgClass="bg-blue-50/20 border-blue-100/60"
              title="A7. Shoulder Press + Cable Row | A8. Lateral Raise + Tricep (3 × 10–15)"
              detail="สร้างหัวไหล่กลม หลังหนาแก้ออฟฟิศซินโดรม และเก็บความกว้างไหล่ข้าง V-Shape"
              videoId="qEwKCR5JCog"
              svgContent={
                <svg className="w-12 h-12" viewBox="0 0 100 100">
                  <circle cx="50" cy="25" r="6" fill="#00a3bf" />
                  <line x1="50" y1="31" x2="50" y2="65" stroke="#00a3bf" strokeWidth="4" strokeLinecap="round" />
                  <g className="animate-raise-left"><line x1="50" y1="38" x2="25" y2="55" stroke="#36b37e" strokeWidth="3.5" strokeLinecap="round" /></g>
                  <g className="animate-raise-right"><line x1="50" y1="38" x2="75" y2="55" stroke="#36b37e" strokeWidth="3.5" strokeLinecap="round" /></g>
                </svg>
              }
            />
          </div>
        </div>
      </div>
    );
  } else if (type === 'inc') {
    labelTxt = isPhase0 ? "พฤหัสบดี • Flat Cardio ONLY" : "พฤหัสบดี • Steep Incline Mastery";
    titleTxt = isPhase0 ? "Phase 0 Flat Walk / Spin (งดเดินชัน >5%)" : "เดินชัน 8–12% ปั้นก้น-น่อง & Fat Burn";
    bodyHTML = (
      <div className="space-y-3">
        {isPhase0 ? (
          <div className="text-xs text-sky-900 bg-sky-50 p-3 rounded-xl border border-sky-200 space-y-1.5">
            <p><b>🚫 กฎเหล็ก Phase 0 (15–29 พ.ย.):</b> <b>ห้ามเดินชันเกิน 5%</b> จนกว่าหน้าเข่าจะนิ่งที่ 0/10 สนิท</p>
            <p>• <b>วิธีปฏิบัติ:</b> เดินลู่ทางราบ (0%) หรือปั่นจักรยาน Spinning <b>40–45 นาที</b> โซน 1–2 (121–138 bpm)</p>
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            <p className="text-gray-500"><b>🎯 วัตถุประสงค์:</b> กระตุ้นก้น (Glutes) น่อง และเผาไขมันด้วยแรงกระแทกต่ำ รักษาความสดของขา</p>
            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 space-y-1.5">
              <p><b>1. Warm-up (10 นาที):</b> วิ่ง Chill Z2 ทางราบ 0.5%</p>
              <p><b>2. Main Set (25–35 นาที):</b> เดินชัน <b>{wObj?.phase === 'phase1' ? '8–10%' : '8–12%'}</b> ความเร็ว <b>4.5–5.5 km/h</b> คุมหัวใจ <b>Z2–Low Z3 (130–152 bpm)</b></p>
              <p><b>3. Cooldown (5–10 นาที):</b> ปรับชัน 0% จ๊อกหรือเดินช้าสบายๆ</p>
            </div>
            <div className="bg-red-50/70 p-2.5 rounded-xl border border-red-200 text-red-900">
              <b>⚠️ ห้ามจับราวลู่วิ่ง!</b> แกว่งแขนตามธรรมชาติและดันส้นเท้า เพื่อบังคับให้ก้นและแกนกลางทำงานเต็มที่
            </div>
          </div>
        )}
      </div>
    );
  } else if (type === 'long') {
    labelTxt = "เสาร์ • Weekend Cardio";
    titleTxt = "Chill Z2 Long Run (60–90m) หรือ ⚽ เตะฟุตบอล";
    bodyHTML = (
      <div className="space-y-3 text-xs">
        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-1.5">
          <p><b>🏃‍♂️ ตัวเลือกหลัก — Chill Z2 Long Run ({wObj?.satTarget}):</b></p>
          <p>• วิ่งชิลในสวนสาธารณะ <b>ไม่ต้องสะพายเป้น้ำ</b> เพซคุยสบายตลอดทาง</p>
          <p>• คุมหัวใจ <b>True Zone 2 (136–150 bpm)</b> เผา ~650–950 kcal ไม่พังขาสำหรับเวทวันอาทิตย์</p>
        </div>
        <div className="bg-slate-800 text-white p-3 rounded-xl space-y-1.5">
          <p className="font-bold text-treadmillGreen">⚽ Clean Football Swap Rule (เมื่อมีนัดเตะบอล):</p>
          <p>• <b>ตัด Long Run วันเสาร์ออก 100%</b> ใช้แมตช์ฟุตบอลแทนเลย</p>
          <p>• วอร์มเข่า-สะโพก <b>5–8 นาที</b> ก่อนลงสนาม (Leg Swings + World's Greatest Stretch + Clamshell)</p>
          <p>• <b>วันอาทิตย์ (Strength B):</b> เล่น Upper V-Taper + Core ปกติ แต่ <b>ตัดท่า Hip Thrust/Glute Bridge ออก</b></p>
        </div>
      </div>
    );
  } else if (type === 'rec') {
    labelTxt = "อาทิตย์ • Strength Day B (50–60 นาที)";
    titleTxt = "Upper Body V-Taper + Glutes & Core";
    bodyHTML = (
      <div className="space-y-3">
        <p className="text-xs text-gray-500">
          <b>🎯 วัตถุประสงค์:</b> ปั้นกรอบ V-Taper เต็มระบบ (อกบน, ปีกหลัง, ไหล่ข้าง-หลัง, แขนหน้า-หลัง) ควบคู่ก้นและแกนกลาง (จันทร์พัก 100%)
        </p>
        <div className="space-y-2">
          <ExerciseCard
            bgClass="bg-indigo-50/20 border-indigo-100/60"
            title="B1. Incline DB Press 30° — 4 × 8–12 (1–2 RIR)"
            detail="อกบนเต็มคือจุดที่ทำให้หุ่นใส่เสื้อแล้วดูหนาและเท่ชัดที่สุด! ลงช้า 2–3 วิ ดัน 1 วิ"
            videoId="8iPEnn-ltC8"
            svgContent={
              <svg className="w-12 h-12" viewBox="0 0 100 100">
                <line x1="25" y1="75" x2="75" y2="75" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
                <g className="animate-press">
                  <line x1="32" y1="35" x2="68" y2="35" stroke="#00a3bf" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="32" cy="35" r="5" fill="#f59e0b" />
                  <circle cx="68" cy="35" r="5" fill="#f59e0b" />
                </g>
              </svg>
            }
          />
          <ExerciseCard
            bgClass="bg-indigo-50/20 border-indigo-100/60"
            title="B2. Two-Arm Bent-Over / Chest-Supported Row — 4 × 10–12"
            detail="ดึงบีบสะบักค้าง 1 วิ เติมความหนาช่วงกลางหลังและเปิดอกให้ผึ่งผาย"
            videoId="roCP6wCXPqo"
            svgContent={
              <svg className="w-12 h-12" viewBox="0 0 100 100">
                <g className="animate-row">
                  <circle cx="50" cy="30" r="6" fill="#0052cc" />
                  <line x1="35" y1="45" x2="65" y2="45" stroke="#0052cc" strokeWidth="4" strokeLinecap="round" />
                </g>
              </svg>
            }
          />
          <ExerciseCard
            bgClass="bg-indigo-50/20 border-indigo-100/60"
            title="B3. Lateral Raises + Rear Delt Fly (4 × 12–15) & B4. Arms (3 × 10–12)"
            detail="Superset ไหล่ข้าง+ไหล่หลัง ความถี่ 2x/wk คือเคล็ดลับไหล่กว้างเอวคอด + Incline Curl & Skull Crushers"
            videoId="3VcKaXpzqRo"
            svgContent={
              <svg className="w-12 h-12" viewBox="0 0 100 100">
                <circle cx="50" cy="25" r="6" fill="#00a3bf" />
                <g className="animate-raise-left"><line x1="50" y1="38" x2="25" y2="55" stroke="#36b37e" strokeWidth="3.5" strokeLinecap="round" /></g>
                <g className="animate-raise-right"><line x1="50" y1="38" x2="75" y2="55" stroke="#36b37e" strokeWidth="3.5" strokeLinecap="round" /></g>
              </svg>
            }
          />
          <ExerciseCard
            bgClass="bg-emerald-50/20 border-emerald-100/60"
            title="B5. Glute Bridge / Hip Thrust (3×12–15) + B6. Dead Bug & Side Plank"
            detail="ล็อกสะโพก-แกนกลางต้านการบิดและคุมเอวกระชับ (ตัด B5 ออกในสัปดาห์ที่เสาร์เตะบอล)"
            videoId="4XLEnwUr1d8"
            svgContent={
              <svg className="w-12 h-12" viewBox="0 0 100 100">
                <line x1="20" y1="80" x2="80" y2="80" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
                <g className="animate-tuck"><line x1="30" y1="60" x2="70" y2="60" stroke="#36b37e" strokeWidth="5" strokeLinecap="round" /></g>
              </svg>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-pocariBlue bg-blue-50 px-2.5 py-0.5 rounded-full">
              {labelTxt}
            </span>
            <h3 className="text-lg font-bold text-slate-800 mt-1.5">{titleTxt}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold text-xl px-2 cursor-pointer"
          >
            &times;
          </button>
        </div>
        <div>{bodyHTML}</div>
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
