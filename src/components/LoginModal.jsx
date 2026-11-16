"use client";

import { useState, useEffect, useRef } from "react";
import { AlertIcon, CloseIcon } from "./Icons.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginModal({ isOpen, onClose, onLoginSuccess, inline = false }) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen || inline) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow ="hidden";
    const timer = setTimeout(() => inputRef.current?.focus(), 40);
    const onKeyDown = (e) => {
      if (e.key ==="Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, inline, onClose]);

  if (!isOpen) return null;

  const validateValue = (val) => {
    const trimmed = val.trim();
    if (!trimmed) return "กรุณากรอกอีเมลของคุณ";
    if (!EMAIL_RE.test(trimmed)) return "รูปแบบอีเมลไม่ถูกต้อง (เช่น name@example.com)";
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
        headers: {"Content-Type": "application/json" },
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

  const cardContent = (
    <div
      className={
        inline
          ? "bg-white dark:bg-zinc-900 rounded-xl max-w-md w-full p-6 shadow-xs border border-zinc-200 dark:border-zinc-800"
          : "bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-xl max-w-md w-full p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-lg border border-zinc-200 dark:border-zinc-800 max-h-[90dvh] overflow-y-auto"
      }
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-start mb-5">
        <div>
          <span className="text-[11px] font-medium text-[#1d4ed8] dark:text-blue-400 bg-[#1d4ed8]/10 dark:bg-blue-500/15 px-2.5 py-0.5 rounded-md border border-[#1d4ed8]/20 dark:border-blue-500/30">
            เริ่มต้นใช้งาน
          </span>
          <h2 id="login-modal-heading" className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 mt-2.5">
            เข้าสู่ระบบด้วยอีเมล
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            กรอกอีเมลของคุณเพื่อเข้าใช้งานและซิงค์ความคืบหน้าการซ้อมข้ามอุปกรณ์ได้ทันที
          </p>
        </div>
        {!inline && (
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างเข้าสู่ระบบ"
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      <form action="/api/auth/login" method="POST" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-medium text-zinc-900 dark:text-zinc-100 mb-1.5"
          >
            อีเมลของคุณ <span aria-hidden="true" className="text-red-500">*</span>
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
            placeholder="name@example.com"
            className={`w-full h-11 px-3.5 py-2 rounded-lg text-sm bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 placeholder:text-zinc-400 border transition focus:outline-none focus:ring-2 ${
              errorMsg
                ? "border-red-500 focus:ring-red-500/30"
                : "border-zinc-200 dark:border-zinc-800 focus:ring-[#1d4ed8]/30 focus:border-[#1d4ed8]"
            }`}
          />
          <span id="login-email-help" className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 block">
            เข้าสู่ระบบได้ทันทีโดยไม่ต้องใช้รหัสผ่าน
          </span>
          {errorMsg && (
            <p
              id="login-email-error"
              role="status"
              aria-live="polite"
              className="text-xs font-medium text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1"
            >
              <AlertIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-11 px-4 rounded-lg bg-[#1d4ed8] hover:bg-[#1e40af] disabled:opacity-60 text-white text-sm font-medium shadow-xs transition active:scale-[0.99] cursor-pointer"
        >
          {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>
    </div>
  );

  if (inline) return cardContent;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-heading"
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {cardContent}
    </div>
  );
}
