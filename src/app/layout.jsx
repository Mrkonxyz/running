import Script from "next/script";
import "../index.css";

export const metadata = {
  title: "⚡ Korn Training Hub — Hybrid Physique, PST34 & Annual Tracker",
  description:
    "แดชบอร์ดติดตามแผนซ้อม Hybrid Physique (1 Activity/Day) ปั้น V-Taper รีดไขมันสู่ 18.0% BF พร้อมวิ่งชิล Zone 2 และเดินชัน 8–12% เชื่อมต่อ MongoDB",
};

const FOUC_SCRIPT = `
try {
  const s = localStorage.getItem("color-scheme");
  if (s === "light" || s === "dark") {
    const m = document.querySelector('meta[name="color-scheme"]');
    if (m) m.content = s;
  }
  const isDark = s === "dark" || (!s && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
} catch {}
`;

export default function RootLayout({ children }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="antialiased">
        <Script id="fouc-color-scheme" strategy="beforeInteractive">
          {FOUC_SCRIPT}
        </Script>
        {children}
      </body>
    </html>
  );
}
