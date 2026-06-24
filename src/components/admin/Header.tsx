// src/components/Header.tsx
"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/admin": {
    title: "Dashboard",
    subtitle: "Resumen de asistencia en bicicleta",
  },
  "/admin/reports": {
    title: "Reportes",
    subtitle: "Historial detallado de registros",
  },
  "/admin/users": {
    title: "Usuarios",
    subtitle: "Gestión de ciclistas registrados",
  },
};

interface HeaderProps {
  userName?: string;
}

export function Header({ userName = "Admin" }: HeaderProps) {
  const pathname = usePathname();
  const page = pageTitles[pathname] ?? { title: "BiciClinojos", subtitle: "" };

  const today = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Capitalizar primera letra
  const todayFormatted = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <header className="h-16 shrink-0 bg-white border-b border-[#E8E6DF] flex items-center px-6 gap-4">
      {/* Título de página */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <h1 className="text-[16px] font-semibold text-[#1C1C1A] leading-none">
            {page.title}
          </h1>
          {page.subtitle && (
            <>
              <span className="text-[#D1CFC8]">/</span>
              <span className="text-[12px] text-[#8A8A82] truncate">
                {page.subtitle}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Fecha */}
      <p className="text-[12px] text-[#B0AFA8] hidden md:block shrink-0">
        {todayFormatted}
      </p>

      {/* Notificación placeholder */}
      <button className="relative w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F5F4F0] transition-colors text-[#8A8A82]">
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#2F6B3C]" />
      </button>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#EAF3DE] flex items-center justify-center text-[11px] font-bold text-[#2F6B3C] shrink-0">
        {userName
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()}
      </div>
    </header>
  );
}