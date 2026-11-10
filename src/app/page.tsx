import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { getTodosLosProductos } from '@/features/menu/actions/menu-queries';
import { formatearCOP } from '@/lib/currency';
import { LandingNavbar } from '@/components/landing/landing-navbar';
import { LandingFooter } from '@/components/landing/landing-footer';
import { BotonInstalarPwa } from '@/components/boton-instalar-pwa';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // 1. Obtener usuario actual si existe sesión activa
  let usuarioActual: {
    nombre: string;
    email: string;
    role: 'ADMIN' | 'MESERO' | 'COCINA';
  } | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const perfil = await prisma.perfil.findUnique({
        where: { id: user.id },
      });
      if (perfil) {
        usuarioActual = {
          nombre: perfil.nombre,
          email: perfil.email,
          role: perfil.role,
        };
      }
    }
  } catch (e) {
    // Si falla supabase o no hay cookies, se presenta como visitante público
  }

  // 2. Obtener platillos de la carta
  const productosRes = await getTodosLosProductos();
  const productos = productosRes.success && productosRes.data ? productosRes.data : [];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-orange-500 selection:text-white">
      {/* 1. NAVBAR SUPERIOR CON ACCESOS A LOGIN */}
      <LandingNavbar usuarioActual={usuarioActual} />

      {/* 2. HERO PRINCIPAL */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-zinc-900 bg-gradient-to-b from-zinc-950 via-black to-black">
        {/* Luces y efectos de fondo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-orange-500/10 blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[250px] bg-amber-500/10 blur-[110px] pointer-events-none rounded-full" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge superior */}
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-950/20 px-3.5 py-1 text-xs font-bold text-orange-400 mb-6 shadow-lg shadow-orange-500/10">
            <span className="animate-pulse">🔥</span>
            <span>Sistema Gastronómico & POS en Vivo</span>
          </div>

          {/* Título Principal */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            El Sabor de la Buena Comida con la{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500">
              Velocidad de la Tecnología
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="mt-5 text-sm sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Comandas táctiles para meseros, monitor KDS en cocina en tiempo real, arqueo Z sin descuadres y una experiencia diseñada para deleitar a cada cliente.
          </p>

          {/* Botones de Llamado a la Acción (CTA) */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-md mx-auto sm:max-w-none">
            <a
              href="#menu"
              className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-orange-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <span>🍽️ Explorar Carta Digital</span>
            </a>

            {usuarioActual ? (
              <Link
                href={
                  usuarioActual.role === 'ADMIN'
                    ? '/admin'
                    : usuarioActual.role === 'COCINA'
                    ? '/cocina'
                    : '/mesero'
                }
                className="w-full sm:w-auto rounded-2xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>🚀 Entrar a mi Estación ({usuarioActual.role})</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="w-full sm:w-auto rounded-2xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>🔐 Iniciar Sesión (Personal)</span>
              </Link>
            )}

            <div className="w-full sm:w-auto flex justify-center">
              <BotonInstalarPwa variante="destacado" />
            </div>
          </div>

          {/* Métricas destacadas */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-center">
              <span className="text-2xl">⚡</span>
              <p className="mt-1 text-lg sm:text-xl font-black text-white">&lt; 30 seg</p>
              <p className="text-[11px] text-zinc-400 font-medium">Comanda en Cocina</p>
            </div>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-center">
              <span className="text-2xl">💳</span>
              <p className="mt-1 text-lg sm:text-xl font-black text-emerald-400">Pago Dividido</p>
              <p className="text-[11px] text-zinc-400 font-medium">Efectivo + Transferencia</p>
            </div>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-center">
              <span className="text-2xl">📋</span>
              <p className="mt-1 text-lg sm:text-xl font-black text-white">Reporte Z</p>
              <p className="text-[11px] text-zinc-400 font-medium">Arqueo Diario Exacto</p>
            </div>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-center">
              <span className="text-2xl">🇨🇴</span>
              <p className="mt-1 text-lg sm:text-xl font-black text-amber-400">COP Oficial</p>
              <p className="text-[11px] text-zinc-400 font-medium">Billetes y Denominaciones</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECCIÓN: NUESTRA CARTA DIGITAL (#menu) */}
      <section id="menu" className="py-16 sm:py-24 border-b border-zinc-900 bg-zinc-950/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <span className="rounded-md bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 text-xs font-bold text-orange-400 uppercase tracking-wider">
                Especialidades de la Casa
              </span>
              <h2 className="mt-2 text-2xl sm:text-4xl font-black text-white">
                Nuestra Carta en Vivo
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                Platillos preparados al momento. Disponibilidad sincronizada en tiempo real con cocina.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-950/70 border border-emerald-800/80 px-3 py-1 text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Precios en Pesos Colombianos ($ COP)</span>
              </span>
            </div>
          </div>

          {/* Grid de Platillos */}
          {productos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {productos.map((prod) => (
                <div
                  key={prod.id}
                  className={`group rounded-3xl border p-5 transition-all flex flex-col justify-between ${
                    prod.disponible
                      ? 'border-zinc-800 bg-zinc-900/50 hover:border-orange-500/40 hover:bg-zinc-900/80 shadow-lg hover:shadow-orange-500/5'
                      : 'border-zinc-900 bg-zinc-950/40 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-zinc-300">
                        {prod.categoria?.nombre || 'Platillo'}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                          prod.disponible
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border-rose-800'
                        }`}
                      >
                        {prod.disponible ? '🟢 Disponible' : '🔴 Agotado'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
                      {prod.nombre}
                    </h3>
                  </div>

                  <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-500">Precio</span>
                      <p className="text-xl font-black text-orange-400">
                        {formatearCOP(prod.precio)}
                      </p>
                    </div>

                    <span className="text-xs font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors">
                      Pedir en Mesa 🧾
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-12 text-center text-zinc-400">
              <span className="text-4xl mb-2 block">🍽️</span>
              <p className="text-base font-bold text-white">Catálogo en preparación</p>
              <p className="text-xs text-zinc-500 mt-1">
                Los platillos registrados desde el panel administrativo aparecerán aquí automáticamente.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 4. SECCIÓN: SISTEMAS DEL RESTAURANTE (#modulos) */}
      <section id="modulos" className="py-16 sm:py-24 border-b border-zinc-900 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-xs font-bold text-blue-400 uppercase tracking-wider">
              Ecosistema Operativo
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-black text-white">
              Herramientas Diseñadas para tu Personal
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-400">
              Cada área del restaurante cuenta con una interfaz especializada y optimizada para pantallas táctiles y móviles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Módulo 1: Meseros */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between hover:border-blue-500/50 transition-all group">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-950/60 border border-blue-800 text-2xl mb-4 group-hover:scale-110 transition-transform">
                  📱
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                  Estación de Mesero
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Toma de comandas en mesas de terraza, pedidos externos (llevar y domicilio), selección de adiciones y cobro en efectivo, transferencia o dividido 50/50.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/80">
                <Link
                  href="/login?rol=mesero"
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center justify-between"
                >
                  <span>Ingresar como Mesero</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Módulo 2: Cocina */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between hover:border-amber-500/50 transition-all group">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-950/60 border border-amber-800 text-2xl mb-4 group-hover:scale-110 transition-transform">
                  👨‍🍳
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                  Monitor KDS de Cocina
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Recepción de pedidos con avisos sonoros y destellos visuales. Cambio de estados (Pendiente, Preparando, Listo) y marcado de platillos agotados en un toque.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/80">
                <Link
                  href="/login?rol=cocina"
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center justify-between"
                >
                  <span>Ingresar a Cocina</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Módulo 3: Administración */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between hover:border-orange-500/50 transition-all group">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-950/60 border border-orange-800 text-2xl mb-4 group-hover:scale-110 transition-transform">
                  👑
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
                  Panel Administrativo
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Control financiero en tiempo real, arqueo ciego diario y generación de Reportes Z térmicos imprimibles, catálogo de menú y nómina de meseros con auditoría.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/80">
                <Link
                  href="/login?rol=admin"
                  className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center justify-between"
                >
                  <span>Acceso Administrador</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Módulo 4: Portal Clientes (Próximamente) */}
            <div className="rounded-3xl border border-zinc-800/60 bg-zinc-950/40 p-6 flex flex-col justify-between hover:border-purple-500/40 transition-all group relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="rounded-full bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 text-[9px] font-black uppercase text-purple-300">
                  Próximamente
                </span>
              </div>
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-950/40 border border-purple-800/60 text-2xl mb-4 group-hover:scale-110 transition-transform">
                  🍽️
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                  Portal Clientes & 3D AR
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Experiencia para clientes mediante código QR en mesa: visualización de comida en 360° y Realidad Aumentada, pedidos digitales sin esperar al mesero.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/80">
                <span className="text-xs font-bold text-purple-400 flex items-center justify-between">
                  <span>En desarrollo</span>
                  <span>✨</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECCIÓN: EXPERIENCIA Y BENEFICIOS (#experiencia) */}
      <section id="experiencia" className="py-16 sm:py-24 border-b border-zinc-900 bg-zinc-950/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Eficiencia Garantizada
              </span>
              <h2 className="mt-3 text-2xl sm:text-4xl font-black text-white leading-tight">
                Diseñado para la Realidad y Presión de un Restaurante
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Sin configuraciones complejas ni retrasos de red. SazonareFood opera con persistencia local y sincronización atómica con Supabase.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/30 text-sm">
                    ✔️
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Sin Descuadres en Caja</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      El sistema distingue con exactitud el fondo de cambio (base) de las ventas netas en efectivo y transferencias.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/30 text-sm">
                    ✔️
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Auditoría Individual por Mesero</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Cada comanda y ticket térmico registra automáticamente qué mesero atendió la mesa.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm">
                    ✔️
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Instalable como PWA en Teléfonos</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Funciona a pantalla completa en Android, iPhone y tablets sin barras de navegador ni gestos accidentales.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta Visual de Resumen Operativo */}
            <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-zinc-950 p-6 sm:p-8 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🧾</span>
                  <div>
                    <p className="text-sm font-bold text-white">Flujo de Pedido Típico</p>
                    <p className="text-[11px] text-zinc-400">Terraza Jardín • Mesa 3</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-950 border border-emerald-700 px-3 py-1 text-xs font-extrabold text-emerald-300">
                  En Tiempo Real
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="rounded-2xl border border-zinc-800 bg-black/50 p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">1️⃣</span>
                    <div>
                      <p className="font-bold text-white">Mesero envía comanda</p>
                      <p className="text-[11px] text-zinc-400">2x Hamburguesa Clásica {`{Sin cebolla}`}</p>
                    </div>
                  </div>
                  <span className="text-orange-400 font-extrabold">Instantáneo</span>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-black/50 p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">2️⃣</span>
                    <div>
                      <p className="font-bold text-white">Cocina recibe campanazo y destello</p>
                      <p className="text-[11px] text-zinc-400">Monitor KDS cambia a Preparando</p>
                    </div>
                  </div>
                  <span className="text-blue-400 font-extrabold">🔔 Audio KDS</span>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-black/50 p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">3️⃣</span>
                    <div>
                      <p className="font-bold text-white">Cobro Dividido en Mesa</p>
                      <p className="text-[11px] text-zinc-400">50% Efectivo COP + 50% Transferencia</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-extrabold">✓ Cuadrado</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-xs font-bold text-white transition-colors"
                >
                  <span>Probar Sistema Ahora</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <LandingFooter />
    </div>
  );
}
