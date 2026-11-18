"use client";

import dynamic from "next/dynamic";

const DynamicApp = dynamic(
  () => import("@/src/main").then((mod) => mod.App),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "sans-serif",
          color: "#176442",
          background: "#f6f8f7",
        }}
      >
        <p style={{ fontWeight: 600, fontSize: "14px" }}>
          Memuat Sistem SDIT AT-TAQWIM...
        </p>
      </div>
    ),
  },
);

export function ClientWrapper() {
  return <DynamicApp />;
}
