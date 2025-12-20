import nodemailer from "nodemailer";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

/** 
 use resend to send emails
**/

let transporter: nodemailer.Transporter | null = null;

// Initialize transporter if SMTP is configured
if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS) {
  const smtpPort = parseInt(env.SMTP_PORT, 10);
  const isSecure = smtpPort === 465;

  logger.info(
    `📧 Initializing SMTP transporter: ${env.SMTP_HOST}:${smtpPort} (secure: ${isSecure})`
  );

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: smtpPort,
    secure: isSecure,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    // Hostinger specific settings
    tls: {
      rejectUnauthorized: true,
      minVersion: "TLSv1.2",
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  // Verify SMTP connection on startup
  transporter.verify((error, success) => {
    if (error) {
      logger.error("❌ SMTP connection failed:", error);
      logger.error(
        `Check your credentials: ${env.SMTP_HOST}:${smtpPort}, user: ${env.SMTP_USER}`
      );
    } else {
      logger.info("✅ SMTP transporter ready to send emails");
    }
  });
} else {
  logger.warn("⚠️ SMTP not configured. Email sending disabled.");
}

// Base email styles - Professional and clean
const baseStyles = `
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .text {
      color: #4b5563;
      margin-bottom: 16px;
      line-height: 1.7;
    }
    .btn {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
    }
    .info-box {
      background-color: #f3f4f6;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .success-box {
      background-color: #ecfdf5;
      border-left: 4px solid #10b981;
      padding: 20px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .warning-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .alert-box {
      background-color: #fee2e2;
      border-left: 4px solid #ef4444;
      padding: 20px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 30px 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .security-badge {
      display: inline-flex;
      align-items: center;
      background-color: #dbeafe;
      color: #1e40af;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      margin: 10px 0;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 24px 0;
      text-align: center;
    }
    .stat-item {
      padding: 15px;
      background-color: #f9fafb;
      border-radius: 6px;
    }
    .stat-number {
      display: block;
      font-size: 24px;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 5px;
    }
    .stat-label {
      display: block;
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .feature-list {
      margin: 20px 0;
    }
    .feature-item {
      display: flex;
      margin-bottom: 16px;
    }
    .feature-icon {
      font-size: 24px;
      margin-right: 15px;
      flex-shrink: 0;
    }
    .feature-text {
      flex: 1;
    }
    .feature-text strong {
      color: #1f2937;
      display: block;
      margin-bottom: 4px;
    }
    .highlight {
      background-color: #fef3c7;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: 600;
    }
    @media only screen and (max-width: 600px) {
      .container {
        margin: 10px;
        border-radius: 0;
      }
      .content {
        padding: 30px 20px;
      }
      .header {
        padding: 30px 20px;
      }
      .stats-grid {
        grid-template-columns: 1fr;
        gap: 10px;
      }
    }
  </style>
`;

export class EmailService {
  static async sendVerificationEmail(
    email: string,
    token: string,
    username?: string
  ): Promise<void> {
    if (!transporter) {
      logger.warn("Email service not configured. Skipping email send.");
      logger.info(`Verification token for ${email}: ${token}`);
      return;
    }

    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    const displayName = username || "DEV";
    const fromEmail =
      env.EMAIL_FROM || env.SMTP_FROM || env.SMTP_USER || "noreply@alldev.pt";

    logger.info(
      `📧 Sending verification email to ${email} (from: ${fromEmail})`
    );

    try {
      const info = await transporter.sendMail({
        from: `"Alldev Community" <${fromEmail}>`,
        to: email,
        subject: "🚀 Bem-vindo ao Alldev - Verificação de Email Necessária",
        html: `
          <!DOCTYPE html>
          <html lang="pt">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bem-vindo ao Alldev</title>
            ${baseStyles}
          </head>
          <body>
            <div class="container">
              <!-- Header -->
              <div class="header">
                <h1>🚀 Bem-vindo ao Alldev!</h1>
                <p>A Comunidade Global de Programadores</p>
              </div>
  
              <!-- Content -->
              <div class="content">
                <p class="greeting">Olá, ${displayName}! 👋</p>
                
                <p class="text">
                  <strong>Parabéns por dar o primeiro passo!</strong> Ficamos muito felizes por teres escolhido o <strong>Alldev</strong> 
                  para fazer parte da tua jornada como programador. Acabaste de te juntar a uma comunidade vibrante de milhares de 
                  desenvolvedores que partilham conhecimento, resolvem problemas e crescem juntos todos os dias.
                </p>

                <!-- Verification Box -->
                <div class="info-box">
                  <p style="margin: 0 0 15px 0;"><strong>🔐 Último Passo: Verifica o Teu Email</strong></p>
                  <p style="margin: 0 0 20px 0; color: #4b5563;">
                    Para garantir a <span class="highlight">segurança da tua conta</span> e aceder a todas as funcionalidades premium, 
                    precisamos que confirmes o teu endereço de email.
                  </p>
                  <a href="${verificationUrl}" class="btn">✓ Verificar Email Agora</a>
                  <p style="margin: 15px 0 0 0; font-size: 13px; color: #6b7280;">
                    Link válido por <strong>24 horas</strong> • Clique único • Seguro e encriptado
                  </p>
                </div>

                <div class="divider"></div>

                <!-- Stats -->
                <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 15px; text-align: center;">
                  Junta-te a Milhares de Programadores
                </h2>
                <div class="stats-grid">
                  <div class="stat-item">
                    <span class="stat-number">50K+</span>
                    <span class="stat-label">Programadores</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">100K+</span>
                    <span class="stat-label">Posts</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">95%</span>
                    <span class="stat-label">Satisfação</span>
                  </div>
                </div>

                <div class="divider"></div>

                <!-- Features -->
                <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">
                  🎯 O Que Podes Fazer no Alldev
                </h2>
                
                <div class="feature-list">
                  <div class="feature-item">
                    <div class="feature-icon">💬</div>
                    <div class="feature-text">
                      <strong>Faz Perguntas & Obtém Respostas Rápidas</strong>
                      <p style="color: #6b7280; margin: 4px 0 0 0;">Publica questões técnicas e recebe ajuda de especialistas em minutos. A nossa comunidade está sempre pronta a ajudar.</p>
                    </div>
                  </div>

                  <div class="feature-item">
                    <div class="feature-icon">⭐</div>
                    <div class="feature-text">
                      <strong>Constrói Reputação & Credibilidade</strong>
                      <p style="color: #6b7280; margin: 4px 0 0 0;">Ganha pontos por contribuições de qualidade e evolui de Novato a Guru. Destaca-te na comunidade!</p>
                    </div>
                  </div>

                  <div class="feature-item">
                    <div class="feature-icon">🏷️</div>
                    <div class="feature-text">
                      <strong>Explora Conteúdo Organizado</strong>
                      <p style="color: #6b7280; margin: 4px 0 0 0;">Descobre discussões por tecnologia: JavaScript, Python, React, Node.js, Docker e centenas de outras tags.</p>
                    </div>
                  </div>

                  <div class="feature-item">
                    <div class="feature-icon">👤</div>
                    <div class="feature-text">
                      <strong>Perfil Profissional</strong>
                      <p style="color: #6b7280; margin: 4px 0 0 0;">Cria um portfólio que destaca as tuas skills, contribuições e conquistas na comunidade.</p>
                    </div>
                  </div>

                  <div class="feature-item">
                    <div class="feature-icon">🔔</div>
                    <div class="feature-text">
                      <strong>Notificações em Tempo Real</strong>
                      <p style="color: #6b7280; margin: 4px 0 0 0;">Recebe alertas quando alguém responde às tuas perguntas ou menciona o teu username.</p>
                    </div>
                  </div>

                  <div class="feature-item">
                    <div class="feature-icon">🌐</div>
                    <div class="feature-text">
                      <strong>Networking Global</strong>
                      <p style="color: #6b7280; margin: 4px 0 0 0;">Conecta-te com programadores de todo o mundo e expande a tua rede profissional.</p>
                    </div>
                  </div>
                </div>

                <div class="divider"></div>

                <!-- Security Badge -->
                <div class="success-box">
                  <p style="margin: 0 0 10px 0;"><strong>🔒 A Tua Segurança é a Nossa Prioridade</strong></p>
                  <p style="margin: 0; color: #065f46; line-height: 1.6;">
                    ✓ <strong>Encriptação de ponta a ponta</strong> em todas as comunicações<br>
                    ✓ <strong>Proteção de dados pessoais</strong> conforme RGPD<br>
                    ✓ <strong>Autenticação segura</strong> com tokens únicos<br>
                    ✓ <strong>Zero spam</strong> - nunca partilhamos o teu email<br>
                    ✓ Este link expira em <strong>24 horas</strong> por motivos de segurança
                  </p>
                </div>

                <div class="divider"></div>

                <!-- Help Section -->
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 24px 0;">
                  <p style="margin: 0 0 12px 0; color: #4b5563;">
                    <strong>❓ Precisas de Ajuda?</strong>
                  </p>
                  <p style="margin: 0; color: #6b7280; line-height: 1.6;">
                    A nossa equipa de suporte está sempre disponível:<br>
                    • Visita o <a href="${
                      env.FRONTEND_URL
                    }/faq" style="color: #667eea; text-decoration: none;">Centro de Ajuda</a><br>
                    • <a href="${
                      env.FRONTEND_URL
                    }/contact" style="color: #667eea; text-decoration: none;">Contacta o Suporte</a> diretamente<br>
                    • Junta-te ao nosso <a href="${
                      env.FRONTEND_URL
                    }/discord" style="color: #667eea; text-decoration: none;">Discord</a> da comunidade
                  </p>
                </div>

                <!-- Didn't Request -->
                <p class="text" style="font-size: 13px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                  <strong>Não criaste esta conta?</strong><br>
                  Se não solicitaste este registo, podes ignorar este email com toda a segurança. 
                  A tua conta não será ativada sem a verificação do email.
                </p>

                <p class="text" style="margin-top: 30px; font-size: 15px;">
                  <strong>Feliz Coding! 💻✨</strong><br>
                  <span style="color: #667eea; font-weight: 600;">A Equipa Alldev</span>
                </p>
              </div>
  
              <!-- Footer -->
              <div class="footer">
                <p style="margin-bottom: 15px;">
                  <a href="${env.FRONTEND_URL}">🌐 Website</a> •  
                  <a href="${env.FRONTEND_URL}/faq">❓ FAQ</a> • 
                  <a href="${env.FRONTEND_URL}/terms">📄 Termos</a> • 
                  <a href="${env.FRONTEND_URL}/privacy">🔒 Privacidade</a>
                </p>
                
                <p style="margin-bottom: 10px;">
                  <strong>Alldev</strong> - Comunidade Global de Programadores<br>
                  © ${new Date().getFullYear()} Alldev. Todos os direitos reservados.
                </p>
                
                <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                  Recebeste este email porque criaste uma conta em Alldev Community<br>
                  <a href="${verificationUrl}">Verificar Email</a> • 
                  <a href="${
                    env.FRONTEND_URL
                  }/unsubscribe">Cancelar Subscrição</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      logger.info(
        `✅ Verification email sent successfully to ${email} (messageId: ${info.messageId})`
      );
    } catch (error) {
      logger.error(`❌ Failed to send verification email to ${email}:`, error);
      // Don't throw - let the calling function handle it
    }
  }

  static async sendPasswordResetEmail(
    email: string,
    token: string,
    username?: string
  ): Promise<void> {
    if (!transporter) {
      logger.warn("Email service not configured. Skipping email send.");
      logger.info(`Password reset token for ${email}: ${token}`);
      return;
    }

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    const displayName = username || "Programador";
    const timestamp = new Date().toLocaleString("pt-PT", {
      dateStyle: "short",
      timeStyle: "short",
    });
    const fromEmail =
      env.EMAIL_FROM || env.SMTP_FROM || env.SMTP_USER || "noreply@alldev.pt";

    logger.info(
      `📧 Sending password reset email to ${email} (from: ${fromEmail})`
    );

    try {
      const info = await transporter.sendMail({
        from: `"Alldev Security" <${fromEmail}>`,
        to: email,
        subject: "🔐 Recuperação de Password - Alldev",
        html: `
          <!DOCTYPE html>
          <html lang="pt">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recuperação de Password</title>
            ${baseStyles}
          </head>
          <body>
            <div class="container">
              <!-- Header -->
              <div class="header">
                <h1>🔐 Recuperação de Password</h1>
                <p>Pedido de Alteração de Password</p>
              </div>
  
              <!-- Content -->
              <div class="content">
                <p class="greeting">Olá, ${displayName}!</p>
                
                <p class="text">
                  Recebemos um pedido para <strong>redefinir a password</strong> da tua conta Alldev. 
                  Se foste tu que solicitaste esta alteração, podes criar uma nova password de forma segura.
                </p>

                <!-- Alert Box -->
                <div class="warning-box">
                  <p style="margin: 0 0 15px 0;"><strong>⏰ Ação Necessária</strong></p>
                  <p style="margin: 0 0 20px 0; color: #92400e;">
                    Por motivos de segurança, este link de recuperação <span class="highlight">expira em 1 hora</span> 
                    e só pode ser usado uma vez.
                  </p>
                  <a href="${resetUrl}" class="btn">🔑 Criar Nova Password</a>
                  <p style="margin: 15px 0 0 0; font-size: 13px; color: #92400e;">
                    Pedido realizado em: <strong>${timestamp}</strong>
                  </p>
                </div>

                <div class="divider"></div>

                <!-- Security Tips -->
                <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 15px;">
                  🛡️ Dicas para uma Password Segura
                </h2>

                <div class="success-box">
                  <div style="line-height: 1.8; color: #065f46;">
                    ✓ Use <strong>pelo menos 8 caracteres</strong><br>
                    ✓ Combine <strong>letras maiúsculas e minúsculas</strong><br>
                    ✓ Inclua <strong>números e caracteres especiais</strong> (@, #, $, etc.)<br>
                    ✓ Evite <strong>palavras óbvias</strong> ou informações pessoais<br>
                    ✓ Não reutilize passwords de outras plataformas<br>
                    ✓ Considere usar um <strong>gestor de passwords</strong>
                  </div>
                </div>

                <div class="divider"></div>

                <!-- Security Notice -->
                <div class="alert-box">
                  <p style="margin: 0 0 10px 0;"><strong>⚠️ Não Foste Tu?</strong></p>
                  <p style="margin: 0; color: #991b1b; line-height: 1.6;">
                    Se <strong>não solicitaste</strong> esta recuperação de password, a tua conta pode estar em risco. 
                    Por favor, toma estas medidas imediatamente:
                  </p>
                  <ul style="margin: 10px 0 0 20px; padding: 0; color: #991b1b;">
                    <li style="margin-bottom: 8px;"><strong>Ignora este email</strong> - O link não funcionará sem a tua ação</li>
                    <li style="margin-bottom: 8px;"><strong>Altera a tua password</strong> fazendo login normal</li>
                    <li style="margin-bottom: 8px;"><strong>Ativa a autenticação de dois fatores</strong> (em breve)</li>
                    <li><a href="${
                      env.FRONTEND_URL
                    }/contact" style="color: #991b1b; text-decoration: underline;"><strong>Contacta o nosso suporte</strong></a> urgentemente</li>
                  </ul>
                </div>

                <div class="divider"></div>

                <!-- Info Box -->
                <div class="info-box">
                  <p style="margin: 0 0 10px 0;"><strong>🔒 Garantia de Segurança</strong></p>
                  <p style="margin: 0; color: #4b5563; line-height: 1.6;">
                    • A Alldev <strong>nunca pedirá</strong> a tua password por email<br>
                    • Todos os links são <strong>encriptados e únicos</strong><br>
                    • As passwords são armazenadas com <strong>encriptação bcrypt</strong><br>
                    • Usamos <strong>tokens seguros</strong> para autenticação<br>
                    • <strong>Monitorização 24/7</strong> de atividades suspeitas
                  </p>
                </div>

                <!-- Help Section -->
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 24px 0;">
                  <p style="margin: 0 0 12px 0; color: #4b5563;">
                    <strong>❓ Precisas de Ajuda?</strong>
                  </p>
                  <p style="margin: 0; color: #6b7280; line-height: 1.6;">
                    Se tiveres alguma dúvida ou dificuldade:<br>
                    • <a href="${
                      env.FRONTEND_URL
                    }/faq" style="color: #667eea; text-decoration: none;">Consulta o FAQ</a><br>
                    • <a href="${
                      env.FRONTEND_URL
                    }/contact" style="color: #667eea; text-decoration: none;">Contacta o Suporte</a> diretamente<br>
                    • Resposta garantida em <strong>menos de 24 horas</strong>
                  </p>
                </div>

                <!-- Link Manual -->
                <p class="text" style="font-size: 13px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                  <strong>O botão não funciona?</strong><br>
                  Copia e cola este link no teu navegador:<br>
                  <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
                </p>

                <p class="text" style="margin-top: 30px;">
                  <strong>Mantém-te Seguro! 🛡️</strong><br>
                  <span style="color: #667eea; font-weight: 600;">Equipa de Segurança Alldev</span>
                </p>
              </div>
  
              <!-- Footer -->
              <div class="footer">
                <p style="margin-bottom: 15px;">
                  <a href="${env.FRONTEND_URL}">🌐 Website</a> • 
                  <a href="${
                    env.FRONTEND_URL
                  }/security">🔒 Centro de Segurança</a> • 
                  <a href="${env.FRONTEND_URL}/contact">📧 Suporte</a> • 
                  <a href="${env.FRONTEND_URL}/privacy">🛡️ Privacidade</a>
                </p>
                
                <p style="margin-bottom: 10px;">
                  <strong>Alldev</strong> - Comunidade Global de Programadores<br>
                  © ${new Date().getFullYear()} Alldev. Todos os direitos reservados.
                </p>
                
                <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                  Este é um email automático de segurança. Por favor, não respondas.<br>
                  Para assistência, contacta: <a href="${
                    env.FRONTEND_URL
                  }/contact">suporte@alldev.community</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      logger.info(
        `✅ Password reset email sent successfully to ${email} (messageId: ${info.messageId})`
      );
    } catch (error) {
      logger.error(
        `❌ Failed to send password reset email to ${email}:`,
        error
      );
      // Don't throw - let the calling function handle it
    }
  }

  static async sendAccountDeletionEmail(
    email: string,
    token: string,
    username?: string
  ): Promise<void> {
    // Always console.log the token to help debugging in dev environments
    // eslint-disable-next-line no-console
    console.log(`Account deletion token for ${email}: ${token}`);

    if (!transporter) {
      logger.warn("Email service not configured. Skipping email send.");
      return;
    }

    const displayName = username || "Membro";
    const fromEmail =
      env.EMAIL_FROM || env.SMTP_FROM || env.SMTP_USER || "noreply@alldev.pt";

    try {
      // eslint-disable-next-line no-console
      console.log(
        `Attempting to send account deletion email to ${email} via SMTP host: ${env.SMTP_HOST}:${env.SMTP_PORT}`
      );
      const info = await transporter.sendMail({
        from: `"Alldev Security" <${fromEmail}>`,
        to: email,
        subject: "🔐 Código para confirmar exclusão de conta - Alldev",
        html: `
          <!DOCTYPE html>
          <html lang="pt">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Código de Exclusão de Conta</title>
            ${baseStyles}
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Código de Exclusão de Conta</h1>
              </div>
              <div class="content">
                <p class="greeting">Olá, ${displayName}!</p>
                <p class="text">Recebemos um pedido para excluir a tua conta. Para confirmar, por favor utiliza o código abaixo na página de definições e digita <strong>DELETE</strong> quando solicitado.</p>
                <div class="info-box">
                  <p style="font-size: 20px; font-weight: 700; margin: 0;">${token}</p>
                  <p style="margin-top: 10px; font-size: 13px; color: #6b7280;">Código válido por 1 hora.</p>
                </div>
                <p class="text">Se não solicitaste esta ação, ignora este email.</p>
              </div>
              <div class="footer">
                <p style="color: #6b7280; font-size: 13px;">Alldev • Comunidade de Programadores</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      logger.info(
        `Account deletion email sent to ${email} (messageId: ${info.messageId})`
      );
      // eslint-disable-next-line no-console
      console.log(
        `Account deletion email sent to ${email} (messageId: ${info.messageId})`
      );
    } catch (error) {
      logger.error(`Failed to send account deletion email to ${email}:`, error);
      // eslint-disable-next-line no-console
      console.error(
        `Failed to send account deletion email to ${email}:`,
        error
      );
    }
  }

  static async sendWarningEmail(
    email: string,
    reason: string,
    username?: string,
    details?: string
  ): Promise<void> {
    if (!transporter) {
      logger.warn("Email service not configured. Skipping email send.");
      return;
    }

    const displayName = username || "Membro";
    const timestamp = new Date().toLocaleString("pt-PT", {
      dateStyle: "long",
      timeStyle: "short",
    });
    const fromEmail =
      env.EMAIL_FROM || env.SMTP_FROM || env.SMTP_USER || "noreply@alldev.pt";

    try {
      await transporter.sendMail({
        from: `"Alldev Moderation" <${fromEmail}>`,
        to: email,
        subject: "⚠️ Aviso Importante da Moderação - Alldev",
        html: `
          <!DOCTYPE html>
          <html lang="pt">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Aviso de Moderação</title>
            ${baseStyles}
          </head>
          <body>
            <div class="container">
              <!-- Header -->
              <div class="header">
                <h1>⚠️ Aviso de Moderação</h1>
                <p>Equipa de Moderação Alldev</p>
              </div>
  
              <!-- Content -->
              <div class="content">
                <p class="greeting">Olá, ${displayName},</p>
                
                <p class="text">
                  A equipa de moderação da Alldev reviu recentemente a tua atividade na plataforma e 
                  identificou uma situação que requer a tua atenção.
                </p>

                <!-- Warning Box -->
                <div class="warning-box">
                  <p style="margin: 0 0 15px 0;"><strong>📋 Detalhes do Aviso</strong></p>
                  <p style="margin: 0 0 10px 0; color: #92400e;">
                    <strong>Motivo:</strong> ${reason}
                  </p>
                  ${
                    details
                      ? `
                    <p style="margin: 0; color: #92400e; line-height: 1.6;">
                      <strong>Informação Adicional:</strong><br>
                      ${details}
                    </p>
                  `
                      : ""
                  }
                  <p style="margin: 15px 0 0 0; font-size: 13px; color: #92400e;">
                    Data do Aviso: <strong>${timestamp}</strong>
                  </p>
                </div>

                <div class="divider"></div>

                <!-- Guidelines -->
                <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 15px;">
                  📜 Diretrizes da Comunidade
                </h2>

                <div class="info-box">
                  <p style="margin: 0 0 15px 0; color: #1f2937;">
                    <strong>Lembramos-te das nossas regras fundamentais:</strong>
                  </p>
                  <div style="line-height: 1.8; color: #4b5563;">
                    ✓ <strong>Respeito mútuo:</strong> Trata todos os membros com cordialidade e profissionalismo<br>
                    ✓ <strong>Conteúdo relevante:</strong> Mantém as discussões focadas em programação e tecnologia<br>
                    ✓ <strong>Sem spam:</strong> Evita publicações promocionais ou repetitivas<br>
                    ✓ <strong>Linguagem adequada:</strong> Não uses linguagem ofensiva ou discriminatória<br>
                    ✓ <strong>Código de qualidade:</strong> Partilha soluções testadas e bem documentadas<br>
                    ✓ <strong>Propriedade intelectual:</strong> Respeita direitos de autor e licenças
                  </div>
                </div>

                <div class="divider"></div>

                <!-- Consequences -->
                <div class="alert-box">
                  <p style="margin: 0 0 10px 0;"><strong>⚖️ Consequências de Violações Repetidas</strong></p>
                  <p style="margin: 0; color: #991b1b; line-height: 1.6;">
                    Este aviso é um <strong>lembrete amigável</strong> para manter a qualidade da nossa comunidade. 
                    No entanto, violações repetidas podem resultar em:
                  </p>
                  <ul style="margin: 10px 0 0 20px; padding: 0; color: #991b1b;">
                    <li style="margin-bottom: 8px;">Limitação temporária de funcionalidades</li>
                    <li style="margin-bottom: 8px;">Suspensão temporária da conta</li>
                    <li style="margin-bottom: 8px;">Em casos graves: banimento permanente</li>
                  </ul>
                </div>

                <div class="divider"></div>

                <!-- Next Steps -->
                <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 15px;">
                  🎯 O Que Fazer Agora
                </h2>

                <div class="success-box">
                  <div style="line-height: 1.8; color: #065f46;">
                    <strong>1. Revê as Diretrizes</strong><br>
                    Lê atentamente os nossos <a href="${
                      env.FRONTEND_URL
                    }/terms" style="color: #065f46; text-decoration: underline;">Termos de Uso</a> 
                    e <a href="${
                      env.FRONTEND_URL
                    }/community-guidelines" style="color: #065f46; text-decoration: underline;">Diretrizes da Comunidade</a>
                    <br><br>
                    
                    <strong>2. Ajusta o Teu Comportamento</strong><br>
                    Assegura-te de que futuras contribuições respeitam as regras da comunidade
                    <br><br>
                    
                    <strong>3. Contribui Positivamente</strong><br>
                    Volta a participar de forma construtiva - a comunidade valoriza as tuas contribuições de qualidade
                    <br><br>
                    
                    <strong>4. Contacta a Moderação</strong><br>
                    Se tiveres dúvidas sobre este aviso, <a href="${
                      env.FRONTEND_URL
                    }/contact" style="color: #065f46; text-decoration: underline;">contacta-nos</a> - 
                    estamos aqui para ajudar!
                  </div>
                </div>

                <div class="divider"></div>

                <!-- Positive Note -->
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea;">
                  <p style="margin: 0 0 10px 0; color: #1f2937;">
                    <strong>💡 Vamos Crescer Juntos</strong>
                  </p>
                  <p style="margin: 0; color: #4b5563; line-height: 1.6;">
                    Acreditamos no potencial de todos os membros da nossa comunidade. 
                    Este aviso é uma oportunidade de crescimento e melhoria. A Alldev é construída por programadores como tu, 
                    e queremos que continues a fazer parte desta jornada coletiva de aprendizagem e partilha de conhecimento.
                  </p>
                </div>

                <!-- Appeal -->
                <p class="text" style="font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                  <strong>🤔 Achas que este aviso foi injusto?</strong><br>
                  Se acreditas que houve um mal-entendido ou tens contexto adicional que gostaríamos de conhecer, 
                  podes <a href="${env.FRONTEND_URL}/appeal?ref=${Buffer.from(
          email
        ).toString(
          "base64"
        )}" style="color: #667eea; text-decoration: none;"><strong>submeter um recurso</strong></a>. 
                  Cada caso é analisado individualmente pela nossa equipa.
                </p>

                <p class="text" style="margin-top: 30px;">
                  <strong>Obrigado pela tua compreensão! 🤝</strong><br>
                  <span style="color: #667eea; font-weight: 600;">Equipa de Moderação Alldev</span>
                </p>
              </div>
  
              <!-- Footer -->
              <div class="footer">
                <p style="margin-bottom: 15px;">
                  <a href="${env.FRONTEND_URL}">🌐 Website</a> • 
                  <a href="${env.FRONTEND_URL}/terms">📄 Termos</a> • 
                  <a href="${
                    env.FRONTEND_URL
                  }/community-guidelines">📜 Diretrizes</a> • 
                  <a href="${
                    env.FRONTEND_URL
                  }/contact">📧 Contactar Moderação</a>
                </p>
                
                <p style="margin-bottom: 10px;">
                  <strong>Alldev</strong> - Comunidade Global de Programadores<br>
                  © ${new Date().getFullYear()} Alldev. Todos os direitos reservados.
                </p>
                
                <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                  Este email foi enviado pela Equipa de Moderação Alldev<br>
                  Para questões sobre este aviso: <a href="${
                    env.FRONTEND_URL
                  }/contact">moderation@alldev.community</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      logger.info(`Warning email sent to ${email}`);
    } catch (error) {
      logger.error("Failed to send warning email:", error);
      // Don't throw - this is a non-critical operation
    }
  }
}
