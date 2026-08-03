import { useState, useEffect } from 'react';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { CatalogOfferingSelector } from '../catalog/CatalogOfferingSelector';
import { AvailabilityForm } from '../availability/AvailabilityForm';
import { AvailabilitySlotList } from '../availability/AvailabilitySlotList';
import { useCatalogOfferings } from '@/hooks/server-state/useCatalogOfferings';
import { useAvailabilityQuery } from '@/hooks/server-state/useAvailabilityQuery';
import { Button } from '@/components/ui/Button';

export function DemoTestSchedulingFlow({ activeCase, onSlotSelected }) {
  const { profile } = useBusinessProfile();
  
  const [selectedOfferingId, setSelectedOfferingId] = useState(null);
  const [searchDate, setSearchDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  // 1. Catálogo
  const { data: offerings } = useCatalogOfferings({
    businessSlug: profile.businessSlug,
    verticalType: profile.verticalType
  });

  const offering = offerings?.find(o => o._id === selectedOfferingId);

  // Parámetros derivados
  const teamId = offering?.fulfillmentPolicy?.suggestedTeamId;
  const durationMinutes = offering?.fulfillmentPolicy?.estimatedDurationMinutes;

  // 2. Disponibilidad
  const availabilityQuery = useAvailabilityQuery({
    businessSlug: profile.businessSlug,
    teamId,
    date: searchDate,
    durationMinutes,
    timezone: profile.timezone,
    catalogOfferingId: selectedOfferingId,
    caseId: activeCase?._id,
    // Podríamos pasar caseId si el backend lo pide, la query key ya permite agregarlo
    // caseId: activeCase._id 
  });

  // Handlers para limpiar selección al cambiar dependencias
  const handleOfferingSelect = (offeringId) => {
    setSelectedOfferingId(offeringId);
    setSelectedSlot(null);
  };

  const handleDateChange = (newDate) => {
    setSearchDate(newDate);
    setSelectedSlot(null);
  };

  const slots = availabilityQuery.data?.slots ?? [];
  const error = availabilityQuery.error;
  const hasSearched = availabilityQuery.isSuccess || availabilityQuery.isError;

  return (
    <div className="space-y-8">
      
      {/* SECCIÓN 1: Selección de Servicio */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">1. Seleccionar Servicio</h3>
        <CatalogOfferingSelector 
          businessSlug={profile.businessSlug}
          verticalType={profile.verticalType}
          selectedOfferingId={selectedOfferingId}
          onSelect={(offering) => handleOfferingSelect(offering._id)}
        />
      </section>

      {/* SECCIÓN 2: Consulta de Disponibilidad */}
      {selectedOfferingId && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">2. Consultar Disponibilidad</h3>
          
          <AvailabilityForm 
            offering={offering}
            timezone={profile.timezone}
            date={searchDate}
            onDateChange={handleDateChange}
            isFetching={availabilityQuery.isFetching}
          />

          {error && (
            <div className="rounded border border-border-danger bg-surface-danger p-3 text-sm text-text-danger whitespace-pre-wrap">
              Error: {error.code ? `${error.code}: ${error.message}` : error.message}
              {error.details ? `\n${JSON.stringify(error.details, null, 2)}` : ''}
            </div>
          )}

          {!error && hasSearched && slots.length === 0 && (
            <div className="p-4 rounded border border-border-warning bg-surface-warning text-text-warning text-sm font-medium">
              No hay disponibilidad para la fecha seleccionada.
            </div>
          )}

          {!error && slots.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-text-secondary">Cupos disponibles:</h4>
              <AvailabilitySlotList 
                slots={slots}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
              />
            </div>
          )}
        </section>
      )}

      {/* Acción final delegada al padre */}
      <div className="pt-4 flex justify-end">
        <Button 
          disabled={!selectedSlot}
          onClick={() => onSlotSelected({ offering, slot: selectedSlot, date: searchDate })}
        >
          Confirmar Selección de Turno
        </Button>
      </div>

    </div>
  );
}
