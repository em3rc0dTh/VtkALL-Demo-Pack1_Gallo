'use client';

import { Award, CheckCircle2, Users, Wrench } from 'lucide-react';

export default function SobreNosotros({ taller = {}, conf = {} }) {
  const caracteristicas = [
    { icono: Wrench,       titulo: 'Técnicos Certificados',    desc: 'Profesionales capacitados en mecánica general y electrónica automotriz de alta gama.' },
    { icono: CheckCircle2, titulo: 'Garantía por Escrito',      desc: 'Todos nuestros trabajos tienen garantía documentada de repuestos y mano de obra.' },
    { icono: Users,        titulo: 'Equipamiento de Fábrica',   desc: 'Escáneres y herramientas de diagnóstico originales homologadas para tu marca.' },
  ];

  return (
    <section id="nosotros" className="py-10 sm:py-16 md:py-20 lg:py-28 bg-[#F4F5FF] relative overflow-hidden">

      {/* Ambient orb */}
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-cyan/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

          {/* Left: Image */}
          <div className="reveal-left relative h-[220px] sm:h-[320px] lg:h-[520px] rounded-3xl overflow-hidden shadow-2xl shadow-primary/10">
            <img
              src="/images/sobre_nosotros.png"
              alt="Equipo del taller"
              className="w-full h-full object-cover"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />

            {/* Floating badge */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="glass-panel-dark rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white leading-tight">
                    {conf.anosExperiencia || taller.anos_experiencia || 12}+ Años
                  </h4>
                  <p className="text-xs text-white/60 font-light">Trayectoria ininterrumpida</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-2xl font-black text-secondary">4.9</p>
                  <p className="text-[10px] text-white/50">★★★★★ rating</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Text */}
          <div className="reveal-right">
            <span className="section-label">{conf.tituloSeccion || 'SOBRE NOSOTROS'}</span>

            <h2
              className="text-2xl sm:text-4xl md:text-5xl font-black text-navy tracking-tight leading-tight mb-4 lg:mb-6"
              style={{ fontFamily: "'Readex Pro', sans-serif" }}
            >
              {conf.tituloPrincipal || 'Compromiso con la'} {' '}
              <span className="text-gradient">{conf.tituloGradiente || 'Calidad de Tu Auto'}</span>
            </h2>

            <p className="text-[#54595F] font-light leading-relaxed mb-5 lg:mb-10 text-xs sm:text-sm">
              {conf.sobreNosotros || taller.sobre_nosotros ||
                'En Gallo Autos contamos con más de una década de trayectoria brindando servicios mecánicos integrales de alta calidad. Disponemos de tecnología de diagnóstico computarizado avanzada, cabinas de pintura al horno y un equipo de profesionales apasionados por el cuidado de tu vehículo.'}
            </p>

            {/* Feature list: 3-col grid on mobile (compact), stacked on lg) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 lg:gap-4 w-full">
              {caracteristicas.map((item, idx) => {
                const Icono = item.icono;
                return (
                  <div
                    key={item.titulo}
                    className={`reveal delay-${idx + 1} flex gap-3 p-3 lg:p-4 rounded-2xl bg-white border border-primary/8 card-lift`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                      <Icono className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-navy mb-0.5">{item.titulo}</h4>
                      <p className="text-xs text-[#54595F] font-light leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
