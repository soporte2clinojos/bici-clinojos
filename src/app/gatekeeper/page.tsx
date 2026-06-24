"use client";

import { useEffect, useState } from "react";
import { Bike, Wifi } from "lucide-react";

const QR_IMAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gate-qr-image`;
const TOTAL_SECONDS = 60;

export default function GatekeeperPage() {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [clock, setClock] = useState("");
  const [imgKey, setImgKey] = useState(0);

  useEffect(() => {
    function syncCountdown() {
      const now = Date.now() / 1000;
      const secondsIntoWindow = now % TOTAL_SECONDS;
      setSecondsLeft(Math.ceil(TOTAL_SECONDS - secondsIntoWindow));
    }

    syncCountdown();
    const countdown = setInterval(syncCountdown, 1000);

    const clockInterval = setInterval(() => {
      setClock(
        new Date().toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);

    const bucketWatcher = setInterval(() => {
      setImgKey(Math.floor(Date.now() / 1000 / TOTAL_SECONDS));
    }, 1000);

    return () => {
      clearInterval(countdown);
      clearInterval(clockInterval);
      clearInterval(bucketWatcher);
    };
  }, []);

  const isExpiring = secondsLeft <= 10;
  const progress = (secondsLeft / TOTAL_SECONDS) * 100;

  return (
    <div className="min-h-screen bg-[#F5F4F0] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm mx-auto space-y-4">

        {/* Header card */}
        <div className="bg-white rounded-xl border border-[#E8E6DF] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EAF3DE] flex items-center justify-center">
                <Bike className="w-4 h-4 text-[#2F6B3C]" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#1C1C1A] leading-tight">BiciClinojos</p>
                <p className="text-[10px] text-[#8A8A82] uppercase tracking-wide">Portería</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#2F6B3C] opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#2F6B3C]" />
              </span>
              <p className="text-[11px] text-[#2F6B3C] font-medium">
                {clock || "00:00:00"}
              </p>
            </div>
          </div>
        </div>

        {/* QR card */}
        <div className="bg-white rounded-xl border border-[#E8E6DF] p-6 flex flex-col items-center gap-5">
          <div>
            <p className="text-[15px] font-semibold text-[#1C1C1A] text-center">
              Escanea para registrar tu llegada
            </p>
            <p className="text-[12px] text-[#8A8A82] text-center mt-0.5">
              Apunta la cámara de tu celular al código
            </p>
          </div>

          {/* QR image */}
          <div className={`p-3 rounded-xl border-2 transition-colors ${
            isExpiring ? "border-[#D85A30]/40 bg-[#FEF2F2]" : "border-[#E8E6DF] bg-[#FAFAF7]"
          }`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={imgKey}
              src={`${QR_IMAGE_URL}?w=${imgKey}`}
              alt="Código QR para registrar asistencia"
              width={220}
              height={220}
              className="rounded-md"
            />
          </div>

          {/* Countdown */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-[#8A8A82]">
                {isExpiring ? "Renovando código..." : "Tiempo para escanear"}
              </p>
              <p className={`text-[20px] font-bold tabular-nums leading-none ${
                isExpiring ? "text-[#D85A30]" : "text-[#1C1C1A]"
              }`}>
                {secondsLeft}s
              </p>
            </div>
            <div className="h-1.5 bg-[#F3F1EA] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isExpiring ? "bg-[#D85A30]" : "bg-[#2F6B3C]"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-center gap-1.5">
          <Wifi className="w-3 h-3 text-[#B0AFA8]" />
          <p className="text-[11px] text-[#B0AFA8]">
            El código se renueva automáticamente cada 60 segundos
          </p>
        </div>

      </div>
    </div>
  );
}