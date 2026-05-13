const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

// Obtener todas las tarjetas del usuario autenticado
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, c.nombre AS cliente_nombre, c.email AS cliente_email,
              n.nombre AS negocio_nombre, n.num_sellos, n.premios, n.diseno
       FROM tarjetas t
       JOIN clientes c ON t.cliente_id = c.id
       JOIN negocios n ON t.negocio_id = n.id
       WHERE n.user_id = $1
       ORDER BY t.updated_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /tarjetas:', err.message);
    res.status(500).json({ error: 'Error obteniendo tarjetas' });
  }
});

// Obtener una tarjeta por id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, c.nombre AS cliente_nombre, n.nombre AS negocio_nombre
       FROM tarjetas t
       JOIN clientes c ON t.cliente_id = c.id
       JOIN negocios n ON t.negocio_id = n.id
       WHERE t.id = $1 AND n.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarjeta no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /tarjetas/:id:', err.message);
    res.status(500).json({ error: 'Error obteniendo tarjeta' });
  }
});

// Crear una tarjeta
router.post('/', async (req, res) => {
  const { cliente_id, negocio_id } = req.body;

  if (!cliente_id || !negocio_id) {
    return res.status(400).json({ error: 'cliente_id y negocio_id son obligatorios' });
  }

  try {
    // Verificar que el negocio pertenece al usuario autenticado
    const negocioCheck = await pool.query(
      'SELECT id FROM negocios WHERE id = $1 AND user_id = $2',
      [negocio_id, req.user.id]
    );
    if (negocioCheck.rows.length === 0) {
      return res.status(403).json({ error: 'No tienes permiso sobre este negocio' });
    }

    const result = await pool.query(
      'INSERT INTO tarjetas (cliente_id, negocio_id, sellos_actuales, total_canjes) VALUES ($1, $2, 0, 0) RETURNING *',
      [cliente_id, negocio_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe una tarjeta para este cliente en este negocio' });
    }
    console.error('POST /tarjetas:', err.message);
    res.status(500).json({ error: 'Error creando tarjeta' });
  }
});

// Añadir un sello a la tarjeta
router.post('/:id/sello', async (req, res) => {
  try {
    const query = await pool.query(
      `SELECT t.*, n.num_sellos
       FROM tarjetas t
       JOIN negocios n ON t.negocio_id = n.id
       WHERE t.id = $1 AND n.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (query.rows.length === 0) {
      return res.status(404).json({ error: 'Tarjeta no encontrada o sin permiso' });
    }

    const tarjeta = query.rows[0];
    const nuevosSellos = tarjeta.sellos_actuales + 1;
    const canje = nuevosSellos >= tarjeta.num_sellos;
    const sellosFinales = canje ? 0 : nuevosSellos;
    const nuevosCanjes = canje ? tarjeta.total_canjes + 1 : tarjeta.total_canjes;

    const result = await pool.query(
      'UPDATE tarjetas SET sellos_actuales = $1, total_canjes = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [sellosFinales, nuevosCanjes, req.params.id]
    );

    res.json({
      tarjeta: result.rows[0],
      canje_activado: canje,
      mensaje: canje
        ? `¡Premio conseguido! Canje número ${nuevosCanjes}`
        : `Sello añadido. ${tarjeta.num_sellos - nuevosSellos} sellos para el premio`,
    });
  } catch (err) {
    console.error('POST /tarjetas/:id/sello:', err.message);
    res.status(500).json({ error: 'Error añadiendo sello' });
  }
});

// Eliminar una tarjeta
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM tarjetas t
       USING negocios n
       WHERE t.negocio_id = n.id AND t.id = $1 AND n.user_id = $2
       RETURNING t.id`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarjeta no encontrada o sin permiso' });
    }
    res.json({ message: 'Tarjeta eliminada', id: result.rows[0].id });
  } catch (err) {
    console.error('DELETE /tarjetas/:id:', err.message);
    res.status(500).json({ error: 'Error eliminando tarjeta' });
  }
});

module.exports = router;