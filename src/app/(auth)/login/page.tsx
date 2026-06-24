"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

// El label del campo cambia según el modo de login
// - "user" (signup o default login): muestra "Cédula"
// - El admin/portero siempre usa login normal con su username

type LoginMode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ¿El identifier parece un username (no numérico)?
  const isUsername = identifier.trim() !== "" && isNaN(Number(identifier.trim()));

  const fieldLabel = mode === "signup"
    ? "Cédula"
    : isUsername
      ? "Usuario"
      : "Cédula / Usuario";

  const fieldPlaceholder = mode === "signup"
    ? "1073599507"
    : "1073599507 · admin · portero";

  const fieldInputMode = mode === "signup" ? "numeric" : "text";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/auth-cedula`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "signup"
              ? { action: "signup", identifier, password, name }
              : { action: "login", identifier, password }
          ),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const supabase = createClient();
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      // Redirección basada en rol
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.session.user.id)
        .single();

      const role = profile?.role;
      if (role === "admin") router.push("/admin");
      else if (role === "gatekeeper") router.push("/gatekeeper");
      else router.push("/dashboard");

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7] px-4 py-8 sm:px-6">
      <div className="w-full max-w-[920px] grid md:grid-cols-[280px_1fr] bg-white rounded-2xl shadow-[0_2px_40px_-12px_rgba(28,28,26,0.12)] overflow-hidden border border-[#ECEAE3]">

        {/* Panel de marca — solo md+ */}
        <div className="hidden md:flex relative bg-[#F3F1EA] p-10 flex-col justify-between">
          <div>
            <p className="text-[#2F6B3C] text-sm font-semibold tracking-wide">
              BiciClinojos
            </p>
            <p className="mt-1 text-[#8A8A82] text-[13px] leading-relaxed">
              Control de asistencia para quienes llegan pedaleando.
            </p>
          </div>

          <div className="relative flex-1 my-8 ml-3">
            <div
              className="absolute left-0 top-0 bottom-0 w-px"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to bottom, #2F6B3C 0, #2F6B3C 4px, transparent 4px, transparent 11px)",
              }}
            />
            <div className="absolute -left-[5px] top-0">
              <span className="relative flex h-[11px] w-[11px]">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#2F6B3C] opacity-40 animate-ping" />
                <span className="relative inline-flex h-[11px] w-[11px] rounded-full bg-[#2F6B3C]" />
              </span>
            </div>
            <p className="ml-5 text-[#1C1C1A] text-[13px] font-medium">Portería</p>

            <div className="absolute -left-[3px] bottom-0 h-[7px] w-[7px] rounded-full bg-[#C7C4B6]" />
            <p className="ml-5 -mt-2 text-[#8A8A82] text-[13px]">Tu oficina</p>
          </div>

          <p className="text-[#B5B3A6] text-[12px]">Cada pedaleada cuenta.</p>
        </div>

        {/* Header móvil */}
        <div className="md:hidden flex items-center gap-2 px-6 pt-6">
          <span className="h-2 w-2 rounded-full bg-[#2F6B3C]" />
          <p className="text-[#2F6B3C] text-sm font-semibold tracking-wide">
            BiciClinojos
          </p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 md:p-10 flex flex-col gap-4 sm:gap-5"
        >
          <div>
            <h1 className="text-[20px] sm:text-[22px] font-semibold text-[#1C1C1A]">
              {mode === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta"}
            </h1>
            <p className="text-[#8A8A82] text-[13px] mt-1">
              {mode === "login"
                ? "Ingresa con tu cédula o usuario para continuar."
                : "Regístrate una vez y listo para siempre."}
            </p>
          </div>

          {mode === "signup" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#5C5B54]">
                Nombre completo
              </label>
              <input
                type="text"
                placeholder="Ej. Laura Gómez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-[#E3E1D9] text-[#1C1C1A] placeholder-[#B5B3A6] text-[14px] outline-none focus:border-[#2F6B3C] focus:ring-2 focus:ring-[#2F6B3C]/10 transition"
                required
              />
            </div>
          )}

          {/* Campo dinámico: cédula o username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#5C5B54]">
              {fieldLabel}
            </label>
            <input
              type="text"
              inputMode={fieldInputMode}
              placeholder={fieldPlaceholder}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full h-11 px-3.5 rounded-lg border border-[#E3E1D9] text-[#1C1C1A] placeholder-[#B5B3A6] text-[14px] outline-none focus:border-[#2F6B3C] focus:ring-2 focus:ring-[#2F6B3C]/10 transition"
              required
              autoComplete="username"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#5C5B54]">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3.5 rounded-lg border border-[#E3E1D9] text-[#1C1C1A] placeholder-[#B5B3A6] text-[14px] outline-none focus:border-[#2F6B3C] focus:ring-2 focus:ring-[#2F6B3C]/10 transition"
              required
              minLength={6}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-[#993C1D] text-[13px] -mt-1 break-words">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#2F6B3C] hover:bg-[#27592F] text-white rounded-lg font-medium text-[14px] disabled:opacity-50 transition"
          >
            {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Registrarme"}
          </button>

          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            className="w-full text-[13px] text-[#5C5B54] hover:text-[#1C1C1A] transition"
          >
            {mode === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <span className="text-[#2F6B3C] font-medium">
              {mode === "login" ? "Regístrate" : "Inicia sesión"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}