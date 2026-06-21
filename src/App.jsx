import React, { useState, useEffect } from 'react';
import { weeklyData, START_DATE_STR } from './data/weeklyData';
import { WeekCard } from './components/WeekCard';
import { GuideModal } from './components/GuideModal';
import './App.css';

export default function App() {
  const startDateObj = new Date(START_DATE_STR);

  // Helper to calculate current week dynamically
  const getCurrentWeekNumber = () => {
    const today = new Date();
    const diffTime = today - startDateObj;
    if (diffTime < 0) return 1;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const currentW = Math.floor(diffDays / 7) + 1;
    return Math.min(Math.max(currentW, 1), 25);
  };

  const currentWeek = getCurrentWeekNumber();

  // Load progress state from localStorage on init
  const [progressState, setProgressState] = useState(() => {
    const saved = localStorage.getItem('pst34_treadmill_state');
    return saved ? JSON.parse(saved) : {};
  });

  // State for filtering
  const [activeFilter, setActiveFilter] = useState(currentWeek);

  // State for guide details modal
  const [modalGuide, setModalGuide] = useState(null);

  // Sync progress state to localStorage
  useEffect(() => {
    localStorage.setItem('pst34_treadmill_state', JSON.stringify(progressState));
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

  // Calculate session completions and progress ring
  const totalWorkouts = weeklyData.length * 5; // 125 total
  let completedCount = 0;
  weeklyData.forEach(w => {
    const keys = [`W${w.week}-easy`, `W${w.week}-str`, `W${w.week}-inc`, `W${w.week}-long`, `W${w.week}-rec`];
    keys.forEach(k => {
      if (progressState[k]) completedCount++;
    });
  });
  const percent = totalWorkouts > 0 ? Math.round((completedCount / totalWorkouts) * 100) : 0;

  // Filter week card listing
  let filteredData = [];
  if (activeFilter === 'all') {
    filteredData = weeklyData;
  } else if (typeof activeFilter === 'string') {
    filteredData = weeklyData.filter(d => d.phase === activeFilter);
  } else if (typeof activeFilter === 'number') {
    filteredData = weeklyData.filter(d => d.week === activeFilter);
  }

  const filters = [
    { value: 'all', label: 'ทุกสัปดาห์' },
    { value: 'base', label: 'เฟส 1: Base (W1-W4)' },
    { value: 'endurance', label: 'เฟส 2: ขยายปอด (W5-W12)' },
    { value: 'peak', label: 'เฟส 3: พีคเขาเชียงใหม่ (W13-W20)' },
    { value: 'taper', label: 'เฟส 4: พักลดระยะ (W21-W25)' }
  ];

  return (
    <div className="text-mountainDark antialiased min-h-screen bg-[#f4f5f7]">
      {/* Responsive Navigation Header */}
      <nav className="bg-pocariBlue text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 gap-2 min-h-16">
            <div className="flex items-center">
              <span className="font-bold text-sm sm:text-lg tracking-wide">
                🏔️ PST34 Chiang Mai - Gym & Road Edition
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
              Treadmill + Road Strategy
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold mt-2">แผนการซ้อมพิชิต 34K (D+ 1,200m)</h1>
            <p className="text-white/80 mt-2 text-xs sm:text-sm max-w-2xl leading-relaxed">
              ปรับแผนเจาะลึกรับมือสัญญะ "3 ยอดเขาเชียงใหม่" เน้นซ้อมชันบน Treadmill ในยิม สลับวิ่งยาวคุมเวลาบนถนนช่วงเย็น
            </p>
          </div>
          
          {/* Dashboard Progress Ring */}
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

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Info Grid (4 columns) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <span className="text-[10px] text-gray-400 font-medium block uppercase mb-1">ระยะทางจริงใบสมัคร</span>
            <span className="text-lg sm:text-xl font-bold text-pocariBlue">34 กิโลเมตร</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">เพิ่มจากแผนเดิม +4 km</span>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <span className="text-[10px] text-gray-400 font-medium block uppercase mb-1">ความชันสะสมจริง (D+)</span>
            <span className="text-lg sm:text-xl font-bold text-peakRed">1,200 เมตร</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">กราฟ 3 ยอดเขาเชียงใหม่</span>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <span className="text-[10px] text-gray-400 font-medium block uppercase mb-1">เวลาซ้อมพีคสุด (เสาร์)</span>
            <span className="text-lg sm:text-xl font-bold text-amber-500">4.5 - 5 ชั่วโมง</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">ขยายเพื่อต้านทานตะคริว</span>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <span className="text-[10px] text-gray-400 font-medium block uppercase mb-1">อุปกรณ์สำคัญต้องพก</span>
            <span className="text-lg sm:text-xl font-bold text-pocariLight">เป้น้ำ + เจล 6 ซอง</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">Cut-off สนามนี้ 10 ชม.</span>
          </div>
        </div>

        {/* Filter Toolbar (Mobile Overflow Optimized) */}
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

        {/* Schedule Listing and Strategy Guides */}
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
            
            {/* Treadmill Program Guide */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🏃‍♂️</span>
                <h2 className="text-base font-bold">สูตรควบคุมปุ่มลู่วิ่งไฟฟ้า (Treadmill Strategy)</h2>
              </div>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                เปลี่ยนลู่วิ่งในฟิตเนสกรุงเทพฯ ให้เป็นความชันขุนช่างเคี่ยน ด้วยโปรแกรม <b>วันพฤหัสบดี (Incline Interval)</b>:
              </p>
              <div className="space-y-3 text-xs">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="font-bold text-pocariBlue block">ช่วงที่ 1: วอร์มอัพ (10 นาที)</span>
                  <span className="text-gray-500 block mt-0.5">ปรับความชัน 0% วิ่งจ๊อกเบา ๆ ความเร็วสบาย ๆ ให้ระบบเลือดไหลเวียน</span>
                </div>
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100 text-amber-900 leading-relaxed">
                  <span className="font-bold block">ช่วงที่ 2: ช่วงปีนเขาจำลอง (40 นาทีเต็ม)</span>
                  <span className="block mt-0.5">
                    • ปรับความชันหน้าจอขึ้นไปที่ <b>10% ถึง 12%</b><br/>
                    • ลดความเร็วลงเหลือประมาณ <b>4.5 - 5.5 km/h</b><br/>
                    • ซ้อมท่า <b>Power Hiking</b> (ก้าวเท้ายาวโน้มตัวไปข้างหน้าเล็กน้อย ใช้มือดันหน้าขาหรือแกว่งแขนตัดลม) คุมชีพจรห้ามทะลุโซน 3
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="font-bold text-treadmillGreen block">ช่วงที่ 3: คูลดาวน์ (10 นาที)</span>
                  <span className="text-gray-500 block mt-0.5">ปรับความชันลดลงมาที่ 0% เปลี่ยนเป็นเดินช้า ๆ สบาย ๆ จนชีพจรกลับสู่ภาวะปกติ</span>
                </div>
              </div>
            </div>

            {/* Trail Survival Guide */}
            <div className="bg-gradient-to-br from-mountainDark to-slate-800 text-white rounded-2xl p-6 shadow-md">
              <h2 className="text-base font-bold text-pocariLight mb-3">🧭 แผนยุทธศาสตร์เอาตัวรอดบน 3 ยอดเขา</h2>
              <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
                <p className="border-b border-gray-700 pb-2">
                  <b className="text-white block mb-0.5">🏔️ ยอดที่ 1 (กิโลเมตรที่ 2-5): เขาพระนอน</b><br/>
                  ไต่ขึ้นชันพรวดแรก ห้ามวิ่งเด็ดขาด ให้ก้าวเดินตามจังหวะบนลู่วิ่งที่ซ้อมมา ใครวิ่งตรงนี้กล้ามเนื้อหน้าขาจะไหม้และตะคริวจะมาเร็ว
                </p>
                <p className="border-b border-gray-700 pb-2">
                  <b className="text-white block mb-0.5">⛰️ ยอดที่ 2 (กิโลเมตรที่ 12-20): ขุนช่างเคี่ยน (จุดวิกฤต)</b><br/>
                  เขาใหญ่และยาวที่สุด ต้องกินเจลเติมพลังงานคอยดักไว้ล่วงหน้า <b>ทุก ๆ 45 นาที</b> ห้ามรอจนกระหายหรือหมดแรง เพราะถ้า Bonk กลางป่าไผ่ความเร็วจะร่วงทันที
                </p>
                <p>
                  <b className="text-white block mb-0.5">🗻 ยอดที่ 3 (กิโลเมตรที่ 28-31): เขาดักทุบก่อนเส้นชัย</b><br/>
                  หลังจากผ่านทางราบล้า ๆ ขาจะระบมมาก ท่าบอดี้เวทหน้าขา (Eccentric Squat) ที่ซ้อมในวันพุธ จะช่วยประคองไม่ให้หัวเข่าพังในช่วงดิ่งตัวลงรอบสุดท้ายเข้าศูนย์ประชุมฯ
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Guide Details Modal */}
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
