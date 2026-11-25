import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { getTodosLosProductos } from '@/features/menu/actions/menu-queries';
import { formatearCOP } from '@/lib/currency';
import { LandingNavbar } from '@/components/landing/landing-navbar';
import { LandingFooter } from '@/components/landing/landing-footer';
import { BotonInstalarPwa } from '@/components/boton-instalar-pwa';
import {
  Flame,
  Zap,
  CreditCard,
  FileSpreadsheet,
  QrCode,
  Smartphone,
  ChefHat,
  ShieldCheck,
  ArrowUpRight,
  UtensilsCrossed,
  Sparkles,
} from 'lucide-react';

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
  } catch (_e) {
    // Modo visitante
  }

  // 2. Obtener platillos de la carta
  const productosRes = await getTodosLosProductos();
  const productos = productosRes.success && productosRes.data ? productosRes.data : [];

  return (
    <div className="min-h-screen bg-[#08080a] text-[#f4f4f5] flex flex-col selection:bg-orange-500 selection:text-black">
      {/* 1. NAVBAR SUPERIOR NEO-BRUTALIST */}
      <LandingNavbar usuarioActual={usuarioActual} />

      {/* 2. HERO PRINCIPAL STREET FOOD */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b-2 border-zinc-800 bg-[#08080a]">
        {/* Glow de brasa / ámbar de fondo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-orange-600/15 blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[250px] bg-amber-500/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge superior estilo sticker */}
          <div className="inline-flex items-center gap-2 neo-sticker bg-orange-500 text-black border-black shadow-[3px_3px_0px_0px_#fff] mb-6 rotate-[-1deg]">
            <Flame className="w-3.5 h-3.5 fill-black" />
            <span>SISTEMA STREET FOOD & POS GASTRONÓMICO</span>
          </div>

          {/* Título Principal Neo-Brutalist */}
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white max-w-5xl mx-auto leading-[0.95]">
            EL SABOR DE LA BUENA COMIDA CON LA{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 underline decoration-orange-500 decoration-wavy decoration-4">
              VELOCIDAD DEL FUEGO
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="mt-6 text-sm sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Comandas táctiles para meseros en terraza, monitor KDS en cocina en tiempo real, arqueo Z sin descuadres y pedidos en mesa desde QR para tus comensales.
          </p>

          {/* Botones de Llamado a la Acción (CTA) */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto sm:max-w-none">
            <Link
              href="/cliente"
              className="neo-btn-primary w-full sm:w-auto rounded-xl px-7 py-4 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-[4px_4px_0px_0px_#fff]"
            >
              <QrCode className="w-5 h-5 text-black" />
              <span>Ver Carta & Pedir en Mesa</span>
            </Link>

            <a
              href="#menu"
              className="neo-btn w-full sm:w-auto rounded-xl bg-zinc-900 hover:bg-zinc-800 px-6 py-4 text-xs font-black uppercase tracking-wider text-zinc-200 flex items-center justify-center gap-2 border-2 border-zinc-700"
            >
              <UtensilsCrossed className="w-4 h-4 text-orange-400" />
              <span>Explorar Especialidades</span>
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
                className="neo-btn w-full sm:w-auto rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-6 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-black shadow-[3px_3px_0px_0px_#000]"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Mi Estación ({usuarioActual.role})</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="neo-btn w-full sm:w-auto rounded-xl bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-700 px-6 py-4 text-xs font-black uppercase tracking-wider text-zinc-200 flex items-center justify-center gap-2"
              >
                <span>Acceso Personal</span>
                <ArrowUpRight className="w-4 h-4 text-orange-400" />
              </Link>
            )}

            <div className="w-full sm:w-auto flex justify-center">
              <BotonInstalarPwa variante="destacado" />
            </div>
          </div>

          {/* Métricas destacadas Neo-Brutalist */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            <div className="neo-box rounded-2xl p-4 text-center border-2 border-zinc-800 hover:border-orange-500 transition-colors">
              <Zap className="w-6 h-6 text-orange-400 mx-auto mb-1 stroke-[2.5]" />
              <p className="font-display text-xl sm:text-2xl font-black text-white">&lt; 30 SEG</p>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400">Comanda en Cocina</p>
            </div>
            <div className="neo-box rounded-2xl p-4 text-center border-2 border-zinc-800 hover:border-emerald-500 transition-colors">
              <CreditCard className="w-6 h-6 text-emerald-400 mx-auto mb-1 stroke-[2.5]" />
              <p className="font-display text-xl sm:text-2xl font-black text-emerald-400">PAGO DIVIDIDO</p>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400">Efectivo + Nequi</p>
            </div>
            <div className="neo-box rounded-2xl p-4 text-center border-2 border-zinc-800 hover:border-amber-500 transition-colors">
              <FileSpreadsheet className="w-6 h-6 text-amber-400 mx-auto mb-1 stroke-[2.5]" />
              <p className="font-display text-xl sm:text-2xl font-black text-white">REPORTE Z</p>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400">Cierre Térmico</p>
            </div>
            <div className="neo-box rounded-2xl p-4 text-center border-2 border-zinc-800 hover:border-orange-500 transition-colors">
              <Sparkles className="w-6 h-6 text-orange-400 mx-auto mb-1 stroke-[2.5]" />
              <p className="font-display text-xl sm:text-2xl font-black text-amber-400">100% EN COP</p>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400">Pesos Colombianos</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECCIÓN: NUESTRA CARTA DIGITAL (#menu) */}
      <section id="menu" className="py-16 sm:py-24 border-b-2 border-zinc-800 bg-[#0c0c10]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <span className="neo-sticker bg-orange-500/15 text-orange-400 border-orange-500/50 shadow-none mb-2">
                ESPECIALIDADES STREET FOOD
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mt-1">
                Nuestra Carta en Vivo
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                Platillos preparados al momento. Disponibilidad sincronizada al instante con la cocina.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="neo-sticker bg-emerald-950/80 text-emerald-300 border-emerald-600 shadow-[2px_2px_0px_0px_#10b981]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping mr-1" />
                <span>Precios en Pesos Colombianos ($ COP)</span>
              </span>
            </div>
          </div>

          {/* Grid de Platillos Neo-Brutalist */}
          {productos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {productos.map((prod) => (
                <div
                  key={prod.id}
                  className={`group rounded-2xl border-2 p-5 sm:p-6 transition-all flex flex-col justify-between ${
                    prod.disponible
                      ? 'border-zinc-700 bg-zinc-900/90 shadow-[5px_5px_0px_0px_#f97316] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_0px_#facc15]'
                      : 'border-zinc-800 bg-zinc-950/60 opacity-60 shadow-[3px_3px_0px_0px_#27272a]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-display text-[11px] font-black uppercase tracking-wider text-orange-400 border border-orange-500/30 bg-orange-950/40 px-2 py-0.5 rounded-lg">
                        {prod.categoria?.nombre || 'Platillo'}
                      </span>
                      <span
                        className={`neo-sticker text-[9px] ${
                          prod.disponible
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700 shadow-none'
                            : 'bg-rose-950 text-rose-300 border-rose-700 shadow-none'
                        }`}
                      >
                        {prod.disponible ? '✓ DISPONIBLE' : '✕ AGOTADO'}
                      </span>
                    </div>

                    <h3 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-white group-hover:text-orange-400 transition-colors">
                      {prod.nombre}
                    </h3>
                  </div>

                  <div className="mt-6 pt-4 border-t-2 border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Precio Carta</span>
                      <p className="font-display text-2xl font-black text-amber-400">
                        {formatearCOP(prod.precio)}
                      </p>
                    </div>

                    <Link
                      href="/cliente"
                      className="neo-btn rounded-xl bg-orange-500 hover:bg-orange-400 text-black px-3.5 py-2 text-xs font-black uppercase tracking-wider border-2 border-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#fff]"
                    >
                      <span>Pedir</span>
                      <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="neo-box rounded-2xl border-2 border-zinc-800 p-12 text-center text-zinc-400">
              <UtensilsCrossed className="w-10 h-10 text-orange-500 mx-auto mb-2" />
              <p className="font-display text-lg font-black uppercase text-white">Catálogo en preparación</p>
              <p className="text-xs text-zinc-500 mt-1">
                Los platillos registrados desde el panel administrativo aparecerán aquí automáticamente.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 4. SECCIÓN: SISTEMAS DEL RESTAURANTE (#modulos) */}
      <section id="modulos" className="py-16 sm:py-24 border-b-2 border-zinc-800 bg-[#08080a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="neo-sticker bg-blue-500/15 text-blue-400 border-blue-500/50 shadow-none mb-2">
              ESTACIONES DE TRABAJO
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mt-1">
              Herramientas Diseñadas para tu Personal
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-400">
              Cada área del restaurante cuenta con una interfaz especializada y optimizada para pantallas táctiles y móviles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Módulo 1: Meseros */}
            <div className="neo-box rounded-2xl border-2 border-zinc-700 p-6 flex flex-col justify-between hover:border-blue-500 shadow-[5px_5px_0px_0px_#3b82f6] transition-all group">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 border-2 border-blue-500/40 text-blue-400 mb-4 group-hover:scale-105 transition-transform">
                  <Smartphone className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="font-display text-lg font-black uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors">
                  Estación de Mesero
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Toma de comandas en mesas de terraza, pedidos externos (llevar y domicilio), selección de adiciones y cobro en efectivo, transferencia o dividido 50/50.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t-2 border-zinc-800">
                <Link
                  href="/login?rol=mesero"
                  className="font-display text-xs font-black uppercase tracking-wider text-blue-400 hover:text-blue-300 flex items-center justify-between"
                >
                  <span>Ingresar como Mesero</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Módulo 2: Cocina */}
            <div className="neo-box rounded-2xl border-2 border-zinc-700 p-6 flex flex-col justify-between hover:border-amber-500 shadow-[5px_5px_0px_0px_#f59e0b] transition-all group">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-400 mb-4 group-hover:scale-105 transition-transform">
                  <ChefHat className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="font-display text-lg font-black uppercase tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  Monitor KDS de Cocina
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Recepción de pedidos con avisos sonoros y destellos visuales. Cambio de estados (Pendiente, Preparando, Listo) y marcado de platillos agotados en un toque.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t-2 border-zinc-800">
                <Link
                  href="/login?rol=cocina"
                  className="font-display text-xs font-black uppercase tracking-wider text-amber-400 hover:text-amber-300 flex items-center justify-between"
                >
                  <span>Ingresar a Cocina</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Módulo 3: Administración */}
            <div className="neo-box rounded-2xl border-2 border-zinc-700 p-6 flex flex-col justify-between hover:border-orange-500 shadow-[5px_5px_0px_0px_#f97316] transition-all group">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/15 border-2 border-orange-500/40 text-orange-400 mb-4 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="font-display text-lg font-black uppercase tracking-tight text-white group-hover:text-orange-400 transition-colors">
                  Panel Administrativo
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Control financiero en tiempo real, inventario de bebidas en COP con Kardex, arqueo ciego diario y Reportes Z térmicos, catálogo de menú y nómina.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t-2 border-zinc-800">
                <Link
                  href="/login?rol=admin"
                  className="font-display text-xs font-black uppercase tracking-wider text-orange-400 hover:text-orange-300 flex items-center justify-between"
                >
                  <span>Acceso Administrador</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Módulo 4: Portal Clientes */}
            <div className="neo-box rounded-2xl border-2 border-zinc-700 p-6 flex flex-col justify-between hover:border-emerald-500 shadow-[5px_5px_0px_0px_#10b981] transition-all group relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="neo-sticker text-[8px] bg-emerald-500 text-black border-black">
                  EN VIVO
                </span>
              </div>
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                  <QrCode className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="font-display text-lg font-black uppercase tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  Carta QR Clientes
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Experiencia para comensales en mesa o desde QR: explora la carta con disponibilidad en vivo, arma tu carrito con notas especiales y envía directo a la cocina.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t-2 border-zinc-800">
                <Link
                  href="/cliente"
                  className="font-display text-xs font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300 flex items-center justify-between"
                >
                  <span>Pedir en Mesa Ahora</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECCIÓN: EXPERIENCIA Y BENEFICIOS (#experiencia) */}
      <section id="experiencia" className="py-16 sm:py-24 border-b-2 border-zinc-800 bg-[#0c0c10]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="neo-sticker bg-emerald-500/15 text-emerald-400 border-emerald-500/50 shadow-none mb-2">
                EFICIENCIA EN HORAS PICO
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-[1.05] mt-1">
                Diseñado para la Realidad y Presión de la Cocina
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed font-medium">
                Sin configuraciones complejas ni retrasos de red. SazonareFood opera con persistencia local y sincronización inmediata en la nube.
              </p>

              <div className="mt-8 space-y-4">
                <div className="neo-box p-4 rounded-xl flex items-start gap-3.5 border-2 border-zinc-800">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-black font-black text-sm border border-black shadow-[2px_2px_0px_0px_#fff]">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-black uppercase text-white">Sin Descuadres en Caja</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      El sistema distingue con exactitud el fondo de cambio (base) de las ventas netas en efectivo y transferencias.
                    </p>
                  </div>
                </div>

                <div className="neo-box p-4 rounded-xl flex items-start gap-3.5 border-2 border-zinc-800">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-black font-black text-sm border border-black shadow-[2px_2px_0px_0px_#fff]">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-black uppercase text-white">Auditoría Individual por Mesero</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Cada comanda y ticket térmico registra automáticamente qué mesero atendió la mesa.
                    </p>
                  </div>
                </div>

                <div className="neo-box p-4 rounded-xl flex items-start gap-3.5 border-2 border-zinc-800">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-black font-black text-sm border border-black shadow-[2px_2px_0px_0px_#fff]">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-black uppercase text-white">Instalable como PWA en Teléfonos</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Funciona a pantalla completa en Android, iPhone y tablets sin barras de navegador ni gestos accidentales.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta Visual de Resumen Operativo */}
            <div className="neo-box rounded-2xl border-2 border-zinc-700 bg-zinc-950 p-6 sm:p-8 shadow-[8px_8px_0px_0px_#f97316] relative">
              <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <Flame className="w-6 h-6 text-orange-500" />
                  <div>
                    <p className="font-display text-base font-black uppercase text-white">Flujo de Pedido Típico</p>
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Terraza • Mesa 3</p>
                  </div>
                </div>
                <span className="neo-sticker bg-emerald-500 text-black border-black text-[9px]">
                  EN TIEMPO REAL
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="rounded-xl border-2 border-zinc-800 bg-[#08080a] p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-sm font-black text-orange-400 border border-orange-500/50 px-2 py-0.5 rounded">01</span>
                    <div>
                      <p className="font-display font-black uppercase text-white">Mesero envía comanda</p>
                      <p className="text-[11px] text-zinc-400">2x Hamburguesa {`{Sin cebolla}`}</p>
                    </div>
                  </div>
                  <span className="text-orange-400 font-black text-[11px] uppercase">Instantáneo</span>
                </div>

                <div className="rounded-xl border-2 border-zinc-800 bg-[#08080a] p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-sm font-black text-amber-400 border border-amber-500/50 px-2 py-0.5 rounded">02</span>
                    <div>
                      <p className="font-display font-black uppercase text-white">Campanazo KDS Cocina</p>
                      <p className="text-[11px] text-zinc-400">Audio alert y pasa a Preparando</p>
                    </div>
                  </div>
                  <span className="text-amber-400 font-black text-[11px] uppercase">Alerta KDS</span>
                </div>

                <div className="rounded-xl border-2 border-zinc-800 bg-[#08080a] p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-sm font-black text-emerald-400 border border-emerald-500/50 px-2 py-0.5 rounded">03</span>
                    <div>
                      <p className="font-display font-black uppercase text-white">Cobro Dividido en Mesa</p>
                      <p className="text-[11px] text-zinc-400">50% Efectivo COP + 50% Nequi</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-black text-[11px] uppercase">Cuadrado</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t-2 border-zinc-800 text-center">
                <Link
                  href="/login"
                  className="neo-btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs uppercase"
                >
                  <span>Probar Sistema Ahora</span>
                  <ArrowUpRight className="w-4 h-4 stroke-[3]" />
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
