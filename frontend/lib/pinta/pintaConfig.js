export const VEHICLE_TYPES = [
  { id: 'sedan', label: 'Auto / Sedán', description: 'Sedán, hatchback y carrocerías compactas.' },
  { id: 'suv', label: 'Camioneta / SUV', description: 'SUV y camionetas de carrocería alta.' },
];

export const PAINT_ZONES = [
  { id: 'hood', label: 'Capó delantero', group: 'Frontal' },
  { id: 'roof', label: 'Techo', group: 'Superior' },
  { id: 'trunk', label: 'Maletera', group: 'Posterior' },
  { id: 'front_bumper', label: 'Parachoque delantero', group: 'Parachoques' },
  { id: 'rear_bumper', label: 'Parachoque trasero', group: 'Parachoques' },
  { id: 'front_left_door', label: 'Puerta delantera izquierda', group: 'Puertas' },
  { id: 'front_right_door', label: 'Puerta delantera derecha', group: 'Puertas' },
  { id: 'rear_left_door', label: 'Puerta trasera izquierda', group: 'Puertas' },
  { id: 'rear_right_door', label: 'Puerta trasera derecha', group: 'Puertas' },
  { id: 'front_left_fender', label: 'Guardafango delantero izquierdo', group: 'Guardafangos' },
  { id: 'front_right_fender', label: 'Guardafango delantero derecho', group: 'Guardafangos' },
  { id: 'rear_left_quarter', label: 'Guardafango posterior izquierdo', group: 'Guardafangos' },
  { id: 'rear_right_quarter', label: 'Guardafango posterior derecho', group: 'Guardafangos' },
  { id: 'left_rocker', label: 'Estribo izquierdo', group: 'Estribos' },
  { id: 'right_rocker', label: 'Estribo derecho', group: 'Estribos' },
  { id: 'left_mirror', label: 'Retrovisor izquierdo', group: 'Retrovisores' },
  { id: 'right_mirror', label: 'Retrovisor derecho', group: 'Retrovisores' },
];

export const PAINT_INTENTS = [
  { id: 'paint', label: 'Pintar', description: 'Quiero pintar las zonas seleccionadas.' },
  { id: 'repair_and_paint', label: 'Reparar + pintar', description: 'Hay abolladuras, rayones o daño antes de pintar.' },
  { id: 'evaluate_damage', label: 'Evaluar daño', description: 'Quiero una evaluación profesional antes de decidir.' },
  { id: 'not_sure', label: 'No estoy seguro', description: 'Necesito orientación de Gallo Autos.' },
];

export const WORKFLOW_STEPS = [
  { id: 'vehicle', label: 'Vehículo' },
  { id: 'zones', label: 'Zonas' },
  { id: 'intent', label: 'Necesidad' },
  { id: 'details', label: 'Datos' },
  { id: 'review', label: 'Revisión' },
];

export function zoneLabel(zoneId) {
  return PAINT_ZONES.find((zone) => zone.id === zoneId)?.label ?? zoneId;
}
