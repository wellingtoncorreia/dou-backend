import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
app.use(cors());
app.use(express.json());

// 1. Função para codificar acentos no padrão exigido pelo formato RTF
function encodeRTF(str: string) {
  if (!str) return '';
  return str.replace(/[^\x00-\x7F]/g, char => `\\'${char.charCodeAt(0).toString(16).toLowerCase()}`);
}

// 2. Função para remover múltiplos espaços (Regra obrigatória do INCom/DOU)
function limparEspacos(str: string) {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}

app.post('/api/gerar-dou', async (req, res) => {
  try {
    const dados = req.body;
    
    // Gera a data atual por extenso em português (fuso de São Paulo)
    const dataAtual = new Date();
    const formatador = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo'
    });
    const dataEmissaoAutomatica = formatador.format(dataAtual); // Ex: "23 de outubro de 2026"

    // Monta a string dos cursos de forma contínua (SEM quebras de linha)
    const blocosCursos = dados.cursos.map((c: any) => {
      return `do Curso de ${c.nome}, no período de ${c.dataInicio} a ${c.dataFim} nos seguintes livros de registro e sequências numéricas: ${c.registros}`;
    }).join('; e ');

    // Constrói o texto corrido do ##TEX
    let textoTex = `A ${dados.mantenedora}, sob CNPJ ${dados.cnpj}, mantenedora da ${dados.ies}, para fins do disposto do art. 21 da Portaria MEC nº 1.095 de 25 de outubro de 2018, informa que foram registrados os seguintes documentos ${blocosCursos}. A relação dos diplomas registrados poderá ser consultada no endereço: ${dados.site}.`;
    
    // Aplica a limpeza de espaços duplos
    textoTex = limparEspacos(textoTex);
    const localEData = limparEspacos(`${dados.cidade} - ${dados.uf}, ${dataEmissaoAutomatica}.`);
    const assinatura = limparEspacos(dados.assinatura);
    const cargo = limparEspacos(dados.cargo);

    // Constrói o RTF final seguindo ESTRITAMENTE as regras do INCom (DOU)
    // \fs18 = Calibri tamanho 9
    // Sem linhas em branco (\par soltos) entre os marcadores ou no fim
    const conteudoRtf = `{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat{\\fonttbl{\\f0\\fnil\\fcharset0 Calibri;}}
{\\*\\generator Node.js RTF Builder;}\\viewkind4\\uc1\\pard\\f0\\fs18\\lang1046
##ATO REGISTRO DE DIPLOMAS\\par
##TEX ${encodeRTF(textoTex)}\\par
##DAT ${encodeRTF(localEData)}\\par
##ASS ${encodeRTF(assinatura)}\\par
##CAR ${encodeRTF(cargo)}
}`; 
    // Repare que o fechamento "}" fica colado logo após o cargo, sem \par final!

    const rtfBuffer = Buffer.from(conteudoRtf, 'utf-8');

    // Dispara por E-mail via Nodemailer
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
      subject: '📄 Novo Arquivo DOU - Formato INCom',
      text: 'O documento RTF formatado para o INCom/DOU foi gerado com sucesso.',
      attachments: [
        {
          filename: 'gabarito_dou_incom.rtf',
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