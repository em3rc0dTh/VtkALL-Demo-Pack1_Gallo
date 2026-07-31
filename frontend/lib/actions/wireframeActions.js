/**
 * wireframeActions.js
 * 
 * Encapsula la emisión de eventos de acciones simuladas (wireframe)
 * para evitar la dependencia directa de los componentes en CustomEvent.
 */

export function emitWireframeAction(action) {
  if (typeof window === 'undefined') return;
  
  window.dispatchEvent(
    new CustomEvent("vtkall:wireframe-action", {
      detail: action,
    })
  );
}
