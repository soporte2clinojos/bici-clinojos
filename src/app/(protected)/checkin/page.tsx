"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Bike,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Status =
  | "verifying"
  | "submitting"
  | "success"
  | "already"
  | "error";

function CheckinContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");

  async function registerAttendance() {
    setStatus("submitting");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("error");
      setMessage("Tu sesión expiró. Inicia sesión nuevamente.");
      return;
    }

    const verifyRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gate-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "verify",
          token,
        }),
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData.valid) {
      setStatus("error");
      setMessage(
        "El código QR ya no es válido. Escanea el código actual en portería."
      );
      return;
    }

    const { error } = await supabase.from("attendance").insert({
      user_id: user.id,
      is_bike: true,
      status: "confirmed",
    });

    if (error) {
      if (error.code === "23505") {
        setStatus("already");
        setMessage(
          "Ya registraste tu llegada hoy. ¡Gracias por venir en bicicleta!"
        );
      } else {
        setStatus("error");
        setMessage(
          "No fue posible registrar tu llegada. Intenta nuevamente."
        );
      }

      return;
    }

    setStatus("success");
    setMessage("Tu llegada fue registrada correctamente.");
  }

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus("error");
        setMessage("No se encontró un código QR válido.");
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gate-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "verify",
              token,
            }),
          }
        );

        const data = await res.json();

        if (!res.ok || !data.valid) {
          setStatus("error");
          setMessage(
            "El código QR expiró. Escanea nuevamente el código de portería."
          );
          return;
        }

        await registerAttendance();
      } catch {
        setStatus("error");
        setMessage(
          "No fue posible validar el código. Intenta nuevamente."
        );
      }
    }

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Card principal */}
        <div className="bg-white rounded-xl border border-[#E8E6DF] p-6 shadow-sm">

          <div className="flex flex-col items-center text-center">

            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-colors ${
                status === "success"
                  ? "bg-[#EAF3DE]"
                  : status === "error" || status === "already"
                  ? "bg-[#FEF2F2]"
                  : "bg-[#F3F1EA]"
              }`}
            >
              {(status === "verifying" || status === "submitting") && (
                <LoaderCircle className="w-7 h-7 text-[#2F6B3C] animate-spin" />
              )}

              {status === "success" && (
                <CheckCircle2 className="w-8 h-8 text-[#2F6B3C]" />
              )}

              {(status === "error" || status === "already") && (
                <AlertCircle className="w-8 h-8 text-[#D85A30]" />
              )}
            </div>

            <h1 className="text-[18px] font-semibold text-[#1C1C1A]">
              {status === "verifying" && "Validando código"}
              {status === "submitting" && "Registrando llegada"}
              {status === "success" && "Llegada registrada"}
              {status === "already" && "Registro existente"}
              {status === "error" && "No fue posible continuar"}
            </h1>

            <p className="text-[13px] text-[#8A8A82] leading-relaxed mt-2">
              {status === "verifying" &&
                "Estamos verificando el código escaneado."}

              {status === "submitting" &&
                "Guardando tu asistencia en el sistema."}

              {(status === "success" ||
                status === "already" ||
                status === "error") &&
                message}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <Bike className="w-3 h-3 text-[#B0AFA8]" />
          <p className="text-[11px] text-[#B0AFA8]">
            BiciClinojos
          </p>
        </div>

      </div>
    </div>
  );
}

export default function CheckinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center">
          <LoaderCircle className="w-7 h-7 animate-spin text-[#2F6B3C]" />
        </div>
      }
    >
      <CheckinContent />
    </Suspense>
  );
}