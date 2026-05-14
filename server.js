const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, 'data.json');

function seedData() {
  return {
    nextId: 1,
    tipos: ['Cables', 'Cobro'],
    responsabilidades: [],
  };
}

function readDB() {
  if (!fs.existsSync(DATA_PATH)) {
    const initial = seedData();
    fs.writeFileSync(DATA_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  const parsed = JSON.parse(raw || '{}');
  return {
    nextId: Number(parsed.nextId || 1),
    tipos: Array.isArray(parsed.tipos) && parsed.tipos.length ? parsed.tipos : ['Cables', 'Cobro'],
    responsabilidades: Array.isArray(parsed.responsabilidades) ? parsed.responsabilidades : [],
  };
}

function writeDB(db) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2));
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const onlyText = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

app.get('/api/tipos-responsabilidad', (req, res) => {
  const db = readDB();
  res.json([...db.tipos].sort((a, b) => a.localeCompare(b, 'es')));
});

app.post('/api/tipos-responsabilidad', (req, res) => {
  const { nombre } = req.body;
  if (!nombre || !onlyText.test(nombre.trim())) {
    return res.status(400).json({ error: 'Nombre de tipo inválido.' });
  }

  const db = readDB();
  const normalizado = nombre.trim();
  if (db.tipos.some((t) => t.toLowerCase() === normalizado.toLowerCase())) {
    return res.status(409).json({ error: 'Tipo de responsabilidad ya existe.' });
  }
  db.tipos.push(normalizado);
  writeDB(db);
  return res.status(201).json({ ok: true });
});

app.post('/api/responsabilidades', (req, res) => {
  const { nombres, apellidos, fecha, responsabilidad } = req.body;

  if (!nombres || !apellidos || !fecha || !responsabilidad) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }
  if (!onlyText.test(nombres.trim()) || !onlyText.test(apellidos.trim())) {
    return res.status(400).json({ error: 'Nombre y apellidos deben contener solo texto.' });
  }
  if (Number.isNaN(Date.parse(fecha))) {
    return res.status(400).json({ error: 'Fecha inválida.' });
  }

  const db = readDB();

  const countDay = db.responsabilidades.filter((r) => r.fecha === fecha).length;
  if (countDay >= 5) {
    return res.status(400).json({ error: 'Máximo 5 responsables por fecha.' });
  }

  const duplicate = db.responsabilidades.some((r) =>
    r.nombres.toLowerCase() === nombres.trim().toLowerCase()
    && r.apellidos.toLowerCase() === apellidos.trim().toLowerCase()
    && r.fecha === fecha
    && r.responsabilidad.toLowerCase() === responsabilidad.toLowerCase()
  );

  if (duplicate) {
    return res.status(409).json({ error: 'No se permiten registros duplicados para misma persona/fecha/responsabilidad.' });
  }

  db.responsabilidades.push({
    id: db.nextId,
    nombres: nombres.trim(),
    apellidos: apellidos.trim(),
    fecha,
    responsabilidad,
    estado: 'Pendiente',
    created_at: new Date().toISOString(),
  });
  db.nextId += 1;
  writeDB(db);

  return res.status(201).json({ ok: true });
});

app.get('/api/responsabilidades-hoy', (req, res) => {
  const db = readDB();
  const today = new Date().toISOString().slice(0, 10);
  const data = db.responsabilidades
    .filter((r) => r.fecha === today && r.estado === 'Pendiente')
    .sort((a, b) => `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`, 'es'));

  res.json({ fecha: today, data });
});

app.patch('/api/responsabilidades/:id/cumplio', (req, res) => {
  const db = readDB();
  const id = Number(req.params.id);
  const row = db.responsabilidades.find((r) => r.id === id && r.estado === 'Pendiente');

  if (!row) {
    return res.status(404).json({ error: 'Responsabilidad no encontrada o ya cumplida.' });
  }

  row.estado = 'Cumplió';
  writeDB(db);
  return res.json({ ok: true });
});

app.get('/api/calendario', (req, res) => {
  const { year, month } = req.query;
  const y = Number(year);
  const m = Number(month);

  if (!y || !m || m < 1 || m > 12) {
    return res.status(400).json({ error: 'year y month válidos son requeridos.' });
  }

  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const endDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

  const db = readDB();
  const rows = db.responsabilidades
    .filter((r) => r.fecha >= start && r.fecha <= end)
    .sort((a, b) => `${a.fecha}-${a.apellidos}-${a.nombres}`.localeCompare(`${b.fecha}-${b.apellidos}-${b.nombres}`, 'es'));

  return res.json(rows);
});

app.get('/api/historial', (req, res) => {
  const { nombre = '', fecha = '', responsabilidad = '', estado = '' } = req.query;
  const db = readDB();

  const rows = db.responsabilidades
    .filter((r) => `${r.nombres} ${r.apellidos}`.toLowerCase().includes(String(nombre).toLowerCase()))
    .filter((r) => r.fecha.includes(String(fecha)))
    .filter((r) => r.responsabilidad.toLowerCase().includes(String(responsabilidad).toLowerCase()))
    .filter((r) => r.estado.toLowerCase().includes(String(estado).toLowerCase()))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  return res.json(rows);
});

app.get('/api/stats', (req, res) => {
  const db = readDB();
  const cumplidas = db.responsabilidades.filter((r) => r.estado === 'Cumplió').length;
  const pendientes = db.responsabilidades.filter((r) => r.estado === 'Pendiente').length;

  const tally = new Map();
  db.responsabilidades
    .filter((r) => r.estado === 'Cumplió')
    .forEach((r) => {
      const k = `${r.nombres}||${r.apellidos}`;
      tally.set(k, (tally.get(k) || 0) + 1);
    });

  let top = null;
  for (const [key, total] of tally.entries()) {
    if (!top || total > top.total) {
      const [nombres, apellidos] = key.split('||');
      top = { nombres, apellidos, total };
    }
  }

  return res.json({ cumplidas, pendientes, top });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
