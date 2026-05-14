const el = (id) => document.getElementById(id);
const DB_KEY = 'peloteros_db_v1';

function seed() {
  return { nextId: 1, tipos: ['Cables', 'Cobro'], responsabilidades: [] };
}

function readDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return seed();
  try {
    return JSON.parse(raw);
  } catch {
    return seed();
  }
}

function writeDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

function validateText(text) {
  return /^[\p{L} ]+$/u.test((text || '').trim());
}

function loadTypes() {
  const db = readDB();
  el('responsabilidad').innerHTML = db.tipos.map((t) => `<option value="${t}">${t}</option>`).join('');
}

function cargarHoy() {
  const db = readDB();
  const today = new Date().toISOString().slice(0, 10);
  const data = db.responsabilidades.filter((r) => r.fecha === today && r.estado === 'Pendiente');
  const container = el('hoyContainer');
  if (!data.length) {
    container.innerHTML = '<p>No existen responsabilidades pendientes para hoy.</p>';
    return;
  }
  container.innerHTML = `<table><tr><th>Responsable</th><th>Responsabilidad</th><th>Estado</th><th>Acción</th></tr>${data.map((r) => `
    <tr>
      <td>${r.nombres} ${r.apellidos}</td>
      <td>${r.responsabilidad}</td>
      <td>${r.estado}</td>
      <td><button onclick="cumplio(${r.id})">Cumplió</button></td>
    </tr>`).join('')}</table>`;
}

function cumplio(id) {
  const db = readDB();
  const item = db.responsabilidades.find((r) => r.id === id);
  if (!item) return;
  item.estado = 'Cumplió';
  writeDB(db);
  refreshAll();
}
window.cumplio = cumplio;

function cargarCalendario() {
  const year = Number(el('year').value);
  const month = Number(el('month').value);
  if (!year || !month) return;

  const db = readDB();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const data = db.responsabilidades.filter((r) => r.fecha.startsWith(prefix));
  const days = new Date(year, month, 0).getDate();
  const grouped = data.reduce((acc, item) => {
    acc[item.fecha] = acc[item.fecha] || [];
    acc[item.fecha].push(item);
    return acc;
  }, {});

  const html = [];
  for (let d = 1; d <= days; d += 1) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const registros = grouped[date] || [];
    html.push(`<div class="day"><h4>${d}</h4>${registros.map((r) =>
      `<div class="registro ${r.estado === 'Cumplió' ? 'ok' : 'pending'}">${r.nombres} ${r.apellidos} - ${r.responsabilidad} (${r.estado})</div>`).join('')}</div>`);
  }
  el('calendar').innerHTML = html.join('');
}

function buscarHistorial() {
  const db = readDB();
  const nombre = el('fNombre').value.trim().toLowerCase();
  const fecha = el('fFecha').value;
  const responsabilidad = el('fResp').value.trim().toLowerCase();
  const estado = el('fEstado').value;

  const data = db.responsabilidades.filter((r) => {
    const fullName = `${r.nombres} ${r.apellidos}`.toLowerCase();
    return (!nombre || fullName.includes(nombre))
      && (!fecha || r.fecha === fecha)
      && (!responsabilidad || r.responsabilidad.toLowerCase().includes(responsabilidad))
      && (!estado || r.estado === estado);
  });

  if (!data.length) {
    el('historial').innerHTML = '<p>Sin resultados.</p>';
    return;
  }
  el('historial').innerHTML = `<table><tr><th>Fecha</th><th>Responsable</th><th>Responsabilidad</th><th>Estado</th></tr>${data.map((r) =>
    `<tr><td>${r.fecha}</td><td>${r.nombres} ${r.apellidos}</td><td>${r.responsabilidad}</td><td>${r.estado}</td></tr>`).join('')}</table>`;
}

function cargarStats() {
  const db = readDB();
  const cumplidas = db.responsabilidades.filter((r) => r.estado === 'Cumplió');
  const pendientes = db.responsabilidades.length - cumplidas.length;
  const map = {};
  for (const r of cumplidas) {
    const key = `${r.nombres} ${r.apellidos}`;
    map[key] = (map[key] || 0) + 1;
  }
  let top = null;
  Object.entries(map).forEach(([name, total]) => {
    if (!top || total > top.total) top = { name, total };
  });

  el('stats').innerHTML = `
    <p>Total cumplidas: <b>${cumplidas.length}</b></p>
    <p>Total pendientes: <b>${pendientes}</b></p>
    <p>Persona con más cumplidas: <b>${top ? `${top.name} (${top.total})` : 'N/A'}</b></p>
  `;
}

function refreshAll() {
  cargarHoy();
  cargarCalendario();
  buscarHistorial();
  cargarStats();
}

el('formRegistro').addEventListener('submit', (e) => {
  e.preventDefault();
  const nombres = el('nombres').value.trim();
  const apellidos = el('apellidos').value.trim();
  const fecha = el('fecha').value;
  const responsabilidad = el('responsabilidad').value;

  if (!nombres || !apellidos || !fecha || !responsabilidad) return;
  if (!validateText(nombres) || !validateText(apellidos)) {
    el('msgRegistro').textContent = 'Nombres y apellidos deben contener solo texto.';
    return;
  }
  if (!isValidDate(fecha)) {
    el('msgRegistro').textContent = 'Fecha inválida.';
    return;
  }

  const db = readDB();
  const sameDateCount = db.responsabilidades.filter((r) => r.fecha === fecha).length;
  if (sameDateCount >= 5) {
    el('msgRegistro').textContent = 'No se pueden registrar más de 5 responsables por fecha.';
    return;
  }

  const dup = db.responsabilidades.some((r) =>
    r.fecha === fecha && r.responsabilidad === responsabilidad
    && r.nombres.toLowerCase() === nombres.toLowerCase() && r.apellidos.toLowerCase() === apellidos.toLowerCase());
  if (dup) {
    el('msgRegistro').textContent = 'No se permiten registros duplicados para misma persona/fecha/responsabilidad.';
    return;
  }

  db.responsabilidades.push({ id: db.nextId++, nombres, apellidos, fecha, responsabilidad, estado: 'Pendiente' });
  writeDB(db);
  el('msgRegistro').textContent = 'Registro guardado correctamente.';
  e.target.reset();
  refreshAll();
});

el('agregarTipo').addEventListener('click', () => {
  const nombre = el('nuevoTipo').value.trim();
  if (!nombre) return;
  const db = readDB();
  if (!db.tipos.includes(nombre)) db.tipos.push(nombre);
  writeDB(db);
  el('nuevoTipo').value = '';
  loadTypes();
});

el('cargarCal').addEventListener('click', cargarCalendario);
el('buscarHist').addEventListener('click', buscarHistorial);

(() => {
  const now = new Date();
  el('year').value = now.getFullYear();
  el('month').value = now.getMonth() + 1;
  if (!localStorage.getItem(DB_KEY)) writeDB(seed());
  loadTypes();
  refreshAll();
})();
