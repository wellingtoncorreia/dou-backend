import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();

// Configurações básicas
app.use(cors());
app.use(express.json());

app.post('/api/gerar-dou', async (req, res) => {
  try {
    // 1. Recebe os dados do formulário Angular
    const dados = req.body;

    // 2. Geração do Buffer do arquivo RTF (adapte com a sua lógica real de criação do RTF)
    const conteudoRtf = `{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat{\\fonttbl{\\f0\\fnil\\fcharset0 Calibri;}}\n{\\*\\generator Riched20 10.0.19041}\\viewkind4\\uc1\n\\pard\\sa200\\sl276\\slmult1\\f0\\fs22\\lang22 Ol\\'e1, este \\'e9 o documento DOU!\\par}\n`;
    const rtfBuffer = Buffer.from(conteudoRtf, 'utf-8');

    // =========================================================
    // INTEGRAÇÃO COM NODEMAILER (GMAIL)
    // =========================================================
    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASS = process.env.EMAIL_PASS;

    if (!EMAIL_USER || !EMAIL_PASS) {
      throw new Error('Faltam variáveis de ambiente do E-mail.');
    }

    // Configura a conexão com o Gmail da Borsato Hub
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });

    // Monta o e-mail com o arquivo em anexo
    const mailOptions = {
      from: EMAIL_USER,
      to: EMAIL_USER, // Envia para a sua própria caixa de entrada
      subject: '📄 Novo Arquivo DOU Gerado',
      text: 'O documento RTF foi gerado com sucesso pelo sistema Angular e encontra-se em anexo.',
      attachments: [
        {
          filename: 'gabarito_dou.rtf',
          content: rtfBuffer 
        }
      ]
    };

    // Dispara o e-mail
    await transporter.sendMail(mailOptions);
    
    console.log('E-mail enviado com sucesso!');
    return res.status(200).json({ message: 'Arquivo gerado e enviado por e-mail com sucesso!' });

  } catch (error: any) {
    console.error('Erro no processamento do e-mail:', error);
    return res.status(500).json({ 
      error: 'Erro na geração ou envio do e-mail',
      detalhes: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});