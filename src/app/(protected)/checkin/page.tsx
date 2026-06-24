"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Status = "verifying" | "ready" | "submitting" | "success" | "already" | "error";

export default function CheckinPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus("error");
        setMessage("Falta el código QR. Escanea de nuevo en portería.");
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gate-token`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "verify", token }),
          }
        );
        const data = await res.json();

        if (!res.ok || !data.valid) {
          setStatus("error");
          setMessage("El código QR expiró. Escanea el código actual en portería.");
          return;
        }

        setStatus("ready");
      } catch {
        setStatus("error");
        setMessage("No se pudo verificar el código. Intenta de nuevo.");
      }
    }

    verify();
  }, [token]);

  async function handleConfirm() {
    setStatus("submitting");
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setStatus("error");
      setMessage("Tu sesión expiró. Vuelve a iniciar sesión.");
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
        setMessage("Ya registraste tu llegada hoy. ¡Nos vemos mañana!");
      } else {
        setStatus("error");
        setMessage("No se pudo registrar tu llegada. Intenta de nuevo.");
      }
      return;
    }

    setStatus("success");
    setMessage("¡Llegada registrada con éxito!");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm text-center space-y-4">
        {status === "verifying" && <p>Verificando código...</p>}

        {status === "ready" && (
          <>
            <p className="text-lg font-medium">Confirma tu llegada en bicicleta</p>
            <button
              onClick={handleConfirm}
              className="w-full bg-green-600 text-white rounded-md py-2 font-medium"
            >
              Confirmar llegada
            </button>
          </>
        )}

        {status === "submitting" && <p>Registrando...</p>}

        {(status === "success" || status === "already" || status === "error") && (
          <p
            className={
              status === "error" ? "text-red-600" : "text-green-700 font-medium"
            }
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}