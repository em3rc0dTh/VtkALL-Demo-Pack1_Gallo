'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CarFront,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Eraser,
  Images,
  Paintbrush,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
  Wrench,
  X,
} from 'lucide-react';
import {
  PAINT_INTENTS,
  PAINT_ZONES,
  VEHICLE_TYPES,
  WORKFLOW_STEPS,
  zoneLabel,
} from '@/lib/pinta/pintaConfig';

const BRAND_BLUE = '#1741FF';
const BRAND_YELLOW = '#FFD400';

const ZONE_GEOMETRY = {
  hood: { x: 112, y: 40, width: 176, height: 72, rx: 34 },
  roof: { x: 115, y: 155, width: 170, height: 180, rx: 58 },
  trunk: { x: 112, y: 378, width: 176, height: 72, rx: 34 },
  front_bumper: { x: 118, y: 16, width: 164, height: 26, rx: 13 },
  rear_bumper: { x: 118, y: 448, width: 164, height: 26, rx: 13 },
  front_left_door: { x: 50, y: 145, width: 70, height: 104, rx: 24 },
  front_right_door: { x: 280, y: 145, width: 70, height: 104, rx: 24 },
  rear_left_door: { x: 50, y: 250, width: 70, height: 104, rx: 24 },
  rear_right_door: { x: 280, y: 250, width: 70, height: 104, rx: 24 },
  front_left_fender: { x: 57, y: 76, width: 63, height: 68, rx: 28 },
  front_right_fender: { x: 280, y: 76, width: 63, height: 68, rx: 28 },
  rear_left_quarter: { x: 57, y: 354, width: 63, height: 62, rx: 28 },
  rear_right_quarter: { x: 280, y: 354, width: 63, height: 62, rx: 28 },
  left_rocker: { x: 31, y: 158, width: 19, height: 187, rx: 9 },
  right_rocker: { x: 350, y: 158, width: 19, height: 187, rx: 9 },
  left_mirror: { x: 18, y: 128, width: 38, height: 24, rx: 10 },
  right_mirror: { x: 344, y: 128, width: 38, height: 24, rx: 10 },
};

function Progress({ current }) {
  return (
    <div className="mx-auto grid w-full max-w-3xl grid-cols-5 gap-2" aria-label="Progreso del flujo">
      {WORKFLOW_STEPS.map((step, index) => {
        const active = index === current;
        const complete = index < current;
        return (
          <div key={step.id} className="min-w-0">
            <div className="mb-2 flex items-center">
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-black transition"
                style={{
                  backgroundColor: active || complete ? BRAND_BLUE : '#FFFFFF',
                  borderColor: active || complete ? BRAND_BLUE : '#D8DFEC',
                  color: active || complete ? '#FFFFFF' : '#667085',
                }}
              >
                {complete ? <Check size={15} strokeWidth={3} /> : index + 1}
              </div>
              {index < WORKFLOW_STEPS.length - 1 ? (
                <div className="h-px flex-1" style={{ backgroundColor: complete ? BRAND_BLUE : '#D8DFEC' }} />
              ) : null}
            </div>
            <p className={`truncate text-[11px] font-bold sm:text-xs ${active ? 'text-[#1741FF]' : 'text-slate-500'}`}>
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function BrandHeader({ step }) {
  return (
    <header className="border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-7">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <a href="/" className="flex items-center gap-3" aria-label="Volver a Gallo Autos">
          <Image src="/brand/gallo-autos-logo.svg" alt="Gallo Autos" width={128} height={58} priority className="h-11 w-auto" />
        </a>
        <div className="hidden text-right sm:block">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Módulo independiente</p>
          <p className="text-sm font-black text-slate-900">Pinta tu coche · paso {Math.min(step + 1, 5)} de 5</p>
        </div>
      </div>
    </header>
  );
}

function VehicleSilhouette({ selectedZones, onToggle, wholeCar, vehicleType = 'sedan', compact = false }) {
  const selected = new Set(selectedZones);
  const bodyWidth = vehicleType === 'suv' ? 310 : 286;
  const bodyX = (400 - bodyWidth) / 2;

  return (
    <svg
      viewBox="0 0 400 490"
      className={compact ? 'mx-auto h-[330px] w-full max-w-[280px]' : 'mx-auto h-[440px] w-full max-w-[390px]'}
      role="img"
      aria-label={`Vista superior de ${vehicleType === 'suv' ? 'camioneta SUV' : 'auto sedán'} con zonas seleccionables`}
    >
      <defs>
        <linearGradient id="carBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="55%" stopColor="#E7ECF3" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
        <filter id="carShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0F172A" floodOpacity="0.18" />
        </filter>
      </defs>

      <rect x={bodyX} y="26" width={bodyWidth} height="438" rx={vehicleType === 'suv' ? 76 : 96} fill="url(#carBody)" stroke="#AAB4C4" strokeWidth="3" filter="url(#carShadow)" />
      <rect x="126" y="118" width="148" height="86" rx="38" fill="#111827" />
      <rect x="126" y="290" width="148" height="86" rx="38" fill="#111827" />
      <rect x="137" y="132" width="126" height="58" rx="28" fill="#273449" opacity="0.85" />
      <rect x="137" y="304" width="126" height="58" rx="28" fill="#273449" opacity="0.85" />
      <path d="M126 208h148v78H126z" fill="#F3F6FA" stroke="#CBD5E1" strokeWidth="2" />
      <circle cx="95" cy="105" r="18" fill="#111827" /><circle cx="305" cy="105" r="18" fill="#111827" />
      <circle cx="95" cy="392" r="18" fill="#111827" /><circle cx="305" cy="392" r="18" fill="#111827" />

      {PAINT_ZONES.map((zone) => {
        const shape = ZONE_GEOMETRY[zone.id];
        if (!shape) return null;
        const isSelected = wholeCar || selected.has(zone.id);
        return (
          <rect
            key={zone.id}
            {...shape}
            role="button"
            tabIndex={0}
            aria-label={`${isSelected ? 'Quitar' : 'Seleccionar'} ${zone.label}`}
            onClick={() => onToggle?.(zone.id)}
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ' ') && onToggle) {
                event.preventDefault();
                onToggle(zone.id);
              }
            }}
            fill={isSelected ? 'rgba(23,65,255,0.55)' : 'rgba(23,65,255,0.05)'}
            stroke={isSelected ? BRAND_BLUE : 'rgba(23,65,255,0.32)'}
            strokeWidth={isSelected ? 4 : 2}
            className={onToggle ? 'cursor-pointer outline-none transition-all hover:fill-[rgba(23,65,255,0.25)] focus:stroke-[#FFD400]' : ''}
          />
        );
      })}

      {wholeCar ? <rect x={bodyX} y="26" width={bodyWidth} height="438" rx={vehicleType === 'suv' ? 76 : 96} fill="rgba(23,65,255,0.20)" stroke={BRAND_BLUE} strokeWidth="5" pointerEvents="none" /> : null}
    </svg>
  );
}

function VehicleTypeStep({ value, onChange, onNext }) {
  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-8 text-center">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-[#1741FF]">Pinta tu coche</p>
        <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">¿Qué tipo de vehículo tienes?</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">Elige la carrocería para adaptar el selector visual. No estás solicitando una cotización todavía.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {VEHICLE_TYPES.map((vehicle) => {
          const active = value === vehicle.id;
          return (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => onChange(vehicle.id)}
              className="group relative overflow-hidden rounded-[28px] border bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              style={{ borderColor: active ? BRAND_BLUE : '#E2E8F0', boxShadow: active ? '0 18px 50px rgba(23,65,255,.13)' : undefined }}
            >
              <div className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full border-2" style={{ borderColor: active ? BRAND_BLUE : '#CBD5E1', backgroundColor: active ? BRAND_BLUE : '#FFFFFF', color: '#FFFFFF' }}>
                {active ? <Check size={17} strokeWidth={3} /> : null}
              </div>
              <div className="mb-6 flex h-44 items-center justify-center rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100">
                <div className={`relative ${vehicle.id === 'suv' ? 'h-20 w-52' : 'h-16 w-52'} rounded-[40%] border-[5px] border-slate-800 bg-white shadow-xl`}>
                  <div className="absolute left-[22%] right-[22%] top-[-22px] h-10 rounded-t-[60%] border-4 border-b-0 border-slate-800 bg-slate-200" />
                  <div className="absolute -bottom-4 left-5 size-9 rounded-full border-[6px] border-slate-800 bg-slate-300" />
                  <div className="absolute -bottom-4 right-5 size-9 rounded-full border-[6px] border-slate-800 bg-slate-300" />
                  <div className="absolute inset-y-0 left-0 w-3 rounded-l-full" style={{ backgroundColor: active ? BRAND_BLUE : '#CBD5E1' }} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CarFront size={25} style={{ color: active ? BRAND_BLUE : '#475569' }} />
                <div>
                  <h2 className="text-xl font-black text-slate-950">{vehicle.label}</h2>
                  <p className="mt-1 text-sm text-slate-500">{vehicle.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-8 flex justify-end">
        <button type="button" disabled={!value} onClick={onNext} className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-black text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-35" style={{ backgroundColor: BRAND_YELLOW }}>
          Continuar <ArrowRight size={17} />
        </button>
      </div>
    </section>
  );
}

function ZonesStep({ vehicleType, selectedZones, setSelectedZones, wholeCar, setWholeCar, onBack, onNext }) {
  const toggleZone = (zoneId) => {
    if (wholeCar) setWholeCar(false);
    setSelectedZones((current) => current.includes(zoneId) ? current.filter((id) => id !== zoneId) : [...current, zoneId]);
  };
  const count = wholeCar ? PAINT_ZONES.length : selectedZones.length;

  return (
    <section>
      <div className="mb-6 text-center">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-[#1741FF]">Selección visual</p>
        <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">Selecciona las zonas que quieres revisar</h1>
        <p className="mt-2 text-sm text-slate-500">Toca el vehículo o usa la lista accesible. Puedes seleccionar varias zonas.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{vehicleType === 'suv' ? 'Camioneta / SUV' : 'Auto / Sedán'}</p>
              <p className="mt-1 text-sm font-bold text-slate-700">{count ? `${count} zonas activas` : 'Selecciona al menos una zona'}</p>
            </div>
            <button
              type="button"
              onClick={() => { setWholeCar((value) => !value); setSelectedZones([]); }}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black transition"
              style={{ borderColor: wholeCar ? BRAND_BLUE : '#CBD5E1', backgroundColor: wholeCar ? '#EEF2FF' : '#FFFFFF', color: wholeCar ? BRAND_BLUE : '#334155' }}
            >
              <Sparkles size={16} /> {wholeCar ? 'Coche entero seleccionado' : 'Seleccionar coche entero'}
            </button>
          </div>
          <VehicleSilhouette vehicleType={vehicleType} selectedZones={selectedZones} wholeCar={wholeCar} onToggle={toggleZone} />
          <div className="mt-2 rounded-2xl bg-[#F7F9FF] px-4 py-3 text-center text-xs font-semibold text-slate-500">El color azul indica intención de revisión/pintura. No representa un precio ni una aprobación de trabajo.</div>
        </div>

        <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-slate-950">Tu selección</p>
              <p className="text-xs text-slate-500">{wholeCar ? 'Coche entero' : `${selectedZones.length} zonas`}</p>
            </div>
            {(wholeCar || selectedZones.length) ? (
              <button type="button" onClick={() => { setWholeCar(false); setSelectedZones([]); }} className="inline-flex items-center gap-1 text-xs font-black text-[#1741FF]"><Eraser size={14} /> Limpiar</button>
            ) : null}
          </div>

          {wholeCar ? (
            <div className="mb-5 rounded-2xl border border-[#1741FF]/20 bg-[#1741FF]/5 p-4">
              <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-full bg-[#1741FF] text-white"><CarFront size={18} /></div><div><p className="font-black text-slate-950">Coche entero</p><p className="text-xs text-slate-500">Evaluación del exterior completo</p></div></div>
            </div>
          ) : selectedZones.length ? (
            <div className="mb-5 max-h-56 space-y-2 overflow-auto pr-1">
              {selectedZones.map((zoneId) => (
                <div key={zoneId} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2"><span className="size-2 shrink-0 rounded-full bg-[#1741FF]" /><span className="truncate text-xs font-bold text-slate-700">{zoneLabel(zoneId)}</span></div>
                  <button type="button" onClick={() => toggleZone(zoneId)} aria-label={`Quitar ${zoneLabel(zoneId)}`} className="text-slate-400 hover:text-slate-900"><X size={15} /></button>
                </div>
              ))}
            </div>
          ) : <div className="mb-5 rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-400">Todavía no has seleccionado zonas.</div>}

          <div className="border-t border-slate-100 pt-4">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-slate-400">Selección por lista</p>
            <div className="max-h-56 space-y-1.5 overflow-auto pr-1">
              {PAINT_ZONES.map((zone) => {
                const active = wholeCar || selectedZones.includes(zone.id);
                return (
                  <button key={zone.id} type="button" disabled={wholeCar} onClick={() => toggleZone(zone.id)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-bold transition hover:bg-slate-50 disabled:opacity-55">
                    <span>{zone.label}</span><span className="flex size-5 items-center justify-center rounded border" style={{ borderColor: active ? BRAND_BLUE : '#CBD5E1', backgroundColor: active ? BRAND_BLUE : '#FFFFFF', color: '#FFFFFF' }}>{active ? <Check size={12} strokeWidth={3} /> : null}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-7 flex items-center justify-between gap-4">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700"><ArrowLeft size={17} /> Volver</button>
        <button type="button" disabled={!wholeCar && selectedZones.length === 0} onClick={onNext} className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-slate-950 disabled:opacity-35" style={{ backgroundColor: BRAND_YELLOW }}>Revisar selección <ArrowRight size={17} /></button>
      </div>
    </section>
  );
}

function IntentStep({ intent, setIntent, colorPreference, setColorPreference, notes, setNotes, photoNames, setPhotoNames, onBack, onNext }) {
  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-7 text-center">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-[#1741FF]">Necesidad</p>
        <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">¿Qué necesitas hacer?</h1>
        <p className="mt-2 text-sm text-slate-500">No hace falta que conozcas el diagnóstico. Describe tu intención y Gallo podrá evaluarla después de la integración.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {PAINT_INTENTS.map((option) => {
            const active = intent === option.id;
            const Icon = option.id === 'paint' ? Paintbrush : option.id === 'repair_and_paint' ? Wrench : option.id === 'evaluate_damage' ? ShieldCheck : CircleHelp;
            return (
              <button key={option.id} type="button" onClick={() => setIntent(option.id)} className="flex w-full items-start gap-4 rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: active ? BRAND_BLUE : '#E2E8F0', backgroundColor: active ? '#F5F7FF' : '#FFFFFF' }}>
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: active ? BRAND_BLUE : '#F1F5F9', color: active ? '#FFFFFF' : '#475569' }}><Icon size={20} /></div>
                <div className="flex-1"><p className="font-black text-slate-950">{option.label}</p><p className="mt-1 text-sm leading-5 text-slate-500">{option.description}</p></div>
                <div className="mt-1 flex size-6 items-center justify-center rounded-full border-2" style={{ borderColor: active ? BRAND_BLUE : '#CBD5E1', backgroundColor: active ? BRAND_BLUE : '#FFFFFF', color: '#FFFFFF' }}>{active ? <Check size={13} strokeWidth={3} /> : null}</div>
              </button>
            );
          })}
        </div>

        <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black text-slate-950">Color</p>
          <div className="mt-3 space-y-2">
            {[['same', 'Mantener el color actual'], ['change', 'Quiero cambiar de color'], ['advice', 'Necesito asesoría de color']].map(([id, label]) => (
              <label key={id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-700">
                <input type="radio" name="colorPreference" value={id} checked={colorPreference === id} onChange={() => setColorPreference(id)} className="accent-[#1741FF]" /> {label}
              </label>
            ))}
          </div>
          <label className="mt-5 block text-xs font-black uppercase tracking-[0.12em] text-slate-400">Referencia / notas opcionales</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={320} rows={4} placeholder="Ej. rayón profundo, cambio de color, zona golpeada..." className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#1741FF]" />
          <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 p-4 text-sm font-black text-slate-600 hover:border-[#1741FF] hover:text-[#1741FF]">
            <Upload size={17} /> Añadir fotos de referencia
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => setPhotoNames(Array.from(event.target.files || []).slice(0, 3).map((file) => file.name))} />
          </label>
          {photoNames.length ? <div className="mt-3 space-y-1">{photoNames.map((name) => <p key={name} className="truncate rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">{name}</p>)}</div> : null}
        </aside>
      </div>
      <div className="mt-7 flex items-center justify-between">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700"><ArrowLeft size={17} /> Volver</button>
        <button type="button" disabled={!intent} onClick={onNext} className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-slate-950 disabled:opacity-35" style={{ backgroundColor: BRAND_YELLOW }}>Continuar <ArrowRight size={17} /></button>
      </div>
    </section>
  );
}

function DetailsStep({ vehicle, setVehicle, contact, setContact, onBack, onNext }) {
  const valid = vehicle.brand.trim() && vehicle.model.trim() && contact.name.trim() && contact.phone.trim();
  const inputClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#1741FF] focus:ring-2 focus:ring-[#1741FF]/10';
  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-7 text-center"><p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-[#1741FF]">Datos</p><h1 className="text-3xl font-black text-slate-950 sm:text-4xl">Cuéntanos sobre el vehículo</h1><p className="mt-2 text-sm text-slate-500">Solo pedimos lo necesario para preparar el futuro PaintRequestDraft.</p></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[#1741FF] text-white"><CarFront size={19} /></div><div><p className="font-black text-slate-950">Información del vehículo</p><p className="text-xs text-slate-500">Marca y modelo son obligatorios.</p></div></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-black text-slate-600">Marca *<input className={inputClass} value={vehicle.brand} onChange={(e) => setVehicle({ ...vehicle, brand: e.target.value })} placeholder="Toyota" /></label>
            <label className="text-xs font-black text-slate-600">Modelo *<input className={inputClass} value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} placeholder="Corolla" /></label>
            <label className="text-xs font-black text-slate-600">Año (opcional)<input className={inputClass} value={vehicle.year} onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })} inputMode="numeric" placeholder="2022" /></label>
            <label className="text-xs font-black text-slate-600">Placa (opcional)<input className={inputClass} value={vehicle.plate} onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value.toUpperCase() })} placeholder="ABC-123" /></label>
          </div>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[#FFD400] text-slate-950"><ShieldCheck size={19} /></div><div><p className="font-black text-slate-950">Datos de contacto</p><p className="text-xs text-slate-500">Todavía no se envían a ningún backend.</p></div></div>
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-600">Nombre y apellidos *<input className={inputClass} value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} placeholder="Nombre completo" /></label>
            <label className="text-xs font-black text-slate-600">Teléfono / WhatsApp *<input className={inputClass} value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} inputMode="tel" placeholder="+51 999 999 999" /></label>
            <label className="text-xs font-black text-slate-600">Email (opcional)<input className={inputClass} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} inputMode="email" placeholder="correo@ejemplo.com" /></label>
          </div>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-[#FFD400]/70 bg-[#FFFBE6] p-4 text-sm text-slate-700"><strong>Precio:</strong> se confirmará después de una evaluación real. Este módulo no inventa precios, descuentos ni una cotización comercial.</div>
      <div className="mt-7 flex items-center justify-between"><button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700"><ArrowLeft size={17} /> Volver</button><button type="button" disabled={!valid} onClick={onNext} className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-slate-950 disabled:opacity-35" style={{ backgroundColor: BRAND_YELLOW }}>Revisar <ArrowRight size={17} /></button></div>
    </section>
  );
}

function ReviewStep({ data, onBack, onEdit, onFinish }) {
  const intent = PAINT_INTENTS.find((item) => item.id === data.intent)?.label;
  const selectedLabels = data.wholeCar ? ['Coche entero'] : data.selectedZones.map(zoneLabel);
  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-7 text-center"><p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-[#1741FF]">Revisión final</p><h1 className="text-3xl font-black text-slate-950 sm:text-4xl">Revisa tu configuración</h1><p className="mt-2 text-sm text-slate-500">Todavía puedes volver y modificar cualquier decisión.</p></div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Vehículo</p><p className="mt-2 text-xl font-black text-slate-950">{data.vehicle.brand} {data.vehicle.model}</p><p className="mt-1 text-sm text-slate-500">{[data.vehicle.year, data.vehicle.plate].filter(Boolean).join(' · ') || 'Sin año ni placa informados'}</p></div><button type="button" onClick={() => onEdit(3)} className="text-xs font-black text-[#1741FF]">Editar</button></div>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Zonas</p><p className="mt-2 text-lg font-black text-slate-950">{data.wholeCar ? 'Coche entero' : `${data.selectedZones.length} zonas seleccionadas`}</p></div><button type="button" onClick={() => onEdit(1)} className="text-xs font-black text-[#1741FF]">Editar</button></div>
            <div className="mt-4 flex flex-wrap gap-2">{selectedLabels.map((label) => <span key={label} className="rounded-full bg-[#EEF2FF] px-3 py-1.5 text-xs font-bold text-[#1741FF]">{label}</span>)}</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5"><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Necesidad</p><p className="mt-2 font-black text-slate-950">{intent}</p><p className="mt-1 text-xs text-slate-500">Color: {data.colorPreference === 'same' ? 'mantener actual' : data.colorPreference === 'change' ? 'cambiar de color' : 'asesoría'}</p></div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-5"><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Contacto</p><p className="mt-2 font-black text-slate-950">{data.contact.name}</p><p className="mt-1 text-xs text-slate-500">{data.contact.phone}{data.contact.email ? ` · ${data.contact.email}` : ''}</p></div>
          </div>
          <div className="rounded-2xl border border-[#FFD400]/70 bg-[#FFFBE6] p-4 text-sm leading-6 text-slate-700"><strong>No es una cotización ni una cita.</strong> Al finalizar solo creamos el estado local del módulo. La conexión con Gallo Workshop será un paso posterior.</div>
        </div>
        <aside className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm"><p className="mb-2 text-sm font-black text-slate-950">Vista de la solicitud</p><VehicleSilhouette compact vehicleType={data.vehicleType} selectedZones={data.selectedZones} wholeCar={data.wholeCar} /><div className="mt-2 grid gap-2"><button type="button" onClick={() => onEdit(1)} className="rounded-xl border border-[#1741FF] px-4 py-3 text-sm font-black text-[#1741FF]">Cambiar zonas</button><button type="button" onClick={onFinish} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-black text-slate-950" style={{ backgroundColor: BRAND_YELLOW }}>Finalizar configuración <ChevronRight size={17} /></button></div></aside>
      </div>
      <div className="mt-7"><button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700"><ArrowLeft size={17} /> Volver</button></div>
    </section>
  );
}

function DoneStep({ draftId, onReset }) {
  return (
    <section className="mx-auto max-w-3xl py-6 text-center sm:py-12">
      <div className="rounded-[36px] border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-7 shadow-sm sm:p-12">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"><CheckCircle2 size={34} /></div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-emerald-700">Workflow completado</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-5xl">Tu configuración está lista</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600">Creamos un <strong>PaintRequestDraft local</strong> para validar la experiencia del módulo. Todavía no fue enviado al Workshop, CRM ni sistema de citas.</p>
        <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-slate-200 bg-white p-4 text-left"><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Referencia local</p><p className="mt-1 font-mono text-sm font-bold text-slate-800">{draftId}</p></div>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button type="button" onClick={onReset} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700"><RotateCcw size={16} /> Nueva configuración</button><a href="/" className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-slate-950" style={{ backgroundColor: BRAND_YELLOW }}>Volver a Gallo Autos <ArrowRight size={16} /></a></div>
      </div>
    </section>
  );
}

export function PintaTuCocheScreen() {
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

  const reset = () => {
    setStep(0); setVehicleType(''); setSelectedZones([]); setWholeCar(false); setIntent(''); setColorPreference('same'); setNotes(''); setPhotoNames([]); setVehicle({ brand: '', model: '', year: '', plate: '' }); setContact({ name: '', phone: '', email: '' }); setDraftId('');
  };

  const finish = () => {
    setDraftId(`PTC-${Date.now().toString(36).toUpperCase()}`);
    setStep(5);
  };

  return (
    <main className="min-h-screen bg-[#F7F9FC] text-slate-950">
      <BrandHeader step={step} />
      {step < 5 ? <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-7"><Progress current={Math.min(step, 4)} /></div> : null}
      <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-7 sm:py-10">
        {step === 0 ? <VehicleTypeStep value={vehicleType} onChange={setVehicleType} onNext={() => setStep(1)} /> : null}
        {step === 1 ? <ZonesStep vehicleType={vehicleType} selectedZones={selectedZones} setSelectedZones={setSelectedZones} wholeCar={wholeCar} setWholeCar={setWholeCar} onBack={() => setStep(0)} onNext={() => setStep(2)} /> : null}
        {step === 2 ? <IntentStep intent={intent} setIntent={setIntent} colorPreference={colorPreference} setColorPreference={setColorPreference} notes={notes} setNotes={setNotes} photoNames={photoNames} setPhotoNames={setPhotoNames} onBack={() => setStep(1)} onNext={() => setStep(3)} /> : null}
        {step === 3 ? <DetailsStep vehicle={vehicle} setVehicle={setVehicle} contact={contact} setContact={setContact} onBack={() => setStep(2)} onNext={() => setStep(4)} /> : null}
        {step === 4 ? <ReviewStep data={reviewData} onBack={() => setStep(3)} onEdit={setStep} onFinish={finish} /> : null}
        {step === 5 ? <DoneStep draftId={draftId} onReset={reset} /> : null}
      </div>
      <footer className="mt-6 border-t border-[#1741FF]/15 bg-[#0B1E63] px-4 py-5 text-white sm:px-7">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between"><p className="font-bold">Gallo Autos · Pinta tu coche</p><p className="text-blue-100">Módulo standalone v0.1 · sin precios · sin integración Workshop todavía</p></div>
      </footer>
    </main>
  );
}
