import './globals.css';

export const metadata = {
  title: '健康紀錄 - 血壓血糖追蹤',
  description: '專為中高齡族群設計的健康數據追蹤 App',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen bg-slate-50">
        {children}
      </body>
    </html>
  );
}
