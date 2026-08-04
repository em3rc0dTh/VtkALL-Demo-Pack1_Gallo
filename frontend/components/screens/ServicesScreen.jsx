'use client';

import { useCallback, useMemo, useState } from 'react';
import { Edit3, FileJson, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { useAdminData } from '@/hooks/useAdminData';
import { adminMutationRepository } from '@/lib/admin/adminMutationRepository';
import { adminEmptyData, offeringName } from '@/lib/admin/adminMappers';

const defaultServiceForm = {
  _id: '',
  name: '',
  description: '',
  category: '',
  verticalType: 'vehicle_service',
  offeringType: 'service',
  priceLabel: '',
  durationMinutes: '',
  displayOrder: '',
  active: true,
  publicVisible: true,
};

const readableFieldInputClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-slate-950 placeholder-slate-400 shadow-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100';

const jsonExample = `{
  "services": [
    {
      "_id": "off_turagua_undercoating",
      "name": "Undercoating",
      "description": "Proteccion inferior contra oxido, humedad y desgaste.",
      "category": "proteccion",
      "verticalType": "vehicle_service",
      "offeringType": "service",
      "priceLabel": "Desde S/ 180",
      "durationMinutes": 120,
      "displayOrder": 10,
      "active": true,
      "publicVisible": true
    },
    {
      "name": "Planchado y pintura",
      "description": "Correccion estetica y pintura automotriz.",
      "priceLabel": "Segun evaluacion",
      "durationMinutes": 240,
      "active": true,
      "publicVisible": true
    }
  ]
}`;

const toForm = (service) => ({
  _id: service?._id || '',
  name: service?.name || service?.title || service?.displayName || '',
  description: service?.description || '',
  category: service?.category || '',
  verticalType: service?.verticalType || 'vehicle_service',
  offeringType: service?.offeringType || 'service',
  priceLabel: service?.price?.display || service?.priceLabel || '',
  durationMinutes: service?.durationMinutes ? String(service.durationMinutes) : '',
  displayOrder: service?.displayOrder !== undefined && service?.displayOrder !== null ? String(service.displayOrder) : '',
  active: service?.active !== false,
  publicVisible: service?.publicVisible !== false,
});

const slugifyServiceId = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .slice(0, 60);

const numericOrUndefined = (value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildPayload = ({ form, businessSlug, isEditing }) => {
  const generatedId = `off_${businessSlug}_${slugifyServiceId(form.name) || crypto.randomUUID()}`;
  const payload = {
    name: form.name.trim(),
    title: form.name.trim(),
    displayName: form.name.trim(),
    description: form.description.trim(),
    category: form.category.trim(),
    verticalType: form.verticalType.trim() || 'vehicle_service',
    offeringType: form.offeringType.trim() || 'service',
    priceLabel: form.priceLabel.trim(),
    active: Boolean(form.active),
    publicVisible: Boolean(form.publicVisible),
  };

  const durationMinutes = numericOrUndefined(form.durationMinutes);
  const displayOrder = numericOrUndefined(form.displayOrder);
  if (durationMinutes !== undefined) payload.durationMinutes = durationMinutes;
  if (displayOrder !== undefined) payload.displayOrder = displayOrder;
  if (!isEditing) {
    payload._id = form._id.trim() || generatedId;
    payload.businessSlug = businessSlug;
  }

  return payload;
};

const normalizeImportItem = ({ item, businessSlug }) => {
  const name = String(item?.name || item?.title || item?.displayName || '').trim();
  if (!name) {
    throw new Error('Cada servicio del JSON necesita name, title o displayName.');
  }

  const id = String(item?._id || '').trim() || `off_${businessSlug}_${slugifyServiceId(name) || crypto.randomUUID()}`;
  const durationMinutes = numericOrUndefined(item?.durationMinutes);
  const displayOrder = numericOrUndefined(item?.displayOrder);

  return {
    ...item,
    _id: id,
    businessSlug,
    name,
    title: String(item?.title || name).trim(),
    displayName: String(item?.displayName || name).trim(),
    description: String(item?.description || '').trim(),
    category: String(item?.category || '').trim(),
    verticalType: String(item?.verticalType || 'vehicle_service').trim(),
    offeringType: String(item?.offeringType || 'service').trim(),
    priceLabel: String(item?.priceLabel || item?.price?.display || '').trim(),
    active: item?.active === undefined ? true : Boolean(item.active),
    publicVisible: item?.publicVisible === undefined ? true : Boolean(item.publicVisible),
    ...(durationMinutes !== undefined ? { durationMinutes } : {}),
    ...(displayOrder !== undefined ? { displayOrder } : {}),
  };
};

const parseServicesJson = (value) => {
  const parsed = JSON.parse(value);
  const services = Array.isArray(parsed)
    ? parsed
    : parsed?.services || parsed?.catalogOfferings || parsed?.offerings;

  if (!Array.isArray(services)) {
    throw new Error('El JSON debe ser un array o un objeto con services/catalogOfferings.');
  }

  return services;
};

export function ServicesScreen() {
  const { data = adminEmptyData, loading, error, businessSlug, reload } = useAdminData();
  const [modalMode, setModalMode] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [form, setForm] = useState(defaultServiceForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [jsonValue, setJsonValue] = useState(jsonExample);
  const [jsonService, setJsonService] = useState(null);
  const [serviceJsonValue, setServiceJsonValue] = useState('');
  const services = useMemo(() => data?.catalogOfferings || [], [data?.catalogOfferings]);
  const serviceIds = useMemo(() => new Set(services.map((service) => String(service._id))), [services]);

  const rows = useMemo(() => services.map((service) => ({
    id: service._id,
    service,
    name: offeringName(service),
    price: service.price?.display || service.priceLabel || service.price || 'Sin precio definido',
    duration: service.durationMinutes ? `${service.durationMinutes} min` : 'Sin duracion definida',
    state: service.active === false ? 'Inactivo' : 'Activo',
    color: service.active === false ? 'ROJO' : 'VERDE',
    verticalType: service.verticalType || 'Sin vertical',
  })), [services]);

  const openCreate = () => {
    setEditingService(null);
    setForm(defaultServiceForm);
    setFormError('');
    setModalMode('create');
  };

  const openJsonImport = () => {
    setJsonService(null);
    setFormError('');
    setJsonValue(jsonExample);
    setModalMode('json');
  };

  const openServiceJson = useCallback((service) => {
    setJsonService(service);
    setServiceJsonValue(JSON.stringify(service, null, 2));
    setFormError('');
    setModalMode('serviceJson');
  }, []);

  const openEdit = useCallback((service) => {
    setEditingService(service);
    setForm(toForm(service));
    setFormError('');
    setModalMode('edit');
  }, []);

  const closeModal = () => {
    if (saving) return;
    setModalMode(null);
    setEditingService(null);
    setJsonService(null);
    setForm(defaultServiceForm);
    setFormError('');
  };

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submitService = async (event) => {
    event.preventDefault();
    if (!businessSlug) return;

    if (!form.name.trim()) {
      setFormError('El nombre del servicio es obligatorio.');
      return;
    }

    if (modalMode === 'create' && !form._id.trim() && !slugifyServiceId(form.name)) {
      setFormError('Agrega un nombre que permita crear un ID valido.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      if (modalMode === 'edit' && editingService?._id) {
        await adminMutationRepository.updateCatalogOffering({
          offeringId: editingService._id,
          patch: buildPayload({ form, businessSlug, isEditing: true }),
        });
      } else {
        await adminMutationRepository.createCatalogOffering(
          buildPayload({ form, businessSlug, isEditing: false })
        );
      }
      closeModal();
      reload();
    } catch (saveError) {
      setFormError(saveError?.message || 'No se pudo guardar el servicio.');
    } finally {
      setSaving(false);
    }
  };

  const deleteService = useCallback(async (service) => {
    if (!service?._id) return;
    const confirmed = window.confirm(`Eliminar "${offeringName(service)}"? Esta accion no se puede deshacer.`);
    if (!confirmed) return;

    setDeletingId(service._id);
    try {
      await adminMutationRepository.deleteCatalogOffering(service._id);
      reload();
    } catch (deleteError) {
      window.alert(deleteError?.message || 'No se pudo eliminar el servicio.');
    } finally {
      setDeletingId(null);
    }
  }, [reload]);

  const submitJsonImport = async (event) => {
    event.preventDefault();
    if (!businessSlug) return;

    setSaving(true);
    setFormError('');

    try {
      const parsedServices = parseServicesJson(jsonValue);
      const normalizedServices = parsedServices.map((item) => normalizeImportItem({ item, businessSlug }));

      for (const service of normalizedServices) {
        if (serviceIds.has(String(service._id))) {
          const { _id, businessSlug: _businessSlug, ...patch } = service;
          await adminMutationRepository.updateCatalogOffering({
            offeringId: _id,
            patch,
          });
        } else {
          await adminMutationRepository.createCatalogOffering(service);
        }
      }

      closeModal();
      reload();
    } catch (importError) {
      setFormError(importError?.message || 'No se pudo importar el JSON.');
    } finally {
      setSaving(false);
    }
  };

  const submitServiceJson = async (event) => {
    event.preventDefault();
    if (!jsonService?._id) return;

    setSaving(true);
    setFormError('');

    try {
      const parsed = JSON.parse(serviceJsonValue);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        throw new Error('El JSON debe ser un objeto de CatalogOffering.');
      }

      if (parsed._id && String(parsed._id) !== String(jsonService._id)) {
        throw new Error('No cambies _id desde Ver JSON. Crea otro servicio si necesitas un ID nuevo.');
      }

      if (parsed.businessSlug && String(parsed.businessSlug) !== String(jsonService.businessSlug || businessSlug)) {
        throw new Error('No cambies businessSlug desde Ver JSON.');
      }

      const { _id, businessSlug: _businessSlug, createdAt, updatedAt, __v, ...patch } = parsed;
      await adminMutationRepository.updateCatalogOffering({
        offeringId: jsonService._id,
        patch,
      });

      closeModal();
      reload();
    } catch (jsonError) {
      setFormError(jsonError?.message || 'No se pudo guardar el JSON.');
    } finally {
      setSaving(false);
    }
  };

  const copyServiceJson = async () => {
    try {
      await navigator.clipboard.writeText(serviceJsonValue);
    } catch {
      window.prompt('Copia el JSON:', serviceJsonValue);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: 'CatalogOffering',
        accessorKey: 'name',
        cell: ({ row }) => (
          <div>
            <div className="font-bold text-text-primary">{row.original.name}</div>
            <div className="mt-0.5 text-xs text-text-muted">{row.original.id}</div>
          </div>
        ),
      },
      {
        header: 'Precio / Duracion',
        id: 'price_duration',
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-text-primary">{row.original.price}</div>
            <div className="text-xs text-text-secondary mt-0.5">{row.original.duration}</div>
          </div>
        ),
      },
      {
        header: 'Vertical',
        accessorKey: 'verticalType',
        cell: ({ getValue }) => <span className="text-xs font-semibold text-text-secondary">{getValue()}</span>,
      },
      {
        header: 'Estado backend',
        accessorKey: 'state',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${row.original.color === 'ROJO' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            <span className="text-xs font-semibold text-text-primary">{row.original.state}</span>
          </div>
        ),
      },
      {
        header: 'Accion',
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="outline" icon={FileJson} onClick={() => openServiceJson(row.original.service)}>Ver JSON</Button>
            <Button size="sm" variant="secondary" icon={Edit3} onClick={() => openEdit(row.original.service)}>Editar</Button>
            <Button
              size="sm"
              variant="danger-outline"
              icon={Trash2}
              loading={deletingId === row.original.id}
              onClick={() => deleteService(row.original.service)}
            >
              Eliminar
            </Button>
          </div>
        ),
      },
    ],
    [deleteService, deletingId, openEdit, openServiceJson]
  );

  if (loading) return <StateBox>Cargando CatalogOfferings desde backend...</StateBox>;
  if (error) return <StateBox danger>{error.message}</StateBox>;

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border-subtle bg-surface-panel px-3 py-2 text-xs font-semibold text-text-secondary w-fit shadow-sm">
          <span className="text-text-muted uppercase tracking-wider text-[9px] font-black">Estado del CatalogOffering:</span>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>Activo en backend</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span>Inactivo</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" icon={FileJson} onClick={openJsonImport}>Importar JSON</Button>
          <Button size="sm" icon={Plus} onClick={openCreate}>Agregar servicio</Button>
        </div>
      </div>

      <div className="flex flex-col min-h-0">
        {rows.length ? <DataTable columns={columns} data={rows} pageSize={10} /> : <StateBox>No hay CatalogOfferings activos en backend.</StateBox>}
      </div>

      {(modalMode === 'create' || modalMode === 'edit') && (
        <ServiceModal
          mode={modalMode}
          form={form}
          error={formError}
          saving={saving}
          onClose={closeModal}
          onSubmit={submitService}
          onChange={updateForm}
        />
      )}
      {modalMode === 'json' && (
        <JsonImportModal
          value={jsonValue}
          error={formError}
          saving={saving}
          onChange={setJsonValue}
          onClose={closeModal}
          onSubmit={submitJsonImport}
        />
      )}
      {modalMode === 'serviceJson' && (
        <ServiceJsonModal
          service={jsonService}
          value={serviceJsonValue}
          error={formError}
          saving={saving}
          onChange={setServiceJsonValue}
          onClose={closeModal}
          onCopy={copyServiceJson}
          onSubmit={submitServiceJson}
        />
      )}
    </div>
  );
}

function ServiceModal({ mode, form, error, saving, onClose, onSubmit, onChange }) {
  const isEditing = mode === 'edit';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <form onSubmit={onSubmit} className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface-panel shadow-xl">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <h2 className="text-base font-black text-text-primary">{isEditing ? 'Editar servicio' : 'Agregar servicio'}</h2>
            <p className="mt-0.5 text-xs font-semibold text-text-muted">CatalogOffering operativo para la web admin.</p>
          </div>
          <Button size="icon" variant="ghost" icon={X} onClick={onClose} aria-label="Cerrar" />
        </div>

        <div className="grid gap-4 overflow-y-auto p-5 md:grid-cols-2">
          {!isEditing && (
            <Field label="ID">
              <input
                value={form._id}
                onChange={(event) => onChange('_id', event.target.value)}
                placeholder="Se genera desde el nombre"
                className={readableFieldInputClass}
              />
            </Field>
          )}

          <Field label="Nombre">
            <input
              value={form.name}
              onChange={(event) => onChange('name', event.target.value)}
              placeholder="Arenado + Undercoating"
              className={readableFieldInputClass}
              required
            />
          </Field>

          <Field label="Vertical">
            <input
              value={form.verticalType}
              onChange={(event) => onChange('verticalType', event.target.value)}
              className={readableFieldInputClass}
            />
          </Field>

          <Field label="Tipo">
            <input
              value={form.offeringType}
              onChange={(event) => onChange('offeringType', event.target.value)}
              className={readableFieldInputClass}
            />
          </Field>

          <Field label="Categoria">
            <input
              value={form.category}
              onChange={(event) => onChange('category', event.target.value)}
              className={readableFieldInputClass}
            />
          </Field>

          <Field label="Precio visible">
            <input
              value={form.priceLabel}
              onChange={(event) => onChange('priceLabel', event.target.value)}
              placeholder="Desde S/ 120"
              className={readableFieldInputClass}
            />
          </Field>

          <Field label="Duracion en minutos">
            <input
              type="number"
              min="0"
              value={form.durationMinutes}
              onChange={(event) => onChange('durationMinutes', event.target.value)}
              className={readableFieldInputClass}
            />
          </Field>

          <Field label="Orden">
            <input
              type="number"
              value={form.displayOrder}
              onChange={(event) => onChange('displayOrder', event.target.value)}
              className={readableFieldInputClass}
            />
          </Field>

          <Field label="Descripcion" className="md:col-span-2">
            <textarea
              value={form.description}
              onChange={(event) => onChange('description', event.target.value)}
              rows={4}
              className={`${readableFieldInputClass} resize-none`}
            />
          </Field>

          <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => onChange('active', event.target.checked)}
              className="h-4 w-4 rounded border-border-default"
            />
            Activo en backend
          </label>

          <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
            <input
              type="checkbox"
              checked={form.publicVisible}
              onChange={(event) => onChange('publicVisible', event.target.checked)}
              className="h-4 w-4 rounded border-border-default"
            />
            Visible publicamente
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-5 py-4">
          <div className="min-h-5 text-xs font-semibold text-text-danger">{error}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" loading={saving}>{isEditing ? 'Guardar cambios' : 'Crear servicio'}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function JsonImportModal({ value, error, saving, onChange, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <form onSubmit={onSubmit} className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border-subtle bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-black text-slate-950">Importar servicios JSON</h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">Pega un array o un objeto con services/catalogOfferings. Cada item se guarda separado.</p>
          </div>
          <Button size="icon" variant="ghost" icon={X} onClick={onClose} aria-label="Cerrar" />
        </div>

        <div className="grid min-h-0 gap-4 overflow-y-auto p-5 lg:grid-cols-[1fr_0.8fr]">
          <label className="flex min-h-[420px] flex-col gap-2 text-xs font-black uppercase tracking-wide text-slate-600">
            JSON
            <textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              spellCheck={false}
              className="min-h-[380px] flex-1 rounded-lg border border-slate-300 bg-slate-950 px-3 py-3 font-mono text-xs font-semibold normal-case tracking-normal text-slate-50 placeholder-slate-500 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </label>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-xs font-black uppercase tracking-wide text-slate-600">Example</h3>
            <pre className="mt-3 max-h-[380px] overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-[11px] font-semibold leading-5 text-slate-800">{jsonExample}</pre>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
          <div className="min-h-5 text-xs font-semibold text-rose-700">{error}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" loading={saving}>Importar servicios</Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ServiceJsonModal({ service, value, error, saving, onChange, onClose, onCopy, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <form onSubmit={onSubmit} className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border-subtle bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-black text-slate-950">Ver JSON</h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">{service?._id || 'CatalogOffering'}</p>
          </div>
          <Button size="icon" variant="ghost" icon={X} onClick={onClose} aria-label="Cerrar" />
        </div>

        <div className="grid min-h-0 gap-4 overflow-y-auto p-5">
          <label className="flex min-h-[500px] flex-col gap-2 text-xs font-black uppercase tracking-wide text-slate-600">
            CatalogOffering JSON editable
            <textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              spellCheck={false}
              className="min-h-[460px] flex-1 rounded-lg border border-slate-300 bg-slate-950 px-3 py-3 font-mono text-xs font-semibold normal-case tracking-normal text-slate-50 placeholder-slate-500 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
            Puedes editar campos del servicio. Por seguridad, no se permite cambiar _id ni businessSlug desde este modal.
          </div>
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

function Field({ label, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-1.5 text-xs font-black uppercase tracking-wide text-text-muted ${className}`}>
      {label}
      {children}
    </label>
  );
}

function StateBox({ children, danger }) {
  return (
    <div className={`rounded-lg border p-4 text-sm font-semibold ${danger ? 'border-border-danger bg-surface-danger text-text-danger' : 'border-border-subtle bg-surface-panel text-text-secondary'}`}>
      {children}
    </div>
  );
}
