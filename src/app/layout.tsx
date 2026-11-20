import type { Metadata } from "next";
import "@/src/styles.css";
import "@/src/production.css";

export const metadata: Metadata = {
  title: "SDIT AT-TAQWIM — Sistem SPP & Kelayakan Ujian",
  description: "Sistem administrasi SPP dan kelayakan ujian SDIT AT-TAQWIM.",
  icons: {
    icon: "/attachment-0.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta name="theme-color" content="#176442" />
      </head>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
