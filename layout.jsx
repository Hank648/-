import "./globals.css";

export const metadata = {
  title: "健康記錄",
  description: "中高齡族群健康數據追蹤與門診溝通工具",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#115e59",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
