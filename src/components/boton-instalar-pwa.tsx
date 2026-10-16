'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface BotonInstalarPwaProps {
  variante?: 'default' | 'destacado';
}

export function BotonInstalarPwa({ variante = 'default' }: BotonInstalarPwaProps) {
  const [mounted, setMounted] = useState(false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [yaInstalada, setYaInstalada] = useState(false);
  const [mostrarGuia, setMostrarGuia] = useState(false);
  const [tipoDispositivo, setTipoDispositivo] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    setMounted(true);

    // Detectar si ya está corriendo en modo standalone (instalada como app)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setYaInstalada(true);
      return;
    }

    // Detectar tipo de dispositivo para dar instrucciones precisas
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setTipoDispositivo('ios');
    } else if (/android/.test(ua)) {
      setTipoDispositivo('android');
    } else {
      setTipoDispositivo('desktop');
    }

    // Capturar el evento nativo de instalación de Chrome / Edge / Android
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Detectar cuando la app se instala con éxito
    window.addEventListener('appinstalled', () => {
      setYaInstalada(true);
      setPromptEvent(null);
      setMostrarGuia(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstalar = async () => {
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') {
          setYaInstalada(true);
        }
        setPromptEvent(null);
      } catch (err) {
        setMostrarGuia(true);
      }
    } else {
      // Si el navegador no disparó el prompt nativo directamente, mostramos la guía visual
      setMostrarGuia(true);
    }
  };

  // Evitar renderizado desalineado en SSR
  if (!mounted) return null;

  // Si ya está abierta dentro de la PWA instalada, no mostramos nada
  if (yaInstalada) return null;

  return (
    <>
      {variante === 'destacado' ? (
        <button
          type="button"
          onClick={handleInstalar}
          className="group w-full flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-orange-500/15 border border-orange-500/30 p-3 text-left hover:border-orange-500/50 hover:bg-orange-500/20 transition-all active:scale-[0.99] shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white text-xl shadow-md shadow-orange-500/30 group-hover:scale-105 transition-transform">
              📲
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                Instalar Aplicación Nativa
                <span className="rounded bg-orange-500/20 text-orange-400 text-[10px] px-1.5 py-0.2 border border-orange-500/30">
                  PWA
                </span>
              </p>
              <p className="text-[11px] text-zinc-400">
                Pantalla completa para meseros, cocina o PC
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-orange-400 group-hover:translate-x-0.5 transition-transform">
            Instalar →
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInstalar}
          className="flex items-center gap-1.5 rounded-xl bg-orange-500/15 border border-orange-500/30 px-3 py-1.5 text-xs font-bold text-orange-400 hover:bg-orange-500 hover:text-white transition-all shadow-sm active:scale-95"
          title="Instalar SazonareFood como aplicación nativa"
        >
          <span className="text-sm">📲</span>
          <span>Instalar App</span>
        </button>
      )}

      {/* Modal interactivo con guía de instalación según el dispositivo */}
      {mostrarGuia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="fixed inset-0" onClick={() => setMostrarGuia(false)} />

          <div className="relative z-10 w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/30 text-xl">
                  📲
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm">Cómo instalar Sazonare</h4>
                  <p className="text-[11px] text-zinc-400">Aplicación oficial para tu equipo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostrarGuia(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Instrucción según dispositivo */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
              {tipoDispositivo === 'ios' ? (
                <>
                  <p className="text-xs font-bold text-white flex items-center gap-2">
                    <span>🍏</span> En tu iPhone o iPad (Safari):
                  </p>
                  <ol className="text-xs text-zinc-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>
                      Toca el botón <strong className="text-white">Compartir (icono ⎋)</strong> en la barra inferior.
                    </li>
                    <li>
                      Desliza hacia abajo y selecciona <strong className="text-orange-400">&quot;Añadir a pantalla de inicio ➕&quot;</strong>.
                    </li>
                    <li>
                      Toca <strong className="text-white">&quot;Añadir&quot;</strong> arriba a la derecha. ¡Listo!
                    </li>
                  </ol>
                </>
              ) : tipoDispositivo === 'android' ? (
                <>
                  <p className="text-xs font-bold text-white flex items-center gap-2">
                    <span>🤖</span> En tu teléfono o tablet Android (Chrome):
                  </p>
                  <ol className="text-xs text-zinc-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>
                      Toca los <strong className="text-white">tres puntos (⋮)</strong> en la esquina superior derecha.
                    </li>
                    <li>
                      Selecciona <strong className="text-orange-400">&quot;Instalar aplicación&quot;</strong> o <strong className="text-orange-400">&quot;Añadir a la pantalla principal&quot;</strong>.
                    </li>
                    <li>
                      Confirma dando clic en <strong className="text-white">&quot;Instalar&quot;</strong>.
                    </li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-white flex items-center gap-2">
                    <span>💻</span> En tu Computador o Pantalla (Chrome / Edge):
                  </p>
                  <ol className="text-xs text-zinc-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>
                      Busca el icono de <strong className="text-orange-400">Instalar (💻 o ⊕)</strong> al final de la barra de direcciones arriba.
                    </li>
                    <li>
                      O haz clic en los <strong className="text-white">tres puntos (⋮)</strong> &gt; <strong className="text-orange-400">&quot;Instalar SazonareFood&quot;</strong>.
                    </li>
                    <li>
                      Se abrirá como una ventana de quiosco en pantalla completa sin barras.
                    </li>
                  </ol>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMostrarGuia(false)}
              className="w-full rounded-xl bg-orange-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600 transition-colors active:scale-95"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
