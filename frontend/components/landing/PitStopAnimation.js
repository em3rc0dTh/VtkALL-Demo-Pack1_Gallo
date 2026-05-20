'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Settings, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

export default function PitStopAnimation() {
  // Estados de animación: 'entrada' | 'diagnostico' | 'reparacion' | 'listo' | 'disparado' | 'reset'
  const [fase, setFase] = useState('entrada');
  const [progreso, setProgreso] = useState(0);

  useEffect(() => {
    const correrCiclo = async () => {
      // 1. Entrada del vehículo
      setFase('entrada');
      setProgreso(0);
      await delay(1800);

      // 2. Diagnóstico del daño
      setFase('diagnostico');
      await delay(1800);

      // 3. Reparación en Pits
      setFase('reparacion');
      // Llenar barra de progreso
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 5;
        if (currentProgress >= 100) {
          setProgreso(100);
          clearInterval(interval);
        } else {
          setProgreso(currentProgress);
        }
      }, 80);
      await delay(2000);
      clearInterval(interval);

      // 4. Coche Listo (Revving engine)
      setFase('listo');
      await delay(1500);

      // 5. Salida disparado
      setFase('disparado');
      await delay(1200);

      // 6. Reset e inicio del loop
      setFase('reset');
      await delay(500);
      correrCiclo();
    };

    correrCiclo();
    
    return () => {};
  }, []);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  return (
    <div className="relative w-full h-[280px] sm:h-[320px] rounded-3xl bg-[#F9FAFF] border border-[#2908F1]/10 overflow-hidden flex flex-col justify-between p-5 select-none shadow-lg shadow-gray-200/20">
      
      {/* Luces de Pits de F1 en el techo de la caja */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 rounded-xl border border-gray-150">
        <span className="text-[10px] font-bold text-[#54595F] uppercase tracking-widest">Semáforo de Pits</span>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => {
            let color = 'bg-gray-200';
            if (fase === 'entrada' || fase === 'diagnostico') color = 'bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.7)] animate-pulse';
            if (fase === 'reparacion') color = i <= 3 ? 'bg-[#2908F1] shadow-[0_0_10px_rgba(41,8,241,0.7)]' : 'bg-gray-200';
            if (fase === 'listo') color = 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]';
            if (fase === 'disparado') color = 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)] animate-ping';
            return (
              <div 
                key={i} 
                className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${color}`}
              />
            );
          })}
        </div>
      </div>

      {/* Caja del Escenario de Pista */}
      <div className="relative flex-1 w-full flex items-center justify-center">
        
        {/* Línea divisoria de pits (Pista de carreras) */}
        <div className="absolute bottom-6 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-gray-200 to-transparent flex justify-around">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="w-4 h-[3px] bg-[#FFC800]/60 transform -skew-x-12" />
          ))}
        </div>

        {/* Humo de Quemadura de llanta o Falla de motor */}
        <AnimatePresence>
          {(fase === 'diagnostico' || fase === 'reparacion') && (
            <>
              {/* Humo de motor dañado */}
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: [0, 0.6, 0], y: [-20, -60], x: [-10, 10, -5], scale: [1, 1.8] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute bottom-16 left-[40%] w-6 h-6 rounded-full bg-gray-400/40 blur-md z-10"
              />
              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.6 }}
                animate={{ opacity: [0, 0.4, 0], y: [-15, -45], x: [5, -10, 10], scale: [0.8, 1.5] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
                className="absolute bottom-16 left-[45%] w-5 h-5 rounded-full bg-gray-300/30 blur-md z-10"
              />
            </>
          )}
        </AnimatePresence>

        {/* Chispas durante reparación */}
        <AnimatePresence>
          {fase === 'reparacion' && (
            <div className="absolute bottom-12 left-[30%] right-[30%] h-12 pointer-events-none z-20">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    x: [0, (Math.random() - 0.5) * 80], 
                    y: [0, -Math.random() * 40 - 10], 
                    scale: [0.5, 1.2, 0.2] 
                  }}
                  transition={{ 
                    duration: 0.8, 
                    repeat: Infinity, 
                    delay: Math.random() * 0.5 
                  }}
                  className="absolute bottom-0 left-[50%] w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_6px_#0ebde1]"
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Huellas de neumático tras arranque */}
        <AnimatePresence>
          {fase === 'disparado' && (
            <motion.div 
              initial={{ opacity: 0.7, width: 0 }}
              animate={{ opacity: [0.7, 0], width: 140 }}
              transition={{ duration: 1 }}
              className="absolute bottom-[22px] left-[35%] h-[4px] bg-black/90 rounded-full flex gap-4"
              style={{ transform: 'skewX(-15deg)' }}
            >
              <div className="w-full h-full border-t border-b border-dashed border-gray-900" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* VEHÍCULO (Deportivo con Luces Neon) */}
        <motion.div
          animate={
            fase === 'entrada' ? { x: ['120%', '0%'], rotate: [3, 0] } :
            fase === 'diagnostico' ? { y: [0, -2], rotate: [0.5, -0.5] } :
            fase === 'reparacion' ? { y: [0, 2], rotate: [-0.4, 0.4] } :
            fase === 'listo' ? { y: [0, -3], x: [0, 1], rotate: [0.6, -0.6] } :
            fase === 'disparado' ? { x: [0, -10, '150%'], scaleX: [1, 0.95, 1.05] } :
            { x: '-150%', rotate: 0, y: 0 }
          }
          transition={
            fase === 'entrada' ? {
              x: { type: 'spring', damping: 14, stiffness: 80 },
              rotate: { ease: 'easeOut', duration: 1.2 }
            } :
            fase === 'diagnostico' ? { 
              y: { ease: 'easeInOut', duration: 0.4, repeat: Infinity, repeatType: 'reverse' },
              rotate: { ease: 'easeInOut', duration: 0.5, repeat: Infinity, repeatType: 'reverse' }
            } :
            fase === 'reparacion' ? { 
              y: { ease: 'linear', duration: 0.08, repeat: Infinity, repeatType: 'reverse' },
              rotate: { ease: 'linear', duration: 0.06, repeat: Infinity, repeatType: 'reverse' }
            } :
            fase === 'listo' ? { 
              y: { ease: 'linear', duration: 0.05, repeat: Infinity, repeatType: 'reverse' },
              x: { ease: 'linear', duration: 0.04, repeat: Infinity, repeatType: 'reverse' },
              rotate: { ease: 'linear', duration: 0.05, repeat: Infinity, repeatType: 'reverse' }
            } :
            fase === 'disparado' ? { 
              x: { type: 'tween', ease: 'easeIn', duration: 0.8 },
              scaleX: { type: 'tween', ease: 'easeIn', duration: 0.4 }
            } :
            { duration: 0.1 }
          }
          className="relative w-[180px] h-[55px] z-10"
        >
          {/* Llamarada de escape en fase listo / disparado */}
          <AnimatePresence>
            {(fase === 'listo' || fase === 'disparado') && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5, x: 10 }}
                animate={{ 
                  opacity: [1, 0.8, 1], 
                  scale: [1, 1.5, 0.8], 
                  x: [18, 30, 18],
                  skewY: [0, 5, -5, 0] 
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, repeat: Infinity }}
                className="absolute right-[-24px] bottom-[10px] w-8 h-4 bg-gradient-to-l from-red-600 via-orange-500 to-yellow-400 rounded-full blur-[2px] z-0 origin-left"
              />
            )}
          </AnimatePresence>

          {/* Silueta de Coche Deportivo de Alta Gama */}
          <svg viewBox="0 0 180 55" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            {/* Chasis principal */}
            <path 
              d="M10 42C10 42 15 36 28 32C41 28 50 18 70 14C90 10 120 12 135 20C150 28 175 35 178 39C181 43 175 46 170 47C165 48 15 48 10 47C5 46 5 43 10 42Z" 
              fill={fase === 'diagnostico' ? '#54595F' : fase === 'reparacion' ? '#7A7A7A' : '#2908F1'} 
              className="transition-colors duration-500"
            />
            {/* Cabina / Parabrisas */}
            <path d="M68 18C75 14 110 14 125 21C128 22.5 125 26 120 27C110 29 80 29 70 27C65 26 64 20 68 18Z" fill="#0F172A" opacity="0.95" />
            
            {/* Faros delanteros (Izquierda) */}
            <path 
              d="M8 43L14 44L12 46L6 44L8 43Z" 
              fill={fase === 'diagnostico' ? '#ef4444' : '#6EC1E4'} 
              className="transition-colors duration-300"
              style={fase === 'listo' || fase === 'disparado' ? { filter: 'drop-shadow(0 0 8px #6EC1E4)' } : {}}
            />
            
            {/* Luz de Freno Trasera (Derecha) */}
            <path 
              d="M174 38L179 40L178 43L173 41L174 38Z" 
              fill={fase === 'diagnostico' ? '#f87171' : '#ef4444'} 
              style={fase === 'diagnostico' || fase === 'entrada' ? { filter: 'drop-shadow(0 0 8px #ef4444)' } : {}}
            />
 
            {/* Neon inferior (Underglow) */}
            <path 
              d="M35 48H145" 
              stroke={fase === 'diagnostico' ? '#ef4444' : fase === 'listo' || fase === 'disparado' ? '#FFC800' : '#6EC1E4'} 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              opacity="0.85"
              className="transition-colors duration-500"
              style={{ filter: `drop-shadow(0 0 6px ${fase === 'diagnostico' ? '#ef4444' : fase === 'listo' || fase === 'disparado' ? '#FFC800' : '#6EC1E4'})` }}
            />
          </svg>

          {/* Rueda Delantera */}
          <motion.div 
            animate={
              fase === 'entrada' ? { rotate: -360 } :
              fase === 'diagnostico' ? { rotate: 0 } :
              fase === 'reparacion' ? { rotate: [-10, 10, -10] } :
              fase === 'listo' ? { rotate: -720 } :
              fase === 'disparado' ? { rotate: -1440 } :
              { rotate: 0 }
            }
            transition={{ duration: fase === 'listo' ? 0.4 : fase === 'disparado' ? 0.8 : 1.5, repeat: fase === 'reparacion' || fase === 'listo' ? Infinity : 0, ease: 'linear' }}
            className="absolute left-[30px] bottom-[-2px] w-[30px] h-[30px] rounded-full bg-[#1e293b] border-4 border-gray-200 flex items-center justify-center shadow-[0_0_8px_rgba(0,0,0,0.2)]"
          >
            {/* Rines */}
            <div className="w-full h-[2px] bg-gray-400 transform rotate-0" />
            <div className="w-full h-[2px] bg-gray-400 absolute transform rotate-45" />
            <div className="w-full h-[2px] bg-gray-400 absolute transform rotate-90" />
            <div className="w-full h-[2px] bg-gray-400 absolute transform rotate-135" />
            <div className="w-3.5 h-3.5 rounded-full bg-gray-800 absolute border-2 border-[#2908F1]" />
          </motion.div>

          {/* Rueda Trasera */}
          <motion.div 
            animate={
              fase === 'entrada' ? { rotate: -360 } :
              fase === 'diagnostico' ? { rotate: 0 } :
              fase === 'reparacion' ? { rotate: [10, -10, 10] } :
              fase === 'listo' ? { rotate: -720 } :
              fase === 'disparado' ? { rotate: -1440 } :
              { rotate: 0 }
            }
            transition={{ duration: fase === 'listo' ? 0.4 : fase === 'disparado' ? 0.8 : 1.5, repeat: fase === 'reparacion' || fase === 'listo' ? Infinity : 0, ease: 'linear' }}
            className="absolute right-[32px] bottom-[-2px] w-[30px] h-[30px] rounded-full bg-[#1e293b] border-4 border-gray-200 flex items-center justify-center shadow-[0_0_8px_rgba(0,0,0,0.2)]"
          >
            {/* Rines */}
            <div className="w-full h-[2px] bg-gray-400 transform rotate-0" />
            <div className="w-full h-[2px] bg-gray-400 absolute transform rotate-45" />
            <div className="w-full h-[2px] bg-gray-400 absolute transform rotate-90" />
            <div className="w-full h-[2px] bg-gray-400 absolute transform rotate-135" />
            <div className="w-3.5 h-3.5 rounded-full bg-gray-800 absolute border-2 border-[#2908F1]" />
          </motion.div>
        </motion.div>

        {/* Animación de herramientas flotando en fase reparación */}
        <AnimatePresence>
          {fase === 'reparacion' && (
            <>
              {/* Llave Mecánica */}
              <motion.div 
                initial={{ opacity: 0, scale: 0, y: 10, x: -30 }}
                animate={{ opacity: 1, scale: 1, y: -20, rotate: 360 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                className="absolute left-[38%] bottom-16 text-[#2908F1] z-20"
              >
                <Wrench className="w-7 h-7 filter drop-shadow-[0_0_6px_rgba(41,8,241,0.5)]" />
              </motion.div>
              {/* Engranaje */}
              <motion.div 
                initial={{ opacity: 0, scale: 0, y: 5, x: 30 }}
                animate={{ opacity: 1, scale: 1, y: -30, rotate: -360 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse', delay: 0.1 }}
                className="absolute left-[50%] bottom-16 text-[#6EC1E4] z-20"
              >
                <Settings className="w-6 h-6 filter drop-shadow-[0_0_6px_rgba(110,193,228,0.5)]" />
              </motion.div>
              {/* Icono de Rayo */}
              <motion.div 
                initial={{ opacity: 0, scale: 0, y: 20, x: 0 }}
                animate={{ opacity: 1, scale: [0.8, 1.2, 0.8], y: -15 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.4, repeat: Infinity }}
                className="absolute left-[45%] bottom-20 text-[#FFC800] z-20"
              >
                <Zap className="w-7 h-7 filter drop-shadow-[0_0_8px_rgba(255,200,0,0.5)]" />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Panel digital inferior */}
      <div className="mt-3 p-3 bg-gray-50 rounded-2xl border border-gray-150 flex justify-between items-center h-14">
        <div className="flex items-center gap-2">
          {fase === 'entrada' && <Settings className="w-4 h-4 text-[#2908F1] animate-spin" />}
          {fase === 'diagnostico' && <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce" />}
          {fase === 'reparacion' && <Wrench className="w-4 h-4 text-[#2908F1] animate-pulse" />}
          {fase === 'listo' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
          {fase === 'disparado' && <Zap className="w-4 h-4 text-emerald-500 animate-ping" />}
          
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-[#54595F] uppercase tracking-widest leading-none">Estado de Pits</span>
            <span className={`text-xs font-mono font-bold leading-tight ${
              fase === 'diagnostico' ? 'text-red-500' :
              fase === 'reparacion' ? 'text-[#2908F1]' :
              fase === 'listo' || fase === 'disparado' ? 'text-emerald-500' :
              'text-[#2908F1]'
            }`}>
              {fase === 'entrada' && 'ENTRANDO A BOX...'}
              {fase === 'diagnostico' && 'DIAGNÓSTICO: FALLA DE MOTOR'}
              {fase === 'reparacion' && `REPARACIÓN EXPRESS F1... ${progreso}%`}
              {fase === 'listo' && '¡MOTOR AL 100%! EXCELENTE'}
              {fase === 'disparado' && 'LAUNCH CONTROL ACTIVADO'}
              {fase === 'reset' && 'PREPARANDO SIGUIENTE BOX...'}
            </span>
          </div>
        </div>

        {/* Barra de progreso de pits */}
        <div className="w-24 sm:w-32 bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
          <div 
            className={`h-full transition-all duration-300 ${
              fase === 'reparacion' ? 'bg-[#2908F1]' : 
              fase === 'listo' || fase === 'disparado' ? 'bg-emerald-500' : 
              'bg-gray-200'
            }`} 
            style={{ width: `${fase === 'listo' || fase === 'disparado' ? 100 : progreso}%` }}
          />
        </div>
      </div>
    </div>
  );
}
