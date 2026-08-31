// Wizard de reserva de turno — Clínica Vitalis (demo IO Consulting).
// Todo el estado vive en memoria (variable `estado`); no hay backend real.
// En una implementación real esto se conectaría a Supabase o Google Calendar.

const PASOS = ['Especialidad', 'Profesional', 'Turno', 'Datos'];

let estado = {
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

const dias = generarProximosDias(6);

function root() { return document.getElementById('wizardContent'); }

function irAPaso(n) {
  estado.paso = n;
  renderProgress();
  renderPaso();
  window.scrollTo({ top: document.getElementById('wizardCard').offsetTop - 20, behavior: 'smooth' });
}

function renderProgress() {
  const cont = document.getElementById('progressBar');
  cont.innerHTML = PASOS.map((label, i) => {
    const num = i + 1;
    let cls = 'progress-step';
    if (num < estado.paso) cls += ' done';
    else if (num === estado.paso) cls += ' active';
    return `<div class="${cls}" data-num="${num}">${label}</div>`;
  }).join('');
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
        <button class="option-card ${estado.especialidad === e.key ? 'selected' : ''}" data-especialidad="${e.key}">
          <h3>${e.key}</h3>
          <p>${e.desc}</p>
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

function renderPasoProfesional() {
  const opciones = PROFESIONALES.filter((p) => p.especialidad === estado.especialidad);
  root().innerHTML = `
    <h2>Elegí profesional — ${estado.especialidad}</h2>
    <div class="option-grid">
      ${opciones.map((p) => `
        <button class="option-card ${estado.profesionalId === p.id ? 'selected' : ''}" data-profesional="${p.id}">
          <div class="avatar-circle" style="background:${p.color}">${p.iniciales}</div>
          <h3>${p.nombre}</h3>
          <p>${p.especialidad}</p>
        </button>
      `).join('')}
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
  const horarios = horariosDelDia(estado.profesionalId, estado.fecha);

  root().innerHTML = `
    <h2>Elegí día y horario</h2>
    <p style="color:var(--color-text-light);font-size:0.88rem;margin-top:-0.6rem;">Con ${prof.nombre} (${prof.especialidad})</p>
    <div class="day-pills">
      ${dias.map((d) => {
        const { dow, num } = formatearDiaCorto(d);
        const sel = d.toDateString() === estado.fecha.toDateString();
        return `<button class="day-pill ${sel ? 'selected' : ''}" data-fecha="${d.toISOString()}">${dow}<span class="day-num">${num}</span></button>`;
      }).join('')}
    </div>
    <div class="slot-grid">
      ${horarios.map((h) => `
        <button class="slot-btn ${estado.hora === h.hora ? 'selected' : ''}" data-hora="${h.hora}" ${h.ocupado ? 'disabled' : ''}>${h.hora}</button>
      `).join('')}
    </div>
    <div class="btn-row">
      <button class="btn btn-secondary" id="btnVolver2">← Volver</button>
      <button class="btn btn-primary" id="btnSiguiente3" ${estado.hora ? '' : 'disabled'}>Continuar →</button>
    </div>
  `;

  root().querySelectorAll('[data-fecha]').forEach((btn) => {
    btn.addEventListener('click', () => {
      estado.fecha = new Date(btn.dataset.fecha);
      estado.hora = null;
      renderPasoTurno();
    });
  });
  root().querySelectorAll('[data-hora]').forEach((btn) => {
    btn.addEventListener('click', () => {
      estado.hora = btn.dataset.hora;
      renderPasoTurno();
    });
  });
  document.getElementById('btnVolver2').addEventListener('click', () => irAPaso(2));
  const btnSig = document.getElementById('btnSiguiente3');
  if (btnSig) btnSig.addEventListener('click', () => irAPaso(4));
}

function renderPasoDatos() {
  root().innerHTML = `
    <h2>Tus datos</h2>
    <div class="form-field">
      <label for="inpNombre">Nombre y apellido</label>
      <input type="text" id="inpNombre" placeholder="Ej: Marina Gómez" value="${estado.nombre}">
    </div>
    <div class="form-field">
      <label for="inpTelefono">WhatsApp / teléfono</label>
      <input type="tel" id="inpTelefono" placeholder="Ej: 11 5555-5555" value="${estado.telefono}">
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
    <div class="form-field" id="campoObraSocial" style="display:${estado.tieneObraSocial ? 'block' : 'none'}">
      <label for="inpObraSocial">¿Cuál?</label>
      <input type="text" id="inpObraSocial" placeholder="Ej: OSDE, Swiss Medical..." value="${estado.obraSocial}">
    </div>
    <div class="btn-row">
      <button class="btn btn-secondary" id="btnVolver3">← Volver</button>
      <button class="btn btn-primary" id="btnConfirmar">Confirmar turno →</button>
    </div>
  `;

  const chk = document.getElementById('chkObraSocial');
  chk.addEventListener('change', () => {
    estado.tieneObraSocial = chk.checked;
    document.getElementById('campoObraSocial').style.display = chk.checked ? 'block' : 'none';
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
    irAPaso(5);
  });
}

function guardarDatosForm() {
  estado.nombre = document.getElementById('inpNombre').value.trim();
  estado.telefono = document.getElementById('inpTelefono').value.trim();
  estado.motivo = document.getElementById('selMotivo').value;
  estado.obraSocial = document.getElementById('inpObraSocial') ? document.getElementById('inpObraSocial').value.trim() : '';
}

function alertaInline(msg) {
  let aviso = document.getElementById('avisoInline');
  if (!aviso) {
    aviso = document.createElement('p');
    aviso.id = 'avisoInline';
    aviso.style.color = '#b5462f';
    aviso.style.fontSize = '0.85rem';
    aviso.style.fontWeight = '600';
    root().insertBefore(aviso, root().querySelector('.btn-row'));
  }
  aviso.textContent = msg;
}

function renderConfirmacion() {
  const prof = PROFESIONALES.find((p) => p.id === estado.profesionalId);
  const fechaLarga = formatearFechaLarga(estado.fecha);
  const obraSocialTxt = estado.tieneObraSocial && estado.obraSocial ? ` — ${estado.obraSocial}` : (estado.tieneObraSocial ? ' (obra social sin especificar)' : ' — particular');

  root().innerHTML = `
    <h2>¡Turno reservado! ✅</h2>
    <div class="confirm-summary">
      <p><strong>Paciente:</strong> ${estado.nombre}</p>
      <p><strong>Profesional:</strong> ${prof.nombre} (${prof.especialidad})</p>
      <p><strong>Fecha:</strong> ${fechaLarga} a las ${estado.hora}</p>
      <p><strong>Motivo:</strong> ${estado.motivo}${obraSocialTxt}</p>
    </div>

    <p class="wa-preview-label">Así te llegaría la confirmación por WhatsApp</p>
    <div class="wa-bubble">¡Hola ${estado.nombre.split(' ')[0] || ''}! Confirmamos tu turno en ${CLINICA.nombre} 🩺

📅 ${fechaLarga} a las ${estado.hora}
👨‍⚕️ ${prof.nombre} — ${prof.especialidad}

Te vamos a recordar por acá 24hs antes. Si necesitás cambiar el horario, respondé este mensaje.<span class="wa-bubble-time">Ahora</span></div>

    <div class="btn-row">
      <button class="btn btn-primary" id="btnNuevoTurno">Reservar otro turno</button>
    </div>
  `;
  document.getElementById('btnNuevoTurno').addEventListener('click', () => {
    estado = { paso: 1, especialidad: null, profesionalId: null, fecha: null, hora: null, nombre: '', telefono: '', motivo: 'Control', tieneObraSocial: false, obraSocial: '' };
    irAPaso(1);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderProgress();
  renderPaso();
});
