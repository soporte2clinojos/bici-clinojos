// src/app/(protected)/admin/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { TrendingUp, CalendarCheck, Users, Bike, ArrowUpRight } from "lucide-react";

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

export default async function AdminPage() {
  const supabase = await getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  // Traer asistencias con join a users (campo correcto: identifier, no cedula)
  const { data: records, error } = await supabase
    .from("attendance")
    .select("id, date, status, is_bike, user_id, users(name, identifier)")
    .order("date", { ascending: false })
    .limit(200);

  // Total de usuarios registrados
  const { count: totalUsers } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "user");

  const today = new Date().toISOString().slice(0, 10);
  const confirmed = records?.filter((r) => r.status === "confirmed") ?? [];
  const totalHoy = records?.filter((r) => r.date === today).length ?? 0;
  const totalConfirmados = confirmed.length;
  const uniqueCiclistas = new Set(confirmed.map((r) => r.user_id));
  const totalCiclistas = uniqueCiclistas.size;
  const totalRegistros = records?.length ?? 0;
  const tasaConfirmacion = totalRegistros > 0
    ? Math.round((totalConfirmados / totalRegistros) * 100)
    : 0;

  // Últimos 7 días para mini resumen
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const last7Data = last7.map((d) => ({
    date: d,
    count: records?.filter((r) => r.date === d && r.status === "confirmed").length ?? 0,
  }));
  const maxCount = Math.max(...last7Data.map((d) => d.count), 1);

  const stats = [
    {
      label: "Llegadas hoy",
      value: totalHoy,
      icon: CalendarCheck,
      color: "text-[#2F6B3C]",
      bg: "bg-[#EAF3DE]",
      accent: true,
    },
    {
      label: "Total confirmados",
      value: totalConfirmados,
      icon: TrendingUp,
      color: "text-[#1C4ED8]",
      bg: "bg-[#EFF6FF]",
      accent: false,
    },
    {
      label: "Ciclistas únicos",
      value: totalCiclistas,
      icon: Bike,
      color: "text-[#854F0B]",
      bg: "bg-[#FAEEDA]",
      accent: false,
    },
    {
      label: "Usuarios registrados",
      value: totalUsers ?? 0,
      icon: Users,
      color: "text-[#6B21A8]",
      bg: "bg-[#F5F3FF]",
      accent: false,
    },
  ];

  const dayLabels = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* Actividad últimos 7 días + tasa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Gráfica mini últimos 7 días */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E8E6DF] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[13px] font-semibold text-[#1C1C1A]">Actividad reciente</p>
              <p className="text-[11px] text-[#8A8A82] mt-0.5">Confirmados últimos 7 días</p>
            </div>
          </div>
          <div className="flex items-end gap-2 h-20">
            {last7Data.map((d, i) => {
              const height = maxCount > 0 ? Math.max((d.count / maxCount) * 100, d.count > 0 ? 8 : 0) : 0;
              const isToday = d.date === today;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex items-end" style={{ height: "64px" }}>
                    <div
                      className={`w-full rounded-md transition-all ${
                        isToday ? "bg-[#2F6B3C]" : "bg-[#EAF3DE]"
                      }`}
                      style={{ height: height > 0 ? `${height}%` : "3px", minHeight: "3px" }}
                    />
                  </div>
                  <span className={`text-[9px] font-medium ${
                    isToday ? "text-[#2F6B3C]" : "text-[#B0AFA8]"
                  }`}>
                    {dayLabels[new Date(d.date + "T12:00:00").getDay() === 0 ? 6 : new Date(d.date + "T12:00:00").getDay() - 1]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tasa de confirmación */}
        <div className="bg-white rounded-xl border border-[#E8E6DF] p-5 flex flex-col justify-between">
          <div>
            <p className="text-[13px] font-semibold text-[#1C1C1A]">Tasa de confirmación</p>
            <p className="text-[11px] text-[#8A8A82] mt-0.5">Sobre total de registros</p>
          </div>
          <div className="mt-4">
            <p className="text-[36px] font-bold text-[#1C1C1A] tracking-tight leading-none">
              {tasaConfirmacion}
              <span className="text-[20px] text-[#8A8A82]">%</span>
            </p>
            <div className="mt-3 h-1.5 bg-[#F3F1EA] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2F6B3C] rounded-full transition-all"
                style={{ width: `${tasaConfirmacion}%` }}
              />
            </div>
            <p className="text-[10px] text-[#8A8A82] mt-1.5">
              {totalConfirmados} de {totalRegistros} registros
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de registros recientes */}
      <div className="bg-white rounded-xl border border-[#E8E6DF] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8E6DF]">
          <p className="text-[13px] font-semibold text-[#1C1C1A]">Registros recientes</p>
          
            <a href="/admin/reports" className="flex items-center gap-1 text-[11px] text-[#2F6B3C] font-medium hover:underline">
    Ver todos <ArrowUpRight className="w-3 h-3" />
    </a>
        </div>

        {error && (
          <div className="p-5 text-center">
            <p className="text-[12px] text-[#993C1D] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-3 inline-block">
              No se pudo cargar el reporte. Verifica los permisos de la tabla.
            </p>
          </div>
        )}

        {!error && (!records || records.length === 0) && (
          <div className="py-12 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#F5F4F0] flex items-center justify-center mx-auto mb-3">
              <Bike className="w-5 h-5 text-[#D1CFC8]" />
            </div>
            <p className="text-[12px] text-[#8A8A82]">Aún no hay registros de asistencia.</p>
            <p className="text-[11px] text-[#B0AFA8] mt-1">
              Los registros aparecerán aquí cuando los usuarios hagan check-in.
            </p>
          </div>
        )}

        {records && records.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#FAFAF7] border-b border-[#F3F1EA]">
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-[#B0AFA8] uppercase tracking-wider">Nombre</th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-[#B0AFA8] uppercase tracking-wider">Cédula</th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-[#B0AFA8] uppercase tracking-wider">Fecha</th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-[#B0AFA8] uppercase tracking-wider">Bici</th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-[#B0AFA8] uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F1EA]">
                {records.slice(0, 10).map((r) => {
                  const u = r.users as { name: string; identifier: string } | null;
                  return (
                    <tr key={r.id} className="hover:bg-[#FAFAF7] transition-colors">
                      <td className="px-5 py-2.5 font-medium text-[#1C1C1A]">{u?.name ?? "—"}</td>
                      <td className="px-5 py-2.5 text-[#8A8A82] font-mono">{u?.identifier ?? "—"}</td>
                      <td className="px-5 py-2.5 text-[#5C5B54]">
                        {new Date(r.date + "T12:00:00").toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-2.5">
                        {r.is_bike ? (
                          <span className="inline-flex items-center gap-1 text-[#27500A] bg-[#EAF3DE] px-2 py-0.5 rounded text-[10px] font-medium">
                            <Bike className="w-3 h-3" /> Sí
                          </span>
                        ) : (
                          <span className="text-[#8A8A82] text-[10px]">No</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5">
                        <span className={
                          r.status === "confirmed"
                            ? "inline-flex items-center gap-1 text-[#27500A] bg-[#EAF3DE] px-2 py-0.5 rounded text-[10px] font-medium"
                            : "inline-flex items-center gap-1 text-[#854F0B] bg-[#FAEEDA] px-2 py-0.5 rounded text-[10px] font-medium"
                        }>
                          <span className={`w-1 h-1 rounded-full ${
                            r.status === "confirmed" ? "bg-[#2F6B3C]" : "bg-[#854F0B]"
                          }`} />
                          {r.status === "confirmed" ? "Confirmado" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}