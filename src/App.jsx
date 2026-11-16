import { useState, useEffect } from 'react';
import { weeklyData, START_DATE_STR } from './data/weeklyData';
import { WeekCard } from './components/WeekCard';
import { GuideModal } from './components/GuideModal';
import './App.css';

export default function App() {
  const startDateObj = new Date(START_DATE_STR);

  const getCurrentWeekNumber = () => {
    const today = new Date();
    const diffTime = today - startDateObj;
    if (diffTime < 0) return 1;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const currentW = Math.floor(diffDays / 7) + 1;
    return Math.min(Math.max(currentW, 1), weeklyData.length);
  };

  const currentWeek = getCurrentWeekNumber();

  const [progressState, setProgressState] = useState(() => {
    const saved = localStorage.getItem('hybrid_physique_v1_state');
    return saved ? JSON.parse(saved) : {};
  });

  const [activeFilter, setActiveFilter] = useState(currentWeek);
  const [modalGuide, setModalGuide] = useState(null);

  useEffect(() => {
    localStorage.setItem('hybrid_physique_v1_state', JSON.stringify(progressState));
  }, [progressState]);

  const handleCheckChange = (e, key) => {
    setProgressState(prev => ({
      ...prev,
      [key]: e.target.checked
    }));
  };

  const resetProgress = () => {
    if (confirm("ต้องการรีเซ็ตความคืบหน้าการซ้อมทั้งหมดใช่หรือไม่?")) {
      setProgressState({});
    }
  };

  const totalWorkouts = weeklyData.length * 5;
  let completedCount = 0;
  weeklyData.forEach(w => {
    const keys = [`W${w.week}-easy`, `W${w.week}-str`, `W${w.week}-inc`, `W${w.week}-long`, `W${w.week}-rec`];
    keys.forEach(k => {
      if (progressState[k]) completedCount++;
    });
  });
  const percent = totalWorkouts > 0 ? Math.round((completedCount / totalWorkouts) * 100) : 0;

  let filteredData = [];
  if (activeFilter === 'all') {
    filteredData = weeklyData;
  } else if (typeof activeFilter === 'string') {
    filteredData = weeklyData.filter(d => d.phase === activeFilter);
  } else if (typeof activeFilter === 'number') {
    filteredData = weeklyData.filter(d => d.week === activeFilter);
  }

  const filters = [
    { value: 'all', label: `ทุกสัปดาห์ (${weeklyData.length}W)` },
    { value: 'recovery', label: 'Phase 0: ฟื้นตัว PST30 (W1–W2)' },
    { value: 'phase1', label: 'Phase 1: Cut I & Incline (W3–W8)' },
    { value: 'phase2', label: 'Phase 2: V-Taper & 18% BF (W9–W16)' },
    { value: 'phase3', label: 'Phase 3: Lifestyle (W17)' }
  ];

  return (
    <div className="text-mountainDark antialiased min-h-screen bg-[#f4f5f7]">
      {/* Navigation Header */}
      <nav className="bg-pocariBlue text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 gap-2 min-h-16">
            <div className="flex items-center">
              <span className="font-bold text-sm sm:text-lg tracking-wide">
                💪 Hybrid Physique — 18.0% BF & Chill Z2 Strategy
              </span>
            </div>
            <button
              onClick={resetProgress}
              className="text-[10px] sm:text-xs bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-2.5 sm:py-1.5 sm:px-3 rounded transition shadow self-end sm:self-auto cursor-pointer"
            >
              รีเซ็ตความคืบหน้า
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-gradient-to-r from-mountainDark to-pocariBlue text-white py-8 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="bg-treadmillGreen text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              1 Activity / Day • Office-Friendly Split
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold mt-2">
              แผนซ้อม Hybrid Physique (18.0% BF + V-Taper + Chill Z2)
            </h1>
            <p className="text-white/80 mt-2 text-xs sm:text-sm max-w-2xl leading-relaxed">
              ต่อเนื่องหลังจบ PST30 (15 พ.ย. 2569 – มี.ค. 2570) — วิ่งชิล/เดินชัน 3 วัน (อ./พฤ./ส.) + เวท Hypertrophy 2 วัน (พ./อา.) + พัก จ./ศ. ไม่ซ้อน 2 เซสชั่นในวันทำงาน
            </p>
          </div>

          {/* Progress Ring */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 border border-white/10 w-full md:w-auto">
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/20"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-treadmillGreen transition-all duration-500"
                  strokeWidth="3.5"
                  strokeDasharray={`${percent}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-xs">
                {percent}%
              </div>
            </div>
            <div>
              <p className="text-[10px] text-white/60 uppercase font-medium">ความสำเร็จรวม</p>
              <p className="text-sm sm:text-base font-bold">
                {completedCount} / {totalWorkouts} เซสชั่น
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <span className="text-[10px] text-gray-400 font-medium block uppercase mb-1">เป้าหมายรูปร่าง</span>
            <span className="text-lg sm:text-xl font-bold text-pocariBlue">18.0% BF</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">~77–78 kg (จากฐาน 81.7 kg / 21.2%)</span>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <span className="text-[10px] text-gray-400 font-medium block uppercase mb-1">โปรตีน & Recomp Cut</span>
            <span className="text-lg sm:text-xl font-bold text-treadmillGreen">150–170 g/วัน</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">Deficit นุ่มๆ -350 to -450 kcal</span>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <span className="text-[10px] text-gray-400 font-medium block uppercase mb-1">จังหวะซ้อม (5 วัน/สัปดาห์)</span>
            <span className="text-lg sm:text-xl font-bold text-amber-500">3x วิ่ง + 2x เวท</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">รักษากล้ามขา ≥ 10.3–10.6 kg/ข้าง</span>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <span className="text-[10px] text-gray-400 font-medium block uppercase mb-1">โซนหัวใจหลัก (Karvonen)</span>
            <span className="text-lg sm:text-xl font-bold text-pocariLight">136–150 bpm</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">True Zone 2 (FatMax) | งด Interval</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {filters.map(f => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  activeFilter === f.value
                    ? 'bg-pocariBlue text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <label htmlFor="weekSelect" className="text-xs sm:text-sm font-bold text-gray-500 whitespace-nowrap">
              เลือกสัปดาห์:
            </label>
            <select
              id="weekSelect"
              value={typeof activeFilter === 'number' ? activeFilter : ""}
              onChange={(e) => setActiveFilter(e.target.value ? parseInt(e.target.value) : 'all')}
              className="bg-gray-50 border border-gray-300 text-slate-800 text-xs sm:text-sm rounded-lg focus:ring-pocariBlue focus:border-pocariBlue block p-2 font-medium cursor-pointer"
            >
              <option value="" disabled hidden>เลือกสัปดาห์</option>
              {weeklyData.map(w => (
                <option key={w.week} value={w.week}>
                  สัปดาห์ที่ {w.week} {w.week === currentWeek ? '(ปัจจุบัน)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Schedule & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Weeks List */}
          <div className="lg:col-span-2 space-y-6">
            {filteredData.map(w => (
              <WeekCard
                key={w.week}
                week={w}
                progressState={progressState}
                onCheckChange={handleCheckChange}
                onOpenGuide={(type, weekNum) => setModalGuide({ type, weekNum })}
                startDateStr={START_DATE_STR}
              />
            ))}
          </div>

          {/* Sidebar Strategy Guides */}
          <div className="space-y-6">
            {/* Treadmill & HR Guide */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">⛰️</span>
                <h2 className="text-base font-bold">สูตรลู่วิ่ง & โซนหัวใจ (%HRR Karvonen)</h2>
              </div>
              <div className="space-y-3 text-xs">
                <div className="bg-sky-50 p-3 rounded-xl border border-sky-200">
                  <span className="font-bold text-pocariBlue block">🛡️ Phase 0 (15–29 พ.ย.): ทางราบ 0–0.5% เท่านั้น</span>
                  <span className="text-gray-600 block mt-0.5">
                    ตรวจ Gate เช้าพุธ 18 พ.ย. (`HRV ≥ 50`, `RHR ≤ 49`, เข่า `0/10`) ห้ามเดินชัน &gt;5% และงดเตะบอลตลอด 14 วันแรก
                  </span>
                </div>
                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-emerald-950 leading-relaxed">
                  <span className="font-bold block">🔓 พฤหัสบดี (ธ.ค.+): Steep Incline Mastery</span>
                  <span className="block mt-0.5">
                    • 10m Chill Z2 Warm-up (0.5%)<br />
                    • <b>25–35m เดินชัน 8–12%</b> (4.5–5.5 km/h) <b>ห้ามจับราว!</b><br />
                    • คุมหัวใจ Z2–Low Z3 (<b>130–152 bpm</b>)
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="font-bold text-slate-700 block">⌚ ตั้งค่า Garmin (`RHR 45 / Max 196`)</span>
                  <span className="text-gray-500 block mt-0.5">
                    Z1: 121–135 | <b>Z2: 136–150</b> | Z3: 151–165 | Z4: 166–180
                  </span>
                </div>
              </div>
            </div>

            {/* Nutrition & Football Swap */}
            <div className="bg-gradient-to-br from-mountainDark to-slate-800 text-white rounded-2xl p-6 shadow-md">
              <h2 className="text-base font-bold text-pocariLight mb-3">🥗 โภชนาการ & กฎ Clean Football Swap</h2>
              <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
                <div className="border-b border-gray-700 pb-2.5 space-y-1">
                  <b className="text-white block">แคลอรีตามประเภทวัน (โปรตีนคงที่ 150–170g):</b>
                  <p>🟢 พัก (จ./ศ.): <b>1,850–2,000 kcal</b> (คาร์บต่ำ 140–165g)</p>
                  <p>🟡 คาร์ดิโอ (อ./พฤ.): <b>2,050–2,150 kcal</b> (คาร์บ 185–215g)</p>
                  <p>🔵 เวท (พ./อา.): <b>2,150–2,300 kcal</b> (คาร์บรอบมื้อเวท)</p>
                  <p>🟠 วิ่งยาว/เตะบอล (ส.): <b>2,200–2,350 kcal</b></p>
                </div>
                <p className="border-b border-gray-700 pb-2.5">
                  <b className="text-white block mb-0.5">⚽ กติกาเตะฟุตบอล (1 Activity/Day):</b>
                  ถ้าเตะวันเสาร์ ➔ ตัดวิ่งยาวเสาร์ออก + วันอาทิตย์เล่น Upper+Core ปกติแต่<b>ตัดท่า Hip Thrust</b> เพื่อถนอมสะโพก-หลังขา
                </p>
                <p>
                  <b className="text-white block mb-0.5">⚖️ Fitdays Check (ทุกเช้าพุธ):</b>
                  รักษากล้ามขา ≥ 10.3 kg/ข้าง และ FFM ≥ 62.5 kg หากตก 2 สัปดาห์ติดให้เพิ่มคาร์บ +200 kcal ทันที
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {modalGuide && (
        <GuideModal
          type={modalGuide.type}
          weekNum={modalGuide.weekNum}
          onClose={() => setModalGuide(null)}
          weeklyData={weeklyData}
        />
      )}
    </div>
  );
}
