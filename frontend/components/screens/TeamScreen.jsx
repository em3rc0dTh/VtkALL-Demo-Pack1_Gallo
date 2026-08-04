'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, FileJson, Plus, Trash2, X } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { adminMutationRepository } from '@/lib/admin/adminMutationRepository';
import { teamRepository } from '@/lib/team/teamRepository';

const ACTIVE_RESERVATION_STATUSES = new Set(['held', 'booked']);

const typeLabel = {
  frontdesk: 'Frontdesk',
  mechanics: 'Mecanica',
  detailing: 'Detailing',
  consultation: 'Consulta',
  bodywork: 'Carroceria',
  other: 'Otro',
};

const teamTypes = [
  ['frontdesk', 'Frontdesk'],
  ['mechanics', 'Mecanica'],
  ['detailing', 'Detailing'],
  ['consultation', 'Consulta'],
  ['bodywork', 'Carroceria'],
  ['other', 'Otro'],
];

const defaultTeamForm = {
  _id: '',
  name: '',
  type: 'mechanics',
  capacity: '1',
  slotGranularityMinutes: '15',
  active: true,
};

const readableFieldInputClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-slate-950 placeholder-slate-400 shadow-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100';

const jsonExample = `{
  "_id": "team_turagua_detailing_2",
  "name": "Detailing turno tarde",
  "type": "detailing",
  "capacity": 2,
  "slotGranularityMinutes": 15,
  "active": true
}`;

const slugifyTeamId = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .slice(0, 60);

const toForm = (team) => ({
  _id: team?._id || '',
  name: team?.name || '',
  type: team?.type || 'mechanics',
  capacity: team?.capacity ? String(team.capacity) : '1',
  slotGranularityMinutes: team?.slotGranularityMinutes ? String(team.slotGranularityMinutes) : '15',
  active: team?.active !== false,
});

const numberOrFallback = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildPayload = ({ form, businessSlug, isEditing }) => {
  const name = form.name.trim();
  const payload = {
    name,
    type: form.type || 'other',
    capacity: numberOrFallback(form.capacity, 1),
    slotGranularityMinutes: numberOrFallback(form.slotGranularityMinutes, 15),
    active: Boolean(form.active),
  };

  if (!isEditing) {
    payload._id = form._id.trim() || `team_${businessSlug}_${slugifyTeamId(name) || crypto.randomUUID()}`;
    payload.businessSlug = businessSlug;
  }

  return payload;
};

const formatTimeRange = (startAt, endAt) => {
  if (!startAt || !endAt) return 'Sin horario';

  const start = new Date(startAt);
  const end = new Date(endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Horario invalido';
  }

  return `${start.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
  })} ${start.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${end.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const isCurrentReservation = (reservation, now) => {
  const start = new Date(reservation.startAt);
  const end = new Date(reservation.endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  return start <= now && now < end;
};

const buildRows = ({ teams, reservations }) => {
  const now = new Date();
  const activeReservations = reservations.filter((reservation) => (
    ACTIVE_RESERVATION_STATUSES.has(reservation.status)
  ));

  return teams.map((team) => {
    const teamReservations = activeReservations.filter((reservation) => reservation.teamId === team._id);
    const currentReservations = teamReservations.filter((reservation) => isCurrentReservation(reservation, now));
    const upcomingReservations = teamReservations
      .filter((reservation) => new Date(reservation.startAt) > now)
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
    const capacity = Number(team.capacity) || 1;
    const usedUnits = currentReservations.reduce((total, reservation) => {
      return total + (Number(reservation.requiredUnits) || 1);
    }, 0);
    const nextReservation = currentReservations[0] || upcomingReservations[0] || null;

    let status = 'Disponible';
    let statusColor = 'VERDE';
    if (usedUnits >= capacity) {
      status = 'Lleno';
      statusColor = 'ROJO';
    } else if (usedUnits > 0) {
      status = 'Parcial';
      statusColor = 'AMARILLO';
    }

    return {
      id: team._id,
      team,
      name: team.name,
      type: typeLabel[team.type] || team.type || 'Sin tipo',
      status: team.active === false ? 'Inactivo' : status,
      statusColor: team.active === false ? 'GRIS' : statusColor,
      capacityLabel: `${Math.min(usedUnits, capacity)} / ${capacity}`,
      granularity: `${team.slotGranularityMinutes || 15} min`,
      activeReservation: nextReservation
        ? `${nextReservation.appointmentId || nextReservation.caseId || nextReservation._id} · ${formatTimeRange(nextReservation.startAt, nextReservation.endAt)}`
        : 'N/A',
    };
  });
};

export function TeamScreen() {
  const { profile } = useBusinessProfile();
  const [teams, setTeams] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [modalMode, setModalMode] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [form, setForm] = useState(defaultTeamForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [jsonTeam, setJsonTeam] = useState(null);
  const [teamJsonValue, setTeamJsonValue] = useState(jsonExample);

  useEffect(() => {
    let cancelled = false;

    async function loadTeamData() {
      if (!profile?.businessSlug) return;

      setLoading(true);
      setError(null);

      try {
        const [teamResult, reservationResult] = await Promise.all([
          teamRepository.getWorkTeams({ businessSlug: profile.businessSlug }),
          teamRepository.getResourceReservations({ businessSlug: profile.businessSlug }),
        ]);

        if (!cancelled) {
          setTeams(teamResult.data);
          setReservations(reservationResult.data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError);
          setTeams([]);
          setReservations([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTeamData();

    return () => {
      cancelled = true;
    };
  }, [profile?.businessSlug, reloadToken]);

  const rows = useMemo(() => buildRows({ teams, reservations }), [teams, reservations]);
  const reload = () => setReloadToken((value) => value + 1);

  const closeModal = () => {
    if (saving) return;
    setModalMode(null);
    setEditingTeam(null);
    setJsonTeam(null);
    setForm(defaultTeamForm);
    setFormError('');
  };

  const openCreate = () => {
    setEditingTeam(null);
    setForm(defaultTeamForm);
    setFormError('');
    setModalMode('create');
  };

  const openEdit = useCallback((team) => {
    setEditingTeam(team);
    setForm(toForm(team));
    setFormError('');
    setModalMode('edit');
  }, []);

  const openJson = useCallback((team) => {
    setJsonTeam(team);
    setTeamJsonValue(JSON.stringify(team, null, 2));
    setFormError('');
    setModalMode('json');
  }, []);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submitTeam = async (event) => {
    event.preventDefault();
    if (!profile?.businessSlug) return;

    if (!form.name.trim()) {
      setFormError('El nombre del equipo es obligatorio.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      if (modalMode === 'edit' && editingTeam?._id) {
        await adminMutationRepository.updateWorkTeam({
          teamId: editingTeam._id,
          patch: buildPayload({ form, businessSlug: profile.businessSlug, isEditing: true }),
        });
      } else {
        await adminMutationRepository.createWorkTeam(
          buildPayload({ form, businessSlug: profile.businessSlug, isEditing: false })
        );
      }
      closeModal();
      reload();
    } catch (saveError) {
      setFormError(saveError?.message || 'No se pudo guardar el equipo.');
    } finally {
      setSaving(false);
    }
  };

  const submitJson = async (event) => {
    event.preventDefault();
    if (!jsonTeam?._id) return;

    setSaving(true);
    setFormError('');
    try {
      const parsed = JSON.parse(teamJsonValue);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        throw new Error('El JSON debe ser un objeto WorkTeam.');
      }
      if (parsed._id && String(parsed._id) !== String(jsonTeam._id)) {
        throw new Error('No cambies _id desde Ver JSON. Crea otro equipo si necesitas un ID nuevo.');
      }
      if (parsed.businessSlug && String(parsed.businessSlug) !== String(jsonTeam.businessSlug || profile.businessSlug)) {
        throw new Error('No cambies businessSlug desde Ver JSON.');
      }

      const { _id, businessSlug: _businessSlug, createdAt, updatedAt, __v, ...patch } = parsed;
      await adminMutationRepository.updateWorkTeam({ teamId: jsonTeam._id, patch });
      closeModal();
      reload();
    } catch (jsonError) {
      setFormError(jsonError?.message || 'No se pudo guardar el JSON.');
    } finally {
      setSaving(false);
    }
  };

  const deleteTeam = useCallback(async (team) => {
    if (!team?._id) return;
    const confirmed = window.confirm(`Eliminar "${team.name}"? Esta accion no se puede deshacer.`);
    if (!confirmed) return;

    setDeletingId(team._id);
    try {
      await adminMutationRepository.deleteWorkTeam(team._id);
      reload();
    } catch (deleteError) {
      window.alert(deleteError?.message || 'No se pudo eliminar el equipo.');
    } finally {
      setDeletingId(null);
    }
  }, []);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(teamJsonValue);
    } catch {
      window.prompt('Copia el JSON:', teamJsonValue);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: 'Equipo',
        accessorKey: 'name',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div>
              <div className="font-bold text-text-primary">{item.name}</div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase text-text-muted">{item.type}</div>
            </div>
          );
        },
      },
      {
        header: 'Estado',
        accessorKey: 'status',
        cell: ({ row }) => {
          const item = row.original;
          const colorMap = {
            VERDE: 'bg-emerald-500',
            AMARILLO: 'bg-amber-500',
            ROJO: 'bg-rose-500',
            GRIS: 'bg-slate-400',
          };

          return (
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${colorMap[item.statusColor] || 'bg-slate-400'}`} />
              <span className="text-xs font-semibold text-text-primary">{item.status}</span>
            </div>
          );
        },
      },
      {
        header: 'Capacidad',
        accessorKey: 'capacityLabel',
        cell: ({ row }) => (
          <Badge
            estado={row.original.capacityLabel}
            variant={row.original.statusColor === 'ROJO'
              ? 'danger'
              : row.original.statusColor === 'AMARILLO'
                ? 'warning'
                : 'success'}
          />
        ),
      },
      {
        header: 'Reserva activa o proxima',
        accessorKey: 'activeReservation',
        cell: ({ getValue }) => {
          const value = getValue();
          return value === 'N/A' ? (
            <span className="text-xs italic text-text-muted">Sin reserva activa</span>
          ) : (
            <span className="text-xs font-semibold text-text-primary">{value}</span>
          );
        },
      },
      {
        header: 'Granularidad',
        accessorKey: 'granularity',
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold text-text-secondary">{getValue()}</span>
        ),
      },
      {
        header: 'Accion',
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="outline" icon={FileJson} onClick={() => openJson(row.original.team)}>Ver JSON</Button>
            <Button size="sm" variant="secondary" icon={Edit3} onClick={() => openEdit(row.original.team)}>Editar</Button>
            <Button
              size="sm"
              variant="danger-outline"
              icon={Trash2}
              loading={deletingId === row.original.id}
              onClick={() => deleteTeam(row.original.team)}
            >
              Eliminar
            </Button>
          </div>
        ),
      },
    ],
    [deleteTeam, deletingId, openEdit, openJson]
  );

  if (loading) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface-panel p-4 text-sm text-text-secondary">
        Cargando equipos desde la base de datos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border-danger bg-surface-danger p-4">
        <div className="text-sm font-semibold text-text-danger">No se pudo cargar Personal y Equipos desde la API.</div>
        <div className="mt-1 text-xs text-text-danger">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-fit flex-wrap items-center gap-4 rounded-lg border border-border-subtle bg-surface-panel px-3 py-2 text-xs font-semibold text-text-secondary shadow-sm">
          <span className="text-[9px] font-black uppercase text-text-muted">Disponibilidad de equipos:</span>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>Capacidad parcial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span>Capacidad llena</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            <span>Inactivo</span>
          </div>
        </div>
        <Button size="sm" icon={Plus} onClick={openCreate}>Agregar equipo</Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-surface-panel p-4 text-sm text-text-secondary">
          No hay WorkTeams activos en la base de datos para <span className="font-semibold text-text-primary">{profile.businessSlug}</span>.
        </div>
      ) : (
        <DataTable columns={columns} data={rows} pageSize={10} />
      )}

      {(modalMode === 'create' || modalMode === 'edit') ? (
        <TeamModal
          mode={modalMode}
          form={form}
          error={formError}
          saving={saving}
          onClose={closeModal}
          onSubmit={submitTeam}
          onChange={updateForm}
        />
      ) : null}

      {modalMode === 'json' ? (
        <TeamJsonModal
          value={teamJsonValue}
          error={formError}
          saving={saving}
          onChange={setTeamJsonValue}
          onClose={closeModal}
          onCopy={copyJson}
          onSubmit={submitJson}
        />
      ) : null}
    </div>
  );
}

function TeamModal({ mode, form, error, saving, onClose, onSubmit, onChange }) {
  const isEditing = mode === 'edit';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <form onSubmit={onSubmit} className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border-subtle bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-black text-slate-950">{isEditing ? 'Editar equipo' : 'Agregar equipo'}</h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">WorkTeam operativo para disponibilidad y reservas.</p>
          </div>
          <Button size="icon" variant="ghost" icon={X} onClick={onClose} aria-label="Cerrar" />
        </div>

        <div className="grid gap-4 overflow-y-auto p-5 md:grid-cols-2">
          {!isEditing ? (
            <Field label="ID">
              <input value={form._id} onChange={(event) => onChange('_id', event.target.value)} placeholder="Se genera desde el nombre" className={readableFieldInputClass} />
            </Field>
          ) : null}

          <Field label="Nombre">
            <input value={form.name} onChange={(event) => onChange('name', event.target.value)} placeholder="Mecanicos" className={readableFieldInputClass} required />
          </Field>

          <Field label="Tipo">
            <select value={form.type} onChange={(event) => onChange('type', event.target.value)} className={readableFieldInputClass}>
              {teamTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>

          <Field label="Capacidad">
            <input type="number" min="1" value={form.capacity} onChange={(event) => onChange('capacity', event.target.value)} className={readableFieldInputClass} />
          </Field>

          <Field label="Granularidad minutos">
            <input type="number" min="1" value={form.slotGranularityMinutes} onChange={(event) => onChange('slotGranularityMinutes', event.target.value)} className={readableFieldInputClass} />
          </Field>

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={form.active} onChange={(event) => onChange('active', event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Activo
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
          <div className="min-h-5 text-xs font-semibold text-rose-700">{error}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" loading={saving}>{isEditing ? 'Guardar cambios' : 'Crear equipo'}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function TeamJsonModal({ value, error, saving, onChange, onClose, onCopy, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <form onSubmit={onSubmit} className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border-subtle bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-black text-slate-950">Ver JSON</h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">WorkTeam editable. No cambies _id ni businessSlug.</p>
          </div>
          <Button size="icon" variant="ghost" icon={X} onClick={onClose} aria-label="Cerrar" />
        </div>

        <div className="grid min-h-0 gap-4 overflow-y-auto p-5">
          <textarea value={value} onChange={(event) => onChange(event.target.value)} spellCheck={false} className="min-h-[460px] rounded-lg border border-slate-300 bg-slate-950 px-3 py-3 font-mono text-xs font-semibold text-slate-50 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100" />
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] font-semibold leading-5 text-slate-800">{jsonExample}</pre>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
          <div className="min-h-5 text-xs font-semibold text-rose-700">{error}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onCopy} disabled={saving}>Copiar JSON</Button>
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar JSON</Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-wide text-slate-600">
      {label}
      {children}
    </label>
  );
}
