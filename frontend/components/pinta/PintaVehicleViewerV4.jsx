'use client';

import { useMemo, useState } from 'react';
import { PAINT_ZONES, zoneLabel } from '@/lib/pinta/pintaConfig';

const BLUE = '#1741FF';
const YELLOW = '#FFD400';

// Semantic geometry is independent from the visual vehicle asset.
// These paths are intentionally kept in a stable 900x420 coordinate system.
const TOP_PATHS = {
  sedan: {
    hood: 'M145 126 C190 102 245 94 310 91 L348 150 C288 158 235 170 184 190 L128 173 Z',
    roof: 'M338 153 C385 144 513 144 560 153 L548 266 C499 275 398 275 349 266 Z',
    trunk: 'M615 151 C665 163 715 177 762 196 L760 226 C714 246 665 258 616 267 L576 262 L592 158 Z',
    front_bumper: 'M100 177 C88 193 84 228 101 244 L127 235 L128 184 Z',
    rear_bumper: 'M761 192 L795 179 C810 198 810 222 795 241 L760 228 Z',
    front_left_door: 'M315 97 L446 89 L446 148 C403 149 360 154 324 161 Z',
    rear_left_door: 'M451 89 L583 98 L575 161 C535 154 494 150 451 148 Z',
    front_right_door: 'M315 323 L446 331 L446 273 C403 271 360 266 324 259 Z',
    rear_right_door: 'M451 331 L583 322 L575 259 C535 266 494 270 451 272 Z',
    front_left_fender: 'M160 92 C201 78 246 73 294 78 L313 96 C255 103 212 113 174 130 L145 120 Z',
    front_right_fender: 'M160 328 C201 342 246 347 294 342 L313 324 C255 317 212 307 174 290 L145 300 Z',
    rear_left_quarter: 'M590 99 C642 105 690 116 733 134 L763 170 L743 192 C697 171 653 159 604 150 Z',
    rear_right_quarter: 'M590 321 C642 315 690 304 733 286 L763 250 L743 228 C697 249 653 261 604 270 Z',
    left_rocker: 'M306 73 C386 62 518 62 596 75 L589 91 C514 80 388 80 313 90 Z',
    right_rocker: 'M306 347 C386 358 518 358 596 345 L589 329 C514 340 388 340 313 330 Z',
    left_mirror: 'M287 76 C271 63 254 62 239 72 C254 85 270 91 290 92 Z',
    right_mirror: 'M287 344 C271 357 254 358 239 348 C254 335 270 329 290 328 Z',
  },
  suv: {
    hood: 'M132 112 C183 87 245 79 319 77 L360 148 C295 155 237 167 177 188 L116 165 Z',
    roof: 'M323 143 C380 131 527 131 584 143 L576 278 C519 289 387 289 330 278 Z',
    trunk: 'M625 142 C685 154 741 170 787 193 L788 229 C742 252 686 268 626 279 L591 269 L601 151 Z',
    front_bumper: 'M88 170 C72 192 72 230 88 251 L119 239 L118 181 Z',
    rear_bumper: 'M788 188 L825 171 C843 194 843 226 825 249 L788 232 Z',
    front_left_door: 'M301 77 L448 68 L448 139 C397 140 351 146 313 155 Z',
    rear_left_door: 'M455 68 L605 78 L596 156 C552 146 505 141 455 139 Z',
    front_right_door: 'M301 343 L448 352 L448 281 C397 280 351 274 313 265 Z',
    rear_right_door: 'M455 352 L605 342 L596 264 C552 274 505 279 455 281 Z',
    front_left_fender: 'M145 69 C196 54 251 49 305 55 L325 76 C260 82 211 94 168 113 L130 101 Z',
    front_right_fender: 'M145 351 C196 366 251 371 305 365 L325 344 C260 338 211 326 168 307 L130 319 Z',
    rear_left_quarter: 'M609 80 C670 86 725 99 771 120 L805 161 L781 189 C729 166 681 153 618 143 Z',
    rear_right_quarter: 'M609 340 C670 334 725 321 771 300 L805 259 L781 231 C729 254 681 267 618 277 Z',
    left_rocker: 'M292 50 C382 37 527 37 615 52 L608 70 C520 58 386 58 299 70 Z',
    right_rocker: 'M292 370 C382 383 527 383 615 368 L608 350 C520 362 386 362 299 350 Z',
    left_mirror: 'M277 58 C257 42 237 43 218 55 C237 72 256 78 281 79 Z',
    right_mirror: 'M277 362 C257 378 237 377 218 365 C237 348 256 342 281 341 Z',
  },
};

const SIDE_SHARED = {
  hood: 'M122 207 C174 181 244 166 335 149 L326 208 C252 211 190 223 137 245 Z',
  roof: 'M350 128 L649 128 L631 178 L371 178 Z',
  trunk: 'M676 164 C730 168 783 178 827 195 L837 238 C787 226 735 220 682 219 Z',
  front_bumper: 'M92 234 C95 215 105 203 122 195 L137 245 L104 267 Z',
  rear_bumper: 'M828 197 C849 205 862 222 868 248 L837 252 L826 224 Z',
};

function sidePaths(side, vehicleType) {
  const isSuv = vehicleType === 'suv';
  return {
    ...SIDE_SHARED,
    [`front_${side}_door`]: isSuv ? 'M345 144 L487 144 L487 260 L331 260 Z' : 'M350 146 L500 146 L500 258 L336 258 Z',
    [`rear_${side}_door`]: isSuv ? 'M493 144 L657 144 L675 260 L493 260 Z' : 'M506 146 L651 146 L669 258 L506 258 Z',
    [`front_${side}_fender`]: isSuv ? 'M186 176 C236 158 286 151 336 147 L328 259 C298 232 263 220 218 220 L187 240 Z' : 'M201 179 C245 164 292 155 343 149 L333 258 C302 230 267 219 225 221 L195 241 Z',
    [`rear_${side}_quarter`]: isSuv ? 'M662 142 C724 149 775 162 813 183 L829 240 L680 258 Z' : 'M656 146 C713 151 762 163 801 181 L823 239 L674 257 Z',
    [`${side}_rocker`]: isSuv ? 'M324 261 L682 261 L668 286 L337 286 Z' : 'M332 259 L675 259 L663 279 L343 279 Z',
    [`${side}_mirror`]: isSuv ? 'M327 132 C306 119 286 122 270 137 L311 151 Z' : 'M337 136 C319 124 300 126 286 139 L322 151 Z',
  };
}

function Mask({ zoneId, d, selected, interactive, onToggle }) {
  return (
    <path
      d={d}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `${selected ? 'Quitar' : 'Seleccionar'} ${zoneLabel(zoneId)}` : undefined}
      onClick={() => interactive && onToggle?.(zoneId)}
      onKeyDown={(event) => {
        if (!interactive || !onToggle) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle(zoneId);
        }
      }}
      fill={selected ? 'rgba(23,65,255,.46)' : 'rgba(23,65,255,0)'}
      stroke={selected ? BLUE : 'rgba(23,65,255,.08)'}
      strokeWidth={selected ? 2.5 : 1}
      className={interactive ? 'cursor-pointer transition-[fill,stroke,filter] duration-150 hover:fill-[rgba(23,65,255,.16)] hover:stroke-[rgba(23,65,255,.65)] focus:outline-none focus:fill-[rgba(255,212,0,.14)] focus:stroke-[#FFD400]' : ''}
      style={selected ? { filter: 'drop-shadow(0 4px 7px rgba(23,65,255,.28))' } : undefined}
    />
  );
}

export function PintaVehicleViewerV4({
  vehicleType = 'sedan',
  selectedZones = [],
  wholeCar = false,
  onToggle,
  compact = false,
  interactive = true,
}) {
  const [view, setView] = useState('top');
  const [side, setSide] = useState('left');
  const selected = useMemo(() => new Set(selectedZones), [selectedZones]);
  const paths = view === 'top' ? TOP_PATHS[vehicleType] : sidePaths(side, vehicleType);
  const asset = view === 'top'
    ? `/pinta/v4/${vehicleType}-top-real.jpg`
    : `/pinta/v3/${vehicleType}-side.svg`;
  const visibleZones = PAINT_ZONES.filter((zone) => paths[zone.id]);

  return (
    <div className="w-full">
      {!compact ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" aria-label="Vista del vehículo">
            <button type="button" onClick={() => setView('top')} className={`rounded-lg px-4 py-2 text-xs font-black transition ${view === 'top' ? 'bg-[#1741FF] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Vista superior</button>
            <button type="button" onClick={() => setView('side')} className={`rounded-lg px-4 py-2 text-xs font-black transition ${view === 'side' ? 'bg-[#1741FF] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Vista lateral</button>
          </div>
          {view === 'side' ? (
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              <button type="button" onClick={() => setSide('left')} className={`rounded-lg px-3 py-2 text-xs font-black ${side === 'left' ? 'bg-[#FFF7CC] text-slate-950' : 'text-slate-500'}`}>Lado izquierdo</button>
              <button type="button" onClick={() => setSide('right')} className={`rounded-lg px-3 py-2 text-xs font-black ${side === 'right' ? 'bg-[#FFF7CC] text-slate-950' : 'text-slate-500'}`}>Lado derecho</button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={`relative overflow-hidden rounded-[28px] border border-slate-100 bg-white ${compact ? 'p-2' : 'p-3 sm:p-5'}`}>
        <svg viewBox="0 0 900 420" className={`mx-auto w-full ${compact ? 'max-w-[340px]' : 'max-w-[820px]'}`} role="img" aria-label={`${vehicleType === 'suv' ? 'SUV' : 'Sedán'} — ${view === 'top' ? 'vista superior realista' : `vista lateral ${side}`}`}>
          <image href={asset} x="0" y="0" width="900" height="420" preserveAspectRatio="xMidYMid meet" />
          {visibleZones.map((zone) => (
            <Mask key={`${view}-${side}-${zone.id}`} zoneId={zone.id} d={paths[zone.id]} selected={wholeCar || selected.has(zone.id)} interactive={interactive} onToggle={onToggle} />
          ))}
        </svg>
        {!compact ? (
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-[11px] font-bold text-slate-500 shadow-sm backdrop-blur">
            {view === 'top' ? 'Pasa sobre la carrocería para descubrir las zonas seleccionables.' : `Vista ${side === 'left' ? 'izquierda' : 'derecha'} · la vista lateral sigue en refinamiento visual.`}
          </div>
        ) : null}
      </div>
    </div>
  );
}
