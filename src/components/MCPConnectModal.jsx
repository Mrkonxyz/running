"use client";

import { useState, useEffect } from "react";
import { CheckIcon, CloseIcon, CopyIcon, PlugIcon, RefreshIcon, TrashIcon } from "./Icons.jsx";

export function MCPConnectModal({ isOpen, onClose, userEmail, onPlansSynced }) {
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [freshSecret, setFreshSecret] = useState(null);
  const [copiedField, setCopiedField] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loading = isOpen && status === null && !errorMsg;

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/mcp/connect", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (!res.ok) {
          setErrorMsg(data.error || "ไม่สามารถโหลดสถานะการเชื่อมต่อได้");
          return;
        }
        setStatus(data);
      } catch {
        if (active) setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      }
    })();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      active = false;
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setActionLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/mcp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "AI Assistant MCP" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "ไม่สามารถสร้างการเชื่อมต่อ MCP ได้");
        return;
      }
      setStatus(data);
      setFreshSecret({
        token: data.token,
        endpointUrl: data.endpointUrl,
        mcpConfigText: JSON.stringify(data.mcpConfig, null, 2),
      });
    } catch {
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setActionLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/mcp/connect", { method: "DELETE" });
      if (res.ok) {
        setFreshSecret(null);
        setStatus((prev) => (prev ? { ...prev, connected: false } : { connected: false }));
      }
    } catch {
      setErrorMsg("ไม่สามารถยกเลิกการเชื่อมต่อได้");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopy = async (field, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => {
        setCopiedField((prev) => (prev === field ? "" : prev));
      }, 2000);
    } catch {
      // ignore clipboard restrictions
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mcp-modal-heading"
      className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-xl max-w-lg w-full p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-xl border border-zinc-200 dark:border-zinc-800 max-h-[90dvh] overflow-y-auto space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#1d4ed8] dark:text-blue-400 bg-[#1d4ed8]/10 dark:bg-blue-500/15 px-2.5 py-0.5 rounded-md border border-[#1d4ed8]/20 dark:border-blue-500/30">
              <PlugIcon className="w-3 h-3" />
              <span>MCP Assistant Integration</span>
            </span>
            <h2 id="mcp-modal-heading" className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 mt-2">
              เชื่อมต่อผู้ช่วย AI กับตารางซ้อมของคุณ
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              ให้ AI อ่านตารางซ้อม ดูโปรแกรมวันนี้ เพิ่มแผนใหม่ หรือปรับตารางซ้อมให้บัญชี{" "}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{userEmail}</span> ได้โดยตรง
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างเชื่อมต่อ MCP"
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-medium text-red-700 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Current Connection Status Box */}
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 p-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  status?.connected ? "bg-emerald-500" : "bg-zinc-400"
                }`}
                aria-hidden="true"
              />
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {loading
                  ? "กำลังตรวจสอบสถานะ..."
                  : status?.connected
                  ? "เชื่อมต่อ MCP พร้อมใช้งาน"
                  : "ยังไม่ได้เชื่อมต่อผู้ช่วย AI"}
              </span>
            </div>
            {status?.connected && status?.tokenPrefix && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono truncate">
                Key: {status.tokenPrefix}
              </p>
            )}
          </div>

          {!freshSecret && (
            <button
              type="button"
              disabled={actionLoading || loading}
              onClick={handleConnect}
              className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#1d4ed8] hover:bg-[#1e40af] disabled:opacity-60 text-white text-xs font-medium shadow-xs transition cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5"
            >
              <PlugIcon className="w-3.5 h-3.5" />
              <span>{actionLoading ? "กำลังเชื่อมต่อ..." : status?.connected ? "สร้างรหัสใหม่" : "Connect MCP"}</span>
            </button>
          )}
        </div>

        {/* Newly Generated Credentials & Quick Copy */}
        {freshSecret && (
          <div className="space-y-3 rounded-xl border border-[#1d4ed8]/30 bg-[#1d4ed8]/5 dark:bg-blue-950/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#1d4ed8] dark:text-blue-400">
                รหัสเชื่อมต่อพร้อมใช้งาน (กรุณาคัดลอกเก็บไว้)
              </span>
              <button
                type="button"
                onClick={handleConnect}
                disabled={actionLoading}
                className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <RefreshIcon className="w-3 h-3" />
                <span>ออกรหัสใหม่</span>
              </button>
            </div>

            {/* Endpoint URL */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">MCP Endpoint URL</span>
                <button
                  type="button"
                  onClick={() => handleCopy("url", freshSecret.endpointUrl)}
                  className="text-[11px] font-medium text-[#1d4ed8] dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === "url" ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
                  <span>{copiedField === "url" ? "คัดลอกแล้ว" : "คัดลอก"}</span>
                </button>
              </div>
              <code className="block w-full text-[11px] font-mono bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-800 dark:text-zinc-200 break-all">
                {freshSecret.endpointUrl}
              </code>
            </div>

            {/* Bearer Token */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">Bearer Token</span>
                <button
                  type="button"
                  onClick={() => handleCopy("token", freshSecret.token)}
                  className="text-[11px] font-medium text-[#1d4ed8] dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === "token" ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
                  <span>{copiedField === "token" ? "คัดลอกแล้ว" : "คัดลอก"}</span>
                </button>
              </div>
              <code className="block w-full text-[11px] font-mono bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-800 dark:text-zinc-200 break-all">
                {freshSecret.token}
              </code>
            </div>

            {/* Ready-to-paste MCP Config JSON */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                  MCP Config (สำหรับวางใน AI Client)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy("config", freshSecret.mcpConfigText)}
                  className="text-[11px] font-medium text-[#1d4ed8] dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === "config" ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
                  <span>{copiedField === "config" ? "คัดลอกแล้ว" : "คัดลอก JSON"}</span>
                </button>
              </div>
              <pre className="text-[11px] font-mono bg-zinc-950 text-zinc-100 rounded-lg p-3 overflow-x-auto border border-zinc-800 leading-relaxed">
                {freshSecret.mcpConfigText}
              </pre>
            </div>
          </div>
        )}

        {/* Endpoint preview even before rotating token */}
        {!freshSecret && status?.endpointUrl && (
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between gap-2 px-1">
            <span className="truncate font-mono">Endpoint: {status.endpointUrl}</span>
            <button
              type="button"
              onClick={() => handleCopy("ep", status.endpointUrl)}
              className="text-[#1d4ed8] dark:text-blue-400 hover:underline flex-shrink-0 cursor-pointer"
            >
              {copiedField === "ep" ? "คัดลอกแล้ว" : "คัดลอก URL"}
            </button>
          </div>
        )}

        {/* Available Capabilities */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-2">
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            ความสามารถเมื่อเชื่อมต่อผู้ช่วย AI
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-300">
            <li className="flex items-center gap-1.5">
              <CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>ดูโปรแกรมรายวัน รายสัปดาห์ และทุกแผนซ้อม</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>สร้างแผนใหม่ ปรับตาราง หรือสลับวันซ้อมได้ทันที</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>บันทึกผลซ้อม สถิติเวทเทรนนิ่ง และองค์ประกอบร่างกาย</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>ติดตามการนอน ความพร้อม และเป้าหมายโภชนาการรายวัน</span>
            </li>
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {status?.connected ? (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleDisconnect}
              className="min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              <span>ยกเลิกการเชื่อมต่อ</span>
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2 ml-auto">
            {onPlansSynced && (
              <button
                type="button"
                onClick={async () => {
                  await onPlansSynced();
                  onClose();
                }}
                className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 text-xs font-medium transition cursor-pointer"
              >
                รีเฟรชแผนซ้อม
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="min-h-[38px] px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
