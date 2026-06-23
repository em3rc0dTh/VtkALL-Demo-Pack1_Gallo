# PR-VIS-09 — Clientes Premium Fase 1

## Objetivo
Afrontar el archivo más gigantesco y riesgoso de todo el frontend de forma sumamente controlada, otorgándole la capa visual requerida por el estándar "Dark SaaS" sin desatar bugs en su lógica hiper-acoplada.

## Archivos involucrados
- `components/dashboard/TabClientes.js` (Componente Monolítico de > 2,670 líneas).

## Cambios realizados
- **Alcance Limitado (Cirugía Localizada)**: La intervención CSS ocurrió exclusivamente en las 100-150 primeras líneas del `return()` principal.
- Implementación de `PageHeader`.
- Inserción de un Grid con 4 `Card` de métricas, calculadas honestamente de acuerdo a los datos actuales de la página paginada.
- Refactorización de la botonera superior y de los filtros, utilizando diseños con fondo semi-transparente (`bg-gray-950/40`), y bordes muy delgados y elegantes (`border-gray-800`).
- Envolvimiento de la `<table />` HTML original dentro de un contenedor `Card-like` que brinda elevación visual, integrándola estéticamente sin tocar los mappings del interior.

## Decisiones técnicas/visuales
- **No tocar nada interno:** Se rehusó categóricamente a refactorizar la lógica interna, extraer subcomponentes o reescribir los *15* manejadores de modales detectados en el componente. Todo se contuvo en una estricta "Fase 1 Visual".

## Qué NO se tocó
- El `<tbody>` y todas las filas internas de clientes.
- Lógica de merge (fusionar clientes repetidos).
- Historiales clínicos, de mantenimiento, imágenes AWS/Locales.
- Ninguna llamada a `Swal.fire`.
- Lógica de la API o manejo de la paginación global.

## Riesgos o supuestos
- Se verificó y documentó explícitamente que el botón "Descargar CSV" se encontraba *previamente* desactivado por razones funcionales de la aplicación legacy, mitigando miedos a regresiones causadas en este PR.

## Validación
- Aceptado, renderiza correctamente. Las métricas responden fluidamente al listado de datos de la página activa.

## Siguiente paso recomendado
Pulido Final de Componentes Legacy Globales (SweetAlerts).
