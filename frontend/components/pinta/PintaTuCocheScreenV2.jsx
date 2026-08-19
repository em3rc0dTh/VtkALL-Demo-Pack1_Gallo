'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CarFront,
  Check,
  CheckCircle2,
  CircleHelp,
  Eraser,
  Paintbrush,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
  Wrench,
  X,
} from 'lucide-react';
import { PintaVehicleViewer } from './PintaVehicleViewer';
import { PAINT_INTENTS, PAINT_ZONES, VEHICLE_TYPES, WORKFLOW_STEPS, zoneLabel } from '@/lib/pinta/pintaConfig';

const BLUE = '#1741FF';
const YELLOW = '#FFD400';

function Progress({ current }) {
  return (
    <div className="mx-auto grid w-full max-w-3xl grid-cols-5 gap-2" aria-label="Progreso del flujo">
      {WORKFLOW_STEPS.map((item, index) => {
        const active = index === current;
        const complete = index < current;
        return (
          <div key={item.id} className="min-w-0">
            <div className="mb-2 flex items-center">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-black" style={{ backgroundColor: active || complete ? BLUE : '#fff', borderColor: active || complete ? BLUE : '#D8DFEC', color: active || complete ? '#fff' : '#667085' }}>{complete ? <Check size={15} strokeWidth={3} /> : index + 1}</span>
              {index < WORKFLOW_STEPS.length - 1 ? <span className="h-px flex-1" style={{ backgroundColor: complete ? BLUE : '#D8DFEC' }} /> : null}
            </div>
            <p className={`truncate text-[11px] font-bold sm:text-xs ${active ? 'text-[#1741FF]' : 'text-slate-500'}`}>{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function Header({ step }) {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-7">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/" aria-label="Volver a Gallo Autos" className="rounded-2xl bg-[#0B1E63] px-4 py-2 shadow-[0_10px_30px_rgba(11,30,99,.18)]">
          <Image src="/brand/gallo-autos-logo.svg" alt="Gallo Autos" width={132} height={58} priority className="h-10 w-auto" />
        </Link>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-slate-400">Módulo independiente</p>
          <p className="mt-0.5 text-sm font-black text-slate-950">Pinta tu coche · paso {Math.min(step + 1, 5)} de 5</p>
        </div>
      </div>
    </header>
  );
}

function VehicleTypeStep({ value, onChange, onNext }) {
  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-8 text-center">
        <p className="text-xs font-black uppercase tracking-[.28em] text-[#1741FF]">Pinta tu coche</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">¿Qué tipo de vehículo tienes?</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">Elegimos primero la carrocería para que la geometría de puertas, guardafangos y superficies sea la correcta.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {VEHICLE_TYPES.map((item) => {
          const active = value === item.id;
          return (
            <button key={item.id} type="button" onClick={() => onChange(item.id)} className="group overflow-hidden rounded-[30px] border bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl" style={{ borderColor: active ? BLUE : '#E2E8F0', boxShadow: active ? '0 20px 60px rgba(23,65,255,.14)' : undefined }}>
              <div className="relative h-56 overflow-hidden bg-[radial-gradient(circle_at_50%_55%,#fff_0%,#f5f7fb_55%,#e9eef5_100%)] p-4">
                <Image src={`/pinta/v3/${item.id}-side.svg`} alt={item.label} fill className="object-contain p-5 transition duration-300 group-hover:scale-[1.025]" />
                <span className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full border-2" style={{ borderColor: active ? BLUE : '#CBD5E1', backgroundColor: active ? BLUE : '#fff', color: '#fff' }}>{active ? <Check size={16} strokeWidth={3} /> : null}</span>
              </div>
              <div className="flex items-center gap-3 border-t border-slate-100 p-5">
                <CarFront size={24} style={{ color: active ? BLUE : '#475569' }} />
                <div><h2 className="text-xl font-black text-slate-950">{item.label}</h2><p className="mt-1 text-sm text-slate-500">{item.description}</p></div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-8 flex justify-end"><button type="button" disabled={!value} onClick={onNext} className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-black text-slate-950 disabled:opacity-35" style={{ backgroundColor: YELLOW }}>Continuar <ArrowRight size={17} /></button></div>
    </section>
  );
}

function ZonesStep({ vehicleType, selectedZones, setSelectedZones, wholeCar, setWholeCar, onBack, onNext }) {
  const toggle = (zoneId) => {
    if (wholeCar) setWholeCar(false);
    setSelectedZones((current) => current.includes(zoneId) ? current.filter((id) => id !== zoneId) : [...current, zoneId]);
  };
  const count = wholeCar ? PAINT_ZONES.length : selectedZones.length;
  return (
    <section>
      <div className="mb-6 text-center"><p className="text-xs font-black uppercase tracking-[.28em] text-[#1741FF]">Selección visual</p><h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Selecciona las zonas que quieres revisar</h1><p className="mt-2 text-sm text-slate-500">Cambia entre vista superior y lateral. En lateral también puedes cambiar de lado.</p></div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-[.18em] text-slate-400">{vehicleType === 'suv' ? 'Camioneta / SUV' : 'Auto / Sedán'}</p><p className="mt-1 text-sm font-bold text-slate-700">{count ? `${count} zonas activas` : 'Selecciona al menos una zona'}</p></div>
            <button type="button" onClick={() => { setWholeCar((value) => !value); setSelectedZones([]); }} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black" style={{ borderColor: wholeCar ? BLUE : '#CBD5E1', backgroundColor: wholeCar ? '#EEF2FF' : '#fff', color: wholeCar ? BLUE : '#334155' }}><Sparkles size={16} /> {wholeCar ? 'Coche entero seleccionado' : 'Seleccionar coche entero'}</button>
          </div>
          <PintaVehicleViewer vehicleType={vehicleType} selectedZones={selectedZones} wholeCar={wholeCar} onToggle={toggle} />
          <div className="mt-4 rounded-2xl bg-[#F7F9FF] px-4 py-3 text-center text-xs font-semibold text-slate-500">El azul representa intención de revisión/pintura. No representa precio, trabajo aprobado ni cita.</div>
        </div>
        <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-black text-slate-950">Tu selección</p><p className="text-xs text-slate-500">{wholeCar ? 'Coche entero' : `${selectedZones.length} zonas`}</p></div>{wholeCar || selectedZones.length ? <button type="button" onClick={() => { setWholeCar(false); setSelectedZones([]); }} className="inline-flex items-center gap-1 text-xs font-black text-[#1741FF]"><Eraser size={14} /> Limpiar</button> : null}</div>
          {wholeCar ? <div className="mb-5 rounded-2xl bg-[#1741FF]/5 p-4"><p className="font-black text-slate-950">Coche entero</p><p className="mt-1 text-xs text-slate-500">Evaluación del exterior completo.</p></div> : selectedZones.length ? <div className="mb-5 max-h-52 space-y-2 overflow-auto pr-1">{selectedZones.map((id) => <div key={id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"><span className="truncate text-xs font-bold text-slate-700">{zoneLabel(id)}</span><button type="button" onClick={() => toggle(id)} aria-label={`Quitar ${zoneLabel(id)}`} className="text-slate-400 hover:text-slate-900"><X size={15} /></button></div>)}</div> : <div className="mb-5 rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-400">Toca una zona del vehículo o usa la lista.</div>}
          <div className="border-t border-slate-100 pt-4"><p className="mb-3 text-xs font-black uppercase tracking-[.14em] text-slate-400">Selección por lista</p><div className="max-h-64 space-y-1 overflow-auto pr-1">{PAINT_ZONES.map((zone) => { const active = wholeCar || selectedZones.includes(zone.id); return <button key={zone.id} type="button" disabled={wholeCar} onClick={() => toggle(zone.id)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-bold hover:bg-slate-50 disabled:opacity-50"><span>{zone.label}</span><span className="flex size-5 items-center justify-center rounded border" style={{ borderColor: active ? BLUE : '#CBD5E1', backgroundColor: active ? BLUE : '#fff', color: '#fff' }}>{active ? <Check size={12} strokeWidth={3} /> : null}</span></button>; })}</div></div>
        </aside>
      </div>
      <div className="mt-7 flex items-center justify-between"><button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700"><ArrowLeft size={17} /> Volver</button><button type="button" disabled={!wholeCar && !selectedZones.length} onClick={onNext} className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-slate-950 disabled:opacity-35" style={{ backgroundColor: YELLOW }}>Revisar selección <ArrowRight size={17} /></button></div>
    </section>
  );
}

function IntentStep({ intent, setIntent, colorPreference, setColorPreference, notes, setNotes, photoNames, setPhotoNames, onBack, onNext }) {
  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-7 text-center"><p className="text-xs font-black uppercase tracking-[.28em] text-[#1741FF]">Necesidad</p><h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">¿Qué necesitas hacer?</h1><p className="mt-2 text-sm text-slate-500">Describe la intención. El diagnóstico y precio se confirman después de una evaluación real.</p></div>
      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        <div className="space-y-3">{PAINT_INTENTS.map((option) => { const active = intent === option.id; const Icon = option.id === 'paint' ? Paintbrush : option.id === 'repair_and_paint' ? Wrench : option.id === 'evaluate_damage' ? ShieldCheck : CircleHelp; return <button key={option.id} type="button" onClick={() => setIntent(option.id)} className="flex w-full items-start gap-4 rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: active ? BLUE : '#E2E8F0', backgroundColor: active ? '#F5F7FF' : '#fff' }}><span className="flex size-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: active ? BLUE : '#F1F5F9', color: active ? '#fff' : '#475569' }}><Icon size={20} /></span><span className="flex-1"><span className="block font-black text-slate-950">{option.label}</span><span className="mt-1 block text-sm leading-5 text-slate-500">{option.description}</span></span><span className="mt-1 flex size-6 items-center justify-center rounded-full border-2" style={{ borderColor: active ? BLUE : '#CBD5E1', backgroundColor: active ? BLUE : '#fff', color: '#fff' }}>{active ? <Check size={13} strokeWidth={3} /> : null}</span></button>; })}</div>
        <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-black text-slate-950">Color</p><div className="mt-3 space-y-2">{[['same','Mantener el color actual'],['change','Quiero cambiar de color'],['advice','Necesito asesoría de color']].map(([id,label]) => <label key={id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-700"><input type="radio" name="colorPreference" checked={colorPreference === id} onChange={() => setColorPreference(id)} className="accent-[#1741FF]" /> {label}</label>)}</div><label className="mt-5 block text-xs font-black uppercase tracking-[.12em] text-slate-400">Notas opcionales</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={320} rows={4} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#1741FF]" placeholder="Rayón, golpe, referencia de color..." /><label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 p-4 text-sm font-black text-slate-600 hover:border-[#1741FF] hover:text-[#1741FF]"><Upload size={17} /> Añadir fotos<input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => setPhotoNames(Array.from(e.target.files || []).slice(0,3).map((file) => file.name))} /></label>{photoNames.length ? <div className="mt-3 space-y-1">{photoNames.map((name) => <p key={name} className="truncate rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">{name}</p>)}</div> : null}</aside>
      </div>
      <div className="mt-7 flex items-center justify-between"><button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700"><ArrowLeft size={17} /> Volver</button><button type="button" disabled={!intent} onClick={onNext} className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-slate-950 disabled:opacity-35" style={{ backgroundColor: YELLOW }}>Continuar <ArrowRight size={17} /></button></div>
    </section>
  );
}

function DetailsStep({ vehicle, setVehicle, contact, setContact, onBack, onNext }) {
  const valid = vehicle.brand.trim() && vehicle.model.trim() && contact.name.trim() && contact.phone.trim();
  const input = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#1741FF] focus:ring-2 focus:ring-[#1741FF]/10';
  return (
    <section className="mx-auto max-w-5xl"><div className="mb-7 text-center"><p className="text-xs font-black uppercase tracking-[.28em] text-[#1741FF]">Datos</p><h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Cuéntanos sobre el vehículo</h1><p className="mt-2 text-sm text-slate-500">Solo pedimos lo necesario para preparar el PaintRequestDraft standalone.</p></div><div className="grid gap-6 lg:grid-cols-2"><div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"><p className="mb-5 font-black text-slate-950">Información del vehículo</p><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-black text-slate-600">Marca *<input className={input} value={vehicle.brand} onChange={(e) => setVehicle({ ...vehicle, brand: e.target.value })} placeholder="Toyota" /></label><label className="text-xs font-black text-slate-600">Modelo *<input className={input} value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} placeholder="Corolla" /></label><label className="text-xs font-black text-slate-600">Año<input className={input} value={vehicle.year} onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })} placeholder="2022" /></label><label className="text-xs font-black text-slate-600">Placa<input className={input} value={vehicle.plate} onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value.toUpperCase() })} placeholder="ABC-123" /></label></div></div><div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"><p className="mb-5 font-black text-slate-950">Datos de contacto</p><div className="space-y-4"><label className="text-xs font-black text-slate-600">Nombre y apellidos *<input className={input} value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} /></label><label className="text-xs font-black text-slate-600">Teléfono / WhatsApp *<input className={input} value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></label><label className="text-xs font-black text-slate-600">Email<input className={input} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></label></div></div></div><div className="mt-5 rounded-2xl border border-[#FFD400]/70 bg-[#FFFBE6] p-4 text-sm text-slate-700"><strong>Precio por confirmar.</strong> Esta versión no publica importes ni descuentos no verificados.</div><div className="mt-7 flex items-center justify-between"><button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700"><ArrowLeft size={17} /> Volver</button><button type="button" disabled={!valid} onClick={onNext} className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-slate-950 disabled:opacity-35" style={{ backgroundColor: YELLOW }}>Revisar <ArrowRight size={17} /></button></div></section>
  );
}

function ReviewStep({ data, onBack, onEdit, onFinish }) {
  const intent = PAINT_INTENTS.find((item) => item.id === data.intent)?.label;
  const labels = data.wholeCar ? ['Coche entero'] : data.selectedZones.map(zoneLabel);
  return (
    <section className="mx-auto max-w-6xl"><div className="mb-7 text-center"><p className="text-xs font-black uppercase tracking-[.28em] text-[#1741FF]">Revisión final</p><h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Revisa tu configuración</h1><p className="mt-2 text-sm text-slate-500">Puedes volver a cualquier decisión antes de finalizar el módulo.</p></div><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]"><div className="space-y-4"><div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-slate-400">Vehículo</p><p className="mt-2 text-xl font-black text-slate-950">{data.vehicle.brand} {data.vehicle.model}</p><p className="mt-1 text-sm text-slate-500">{[data.vehicle.year,data.vehicle.plate].filter(Boolean).join(' · ') || 'Sin año ni placa'}</p></div><button type="button" onClick={() => onEdit(3)} className="text-xs font-black text-[#1741FF]">Editar</button></div></div><div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-slate-400">Zonas</p><p className="mt-2 text-lg font-black text-slate-950">{data.wholeCar ? 'Coche entero' : `${data.selectedZones.length} zonas seleccionadas`}</p></div><button type="button" onClick={() => onEdit(1)} className="text-xs font-black text-[#1741FF]">Editar</button></div><div className="mt-4 flex flex-wrap gap-2">{labels.map((label) => <span key={label} className="rounded-full bg-[#EEF2FF] px-3 py-1.5 text-xs font-bold text-[#1741FF]">{label}</span>)}</div></div><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-[24px] border border-slate-200 bg-white p-5"><p className="text-xs font-black uppercase tracking-[.14em] text-slate-400">Necesidad</p><p className="mt-2 font-black text-slate-950">{intent}</p></div><div className="rounded-[24px] border border-slate-200 bg-white p-5"><p className="text-xs font-black uppercase tracking-[.14em] text-slate-400">Contacto</p><p className="mt-2 font-black text-slate-950">{data.contact.name}</p><p className="mt-1 text-xs text-slate-500">{data.contact.phone}{data.contact.email ? ` · ${data.contact.email}` : ''}</p></div></div><div className="rounded-2xl border border-[#FFD400]/70 bg-[#FFFBE6] p-4 text-sm leading-6 text-slate-700"><strong>No es una cotización ni una cita.</strong> Finalizar solo cierra el draft local del módulo.</div></div><aside className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm"><p className="mb-3 text-sm font-black text-slate-950">Vista de la solicitud</p><PintaVehicleViewer compact interactive={false} vehicleType={data.vehicleType} selectedZones={data.selectedZones} wholeCar={data.wholeCar} /><div className="mt-3 grid gap-2"><button type="button" onClick={() => onEdit(1)} className="rounded-xl border border-[#1741FF] px-4 py-3 text-sm font-black text-[#1741FF]">Cambiar zonas</button><button type="button" onClick={onFinish} className="rounded-xl px-4 py-3.5 text-sm font-black text-slate-950" style={{ backgroundColor: YELLOW }}>Finalizar configuración</button></div></aside></div><div className="mt-7"><button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700"><ArrowLeft size={17} /> Volver</button></div></section>
  );
}

function DoneStep({ draftId, onReset }) {
  return <section className="mx-auto max-w-3xl py-10 text-center"><div className="rounded-[36px] border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-8 shadow-sm sm:p-12"><div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500 text-white"><CheckCircle2 size={34} /></div><p className="mt-6 text-xs font-black uppercase tracking-[.28em] text-emerald-700">Workflow completado</p><h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-5xl">Tu configuración está lista</h1><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600">Creamos un PaintRequestDraft local. Todavía no fue enviado al Workshop, CRM ni agenda.</p><div className="mx-auto mt-6 max-w-sm rounded-2xl border border-slate-200 bg-white p-4 text-left"><p className="text-xs font-black uppercase tracking-[.14em] text-slate-400">Referencia local</p><p className="mt-1 font-mono text-sm font-bold text-slate-800">{draftId}</p></div><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button type="button" onClick={onReset} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700"><RotateCcw size={16} /> Nueva configuración</button><Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-slate-950" style={{ backgroundColor: YELLOW }}>Volver a Gallo Autos <ArrowRight size={16} /></Link></div></div></section>;
}

export function PintaTuCocheScreenV2() {
  const [step, setStep] = useState(0);
  const [vehicleType, setVehicleType] = useState('');
  const [selectedZones, setSelectedZones] = useState([]);
  const [wholeCar, setWholeCar] = useState(false);
  const [intent, setIntent] = useState('');
  const [colorPreference, setColorPreference] = useState('same');
  const [notes, setNotes] = useState('');
  const [photoNames, setPhotoNames] = useState([]);
  const [vehicle, setVehicle] = useState({ brand: '', model: '', year: '', plate: '' });
  const [contact, setContact] = useState({ name: '', phone: '', email: '' });
  const [draftId, setDraftId] = useState('');
  const reviewData = useMemo(() => ({ vehicleType, selectedZones, wholeCar, intent, colorPreference, notes, photoNames, vehicle, contact }), [vehicleType, selectedZones, wholeCar, intent, colorPreference, notes, photoNames, vehicle, contact]);
  const reset = () => { setStep(0); setVehicleType(''); setSelectedZones([]); setWholeCar(false); setIntent(''); setColorPreference('same'); setNotes(''); setPhotoNames([]); setVehicle({ brand: '', model: '', year: '', plate: '' }); setContact({ name: '', phone: '', email: '' }); setDraftId(''); };
  const finish = () => { setDraftId(`PTC-${Date.now().toString(36).toUpperCase()}`); setStep(5); };
  return (
    <main className="min-h-screen bg-[#F7F9FC] text-slate-950"><Header step={step} />{step < 5 ? <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-7"><Progress current={Math.min(step,4)} /></div> : null}<div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-7 sm:py-10">{step === 0 ? <VehicleTypeStep value={vehicleType} onChange={setVehicleType} onNext={() => setStep(1)} /> : null}{step === 1 ? <ZonesStep vehicleType={vehicleType} selectedZones={selectedZones} setSelectedZones={setSelectedZones} wholeCar={wholeCar} setWholeCar={setWholeCar} onBack={() => setStep(0)} onNext={() => setStep(2)} /> : null}{step === 2 ? <IntentStep intent={intent} setIntent={setIntent} colorPreference={colorPreference} setColorPreference={setColorPreference} notes={notes} setNotes={setNotes} photoNames={photoNames} setPhotoNames={setPhotoNames} onBack={() => setStep(1)} onNext={() => setStep(3)} /> : null}{step === 3 ? <DetailsStep vehicle={vehicle} setVehicle={setVehicle} contact={contact} setContact={setContact} onBack={() => setStep(2)} onNext={() => setStep(4)} /> : null}{step === 4 ? <ReviewStep data={reviewData} onBack={() => setStep(3)} onEdit={setStep} onFinish={finish} /> : null}{step === 5 ? <DoneStep draftId={draftId} onReset={reset} /> : null}</div><footer className="mt-6 border-t border-[#1741FF]/15 bg-[#0B1E63] px-4 py-5 text-white sm:px-7"><div className="mx-auto flex max-w-7xl flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between"><p className="font-bold">Gallo Autos · Pinta tu coche</p><p className="text-blue-100">Standalone · premium vehicle viewer v0.3 · sin integración Workshop todavía</p></div></footer></main>
  );
}
