const { createRemoteJWKSet, jwtVerify } = require('jose');

// URL pública del JWKS de Supabase para verificar tokens ECC (P-256)
const JWKS = createRemoteJWKSet(
  new URL(`https://slcgqgkvalliqcxpkgyp.supabase.co/auth/v1/.well-known/jwks.json`)
);

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { payload } = await jwtVerify(token, JWKS);

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (err) {
    if (err.code === 'ERR_JWT_EXPIRED') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = authMiddleware;