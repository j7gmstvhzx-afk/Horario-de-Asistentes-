import "../styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import { Toaster } from "@/components/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Horario de Asistentes — Casino Atlántico Manatí",
  description:
    "Plataforma para gestión de horarios, firmas digitales, vacaciones y propinas del Casino Atlántico Manatí.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/logo-casino-atlantico.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#4A7BA8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${poppins.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
