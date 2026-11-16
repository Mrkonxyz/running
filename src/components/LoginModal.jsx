"use client";

import { useState, useEffect, useRef } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => inputRef.current?.focus(), 40);
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateValue = (val) => {
    const trimmed = val.trim();
    if (!trimmed) return "กรุณากรอกอีเมลสำหรับเข้าสู่ระบบ";
    if (!EMAIL_RE.test(trimmed)) return "รูปแบบอีเมลไม่ถูกต้อง (เช่น saranuykon@gmail.com)";
    return "";
  };

  const handleBlur = () => {
    if (!touched && !email) return;
    setTouched(true);
    setErrorMsg(validateValue(email));
  };

  const handleChange = (e) => {
    const nextVal = e.target.value;
    setEmail(nextVal);
    if (errorMsg) {
      const check = validateValue(nextVal);
      if (!check) setErrorMsg("");
    }
  };

  const submitEmail = async (targetEmail) => {
    const err = validateValue(targetEmail);
    if (err) {
      setTouched(true);
      setErrorMsg(err);
      inputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      onLoginSuccess(data);
      onClose();
    } catch {
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitEmail(email);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-heading"
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-pocariBlue dark:text-sky-400 bg-blue-50 dark:bg-sky-950 px-2.5 py-0.5 rounded-full">
              MongoDB Session Auth
            </span>
            <h2 id="login-modal-heading" className="text-xl font-bold text-slate-900 dark:text-white mt-2">
              เข้าสู่ระบบด้วยอีเมล
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              ไม่ต้องใช้รหัสผ่าน — สร้าง Session + Refresh Token เก็บในฐานข้อมูล{" "}
              <code className="font-mono text-pocariBlue dark:text-sky-400">running</code> เพื่อซิงค์ประวัติการซ้อมอัตโนมัติ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างเข้าสู่ระบบ"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold text-2xl leading-none px-2 cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form action="/api/auth/login" method="POST" onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              อีเมล (Username) <span aria-hidden="true" className="text-rose-500">*</span>
            </label>
            <input
              ref={inputRef}
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              enterKeyHint="done"
              required
              value={email}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={errorMsg ? "true" : "false"}
              aria-describedby="login-email-help login-email-error"
              placeholder="you@example.com"
              className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl text-base bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border transition focus:outline-none focus:ring-2 ${
                errorMsg
                  ? "border-rose-500 focus:ring-rose-500/40"
                  : "border-slate-300 dark:border-slate-700 focus:ring-pocariBlue/50 focus:border-pocariBlue"
              }`}
            />
            <span id="login-email-help" className="text-[11px] text-slate-400 mt-1.5 block">
              ระบบจะสร้าง Access Token (15 นาที) + HttpOnly Refresh Token (30 วัน) ให้อัตโนมัติ
            </span>
            {errorMsg && (
              <p
                id="login-email-error"
                role="status"
                aria-live="polite"
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1"
              >
                <span aria-hidden="true">⚠️</span>
                <span>{errorMsg}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400">ด่วน:</span>
            <button
              type="button"
              onClick={() => {
                setEmail("saranuykon@gmail.com");
                setErrorMsg("");
              }}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-sky-950/60 hover:text-pocariBlue dark:hover:text-sky-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              ใช้ saranuykon@gmail.com
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-pocariBlue hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold shadow-sm transition cursor-pointer"
          >
            {submitting ? "กำลังสร้าง Session..." : "Sign In ด้วยอีเมล"}
          </button>
        </form>
      </div>
    </div>
  );
}
