// src/app/(protected)/dashboard/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Bike, CalendarCheck, TrendingUp, Clock } from "lucide-react";
import LogoutButton from "@/components/logout-button";

async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );
}

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Columnas reales: name, identifier (no cedula)
  const { data: profile } = await supabase
    .from("users")
    .select("name, identifier, created_at")
    .eq("id", user.id)
    .single();

  const { data: history, error } = await supabase
    .from("attendance")
    .select("id, date, status, is_bike")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  const today = new Date().toISOString().slice(0, 10);
  const confirmed = history?.filter((h) => h.status === "confirmed") ?? [];
  const totalDias = confirmed.length;
  const asistioHoy = confirmed.some((h) => h.date === today);
  const diasEnBici = confirmed.filter((h) => h.is_bike).length;

  // Racha actual: días consecutivos confirmados hasta hoy
  const sortedDates = confirmed
    .map((h) => h.date)
    .sort((a, b) => (a > b ? -1 : 1));

  let racha = 0;
  let cursor = new Date();
  for (const dateStr of sortedDates) {
    const expected = cursor.toISOString().slice(0, 10);
    if (dateStr === expected) {
      racha++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  // Últimos 30 días para la gráfica de actividad
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });

  const last30Data = last30.map((d) => ({
    date: d,
    confirmed: confirmed.some((h) => h.date === d),
  }));

  // Últimos 4 meses para resumen mensual
  const monthlyStats = Array.from({ length: 4 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (3 - i));
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = d.toLocaleDateString("es-CO", { month: "short" });
    const count = confirmed.filter((h) => {
      const hd = new Date(h.date + "T12:00:00");
      return hd.getFullYear() === year && hd.getMonth() === month;
    }).length;
    return { label, count };
  });
  const maxMonth = Math.max(...monthlyStats.map((m) => m.count), 1);

  const stats = [
    {
      label: "Días totales",
      value: totalDias,
      icon: TrendingUp,
      color: "text-[#2F6B3C]",
      bg: "bg-[#EAF3DE]",
      accent: true,
    },
    {
      label: "En bicicleta",
      value: diasEnBici,
      icon: Bike,
      color: "text-[#854F0B]",
      bg: "bg-[#FAEEDA]",
      accent: false,
    },
    {
      label: "Racha actual",
      value: racha,
      icon: CalendarCheck,
      color: "text-[#1C4ED8]",
      bg: "bg-[#EFF6FF]",
      accent: false,
    },
    {
      label: "Pendientes",
      value: (history?.filter((h) => h.status !== "confirmed").length ?? 0),
      icon: Clock,
      color: "text-[#6B21A8]",
      bg: "bg-[#F5F3FF]",
      accent: false,
    },
  ];

  const initials = profile?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Header / saludo */}
      <div className="bg-white rounded-xl border border-[#E8E6DF] p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#EAF3DE] flex items-center justify-center text-[16px] font-bold text-[#2F6B3C] shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[18px] font-bold text-[#1C1C1A] leading-tight truncate">
            Hola, {profile?.name ?? "Ciclista"} 👋
          </p>
          <p className="text-[12px] text-[#8A8A82] mt-0.5">
            {profile?.identifier ? `ID: ${profile.identifier}` : ""}
            {asistioHoy && (
              <span className="ml-2 inline-flex items-center gap-1 text-[#27500A] bg-[#EAF3DE] px-2 py-0.5 rounded text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B3C]" />
                Ya registraste hoy
              </span>
            )}
          </p>
        </div>
        <LogoutButton />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`bg-white rounded-xl border border-[#E8E6DF] p-4 ${
              s.accent ? "ring-1 ring-[#2F6B3C]/20" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-[11px] text-[#8A8A82] leading-none">{s.label}</p>
              <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              </div>
            </div>
            <p className={`text-[26px] font-bold leading-none tracking-tight ${
              s.accent ? "text-[#2F6B3C]" : "text-[#1C1C1A]"
            }`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfica actividad 30 días + resumen mensual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* Heatmap últimos 30 días */}
        <div className="sm:col-span-2 bg-white rounded-xl border border-[#E8E6DF] p-5">
          <p className="text-[13px] font-semibold text-[#1C1C1A]">Actividad reciente</p>
          <p className="text-[11px] text-[#8A8A82] mt-0.5 mb-4">Últimos 30 días</p>
          <div className="grid grid-cols-[repeat(30,1fr)] gap-1">
            {last30Data.map((d) => {
              const isToday = d.date === today;
              return (
                <div
                  key={d.date}
                  title={d.date}
                  className={`aspect-square rounded-sm ${
                    isToday
                      ? d.confirmed
                        ? "bg-[#2F6B3C] ring-1 ring-[#2F6B3C]/40"
                        : "bg-[#F3F1EA] ring-1 ring-[#B0AFA8]/40"
                      : d.confirmed
                      ? "bg-[#2F6B3C]"
                      : "bg-[#F3F1EA]"
                  }`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#F3F1EA]" />
            <span className="text-[10px] text-[#B0AFA8]">Sin registro</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-[#2F6B3C] ml-2" />
            <span className="text-[10px] text-[#B0AFA8]">Confirmado</span>
          </div>
        </div>

        {/* Barras mensuales */}
        <div className="bg-white rounded-xl border border-[#E8E6DF] p-5">
          <p className="text-[13px] font-semibold text-[#1C1C1A]">Por mes</p>
          <p className="text-[11px] text-[#8A8A82] mt-0.5 mb-4">Días confirmados</p>
          <div className="flex items-end gap-2 h-20">
            {monthlyStats.map((m) => {
              const height = maxMonth > 0 ? Math.max((m.count / maxMonth) * 100, m.count > 0 ? 10 : 0) : 0;
              const isCurrentMonth = m === monthlyStats[3];
              return (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex items-end" style={{ height: "64px" }}>
                    <div
                      className={`w-full rounded-md ${isCurrentMonth ? "bg-[#2F6B3C]" : "bg-[#EAF3DE]"}`}
                      style={{ height: height > 0 ? `${height}%` : "3px", minHeight: "3px" }}
                    />
                  </div>
                  <span className={`text-[9px] font-medium capitalize ${isCurrentMonth ? "text-[#2F6B3C]" : "text-[#B0AFA8]"}`}>
                    {m.label}
                  </span>
                  <span className="text-[9px] text-[#B0AFA8] tabular-nums">{m.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Histórico de registros */}
      <div className="bg-white rounded-xl border border-[#E8E6DF] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E8E6DF]">
          <p className="text-[13px] font-semibold text-[#1C1C1A]">Historial de registros</p>
        </div>

        {error && (
          <div className="p-5">
            <p className="text-[12px] text-[#993C1D] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-3">
              No se pudo cargar el historial.
            </p>
          </div>
        )}

        {!error && (!history || history.length === 0) && (
          <div className="py-12 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#F5F4F0] flex items-center justify-center mx-auto mb-3">
              <Bike className="w-5 h-5 text-[#D1CFC8]" />
            </div>
            <p className="text-[12px] text-[#8A8A82]">Aún no tienes registros.</p>
            <p className="text-[11px] text-[#B0AFA8] mt-1">
              Escanea el QR en portería para tu primer check-in.
            </p>
          </div>
        )}

        {history && history.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#FAFAF7] border-b border-[#F3F1EA]">
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-[#B0AFA8] uppercase tracking-wider">Fecha</th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-[#B0AFA8] uppercase tracking-wider">Bici</th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-[#B0AFA8] uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F1EA]">
                {history.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#FAFAF7] transition-colors">
                    <td className="px-5 py-2.5 text-[#1C1C1A] font-medium capitalize">
                      {new Date(entry.date + "T12:00:00").toLocaleDateString("es-CO", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-2.5">
                      {entry.is_bike ? (
                        <span className="inline-flex items-center gap-1 text-[#27500A] bg-[#EAF3DE] px-2 py-0.5 rounded text-[10px] font-medium">
                          <Bike className="w-3 h-3" /> Sí
                        </span>
                      ) : (
                        <span className="text-[#B0AFA8] text-[10px]">No</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5">
                      <span className={
                        entry.status === "confirmed"
                          ? "inline-flex items-center gap-1 text-[#27500A] bg-[#EAF3DE] px-2 py-0.5 rounded text-[10px] font-medium"
                          : "inline-flex items-center gap-1 text-[#854F0B] bg-[#FAEEDA] px-2 py-0.5 rounded text-[10px] font-medium"
                      }>
                        <span className={`w-1 h-1 rounded-full ${
                          entry.status === "confirmed" ? "bg-[#2F6B3C]" : "bg-[#854F0B]"
                        }`} />
                        {entry.status === "confirmed" ? "Confirmado" : "Pendiente"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
      </div>
    </div>
  );
}