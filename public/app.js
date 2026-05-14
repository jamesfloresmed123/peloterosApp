const el = (id) => document.getElementById(id);

async function getJSON(url, options) {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Error inesperado');
  return body;
}

async function loadTypes() {
  try {
    const tipos = await getJSON('/api/tipos-responsabilidad');
    const list = tipos.length ? tipos : ['Cable', 'Cobro'];
    el('responsabilidad').innerHTML = list.map((t) => `<option value="${t}">${t}</option>`).join('');
  } catch {
    el('responsabilidad').innerHTML = ['Cable', 'Cobro'].map((t) => `<option value="${t}">${t}</option>`).join('');
  }
}

async function cargarHoy() {
  const { data } = await getJSON('/api/responsabilidades-hoy');
  const container = el('hoyContainer');
  if (!data.length) {
    container.innerHTML = '<p>No existen responsabilidades pendientes para hoy.</p>';
    return;
  }
  container.innerHTML = `<table><tr><th>Responsable</th><th>Responsabilidad</th><th>Estado</th><th>Acción</th></tr>${data.map(r => `
    <tr>
      <td>${r.nombres} ${r.apellidos}</td>
      <td>${r.responsabilidad}</td>
      <td>${r.estado}</td>
      <td><button onclick="cumplio(${r.id})">Cumplió</button></td>
    </tr>
  `).join('')}</table>`;
}

async function cumplio(id) {
  await getJSON(`/api/responsabilidades/${id}/cumplio`, { method: 'PATCH' });
  await Promise.all([cargarHoy(), cargarCalendario(), cargarStats(), buscarHistorial()]);
}
window.cumplio = cumplio;

async function cargarCalendario() {
  const year = Number(el('year').value);
  const month = Number(el('month').value);
  if (!year || !month) return;

  const data = await getJSON(`/api/calendario?year=${year}&month=${month}`);
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
    html.push(`<div class="day"><h4>${d}</h4>${registros.map(r =>
      `<div class="registro ${r.estado === 'Cumplió' ? 'ok' : 'pending'}">${r.nombres} ${r.apellidos} - ${r.responsabilidad} (${r.estado})</div>`).join('')}</div>`);
  }
  el('calendar').innerHTML = html.join('');
}

async function buscarHistorial() {
  const nombre = el('fNombre').value;
  const fecha = el('fFecha').value;
  const responsabilidad = el('fResp').value;
  const estado = el('fEstado').value;
  const data = await getJSON(`/api/historial?nombre=${encodeURIComponent(nombre)}&fecha=${fecha}&responsabilidad=${encodeURIComponent(responsabilidad)}&estado=${encodeURIComponent(estado)}`);

  if (!data.length) {
    el('historial').innerHTML = '<p>Sin resultados.</p>';
    return;
  }
  el('historial').innerHTML = `<table><tr><th>Fecha</th><th>Responsable</th><th>Responsabilidad</th><th>Estado</th></tr>${data.map(r => `
    <tr><td>${r.fecha}</td><td>${r.nombres} ${r.apellidos}</td><td>${r.responsabilidad}</td><td>${r.estado}</td></tr>
  `).join('')}</table>`;
}

async function cargarStats() {
  const s = await getJSON('/api/stats');
  el('stats').innerHTML = `
    <p>Total cumplidas: <b>${s.cumplidas}</b></p>
    <p>Total pendientes: <b>${s.pendientes}</b></p>
    <p>Persona con más cumplidas: <b>${s.top ? `${s.top.nombres} ${s.top.apellidos} (${s.top.total})` : 'N/A'}</b></p>
  `;
}

el('formRegistro').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await getJSON('/api/responsabilidades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombres: el('nombres').value,
        apellidos: el('apellidos').value,
        fecha: el('fecha').value,
        responsabilidad: el('responsabilidad').value,
      }),
    });
    el('msgRegistro').textContent = 'Registro guardado correctamente.';
    e.target.reset();
    await Promise.all([cargarHoy(), cargarCalendario(), cargarStats(), buscarHistorial()]);
  } catch (err) {
    el('msgRegistro').textContent = err.message;
  }
});

el('agregarTipo').addEventListener('click', async () => {
  const nombre = el('nuevoTipo').value;
  if (!nombre) return;
  await getJSON('/api/tipos-responsabilidad', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre }),
  });
  el('nuevoTipo').value = '';
  await loadTypes();
});

el('cargarCal').addEventListener('click', cargarCalendario);
el('buscarHist').addEventListener('click', buscarHistorial);

(async () => {
  const now = new Date();
  el('year').value = now.getFullYear();
  el('month').value = now.getMonth() + 1;
  await loadTypes();
  await Promise.all([cargarHoy(), cargarCalendario(), buscarHistorial(), cargarStats()]);
})();
