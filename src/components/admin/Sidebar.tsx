// src/components/Sidebar.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, ClipboardList, Users, LogOut, Bike } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Reportes", href: "/admin/reports", icon: ClipboardList },
  { label: "Usuarios", href: "/admin/users", icon: Users },
];

interface SidebarProps {
  userName?: string;
}

export function Sidebar({ userName = "Admin" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="w-[200px] shrink-0 bg-white border-r border-[#E8E6DF] flex flex-col h-screen">
      {/* Brand */}
      <div className="px-4 pt-6 pb-5 border-b border-[#E8E6DF]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#2F6B3C] flex items-center justify-center">
            <Bike className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-[#1C1C1A] tracking-tight leading-none">
              BiciClinojos
            </p>
            <p className="text-[9px] text-[#B0AFA8] mt-0.5 tracking-wide uppercase">
              Panel Admin
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-px">
        <p className="text-[9px] font-medium text-[#B0AFA8] uppercase tracking-widest px-2.5 mb-1.5">
          Menú
        </p>
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 group ${
                isActive
                  ? "bg-[#EAF3DE] text-[#27500A]"
                  : "text-[#8A8A82] hover:bg-[#F5F4F0] hover:text-[#1C1C1A]"
              }`}
            >
              <item.icon
                className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                  isActive
                    ? "text-[#2F6B3C]"
                    : "text-[#B0AFA8] group-hover:text-[#5C5B54]"
                }`}
              />
              {item.label}
              {isActive && (
                <span className="ml-auto w-1 h-1 rounded-full bg-[#2F6B3C]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#E8E6DF] flex items-center">
        <div className="flex items-center gap-2 px-3 py-2.5 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-full bg-[#EAF3DE] flex items-center justify-center text-[9px] font-bold text-[#2F6B3C] shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-[#1C1C1A] truncate leading-tight">
              {userName}
            </p>
            <p className="text-[9px] text-[#B0AFA8] truncate uppercase">
              Talento Humano
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-3 border-l border-[#E8E6DF] hover:bg-red-50 transition-colors group h-full"
          title="Cerrar sesión"
        >
          <LogOut className="w-3.5 h-3.5 text-[#B0AFA8] group-hover:text-red-500 transition-colors" />
        </button>
      </div>
    </aside>
  );
}