# Guía de Arquitectura del Proyecto — SazonareFood

> **REGLA OBLIGATORIA PARA EL AGENTE DE IA Y DESARROLLADORES:**
> Antes de implementar cualquier funcionalidad, cambio, corrección o refactorización, **DEBES LEER ESTE DOCUMENTO** para mantener el foco arquitectónico, respetar la modularización y nunca crear código monolítico ni mezclar responsabilidades.

---

## 1. Filosofía de Arquitectura: Feature-First & Modular

El proyecto organiza el código del dominio de negocio por **Features** (`src/features/<modulo>`). Cada feature debe ser un módulo autónomo, desacoplado y estrictamente tipado.

### Estructura Estándar de un Feature:
```text
src/features/<modulo>/
├── types/
│   └── <modulo>.ts            # Tipos e interfaces de dominio, DTOs, Payloads y Enums
├── actions/
│   └── <modulo>-actions.ts    # Server Actions ('use server') de mutaciones y consultas Prisma
├── components/
│   ├── <modulo>-manager.tsx   # Orquestador ligero (gestiona estado local, transiciones y polling)
│   ├── <modulo>-metricas.tsx  # Tarjetas y KPIs financieros o de resumen
│   ├── <modulo>-tabla.tsx     # Tabla de datos con renderizado atómico y badges
│   ├── <accion>-modal.tsx     # Modales individuales desacoplados (usando @/components/ui/modal)
│   └── ...                    # Subcomponentes atómicos específicos
├── hooks/
│   └── use-<modulo>.ts        # Custom hooks para estado reactivo o listeners
└── utils/
    └── <modulo>-helpers.ts    # Funciones de apoyo puras del feature
```

---

## 2. Reglas Estrictas de Modularización y Componentes

1. **Cero Monolitos:**
   - Ningún componente debe exceder las ~250 líneas de código. Si crece más allá, se debe descomponer en subcomponentes atómicos.
2. **Modales Desacoplados:**
   - **Cada modal debe residir en su propio archivo** (`[nombre]-modal.tsx`) dentro de `components/`.
   - Todos los modales deben utilizar el componente base reutilizable `@/components/ui/modal.tsx` (`<Modal isOpen={...} onClose={...} title="..." icon="...">`).
   - El componente padre (Manager) solo pasa props de apertura/cierre, datos iniciales y callbacks tipados.
3. **Tipos Separados:**
   - Ningún tipo TypeScript complejo debe definirse inline en componentes ni en Server Actions.
   - Todos los DTOs, filtros, estados y payloads deben exportarse desde `src/features/<modulo>/types/<modulo>.ts`.
4. **Separación de Responsabilidades:**
   - **Páginas (`src/app/`):** Solo se encargan de autenticación, validación de permisos de rol y carga de datos iniciales en el servidor.
   - **Server Actions (`actions/`):** Contienen lógica de base de datos con Prisma, transacciones y revalidaciones de Next.js (`revalidatePath`).
   - **Client Components (`components/`):** Solo manejan la interactividad de la interfaz de usuario.

---

## 3. Manejo de Moneda y Localización (Colombia - COP)

- La aplicación opera **100% en Pesos Colombianos (COP)** sin centavos.
- Está prohibido formatear dinero de manera manual (`$ + valor`).
- Se debe importar y utilizar siempre las utilidades de `@/lib/currency`:
  - `formatearCOP(valor)`: Devuelve `$ 18.000 COP` o formato amigable.
  - `formatearCOPCompleto(valor)`: Formato financiero completo en pesos.

---

## 4. Despliegue en AWS y Sincronización en Tiempo Real

1. **Desacoplamiento de Supabase Realtime:**
   - Dado que el despliegue en AWS puede usar una base de datos PostgreSQL independiente (RDS u otra), la lectura en tiempo real de comandas, inventario y platos agotados se realiza mediante **polling reactivo ultra-rápido (cada 2 a 3 segundos)** con Server Actions cacheados de forma limpia (`force-dynamic`).
2. **Detección Dinámica de URLs y Puertos:**
   - En OAuth y redirecciones, nunca quemar `localhost:3000`. Leer siempre los headers `x-forwarded-host` y `x-forwarded-proto` para adaptarse dinámicamente tanto al entorno local como a AWS.

---

## 5. Control de Calidad y Verificación

Antes de dar por finalizada cualquier tarea o realizar `git push`:
1. Ejecutar verificación de tipos: `npx tsc --noEmit`. El resultado debe ser **0 errores**.
2. Verificar que no se hayan introducido estilos o layouts inconsistentes con el tema oscuro de la aplicación (`zinc-950`, `zinc-900`, `zinc-800`, acentos `orange`, `emerald`, `cyan`).
3. Registrar los commits siguiendo Conventional Commits (`feat:`, `fix:`, `refactor:`, `style:`).

