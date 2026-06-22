'use client';

import { MessageSquare, Calendar, ShieldCheck } from 'lucide-react';

export default function ComoFunciona({ taller = {} }) {
  const nombreAgente = taller.config_agente?.nombre_agente || 'Max';
  const pasos = [
    {
      num: '01',
      titulo: 'Escribe por Chat o WhatsApp',
      desc: 'Envía un mensaje o usa nuestro chat flotante en la web para iniciar la conversación sin esperas.',
      icono: MessageSquare,
      delay: 'delay-1',
    },
    {
      num: '02',
      titulo: `${nombreAgente} Coordina tu Cita`,
      desc: 'Nuestra IA consulta la agenda en tiempo real, te solicita los detalles de tu pedido y reserva tu entrega o recojo.',
      icono: Calendar,
      delay: 'delay-3',
    },
    {
      num: '03',
      titulo: '¡Listo! Box Reservado',
      desc: 'La cita se registra en el sistema al instante. Recibirás una confirmación y te esperamos el día pactado.',
      icono: ShieldCheck,
      delay: 'delay-5',
    },
  ];

  return (
    <section id="como-funciona" className="py-32 bg-white relative overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="orb w-[400px] h-[400px] bg-primary/6 top-[-80px] right-[10%]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-24 reveal">
          <span className="section-label">⚡ Mecánica Inteligente</span>
          <h2
            className="text-4xl md:text-5xl font-black text-navy tracking-tight leading-tight"
            style={{ fontFamily: "'Readex Pro', sans-serif" }}
          >
            ¿Cómo Funciona el Sistema?
          </h2>
          <div className="w-16 h-1.5 bg-secondary mx-auto mt-5 rounded-full" />
          <p className="text-[#54595F] font-light text-sm mt-5 leading-relaxed">
            Agenda tu servicio en menos de 2 minutos. Sin llamadas, sin esperas, disponible las 24 horas.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">

          {/* Connector line */}
          <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none" />

          {pasos.map((paso, idx) => {
            const Icono = paso.icono;
            return (
              <div
                key={paso.num}
                className={`reveal ${paso.delay} card-lift relative z-10 flex flex-col items-center text-center group`}
              >
                {/* Icon circle */}
                <div className="relative mb-8">
                  <div className="w-20 h-20 rounded-3xl bg-white border border-primary/10 shadow-lg flex items-center justify-center group-hover:border-primary/40 group-hover:shadow-card-glow transition-all duration-400">
                    <Icono className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shadow-md">
                    {paso.num}
                  </span>
                </div>

                <h3
                  className="text-lg font-bold text-navy mb-3 group-hover:text-primary transition-colors duration-300"
                  style={{ fontFamily: "'Readex Pro', sans-serif" }}
                >
                  {paso.titulo}
                </h3>
                <p className="text-sm text-[#54595F] font-light leading-relaxed max-w-xs">
                  {paso.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
