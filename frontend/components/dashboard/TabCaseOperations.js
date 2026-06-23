'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Send,
  UserRound,
  XCircle
} from 'lucide-react';
import { api } from '../../lib/api';
import { PageHeader } from '../ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { FieldHint, FieldLabel, Input, Textarea } from '../ui/Input';
import EstadoBadge from '../ui/EstadoBadge';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'intake', label: 'Intake' },
  { value: 'expert_review', label: 'Expert review' },
  { value: 'waiting_customer', label: 'Waiting customer' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const CASE_STATUS_OPTIONS = STATUS_OPTIONS.filter((option) => option.value);

const initialCreateForm = {
  customerName: '',
  customerPhone: '',
  customerDni: '',
  customerEmail: '',
  description: '',
  managedEntityType: 'vehicle',
  managedEntitySummary: '',
  managedEntityData: '',
  scheduledDate: '',
  status: 'intake'
};

const initialExpertForm = {
  expertNotes: '',
  proposedPrice: '',
  finalPrice: '',
  estimatedDeliveryDate: '',
  evidenceUrls: '',
  transitionTo: 'waiting_customer',
  sendToCustomer: false
};

const initialQuoteForm = {
  summary: '',
  proposedPrice: '',
  finalPrice: '',
  currency: 'PEN',
  terms: '',
  validUntil: '',
  estimatedDeliveryDate: '',
  transitionTo: 'waiting_customer'
};

const unwrapData = (response) => response?.data ?? response;

const money = (value) => {
  if (value === undefined || value === null || value === '') return '—';
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return number.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });
};

const dateLabel = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const toIsoOrUndefined = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const compactObject = (value) => Object.fromEntries(
  Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null && entryValue !== '')
);

const parseOptionalNumber = (value) => (value === '' || value === null || value === undefined ? undefined : Number(value));

const sectionTitleClass = 'text-xs font-bold uppercase tracking-[0.18em] text-gray-400 mb-3';

function MessageBanner({ type, children, onClose }) {
  if (!children) return null;

  const isError = type === 'error';
  return (
    <div className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
      isError
        ? 'border-red-500/30 bg-red-500/10 text-red-100'
        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
    }`}>
      <div className="flex items-start gap-2">
        {isError ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
        <span>{children}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-current opacity-70 hover:opacity-100">
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-950/40 p-3 border border-gray-800/70">
      <div className="text-[10px] uppercase tracking-[0.16em] text-gray-500 mb-1">{label}</div>
      <div className="text-sm text-gray-100 break-words">{value || '—'}</div>
    </div>
  );
}

function FormGrid({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>;
}

export default function TabCaseOperations() {
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [quote, setQuote] = useState(null);
  const [quoteMissing, setQuoteMissing] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [expertForm, setExpertForm] = useState(initialExpertForm);
  const [quoteForm, setQuoteForm] = useState(initialQuoteForm);
  const [verticalConfig, setVerticalConfig] = useState(null);

  const selectedCaseId = selectedCase?.id;

  const labels = useMemo(() => ({
    case: verticalConfig?.labels?.case || 'Case',
    customer: verticalConfig?.labels?.customer || 'Cliente',
    managedEntity: verticalConfig?.labels?.managedEntity || 'Entidad',
    expert: verticalConfig?.labels?.expert || 'Experto',
    quote: verticalConfig?.labels?.quote || 'Quote'
  }), [verticalConfig]);

  const setField = (setter) => (event) => {
    const { name, value, type, checked } = event.target;
    setter((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const loadCases = async (nextFilters = filters, options = {}) => {
    setLoadingList(true);
    if (!options.keepMessages) clearMessages();

    try {
      const response = await api.obtenerCases({
        status: nextFilters.status,
        search: nextFilters.search,
        page: 1,
        limit: 50,
        sort: 'newest'
      });
      const data = unwrapData(response);
      const items = data?.items || [];
      setCases(items);
      setPagination(data?.pagination || null);
      return items;
    } catch (err) {
      setError(err.message || 'No se pudo cargar la lista de Cases.');
      return [];
    } finally {
      setLoadingList(false);
    }
  };

  const loadQuote = async (caseId) => {
    if (!caseId) return null;

    try {
      const response = await api.obtenerCaseQuote(caseId);
      const data = unwrapData(response);
      setQuote(data);
      setQuoteMissing(false);
      return data;
    } catch (err) {
      if (err.status === 404) {
        setQuote(null);
        setQuoteMissing(true);
        return null;
      }

      setQuote(null);
      setQuoteMissing(false);
      setError(err.message || 'No se pudo cargar la cotización derivada.');
      return null;
    }
  };

  const loadCaseDetail = async (caseId, options = {}) => {
    if (!caseId) return null;

    setLoadingDetail(true);
    if (!options.keepMessages) clearMessages();

    try {
      const response = await api.obtenerCasePorId(caseId);
      const data = unwrapData(response);
      setSelectedCase(data);
      await loadQuote(data.id);
      return data;
    } catch (err) {
      setError(err.message || 'No se pudo cargar el detalle del Case.');
      return null;
    } finally {
      setLoadingDetail(false);
    }
  };

  const refreshSelected = async (message) => {
    const currentId = selectedCaseId;
    const items = await loadCases(filters, { keepMessages: true });

    if (currentId) {
      await loadCaseDetail(currentId, { keepMessages: true });
    } else if (items[0]?.id) {
      await loadCaseDetail(items[0].id, { keepMessages: true });
    }

    if (message) setSuccess(message);
  };

  useEffect(() => {
    const boot = async () => {
      try {
        const [items, verticalResponse] = await Promise.all([
          loadCases(filters, { keepMessages: true }),
          api.obtenerVerticalConfig().catch(() => null)
        ]);

        const verticalData = unwrapData(verticalResponse);
        if (verticalData) setVerticalConfig(verticalData);
        if (items[0]?.id) await loadCaseDetail(items[0].id, { keepMessages: true });
      } catch (err) {
        setError(err.message || 'No se pudo inicializar Operaciones Case.');
      }
    };

    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiltersSubmit = async (event) => {
    event.preventDefault();
    const items = await loadCases(filters);
    if (items[0]?.id) {
      await loadCaseDetail(items[0].id, { keepMessages: true });
    } else {
      setSelectedCase(null);
      setQuote(null);
      setQuoteMissing(false);
    }
  };

  const handleCreateCase = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!createForm.customerName.trim() || !createForm.customerPhone.trim() || !createForm.description.trim()) {
      setError('Nombre, teléfono y descripción son requeridos para crear un Case.');
      return;
    }

    let managedEntityData = {};
    if (createForm.managedEntityData.trim()) {
      try {
        managedEntityData = JSON.parse(createForm.managedEntityData);
      } catch {
        setError('managedEntity.data debe ser JSON válido o quedar vacío.');
        return;
      }
    }

    const payload = compactObject({
      customer: compactObject({
        name: createForm.customerName.trim(),
        phone: createForm.customerPhone.trim(),
        dni: createForm.customerDni.trim(),
        email: createForm.customerEmail.trim()
      }),
      managedEntity: compactObject({
        type: createForm.managedEntityType,
        summary: createForm.managedEntitySummary.trim(),
        data: Object.keys(managedEntityData).length ? managedEntityData : undefined
      }),
      description: createForm.description.trim(),
      scheduledDate: toIsoOrUndefined(createForm.scheduledDate),
      status: createForm.status || 'intake',
      source: 'case_api'
    });

    setActionLoading('create');
    try {
      const response = await api.crearCase(payload);
      const data = unwrapData(response);
      setCreateForm(initialCreateForm);
      setShowCreate(false);
      await loadCases(filters, { keepMessages: true });
      await loadCaseDetail(data.id, { keepMessages: true });
      setSuccess('Case creado y seleccionado.');
    } catch (err) {
      setError(err.message || 'No se pudo crear el Case.');
    } finally {
      setActionLoading('');
    }
  };

  const handleExpertReview = async (event) => {
    event.preventDefault();
    if (!selectedCaseId) return;
    clearMessages();

    const evidenceUrls = expertForm.evidenceUrls
      .split('\n')
      .map((url) => url.trim())
      .filter(Boolean);

    const payload = compactObject({
      expertNotes: expertForm.expertNotes.trim(),
      proposedPrice: parseOptionalNumber(expertForm.proposedPrice),
      finalPrice: parseOptionalNumber(expertForm.finalPrice),
      estimatedDeliveryDate: toIsoOrUndefined(expertForm.estimatedDeliveryDate),
      evidenceUrls: evidenceUrls.length ? evidenceUrls : undefined,
      transitionTo: expertForm.transitionTo,
      sendToCustomer: expertForm.sendToCustomer
    });

    setActionLoading('expert');
    try {
      const response = await api.aplicarExpertReview(selectedCaseId, payload);
      const data = unwrapData(response);
      setSelectedCase(data);
      await refreshSelected('Revisión experta guardada.');
    } catch (err) {
      setError(err.message || 'No se pudo guardar la revisión experta.');
    } finally {
      setActionLoading('');
    }
  };

  const handlePrepareQuote = async (event) => {
    event.preventDefault();
    if (!selectedCaseId) return;
    clearMessages();

    const payload = compactObject({
      summary: quoteForm.summary.trim(),
      proposedPrice: parseOptionalNumber(quoteForm.proposedPrice),
      finalPrice: parseOptionalNumber(quoteForm.finalPrice),
      currency: quoteForm.currency.trim() || 'PEN',
      terms: quoteForm.terms.trim(),
      validUntil: toIsoOrUndefined(quoteForm.validUntil),
      estimatedDeliveryDate: toIsoOrUndefined(quoteForm.estimatedDeliveryDate),
      transitionTo: quoteForm.transitionTo || 'waiting_customer'
    });

    setActionLoading('quote');
    try {
      const response = await api.prepararCaseQuote(selectedCaseId, payload);
      const data = unwrapData(response);
      setSelectedCase(data.case);
      setQuote(data.quote);
      setQuoteMissing(false);
      await refreshSelected('Quote price state preparado. No se envió al cliente.');
    } catch (err) {
      setError(err.message || 'No se pudo preparar el quote.');
    } finally {
      setActionLoading('');
    }
  };

  const handleApprove = async () => {
    if (!selectedCaseId) return;
    if (!window.confirm('¿Confirmas aprobar la decisión del cliente? Esto cambiará el Case a approved/confirmada.')) return;
    clearMessages();
    setActionLoading('approve');

    try {
      const response = await api.aprobarCase(selectedCaseId, { approvedBy: 'Admin dashboard' });
      const data = unwrapData(response);
      setSelectedCase(data.case);
      setQuote(data.quote);
      setQuoteMissing(false);
      await refreshSelected('Case aprobado. Estado actualizado a approved/confirmada.');
    } catch (err) {
      setError(err.message || 'No se pudo aprobar el Case.');
    } finally {
      setActionLoading('');
    }
  };

  const handleReject = async () => {
    if (!selectedCaseId) return;
    if (!window.confirm('¿Confirmas rechazar la decisión? En esta versión legacy esto cancela el Case.')) return;
    clearMessages();
    setActionLoading('reject');

    try {
      const response = await api.rechazarCase(selectedCaseId, { rejectedBy: 'Admin dashboard' });
      const data = unwrapData(response);
      setSelectedCase(data.case);
      setQuote(data.quote);
      setQuoteMissing(!data.quote);
      await refreshSelected('Case rechazado. Estado actualizado a cancelled/cancelada.');
    } catch (err) {
      setError(err.message || 'No se pudo rechazar el Case.');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operaciones Case"
        description="Consola mínima para intake, revisión experta, quote price state y decisión del cliente."
        actions={(
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={RefreshCw} onClick={() => refreshSelected('Datos actualizados.')} loading={loadingList || loadingDetail}>
              Refrescar
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setShowCreate((value) => !value)}>
              {showCreate ? 'Cerrar creación' : 'Crear Case'}
            </Button>
          </div>
        )}
      />

      <MessageBanner type="error" onClose={() => setError('')}>{error}</MessageBanner>
      <MessageBanner type="success" onClose={() => setSuccess('')}>{success}</MessageBanner>

      <Card>
        <CardContent>
          <form onSubmit={handleFiltersSubmit} className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-3">
            <div>
              <FieldLabel>Status</FieldLabel>
              <select
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                className="w-full bg-gray-900/50 border border-gray-700/80 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-primary"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Buscar</FieldLabel>
              <Input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Cliente, teléfono, descripción, vehículo..."
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" icon={Search} loading={loadingList} className="w-full md:w-auto">
                Filtrar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Crear nuevo {labels.case}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCase} className="space-y-4">
              <FormGrid>
                <div>
                  <FieldLabel>{labels.customer} - nombre</FieldLabel>
                  <Input name="customerName" value={createForm.customerName} onChange={setField(setCreateForm)} placeholder="Nombre cliente" />
                </div>
                <div>
                  <FieldLabel>Teléfono</FieldLabel>
                  <Input name="customerPhone" value={createForm.customerPhone} onChange={setField(setCreateForm)} placeholder="+51999999999" />
                </div>
                <div>
                  <FieldLabel>DNI opcional</FieldLabel>
                  <Input name="customerDni" value={createForm.customerDni} onChange={setField(setCreateForm)} />
                </div>
                <div>
                  <FieldLabel>Email opcional</FieldLabel>
                  <Input name="customerEmail" value={createForm.customerEmail} onChange={setField(setCreateForm)} type="email" />
                </div>
              </FormGrid>

              <div>
                <FieldLabel>Descripción</FieldLabel>
                <Textarea name="description" value={createForm.description} onChange={setField(setCreateForm)} placeholder="Detalle de la solicitud" />
              </div>

              <FormGrid>
                <div>
                  <FieldLabel>{labels.managedEntity} tipo</FieldLabel>
                  <select
                    name="managedEntityType"
                    value={createForm.managedEntityType}
                    onChange={setField(setCreateForm)}
                    className="w-full bg-gray-900/50 border border-gray-700/80 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-primary"
                  >
                    <option value="vehicle">vehicle</option>
                    <option value="custom_order">custom_order</option>
                    <option value="equipment">equipment</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Status inicial</FieldLabel>
                  <select
                    name="status"
                    value={createForm.status}
                    onChange={setField(setCreateForm)}
                    className="w-full bg-gray-900/50 border border-gray-700/80 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-primary"
                  >
                    {CASE_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>{labels.managedEntity} resumen</FieldLabel>
                  <Input name="managedEntitySummary" value={createForm.managedEntitySummary} onChange={setField(setCreateForm)} placeholder="Ej. Toyota Corolla 2020" />
                </div>
                <div>
                  <FieldLabel>Fecha programada opcional</FieldLabel>
                  <Input name="scheduledDate" value={createForm.scheduledDate} onChange={setField(setCreateForm)} type="datetime-local" />
                </div>
              </FormGrid>

              <div>
                <FieldLabel>{labels.managedEntity} data JSON opcional</FieldLabel>
                <Textarea name="managedEntityData" value={createForm.managedEntityData} onChange={setField(setCreateForm)} placeholder='{"marca":"Toyota","modelo":"Corolla"}' />
                <FieldHint>Déjalo vacío si no necesitas campos estructurados.</FieldHint>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button type="submit" icon={Plus} loading={actionLoading === 'create'}>Crear Case</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="justify-between">
              <span>Listado de Cases</span>
              <span className="text-xs font-normal text-gray-500">{pagination?.total ?? cases.length} total</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {cases.length === 0 && !loadingList ? (
              <div className="p-5">
                <EmptyState title="No hay Cases" description="Ajusta filtros o crea un Case nuevo." />
              </div>
            ) : (
              <div className="max-h-[780px] overflow-y-auto custom-scrollbar divide-y divide-gray-800/60">
                {cases.map((caseItem) => {
                  const active = selectedCase?.id === caseItem.id;
                  return (
                    <button
                      key={caseItem.id}
                      onClick={() => loadCaseDetail(caseItem.id)}
                      className={`w-full text-left p-4 transition-colors hover:bg-gray-900/60 ${active ? 'bg-primary/10 border-l-2 border-primary' : 'border-l-2 border-transparent'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate">{caseItem.customer?.name || 'Cliente sin nombre'}</div>
                          <div className="text-xs text-gray-500 truncate">{caseItem.customer?.phone || 'Sin teléfono'}</div>
                        </div>
                        <EstadoBadge estado={caseItem.status} />
                      </div>
                      <div className="mt-3 text-xs text-gray-400 line-clamp-2">{caseItem.description || caseItem.service?.name || 'Sin descripción'}</div>
                      <div className="mt-2 text-[11px] text-gray-500 truncate">{caseItem.managedEntity?.summary || caseItem.managedEntity?.label || 'Sin entidad gestionada'}</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                        <span>legacy: {caseItem.legacyStatus || '—'}</span>
                        <span>estimado: {money(caseItem.estimatedPrice)}</span>
                        <span>final: {money(caseItem.finalPrice)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {!selectedCase ? (
            <EmptyState
              icon={ClipboardList}
              title="Selecciona un Case"
              description="El detalle y las acciones aparecerán aquí."
            />
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="justify-between">
                    <span>Detalle del Case</span>
                    <EstadoBadge estado={selectedCase.status} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingDetail && <div className="text-sm text-gray-400">Cargando detalle...</div>}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <DetailRow label="ID" value={selectedCase.id} />
                    <DetailRow label="Business / vertical" value={`${selectedCase.businessSlug || '—'} / ${selectedCase.vertical || '—'}`} />
                    <DetailRow label="Legacy status" value={selectedCase.legacyStatus} />
                    <DetailRow label={labels.customer} value={`${selectedCase.customer?.name || '—'} · ${selectedCase.customer?.phone || '—'}`} />
                    <DetailRow label={labels.managedEntity} value={selectedCase.managedEntity?.summary || selectedCase.managedEntity?.label} />
                    <DetailRow label="Servicio" value={selectedCase.service?.name || selectedCase.product?.name} />
                    <DetailRow label="Precio estimado" value={money(selectedCase.estimatedPrice)} />
                    <DetailRow label="Precio final" value={money(selectedCase.finalPrice)} />
                    <DetailRow label="Fecha" value={dateLabel(selectedCase.scheduledDate)} />
                  </div>

                  <div>
                    <div className={sectionTitleClass}>Descripción</div>
                    <p className="rounded-xl border border-gray-800/70 bg-gray-950/40 p-4 text-sm text-gray-300">
                      {selectedCase.description || 'Sin descripción'}
                    </p>
                  </div>

                  <div>
                    <div className={sectionTitleClass}>Notas de {labels.expert}</div>
                    <p className="rounded-xl border border-gray-800/70 bg-gray-950/40 p-4 text-sm text-gray-300">
                      {selectedCase.expertNotes || 'Sin notas expertas'}
                    </p>
                  </div>

                  {selectedCase.evidence?.length > 0 && (
                    <div>
                      <div className={sectionTitleClass}>Evidencia</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedCase.evidence.map((item, index) => (
                          <a key={`${item.url}-${index}`} href={item.url} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-xs text-primary hover:border-primary">
                            {item.type || 'file'} #{index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{labels.quote} derivada</CardTitle>
                </CardHeader>
                <CardContent>
                  {quoteMissing ? (
                    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                      Sin cotización preparada. Puedes preparar quote price state abajo.
                    </div>
                  ) : quote ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <DetailRow label="Estado quote" value={quote.status} />
                      <DetailRow label="Propuesto" value={money(quote.proposedPrice)} />
                      <DetailRow label="Final" value={money(quote.finalPrice)} />
                      <DetailRow label="Monto aprobado" value={money(quote.approvedAmount)} />
                      <DetailRow label="Moneda" value={quote.currency} />
                      <DetailRow label="Válido hasta" value={dateLabel(quote.validUntil)} />
                      <div className="md:col-span-3 rounded-lg bg-gray-950/40 p-3 border border-gray-800/70">
                        <div className="text-[10px] uppercase tracking-[0.16em] text-gray-500 mb-2">Limitaciones</div>
                        <ul className="space-y-1 text-xs text-gray-400">
                          {(quote.limitations || []).map((limitation) => (
                            <li key={limitation}>• {limitation}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Quote no cargada.</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expert Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleExpertReview} className="space-y-4">
                    <div>
                      <FieldLabel>Notas expertas</FieldLabel>
                      <Textarea name="expertNotes" value={expertForm.expertNotes} onChange={setField(setExpertForm)} placeholder="Diagnóstico o recomendación" />
                    </div>
                    <FormGrid>
                      <div>
                        <FieldLabel>Precio propuesto</FieldLabel>
                        <Input name="proposedPrice" value={expertForm.proposedPrice} onChange={setField(setExpertForm)} type="number" min="0" step="0.01" />
                      </div>
                      <div>
                        <FieldLabel>Precio final</FieldLabel>
                        <Input name="finalPrice" value={expertForm.finalPrice} onChange={setField(setExpertForm)} type="number" min="0" step="0.01" />
                      </div>
                      <div>
                        <FieldLabel>Fecha estimada</FieldLabel>
                        <Input name="estimatedDeliveryDate" value={expertForm.estimatedDeliveryDate} onChange={setField(setExpertForm)} type="datetime-local" />
                      </div>
                      <div>
                        <FieldLabel>Transición</FieldLabel>
                        <select
                          name="transitionTo"
                          value={expertForm.transitionTo}
                          onChange={setField(setExpertForm)}
                          className="w-full bg-gray-900/50 border border-gray-700/80 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-primary"
                        >
                          <option value="waiting_customer">waiting_customer</option>
                          <option value="expert_review">expert_review</option>
                        </select>
                      </div>
                    </FormGrid>
                    <div>
                      <FieldLabel>Evidencia URLs</FieldLabel>
                      <Textarea name="evidenceUrls" value={expertForm.evidenceUrls} onChange={setField(setExpertForm)} placeholder="Una URL por línea" />
                    </div>
                    <label className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-950/40 p-3 text-sm text-gray-300">
                      <input type="checkbox" name="sendToCustomer" checked={expertForm.sendToCustomer} onChange={setField(setExpertForm)} className="mt-1" />
                      <span>
                        Marcar intención operativa de cliente. <span className="text-yellow-300">No envía WhatsApp, SMS, email ni PDF.</span>
                      </span>
                    </label>
                    <div className="flex justify-end">
                      <Button type="submit" icon={Send} loading={actionLoading === 'expert'}>
                        Guardar revisión
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quote / Decisión</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                    Esta cotización aún no se envía al cliente. No hay PDF, WhatsApp, SMS ni email en esta versión.
                  </div>

                  <form onSubmit={handlePrepareQuote} className="space-y-4">
                    <div>
                      <FieldLabel>Resumen inmediato</FieldLabel>
                      <Textarea name="summary" value={quoteForm.summary} onChange={setField(setQuoteForm)} placeholder="Texto solo para la respuesta inmediata; no queda persistido como Quote." />
                    </div>
                    <FormGrid>
                      <div>
                        <FieldLabel>Precio propuesto</FieldLabel>
                        <Input name="proposedPrice" value={quoteForm.proposedPrice} onChange={setField(setQuoteForm)} type="number" min="0" step="0.01" />
                      </div>
                      <div>
                        <FieldLabel>Precio final</FieldLabel>
                        <Input name="finalPrice" value={quoteForm.finalPrice} onChange={setField(setQuoteForm)} type="number" min="0" step="0.01" />
                      </div>
                      <div>
                        <FieldLabel>Moneda</FieldLabel>
                        <Input name="currency" value={quoteForm.currency} onChange={setField(setQuoteForm)} />
                      </div>
                      <div>
                        <FieldLabel>Transición</FieldLabel>
                        <select
                          name="transitionTo"
                          value={quoteForm.transitionTo}
                          onChange={setField(setQuoteForm)}
                          className="w-full bg-gray-900/50 border border-gray-700/80 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-primary"
                        >
                          <option value="waiting_customer">waiting_customer</option>
                        </select>
                      </div>
                      <div>
                        <FieldLabel>Válido hasta</FieldLabel>
                        <Input name="validUntil" value={quoteForm.validUntil} onChange={setField(setQuoteForm)} type="datetime-local" />
                      </div>
                      <div>
                        <FieldLabel>Fecha estimada</FieldLabel>
                        <Input name="estimatedDeliveryDate" value={quoteForm.estimatedDeliveryDate} onChange={setField(setQuoteForm)} type="datetime-local" />
                      </div>
                    </FormGrid>
                    <div>
                      <FieldLabel>Términos inmediatos</FieldLabel>
                      <Textarea name="terms" value={quoteForm.terms} onChange={setField(setQuoteForm)} placeholder="No se persiste todavía sin Quote model." />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" icon={FileText} loading={actionLoading === 'quote'}>
                        Preparar price state
                      </Button>
                    </div>
                  </form>

                  <div className="flex flex-col sm:flex-row gap-3 border-t border-gray-800 pt-5">
                    <Button variant="primary" icon={CheckCircle2} onClick={handleApprove} loading={actionLoading === 'approve'} className="flex-1">
                      Aprobar decisión
                    </Button>
                    <Button variant="danger" icon={XCircle} onClick={handleReject} loading={actionLoading === 'reject'} className="flex-1">
                      Rechazar / cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
