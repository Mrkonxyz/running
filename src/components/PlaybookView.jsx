export function PlaybookView({ plan }) {
  const { playbook } = plan;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      {playbook?.overviewCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {playbook.overviewCards.map((card, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-3">{card.title}</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {card.items.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-pocariBlue font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Strength Day A & B Tables (for Hybrid Plan) */}
      {playbook?.strengthDayA && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">
                พุธ • 55–60 นาที
              </span>
              <h3 className="text-lg font-bold text-slate-800 mt-1">
                🏋️‍♂️ Strength Day A: Lower Knee Armor + Upper Push/Pull Thickness
              </h3>
            </div>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg font-semibold border border-emerald-200">
              🧪 ก่อนซ้อม 30–60m: Collagen 15g + Vit C
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                  <th className="py-2.5 px-3 font-bold">รหัส</th>
                  <th className="py-2.5 px-3 font-bold">กลุ่มกล้ามเนื้อ</th>
                  <th className="py-2.5 px-3 font-bold">🏠 Home Dumbbell</th>
                  <th className="py-2.5 px-3 font-bold">🏢 Commercial Gym</th>
                  <th className="py-2.5 px-3 font-bold">เซต × ครั้ง</th>
                  <th className="py-2.5 px-3 font-bold">Tempo & RIR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {playbook.strengthDayA.map((row) => (
                  <tr key={row.code} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-bold text-purple-700">{row.code}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{row.muscle}</td>
                    <td className="py-2.5 px-3 text-slate-600">{row.home}</td>
                    <td className="py-2.5 px-3 text-slate-600">{row.gym}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">{row.sets}</td>
                    <td className="py-2.5 px-3 text-slate-500">{row.rir}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {playbook?.strengthDayB && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
          <div className="mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              อาทิตย์ • 50–60 นาที
            </span>
            <h3 className="text-lg font-bold text-slate-800 mt-1">
              📐 Strength Day B: Upper Body V-Taper + Glutes & Core
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                  <th className="py-2.5 px-3 font-bold">รหัส</th>
                  <th className="py-2.5 px-3 font-bold">กลุ่มกล้ามเนื้อ</th>
                  <th className="py-2.5 px-3 font-bold">🏠 Home Dumbbell</th>
                  <th className="py-2.5 px-3 font-bold">🏢 Commercial Gym</th>
                  <th className="py-2.5 px-3 font-bold">เซต × ครั้ง</th>
                  <th className="py-2.5 px-3 font-bold">Tempo & RIR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {playbook.strengthDayB.map((row) => (
                  <tr key={row.code} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-bold text-indigo-700">{row.code}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{row.muscle}</td>
                    <td className="py-2.5 px-3 text-slate-600">{row.home}</td>
                    <td className="py-2.5 px-3 text-slate-600">{row.gym}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">{row.sets}</td>
                    <td className="py-2.5 px-3 text-slate-500">{row.rir}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Nutrition Matrix & HR Zones */}
      {(playbook?.nutritionMatrix || playbook?.hrZones) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {playbook.nutritionMatrix && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-3">🥗 ตารางพลังงาน & สารอาหารตามประเภทวัน</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                      <th className="py-2 px-2.5 font-bold">โหมด</th>
                      <th className="py-2 px-2.5 font-bold">วัน</th>
                      <th className="py-2 px-2.5 font-bold">kcal</th>
                      <th className="py-2 px-2.5 font-bold">P / C / F</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {playbook.nutritionMatrix.map((n, i) => (
                      <tr key={i} className="hover:bg-slate-50/70">
                        <td className="py-2 px-2.5 font-semibold text-slate-800">{n.mode}</td>
                        <td className="py-2 px-2.5 text-slate-500">{n.days}</td>
                        <td className="py-2 px-2.5 font-bold text-pocariBlue whitespace-nowrap">{n.kcal}</td>
                        <td className="py-2 px-2.5 text-slate-600 whitespace-nowrap">
                          {n.protein} / {n.carbs} / {n.fat}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {playbook.hrZones && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-3">⌚ โซนหัวใจจริง (%HRR Karvonen | RHR 45 / Max 196)</h3>
              <div className="space-y-2.5">
                {playbook.hrZones.map((z, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{z.zone}</span>
                      <span className="text-slate-400 ml-2">({z.hrr})</span>
                    </div>
                    <div className="font-bold text-pocariBlue">{z.bpm}</div>
                    <div className="text-slate-600 sm:text-right">{z.role}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Special Rules */}
      {playbook?.specialRules && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {playbook.specialRules.map((rule, i) => (
            <div key={i} className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm">
              <h4 className="text-sm font-bold text-pocariLight mb-2">{rule.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{rule.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
