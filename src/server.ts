import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const { WHATSAPP_TOKEN, PHONE_NUMBER_ID, TARGET_NUMBER, PORT } = process.env;

app.post('/api/gerar-dou', async (req: Request, res: Response) => {
  const { mantenedora, cnpj, ies, dataInicio, dataFim, registros, site, cidade, uf, dataEmissao, assinatura, cargo } = req.body;

  try {
    let textoBase = `##ATO REGISTRO DE DIPLOMAS
##TEX A ${mantenedora} sob CNPJ ${cnpj}, mantenedora das ${ies}, para fins do disposto do art. 21 da Portaria MEC n° 1.095 de 25 de outubro de 2018, informa que foram registrados no período de ${dataInicio} a ${dataFim} nos seguintes livros de registro e sequências numéricas ${registros}. A relação dos diplomas registrados poderá ser consultada no endereço: ${site}.
##DAT ${cidade} ${uf}, de ${dataEmissao}.
##ASS ${assinatura}
##CAR ${cargo}.`;

    // Aplica as Regex de limpeza de espaços inquebráveis e caracteres invisíveis
    textoBase = textoBase.replace(/[\uF000-\uF8FF\u200B-\u200D]/g, '')
                         .replace(/[\xA0\t]/g, ' ')
                         .replace(/ {2,}/g, ' ');

    // Estrutura padrão RTF exigida pela Imprensa Nacional (Calibri, fs18)
    const rtfContent = `{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat{\\fonttbl{\\f0\\fnil\\fcharset0 Calibri;}}
{\\*\\generator Node.js;}\\viewkind4\\uc1 
\\pard\\f0\\fs18 ${textoBase.replace(/\n/g, '\\par\\pard\n')}\\par
}`;
    const rtfBuffer = Buffer.from(rtfContent, 'utf-8');

    // Etapa 1: Upload para o repositório da Meta
    const formData = new FormData();
    formData.append('file', rtfBuffer, { filename: 'gabarito_dou.rtf', contentType: 'application/rtf' });
    formData.append('messaging_product', 'whatsapp');

    const uploadRes = await axios.post(
      `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/media`,
      formData,
      { headers: { ...formData.getHeaders(), Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
    );

    const mediaId = uploadRes.data.id;

    // Etapa 2: Envio para o número de destino
    await axios.post(
      `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: TARGET_NUMBER,
        type: 'document',
        document: { id: mediaId, filename: 'gabarito_dou.rtf', caption: 'Arquivo DOU Formatado' }
      },
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' } }
    );

    res.status(200).json({ message: 'Arquivo gerado e enviado com sucesso!' });
  } catch (error: any) {
    console.error('Erro na API do WhatsApp:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erro na integração com WhatsApp' });
  }
});

const serverPort = PORT || 3000;
app.listen(serverPort, () => console.log(`Servidor rodando na porta ${serverPort}`));