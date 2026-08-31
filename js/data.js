// Datos ficticios de "Clínica Vitalis" — demo de portfolio de IO Consulting.
// Todo en memoria: no hay backend real. En una implementación real, esto vendría
// de Supabase o de Google Calendar (uno por profesional).

const CLINICA = {
  nombre: 'Clínica Vitalis',
  direccion: 'Av. Belgrano 850, Buenos Aires',
  whatsapp: '5491155555555',
};

const PROFESIONALES = [
  { id: 'paz',    nombre: 'Dra. Laura Paz',      especialidad: 'Clínica médica', iniciales: 'LP', color: '#2f7d6b' },
  { id: 'funes',  nombre: 'Dr. Ezequiel Funes',  especialidad: 'Clínica médica', iniciales: 'EF', color: '#3a6ea5' },
  { id: 'rios',   nombre: 'Dr. Martín Ríos',     especialidad: 'Odontología',    iniciales: 'MR', color: '#e3a857' },
  { id: 'duarte', nombre: 'Lic. Sofía Duarte',   especialidad: 'Kinesiología',   iniciales: 'SD', color: '#8a5fb0' },
];

const ESPECIALIDADES = [
  { key: 'Clínica médica', desc: 'Consulta general, controles, certificados' },
  { key: 'Odontología',    desc: 'Controles, limpieza, urgencias' },
  { key: 'Kinesiología',   desc: 'Rehabilitación y sesiones de seguimiento' },
];

const HORARIOS_POSIBLES = ['09:00', '09:30', '10:00', '10:30', '11:00', '15:00', '15:30', '16:00', '16:30', '17:00'];

const DIAS_SEMANA_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Hash simple y determinístico para que la disponibilidad "ocupado/libre"
// se vea siempre igual para la misma combinación profesional+día+horario,
// en vez de ser aleatoria en cada carga de la página.
function hashOcupado(seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  return hash % 100 < 35; // ~35% de los horarios aparecen ocupados
}

// Genera los próximos N días hábiles (de lunes a sábado) a partir de hoy.
function generarProximosDias(cantidad) {
  const dias = [];
  const hoy = new Date();
  let cursor = new Date(hoy);
  while (dias.length < cantidad) {
    if (cursor.getDay() !== 0) { // saltea domingos
      dias.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}

function formatearDiaCorto(fecha) {
  return { dow: DIAS_SEMANA_CORTO[fecha.getDay()], num: fecha.getDate() };
}

function formatearFechaLarga(fecha) {
  return `${DIAS_SEMANA_CORTO[fecha.getDay()]} ${fecha.getDate()} de ${MESES_CORTO[fecha.getMonth()]}`;
}

// Devuelve los horarios del día para un profesional, marcando algunos como ocupados.
function horariosDelDia(profesionalId, fecha) {
  const clave = `${profesionalId}-${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
  return HORARIOS_POSIBLES.map((hora) => ({
    hora,
    ocupado: hashOcupado(clave + hora),
  }));
}
