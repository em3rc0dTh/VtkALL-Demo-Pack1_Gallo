'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Clock3, ImageIcon, Loader2, MapPin, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FieldLabel, Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { businessProfileRepository } from '@/lib/businessProfile/businessProfileRepository';
import { resolvePublicAssetUrl } from '@/lib/assets/publicAssetUrl';

const sections = [
  { id: 'identity', label: 'Identidad', icon: Building2 },
  { id: 'contact', label: 'Contacto', icon: Phone },
  { id: 'location', label: 'Ubicacion', icon: MapPin },
  { id: 'hours', label: 'Horarios', icon: Clock3 },
];

const emptyDraft = {
  displayName: '',
  logoUrl: '',
  tagline: '',
  primaryPhone: '',
  whatsapp: '',
  email: '',
  locationId: 'main',
  locationName: '',
  addressLine: '',
  reference: '',
  district: '',
  city: '',
  country: '',
  latitude: '',
  longitude: '',
  directionsUrl: '',
  weekdays: '',
  saturday: '',
  sunday: '',
  summary: '',
};

const draftFromSettings = (settings = {}) => ({
  displayName: settings.brand?.displayName || settings.branding?.displayName || '',
  logoUrl: settings.brand?.logoUrl || settings.branding?.logoUrl || '',
  tagline: settings.brand?.tagline || settings.branding?.tagline || '',
  primaryPhone: settings.contact?.primaryPhone || '',
  whatsapp: settings.contact?.whatsapp || '',
  email: settings.contact?.email || '',
  locationId: settings.primaryLocation?.id || 'main',
  locationName: settings.primaryLocation?.name || '',
  addressLine: settings.primaryLocation?.addressLine || '',
  reference: settings.primaryLocation?.reference || '',
  district: settings.primaryLocation?.district || '',
  city: settings.primaryLocation?.city || '',
  country: settings.primaryLocation?.country || '',
  latitude: settings.primaryLocation?.latitude ?? '',
  longitude: settings.primaryLocation?.longitude ?? '',
  directionsUrl: settings.primaryLocation?.directionsUrl || '',
  weekdays: settings.commercialHours?.weekdays || '',
  saturday: settings.commercialHours?.saturday || '',
  sunday: settings.commercialHours?.sunday || '',
  summary: settings.commercialHours?.summary || '',
});

const logoFileLabel = (logoUrl) => {
  if (!logoUrl) return 'Sin logo cargado';
  const fileName = String(logoUrl).split('/').filter(Boolean).pop() || 'logo';
  return `Archivo: ${decodeURIComponent(fileName)}`;
};

const fieldsFromError = (error) => error?.details?.fields || error?.details?.details?.fields || {};

export function SettingsScreen() {
  const { profile, refetchProfile } = useBusinessProfile();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('identity');
  const [version, setVersion] = useState(0);
  const [savedDraft, setSavedDraft] = useState(emptyDraft);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(savedDraft), [draft, savedDraft]);

  useEffect(() => {
    let mounted = true;
    businessProfileRepository.getBusinessProfileSettings({ businessSlug: profile.businessSlug })
      .then((settings) => {
        if (!mounted) return;
        const nextDraft = draftFromSettings(settings);
        setVersion(Number(settings.version || 0));
        setDraft(nextDraft);
        setSavedDraft(nextDraft);
        setMessage('Todos los cambios estan guardados');
      })
      .catch((err) => mounted && setMessage(err.message || 'No pudimos cargar los ajustes.'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [profile.businessSlug]);

  const update = (key, value) => {
    setErrors((current) => ({ ...current, [key]: '' }));
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage('Cambios sin guardar');
  };

  const validate = () => {
    const nextErrors = {};
    if (!draft.displayName.trim()) nextErrors.displayName = 'El nombre visible es obligatorio.';
    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) nextErrors.email = 'Correo invalido.';
    if (draft.logoUrl !== savedDraft.logoUrl && draft.logoUrl && !/^\/uploads\/business\/|^https:\/\//i.test(draft.logoUrl)) {
      nextErrors.logoUrl = 'El logo debe subirse antes de guardar los ajustes.';
    }
    if (draft.directionsUrl && !/^https?:\/\//i.test(draft.directionsUrl)) nextErrors.directionsUrl = 'Usa una URL valida.';
    for (const key of ['latitude', 'longitude']) {
      if (draft[key] !== '' && !Number.isFinite(Number(draft[key]))) nextErrors[key] = 'Debe ser numerico.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const uploadLogo = async (file) => {
    if (!file) return;
    setUploadingLogo(true);
    setMessage('Subiendo logo...');
    try {
      const payload = await businessProfileRepository.uploadBusinessLogo({ businessSlug: profile.businessSlug, file });
      if (typeof payload?.logoUrl !== 'string' || !payload.logoUrl.startsWith('/uploads/business/')) {
        throw new Error('El servidor no devolvio una URL valida para el logo.');
      }
      update('logoUrl', payload.logoUrl);
      setMessage('Logo cargado. Guarda los ajustes para persistirlo.');
    } catch (err) {
      setErrors((current) => ({ ...current, logoUrl: err.message || 'No pudimos subir el logo.' }));
      setMessage(err.message || 'No pudimos subir el logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const save = async () => {
    if (!dirty || saving || uploadingLogo) return;
    if (!validate()) {
      setMessage('Hay datos invalidos');
      return;
    }
    setSaving(true);
    setMessage('Guardando...');
    try {
      const brand = {
        displayName: draft.displayName,
        tagline: draft.tagline,
      };
      if (draft.logoUrl !== savedDraft.logoUrl) {
        brand.logoUrl = draft.logoUrl || null;
      }

      const updated = await businessProfileRepository.updateBusinessProfileSettings({
        businessSlug: profile.businessSlug,
        expectedVersion: version,
        changes: {
          brand,
          contact: {
            primaryPhone: draft.primaryPhone,
            whatsapp: draft.whatsapp,
            email: draft.email,
          },
          primaryLocation: {
            id: draft.locationId || 'main',
            name: draft.locationName,
            addressLine: draft.addressLine,
            reference: draft.reference,
            district: draft.district,
            city: draft.city,
            country: draft.country,
            latitude: draft.latitude === '' ? null : Number(draft.latitude),
            longitude: draft.longitude === '' ? null : Number(draft.longitude),
            directionsUrl: draft.directionsUrl,
          },
          commercialHours: {
            weekdays: draft.weekdays,
            saturday: draft.saturday,
            sunday: draft.sunday,
            summary: draft.summary,
          },
        },
      });
      const nextDraft = draftFromSettings(updated);
      setVersion(Number(updated.version || version + 1));
      setDraft(nextDraft);
      setSavedDraft(nextDraft);
      await refetchProfile?.();
      await queryClient.invalidateQueries({ queryKey: ['landing-page', 'public', profile.businessSlug, 'home'] });
      await queryClient.invalidateQueries({ queryKey: ['landing-page', 'admin', profile.businessSlug, 'home'] });
      setMessage('Ajustes guardados');
    } catch (err) {
      const fieldErrors = fieldsFromError(err);
      if (fieldErrors['brand.logoUrl'] || fieldErrors['branding.logoUrl'] || fieldErrors.logoUrl) {
        setErrors((current) => ({
          ...current,
          logoUrl: fieldErrors['brand.logoUrl'] || fieldErrors['branding.logoUrl'] || fieldErrors.logoUrl,
        }));
      }
      if (err.code === 'BUSINESS_PROFILE_VERSION_CONFLICT' || err.status === 409) {
        setMessage('Los ajustes cambiaron en otra sesion. Recarga los datos antes de guardar.');
      } else {
        setMessage(err.message || 'No pudimos guardar los cambios');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-lg border border-border-subtle bg-surface-panel p-4 text-sm font-bold text-text-secondary">Cargando ajustes...</div>;
  }

  const active = sections.find((section) => section.id === activeSection) || sections[0];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border-subtle bg-surface-app/95 pb-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-primary">Ajustes Generales</h1>
          <p className="text-sm text-text-secondary">Datos e identidad del negocio.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-black">
            <span className="rounded border border-border-subtle bg-surface-subtle px-2 py-1 text-text-secondary">Perfil del negocio: {profile.branding?.displayName || profile.brand?.displayName || profile.businessName || profile.businessSlug}</span>
            <span className="rounded border border-action-primary/30 bg-action-primary/10 px-2 py-1 text-action-primary">businessSlug: {profile.businessSlug}</span>
          </div>
          <p className={`mt-1 text-xs font-black ${dirty ? 'text-status-warning' : 'text-status-success'}`}>{message}</p>
        </div>
        <Button onClick={save} disabled={!dirty || saving || uploadingLogo}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {uploadingLogo ? 'Subiendo logo...' : saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>

      <div className="grid min-h-0 gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
        <Card className="self-start">
          <CardContent className="grid gap-2 p-3">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-black transition ${activeSection === section.id ? 'bg-selected-row text-action-primary' : 'text-text-secondary hover:bg-hover-row'}`}
                >
                  <span className="inline-flex items-center gap-2"><Icon className="h-4 w-4" />{section.label}</span>
                  {dirty ? <span className="h-2 w-2 rounded-full bg-action-primary" /> : null}
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{active.label}</CardTitle>
            <p className="text-sm text-text-secondary">{sectionDescription(activeSection)}</p>
          </CardHeader>
          <CardContent className="grid gap-4">
            {activeSection === 'identity' ? (
              <IdentitySection draft={draft} errors={errors} update={update} uploadLogo={uploadLogo} uploadingLogo={uploadingLogo} />
            ) : null}
            {activeSection === 'contact' ? (
              <ContactSection draft={draft} errors={errors} update={update} />
            ) : null}
            {activeSection === 'location' ? (
              <LocationSection draft={draft} errors={errors} update={update} />
            ) : null}
            {activeSection === 'hours' ? (
              <HoursSection draft={draft} errors={errors} update={update} />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function sectionDescription(section) {
  if (section === 'identity') return 'Nombre, logo y tagline que hereda la landing.';
  if (section === 'contact') return 'Canales principales del negocio.';
  if (section === 'location') return 'Sede principal, referencia y navegacion.';
  return 'Horarios comerciales visibles en la landing.';
}

function IdentitySection({ draft, errors, update, uploadLogo, uploadingLogo }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="grid gap-3">
        <SettingsField label="Nombre visible" value={draft.displayName} error={errors.displayName} onChange={(value) => update('displayName', value)} />
        <SettingsField label="Tagline" value={draft.tagline} onChange={(value) => update('tagline', value)} />
      </div>
      <div className="rounded-lg border border-border-subtle bg-surface-subtle p-4">
        <FieldLabel>Logo actual</FieldLabel>
        <div className="mb-3 flex h-28 items-center justify-center rounded-lg border border-border-default bg-slate-950 p-3">
          {draft.logoUrl ? <img src={resolvePublicAssetUrl(draft.logoUrl)} alt="Logo actual" className="max-h-full max-w-full object-contain" /> : <ImageIcon className="h-8 w-8 text-text-muted" />}
        </div>
        <p className="mb-3 text-xs font-bold text-text-secondary">{logoFileLabel(draft.logoUrl)}</p>
        <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-border-default bg-surface-panel px-3 py-2 text-sm font-black text-text-secondary hover:border-action-primary hover:text-action-primary">
          {uploadingLogo ? 'Subiendo...' : 'Cambiar logo'}
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => uploadLogo(event.target.files?.[0])} />
        </label>
        {errors.logoUrl ? <p className="mt-2 text-xs font-bold text-status-danger">{errors.logoUrl}</p> : null}
        {draft.logoUrl ? <button type="button" onClick={() => update('logoUrl', '')} className="mt-2 text-xs font-black text-status-danger">Eliminar logo</button> : null}
      </div>
    </div>
  );
}

function ContactSection({ draft, errors, update }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <SettingsField label="Telefono principal" value={draft.primaryPhone} onChange={(value) => update('primaryPhone', value)} />
      <SettingsField label="WhatsApp" value={draft.whatsapp} onChange={(value) => update('whatsapp', value)} />
      <SettingsField label="Correo" value={draft.email} error={errors.email} onChange={(value) => update('email', value)} />
    </div>
  );
}

function LocationSection({ draft, errors, update }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="grid gap-3 md:grid-cols-2">
        <SettingsField label="Nombre de sede" value={draft.locationName} onChange={(value) => update('locationName', value)} />
        <SettingsField label="Direccion" value={draft.addressLine} onChange={(value) => update('addressLine', value)} />
        <SettingsField label="Referencia" value={draft.reference} onChange={(value) => update('reference', value)} />
        <SettingsField label="Distrito" value={draft.district} onChange={(value) => update('district', value)} />
        <SettingsField label="Ciudad" value={draft.city} onChange={(value) => update('city', value)} />
        <SettingsField label="Pais" value={draft.country} onChange={(value) => update('country', value)} />
        <SettingsField label="Latitud" value={draft.latitude} error={errors.latitude} onChange={(value) => update('latitude', value)} />
        <SettingsField label="Longitud" value={draft.longitude} error={errors.longitude} onChange={(value) => update('longitude', value)} />
        <SettingsField label="URL Como llegar" value={draft.directionsUrl} error={errors.directionsUrl} onChange={(value) => update('directionsUrl', value)} />
      </div>
      <div className="rounded-lg border border-border-subtle bg-surface-subtle p-4">
        <FieldLabel>Preview de ubicacion</FieldLabel>
        <div className="mt-2 rounded-lg border border-border-default bg-surface-panel p-4 text-sm leading-6 text-text-secondary">
          <strong className="block text-text-primary">{draft.locationName || draft.displayName || 'Sede principal'}</strong>
          <span>{draft.addressLine || 'Direccion pendiente'}</span>
          {draft.reference ? <span className="block">{draft.reference}</span> : null}
          <span className="block">{[draft.district, draft.city, draft.country].filter(Boolean).join(', ')}</span>
        </div>
      </div>
    </div>
  );
}

function HoursSection({ draft, update }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <SettingsField label="Lunes a viernes" value={draft.weekdays} onChange={(value) => update('weekdays', value)} />
      <SettingsField label="Sabados" value={draft.saturday} onChange={(value) => update('saturday', value)} />
      <SettingsField label="Domingos" value={draft.sunday} onChange={(value) => update('sunday', value)} />
      <SettingsField label="Resumen visible" value={draft.summary} onChange={(value) => update('summary', value)} />
    </div>
  );
}

function SettingsField({ label, value, error, onChange }) {
  return (
    <label>
      <FieldLabel>{label}</FieldLabel>
      <Input value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
      {error ? <p className="mt-1 text-xs font-bold text-status-danger">{error}</p> : null}
    </label>
  );
}
