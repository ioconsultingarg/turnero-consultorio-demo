// Animaciones del wizard (Anime.js v4, alojado en js/vendor/).
// Es una mejora progresiva: wizard.js dibuja todo visible y, si este módulo
// cargó, llama a window.Movimiento para animar la entrada. Si no carga o el
// visitante pidió menos movimiento, la página funciona igual, sin animar.

import { animate, createTimeline, stagger, svg } from './vendor/anime.min.js';

const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
const ESCALONABLES = '.option-card, .day-pill, .slot-btn, .form-field:not([hidden]), .demo-note, .btn-row';
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Saca los estilos en línea que deja la animación, para que vuelvan a mandar
// las reglas de la hoja de estilos (hover, selección, etc.).
function limpiar(elementos) {
  Array.from(elementos).forEach((el) => {
    el.style.opacity = '';
    el.style.transform = '';
  });
}

function entradaEscalonada(elementos, demora = 0) {
  const lista = Array.from(elementos);
  if (menosMovimiento.matches || !lista.length) return;
  animate(lista, {
    opacity: { from: 0 },
    y: { from: 12 },
    duration: 340,
    delay: stagger(32, { start: demora }),
    ease: 'outCubic',
    onComplete: () => limpiar(lista),
  });
}

function animarAlto(tarjeta, altoAnterior) {
  const altoNuevo = tarjeta.offsetHeight;
  if (Math.abs(altoNuevo - altoAnterior) < 4) return;
  tarjeta.style.overflow = 'hidden';
  animate(tarjeta, {
    height: { from: `${altoAnterior}px`, to: `${altoNuevo}px` },
    duration: 380,
    ease: 'outCubic',
    onComplete: () => {
      tarjeta.style.height = '';
      tarjeta.style.overflow = '';
    },
  });
}

function cambioDePaso(tarjeta, contenido, direccion, altoAnterior, esConfirmacion) {
  if (menosMovimiento.matches) return;
  animarAlto(tarjeta, altoAnterior);
  if (esConfirmacion) {
    confirmacion(contenido);
    return;
  }
  const encabezado = contenido.querySelectorAll('h2, .step-sub');
  animate(encabezado, {
    opacity: { from: 0 },
    x: { from: 18 * direccion },
    duration: 320,
    ease: 'outCubic',
    onComplete: () => limpiar(encabezado),
  });
  entradaEscalonada(contenido.querySelectorAll(ESCALONABLES), 60);
}

// Secuencia de la pantalla final: tilde que se dibuja, comprobante que se arma
// y el chat de WhatsApp donde "escriben" y llegan los mensajes.
function confirmacion(contenido) {
  const marca = contenido.querySelector('.check-mark');
  const tilde = contenido.querySelector('.check-path');
  const textos = contenido.querySelectorAll('.confirm-head h2, .confirm-head .step-sub');
  const filas = contenido.querySelectorAll('.ticket-label, .ticket-row');
  const telefono = contenido.querySelectorAll('.wa-preview-label, .phone-frame');
  const cierre = contenido.querySelectorAll('.btn-row');
  const ocultos = [marca, ...textos, ...filas, ...telefono, ...cierre];

  ocultos.forEach((el) => { el.style.opacity = '0'; });
  // Red de seguridad: pase lo que pase, nada queda invisible.
  setTimeout(() => limpiar(ocultos), 3200);

  const trazo = svg.createDrawable(tilde);
  animate(trazo, { draw: '0 0', duration: 0 });

  createTimeline({ defaults: { ease: 'outCubic' } })
    .add(marca, { opacity: 1, scale: { from: 0.4 }, duration: 420, ease: 'outBack' })
    .add(trazo, { draw: ['0 0', '0 1'], duration: 360 }, '-=140')
    .add(textos, { opacity: 1, y: { from: 10 }, duration: 300, delay: stagger(70) }, '-=180')
    .add(filas, { opacity: 1, x: { from: -12 }, duration: 280, delay: stagger(60) }, '-=140')
    .add(telefono, { opacity: 1, y: { from: 22 }, duration: 420, delay: stagger(80) }, '-=260')
    .add(cierre, { opacity: 1, duration: 300 }, '-=200');

  chat(contenido);
}

function enPantalla(elemento) {
  if (!('IntersectionObserver' in window)) return Promise.resolve();
  return new Promise((resolve) => {
    const observador = new IntersectionObserver((entradas) => {
      if (entradas.some((e) => e.isIntersecting)) {
        observador.disconnect();
        resolve();
      }
    }, { threshold: 0.35 });
    observador.observe(elemento);
  });
}

async function chat(contenido) {
  const cuerpo = contenido.querySelector('.chat-body');
  const escribiendo = contenido.querySelector('.wa-typing');
  const mensajes = Array.from(contenido.querySelectorAll('[data-msg]'));
  if (!cuerpo || !escribiendo) return;

  // El chat arranca cuando el celular está a la vista: en pantallas chicas queda
  // debajo del comprobante y la secuencia se perdería fuera de pantalla. Los
  // mensajes se ocultan recién ahí, así nunca quedan escondidos si no se llega a ver.
  await enPantalla(cuerpo);
  if (!cuerpo.isConnected) return;
  // Se reserva el alto final para que la página no salte mientras "escriben".
  cuerpo.style.minHeight = `${cuerpo.offsetHeight}px`;
  mensajes.forEach((m) => { m.hidden = true; });

  await esperar(1300);
  for (const mensaje of mensajes) {
    if (!mensaje.isConnected) return;
    mensaje.before(escribiendo);
    escribiendo.hidden = false;
    await esperar(1000);
    escribiendo.hidden = true;
    mensaje.hidden = false;
    animate(mensaje, {
      opacity: { from: 0 },
      scale: { from: 0.86 },
      duration: 280,
      ease: 'outBack',
      onComplete: () => limpiar([mensaje]),
    });
    await esperar(520);
  }
}

function sacudir(elemento) {
  if (menosMovimiento.matches) return;
  animate(elemento, {
    x: [{ to: -6, duration: 60 }, { to: 6, duration: 80 }, { to: -4, duration: 80 }, { to: 0, duration: 80 }],
    ease: 'inOutSine',
    onComplete: () => limpiar([elemento]),
  });
}

function aparecer(elemento) {
  if (menosMovimiento.matches) return;
  animate(elemento, {
    opacity: { from: 0 },
    y: { from: -8 },
    duration: 260,
    ease: 'outCubic',
    onComplete: () => limpiar([elemento]),
  });
}

window.Movimiento = { cambioDePaso, entradaEscalonada, sacudir, aparecer };
