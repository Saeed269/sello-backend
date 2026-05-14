require('dotenv').config();

const express = require('express');
const cors = require('cors');

const negociosRouter = require('./routes/negocios');
const clientesRouter = require('./routes/clientes');
const tarjetasRouter = require('./routes/tarjetas');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'https://sello-app.vercel.app',
      'http://localhost:5173',
    ];
    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('CORS no permitido'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Health check para verificar que el servidor está corriendo
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'sello-backend', timestamp: new Date().toISOString() });
});

app.use('/api/negocios', negociosRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/tarjetas', tarjetasRouter);

// Ruta raíz informativa
app.get('/', (req, res) => {
  res.json({
    message: 'SELLO Backend API',
    version: '1.0.0',
    endpoints: [
      'GET  /api/negocios',
      'POST /api/negocios',
      'GET  /api/negocios/:id',
      'PUT  /api/negocios/:id',
      'DEL  /api/negocios/:id',
      'GET  /api/clientes',
      'POST /api/clientes',
      'GET  /api/clientes/:id',
      'PUT  /api/clientes/:id',
      'DEL  /api/clientes/:id',
      'GET  /api/tarjetas',
      'POST /api/tarjetas',
      'GET  /api/tarjetas/:id',
      'POST /api/tarjetas/:id/sello',
      'DEL  /api/tarjetas/:id',
    ],
  });
});

// Handler para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.path} no encontrada` });
});

// Handler global de errores
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 SELLO Backend corriendo en puerto ${PORT}`);
});