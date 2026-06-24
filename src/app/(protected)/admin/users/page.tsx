// src/app/(protected)/admin/users/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { UserCheck, UserX, Bike, User } from "lucide-react";

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

export default async function UsersPage() {
  const supabase = await getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  // Columnas reales: id, name, identifier, role, created_at
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, name, identifier, role, created_at")
    .order("name");

  // Asistencias confirmadas para calcular stats por usuario
  const { data: attendance } = await supabase
    .from("attendance")
    .select("user_id, status, date, is_bike")
    .eq("status", "confirmed");

  const today = new Date().toISOString().slice(0, 10);

  const enrichedUsers = users?.map((u) => {
    const userAtt = attendance?.filter((a) => a.user_id === u.id) ?? [];
    const totalDias = userAtt.length;
    const asistioHoy = userAtt.some((a) => a.date === today);
    const usaBici = userAtt.some((a) => a.is_bike);
    return { ...u, totalDias, asistioHoy, usaBici };
  }) ?? [];

  const admins = enrichedUsers.filter((u) => u.role === "admin");
  const cyclists = enrichedUsers.filter((u) => u.role === "user");
  const asistieronHoy = enrichedUsers.filter((u) => u.asistioHoy).length;

  // Máximo de días para la barra de progreso (relativo al usuario con más días)
  const maxDias = Math.max(...enrichedUsers.map((u) => u.totalDias), 1);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-[#E8E6DF] p-4">
          <p className="text-[11px] text-[#8A8A82] uppercase tracking-wider mb-1">Total usuarios</p>
          <p className="text-[24px] font-bold text-[#1C1C1A]">{enrichedUsers.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E8E6DF] p-4">
          <p className="text-[11px] text-[#8A8A82] uppercase tracking-wider mb-1">Ciclistas</p>
          <p className="text-[24px] font-bold text-[#2F6B3C]">{cyclists.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E8E6DF] p-4">
          <p className="text-[11px] text-[#8A8A82] uppercase tracking-wider mb-1">Asistieron hoy</p>
          <p className="text-[24px] font-bold text-[#1C4ED8]">{asistieronHoy}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E8E6DF] p-4">
          <p className="text-[11px] text-[#8A8A82] uppercase tracking-wider mb-1">Administradores</p>
          <p className="text-[24px] font-bold text-[#6B21A8]">{admins.length}</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-[#E8E6DF] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E6DF]">
          <h2 className="text-[14px] font-semibold text-[#1C1C1A]">Usuarios registrados</h2>
          <span className="text-[12px] text-[#8A8A82]">{enrichedUsers.length} usuarios</span>
        </div>

        {usersError && (
          <div className="p-5">
            <p className="text-[13px] text-[#993C1D] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-4 py-3">
              Error al cargar usuarios: {usersError.message}
            </p>
          </div>
        )}

        {!usersError && enrichedUsers.length === 0 && (
          <div className="p-10 text-center">
            <User className="w-8 h-8 text-[#D1CFC8] mx-auto mb-2" />
            <p className="text-[13px] text-[#8A8A82]">No hay usuarios registrados.</p>
          </div>
        )}

        {enrichedUsers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#FAFAF7] border-b border-[#F3F1EA]">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#B0AFA8] uppercase tracking-wider">Nombre</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#B0AFA8] uppercase tracking-wider">Identificador</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#B0AFA8] uppercase tracking-wider">Rol</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#B0AFA8] uppercase tracking-wider">Días asistidos</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-[#B0AFA8] uppercase tracking-wider">Hoy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F1EA]">
                {enrichedUsers.map((u) => {
                  const initials = u.name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() ?? "?";

                  return (
                    <tr key={u.id} className="hover:bg-[#FAFAF7] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#EAF3DE] flex items-center justify-center text-[10px] font-bold text-[#2F6B3C] shrink-0">
                            {initials}
                          </div>
                          <span className="font-medium text-[#1C1C1A]">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[#5C5B54] font-mono text-[12px]">
                        {u.identifier ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        {u.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 text-[#6B21A8] bg-[#F5F3FF] px-2.5 py-1 rounded-md text-[11px] font-semibold">
                            <UserCheck className="w-3 h-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#2F6B3C] bg-[#EAF3DE] px-2.5 py-1 rounded-md text-[11px] font-semibold">
                            <Bike className="w-3 h-3" />
                            Ciclista
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[80px] h-1.5 bg-[#F3F1EA] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#2F6B3C] rounded-full"
                              style={{ width: `${(u.totalDias / maxDias) * 100}%` }}
                            />
                          </div>
                          <span className="text-[#5C5B54] font-medium tabular-nums text-[12px]">
                            {u.totalDias}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {u.asistioHoy ? (
                          <span className="inline-flex items-center gap-1 text-[#27500A] text-[12px] font-medium">
                            <UserCheck className="w-3.5 h-3.5 text-[#2F6B3C]" />
                            Presente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#B0AFA8] text-[12px]">
                            <UserX className="w-3.5 h-3.5" />
                            Ausente
                          </span>
                        )}
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