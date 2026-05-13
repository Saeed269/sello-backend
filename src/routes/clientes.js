const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

// Obtener todos los clientes del usuario autenticado
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM clientes WHERE user_id = $1 ORDER BY nombre ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /clientes:', err.message);
    res.status(500).json({ error: 'Error obteniendo clientes' });
  }
});

// Obtener un cliente por id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM clientes WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /clientes/:id:', err.message);
    res.status(500).json({ error: 'Error obteniendo cliente' });
  }
});

// Crear un cliente
router.post('/', async (req, res) => {
  const { nombre, email } = req.body;

  if (!nombre || !email) {
    return res.status(400).json({ error: 'nombre y email son obligatorios' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO clientes (user_id, nombre, email) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, nombre, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un cliente con ese email' });
    }
    console.error('POST /clientes:', err.message);
    res.status(500).json({ error: 'Error creando cliente' });
  }
});

// Actualizar un cliente
router.put('/:id', async (req, res) => {
  const { nombre, email } = req.body;

  try {
    const result = await pool.query(
      `UPDATE clientes SET
        nombre = COALESCE($1, nombre),
        email = COALESCE($2, email)
       WHERE id = $3 AND user_id = $4 RETURNING *`,
      [nombre ?? null, email ?? null, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado o sin permiso' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /clientes/:id:', err.message);
    res.status(500).json({ error: 'Error actualizando cliente' });
  }
});

// Eliminar un cliente
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM clientes WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado o sin permiso' });
    }
    res.json({ message: 'Cliente eliminado', id: result.rows[0].id });
  } catch (err) {
    console.error('DELETE /clientes/:id:', err.message);
    res.status(500).json({ error: 'Error eliminando cliente' });
  }
});

module.exports = router;