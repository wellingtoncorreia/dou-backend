import { Router } from 'express';
import { gerarDou } from '../controllers/dou.controller';
import { validarApiKey } from '../middlewares/security.middleware';

const router = Router();

// A requisição bate aqui, verifica a API Key primeiro, e só depois chama o Controlador
router.post('/gerar-dou', validarApiKey, gerarDou);

export default router;