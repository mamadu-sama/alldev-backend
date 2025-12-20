import { prisma } from "@/config/database";
import { NotFoundError } from "@/types";

interface UpdatePrivacyPolicyData {
  dataCollectionUserProvided?: string;
  dataCollectionAutomatic?: string;
  dataCollectionThirdParty?: string;
  dataUsageDescription?: string;
  dataSharingDescription?: string;
  dataSharingImportantNote?: string;
  securityMeasures?: string;
  securityDisclaimer?: string;
  dataRetentionDescription?: string;
  lgpdRightsDescription?: string;
  lgpdContactInfo?: string;
  minorsPolicy?: string;
  internationalTransfers?: string;
  accountDeletionDescription?: string;
  accountDeletionProcess?: string;
  dpoName?: string;
  dpoEmail?: string;
  dpoContactPage?: string;
  changeDescription?: string;
}

export class PrivacyPolicyService {
  /**
   * Get current privacy policy content (PUBLIC)
   */
  static async getContent() {
    const content = await prisma.privacyPolicyContent.findFirst({
      orderBy: { lastUpdated: "desc" },
    });

    if (!content) {
      throw new NotFoundError(
        "Conteúdo da Política de Privacidade não encontrado"
      );
    }

    return content;
  }

  /**
   * Get content for editing with metadata (ADMIN/MODERATOR)
   */
  static async getContentForEdit() {
    const content = await prisma.privacyPolicyContent.findFirst({
      orderBy: { lastUpdated: "desc" },
      include: {
        updatedByUser: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundError(
        "Conteúdo da Política de Privacidade não encontrado"
      );
    }

    return content;
  }

  /**
   * Update privacy policy content (ADMIN/MODERATOR)
   */
  static async updateContent(
    data: UpdatePrivacyPolicyData,
    userId: string,
    username: string
  ) {
    // Get current content
    const current = await prisma.privacyPolicyContent.findFirst({
      orderBy: { lastUpdated: "desc" },
    });

    if (!current) {
      throw new NotFoundError(
        "Conteúdo da Política de Privacidade não encontrado"
      );
    }

    const { changeDescription, ...updateData } = data;

    // Use transaction to update content and save history
    const result = await prisma.$transaction(async (tx) => {
      // Save current state to history
      await tx.privacyPolicyHistory.create({
        data: {
          contentId: current.id,
          dataCollectionUserProvided: current.dataCollectionUserProvided,
          dataCollectionAutomatic: current.dataCollectionAutomatic,
          dataCollectionThirdParty: current.dataCollectionThirdParty,
          dataUsageDescription: current.dataUsageDescription,
          dataSharingDescription: current.dataSharingDescription,
          dataSharingImportantNote: current.dataSharingImportantNote,
          securityMeasures: current.securityMeasures,
          securityDisclaimer: current.securityDisclaimer,
          dataRetentionDescription: current.dataRetentionDescription,
          lgpdRightsDescription: current.lgpdRightsDescription,
          lgpdContactInfo: current.lgpdContactInfo,
          minorsPolicy: current.minorsPolicy,
          internationalTransfers: current.internationalTransfers,
          accountDeletionDescription: current.accountDeletionDescription,
          accountDeletionProcess: current.accountDeletionProcess,
          dpoName: current.dpoName,
          dpoEmail: current.dpoEmail,
          dpoContactPage: current.dpoContactPage,
          updatedBy: userId,
          changeDescription:
            changeDescription || "Atualização da Política de Privacidade",
        },
      });

      // Update content
      const updated = await tx.privacyPolicyContent.update({
        where: { id: current.id },
        data: {
          ...updateData,
          lastUpdated: new Date(),
          updatedBy: userId,
        },
        include: {
          updatedByUser: {
            select: {
              id: true,
              username: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });

      return updated;
    });

    // Log the update to console
    console.log("[Privacy Policy] Updated by:", {
      userId,
      username,
      contentId: current.id,
      changeDescription:
        changeDescription || "Atualização da Política de Privacidade",
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  /**
   * Get update history (ADMIN/MODERATOR)
   */
  static async getHistory(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      prisma.privacyPolicyHistory.findMany({
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          updatedByUser: {
            select: {
              id: true,
              username: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.privacyPolicyHistory.count(),
    ]);

    return {
      history,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  /**
   * Seed default privacy policy content
   */
  static async seedDefaultContent() {
    const existing = await prisma.privacyPolicyContent.findFirst();

    if (existing) {
      return { message: "Conteúdo já existe" };
    }

    await prisma.privacyPolicyContent.create({
      data: {
        dataCollectionUserProvided: `Dados de cadastro: nome, nome de usuário, endereço de e-mail, senha (criptografada)
Dados de perfil: foto de perfil, biografia, localização, site pessoal, links de redes sociais (GitHub, LinkedIn, Twitter)
Dados profissionais: habilidades técnicas, experiência, empresa atual
Conteúdo: perguntas, respostas, comentários, código-fonte e outros materiais publicados`,

        dataCollectionAutomatic: `Dados de uso: páginas visitadas, funcionalidades utilizadas, tempo de permanência, interações (votos, comentários)
Dados técnicos: endereço IP, tipo e versão do navegador, sistema operacional, tipo de dispositivo
Dados de cookies: identificadores únicos, preferências de sessão (veja nossa Política de Cookies)
Dados de logs: registros de acesso, erros, atividades de segurança`,

        dataCollectionThirdParty: `Login social: se você optar por autenticar via GitHub, Google ou LinkedIn, recebemos seu nome, e-mail e foto de perfil dessas plataformas
Integrações: dados de repositórios públicos do GitHub quando vinculados ao perfil`,

        dataUsageDescription: `Utilizamos seus dados pessoais para as seguintes finalidades:

ESSENCIAL - Fornecer nossos serviços: criar e gerenciar sua conta, permitir publicação de conteúdo, processar interações

ESSENCIAL - Comunicação: enviar notificações sobre atividades (respostas, votos, menções), atualizações de serviço e alertas de segurança

LEGÍTIMO - Personalização: recomendar conteúdo relevante, adaptar a experiência com base em suas preferências e interesses

LEGÍTIMO - Análise e melhorias: entender como a plataforma é utilizada, identificar problemas, desenvolver novos recursos

ESSENCIAL - Segurança: detectar fraudes, spam e abusos; proteger a comunidade; cumprir obrigações legais

CONSENTIMENTO - Marketing: enviar newsletters e comunicações promocionais (apenas com seu consentimento explícito)`,

        dataSharingDescription: `Conteúdo público: perguntas, respostas, comentários e informações de perfil são visíveis publicamente. Seu nome de usuário e avatar aparecem junto ao conteúdo que você publica.

Prestadores de serviços: compartilhamos dados com empresas que nos ajudam a operar a plataforma (hospedagem, análise, e-mail), sob contratos de confidencialidade.

Requisitos legais: podemos divulgar dados quando exigido por lei, ordem judicial ou para proteger direitos, propriedade ou segurança da Alldev e seus usuários.

Transações corporativas: em caso de fusão, aquisição ou venda de ativos, seus dados podem ser transferidos como parte da transação, com aviso prévio.`,

        dataSharingImportantNote: `Nunca vendemos seus dados pessoais para terceiros. Não compartilhamos seu e-mail ou informações privadas com anunciantes.`,

        securityMeasures: `Criptografia: todas as comunicações são protegidas por HTTPS/TLS. Senhas são armazenadas com hash bcrypt
Controle de acesso: acesso a dados restrito a funcionários autorizados sob princípio do menor privilégio
Monitoramento: sistemas de detecção de intrusão e logs de auditoria
Backups: backups criptografados regulares com recuperação de desastres
Avaliações: testes de segurança periódicos e atualizações de vulnerabilidades`,

        securityDisclaimer: `Apesar de nossos esforços, nenhum sistema é 100% seguro. Caso ocorra uma violação de dados que afete suas informações, notificaremos você e as autoridades competentes conforme exigido pela LGPD.`,

        dataRetentionDescription: `Conta ativa: dados mantidos enquanto sua conta estiver ativa
Após exclusão da conta: dados de identificação removidos em até 30 dias; conteúdo público pode ser anonimizado e mantido
Logs de segurança: mantidos por até 12 meses para investigação de incidentes
Obrigações legais: alguns dados podem ser retidos por períodos mais longos quando exigido por lei`,

        lgpdRightsDescription: `De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:

Confirmação e Acesso: Confirmar se tratamos seus dados e acessar uma cópia
Correção: Corrigir dados incompletos, inexatos ou desatualizados
Anonimização/Bloqueio: Anonimizar, bloquear ou eliminar dados desnecessários
Portabilidade: Receber seus dados em formato estruturado
Eliminação: Solicitar exclusão de dados tratados com consentimento
Revogação: Revogar consentimento a qualquer momento`,

        lgpdContactInfo: `Para exercer seus direitos, acesse as configurações de privacidade em seu perfil ou entre em contato conosco pelo e-mail privacidade@alldev.com.br. Responderemos em até 15 dias úteis.`,

        minorsPolicy: `A Alldev não é destinada a menores de 16 anos. Não coletamos intencionalmente dados de crianças. Se você é pai/mãe ou responsável e acredita que seu filho forneceu dados para nós, entre em contato para que possamos tomar as medidas apropriadas.`,

        internationalTransfers: `Nossos servidores estão localizados no Brasil e nos Estados Unidos. Se você está acessando de outro país, seus dados podem ser transferidos internacionalmente. Garantimos que tais transferências cumpram as exigências da LGPD através de cláusulas contratuais padrão e outras salvaguardas apropriadas.`,

        accountDeletionDescription: `Você pode solicitar a exclusão da sua conta a qualquer momento nas configurações do perfil. Ao excluir sua conta:`,

        accountDeletionProcess: `Seus dados de perfil serão removidos permanentemente
Seu conteúdo público (perguntas, respostas) será anonimizado, não excluído, para preservar a integridade das discussões
Seus votos e interações serão mantidos de forma anônima
E-mails transacionais cessarão imediatamente`,

        dpoName: "João Silva",
        dpoEmail: "privacidade@alldev.com.br",
        dpoContactPage: "alldev.com.br/contato",
      },
    });

    return { message: "Conteúdo padrão criado com sucesso" };
  }
}
