import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
app.use(cors());
app.use(express.json());

// Função auxiliar para codificar acentos no padrão exigido pelo formato RTF
function encodeRTF(str: string) {
  if (!str) return '';
  return str.replace(/[^\x00-\x7F]/g, char => `\\'${char.charCodeAt(0).toString(16).toLowerCase()}`);
}

app.post('/api/gerar-dou', async (req, res) => {
  try {
    const dados = req.body;
    
    // 1. Gera dinamicamente o texto de todos os cursos preenchidos
    const blocosCursos = dados.cursos.map((c: any) => {
      return `\\par \\b Curso ${encodeRTF(c.nome)}:\\b0  no per\\'edodo de ${encodeRTF(c.dataInicio)} a ${encodeRTF(c.dataFim)} nos seguintes livros de registro e sequ\\'eancias num\\'e9ricas: ${encodeRTF(c.registros)}.\\par`;
    }).join('\\par ');

    // 2. Constrói a estrutura nativa do RTF baseada no seu modelo (GABARITO EDF Bach)
    const conteudoRtf = `{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat{\\fonttbl{\\f0\\fnil\\fcharset0 Calibri;}}
{\\*\\generator Node.js RTF Builder;}\\viewkind4\\uc1
\\pard\\sa200\\sl276\\slmult1\\f0\\fs22\\lang22
\\qc\\b ATO REGISTRO DE DIPLOMAS\\b0\\par
\\pard\\qj A \\b ${encodeRTF(dados.mantenedora)}\\b0 , sob CNPJ ${encodeRTF(dados.cnpj)}, mantenedora da \\b ${encodeRTF(dados.ies)}\\b0 , para fins do disposto do art. 21 da Portaria MEC n\\'b0 1.095 de 25 de outubro de 2018, informa que foram registrados os seguintes documentos:\\par
\\par
${blocosCursos}
\\par
\\pard\\qj A rela\\'e7\\'e3o dos diplomas registrados poder\\'e1 ser consultada no endere\\'e7o: ${encodeRTF(dados.site)}.\\par
\\par
\\pard\\qr ${encodeRTF(dados.cidade)} - ${encodeRTF(dados.uf)}, ${encodeRTF(dados.dataEmissao)}.\\par
\\par\\par
\\pard\\qc\\b ${encodeRTF(dados.assinatura)}\\b0\\par
${encodeRTF(dados.cargo)}\\par
}`;

    const rtfBuffer = Buffer.from(conteudoRtf, 'utf-8');

    // 3. Dispara por E-mail via Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: '📄 Novo Arquivo DOU - Múltiplos Cursos',
      text: 'O documento RTF foi gerado com sucesso e encontra-se em anexo.',
      attachments: [
        {
          filename: 'gabarito_dou.rtf',
          content: rtfBuffer 
        }
      ]
    });
    
    return res.status(200).json({ message: 'Sucesso!' });

  } catch (error: any) {
    console.error('Erro:', error);
    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));