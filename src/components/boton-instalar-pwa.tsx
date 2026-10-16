'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function BotonInstalarPwa() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [esInstalable, setEsInstalable] = useState(false);
  const [yaInstalada, setYaInstalada] = useState(false);
  const [mostrarGuiaIos, setMostrarGuiaIos] = useState(false);
  const [esIos, setEsIos] = useState(false);

  useEffect(() => {
    // Detectar si ya está corriendo en modo standalone (instalada)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setYaInstalada(true);
      return;
    }

    // Detectar iOS / iPadOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setEsIos(isAppleDevice);

    // Capturar el evento nativo de instalación de Chromium / Android / Edge
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      setEsInstalable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Detectar cuando la app se instaló con éxito
    window.addEventListener('appinstalled', () => {
      setYaInstalada(true);
      setEsInstalable(false);
      setPromptEvent(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstalar = async () => {
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setYaInstalada(true);
      }
      setPromptEvent(null);
      setEsInstalable(false);
    } else if (esIos) {
      setMostrarGuiaIos(true);
    }
  };

  // Si ya está abierta como App instalada, no mostramos nada
  if (yaInstalada) return null;

  // Si no es instalable por Chromium y no es iOS, ocultar
  if (!esInstalable && !esIos) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleInstalar}
        className="flex items-center gap-1.5 rounded-xl bg-orange-500/15 border border-orange-500/30 px-2.5 py-1.5 text-xs font-bold text-orange-400 hover:bg-orange-500 hover:text-white transition-all shadow-sm active:scale-95"
        title="Instalar SazonareFood como aplicación nativa en este dispositivo"
      >
        <span className="text-sm">📲</span>
        <span>Instalar App</span>
      </button>

      {/* Mini Modal informativo para iPhone / iPad */}
      {mostrarGuiaIos && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={() => setMostrarGuiaIos(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl text-center space-y-3">
            <div className="h-12 w-12 mx-auto flex items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/30 text-2xl">
              📱
            </div>
            <h4 className="font-extrabold text-white text-base">Instalar en tu iPhone o iPad</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              En Safari, toca el botón <strong className="text-white">Compartir (icono ⎋)</strong> en la barra inferior y luego selecciona <strong className="text-orange-400">&quot;Añadir a pantalla de inicio ➕&quot;</strong>.
            </p>
            <button
              type="button"
              onClick={() => setMostrarGuiaIos(false)}
              className="w-full rounded-xl bg-orange-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600 transition-colors"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
