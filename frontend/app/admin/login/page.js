'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth.js';
import { Wrench, Lock, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../../lib/api.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [taller, setTaller] = useState({});

  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchTaller = async () => {
      try {
        const data = await api.getConfiguracion();
        if (data) setTaller(data);
      } catch (err) {
        console.error('Error al cargar config del taller:', err);
      }
    };
    fetchTaller();
  }, []);

  useEffect(() => {
    if (taller && taller.nombre_taller) {
      document.title = `${taller.nombre_taller} - Acceso Taller`;
    }
  }, [taller]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Forzar recarga o redireccionar al dashboard
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Error al intentar iniciar sesión.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background ambient blur */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#2908F1]/10 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Brand Brand Logo */}
        <Link href="/" className="inline-flex items-center gap-2 group mb-6">
          <div className="p-2 bg-[#2908F1]/10 rounded-lg text-[#2908F1] border border-[#2908F1]/20 group-hover:bg-[#2908F1]/20 transition-all duration-300">
            <Wrench className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            {taller.nombre_taller ? (
              <>
                {taller.nombre_taller.includes(' ') ? (
                  <>
                    {taller.nombre_taller.substring(0, taller.nombre_taller.indexOf(' '))}
                    <span className="text-[#2908F1]">{taller.nombre_taller.substring(taller.nombre_taller.indexOf(' '))}</span>
                  </>
                ) : (
                  <>
                    {taller.nombre_taller}
                  </>
                )}
              </>
            ) : (
              <>
                Mecánica<span className="text-[#2908F1]">Pro</span>
              </>
            )}
          </span>
        </Link>
        <h2 className="text-xl font-bold text-gray-300">
          Panel de Control Administrativo
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="glass-panel py-8 px-6 sm:px-10 rounded-3xl border border-gray-800 shadow-2xl shadow-black/60">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mecanicapro.com"
                  className="block w-full pl-10 pr-4 py-3 rounded-xl bg-gray-900/60 border border-gray-800 text-white placeholder-gray-650 focus:border-[#2908F1] focus:ring-1 focus:ring-[#2908F1] text-xs outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-3 rounded-xl bg-gray-900/60 border border-gray-800 text-white placeholder-gray-650 focus:border-[#2908F1] focus:ring-1 focus:ring-[#2908F1] text-xs outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#2908F1] hover:bg-blue-800 focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/10 cursor-pointer"
              >
                {loading ? 'INGRESANDO...' : (
                  <>
                    INGRESAR AL PANEL <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Test details note */}
          <div className="mt-8 pt-6 border-t border-gray-800/80 text-center">
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Credenciales de prueba por defecto:<br />
              Usuario: <span className="text-gray-400 font-semibold">admin@mecanicapro.com</span><br />
              Contraseña: <span className="text-gray-400 font-semibold">Admin1234!</span>
            </p>
            <Link 
              href="/"
              className="mt-2 w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-gray-400 border border-gray-800 hover:text-white hover:bg-gray-800 transition-all duration-300"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
