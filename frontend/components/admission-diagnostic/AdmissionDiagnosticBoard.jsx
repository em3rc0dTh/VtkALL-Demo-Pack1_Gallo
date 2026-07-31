import { useState, useMemo } from 'react';
import { ADMISSION_DIAGNOSTIC_STAGES } from './admissionDiagnosticStages';
import { AdmissionDiagnosticColumn } from './AdmissionDiagnosticColumn';
import { AdmissionDiagnosticDrawer } from './AdmissionDiagnosticDrawer';

export function AdmissionDiagnosticBoard({ items, onChanged }) {
  const [selectedItem, setSelectedItem] = useState(null);

  // Agrupar items por boardStage y luego por appointmentKind
  const itemsByStage = useMemo(() => {
    const grouped = {};
    items.forEach(item => {
      const stage = item.boardStage;
      const kind = item.appointmentKind;
      
      if (!grouped[stage]) {
        grouped[stage] = { evaluation: [], service: [] };
      }
      if (grouped[stage][kind]) {
        grouped[stage][kind].push(item);
      }
    });
    return grouped;
  }, [items]);

  return (
    <>
      <div className="overflow-x-auto pb-4 h-full w-full">
        <div className="flex gap-2 lg:gap-3 h-full w-full items-start">
          {ADMISSION_DIAGNOSTIC_STAGES.map(stage => (
            <AdmissionDiagnosticColumn
              key={stage.key}
              stage={stage.key}
              title={stage.title}
              icon={stage.icon}
              colorClass={stage.colorClass}
              borderColor={stage.borderColor}
              items={itemsByStage[stage.key] || { evaluation: [], service: [] }}
              onSelectItem={setSelectedItem}
            />
          ))}
        </div>
      </div>

      {selectedItem && (
        <AdmissionDiagnosticDrawer 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
          onChanged={onChanged}
        />
      )}
    </>
  );
}
