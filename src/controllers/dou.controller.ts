import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { encodeRTF, limparEspacos } from '../utils/rtf.utils';

export const gerarDou = async (req: Request, res: Response) => {
  try {
    const dados = req.body;
    
    const dataAtual = new Date();
    const formatador = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo'
    });
    const dataEmissaoAutomatica = formatador.format(dataAtual);

    const blocosCursos = dados.cursos.map((c: any) => {
      return `do Curso de ${c.nome}, no período de ${c.dataInicio} a ${c.dataFim} nos seguintes livros de registro e sequências numéricas: ${c.registros}`;
    }).join('; e ');

    let textoTex = `A ${dados.mantenedora}, sob CNPJ ${dados.cnpj}, mantenedora da ${dados.ies}, para fins do disposto do art. 21 da Portaria MEC nº 1.095 de 25 de outubro de 2018, informa que foram registrados os seguintes documentos ${blocosCursos}. A relação dos diplomas registrados poderá ser consultada no endereço: ${dados.site}.`;
    
    textoTex = limparEspacos(textoTex);
    
    // CORREÇÃO APLICADA: Quebra de linha removida
    const localEData = limparEspacos(`${dados.cidade} - ${dados.uf}, ${dataEmissaoAutomatica}.`);
    
    const assinatura = limparEspacos(dados.assinatura);
    const cargo = limparEspacos(dados.cargo);

    const conteudoRtf = `{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat{\\fonttbl{\\f0\\fnil\\fcharset0 Calibri;}}\n{\\*\\generator Node.js RTF Builder;}\\viewkind4\\uc1\\pard\\f0\\fs18\\lang1046\n##ATO REGISTRO DE DIPLOMAS\\par\n##TEX ${encodeRTF(textoTex)}\\par\n##DAT ${encodeRTF(localEData)}\\par\n##ASS ${encodeRTF(assinatura)}\\par\n##CAR ${encodeRTF(cargo)}\n}`; 

    const rtfBuffer = Buffer.from(conteudoRtf, 'utf-8');

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
      attachments: [{ filename: 'gabarito_dou_incom.rtf', content: rtfBuffer }]
    });
    
    return res.status(200).json({ message: 'Sucesso!' });

  } catch (error: any) {
    console.error('Erro:', error);
    return res.status(500).json({ error: error.message });
  }
};