# turnero-consultorio-demo

Sistema de reserva de turnos online para consultorios, demo de portfolio de **IO Consulting**. Cliente ficticio: "Clínica Vitalis", un consultorio multiespecialidad (clínica médica, odontología, kinesiología) con varios profesionales atendiendo.

Este demo cubre a la vez el turnero genérico (reservas online con recordatorio por WhatsApp) y su variante para el rubro salud, que necesita filtrar por especialidad y por profesional.

## Problema que resuelve

Hoy la reserva de turnos en la mayoría de los consultorios chicos se hace por teléfono o WhatsApp manual: alguien de recepción tiene que estar disponible, cruzar la agenda a mano, y después acordarse de mandar el recordatorio. Este flujo deja que el paciente reserve solo, viendo la disponibilidad real de cada profesional, sin que nadie tenga que atender el teléfono.

## Demo

`https://ioconsultingarg.github.io/turnero-consultorio-demo/`

El flujo tiene 4 pasos: elegir especialidad → elegir profesional → elegir día y horario disponible → completar datos de contacto y motivo de consulta. Al confirmar, se muestra un resumen y una vista previa de cómo llegaría la confirmación por WhatsApp (mismo mecanismo simulado en `turnero-whatsapp-demo`).

## Stack

- HTML/CSS/JS puro, sin build step ni backend
- Estado del wizard en memoria (`js/wizard.js`) — se reinicia al recargar la página, es intencional para esta versión demo
- Disponibilidad de horarios generada de forma determinística por profesional/día/horario (`js/data.js`), para que se vea siempre igual sin necesitar una base de datos real
- Google Fonts (Poppins + Inter)

## Cómo correrlo local

Es HTML/CSS/JS estático, sin `fetch` a ningún archivo externo — se puede abrir `index.html` directo desde el navegador, o servirlo con:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Qué es real y qué es simulado

- Los profesionales, especialidades y horarios "ocupados" son datos ficticios fijos en `js/data.js`
- La confirmación no se guarda en ningún lado ni se envía ningún WhatsApp real — es una vista previa de cómo se vería
- En una implementación real, el motor de disponibilidad se conecta a Google Calendar (uno por profesional) o a una tabla de turnos en Supabase, y la confirmación/recordatorio se dispara con el mismo workflow de n8n de `turnero-whatsapp-demo`

## Nota sobre normativa (rubro salud)

Este demo solo pide datos de contacto y motivo de consulta, no historia clínica — igual, al tratarse de un consultorio de salud vale la pena tenerlo presente desde el diseño: Ley 26.529 (derechos del paciente e historia clínica) y Ley 25.326 (protección de datos personales, categoría "datos sensibles" para todo lo de salud). Para producción faltaría: control de acceso por rol, cifrado de datos personales en reposo, y política de retención/borrado de datos de contacto.

## Cómo adaptarlo a otro tipo de consultorio

1. Editar `PROFESIONALES` y `ESPECIALIDADES` en `js/data.js` con el staff real
2. Ajustar `HORARIOS_POSIBLES` según el horario de atención
3. Cambiar el número de WhatsApp en `CLINICA.whatsapp` (`js/data.js`) y en el botón flotante de `index.html`
4. Sirve igual para peluquerías, talleres, canchas o cualquier negocio con varios "profesionales"/recursos y turnos — solo cambia el texto y las especialidades por rubros o servicios

## Estructura

```
turnero-consultorio-demo/
├── index.html          (wizard de reserva)
├── css/styles.css
├── js/data.js            (profesionales, especialidades, disponibilidad)
├── js/wizard.js           (lógica de los 5 pasos del flujo)
├── README.md
└── LICENSE
```

## Próximas mejoras posibles

- Conectar la disponibilidad real a Google Calendar o Supabase
- Vista de agenda para el profesional/recepción (ver turnos del día, confirmar o reprogramar)
- Reemplazar la vista previa de WhatsApp por el envío real, reusando los workflows de `turnero-whatsapp-demo`
- Recordatorio de controles periódicos (ej. control anual) disparado automáticamente desde el historial de turnos

---
Parte del portfolio de demos de transformación digital de IO Consulting.
