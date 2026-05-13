const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

// Obtener todos los negocios del usuario autenticado
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM negocios WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /negocios:', err.message);
    res.status(500).json({ error: 'Error obteniendo negocios' });
  }
});

// Obtener un negocio por id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM negocios WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /negocios/:id:', err.message);
    res.status(500).json({ error: 'Error obteniendo negocio' });
  }
});

// Crear un negocio
router.post('/', async (req, res) => {
  const { nombre, tipo, num_sellos, premio, premios, diseno, caducidad_meses, telefono, direccion } = req.body;

  if (!nombre || !tipo || !num_sellos) {
    return res.status(400).json({ error: 'nombre, tipo y num_sellos son obligatorios' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO negocios (user_id, nombre, tipo, num_sellos, premio, premios, diseno, caducidad_meses, telefono, direccion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.user.id, nombre, tipo, num_sellos, premio ?? null, premios ? JSON.stringify(premios) : null,
       diseno ? JSON.stringify(diseno) : null, caducidad_meses ?? null, telefono ?? null, direccion ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /negocios:', err.message);
    res.status(500).json({ error: 'Error creando negocio' });
  }
});

// Actualizar un negocio
router.put('/:id', async (req, res) => {
  const { nombre, tipo, num_sellos, premio, premios, diseno, caducidad_meses, telefono, direccion } = req.body;

  try {
    const result = await pool.query(
      `UPDATE negocios SET
        nombre = COALESCE($1, nombre),
        tipo = COALESCE($2, tipo),
        num_sellos = COALESCE($3, num_sellos),
        premio = COALESCE($4, premio),
        premios = COALESCE($5, premios),
        diseno = COALESCE($6, diseno),
        caducidad_meses = COALESCE($7, caducidad_meses),
        telefono = COALESCE($8, telefono),
        direccion = COALESCE($9, direccion)
       WHERE id = $10 AND user_id = $11 RETURNING *`,
      [nombre ?? null, tipo ?? null, num_sellos ?? null, premio ?? null,
       premios ? JSON.stringify(premios) : null, diseno ? JSON.stringify(diseno) : null,
       caducidad_meses ?? null, telefono ?? null, direccion ?? null, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Negocio no encontrado o sin permiso' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /negocios/:id:', err.message);
    res.status(500).json({ error: 'Error actualizando negocio' });
  }
});

// Eliminar un negocio
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM negocios WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Negocio no encontrado o sin permiso' });
    }
    res.json({ message: 'Negocio eliminado', id: result.rows[0].id });
  } catch (err) {
    console.error('DELETE /negocios/:id:', err.message);
    res.status(500).json({ error: 'Error eliminando negocio' });
  }
});

module.exports = router;