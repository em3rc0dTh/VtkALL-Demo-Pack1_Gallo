'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Copy,
  FileText,
  History,
  Plus,
  RefreshCw,
  Search,
  Wrench,
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
  { value: 'intake', label: 'Recibido' },
  { value: 'expert_review', label: 'En diagnóstico' },
  { value: 'waiting_customer', label: 'Esperando aprobación' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'in_progress', label: 'En ejecución' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' }
];

const CASE_STATUS_OPTIONS = STATUS_OPTIONS.filter((option) => option.value);

const STATUS_LABELS = Object.fromEntries(
  CASE_STATUS_OPTIONS.map((option) => [option.value, option.label])
);

const SOURCE_OPTIONS = [
  { value: 'web', label: 'Web' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'whatsapp', label: 'WhatsApp / webhook' }
];

const initialCreateForm = {
  customerName: '',
  customerPhone: '',
  customerDni: '',
  customerEmail: '',
  placa: '',
  marca: '',
  modelo: '',
  anio: '',
  kilometraje: '',
  serviceRequested: '',
  symptom: '',
  scheduledDate: '',
  source: 'web',
  evidenceUrls: '',
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
  if (value === undefined || value === null || value === '') return '-';
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return number.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });
};

const dateLabel = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
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

const splitUrls = (value) => String(value || '')
  .split('\n')
  .map((url) => url.trim())
  .filter(Boolean);

const sectionTitleClass = 'text-xs font-bold uppercase tracking-[0.18em] text-gray-400 mb-3';

const statusLabel = (status) => STATUS_LABELS[status] || status || '-';

const vehicleDataOf = (caseItem) => caseItem?.managedEntity?.data || {};

const vehiclePlateOf = (caseItem) => {
  const vehicle = vehicleDataOf(caseItem);
  return String(vehicle.placa || vehicle.patente || '').trim().toUpperCase();
};

const vehicleSummaryFromForm = (form) => [
  form.marca.trim(),
  form.modelo.trim(),
  form.anio.trim(),
  form.placa.trim().toUpperCase()
].filter(Boolean).join(' ');

const vehicleSummary = (caseItem) => {
  const vehicle = vehicleDataOf(caseItem);
  const summary = [
    vehicle.marca,
    vehicle.modelo,
    vehicle.anio,
    vehicle.placa || vehicle.patente
  ].filter(Boolean).join(' ');

  return summary || caseItem?.managedEntity?.summary || '-';
};

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
      <div className="text-sm text-gray-100 break-words">{value || '-'}</div>
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
  const [vehicleHistory, setVehicleHistory] = useState([]);
  const [historyError, setHistoryError] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
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
    case: verticalConfig?.labels?.case || 'Orden',
    cases: verticalConfig?.labels?.cases || 'Órdenes',
    customer: verticalConfig?.labels?.customer || 'Cliente',
    managedEntity: verticalConfig?.labels?.managedEntity || 'Vehículo',
    expert: verticalConfig?.labels?.expert || 'Técnico',
    quote: verticalConfig?.labels?.quote || 'Presupuesto',
    diagnosis: verticalConfig?.labels?.diagnosis || 'Diagnóstico',
    service: verticalConfig?.labels?.service || 'Servicio'
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
      setError(err.message || `No se pudo cargar la lista de ${labels.cases.toLowerCase()}.`);
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
      setError(err.message || 'No se pudo cargar el presupuesto interno.');
      return null;
    }
  };

  const loadVehicleHistory = async (caseData) => {
    const plate = vehiclePlateOf(caseData);
    setHistoryError('');

    if (!plate) {
      setVehicleHistory([]);
      return [];
    }

    setLoadingHistory(true);
    try {
      const response = await api.obtenerCases({
        vehiclePlate: plate,
        page: 1,
        limit: 20,
        sort: 'newest'
      });
      const data = unwrapData(response);
      const items = data?.items || [];
      const related = items.filter((item) => item.id !== caseData.id);
      setVehicleHistory(related);
      return related;
    } catch (err) {
      setVehicleHistory([]);
      setHistoryError(err.message || 'No se pudo cargar el historial del vehículo.');
      return [];
    } finally {
      setLoadingHistory(false);
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
      await Promise.all([
        loadQuote(data.id),
        loadVehicleHistory(data)
      ]);
      return data;
    } catch (err) {
      setError(err.message || `No se pudo cargar el detalle de la ${labels.case.toLowerCase()}.`);
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
        setError(err.message || 'No se pudo inicializar Órdenes de Taller.');
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
      setVehicleHistory([]);
    }
  };

  const handleCreateCase = async (event) => {
    event.preventDefault();
    clearMessages();

    const required = [
      createForm.customerName.trim(),
      createForm.customerPhone.trim(),
      createForm.placa.trim(),
      createForm.marca.trim(),
      createForm.modelo.trim(),
      createForm.serviceRequested.trim(),
      createForm.symptom.trim()
    ];

    if (required.some((value) => !value)) {
      setError('Cliente, teléfono, placa, marca, modelo, servicio solicitado y síntoma son requeridos.');
      return;
    }

    const placa = createForm.placa.trim().toUpperCase();
    const vehicleData = compactObject({
      placa,
      patente: placa,
      marca: createForm.marca.trim(),
      modelo: createForm.modelo.trim(),
      anio: createForm.anio.trim(),
      kilometraje: parseOptionalNumber(createForm.kilometraje),
      servicioSolicitado: createForm.serviceRequested.trim(),
      sintoma: createForm.symptom.trim(),
      canalOrigen: createForm.source
    });

    const description = [
      `Servicio solicitado: ${createForm.serviceRequested.trim()}`,
      `Síntoma / problema: ${createForm.symptom.trim()}`
    ].join('\n');

    const payload = compactObject({
      customer: compactObject({
        name: createForm.customerName.trim(),
        phone: createForm.customerPhone.trim(),
        dni: createForm.customerDni.trim(),
        email: createForm.customerEmail.trim()
      }),
      managedEntity: compactObject({
        type: 'vehicle',
        summary: vehicleSummaryFromForm(createForm),
        data: vehicleData
      }),
      description,
      scheduledDate: toIsoOrUndefined(createForm.scheduledDate),
      status: createForm.status || 'intake',
      source: createForm.source || 'web',
      evidenceUrls: splitUrls(createForm.evidenceUrls)
    });

    setActionLoading('create');
    try {
      const response = await api.crearCase(payload);
      const data = unwrapData(response);
      setCreateForm(initialCreateForm);
      setShowCreate(false);
      await loadCases(filters, { keepMessages: true });
      await loadCaseDetail(data.id, { keepMessages: true });
      setSuccess(`${labels.case} creada y seleccionada.`);
    } catch (err) {
      setError(err.message || `No se pudo crear la ${labels.case.toLowerCase()}.`);
    } finally {
      setActionLoading('');
    }
  };

  const handleExpertReview = async (event) => {
    event.preventDefault();
    if (!selectedCaseId) return;
    clearMessages();

    const payload = compactObject({
      expertNotes: expertForm.expertNotes.trim(),
      proposedPrice: parseOptionalNumber(expertForm.proposedPrice),
      finalPrice: parseOptionalNumber(expertForm.finalPrice),
      estimatedDeliveryDate: toIsoOrUndefined(expertForm.estimatedDeliveryDate),
      evidenceUrls: splitUrls(expertForm.evidenceUrls),
      transitionTo: expertForm.transitionTo,
      sendToCustomer: expertForm.sendToCustomer
    });

    setActionLoading('expert');
    try {
      const response = await api.aplicarExpertReview(selectedCaseId, payload);
      const data = unwrapData(response);
      setSelectedCase(data);
      await refreshSelected(`${labels.diagnosis} guardado.`);
    } catch (err) {
      setError(err.message || `No se pudo guardar la revisión del ${labels.expert.toLowerCase()}.`);
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
      await refreshSelected(`${labels.quote} interno preparado. No se envió al cliente.`);
    } catch (err) {
      setError(err.message || `No se pudo preparar el ${labels.quote.toLowerCase()}.`);
    } finally {
      setActionLoading('');
    }
  };

  const handleApprove = async () => {
    if (!selectedCaseId) return;
    if (!window.confirm(`¿Confirmas la aprobación manual de esta ${labels.case.toLowerCase()}?`)) return;
    clearMessages();
    setActionLoading('approve');

    try {
      const response = await api.aprobarCase(selectedCaseId, { approvedBy: 'Admin web' });
      const data = unwrapData(response);
      setSelectedCase(data.case);
      setQuote(data.quote);
      setQuoteMissing(false);
      await refreshSelected(`${labels.case} aprobada. WhatsApp queda reservado para notificaciones por webhook.`);
    } catch (err) {
      setError(err.message || `No se pudo aprobar la ${labels.case.toLowerCase()}.`);
    } finally {
      setActionLoading('');
    }
  };

  const handleReject = async () => {
    if (!selectedCaseId) return;
    if (!window.confirm(`¿Confirmas cancelar esta ${labels.case.toLowerCase()}?`)) return;
    clearMessages();
    setActionLoading('reject');

    try {
      const response = await api.rechazarCase(selectedCaseId, { rejectedBy: 'Admin web' });
      const data = unwrapData(response);
      setSelectedCase(data.case);
      setQuote(data.quote);
      setQuoteMissing(!data.quote);
      await refreshSelected(`${labels.case} cancelada.`);
    } catch (err) {
      setError(err.message || `No se pudo cancelar la ${labels.case.toLowerCase()}.`);
    } finally {
      setActionLoading('');
    }
  };

  const buildBudgetText = () => {
    if (!selectedCase) return '';

    const vehicle = vehicleDataOf(selectedCase);
    const quoteNumber = `TEMP-${String(selectedCase.id || '').slice(-6).toUpperCase()}`;
    const recommendedWork = quoteForm.summary.trim() || selectedCase.description || 'Trabajo por confirmar según diagnóstico.';
    const terms = quoteForm.terms.trim() || quote?.terms || 'Presupuesto sujeto a disponibilidad de repuestos y validación final en taller.';

    return [
      `Presupuesto ${quoteNumber} - Turagua`,
      `Cliente: ${selectedCase.customer?.name || '-'}`,
      `Vehículo: ${vehicleSummary(selectedCase)}`,
      `Placa: ${vehicle.placa || vehicle.patente || '-'}`,
      `Diagnóstico: ${selectedCase.expertNotes || 'Pendiente de diagnóstico técnico.'}`,
      `Trabajos recomendados: ${recommendedWork}`,
      `Precio estimado: ${money(quote?.proposedPrice ?? selectedCase.estimatedPrice)}`,
      `Precio final: ${money(quote?.finalPrice ?? selectedCase.finalPrice)}`,
      `Validez: ${dateLabel(quote?.validUntil || quoteForm.validUntil)}`,
      `Condiciones: ${terms}`,
      `Estado: ${statusLabel(selectedCase.status)}`,
      '',
      'Nota interna: este texto fue copiado desde la web. El sistema no envía PDF, email, WhatsApp ni link público.'
    ].join('\n');
  };

  const handleCopyBudget = async () => {
    const text = buildBudgetText();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Resumen de presupuesto copiado. No se envió ningún mensaje automático.');
    } catch {
      setError('No se pudo copiar el presupuesto desde el navegador.');
    }
  };

  const vehicle = vehicleDataOf(selectedCase);
  const selectedPlate = vehiclePlateOf(selectedCase);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Órdenes de Taller"
        description="Flujo web de Turagua para intake vehicular, diagnóstico técnico, presupuesto interno e historial por vehículo."
        actions={(
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={RefreshCw} onClick={() => refreshSelected('Datos actualizados.')} loading={loadingList || loadingDetail}>
              Refrescar
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setShowCreate((value) => !value)}>
              {showCreate ? 'Cerrar creación' : `Crear ${labels.case}`}
            </Button>
          </div>
        )}
      />

      <MessageBanner type="error" onClose={() => setError('')}>{error}</MessageBanner>
      <MessageBanner type="success" onClose={() => setSuccess('')}>{success}</MessageBanner>

      <Card>
        <CardContent>
          <form onSubmit={handleFiltersSubmit} className="grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-3">
            <div>
              <FieldLabel>Estado</FieldLabel>
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
                placeholder="Cliente, teléfono, placa, marca, modelo o diagnóstico"
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
            <CardTitle>Crear nueva {labels.case.toLowerCase()}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCase} className="space-y-5">
              <div>
                <div className={sectionTitleClass}>Cliente</div>
                <FormGrid>
                  <div>
                    <FieldLabel>{labels.customer}</FieldLabel>
                    <Input name="customerName" value={createForm.customerName} onChange={setField(setCreateForm)} placeholder="Nombre del cliente" />
                  </div>
                  <div>
                    <FieldLabel>Teléfono / WhatsApp</FieldLabel>
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
              </div>

              <div>
                <div className={sectionTitleClass}>{labels.managedEntity}</div>
                <FormGrid>
                  <div>
                    <FieldLabel>Placa</FieldLabel>
                    <Input name="placa" value={createForm.placa} onChange={setField(setCreateForm)} placeholder="ABC-123" />
                  </div>
                  <div>
                    <FieldLabel>Marca</FieldLabel>
                    <Input name="marca" value={createForm.marca} onChange={setField(setCreateForm)} placeholder="Toyota" />
                  </div>
                  <div>
                    <FieldLabel>Modelo</FieldLabel>
                    <Input name="modelo" value={createForm.modelo} onChange={setField(setCreateForm)} placeholder="Corolla" />
                  </div>
                  <div>
                    <FieldLabel>Año</FieldLabel>
                    <Input name="anio" value={createForm.anio} onChange={setField(setCreateForm)} inputMode="numeric" placeholder="2020" />
                  </div>
                  <div>
                    <FieldLabel>Kilometraje</FieldLabel>
                    <Input name="kilometraje" value={createForm.kilometraje} onChange={setField(setCreateForm)} type="number" min="0" placeholder="85000" />
                  </div>
                  <div>
                    <FieldLabel>Canal de origen</FieldLabel>
                    <select
                      name="source"
                      value={createForm.source}
                      onChange={setField(setCreateForm)}
                      className="w-full bg-gray-900/50 border border-gray-700/80 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-primary"
                    >
                      {SOURCE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </FormGrid>
              </div>

              <div>
                <div className={sectionTitleClass}>Solicitud</div>
                <FormGrid>
                  <div>
                    <FieldLabel>{labels.service} solicitado</FieldLabel>
                    <Input name="serviceRequested" value={createForm.serviceRequested} onChange={setField(setCreateForm)} placeholder="Mantenimiento preventivo" />
                  </div>
                  <div>
                    <FieldLabel>Fecha deseada</FieldLabel>
                    <Input name="scheduledDate" value={createForm.scheduledDate} onChange={setField(setCreateForm)} type="datetime-local" />
                  </div>
                  <div>
                    <FieldLabel>Estado inicial</FieldLabel>
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
                </FormGrid>
                <div className="mt-3">
                  <FieldLabel>Síntoma / problema</FieldLabel>
                  <Textarea name="symptom" value={createForm.symptom} onChange={setField(setCreateForm)} placeholder="Describe el problema que reporta el cliente" />
                </div>
                <div className="mt-3">
                  <FieldLabel>Evidencia opcional</FieldLabel>
                  <Textarea name="evidenceUrls" value={createForm.evidenceUrls} onChange={setField(setCreateForm)} placeholder="Una URL de foto o video por línea" />
                  <FieldHint>La evidencia queda asociada a la orden web. No dispara mensajes automáticos.</FieldHint>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button type="submit" icon={Plus} loading={actionLoading === 'create'}>Crear {labels.case}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="justify-between">
              <span>Listado de {labels.cases.toLowerCase()}</span>
              <span className="text-xs font-normal text-gray-500">{pagination?.total ?? cases.length} total</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {cases.length === 0 && !loadingList ? (
              <div className="p-5">
                <EmptyState title={`No hay ${labels.cases.toLowerCase()}`} description="Ajusta filtros o crea una orden nueva." />
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
                        <EstadoBadge estado={statusLabel(caseItem.status)} />
                      </div>
                      <div className="mt-3 text-xs text-gray-400 line-clamp-2">{caseItem.description || caseItem.service?.name || 'Sin diagnóstico'}</div>
                      <div className="mt-2 text-[11px] text-gray-500 truncate">{vehicleSummary(caseItem)}</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                        <span>{statusLabel(caseItem.status)}</span>
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
              title={`Selecciona una ${labels.case.toLowerCase()}`}
              description="El detalle, presupuesto e historial aparecerán aquí."
            />
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="justify-between">
                    <span>Detalle de la {labels.case.toLowerCase()}</span>
                    <EstadoBadge estado={statusLabel(selectedCase.status)} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingDetail && <div className="text-sm text-gray-400">Cargando detalle...</div>}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <DetailRow label="ID" value={selectedCase.id} />
                    <DetailRow label="Estado" value={statusLabel(selectedCase.status)} />
                    <DetailRow label="Fuente" value={selectedCase.source || 'web'} />
                    <DetailRow label={labels.customer} value={`${selectedCase.customer?.name || '-'} · ${selectedCase.customer?.phone || '-'}`} />
                    <DetailRow label="Placa" value={selectedPlate} />
                    <DetailRow label={labels.managedEntity} value={vehicleSummary(selectedCase)} />
                    <DetailRow label="Marca" value={vehicle.marca} />
                    <DetailRow label="Modelo" value={vehicle.modelo} />
                    <DetailRow label="Año / km" value={[vehicle.anio, vehicle.kilometraje ? `${vehicle.kilometraje} km` : null].filter(Boolean).join(' · ')} />
                    <DetailRow label={labels.service} value={vehicle.servicioSolicitado || selectedCase.service?.name || selectedCase.product?.name} />
                    <DetailRow label="Precio estimado" value={money(selectedCase.estimatedPrice)} />
                    <DetailRow label="Precio final" value={money(selectedCase.finalPrice)} />
                    <DetailRow label="Fecha" value={dateLabel(selectedCase.scheduledDate)} />
                  </div>

                  <div>
                    <div className={sectionTitleClass}>Síntoma / solicitud</div>
                    <p className="rounded-xl border border-gray-800/70 bg-gray-950/40 p-4 text-sm text-gray-300 whitespace-pre-line">
                      {selectedCase.description || vehicle.sintoma || 'Sin descripción'}
                    </p>
                  </div>

                  <div>
                    <div className={sectionTitleClass}>{labels.diagnosis}</div>
                    <p className="rounded-xl border border-gray-800/70 bg-gray-950/40 p-4 text-sm text-gray-300 whitespace-pre-line">
                      {selectedCase.expertNotes || 'Pendiente de revisión técnica'}
                    </p>
                  </div>

                  {selectedCase.evidence?.length > 0 && (
                    <div>
                      <div className={sectionTitleClass}>Evidencia</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedCase.evidence.map((item, index) => (
                          <a key={`${item.url}-${index}`} href={item.url} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-xs text-primary hover:border-primary">
                            {item.type || 'archivo'} #{index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="justify-between">
                    <span>{labels.quote} interno</span>
                    <span className="text-xs font-normal text-gray-500">No se envía al cliente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                    Este presupuesto vive en la web del taller. No genera PDF, WhatsApp, email, SMS ni link público. WhatsApp queda reservado para notificaciones por webhook cuando se implemente ese canal operativo.
                  </div>

                  {quoteMissing ? (
                    <div className="rounded-xl border border-gray-800 bg-gray-950/40 p-4 text-sm text-gray-300">
                      Aún no hay presupuesto preparado para esta orden.
                    </div>
                  ) : quote ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <DetailRow label="Estado" value={quote.status === 'approved' ? 'Aprobado' : quote.status === 'rejected' ? 'Rechazado' : 'Preparado'} />
                      <DetailRow label="Propuesto" value={money(quote.proposedPrice)} />
                      <DetailRow label="Final" value={money(quote.finalPrice)} />
                      <DetailRow label="Monto aprobado" value={money(quote.approvedAmount)} />
                      <DetailRow label="Moneda" value={quote.currency} />
                      <DetailRow label="Válido hasta" value={dateLabel(quote.validUntil)} />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Presupuesto no cargado.</div>
                  )}

                  <Button type="button" variant="outline" icon={Copy} onClick={handleCopyBudget} disabled={!selectedCase}>
                    Copiar resumen interno
                  </Button>
                </CardContent>
              </Card>

              {false && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>{labels.diagnosis} técnico</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleExpertReview} className="space-y-4">
                        <div>
                          <FieldLabel>Notas del {labels.expert.toLowerCase()}</FieldLabel>
                          <Textarea name="expertNotes" value={expertForm.expertNotes} onChange={setField(setExpertForm)} placeholder="Diagnóstico, causa probable y recomendación" />
                        </div>
                        <FormGrid>
                          <div>
                            <FieldLabel>Precio estimado</FieldLabel>
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
                            <FieldLabel>Pasar a estado</FieldLabel>
                            <select
                              name="transitionTo"
                              value={expertForm.transitionTo}
                              onChange={setField(setExpertForm)}
                              className="w-full bg-gray-900/50 border border-gray-700/80 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-primary"
                            >
                              <option value="waiting_customer">Esperando aprobación</option>
                              <option value="expert_review">En diagnóstico</option>
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
                            Marcar listo para comunicación operativa. <span className="text-yellow-300">No envía mensajes desde esta pantalla.</span>
                          </span>
                        </label>
                        <div className="flex justify-end">
                          <Button type="submit" icon={Wrench} loading={actionLoading === 'expert'}>
                            Guardar {labels.diagnosis.toLowerCase()}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{labels.quote} y decisión manual</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <form onSubmit={handlePrepareQuote} className="space-y-4">
                        <div>
                          <FieldLabel>Trabajos recomendados</FieldLabel>
                          <Textarea name="summary" value={quoteForm.summary} onChange={setField(setQuoteForm)} placeholder="Lista breve de trabajos recomendados para esta orden" />
                        </div>
                        <FormGrid>
                          <div>
                            <FieldLabel>Precio estimado</FieldLabel>
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
                            <FieldLabel>Estado siguiente</FieldLabel>
                            <select
                              name="transitionTo"
                              value={quoteForm.transitionTo}
                              onChange={setField(setQuoteForm)}
                              className="w-full bg-gray-900/50 border border-gray-700/80 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-primary"
                            >
                              <option value="waiting_customer">Esperando aprobación</option>
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
                          <FieldLabel>Condiciones</FieldLabel>
                          <Textarea name="terms" value={quoteForm.terms} onChange={setField(setQuoteForm)} placeholder="Condiciones internas del presupuesto" />
                        </div>
                        <div className="flex justify-end">
                          <Button type="submit" icon={FileText} loading={actionLoading === 'quote'}>
                            Preparar {labels.quote.toLowerCase()}
                          </Button>
                        </div>
                      </form>

                      <div className="flex flex-col sm:flex-row gap-3 border-t border-gray-800 pt-5">
                        <Button variant="primary" icon={CheckCircle2} onClick={handleApprove} loading={actionLoading === 'approve'} className="flex-1">
                          Aprobar manualmente
                        </Button>
                        <Button variant="danger" icon={XCircle} onClick={handleReject} loading={actionLoading === 'reject'} className="flex-1">
                          Rechazar / cancelar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* <Card>
                <CardHeader>
                  <CardTitle className="justify-between">
                    <span>Historial del vehículo</span>
                    <span className="text-xs font-normal text-gray-500">{selectedPlate || 'sin placa'}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {historyError && (
                    <MessageBanner type="error" onClose={() => setHistoryError('')}>{historyError}</MessageBanner>
                  )}

                  {!selectedPlate ? (
                    <EmptyState icon={History} title="Sin placa registrada" description="Registra la placa para reconstruir el historial del vehículo." />
                  ) : loadingHistory ? (
                    <div className="text-sm text-gray-400">Cargando historial...</div>
                  ) : vehicleHistory.length === 0 ? (
                    <EmptyState icon={History} title="Sin visitas anteriores" description="Cuando este vehículo tenga más órdenes, aparecerán aquí." />
                  ) : (
                    <div className="space-y-3">
                      {vehicleHistory.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => loadCaseDetail(item.id)}
                          className="w-full rounded-xl border border-gray-800 bg-gray-950/40 p-4 text-left transition-colors hover:border-primary/60 hover:bg-gray-900/60"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="text-sm font-semibold text-white">{dateLabel(item.scheduledDate)}</div>
                              <div className="mt-1 text-xs text-gray-400 line-clamp-2">{item.expertNotes || item.description || 'Sin notas técnicas'}</div>
                            </div>
                            <EstadoBadge estado={statusLabel(item.status)} />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-500">
                            <span>{statusLabel(item.status)}</span>
                            <span>estimado: {money(item.estimatedPrice)}</span>
                            <span>final: {money(item.finalPrice)}</span>
                            <span>evidencia: {item.evidence?.length || 0}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card> */}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
