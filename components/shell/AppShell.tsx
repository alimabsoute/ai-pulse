import type { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { PwaRegister } from "./PwaRegister";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-full">
      <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden />
      <Header />
      <main className="relative mx-auto w-full max-w-7xl px-4 pb-8 pt-3 md:px-6 md:pb-16 md:pt-6">
        {children}
      </main>
      <BottomNav />
      <PwaRegister />
    </div>
  );
}
