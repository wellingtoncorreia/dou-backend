import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// 1. CORS dinâmico lendo do .env
export const corsConfig = cors({
  origin: function (origin, callback) {
    const dominiosPermitidos = process.env.ALLOWED_ORIGINS?.split(',') || [];
    // Permite chamadas sem origin (ex: Postman local) ou se estiver na lista
    if (!origin || dominiosPermitidos.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Acesso bloqueado pela política de CORS.'));
    }
  }
});

// 2. Limitação de Taxa (Rate Limit)
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 requisições por IP
  message: { error: 'Muitos pedidos realizados. Tente novamente mais tarde.' }
});

// 3. Validação da API Key
export const validarApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKeyRecebida = req.headers['x-api-key'];
  const apiKeyValida = process.env.API_KEY_SECRETA;

  if (!apiKeyRecebida || apiKeyRecebida !== apiKeyValida) {
    return res.status(401).json({ error: 'Acesso não autorizado. Chave de API inválida.' });
  }
  next();
};