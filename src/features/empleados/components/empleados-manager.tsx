'use client';

import { useState, useTransition } from 'react';
import { Role } from '@prisma/client';
import {
  crearEmpleado,
  actualizarRolEmpleado,
  toggleActivoEmpleado,
  eliminarEmpleado,
} from '../actions/empleados-actions';

interface Empleado {
  id: string;
  nombre: string;
  email: string;
  role: Role;
  activo: boolean;
  createdAt: Date;
}

export function EmpleadosManager({ empleadosIniciales }: { empleadosIniciales: Empleado[] }) {
  const [empleados, setEmpleados] = useState<Empleado[]>(empleadosIniciales);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('MESERO');
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) return;

    startTransition(async () => {
      const res = await crearEmpleado({
        nombre: nombre.trim(),
        email: email.trim(),
        role,
      });

      if (res.success && res.data) {
        setEmpleados((prev) => [res.data as Empleado, ...prev]);
        setNombre('');
        setEmail('');
        setRole('MESERO');
        setMensaje({ tipo: 'exito', texto: '✅ Empleado registrado correctamente.' });
      } else {
        setMensaje({ tipo: 'error', texto: res.error || 'Error al registrar.' });
      }

      setTimeout(() => setMensaje(null), 4000);
    });
  };

  const handleCambiarRol = (id: string, nuevoRol: Role) => {
    startTransition(async () => {
      const res = await actualizarRolEmpleado(id, nuevoRol);
      if (res.success && res.data) {
        setEmpleados((prev) =>
          prev.map((e) => (e.id === id ? { ...e, role: nuevoRol } : e))
        );
      }
    });
  };

  const handleToggleActivo = (id: string) => {
    startTransition(async () => {
      const res = await toggleActivoEmpleado(id);
      if (res.success && res.data) {
        setEmpleados((prev) =>
          prev.map((e) => (e.id === id ? { ...e, activo: !e.activo } : e))
        );
      }
    });
  };

  const handleEliminar = (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este empleado?')) return;

    startTransition(async () => {
      const res = await eliminarEmpleado(id);
      if (res.success) {
        setEmpleados((prev) => prev.filter((e) => e.id !== id));
      }
    });
  };

  const ROL_BADGES: Record<Role, { label: string; style: string }> = {
    ADMIN: { label: '👑 Administrador', style: 'bg-purple-950 text-purple-300 border-purple-800' },
    MESERO: { label: '🍽️ Mesero', style: 'bg-blue-950 text-blue-300 border-blue-800' },
    COCINA: { label: '👨‍🍳 Cocina', style: 'bg-amber-950 text-amber-300 border-amber-800' },
  };

  return (
    <div className="space-y-8">
      {/* Formulario de registro */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white">➕ Registrar Nuevo Empleado</h2>
          <p className="text-sm text-zinc-400">
            Registra el correo con el que tu empleado iniciará sesión en el sistema.
          </p>
        </div>

        {mensaje && (
          <div
            className={`mb-4 rounded-xl p-3 text-sm font-medium ${
              mensaje.tipo === 'exito'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950/60 text-rose-300 border border-rose-800'
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleCrear} className="grid gap-4 sm:grid-cols-4">
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Carlos Ramírez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              placeholder="empleado@sazonare.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Rol Asignado
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="MESERO">🍽️ Mesero</option>
              <option value="COCINA">👨‍🍳 Cocina</option>
              <option value="ADMIN">👑 Administrador</option>
            </select>
          </div>

          <div className="sm:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-orange-600 disabled:opacity-50 active:scale-95"
            >
              {isPending ? 'Guardando...' : 'Registrar Empleado'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de empleados */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-sm">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h2 className="font-bold text-white">👥 Lista de Empleados</h2>
          <p className="text-xs text-zinc-500">{empleados.length} usuarios registrados en el sistema</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-6 py-3 text-left">Empleado</th>
                <th className="px-6 py-3 text-left">Correo</th>
                <th className="px-6 py-3 text-left">Rol</th>
                <th className="px-6 py-3 text-center">Estado</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {empleados.map((emp) => (
                <tr key={emp.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-white">{emp.nombre}</td>
                  <td className="px-6 py-4 text-zinc-400">{emp.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={emp.role}
                      disabled={isPending}
                      onChange={(e) => handleCambiarRol(emp.id, e.target.value as Role)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition-all bg-zinc-900 ${
                        ROL_BADGES[emp.role].style
                      }`}
                    >
                      <option value="MESERO">🍽️ Mesero</option>
                      <option value="COCINA">👨‍🍳 Cocina</option>
                      <option value="ADMIN">👑 Administrador</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleActivo(emp.id)}
                      disabled={isPending}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-all border ${
                        emp.activo
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                          : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:bg-zinc-800'
                      }`}
                    >
                      {emp.activo ? '● Activo' : '○ Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEliminar(emp.id)}
                      disabled={isPending}
                      className="text-xs font-semibold text-zinc-500 hover:text-rose-400 transition-colors"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {empleados.length === 0 && (
            <div className="py-12 text-center text-zinc-500">
              <p className="text-4xl mb-2">👤</p>
              <p>Aún no hay empleados registrados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
