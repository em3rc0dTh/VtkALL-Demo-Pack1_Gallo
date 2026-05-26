'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, Camera, Phone, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api.js';

export default function BookingFlow({ 
  taller = {}, 
  onClose, 
  isEmbedded = false,
  initialNombre = '',
  initialDni = '',
  initialTelefono = '',
  initialServicio = '',
  onSuccess
}) {
  // Steps: 1 = Modality, 2 = Date/Time, 3 = Form, 4 = Success
  const [step, setStep] = useState(1);
  
  // Modality: 'PRESENCIAL', 'VIRTUAL_FOTOS', 'LLAMADA_CIEGAS'
  const [modality, setModality] = useState(null);

  // Calendar States
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsDisponibles, setSlotsDisponibles] = useState([]);
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);

  // Form States
  const [formNombre, setFormNombre] = useState(initialNombre);
  const [formDni, setFormDni] = useState(initialDni);
  const [formTelefono, setFormTelefono] = useState(initialTelefono);
  const [formServicio, setFormServicio] = useState(initialServicio);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Load services
  useEffect(() => {
    const cargarServicios = async () => {
      try {
        if (api && api.getServicios) {
          const data = await api.getServicios();
          if (Array.isArray(data)) setServiciosDisponibles(data);
        }
      } catch (err) {
        console.error('Error al cargar servicios:', err);
      }
    };
    cargarServicios();
  }, []);

  // Calendar Helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const generateCalendarDays = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const startOffset = (firstDayIndex + 6) % 7;
    
    const days = [];
    for (let i = 0; i < startOffset; i++) {
      days.push({ day: null, dateStr: '' });
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
      days.push({ day: d, dateStr });
    }
    return days;
  };

  const handleSelectDay = async (dateStr) => {
    setSelectedDateStr(dateStr);
    setSelectedTimeSlot('');
    setLoadingSlots(true);
    try {
      if (api && api.getDisponibilidadPublica) {
        const res = await api.getDisponibilidadPublica(dateStr);
        if (res && res.ok) {
          setSlotsDisponibles(res.horarios_disponibles || []);
        } else {
          setSlotsDisponibles([]);
        }
      } else {
        // Mock data if API is not available
        setTimeout(() => {
          setSlotsDisponibles(['09:00', '10:30', '14:00', '16:00']);
          setLoadingSlots(false);
        }, 500);
        return;
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      setSlotsDisponibles([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDateStr || !selectedTimeSlot || !modality) {
      setBookingError('Faltan datos para la reserva.');
      return;
    }
    
    setBookingLoading(true);
    setBookingError('');
    
    try {
      const fechaHoraCita = `${selectedDateStr}T${selectedTimeSlot}:00`;
      const payload = {
        numero_telefono: formTelefono,
        nombre_cliente: formNombre,
        dni: formDni,
        servicio: formServicio || 'Evaluacion',
        evaluation_type: modality, // This is the new typification field
        fecha_cita: fechaHoraCita,
      };

      if (api && api.agendarCitaPublica) {
        const res = await api.agendarCitaPublica(payload);
        if (res && res.ok) {
          setStep(4); // Success
          if (onSuccess) {
            onSuccess(formTelefono);
          }
        } else {
          throw new Error(res.error || 'No se pudo reservar la cita.');
        }
      } else {
        // Mock success
        setTimeout(() => {
          setStep(4);
          setBookingLoading(false);
          if (onSuccess) {
            onSuccess(formTelefono);
          }
        }, 1000);
        return;
      }
    } catch (err) {
      setBookingError(err.message || 'Error del servidor al agendar la cita.');
    } finally {
      setBookingLoading(false);
    }
  };

  const ModalityCard = ({ id, icon: Icon, title, description }) => (
    <div 
      onClick={() => { setModality(id); setStep(2); }}
      className="bg-white border border-gray-200 hover:border-primary rounded-2xl p-5 cursor-pointer hover:shadow-card-hover transition-all group flex items-start gap-4"
    >
      <div className="w-12 h-12 rounded-full bg-light-bg group-hover:bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors">
        <Icon className="w-6 h-6 text-gray group-hover:text-primary transition-colors" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-navy mb-1 group-hover:text-primary transition-colors">{title}</h4>
        <p className="text-xs text-[#7A7A7A] leading-relaxed">{description}</p>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col bg-white overflow-hidden ${isEmbedded ? 'w-full h-full' : 'rounded-3xl shadow-2xl border border-gray-150 max-w-2xl mx-auto'}`}>
      {/* Header */}
      <div className="bg-light-panel px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-navy flex items-center gap-2">
            Agendar Evaluación
          </h3>
          <p className="text-[11px] text-[#7A7A7A] mt-0.5">Sigue los pasos para reservar tu cita con el experto.</p>
        </div>
        {!isEmbedded && onClose && (
          <button onClick={onClose} className="text-gray hover:text-navy transition-colors">
            Cerrar
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {step < 4 && (
        <div className="bg-gray-50 flex items-center px-6 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 w-full max-w-sm">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`}></div>
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
            <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
          </div>
          <span className="ml-4 text-[10px] font-bold text-[#7A7A7A] uppercase tracking-wider">
            Paso {step} de 3
          </span>
        </div>
      )}

      {/* Step 1: Modality */}
      {step === 1 && (
        <div className="p-6 flex-1 overflow-y-auto">
          <h4 className="text-sm font-bold text-navy mb-4">¿Cómo prefieres realizar la evaluación?</h4>
          <div className="space-y-3">
            <ModalityCard 
              id="PRESENCIAL" 
              icon={MapPin} 
              title="Evaluación Presencial (Ideal)" 
              description="Visítanos en el taller para una revisión exhaustiva y precisa de tu vehículo." 
            />
            <ModalityCard 
              id="VIRTUAL_FOTOS" 
              icon={Camera} 
              title="Llamada con Fotos" 
              description="Envíanos fotos por WhatsApp y el experto te llamará para darte un diagnóstico visual." 
            />
            <ModalityCard 
              id="LLAMADA_CIEGAS" 
              icon={Phone} 
              title="Asesoría Telefónica" 
              description="Agenda un bloque de tiempo para conversar directamente con el experto sin enviar evidencia previa." 
            />
          </div>
        </div>
      )}

      {/* Step 2: Calendar & Time Slots */}
      {step === 2 && (
        <div className="p-6 flex-1 overflow-y-auto flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setStep(1)} className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Volver
              </button>
            </div>
            
            {/* Calendario Mensual */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-150">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-navy uppercase">
                  {new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex gap-1">
                  <button onClick={handlePrevMonth} className="p-1 rounded-lg hover:bg-white border border-transparent text-gray-600"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={handleNextMonth} className="p-1 rounded-lg hover:bg-white border border-transparent text-gray-600"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#7A7A7A] uppercase mb-1.5">
                <span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sá</span><span>Do</span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((dayObj, index) => {
                  if (!dayObj.day) return <div key={`empty-${index}`} />;
                  const today = new Date(); today.setHours(0,0,0,0);
                  const dateParts = dayObj.dateStr.split('-');
                  const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                  
                  const isPast = dateObj < today;
                  const dayOfWeek = dateObj.getDay(); 
                  const isAllowedDay = [1, 2, 3, 4, 5, 6].includes(dayOfWeek); // Lunes a Sábado
                  const isDisabled = isPast || !isAllowedDay;
                  const isSelected = selectedDateStr === dayObj.dateStr;

                  return (
                    <button
                      key={dayObj.dateStr}
                      disabled={isDisabled}
                      onClick={() => handleSelectDay(dayObj.dateStr)}
                      className={`aspect-square rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                        isDisabled ? 'text-gray-300 cursor-not-allowed' : isSelected ? 'bg-primary text-white scale-105 shadow-md shadow-primary/20' : 'text-navy hover:bg-white border border-transparent hover:border-gray-200'
                      }`}
                    >
                      {dayObj.day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/2 flex flex-col">
            <h4 className="text-xs font-bold text-navy uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Horas para {modality === 'PRESENCIAL' ? 'Visita' : 'Llamada'}
            </h4>
            
            {!selectedDateStr ? (
              <div className="flex-1 flex items-center justify-center border border-dashed border-gray-200 rounded-2xl p-6 bg-slate-50/50">
                <p className="text-[11px] text-gray-500 text-center">Selecciona un día en el calendario.</p>
              </div>
            ) : loadingSlots ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
              </div>
            ) : slotsDisponibles.length === 0 ? (
              <div className="flex-1 flex items-center justify-center border border-dashed border-red-100 rounded-2xl p-6 bg-red-50/20">
                <p className="text-[11px] text-red-500 text-center font-medium">No hay turnos disponibles para esta fecha.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {slotsDisponibles.map((slot) => {
                  const isSelected = selectedTimeSlot === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        isSelected ? 'bg-primary border-primary text-white shadow-sm' : 'bg-white border-gray-200 hover:border-primary text-navy hover:text-primary'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              disabled={!selectedTimeSlot}
              onClick={() => setStep(3)}
              className="mt-auto w-full py-3 rounded-xl bg-navy text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-btn-secondary"
            >
              Continuar al Registro
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Formulario */}
      {step === 3 && (
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setStep(2)} className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
              <ChevronLeft className="w-3 h-3" /> Volver a Horarios
            </button>
            <span className="text-[10px] font-bold text-navy bg-light-bg px-3 py-1 rounded-full uppercase">
              {modality.replace('_', ' ')}
            </span>
          </div>

          {bookingError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {bookingError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Nombre Completo *</label>
                <input
                  type="text" required
                  value={formNombre} onChange={(e) => setFormNombre(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">DNI *</label>
                <input
                  type="text" required
                  value={formDni} onChange={(e) => setFormDni(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Celular *</label>
                <input
                  type="tel" required
                  value={formTelefono} onChange={(e) => setFormTelefono(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              {serviciosDisponibles.length > 0 && (
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Servicio de Interés</label>
                  <select
                    value={formServicio} onChange={(e) => setFormServicio(e.target.value)}
                    className="w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="">No estoy seguro aún</option>
                    {serviciosDisponibles.map(s => (
                      <option key={s._id} value={s.nombre}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="pt-4 mt-2">
              <button
                type="submit" disabled={bookingLoading}
                className="w-full py-3.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-hover transition-all shadow-btn-primary flex items-center justify-center gap-2"
              >
                {bookingLoading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                ) : (
                  <>Confirmar Reserva <CheckCircle2 className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-navy mb-2">¡Cita Confirmada!</h4>
          <p className="text-xs text-[#7A7A7A] mb-6 max-w-xs">
            Hemos agendado tu {modality === 'PRESENCIAL' ? 'visita' : 'llamada'} para el <strong>{selectedDateStr}</strong> a las <strong>{selectedTimeSlot} hs</strong>. 
            Te enviaremos un recordatorio.
          </p>
          <button
            onClick={() => {
              if (onClose) onClose();
              else {
                setStep(1); setModality(null); setSelectedDateStr(''); setSelectedTimeSlot('');
              }
            }}
            className="px-6 py-2 border border-gray-200 rounded-full text-xs font-bold text-navy hover:bg-slate-50 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      )}
    </div>
  );
}
