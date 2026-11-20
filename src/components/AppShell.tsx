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
  type LucideIcon,
} from "lucide-react";
import { Brand } from "./Brand";
import { Toast } from "./Toast";
import { useApp } from "@/src/lib/context/AppContext";
import { menuGroups } from "@/src/lib/navigation";
import { api } from "@/src/lib/api";

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
  const { state, loading, busy, toast, refresh, can, isGuardian, actor } = useApp();
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
  let activeTitle = "Dashboard";
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
  if (pathname.startsWith("/master/siswa/tambah")) {
    activeTitle = "Tambah Siswa Baru";
  } else if (pathname.includes("/master/siswa/") && pathname.endsWith("/ubah")) {
    activeTitle = "Ubah Data Siswa";
  } else if (pathname.startsWith("/master/siswa/")) {
    activeTitle = "Detail Siswa";
  } else if (pathname === "/wali") {
    activeTitle = "Portal Wali Murid";
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <Brand />

        <div className="school-space">
          <span className="school-square">
            <School size={17} />
          </span>
          <div>
            <strong>Administrasi Sekolah</strong>
            <small>Workspace sekolah</small>
          </div>
        </div>

        <nav>
          {isGuardian && (
            <Link
              href="/wali"
              className={`nav-item ${pathname === "/wali" ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Users size={17} />
              <span>Portal Wali Murid</span>
            </Link>
          )}

          {menuGroups.map((group) => {
            const visibleItems = group.items.filter((item) => isVisible(item.key));
            if (visibleItems.length === 0) return null;

            return (
              <div className="nav-group" key={group.label || "main"}>
                {group.label && <div className="nav-label">{group.label}</div>}
                {visibleItems.map((item) => {
                  const Icon = icons[item.key] || LayoutDashboard;
                  const isActive =
                    pathname === item.url ||
                    (item.url !== "/dashboard" && pathname.startsWith(item.url));

                  return (
                    <Link
                      key={item.key}
                      href={item.url}
                      className={`nav-item ${isActive ? "active" : ""}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon size={17} />
                      <span>{item.label}</span>
                      {item.key === "verify" && pendingVerificationCount > 0 && (
                        <b>{pendingVerificationCount}</b>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button type="button" onClick={handleLogout}>
            <LogOut size={17} />
            <span>Keluar</span>
          </button>
          <div className="sidebar-version">
            <span className="live-dot" />
            Administrasi sekolah
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              type="button"
              className="icon-btn mobile-menu"
              aria-label="Buka navigasi"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={21} />
            </button>
            <LayoutDashboard size={16} />
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{activeTitle}</strong>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="icon-btn"
              aria-label="Muat ulang"
              disabled={loading || busy}
              onClick={() => void refresh()}
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : undefined}
              />
            </button>

            <span className="top-divider" />

            <div className="profile">
              <span className="profile-avatar">
                {actor ? actor.name.slice(0, 2).toUpperCase() : "AD"}
              </span>
              <span>
                <strong>{actor?.name || "Memuat..."}</strong>
                <small>{actor?.roles.join(", ") || "Pengguna"}</small>
              </span>
            </div>
          </div>
        </header>

        <main>{children}</main>
      </div>

      <Toast message={toast} />
    </div>
  );
}
