import React, { useState } from 'react';

// Video Player Subcomponent
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

export function GuideModal({ type, weekNum, onClose, weeklyData }) {
  if (!type) return null;

  let labelTxt = "";
  let titleTxt = "";
  let bodyHTML = null;

  const wObj = weeklyData.find(d => d.week === weekNum);

  if (type === 'easy') {
    labelTxt = "Aerobic Base";
    titleTxt = "วิ่งถนนโซน 2 รักษาหัวใจต่ำ";
    bodyHTML = (
      <div>
        <p className="text-xs text-gray-500 mb-3"><b>🎯 วัตถุประสงค์:</b> สร้างความคงทนให้หัวใจและปอดโดยไม่เกิดความเครียดต่อโครงสร้างกล้ามเนื้อมากเกินไป</p>
        <p className="text-xs text-slate-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
          <b>📋 วิธีซ้อมปฏิบัติ (60 นาที):</b> วิ่งจ๊อกเบา ๆ บนพื้นราบที่ความเข้มข้นต่ำ คุยไปวิ่งไปได้โดยไม่ติดขัด แนะนำให้พยายามรักษาจังหวะรอบขา (Cadence) ให้อยู่ระหว่าง 170-180 ครั้งต่อนาทีเพื่อเซฟข้อต่อ
        </p>
      </div>
    );
  } else if (type === 'str') {
    labelTxt = "Lower & Upper Strength";
    titleTxt = "เวทเข่าเฟิร์ม + เวทช่วงบนเสริมความหนา";
    bodyHTML = (
      <div>
        <p className="text-xs text-gray-500 mb-3"><b>🎯 วัตถุประสงค์:</b> เสริมแกร่งข้อต่อสะบ้าเข่ารับแรงกดลงเขา + สร้างไหล่และหลังซัพพอร์ตเป้น้ำ</p>
        <div className="space-y-4">
          <div>
            <span className="font-bold text-purple-700 block text-xs uppercase tracking-wide mb-2">📋 ท่าขาเซฟเข่า (ทำ 3 เซต):</span>
            <div className="space-y-2">
              {/* 1. Eccentric Squats */}
              <div className="exercise-card bg-purple-50/20 p-2.5 rounded-xl border border-purple-100/50 flex flex-col gap-1.5">
                <div className="flex gap-3 items-center">
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden">
                    <svg className="w-12 h-12" viewBox="0 0 100 100">
                      <line x1="20" y1="85" x2="80" y2="85" stroke="#475569" strokeWidth="4" strokeLinecap="round"/>
                      <g className="animate-squat">
                        <circle cx="50" cy="25" r="7" fill="#36b37e"/>
                        <line x1="50" y1="32" x2="50" y2="55" stroke="#36b37e" strokeWidth="5" strokeLinecap="round"/>
                        <line x1="50" y1="38" x2="65" y2="38" stroke="#36b37e" strokeWidth="4" strokeLinecap="round"/>
                        <line x1="50" y1="55" x2="50" y2="70" stroke="#00a3bf" strokeWidth="5" strokeLinecap="round"/>
                        <line x1="50" y1="70" x2="50" y2="85" stroke="#00a3bf" strokeWidth="5" strokeLinecap="round"/>
                      </g>
                    </svg>
                  </div>
                  <div className="text-xs text-slate-800 flex-grow">
                    <b className="text-xs block">1. Eccentric Squats (15 ครั้ง)</b>
                    <span className="text-gray-500 block text-[11px] mt-0.5"><b>วิธีเล่น:</b> ย่อก้นลงช้าๆ 4 วินาที ดันขึ้นปกติ เพื่อเพิ่มแรงต้านหน้าขาลงเขา</span>
                  </div>
                </div>
                <VideoPlayer videoId="GT3WyYA2wNo" />
              </div>

              {/* 2. Box Step-Ups */}
              <div className="exercise-card bg-purple-50/20 p-2.5 rounded-xl border border-purple-100/50 flex flex-col gap-1.5">
                <div className="flex gap-3 items-center">
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden">
                    <svg className="w-12 h-12" viewBox="0 0 100 100">
                      <rect x="55" y="60" width="30" height="25" rx="3" fill="#172b4d"/>
                      <line x1="10" y1="85" x2="90" y2="85" stroke="#475569" strokeWidth="4"/>
                      <g className="animate-step">
                        <circle cx="40" cy="30" r="7" fill="#36b37e"/>
                        <line x1="40" y1="37" x2="40" y2="60" stroke="#36b37e" strokeWidth="5" strokeLinecap="round"/>
                        <line x1="40" y1="60" x2="50" y2="72" stroke="#00a3bf" strokeWidth="5" strokeLinecap="round"/>
                        <line x1="50" y1="72" x2="50" y2="85" stroke="#00a3bf" strokeWidth="5" strokeLinecap="round"/>
                      </g>
                    </svg>
                  </div>
                  <div className="text-xs text-slate-800 flex-grow">
                    <b className="text-xs block">2. Box Step-Ups (ข้างละ 10 ครั้ง)</b>
                    <span className="text-gray-500 block text-[11px] mt-0.5"><b>วิธีเล่น:</b> ก้าวขึ้นกล่องสลับข้างกัน เพื่อเสริมกล้ามเนื้อรอบข้อต่อสะบ้าเข่าอย่างปลอดภัย</span>
                  </div>
                </div>
                <VideoPlayer videoId="kYJ6J-Q6i8M" />
              </div>

              {/* 3. Calf Raises */}
              <div className="exercise-card bg-purple-50/20 p-2.5 rounded-xl border border-purple-100/50 flex flex-col gap-1.5">
                <div className="flex gap-3 items-center">
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden">
                    <svg className="w-12 h-12" viewBox="0 0 100 100">
                      <line x1="20" y1="85" x2="80" y2="85" stroke="#475569" strokeWidth="4"/>
                      <g className="animate-calf">
                        <circle cx="50" cy="25" r="7" fill="#36b37e"/>
                        <line x1="50" y1="32" x2="50" y2="58" stroke="#36b37e" strokeWidth="5" strokeLinecap="round"/>
                        <line x1="50" y1="58" x2="50" y2="80" stroke="#00a3bf" strokeWidth="5" strokeLinecap="round"/>
                      </g>
                    </svg>
                  </div>
                  <div className="text-xs text-slate-800 flex-grow">
                    <b className="text-xs block">3. Single-Leg Calf Raises (ข้างละ 15 ครั้ง)</b>
                    <span className="text-gray-500 block text-[11px] mt-0.5"><b>วิธีเล่น:</b> เขย่งส้นเท้าขาเดียวขึ้นสุดลงสุด เพื่อป้องกันน่องล้าและเกิดตะคริวในสนามเทรล</span>
                  </div>
                </div>
                <VideoPlayer videoId="Jb-vU6a64R8" />
              </div>
            </div>
          </div>

          <div>
            <span className="font-bold text-pocariBlue block text-xs uppercase tracking-wide mb-2">🏋️‍♂️ โปรแกรมเวทช่วงบนเสริมความหนา (ทำ 3 เซต):</span>
            <div className="space-y-2">
              {/* Floor Press */}
              <div className="exercise-card bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col gap-1.5">
                <div className="flex gap-3 items-center">
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden">
                    <svg className="w-12 h-12" viewBox="0 0 100 100">
                      <line x1="10" y1="80" x2="90" y2="80" stroke="#475569" strokeWidth="4"/>
                      <rect x="25" y="70" width="50" height="10" rx="3" fill="#36b37e"/>
                      <circle cx="20" cy="73" r="6" fill="#36b37e"/>
                      <g className="animate-press">
                        <circle cx="50" cy="40" r="4" fill="#ff5630"/>
                        <line x1="42" y1="40" x2="58" y2="40" stroke="#ff5630" strokeWidth="3"/>
                        <line x1="50" y1="40" x2="50" y2="70" stroke="#00a3bf" strokeWidth="4" strokeLinecap="round"/>
                      </g>
                    </svg>
                  </div>
                  <div className="text-xs text-slate-800 flex-grow">
                    <b className="text-xs block">1. Dumbbell Floor Press (12 ครั้ง)</b>
                    <span className="text-gray-500 block text-[11px] mt-0.5"><b>วิธีเล่น:</b> นอนหงายชันเข่า ดันดัมเบลขึ้นตรง ผ่อนลงช้าๆ ศอกแตะพื้นมุม 45°-60° (เซฟไหล่และข้อมือได้ดี)</span>
                  </div>
                </div>
                <VideoPlayer videoId="kR2e_G6h7XU" />
              </div>

              {/* Lateral Raises */}
              <div className="exercise-card bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col gap-1.5">
                <div className="flex gap-3 items-center">
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden">
                    <svg className="w-12 h-12" viewBox="0 0 100 100">
                      <circle cx="50" cy="25" r="7" fill="#36b37e"/>
                      <line x1="50" y1="32" x2="50" y2="65" stroke="#36b37e" strokeWidth="5" strokeLinecap="round"/>
                      <line x1="45" y1="65" x2="40" y2="85" stroke="#00a3bf" strokeWidth="4"/>
                      <line x1="55" y1="65" x2="60" y2="85" stroke="#00a3bf" strokeWidth="4"/>
                      <g className="animate-raise-left">
                        <line x1="50" y1="35" x2="30" y2="35" stroke="#00a3bf" strokeWidth="4" strokeLinecap="round"/>
                        <circle cx="30" cy="35" r="3" fill="#ff5630"/>
                      </g>
                      <g className="animate-raise-right">
                        <line x1="50" y1="35" x2="70" y2="35" stroke="#00a3bf" strokeWidth="4" strokeLinecap="round"/>
                        <circle cx="70" cy="35" r="3" fill="#ff5630"/>
                      </g>
                    </svg>
                  </div>
                  <div className="text-xs text-slate-800 flex-grow">
                    <b className="text-xs block">2. Dumbbell Lateral Raises (12-15 ครั้ง)</b>
                    <span className="text-gray-500 block text-[11px] mt-0.5"><b>วิธีเล่น:</b> ยืนหรือนั่งหลังตรง กางแขนขนานพื้น งอศอกเล็กน้อย ผ่อนลงช้าๆ (สร้างไหล่กลม กว้าง บาลานซ์สัดส่วน)</span>
                  </div>
                </div>
                <VideoPlayer videoId="5r8Oa7_V5oE" />
              </div>

              {/* Rear Delt Fly */}
              <div className="exercise-card bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col gap-1.5">
                <div className="flex gap-3 items-center">
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden">
                    <svg className="w-12 h-12" viewBox="0 0 100 100">
                      <rect x="55" y="60" width="25" height="25" rx="2" fill="#172b4d"/>
                      <circle cx="32" cy="42" r="6" fill="#36b37e"/>
                      <line x1="38" y1="46" x2="60" y2="60" stroke="#36b37e" strokeWidth="5" strokeLinecap="round"/>
                      <line x1="60" y1="60" x2="60" y2="85" stroke="#00a3bf" strokeWidth="4"/>
                      <g className="animate-press">
                        <line x1="38" y1="46" x2="38" y2="66" stroke="#00a3bf" strokeWidth="4" strokeLinecap="round"/>
                        <circle cx="38" cy="66" r="4" fill="#ff5630"/>
                      </g>
                    </svg>
                  </div>
                  <div className="text-xs text-slate-800 flex-grow">
                    <b className="text-xs block">3. Dumbbell Rear Delt Fly (12 ครั้ง)</b>
                    <span className="text-gray-500 block text-[11px] mt-0.5"><b>วิธีเล่น:</b> นั่งก้มตัว กางแขนขึ้นด้านข้างเยื้องหลัง บีบสะบักเข้าหาคู่ (แก้ไหล่ห่อ ประคองหลังเวลาเดินชัน)</span>
                  </div>
                </div>
                <VideoPlayer videoId="kY0R8-9k_6Q" />
              </div>

              {/* Overhead Tricep Extension */}
              <div className="exercise-card bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col gap-1.5">
                <div className="flex gap-3 items-center">
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden">
                    <svg className="w-12 h-12" viewBox="0 0 100 100">
                      <rect x="35" y="65" width="25" height="20" rx="2" fill="#172b4d"/>
                      <circle cx="48" cy="40" r="7" fill="#36b37e"/>
                      <line x1="48" y1="47" x2="48" y2="70" stroke="#36b37e" strokeWidth="5" strokeLinecap="round"/>
                      <g className="animate-press">
                        <rect x="40" y="15" width="16" height="6" rx="1.5" fill="#ff5630"/>
                        <line x1="48" y1="21" x2="48" y2="40" stroke="#00a3bf" strokeWidth="4" strokeLinecap="round"/>
                      </g>
                    </svg>
                  </div>
                  <div className="text-xs text-slate-800 flex-grow">
                    <b className="text-xs block">4. Dumbbell Overhead Tricep (12 ครั้ง)</b>
                    <span className="text-gray-500 block text-[11px] mt-0.5"><b>วิธีเล่น:</b> นั่งหลังตรง ถือดัมเบลสองมือ ประคองลงด้านหลังศีรษะจนสุดแล้วดันเหยียดตรง (ลดไขมันท้องแขนย้วย)</span>
                  </div>
                </div>
                <VideoPlayer videoId="fYqswDVbJDg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (type === 'inc') {
    labelTxt = "Treadmill Mastery";
    titleTxt = "ปีนเขาขุนช่างเคี่ยนจำลองบนลู่วิ่ง";
    bodyHTML = (
      <div>
        <p className="text-xs text-gray-500 mb-3"><b>🎯 วัตถุประสงค์:</b> สร้างแรงขับเคลื่อนข้อเท้าและสะโพกเพื่อสู้กับความชัน D+ 1,200m</p>
        <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100 text-xs text-amber-900 leading-relaxed">
          <b>📋 วิธีปฏิบัติตามหน้าจอ (60 นาที):</b><br/>
          • <b>ช่วงที่ 1 (10 นาที):</b> วอร์มอัพ ความชัน 0% วิ่งจ๊อกเบา ๆ ความเร็วสบาย ๆ ให้ระบบเลือดไหลเวียน<br/>
          • <b>ช่วงที่ 2 (40 นาทีเต็ม):</b> ปรับความชันขึ้นที่ <b>10% ถึง 12%</b> ลดความเร็วลู่วิ่งเหลือ <b>4.5 - 5.5 km/h</b> ฝึกเดินก้าวยาวทรงพลัง (Power Hiking) โน้มลำตัวไปข้างหน้าเล็กน้อย คุมชีพจรห้ามทะลุโซน 3<br/>
          • <b>ช่วงที่ 3 (10 นาที):</b> คูลดาวน์ ปรับชันลดเหลือ 0% เดินคลายกรดช้า ๆ
        </div>
      </div>
    );
  } else if (type === 'long') {
    labelTxt = "Long Run Execution";
    titleTxt = "วิ่งยาวประคองเวลาเย็นวันเสาร์";
    bodyHTML = wObj.isRace ? (
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-pocariBlue text-xs leading-relaxed">
        <b className="block text-sm">🏁 วันลงสนามจริง PST34 เชียงใหม่!</b>
        • ออกสตาร์ทห้ามวิ่งแข่งกับใคร คุมหัวใจ Zone 2 ปล่อยฝูงชนไปก่อน<br/>
        • เขาพระนอนลูกแรก และขุนช่างเคี่ยนลูกกลาง ให้ใช้ฟอร์มเดินชันที่ฝึกบนลู่วิ่งไฟฟ้าอย่างมีจังหวะ<br/>
        • กินเจลให้พลังงานและจิบน้ำทุก ๆ 45 นาทีอย่างเคร่งครัด ห้ามลืมเด็ดขาดเพื่อเซฟพลังงานยอดเขาลูกสุดท้ายก่อนเข้าเส้นชัย
      </div>
    ) : (
      <div>
        <p className="text-xs text-gray-500 mb-3"><b>🎯 วันนี้ต้องเคลื่อนที่ต่อเนื่อง: <span className="text-rose-600 font-bold">{Math.floor(wObj.minutes / 60)} ชม. {wObj.minutes % 60} นาที</span></b></p>
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-slate-700 leading-relaxed">
          <b>📋 วิธีซ้อมปฏิบัติ:</b> วิ่งบนถนนยาว ๆ ช่วงเย็นด้วยความเร็วโซน 2 แนะนำให้ใส่เป้น้ำวิ่งเพื่อเลียนแบบน้ำหนักบรรทุกจริง ตั้งแต่สัปดาห์ที่ 3 เป็นต้นไป ให้พกเจลพลังงานไปซ้อมกินที่นาทีที่ 45 และนาทีที่ 90 เพื่อฝึกระบบการดูดซึมอาหารไม่ให้จุกเสียดท้องยามวิ่ง
        </div>
      </div>
    );
  } else if (type === 'rec') {
    labelTxt = "Active & Upper/Core Recovery";
    titleTxt = "วิ่งคลายกรด + เวท Upper Body & Core";
    bodyHTML = (
      <div>
        <p className="text-xs text-gray-500 mb-3"><b>🎯 วัตถุประสงค์:</b> ขับกรดแลคติกหลังวิ่งยาว + สร้างความแข็งแกร่งกล้ามเนื้อส่วนบนและแกนกลางโดยเซฟเข่าและหลัง</p>
        <p className="text-xs text-slate-700 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 mb-4"><b>📋 1. วิ่งคลายกรด (Active Recovery):</b> วิ่งจ๊อกเบา ๆ หรือเดินเร็วในสวน 45 นาที คุมชีพจรโซน 1 หรือ 2 ตอนต้น</p>
        
        <span className="font-bold text-pocariBlue block text-xs uppercase tracking-wide mb-2">🏋️‍♂️ โปรแกรมเวทวันอาทิตย์ (ทำ 3 เซต):</span>
        <div className="space-y-2">
          {/* Seated Shoulder Press */}
          <div className="exercise-card bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col gap-1.5">
            <div className="flex gap-3 items-center">
              <div className="flex-shrink-0 w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden">
                <svg className="w-12 h-12" viewBox="0 0 100 100">
                  <rect x="35" y="65" width="30" height="20" rx="2" fill="#172b4d"/>
                  <circle cx="50" cy="40" r="7" fill="#36b37e"/>
                  <line x1="50" y1="47" x2="50" y2="70" stroke="#36b37e" strokeWidth="5" strokeLinecap="round"/>
                  <g className="animate-press">
                    <circle cx="35" cy="22" r="3" fill="#ff5630"/>
                    <circle cx="65" cy="22" r="3" fill="#ff5630"/>
                    <line x1="30" y1="22" x2="40" y2="22" stroke="#ff5630" strokeWidth="2"/>
                    <line x1="60" y1="22" x2="70" y2="22" stroke="#ff5630" strokeWidth="2"/>
                    <line x1="35" y1="22" x2="35" y2="50" stroke="#00a3bf" strokeWidth="3" strokeLinecap="round"/>
                    <line x1="65" y1="22" x2="65" y2="50" stroke="#00a3bf" strokeWidth="3" strokeLinecap="round"/>
                  </g>
                </svg>
              </div>
              <div className="text-xs text-slate-800 flex-grow">
                <b className="text-xs block">1. Seated Shoulder Press (10-12 ครั้ง)</b>
                <span className="text-gray-500 block text-[11px] mt-0.5"><b>วิธีเล่น:</b> นั่งพิงพนัก ดันดัมเบลสองข้างขึ้นตรง ผ่อนลงช้าๆ ศอกตั้งฉาก 90° (ช่วยเซฟหลังล่างและหัวเข่า 100%)</span>
              </div>
            </div>
            <VideoPlayer videoId="Xh0QoE0y60U" />
          </div>

          {/* One-Arm Row */}
          <div className="exercise-card bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col gap-1.5">
            <div className="flex gap-3 items-center">
              <div className="flex-shrink-0 w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden">
                <svg className="w-12 h-12" viewBox="0 0 100 100">
                  <line x1="30" y1="65" x2="80" y2="65" stroke="#172b4d" strokeWidth="4"/>
                  <line x1="40" y1="65" x2="40" y2="85" stroke="#172b4d" strokeWidth="3"/>
                  <line x1="70" y1="65" x2="70" y2="85" stroke="#172b4d" strokeWidth="3"/>
                  <line x1="30" y1="45" x2="70" y2="45" stroke="#36b37e" strokeWidth="5" strokeLinecap="round"/>
                  <circle cx="24" cy="45" r="6" fill="#36b37e"/>
                  <line x1="70" y1="45" x2="70" y2="65" stroke="#00a3bf" strokeWidth="4"/>
                  <g className="animate-row">
                    <line x1="50" y1="45" x2="50" y2="65" stroke="#00a3bf" strokeWidth="4"/>
                    <circle cx="50" cy="65" r="4" fill="#ff5630"/>
                  </g>
                </svg>
              </div>
              <div className="text-xs text-slate-800 flex-grow">
                <b className="text-xs block">2. One-Arm Dumbbell Row (ข้างละ 12 ครั้ง)</b>
                <span className="text-gray-500 block text-[11px] mt-0.5"><b>วิธีเล่น:</b> ชันเข่าและมือขวาบนม้านั่ง ก้มตัวขนานพื้น ดึงดัมเบลซ้ายขึ้นหนีบศอก (เสริมหลังหนา รองรับเป้น้ำเป้วิ่งเทรล)</span>
              </div>
            </div>
            <VideoPlayer videoId="kY31WnS4B58" />
          </div>

          {/* Incline Pushups */}
          <div className="exercise-card bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col gap-1.5">
            <div className="flex gap-3 items-center">
              <div className="flex-shrink-0 w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden">
                <svg className="w-12 h-12" viewBox="0 0 100 100">
                  <line x1="50" y1="60" x2="75" y2="60" stroke="#172b4d" strokeWidth="5"/>
                  <line x1="62" y1="60" x2="62" y2="85" stroke="#172b4d" strokeWidth="3"/>
                  <g className="animate-press">
                    <line x1="30" y1="85" x2="60" y2="50" stroke="#36b37e" strokeWidth="5" strokeLinecap="round"/>
                    <circle cx="64" cy="45" r="6" fill="#36b37e"/>
                    <line x1="55" y1="56" x2="55" y2="60" stroke="#00a3bf" strokeWidth="4"/>
                  </g>
                </svg>
              </div>
              <div className="text-xs text-slate-800 flex-grow">
                <b className="text-xs block">3. Incline Push-Ups กับเก้าอี้ (12-15 ครั้ง)</b>
                <span className="text-gray-500 block text-[11px] mt-0.5"><b>วิธีเล่น:</b> วิดพื้นวางมือบนเก้าอี้ ลำตัวเกร็งตรง (ลดภาระน้ำหนักตัว 86.8 กก. บนข้อมือและข้อศอก สร้างอกสวยงาม)</span>
              </div>
            </div>
            <VideoPlayer videoId="kY-U9-xN8Lg" />
          </div>

          {/* Bicep Curls */}
          <div className="exercise-card bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col gap-1.5">
            <div className="flex gap-3 items-center">
              <div className="flex-shrink-0 w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden">
                <svg className="w-12 h-12" viewBox="0 0 100 100">
                  <rect x="35" y="65" width="25" height="20" rx="2" fill="#172b4d"/>
                  <circle cx="48" cy="40" r="7" fill="#36b37e"/>
                  <line x1="48" y1="47" x2="48" y2="70" stroke="#36b37e" strokeWidth="5" strokeLinecap="round"/>
                  <g className="animate-curl">
                    <line x1="48" y1="50" x2="48" y2="68" stroke="#00a3bf" strokeWidth="4" strokeLinecap="round"/>
                    <circle cx="48" cy="68" r="3.5" fill="#ff5630"/>
                  </g>
                </svg>
              </div>
              <div className="text-xs text-slate-800 flex-grow">
                <b className="text-xs block">4. Seated Dumbbell Bicep Curls (12 ครั้ง)</b>
                <span className="text-gray-500 block text-[11px] mt-0.5"><b>วิธีเล่น:</b> นั่งหลังตรง ถือดัมเบลหงายมือ ดึงพับข้อศอกหาบ่า ค่อยๆ ผ่อน (สร้างหน้าแขนเฟิร์ม ไม่ลีบหลังวิ่งยาว)</span>
              </div>
            </div>
            <VideoPlayer videoId="yfCz6ChTOOE" />
          </div>

          {/* Knee Tucks */}
          <div className="exercise-card bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col gap-1.5">
            <div className="flex gap-3 items-center">
              <div className="flex-shrink-0 w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden">
                <svg className="w-12 h-12" viewBox="0 0 100 100">
                  <rect x="35" y="60" width="20" height="25" rx="2" fill="#172b4d"/>
                  <circle cx="45" cy="35" r="6" fill="#36b37e"/>
                  <line x1="45" y1="41" x2="45" y2="60" stroke="#36b37e" strokeWidth="5" strokeLinecap="round"/>
                  <g className="animate-tuck">
                    <line x1="45" y1="60" x2="65" y2="60" stroke="#00a3bf" strokeWidth="4" strokeLinecap="round"/>
                    <line x1="65" y1="60" x2="75" y2="70" stroke="#00a3bf" strokeWidth="4" strokeLinecap="round"/>
                  </g>
                </svg>
              </div>
              <div className="text-xs text-slate-800 flex-grow">
                <b className="text-xs block">5. Seated Knee Tucks (15 ครั้ง)</b>
                <span className="text-gray-500 block text-[11px] mt-0.5"><b>วิธีเล่น:</b> นั่งริมเก้าอี้ มือจับขอบ เอนตัวหลังตรงเกร็งท้อง ดึงเข่าสองข้างหาอก ยืดเหยียดขาสลับเข้าออก (เซฟหลังล่างได้ 100%)</span>
              </div>
            </div>
            <VideoPlayer videoId="Tm3P82oHn4k" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-transform duration-300">
        {/* Sticky modal header */}
        <div className="bg-mountainDark p-6 text-white relative sticky top-0 z-10">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition cursor-pointer"
          >
            ✕
          </button>
          <span className="text-[10px] bg-treadmillGreen text-white px-2.5 py-1 rounded-full uppercase font-bold tracking-wider">
            {labelTxt}
          </span>
          <h3 className="text-xl font-bold mt-2">
            {titleTxt}
          </h3>
        </div>
        
        {/* Modal body */}
        <div className="p-6 space-y-4 text-sm text-gray-600 leading-relaxed">
          {bodyHTML}
        </div>
      </div>
    </div>
  );
}
