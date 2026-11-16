import Script from "next/script";
import "../index.css";

export const metadata = {
  title: "Training Hub — Hybrid Physique, PST34 & Annual Tracker",
  description:
    "แดชบอร์ดติดตามตารางซ้อม Hybrid Physique, วิ่ง Zone 2, เดินชัน และคู่มือท่าออกกำลังกาย พร้อมซิงค์ความคืบหน้าข้ามอุปกรณ์",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const FOUC_SCRIPT = `
try {
  const s = localStorage.getItem("color-scheme");
  if (s ==="light" || s ==="dark") {
    const m = document.querySelector('meta[name="color-scheme"]');
    if (m) m.content = s;
  }
  const isDark = s ==="dark" || (!s && matchMedia("(prefers-color-scheme: dark)").matches);
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
