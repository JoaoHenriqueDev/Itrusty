// Templates de email usando table-based HTML + inline CSS
// Compatível com Gmail, Outlook, Apple Mail, clientes mobile

const ORANGE = '#f97316'
const DARK = '#0f172a'
const TEXT = '#1e293b'
const TEXT_SECONDARY = '#64748b'
const BORDER = '#e2e8f0'
const BG = '#f1f5f9'
const SURFACE = '#ffffff'
const SUCCESS = '#16a34a'
const WARNING = '#d97706'

function base(subject: string, preheader: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; }
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 16px 8px !important; }
      .card { border-radius: 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:${BG};">${preheader}&#8199;&#65279;&#847; &#8199;&#65279;&#847;</div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="wrapper" style="background-color:${BG};padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">

        <!-- Logo -->
        <tr><td style="background-color:${DARK};border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
          <span style="font-size:26px;font-weight:900;letter-spacing:-1px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <span style="color:${ORANGE};">i</span><span style="color:#ffffff;">Trusty</span>
          </span>
        </td></tr>

        <!-- Body -->
        <tr><td class="card" style="background-color:${SURFACE};padding:40px 36px;border-left:1px solid ${BORDER};border-right:1px solid ${BORDER};">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background-color:#f8fafc;border-radius:0 0 12px 12px;border:1px solid ${BORDER};border-top:none;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
            iTrusty — Conectando motoristas e oficinas.<br />
            Se você não solicitou esta ação, ignore este email com segurança.<br />
            Dúvidas? Fale com <a href="mailto:suporte@itrusty.com.br" style="color:${ORANGE};text-decoration:none;">suporte@itrusty.com.br</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function titulo(texto: string): string {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${DARK};letter-spacing:-0.5px;">${texto}</h1>`
}

function paragrafo(texto: string, cor = TEXT): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${cor};">${texto}</p>`
}

function btn(link: string, texto: string, cor = ORANGE): string {
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
    <tr><td style="background-color:${cor};border-radius:8px;">
      <a href="${link}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${texto}</a>
    </td></tr>
  </table>`
}

function linkFallback(link: string): string {
  return `<p style="margin:0 0 24px;font-size:12px;color:${TEXT_SECONDARY};word-break:break-all;">
    Se o botão não funcionar, copie e cole este link no seu navegador:<br />
    <span style="color:${ORANGE};">${link}</span>
  </p>`
}

function aviso(texto: string, cor = WARNING): string {
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;margin:20px 0;">
    <tr><td style="background-color:${cor}18;border-left:3px solid ${cor};border-radius:4px;padding:12px 16px;">
      <p style="margin:0;font-size:13px;color:${cor};font-weight:600;">${texto}</p>
    </td></tr>
  </table>`
}

function divisor(): string {
  return `<hr style="border:none;border-top:1px solid ${BORDER};margin:24px 0;" />`
}

// ─── Templates ───────────────────────────────────────────────────────────────

export function templateBoasVindas({ nome }: { nome: string }): string {
  const primeiroNome = nome.split(' ')[0]
  return base(
    'Bem-vindo ao iTrusty!',
    `Olá ${primeiroNome}, sua conta foi criada com sucesso.`,
    `
    ${titulo(`Bem-vindo, ${primeiroNome}! 🎉`)}
    ${paragrafo('Sua conta no iTrusty foi criada com sucesso. Estamos muito felizes em ter você conosco.')}
    ${paragrafo('Com o iTrusty você pode encontrar as melhores oficinas próximas a você, agendar serviços e acompanhar tudo pelo aplicativo.')}
    ${divisor()}
    ${paragrafo('Para garantir a segurança da sua conta, verifique seu endereço de email clicando no link que enviamos em um email separado.', TEXT_SECONDARY)}
    ${paragrafo('<strong>Dica:</strong> Abra o aplicativo e complete seu perfil para aproveitar todos os recursos do iTrusty.', TEXT_SECONDARY)}
  `
  )
}

export function templateVerificacaoEmail({
  nome,
  link,
}: {
  nome: string
  link: string
}): string {
  const primeiroNome = nome.split(' ')[0]
  return base(
    'Confirme seu email — iTrusty',
    `${primeiroNome}, confirme seu endereço de email para ativar sua conta.`,
    `
    ${titulo('Confirme seu email')}
    ${paragrafo(`Olá, <strong>${primeiroNome}</strong>! Toque no botão abaixo para confirmar seu endereço de email e ativar sua conta.`)}
    ${btn(link, 'Confirmar email')}
    ${linkFallback(link)}
    ${aviso('Este link expira em 24 horas. Após este prazo, solicite um novo link de verificação pelo aplicativo.')}
    ${divisor()}
    ${paragrafo('Se você não criou uma conta no iTrusty, ignore este email com segurança.', TEXT_SECONDARY)}
  `
  )
}

export function templateRedefinicaoSenha({
  nome,
  link,
}: {
  nome: string
  link: string
}): string {
  const primeiroNome = nome.split(' ')[0]
  return base(
    'Redefinição de senha — iTrusty',
    `${primeiroNome}, recebemos uma solicitação para redefinir sua senha.`,
    `
    ${titulo('Redefinição de senha')}
    ${paragrafo(`Olá, <strong>${primeiroNome}</strong>! Recebemos uma solicitação para redefinir a senha da sua conta no iTrusty.`)}
    ${paragrafo('Toque no botão abaixo para criar uma nova senha:')}
    ${btn(link, 'Redefinir minha senha')}
    ${linkFallback(link)}
    ${aviso('Este link expira em <strong>1 hora</strong>. Após este prazo, solicite um novo link no aplicativo.')}
    ${divisor()}
    ${paragrafo('Se você <strong>não solicitou</strong> a redefinição de senha, ignore este email. Sua senha atual permanece inalterada e sua conta está segura.', TEXT_SECONDARY)}
  `
  )
}

export function templateSenhaAlterada({ nome }: { nome: string }): string {
  const primeiroNome = nome.split(' ')[0]
  return base(
    'Senha alterada com sucesso — iTrusty',
    `${primeiroNome}, sua senha foi alterada com sucesso.`,
    `
    ${titulo('Senha alterada ✓')}
    ${paragrafo(`Olá, <strong>${primeiroNome}</strong>! Sua senha foi alterada com sucesso em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })}.`)}
    ${paragrafo('Todos os seus dispositivos foram desconectados por segurança. Faça login novamente com sua nova senha.')}
    ${aviso('Se você <strong>não realizou</strong> esta alteração, entre em contato com nosso suporte imediatamente em suporte@itrusty.com.br', WARNING)}
    ${divisor()}
    ${paragrafo('Esta é uma mensagem automática de segurança. Não é necessário responder.', TEXT_SECONDARY)}
  `
  )
}

export function templateEmailAlterado({
  nome,
  emailNovo,
}: {
  nome: string
  emailNovo: string
}): string {
  const primeiroNome = nome.split(' ')[0]
  return base(
    'Email da conta alterado — iTrusty',
    `${primeiroNome}, o email da sua conta foi alterado.`,
    `
    ${titulo('Email da conta alterado')}
    ${paragrafo(`Olá, <strong>${primeiroNome}</strong>! O endereço de email da sua conta iTrusty foi alterado para:`)}
    <p style="margin:0 0 20px;font-size:16px;font-weight:700;color:${DARK};text-align:center;padding:12px;background:#f1f5f9;border-radius:8px;">${emailNovo}</p>
    ${aviso('Se você <strong>não realizou</strong> esta alteração, entre em contato com nosso suporte em suporte@itrusty.com.br imediatamente.')}
    ${divisor()}
    ${paragrafo('Esta é uma mensagem automática de segurança enviada para o email anterior da conta.', TEXT_SECONDARY)}
  `
  )
}
