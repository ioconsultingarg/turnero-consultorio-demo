// Wizard de reserva de turno — Clínica Médica Ejemplo (demo IO Consulting).
// Todo el estado vive en memoria (variable `estado`); no hay backend real.
// En una implementación real esto se conectaría a Supabase o Google Calendar.
//
// Los 4 pasos de la barra de progreso están escritos en index.html; acá solo
// se marca cuál está activo. Las animaciones viven en js/motion.js y son
// opcionales: si ese módulo no cargó, `window.Movimiento` no existe y no se anima.

const ESTADO_INICIAL = {
  paso: 1,
  especialidad: null,
  profesionalId: null,
  fecha: null,
  hora: null,
  nombre: '',
  telefono: '',
  motivo: 'Control',
  tieneObraSocial: false,
  obraSocial: '',
};

let estado = { ...ESTADO_INICIAL };

const dias = generarProximosDias(6);

// Íconos de línea propios, uno por especialidad (clave `icono` en js/data.js).
const ICONOS = {
  pulso: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
  diente: '<path d="M7.5 3C5 3 4 5 4 7.5c0 2 .8 3.2 1.2 5 .5 2.3.6 7.5 2.3 7.5 1.6 0 1.4-5 4.5-5s2.9 5 4.5 5c1.7 0 1.8-5.2 2.3-7.5.4-1.8 1.2-3 1.2-5C20 5 19 3 16.5 3c-1.8 0-2.8 1-4.5 1s-2.7-1-4.5-1z"/>',
  movimiento: '<circle cx="12" cy="4.5" r="2"/><path d="M5 9.5l7 1.5 7-1.5M12 11v4.5M12 15.5l-4 5.5M12 15.5l4 5.5"/>',
};

function icono(nombre) {
  return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[nombre] || ICONOS.pulso}</svg>`;
}

const FLECHA = '<span class="flecha" aria-hidden="true">→</span>';

// Escapa texto ingresado por el usuario antes de insertarlo con innerHTML
// (evita que alguien inyecte HTML/JS tipeándolo en un campo del formulario).
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function root() { return document.getElementById('wizardContent'); }

function irAPaso(n) {
  const direccion = n >= estado.paso ? 1 : -1;
  const tarjeta = document.getElementById('wizardCard');
  const altoAnterior = tarjeta.offsetHeight;

  estado.paso = n;
  renderProgress();
  renderPaso();
  enfocarTitulo();
  if (window.Movimiento) window.Movimiento.cambioDePaso(tarjeta, root(), direccion, altoAnterior, n === 5);

  // Solo se desplaza la página si la tarjeta quedó cortada arriba.
  const arriba = tarjeta.getBoundingClientRect().top;
  if (arriba < 0) {
    const sinAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: window.scrollY + arriba - 16, behavior: sinAnimacion ? 'auto' : 'smooth' });
  }
}

// Lleva el foco al título del paso recién dibujado, para que el teclado y los
// lectores de pantalla sigan el cambio (si no, el foco queda perdido en <body>).
function enfocarTitulo() {
  const titulo = root().querySelector('h2');
  if (!titulo) return;
  titulo.tabIndex = -1;
  titulo.focus({ preventScroll: true });
}

function renderProgress() {
  const cont = document.getElementById('progressBar');
  const pasos = cont.querySelectorAll('.progress-step');
  cont.style.setProperty('--avance', Math.min(estado.paso - 1, pasos.length - 1) / (pasos.length - 1));
  pasos.forEach((el, i) => {
    const num = i + 1;
    el.classList.toggle('done', num < estado.paso);
    el.classList.toggle('active', num === estado.paso);
    if (num === estado.paso) el.setAttribute('aria-current', 'step');
    else el.removeAttribute('aria-current');
  });
}

function renderPaso() {
  if (estado.paso === 1) return renderPasoEspecialidad();
  if (estado.paso === 2) return renderPasoProfesional();
  if (estado.paso === 3) return renderPasoTurno();
  if (estado.paso === 4) return renderPasoDatos();
  if (estado.paso === 5) return renderConfirmacion();
}

function renderPasoEspecialidad() {
  root().innerHTML = `
    <h2>¿Qué especialidad necesitás?</h2>
    <div class="option-grid">
      ${ESPECIALIDADES.map((e) => `
        <button class="option-card ${estado.especialidad === e.key ? 'selected' : ''}" aria-pressed="${estado.especialidad === e.key}" data-especialidad="${e.key}">
          <span class="option-icon">${icono(e.icono)}</span>
          <span class="option-text">
            <strong class="option-title">${e.key}</strong>
            <span class="option-desc">${e.desc}</span>
          </span>
        </button>
      `).join('')}
    </div>
  `;
  root().querySelectorAll('[data-especialidad]').forEach((btn) => {
    btn.addEventListener('click', () => {
      estado.especialidad = btn.dataset.especialidad;
      estado.profesionalId = null;
      irAPaso(2);
    });
  });
}

// Primer horario libre de un profesional entre los días que se muestran.
function proximoTurno(profesionalId) {
  for (const dia of dias) {
    const libre = horariosDelDia(profesionalId, dia).find((h) => !h.ocupado);
    if (libre) {
      const { dow, num } = formatearDiaCorto(dia);
      return `${dow} ${num} · ${libre.hora}`;
    }
  }
  return null;
}

function renderPasoProfesional() {
  const opciones = PROFESIONALES.filter((p) => p.especialidad === estado.especialidad);
  root().innerHTML = `
    <h2>Elegí profesional</h2>
    <p class="step-sub">${estado.especialidad}</p>
    <div class="option-grid">
      ${opciones.map((p) => {
        const proximo = proximoTurno(p.id);
        return `
        <button class="option-card ${estado.profesionalId === p.id ? 'selected' : ''}" aria-pressed="${estado.profesionalId === p.id}" data-profesional="${p.id}">
          <span class="avatar-circle" style="background:${p.color}" aria-hidden="true">${p.iniciales}</span>
          <span class="option-text">
            <strong class="option-title">${p.nombre}</strong>
            <span class="option-desc">${proximo ? `Próximo turno: ${proximo}` : 'Sin turnos esta semana'}</span>
          </span>
        </button>`;
      }).join('')}
    </div>
    <div class="btn-row">
      <button class="btn btn-secondary" id="btnVolver1">← Volver</button>
    </div>
  `;
  root().querySelectorAll('[data-profesional]').forEach((btn) => {
    btn.addEventListener('click', () => {
      estado.profesionalId = btn.dataset.profesional;
      estado.fecha = null;
      estado.hora = null;
      irAPaso(3);
    });
  });
  document.getElementById('btnVolver1').addEventListener('click', () => irAPaso(1));
}

function renderPasoTurno() {
  if (!estado.fecha) estado.fecha = dias[0];
  const prof = PROFESIONALES.find((p) => p.id === estado.profesionalId);

  root().innerHTML = `
    <h2>Elegí día y horario</h2>
    <p class="step-sub">Con ${prof.nombre} · ${prof.especialidad}</p>
    <div class="day-pills" role="group" aria-label="Día">
      ${dias.map((d) => {
        const { dow, num } = formatearDiaCorto(d);
        const sel = d.toDateString() === estado.fecha.toDateString();
        return `<button class="day-pill ${sel ? 'selected' : ''}" aria-pressed="${sel}" data-fecha="${d.toISOString()}">${dow}<span class="day-num">${num}</span></button>`;
      }).join('')}
    </div>
    <div class="slot-grid" id="slotGrid" role="group" aria-label="Horario"></div>
    <p class="empty-note" id="sinHorarios" hidden>No quedan horarios disponibles este día. Probá con otro.</p>
    <div class="btn-row">
      <button class="btn btn-secondary" id="btnVolver2">← Volver</button>
      <button class="btn btn-primary" id="btnSiguiente3" ${estado.hora ? '' : 'disabled'}>Continuar ${FLECHA}</button>
    </div>
  `;
  pintarHorarios(false);

  // Al cambiar de día o de horario se actualiza solo lo que cambió: redibujar
  // todo el paso hacía perder el foco del teclado y la posición de la fila de días.
  const pills = root().querySelectorAll('[data-fecha]');
  pills.forEach((btn) => {
    btn.addEventListener('click', () => {
      estado.fecha = new Date(btn.dataset.fecha);
      estado.hora = null;
      pills.forEach((b) => {
        b.classList.toggle('selected', b === btn);
        b.setAttribute('aria-pressed', b === btn);
      });
      document.getElementById('btnSiguiente3').disabled = true;
      pintarHorarios(true);
    });
  });
  document.getElementById('btnVolver2').addEventListener('click', () => irAPaso(2));
  document.getElementById('btnSiguiente3').addEventListener('click', () => irAPaso(4));
}

function pintarHorarios(animar) {
  const grilla = document.getElementById('slotGrid');
  const horarios = horariosDelDia(estado.profesionalId, estado.fecha);

  grilla.innerHTML = horarios.map((h) => `
    <button class="slot-btn ${estado.hora === h.hora ? 'selected' : ''}" aria-pressed="${estado.hora === h.hora}" data-hora="${h.hora}" ${h.ocupado ? `disabled aria-label="${h.hora}, no disponible"` : ''}>${h.hora}</button>
  `).join('');
  document.getElementById('sinHorarios').hidden = !horarios.every((h) => h.ocupado);

  const botones = grilla.querySelectorAll('[data-hora]');
  botones.forEach((btn) => {
    btn.addEventListener('click', () => {
      estado.hora = btn.dataset.hora;
      botones.forEach((b) => {
        b.classList.toggle('selected', b === btn);
        b.setAttribute('aria-pressed', b === btn);
      });
      document.getElementById('btnSiguiente3').disabled = false;
    });
  });
  if (animar && window.Movimiento) window.Movimiento.entradaEscalonada(botones);
}

function renderPasoDatos() {
  root().innerHTML = `
    <h2>Tus datos</h2>
    <p class="step-sub">Para confirmarte el turno por WhatsApp.</p>
    <div class="form-field">
      <label for="inpNombre">Nombre y apellido</label>
      <input type="text" id="inpNombre" placeholder="Ej: Marina Gómez" autocomplete="name" value="${escapeHtml(estado.nombre)}">
    </div>
    <div class="form-field">
      <label for="inpTelefono">WhatsApp / teléfono</label>
      <input type="tel" id="inpTelefono" placeholder="Ej: 11 5555-5555" autocomplete="tel" inputmode="tel" value="${escapeHtml(estado.telefono)}">
    </div>
    <div class="form-field">
      <label for="selMotivo">Motivo de la consulta</label>
      <select id="selMotivo">
        ${['Primera vez', 'Control', 'Urgencia'].map((m) => `<option value="${m}" ${estado.motivo === m ? 'selected' : ''}>${m}</option>`).join('')}
      </select>
    </div>
    <div class="form-field">
      <label class="checkbox-row"><input type="checkbox" id="chkObraSocial" ${estado.tieneObraSocial ? 'checked' : ''}> Tengo obra social o prepaga</label>
    </div>
    <div class="form-field" id="campoObraSocial" ${estado.tieneObraSocial ? '' : 'hidden'}>
      <label for="inpObraSocial">¿Cuál?</label>
      <input type="text" id="inpObraSocial" placeholder="Ej: OSDE, Swiss Medical..." value="${escapeHtml(estado.obraSocial)}">
    </div>
    <p class="demo-note">Demo: estos datos no se guardan ni se envían a ningún lado.</p>
    <div class="btn-row">
      <button class="btn btn-secondary" id="btnVolver3">← Volver</button>
      <button class="btn btn-primary" id="btnConfirmar">Confirmar turno ${FLECHA}</button>
    </div>
  `;

  const chk = document.getElementById('chkObraSocial');
  chk.addEventListener('change', () => {
    const campo = document.getElementById('campoObraSocial');
    estado.tieneObraSocial = chk.checked;
    campo.hidden = !chk.checked;
    if (chk.checked && window.Movimiento) window.Movimiento.aparecer(campo);
  });
  document.getElementById('btnVolver3').addEventListener('click', () => {
    guardarDatosForm();
    irAPaso(3);
  });
  document.getElementById('btnConfirmar').addEventListener('click', () => {
    guardarDatosForm();
    if (!estado.nombre || !estado.telefono) {
      alertaInline('Completá al menos tu nombre y teléfono para confirmar.');
      return;
    }
    if (estado.telefono.replace(/\D/g, '').length < 8) {
      alertaInline('Revisá el teléfono: tiene que tener al menos 8 números.');
      return;
    }
    irAPaso(5);
  });
}

function guardarDatosForm() {
  estado.nombre = document.getElementById('inpNombre').value.trim();
  estado.telefono = document.getElementById('inpTelefono').value.trim();
  estado.motivo = document.getElementById('selMotivo').value;
  estado.obraSocial = document.getElementById('inpObraSocial').value.trim();
}

function alertaInline(msg) {
  let aviso = document.getElementById('avisoInline');
  if (!aviso) {
    aviso = document.createElement('p');
    aviso.id = 'avisoInline';
    aviso.className = 'form-error';
    aviso.setAttribute('role', 'alert');
    root().insertBefore(aviso, root().querySelector('.btn-row'));
  }
  aviso.textContent = msg;
  if (window.Movimiento) window.Movimiento.sacudir(aviso);
}

function renderConfirmacion() {
  const prof = PROFESIONALES.find((p) => p.id === estado.profesionalId);
  const fechaLarga = formatearFechaLarga(estado.fecha);
  const primerNombre = escapeHtml(estado.nombre.split(' ')[0] || '');
  const cobertura = estado.tieneObraSocial ? (escapeHtml(estado.obraSocial) || 'Obra social sin especificar') : 'Particular';
  const horaMensaje = new Date().toTimeString().slice(0, 5);

  root().innerHTML = `
    <div class="confirm-head">
      <svg class="check-mark" viewBox="0 0 52 52" width="60" height="60" aria-hidden="true">
        <circle class="check-circle" cx="26" cy="26" r="26"/>
        <path class="check-path" d="M15 27l7.5 7.5L37.5 19"/>
      </svg>
      <h2>¡Turno reservado!</h2>
      <p class="step-sub">Te esperamos, ${primerNombre}.</p>
    </div>

    <div class="confirm-grid">
      <div class="ticket">
        <p class="ticket-label">Comprobante de turno</p>
        <dl>
          <div class="ticket-row"><dt>Paciente</dt><dd>${escapeHtml(estado.nombre)}</dd></div>
          <div class="ticket-row"><dt>Profesional</dt><dd>${prof.nombre}<small>${prof.especialidad}</small></dd></div>
          <div class="ticket-row"><dt>Fecha</dt><dd>${fechaLarga} · ${estado.hora}</dd></div>
          <div class="ticket-row"><dt>Motivo</dt><dd>${escapeHtml(estado.motivo)}<small>${cobertura}</small></dd></div>
        </dl>
      </div>

      <div class="phone">
        <p class="wa-preview-label">Así te llega por WhatsApp</p>
        <div class="phone-frame">
          <div class="chat-head">
            <span class="chat-avatar" aria-hidden="true">CM</span>
            <span class="chat-name">${CLINICA.nombre}<small>en línea</small></span>
          </div>
          <div class="chat-body">
            <div class="wa-typing" hidden aria-hidden="true"><i></i><i></i><i></i></div>
            <div class="wa-bubble" data-msg>¡Hola ${primerNombre}! Confirmamos tu turno en ${CLINICA.nombre} 🩺

📅 ${fechaLarga} a las ${estado.hora}
👨‍⚕️ ${prof.nombre} — ${prof.especialidad}<span class="wa-bubble-time">${horaMensaje}</span></div>
            <div class="wa-bubble" data-msg>Te vamos a recordar por acá 24 hs antes. Si necesitás cambiar el horario, respondé este mensaje.<span class="wa-bubble-time">${horaMensaje}</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="btn-row btn-row-center">
      <button class="btn btn-primary" id="btnNuevoTurno">Reservar otro turno</button>
    </div>
  `;
  document.getElementById('btnNuevoTurno').addEventListener('click', () => {
    estado = { ...ESTADO_INICIAL };
    irAPaso(1);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderProgress();
  renderPaso();
});
