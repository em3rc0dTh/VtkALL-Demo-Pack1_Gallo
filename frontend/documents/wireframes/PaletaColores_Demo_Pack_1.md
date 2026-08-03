# Decisión de paleta visual — VtkALL Neutral Operational UI v1

## 1. Principio general

La paleta visual base de VtkALL no debe depender de una marca específica como Turagua, BateYLate u otro cliente futuro.

Debe funcionar como una **paleta operacional neutral**, diseñada para cumplir heurísticas mínimas de UX/UI:

```text
1. Legibilidad.
2. Contraste.
3. Jerarquía visual clara.
4. Semántica operacional consistente.
5. Accesibilidad.
6. Fatiga visual baja.
7. Escalabilidad entre pantallas.
8. Facilidad de tematización futura.
```

La regla central es:

```text
La marca es editable.
La semántica operacional no.
```

Es decir, cada cliente o vertical puede modificar colores de marca, pero los colores que comunican riesgo, advertencia, éxito, información o estado neutro deben mantenerse estables para que la experiencia sea consistente.

---

## 2. Paleta base recomendada

```text
BASE / APP

App background              #F8FAFC
Panel background            #FFFFFF
Subtle background           #F1F5F9
Elevated surface            #FFFFFF
Sidebar dark                #0F172A
Header dark                 #111827


TEXT

Text primary                #0F172A
Text secondary              #475569
Text muted                  #64748B
Text disabled               #94A3B8
Text inverse                #F8FAFC


BORDER / DIVIDERS

Border subtle               #E2E8F0
Border default              #CBD5E1
Border strong               #94A3B8
Focus ring                  #2563EB


ACTION

Primary action              #2563EB
Primary action hover        #1D4ED8
Primary action soft         #DBEAFE
Secondary action            #475569
Disabled action             #CBD5E1


STATUS / OPERATIONAL

Danger                      #DC2626
Danger soft                 #FEE2E2
Warning                     #D97706
Warning soft                #FEF3C7
Success                     #16A34A
Success soft                #DCFCE7
Info                        #2563EB
Info soft                   #DBEAFE
Neutral                     #64748B
Neutral soft                #F1F5F9


SPECIAL

Selected row                #EFF6FF
Hover row                   #F8FAFC
Code / raw response bg      #0F172A
Code / raw response text    #E5E7EB
```

---

## 3. Justificación de la paleta

Esta paleta usa una base **neutral azul-gris**, no una identidad comercial específica.

Eso permite que VtkALL pueda adaptarse a múltiples verticales sin rediseñar la lógica visual:

```text
Turagua       → taller automotriz
BateYLate     → repostería / pedidos personalizados
Veterinaria   → atención de mascotas
Clínica       → atención médica
Belleza       → agenda y tratamientos
Óptica        → órdenes ópticas
Reparación    → equipos técnicos
```

La paleta separa cuatro capas visuales:

```text
1. Superficies:
   fondos, paneles, cards, sidebar y headers.

2. Texto:
   jerarquía de lectura, datos críticos, datos secundarios y estados deshabilitados.

3. Acción:
   botones primarios, secundarios, foco y acciones deshabilitadas.

4. Estado operacional:
   peligro, advertencia, éxito, información y neutralidad.
```

Esto evita que un color de marca se use incorrectamente para representar urgencia, error o éxito.

---

## 4. Regla de tematización futura

Cuando se adapte VtkALL a una marca específica, solo deberían cambiarse los tokens de marca:

```text
brand.primary
brand.secondary
brand.accent
```

No deberían cambiarse los tokens funcionales:

```text
status.danger
status.warning
status.success
status.info
status.neutral
text.*
surface.*
border.*
```

Razón:

```text
Los colores de marca comunican identidad.
Los colores operacionales comunican decisión.
```

Si cada cliente cambia el rojo, el ámbar, el verde o los grises base, el sistema perderá consistencia, accesibilidad y velocidad de lectura.

---

## 5. Uso de fondos

### App background — `#F8FAFC`

Debe usarse como fondo general de la aplicación.

Aplicar en:

```text
Admin shell
Área principal de trabajo
Fondo detrás de cards
Pantallas de consola
Vistas de dashboard
```

Justificación:

```text
Evita el blanco puro en toda la pantalla.
Reduce fatiga visual.
Permite que las cards blancas destaquen.
```

---

### Panel background — `#FFFFFF`

Debe usarse para paneles, cards, formularios y modales.

Aplicar en:

```text
Cards de órdenes
Cards de clientes
Panel de servicio seleccionado
Panel de mensaje seleccionado
Formularios
Modales
Drawers
```

Justificación:

```text
El blanco debe reservarse para áreas de trabajo activas.
Genera separación clara frente al fondo general.
```

---

### Subtle background — `#F1F5F9`

Debe usarse para zonas secundarias o de bajo énfasis.

Aplicar en:

```text
Campos readonly
Filtros compactos
Bloques colapsados
Empty states
Secciones auxiliares
Fondos suaves dentro de paneles
```

No usar en:

```text
Alertas críticas
Errores
Estados urgentes
Acciones principales
```

---

### Sidebar dark — `#0F172A`

Debe usarse para sidebar o navegación principal en modo admin.

Aplicar en:

```text
Sidebar
Menú lateral persistente
Bloque de usuario/admin
Navegación principal
```

Justificación:

```text
Genera contraste fuerte.
Ordena la pantalla.
Separa navegación de operación.
Permite que el área de trabajo respire.
```

---

### Header dark — `#111827`

Debe usarse para headers fuertes o superficies oscuras institucionales.

Aplicar en:

```text
Header superior oscuro
Paneles técnicos
Encabezados de consola
Fondos de preview oscuro
```

---

## 6. Uso de texto

### Text primary — `#0F172A`

Usar para datos críticos.

Aplicar en:

```text
Títulos de pantalla
Nombre de cliente
Número de orden
Placa / vehículo / entidad gestionada
Monto cotizado
Monto aprobado
Estado principal
Próxima acción
```

Regla:

```text
Todo dato necesario para decidir debe usar text primary o un peso visual equivalente.
```

---

### Text secondary — `#475569`

Usar para información complementaria.

Aplicar en:

```text
Descripciones
Subtítulos
Labels secundarios
Resumen de paneles
Datos contextuales
```

---

### Text muted — `#64748B`

Usar para metadatos o información de menor prioridad.

Aplicar en:

```text
Timestamps
Hints
Notas auxiliares
Metadata de timeline
Descripción secundaria
```

No usar para:

```text
Errores
Próxima acción
Estados críticos
Montos
Información obligatoria
```

---

### Text disabled — `#94A3B8`

Usar solo cuando algo no está disponible.

Aplicar en:

```text
Campos deshabilitados
Acciones no disponibles
Placeholders secundarios
Steps futuros no disponibles
```

Regla:

```text
No usar text disabled para información real que el usuario necesita leer.
```

---

### Text inverse — `#F8FAFC`

Usar sobre fondos oscuros.

Aplicar en:

```text
Sidebar oscuro
Header oscuro
Raw response panel oscuro
Botones sólidos oscuros
```

---

## 7. Bordes y foco

### Border subtle — `#E2E8F0`

Usar para divisores suaves.

Aplicar en:

```text
Divisiones internas de cards
Separadores de tablas
Bordes suaves de paneles
```

---

### Border default — `#CBD5E1`

Usar para bordes estándar.

Aplicar en:

```text
Inputs
Selects
Textareas
Cards principales
Contenedores
```

---

### Border strong — `#94A3B8`

Usar para mayor separación visual.

Aplicar en:

```text
Paneles activos
Separación entre columnas
Estados seleccionados de baja prioridad
```

---

### Focus ring — `#2563EB`

Usar para estado de foco.

Aplicar en:

```text
Input enfocado
Select enfocado
Textarea enfocado
Botón enfocado
Elemento navegable por teclado
```

Regla:

```text
Todo elemento interactivo debe tener foco visible.
```

---

## 8. Acciones

### Primary action — `#2563EB`

Usar para la acción principal de una pantalla, panel o modal.

Ejemplos:

```text
[Crear cita]
[Guardar cambios]
[Crear Case]
[Buscar disponibilidad]
[Schedule Consultation]
[Enviar respuesta]
[Guardar excepción]
```

Regla:

```text
Una zona de decisión debe tener una sola acción primaria dominante.
```

No usar primary action para:

```text
Eliminar
Cancelar permanentemente
Rechazar
Desactivar
Resolver errores críticos
```

---

### Primary action hover — `#1D4ED8`

Usar para hover o active state del botón primario.

---

### Primary action soft — `#DBEAFE`

Usar para selección suave.

Aplicar en:

```text
Tab activo
Step activo suave
Fila seleccionada
Badge informativo suave
Background de selección
```

---

### Secondary action — `#475569`

Usar para acciones secundarias.

Ejemplos:

```text
[Ver agenda]
[Actualizar]
[Copiar JSON]
[Ver caso]
[Limpiar]
[Cancelar]
```

---

### Disabled action — `#CBD5E1`

Usar para botones no disponibles.

Regla:

```text
Un botón deshabilitado debe explicar por qué no está disponible cuando sea crítico.
```

Ejemplo:

```text
[Emitir diagnóstico] disabled
Motivo: faltan fotos mínimas y firma.
```

---

## 9. Estados operacionales

## 9.1 Danger — `#DC2626`

Significado:

```text
Urgencia, error, bloqueo, riesgo real o pérdida operacional.
```

Usar para:

```text
Mensaje fallido
Double booking
Backend error
Trabajo detenido
Servicio publicado con riesgo público
Cita en riesgo
Cliente con conflicto crítico
Excepción con citas afectadas
No disponible con trabajos asignados
Hallazgo crítico
Retraso grave
```

Texto obligatorio:

```text
ROJO · Fallido
ROJO · Riesgo público
ROJO · Detenido
ROJO · Conflicto
ROJO · Urgente / varado
Estado: Fallido
Error: DOUBLE_BOOKING_CONFLICT
```

Regla:

```text
Rojo significa atender inmediatamente.
No debe usarse como decoración.
```

Tratamiento recomendado:

```text
Badge rojo
Texto rojo
Borde izquierdo rojo
Fondo rojo suave solo si el elemento completo es crítico
```

---

## 9.2 Danger soft — `#FEE2E2`

Usar como fondo suave de alerta crítica.

Aplicar en:

```text
BackendErrorPanel
Resumen de error
Fila crítica seleccionada
Card con riesgo público
Advertencia de bloqueo grave
```

No usar para todo el panel si hay muchas alertas, porque genera fatiga visual.

---

## 9.3 Warning — `#D97706`

Significado:

```text
Pendiente, incompleto, próximo a vencer o requiere revisión.
```

Usar para:

```text
Pendiente de confirmar
Cotización vence hoy
Admisión incompleta
Pendiente de fotos
QC pendiente
Servicio incompleto no publicado
Mensaje pendiente
Capacidad reducida
Aprobado parcial
Concepto pendiente de aprobación
```

Texto obligatorio:

```text
ÁMBAR · Incompleto
ÁMBAR · Pendiente
ÁMBAR · Vence hoy
ÁMBAR · QC pendiente
ÁMBAR · Capacidad reducida
ÁMBAR · Aprobado parcial
```

Regla:

```text
Ámbar no es error.
Ámbar significa revisar antes de que se convierta en problema.
```

---

## 9.4 Warning soft — `#FEF3C7`

Usar como fondo suave para advertencias.

Aplicar en:

```text
Cards incompletas
Campos pendientes
Cotización por vencer
QC pendiente
Admisión incompleta
```

---

## 9.5 Success — `#16A34A`

Significado:

```text
Correcto, disponible, aprobado, completo o listo.
```

Usar para:

```text
Cita confirmada
Cotización aprobada
Servicio completo
Bahía disponible
Personal disponible
QC completo
Listo para entrega
Step completado
Reserva booked exitosa
Admisión completa
```

Texto obligatorio:

```text
VERDE · Completo
VERDE · Disponible
VERDE · Confirmado
VERDE · Aprobado
VERDE · QC completo
VERDE · Listo para entrega
```

Regla:

```text
No todo lo “terminado” es verde.
Si falta QC, entrega, evidencia o confirmación, debe ser ámbar.
```

---

## 9.6 Success soft — `#DCFCE7`

Usar como fondo suave de éxito.

Aplicar en:

```text
Confirmaciones
Step completado
Reserva creada
Servicio completo
Disponibilidad positiva
```

---

## 9.7 Info — `#2563EB`

Significado:

```text
Información estable, proceso en curso o elemento seleccionado.
```

Usar para:

```text
En diagnóstico
En ejecución normal
Mensaje enviado
Mensaje leído
Step activo
Fila seleccionada
Timeline informativo
Estado operativo sin riesgo
Caso recibido
```

Texto obligatorio:

```text
AZUL · En diagnóstico
AZUL · En ejecución
AZUL · Enviado
AZUL · Informativo
AZUL · Step activo
```

Regla:

```text
El azul de información puede compartir base con el botón primario,
pero debe tener tratamiento visual distinto.
```

Ejemplo:

```text
Botón primario:
fondo azul sólido + texto blanco.

Badge informativo:
fondo azul suave + texto azul.
```

---

## 9.8 Info soft — `#DBEAFE`

Usar como fondo suave informativo.

Aplicar en:

```text
Step activo
Mensaje enviado
Fila seleccionada
Estado en curso normal
Timeline informativo
```

---

## 9.9 Neutral — `#64748B`

Significado:

```text
Neutro, inactivo, histórico, cerrado o sin urgencia.
```

Usar para:

```text
Servicio inactivo
Caso cerrado
Mensaje informativo
Historial
Datos secundarios
Step pendiente
Campos readonly
Cancelado
Entregado histórico
```

Texto obligatorio:

```text
GRIS · Inactivo
GRIS · Cerrado
GRIS · Solo informativo
GRIS · Pendiente futuro
```

Regla:

```text
No usar gris para pendientes importantes.
Si requiere acción, no es gris.
```

---

## 9.10 Neutral soft — `#F1F5F9`

Usar como fondo neutro.

Aplicar en:

```text
Cards inactivas
Readonly panels
Filtros
Empty states
Timeline histórico
```

---

## 10. Patrón visual recomendado para cards

Las cards operativas deben seguir este patrón:

```text
Fondo: blanco
Borde: Border subtle
Badge: color operacional
Borde izquierdo opcional: color operacional
Texto: explícito
Acción: botón con verbo específico
```

Ejemplo:

```text
+------------------------------+
| ROJO · Riesgo público        |
| Diagnóstico general          |
| Precio: falta definir        |
| Duración: falta definir      |
| Publicado                    |
| [Ocultar hasta completar]    |
+------------------------------+
```

No se recomienda llenar toda la card con rojo, ámbar o verde.

Mejor usar:

```text
Badge semántico
Borde izquierdo semántico
Fondo suave solo cuando sea necesario
Texto operativo claro
```

---

## 11. Patrón de badges

Los badges deben usar color + texto.

Formato recomendado:

```text
COLOR · significado
```

Ejemplos:

```text
ROJO · Fallido
ROJO · Riesgo público
ÁMBAR · Pendiente
ÁMBAR · Incompleto
VERDE · Completo
VERDE · Disponible
AZUL · Enviado
AZUL · En diagnóstico
GRIS · Inactivo
GRIS · Solo informativo
```

Estructura visual:

```text
Danger badge:
fondo #FEE2E2 + texto #DC2626

Warning badge:
fondo #FEF3C7 + texto #D97706

Success badge:
fondo #DCFCE7 + texto #16A34A

Info badge:
fondo #DBEAFE + texto #2563EB

Neutral badge:
fondo #F1F5F9 + texto #64748B
```

Regla:

```text
Nunca usar color sin texto.
Nunca usar solo ícono.
Nunca usar solo punto de color.
```

---

## 12. Botones

### Primary

```text
Fondo: #2563EB
Hover: #1D4ED8
Texto: #FFFFFF
```

Usar para la acción principal.

Ejemplos:

```text
[Crear cita]
[Guardar cambios]
[Buscar disponibilidad]
[Crear Case]
[Enviar respuesta]
```

---

### Secondary

```text
Fondo: #FFFFFF
Borde: #CBD5E1
Texto: #475569
```

Usar para acciones secundarias.

Ejemplos:

```text
[Ver agenda]
[Actualizar]
[Copiar JSON]
[Limpiar]
[Cancelar]
```

---

### Ghost

```text
Fondo: transparente
Texto: #475569
Hover: #F1F5F9
```

Usar para acciones de bajo peso.

---

### Danger

```text
Fondo: #DC2626
Texto: #FFFFFF
```

O versión outline:

```text
Fondo: #FFFFFF
Borde: #DC2626
Texto: #DC2626
```

Usar para:

```text
[Desactivar servicio]
[Cancelar orden]
[Eliminar]
[Rechazar cotización]
```

Regla:

```text
Danger button solo debe usarse cuando la acción cambia, cancela, elimina o rechaza algo de forma crítica.
```

---

### Disabled

```text
Fondo: #CBD5E1
Texto: #94A3B8
```

Debe incluir explicación si bloquea una acción importante.

---

## 13. Inputs y formularios

### Estado default

```text
Border: #CBD5E1
Background: #FFFFFF
Text: #0F172A
```

### Estado focus

```text
Border: #2563EB
Focus ring: #2563EB
```

### Estado error

```text
Border: #DC2626
Texto error: #DC2626
Fondo opcional: #FEE2E2
```

Regla:

```text
Todo error debe incluir mensaje textual.
No basta con borde rojo.
```

Ejemplo:

```text
Teléfono
[+51 ...]
Error: el teléfono es obligatorio.
```

### Estado warning

```text
Border: #D97706
Texto warning: #D97706
Fondo opcional: #FEF3C7
```

### Estado readonly

```text
Background: #F1F5F9
Text: #64748B
Border: #E2E8F0
```

---

## 14. Tablas y listas

### Row default

```text
Background: #FFFFFF
```

### Row hover

```text
Background: #F8FAFC
```

### Row selected

```text
Background: #EFF6FF
Border or marker: #2563EB
```

### Divider

```text
Border: #E2E8F0
```

### Row crítica

No pintar toda la fila de rojo fuerte.

Usar:

```text
Badge rojo
Borde izquierdo rojo
Texto explícito
Fondo rojo suave solo si es necesario
```

---

## 15. Modals y drawers

### Modal base

```text
Background: #FFFFFF
Header text: #0F172A
Body text: #475569
Border: #E2E8F0
Primary action: #2563EB
Danger action: #DC2626
```

### Overlay

```text
Negro con opacidad controlada
```

Regla:

```text
El modal debe reforzar una decisión, no convertirse en una pantalla completa desordenada.
```

---

## 16. Raw response / developer panels

Para consola demo_test y paneles técnicos.

```text
Background: #0F172A
Text: #E5E7EB
Border: #334155
Error: #FCA5A5 o #DC2626 según uso
Success: #86EFAC o #16A34A según uso
Warning: #FCD34D o #D97706 según uso
```

Aplicar en:

```text
RawResponsePanel
BackendErrorPanel
JSON colapsable
Debug de demo_test
Copiar respuesta
Copiar error
```

Regla:

```text
Panel técnico puede ser oscuro.
Pantalla operativa principal debe mantenerse clara.
```

---

## 17. Matriz por pantalla

## 17.1 Resumen Operativo

```text
Citas confirmadas              Verde
Pendientes de confirmar        Ámbar
En riesgo                      Rojo
Cupos disponibles              Verde
Cupos recomendados             Azul info
Carga normal                   Verde
Carga alta                     Ámbar
Saturado                       Rojo
Demanda reciente               Azul / Gris
Agenda informativa             Gris / Azul
```

---

## 17.2 Órdenes de Taller

```text
Recibido                       Azul
Admisión pendiente             Ámbar
En diagnóstico                 Azul
Diagnóstico listo              Verde
Cotización borrador            Gris / Ámbar
Cotización preparada           Ámbar
Cotización enviada             Azul
Esperando decisión             Ámbar
Aprobado parcial               Ámbar
Aprobado total                 Verde
En ejecución                   Azul
Bloqueado                      Rojo
Control de calidad             Ámbar
Listo para entrega             Verde
Entregado                      Gris
Cancelado                      Gris
```

---

## 17.3 Admisión y Diagnóstico

```text
Sin admisión                   Ámbar
En diagnóstico                 Azul
Pendiente de foto              Ámbar
Urgente / varado               Rojo
Retraso                        Rojo
Admisión completa              Verde
Listo para diagnóstico         Verde
Hallazgo crítico               Rojo
Hallazgo alto                  Rojo
Hallazgo medio                 Ámbar
Hallazgo bajo                  Verde
Hallazgo informativo           Gris
```

---

## 17.4 Bahías y Ejecución

```text
Por asignar a bahía            Ámbar
Trabajo en bahía normal        Azul
Trabajo en bahía atrasado      Rojo
Detenido                       Rojo
Espera repuesto                Ámbar / Rojo según SLA
Espera cliente                 Ámbar
QC pendiente                   Ámbar
QC completo                    Verde
Listo para entrega             Verde
Entregado                      Gris
```

---

## 17.5 Cartera de Clientes

```text
Requiere atención inmediata    Rojo
Seguimiento recomendado        Ámbar
Sin urgencia                   Verde
Inactivo / sin datos           Gris
Mensaje pendiente reciente     Ámbar
Mensaje pendiente vencido      Rojo
Saldo pendiente vencido        Rojo
Oportunidad mantenimiento      Ámbar
Caso abierto sin bloqueo       Azul
```

---

## 17.6 Catálogo de Servicios

```text
Completo                       Verde
Incompleto no publicado         Ámbar
Publicado con dato crítico faltante  Rojo
Inactivo                       Gris
Publicado                      Azul / Verde según contexto
Oculto                         Gris
Sin precio publicado            Rojo
Sin duración publicado          Rojo
Sin precio oculto               Ámbar
Sin duración oculto             Ámbar
```

Regla específica:

```text
Un servicio publicado con información crítica faltante es ROJO · RIESGO PÚBLICO.
```

---

## 17.7 Centro de Mensajes

```text
Fallido                        Rojo
Pendiente con respuesta         Ámbar
No enviado                     Ámbar
Enviado                        Azul
Entregado                      Azul
Leído                          Azul
Solo informativo               Gris
Requiere reintento              Rojo
Requiere revisión               Ámbar
```

---

## 17.8 Personal y Equipos

```text
Disponible                     Verde
Parcialmente ocupado            Ámbar
Sobrecargado                   Rojo
No disponible con carga         Rojo
Inactivo                       Gris
Excepción vigente              Ámbar
Excepción con conflicto         Rojo
Equipo activo con cupo          Verde
Equipo lleno                   Rojo / Ámbar según contexto
Capacidad reducida              Ámbar
```

---

## 17.9 Ajustes Generales

```text
Configuración guardada          Verde
Cambios sin guardar             Ámbar
Error de validación             Rojo
Sección neutra                  Gris
Preview seleccionado            Azul
Campo readonly                  Gris suave
```

---

## 17.10 demo_test Console

```text
Step completado                 Verde
Step activo                     Azul
Step pendiente                  Gris
Error backend                   Rojo
Validación incompleta           Ámbar
Raw response OK                 Azul / Gris
Reserva booked                  Verde
Double booking                  Rojo
No availability                 Ámbar / Rojo según contexto
IDs readonly                    Gris suave
```

---

## 18. Reglas de accesibilidad y ergonomía

## 18.1 No depender solo del color

Cada estado debe tener:

```text
Color
Texto
Icono opcional
Acción específica
```

Ejemplo correcto:

```text
ROJO · Fallido
Estado: Fallido
[Reintentar envío]
```

Ejemplo incorrecto:

```text
Un punto rojo sin texto.
```

---

## 18.2 Contraste mínimo

Regla recomendada:

```text
Texto normal: mínimo 4.5:1
Texto grande: mínimo 3:1
Componentes UI importantes: mínimo 3:1 contra el fondo
```

---

## 18.3 Fatiga visual baja

No usar fondos saturados en grandes superficies.

Preferir:

```text
Fondo neutro
Card blanca
Badge semántico
Borde izquierdo semántico
Texto claro
```

---

## 18.4 Jerarquía visual

La jerarquía debe ser:

```text
1. Estado crítico o próxima acción.
2. Identidad del caso / cliente / servicio.
3. Dato operativo clave.
4. Contexto secundario.
5. Historial o metadata.
```

---

## 18.5 Una acción primaria dominante

Cada panel debe tener una acción principal clara.

Ejemplo:

```text
Orden esperando decisión:
[Registrar decisión]
```

No debe tener cinco botones primarios compitiendo.

---

## 18.6 Color operacional estable

No cambiar el significado de un color entre pantallas.

```text
Rojo siempre significa riesgo/error/bloqueo/urgencia.
Ámbar siempre significa pendiente/incompleto/revisión.
Verde siempre significa disponible/completo/aprobado/listo.
Azul siempre significa información/en curso/selección.
Gris siempre significa neutro/inactivo/histórico.
```

---

## 19. Reglas finales para implementación

```text
1. Usar la paleta neutral como base del sistema.
2. Separar tokens de marca y tokens funcionales.
3. No permitir que una marca cambie el significado de los estados.
4. Usar color + texto en todos los badges.
5. Evitar tarjetas completas con fondos saturados.
6. Usar fondos suaves para alertas, no colores fuertes en masa.
7. Reservar el azul primario para acciones principales, foco y selección.
8. Usar rojo solo para riesgo, error, bloqueo o urgencia real.
9. Usar ámbar para pendiente, incompleto o próximo a vencer.
10. Usar verde para disponible, aprobado, completo o listo.
11. Usar azul info para procesos en curso o información estable.
12. Usar gris para inactivo, histórico o sin urgencia.
13. Mantener contraste alto en texto y controles.
14. Mantener consistencia entre todas las pantallas del admin.
15. Validar visualmente cada pantalla con la regla de 5 segundos.
```

---

## 20. Decisión final

La paleta base aprobada para wireframes y futura implementación debería ser:

```text
VtkALL Neutral Operational UI v1
```

No representa una marca final.

Representa una base visual UX/UI segura para operación.

Luego, cada negocio puede personalizar:

```text
brand.primary
brand.secondary
brand.accent
logo
tipografía de marca
imágenes
tono de landing
```

Pero no debería alterar:

```text
status.danger
status.warning
status.success
status.info
status.neutral
surface.*
text.*
border.*
```

Conclusión:

```text
La marca puede cambiar.
La lectura operacional debe permanecer estable.
```
