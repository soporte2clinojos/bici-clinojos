// src/app/(protected)/admin/reports/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Download, Filter, Bike } from "lucide-react";
import Link from "next/link";

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

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string }>;
}) {
  const supabase = await getSupabaseServerClient();
  const params = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  let query = supabase
    .from("attendance")
    .select("id, date, status, is_bike, users(name, identifier)")
    .order("date", { ascending: false })
    .limit(500);

  if (params.status && params.status !== "all") query = query.eq("status", params.status);
  if (params.from) query = query.gte("date", params.from);
  if (params.to) query = query.lte("date", params.to);

  const { data: records, error } = await query;

  const total = records?.length ?? 0;
  const totalConfirmados = records?.filter((r) => r.status === "confirmed").length ?? 0;
  const totalPendientes = records?.filter((r) => r.status !== "confirmed").length ?? 0;
  const totalBici = records?.filter((r) => r.is_bike).length ?? 0;
  const hasFilters = params.status || params.from || params.to;

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total registros", value: total, color: "text-[#1C1C1A]", bg: "bg-[#F5F4F0]" },
          { label: "Confirmados", value: totalConfirmados, color: "text-[#27500A]", bg: "bg-[#EAF3DE]" },
          { label: "Pendientes", value: totalPendientes, color: "text-[#854F0B]", bg: "bg-[#FAEEDA]" },
          { label: "En bicicleta", value: totalBici, color: "text-[#1C4ED8]", bg: "bg-[#EFF6FF]" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E8E6DF] p-4">
            <p className="text-[11px] text-[#8A8A82] leading-none mb-3">{s.label}</p>
            <p className={`text-[26px] font-bold leading-none tracking-tight ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-[#E8E6DF] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-3 h-3 text-[#B0AFA8]" />
          <span className="text-[10px] font-semibold text-[#B0AFA8] uppercase tracking-widest">Filtros</span>
        </div>
        <form method="GET" className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[#8A8A82]">Estado</label>
            <select
              name="status"
              defaultValue={params.status ?? "all"}
              className="text-[12px] text-[#1C1C1A] border border-[#E8E6DF] rounded-lg px-3 py-1.5 bg-[#FAFAF7] focus:outline-none focus:ring-1 focus:ring-[#2F6B3C]/40"
            >
              <option value="all">Todos</option>
              <option value="confirmed">Confirmado</option>
              <option value="pending">Pendiente</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[#8A8A82]">Desde</label>
            <input
              type="date"
              name="from"
              defaultValue={params.from ?? ""}
              className="text-[12px] text-[#1C1C1A] border border-[#E8E6DF] rounded-lg px-3 py-1.5 bg-[#FAFAF7] focus:outline-none focus:ring-1 focus:ring-[#2F6B3C]/40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[#8A8A82]">Hasta</label>
            <input
              type="date"
              name="to"
              defaultValue={params.to ?? ""}
              className="text-[12px] text-[#1C1C1A] border border-[#E8E6DF] rounded-lg px-3 py-1.5 bg-[#FAFAF7] focus:outline-none focus:ring-1 focus:ring-[#2F6B3C]/40"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-[#2F6B3C] text-white text-[12px] font-medium rounded-lg hover:bg-[#27500A] transition-colors"
          >
            Aplicar
          </button>
          {hasFilters && (
            <Link
              href="/admin/reports"
              className="px-4 py-1.5 border border-[#E8E6DF] text-[#5C5B54] text-[12px] font-medium rounded-lg hover:bg-[#F5F4F0] transition-colors"
            >
              Limpiar
            </Link>
          )}
        </form>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-[#E8E6DF] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8E6DF]">
          <p className="text-[13px] font-semibold text-[#1C1C1A]">Historial de asistencia</p>
          <span className="text-[11px] text-[#B0AFA8]">{total} registros</span>
        </div>

        {error && (
          <div className="p-5">
            <p className="text-[12px] text-[#993C1D] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-3">
              Error al cargar: {error.message}
            </p>
          </div>
        )}

        {!error && total === 0 && (
          <div className="py-12 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#F5F4F0] flex items-center justify-center mx-auto mb-3">
              <Bike className="w-5 h-5 text-[#D1CFC8]" />
            </div>
            <p className="text-[12px] text-[#8A8A82]">
              {hasFilters ? "No hay registros con estos filtros." : "Aún no hay registros de asistencia."}
            </p>
          </div>
        )}

        {records && records.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#FAFAF7] border-b border-[#F3F1EA]">
                  {["Nombre", "Cédula", "Fecha", "Bici", "Estado"].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-left text-[10px] font-semibold text-[#B0AFA8] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F1EA]">
                {records.map((r) => {
                  const u = r.users as { name: string; identifier: string } | null;
                  return (
                    <tr key={r.id} className="hover:bg-[#FAFAF7] transition-colors">
                      <td className="px-5 py-2.5 font-medium text-[#1C1C1A]">{u?.name ?? "—"}</td>
                      <td className="px-5 py-2.5 text-[#8A8A82] font-mono">{u?.identifier ?? "—"}</td>
                      <td className="px-5 py-2.5 text-[#5C5B54]">
                        {new Date(r.date + "T12:00:00").toLocaleDateString("es-CO", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-2.5">
                        {r.is_bike ? (
                          <span className="inline-flex items-center gap-1 text-[#27500A] bg-[#EAF3DE] px-2 py-0.5 rounded text-[10px] font-medium">
                            <Bike className="w-3 h-3" /> Sí
                          </span>
                        ) : (
                          <span className="text-[#B0AFA8] text-[10px]">No</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5">
                        <span className={
                          r.status === "confirmed"
                            ? "inline-flex items-center gap-1 text-[#27500A] bg-[#EAF3DE] px-2 py-0.5 rounded text-[10px] font-medium"
                            : "inline-flex items-center gap-1 text-[#854F0B] bg-[#FAEEDA] px-2 py-0.5 rounded text-[10px] font-medium"
                        }>
                          <span className={`w-1 h-1 rounded-full ${r.status === "confirmed" ? "bg-[#2F6B3C]" : "bg-[#854F0B]"}`} />
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