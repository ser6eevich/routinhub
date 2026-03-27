import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { 
  Video, 
  LayoutDashboard, 
  NotebookPen, 
  Settings,
  Zap
} from 'lucide-react';
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Рутина Хаб — Автоматизация",
  description: "Персональный хаб для автоматизации рутинных задач. Вебинары, заметки и многое другое.",
};

const navItems = [
  { name: "Вебинары", href: "/webinars", icon: <Video className="w-4 h-4" />, active: true },
  { name: "Dashboard", href: "#", icon: <LayoutDashboard className="w-4 h-4" />, disabled: true },
  { name: "Заметки", href: "#", icon: <NotebookPen className="w-4 h-4" />, disabled: true },
  { name: "Настройки", href: "#", icon: <Settings className="w-4 h-4" />, disabled: true },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <div className="flex min-h-screen bg-bg-primary">
            {/* Sidebar */}
            <aside className="w-60 bg-bg-secondary border-r border-border flex flex-col fixed h-full z-10 shadow-sm transition-colors duration-300">
              {/* Logo & Theme Toggle */}
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/20">
                    <Zap className="w-4.5 h-4.5 fill-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-text-primary tracking-tight italic">Рутина Хаб</h1>
                    <p className="text-[9px] text-text-muted font-black underline decoration-indigo-500/30 underline-offset-2 uppercase tracking-[0.2em]">(автоматизация)</p>
                  </div>
                </div>
                <ThemeToggle />
              </div>

              {/* Navigation */}
              <nav className="flex-1 py-6 px-3 space-y-1">
                <p className="text-[9px] text-text-muted font-black uppercase tracking-[0.2em] px-3 mb-4 opacity-60">
                  Инструменты
                </p>
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                      item.active
                        ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-800/50 shadow-sm"
                        : item.disabled
                        ? "text-text-muted cursor-not-allowed opacity-40"
                        : "text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-text-primary"
                    }`}
                  >
                    <span className={`${item.active ? 'text-indigo-600 dark:text-indigo-400' : 'text-text-muted'}`}>{item.icon}</span>
                    {item.name}
                    {item.disabled && (
                      <span className="ml-auto text-[7px] bg-slate-100 dark:bg-slate-800 text-text-muted px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">
                        Soon
                      </span>
                    )}
                  </a>
                ))}
              </nav>

              {/* Footer */}
              <div className="p-5 border-t border-border">
                <div className="bg-bg-primary rounded-xl p-3 text-center border border-border/50">
                  <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">
                    Рутина Хаб v0.1.0
                  </p>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-60 min-h-screen transition-colors duration-300">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
