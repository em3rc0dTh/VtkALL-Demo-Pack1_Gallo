'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FieldLabel, Input } from '@/components/ui/Input';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { FactRow } from '@/components/shared/FactRow';

export function SettingsScreen() {
  const { profile, executionContext } = useBusinessProfile();
  const sections = ['BusinessProfile', 'Branding', 'Agent', 'Labels', 'Reference reads', 'Admin boundary'];

  return (
    <div className="grid gap-3 lg:grid-cols-[0.75fr_1.25fr]">
      <Card>
        <CardHeader><CardTitle>Secciones</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {sections.map((section, index) => (
            <button key={section} className={`w-full rounded-md px-3 py-2 text-left text-sm font-semibold ${index === 0 ? 'bg-selected-row text-action-primary' : 'text-text-secondary hover:bg-hover-row'}`}>
              {index === 0 ? '> ' : ''}{section}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>BusinessProfile backend</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel>BusinessSlug</FieldLabel>
            <Input readOnly value={profile.businessSlug || 'Sin businessSlug'} />
          </div>
          <div>
            <FieldLabel>Marca</FieldLabel>
            <Input readOnly value={profile.branding?.name || 'Sin marca'} />
          </div>
          <div>
            <FieldLabel>Agente</FieldLabel>
            <Input readOnly value={profile.agent?.name || 'Sin agente'} />
          </div>
          <div>
            <FieldLabel>Vertical</FieldLabel>
            <Input readOnly value={profile.verticalType || 'Sin vertical'} />
          </div>
          <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border-subtle bg-surface-subtle p-4">
              <span className="text-xs font-bold uppercase text-text-secondary">Reference read context</span>
              <div className="mt-3 space-y-2">
                <FactRow label="CorrelationId" value={executionContext?.correlationId || 'No enviado'} />
                <FactRow label="CausationId" value={executionContext?.causationId || 'No enviado'} />
              </div>
            </div>
            <div className="rounded-lg border border-border-subtle bg-surface-subtle p-4">
              <span className="text-xs font-bold uppercase text-text-secondary">Admin write policy</span>
              <p className="mt-3 text-sm font-semibold text-text-primary">
                Esta pantalla no ejecuta escrituras de referencia. Las escrituras admin deben pasar por backend autorizado.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
