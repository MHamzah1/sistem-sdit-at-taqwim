"use client";

import React, { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ContactRound,
  School,
  Wallet,
  ReceiptText,
  ArrowLeftRight,
  BadgeCheck,
  CircleDollarSign,
  CalendarDays,
  ShieldCheck,
  FileCheck2,
  IdCard,
  ClipboardList,
  BarChart3,
  Settings,
  ChevronRight,
  Menu,
  LogOut,
  RefreshCw,
  AlertCircle,
  X,
  type LucideIcon,
} from "lucide-react";
import { Brand } from "./Brand";
import { Toast } from "./Toast";
import { useApp } from "@/src/lib/context/AppContext";
import { menuGroups } from "@/src/lib/navigation";
import { api } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";

const icons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  students: Users,
  guardians: ContactRound,
  classes: School,
  master: Wallet,
  invoices: ReceiptText,
  payments: ArrowLeftRight,
  verify: BadgeCheck,
  arrears: CircleDollarSign,
  exams: CalendarDays,
  eligibility: ShieldCheck,
  dispensation: FileCheck2,
  cards: IdCard,
  forms: ClipboardList,
  reports: BarChart3,
  settings: Settings,
  audit: ClipboardList,
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, loading, busy, toast, error, setError, refresh, can, isGuardian, actor } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pendingVerificationCount =
    state?.payments.filter((p) => p.status === "PENDING_VERIFICATION").length || 0;

  const isVisible = (key: string) => {
    if (isGuardian) {
      return ["payments", "dispensation", "forms", "settings"].includes(key);
    }
    if (key === "audit") return can("audit");
    if (key === "settings") return true;
    if (["master", "verify", "guardians", "classes"].includes(key)) {
      return can("master") || can("finance");
    }
    return true;
  };

  const handleLogout = async () => {
    try {
      await api("auth/logout", "POST", {});
      router.push("/masuk");
    } catch {
      router.push("/masuk");
    }
  };

  // Determine current active page label for topbar breadcrumb
  let activeTitle = isGuardian ? "Portal Wali Murid" : "Dashboard";
  if (isGuardian && (pathname === "/dashboard" || pathname === "/wali")) {
    activeTitle = "Beranda";
  } else {
    for (const group of menuGroups) {
      for (const item of group.items) {
        if (
          pathname === item.url ||
          (item.url !== "/dashboard" && pathname.startsWith(item.url))
        ) {
          activeTitle = item.label;
        }
      }
    }
  }
  if (pathname.startsWith("/master/siswa/tambah")) {
    activeTitle = "Tambah Siswa Baru";
  } else if (pathname.includes("/master/siswa/") && pathname.endsWith("/ubah")) {
    activeTitle = "Ubah Data Siswa";
  } else if (pathname.startsWith("/master/siswa/")) {
    activeTitle = "Detail Siswa";
  } else if (pathname === "/wali" || (isGuardian && pathname === "/dashboard")) {
    activeTitle = "Beranda";
  }

  return (
    <div className="app-shell flex min-h-screen bg-background text-foreground">
      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "sidebar fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-card px-3.5 transition-transform duration-200 md:translate-x-0 shadow-xs",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Brand className="border-b border-border/60 pb-3 mb-2" />

        <div className="school-space flex items-center gap-3 p-2.5 rounded-xl border border-border/80 bg-muted/40 my-2">
          <span className="school-square flex size-8 shrink-0 items-center justify-center rounded-lg bg-card border border-border/60 text-primary shadow-2xs">
            {isGuardian ? <Users className="size-4" /> : <School className="size-4" />}
          </span>
          <div className="flex flex-col min-w-0">
            <strong className="text-xs font-semibold text-foreground truncate">
              {isGuardian ? "Portal Wali Murid" : "Administrasi Sekolah"}
            </strong>
            <small className="text-[10px] text-muted-foreground truncate">
              {isGuardian ? "SDIT AT-TAQWIM" : "Workspace Utama"}
            </small>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-4 py-2 pr-1 select-none scrollbar-none">
          {isGuardian && (
            <Link
              href="/dashboard"
              className={cn(
                "nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                pathname === "/dashboard" || pathname === "/wali"
                  ? "active bg-primary/10 text-primary font-semibold border border-primary/20 shadow-2xs"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <Users className="size-4 shrink-0" />
              <span>Portal Wali Murid</span>
            </Link>
          )}

          {menuGroups.map((group) => {
            const visibleItems = group.items.filter((item) => isVisible(item.key));
            if (visibleItems.length === 0) return null;

            return (
              <div className="nav-group space-y-1" key={group.label || "main"}>
                {group.label && (
                  <div className="nav-label px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5">
                    {group.label}
                  </div>
                )}
                {visibleItems.map((item) => {
                  const Icon = icons[item.key] || LayoutDashboard;
                  const isActive =
                    pathname === item.url ||
                    (item.url !== "/dashboard" && pathname.startsWith(item.url));

                  return (
                    <Link
                      key={item.key}
                      href={item.url}
                      className={cn(
                        "nav-item flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                        isActive
                          ? "active bg-primary/10 text-primary font-semibold border border-primary/20 shadow-2xs"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.key === "verify" && pendingVerificationCount > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {pendingVerificationCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer pt-3 pb-4 border-t border-border/80 space-y-2 mt-auto">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
          >
            <LogOut className="size-4" />
            <span>Keluar Sesi</span>
          </button>
          <div className="sidebar-version flex items-center justify-between px-3 text-[10px] text-muted-foreground/70">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sistem Aktif
            </span>
            <span>v1.0</span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="mobile-overlay fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}

      {/* Main Workspace Frame */}
      <div className="main-shell flex-1 md:ml-60 flex flex-col min-w-0">
        <header className="topbar sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/90 px-4 md:px-8 backdrop-blur-md">
          {/* Breadcrumb Navigation */}
          <div className="breadcrumb flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <button
              type="button"
              className="icon-btn mobile-menu md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Buka navigasi"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="size-5" />
            </button>
            {isGuardian ? (
              <Users className="size-4 text-primary shrink-0 hidden sm:block" />
            ) : (
              <LayoutDashboard className="size-4 text-primary shrink-0 hidden sm:block" />
            )}
            <span className="hidden sm:inline">
              {isGuardian ? "Portal Wali Murid" : "Workspace"}
            </span>
            <ChevronRight className="size-3.5 text-muted-foreground/60 hidden sm:block" />
            <strong className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-none">
              {activeTitle}
            </strong>
          </div>

          {/* Topbar Actions */}
          <div className="topbar-actions flex items-center gap-3">
            <button
              type="button"
              className="icon-btn p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Muat ulang"
              disabled={loading || busy}
              onClick={() => void refresh()}
              title="Perbarui Data"
            >
              <RefreshCw
                className={cn("size-4", loading && "animate-spin text-primary")}
              />
            </button>

            <span className="top-divider h-4 w-px bg-border hidden sm:block" />

            <div className="profile flex items-center gap-2.5 pl-1">
              <span className="profile-avatar flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold shadow-2xs">
                {actor ? actor.name.slice(0, 2).toUpperCase() : "AD"}
              </span>
              <div className="flex flex-col text-left leading-tight hidden sm:flex">
                <strong className="text-xs font-semibold text-foreground truncate max-w-[130px]">
                  {actor?.name || "Memuat..."}
                </strong>
                <small className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                  {actor?.roles.join(", ") || "Pengguna"}
                </small>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {error && (
            <div
              role="alert"
              className="flex items-start justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError("")}
                className="rounded-md p-1 text-destructive/80 hover:bg-destructive/15 hover:text-destructive cursor-pointer"
                aria-label="Tutup pesan error"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
          {children}
        </main>
      </div>

      <Toast message={toast} />
    </div>
  );
}
