import { prisma } from "@/config/database";
import { NotFoundError } from "@/types";

interface UpdateTermsOfUseData {
  introduction?: string;
  acceptanceSection?: string;
  accountSection?: string;
  userContentLicense?: string;
  userContentCreativeCommons?: string;
  userContentCodeLicense?: string;
  userContentResponsibility?: string;
  prohibitedConduct?: string;
  moderationDescription?: string;
  penaltiesDescription?: string;
  appealProcess?: string;
  disclaimerSection?: string;
  liabilityLimit?: string;
  changesAndTermination?: string;
  governingLaw?: string;
  jurisdiction?: string;
  entireAgreement?: string;
  severability?: string;
  contactEmail?: string;
  contactPage?: string;
  changeDescription?: string;
}

export class TermsOfUseService {
  /**
   * Get current terms of use content (PUBLIC)
   */
  static async getContent() {
    const content = await prisma.termsOfUseContent.findFirst({
      orderBy: { lastUpdated: "desc" },
    });

    if (!content) {
      throw new NotFoundError("Conteúdo dos Termos de Uso não encontrado");
    }

    return content;
  }

  /**
   * Get content for editing with metadata (ADMIN/MODERATOR)
   */
  static async getContentForEdit() {
    const content = await prisma.termsOfUseContent.findFirst({
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
      throw new NotFoundError("Conteúdo dos Termos de Uso não encontrado");
    }

    return content;
  }

  /**
   * Update terms of use content (ADMIN/MODERATOR)
   */
  static async updateContent(
    data: UpdateTermsOfUseData,
    userId: string,
    username: string
  ) {
    // Get current content
    const current = await prisma.termsOfUseContent.findFirst({
      orderBy: { lastUpdated: "desc" },
    });

    if (!current) {
      throw new NotFoundError("Conteúdo dos Termos de Uso não encontrado");
    }

    const { changeDescription, ...updateData } = data;

    // Use transaction to update content and save history
    const result = await prisma.$transaction(async (tx) => {
      // Save current state to history
      await tx.termsOfUseHistory.create({
        data: {
          contentId: current.id,
          introduction: current.introduction,
          acceptanceSection: current.acceptanceSection,
          accountSection: current.accountSection,
          userContentLicense: current.userContentLicense,
          userContentCreativeCommons: current.userContentCreativeCommons,
          userContentCodeLicense: current.userContentCodeLicense,
          userContentResponsibility: current.userContentResponsibility,
          prohibitedConduct: current.prohibitedConduct,
          moderationDescription: current.moderationDescription,
          penaltiesDescription: current.penaltiesDescription,
          appealProcess: current.appealProcess,
          disclaimerSection: current.disclaimerSection,
          liabilityLimit: current.liabilityLimit,
          changesAndTermination: current.changesAndTermination,
          governingLaw: current.governingLaw,
          jurisdiction: current.jurisdiction,
          entireAgreement: current.entireAgreement,
          severability: current.severability,
          contactEmail: current.contactEmail,
          contactPage: current.contactPage,
          updatedBy: userId,
          changeDescription:
            changeDescription || "Atualização dos Termos de Uso",
        },
      });

      // Update content
      const updated = await tx.termsOfUseContent.update({
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
    console.log("[Terms of Use] Updated by:", {
      userId,
      username,
      contentId: current.id,
      changeDescription: changeDescription || "Atualização dos Termos de Uso",
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
      prisma.termsOfUseHistory.findMany({
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
      prisma.termsOfUseHistory.count(),
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
   * Seed default terms of use content
   */
  static async seedDefaultContent() {
    const existing = await prisma.termsOfUseContent.findFirst();

    if (existing) {
      return { message: "Conteúdo já existe" };
    }

    await prisma.termsOfUseContent.create({
      data: {
        introduction: `Bem-vindo à Alldev! Estes Termos de Uso ("Termos") regem o acesso e uso da plataforma Alldev ("Plataforma", "Serviço", "nós" ou "nosso"), uma comunidade online para desenvolvedores de software. Ao acessar ou utilizar nossa Plataforma, você ("Usuário", "você") concorda em estar vinculado a estes Termos. Se você não concordar com algum aspecto destes Termos, não utilize nossos serviços.`,

        acceptanceSection: `1.1. Ao criar uma conta ou utilizar a Plataforma, você declara ter pelo menos 16 anos de idade e capacidade legal para aceitar estes Termos.

1.2. Se você estiver utilizando a Plataforma em nome de uma organização, você declara ter autoridade para vincular essa organização a estes Termos.

1.3. Reservamo-nos o direito de modificar estes Termos a qualquer momento. Notificaremos sobre alterações significativas por e-mail ou através de aviso na Plataforma. O uso continuado após tais modificações constitui aceitação dos novos Termos.`,

        accountSection: `2.1. Para utilizar determinadas funcionalidades da Plataforma, você deve criar uma conta fornecendo informações precisas e completas.

2.2. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.

2.3. Você concorda em notificar imediatamente a Alldev sobre qualquer uso não autorizado de sua conta ou qualquer outra violação de segurança.

2.4. Cada pessoa pode manter apenas uma conta ativa. Contas duplicadas podem ser encerradas sem aviso prévio.

2.5. A Alldev reserva-se o direito de recusar o registro ou cancelar contas a seu critério, especialmente em casos de violação destes Termos.`,

        userContentLicense: `Ao publicar conteúdo na Plataforma (perguntas, respostas, comentários, código, etc.), você concede à Alldev uma licença mundial, não exclusiva, isenta de royalties, sublicenciável e transferível para usar, reproduzir, modificar, adaptar, publicar, traduzir e distribuir tal conteúdo.`,

        userContentCreativeCommons: `Todo o conteúdo textual contribuído pelos usuários é licenciado sob Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0), permitindo que outros compartilhem e adaptem o trabalho, desde que atribuam crédito adequado.`,

        userContentCodeLicense: `Trechos de código compartilhados na Plataforma são disponibilizados sob licença MIT, salvo indicação contrária do autor.`,

        userContentResponsibility: `Você declara e garante que possui todos os direitos necessários sobre o conteúdo que publica e que tal conteúdo não viola direitos de terceiros. A Alldev não se responsabiliza pelo conteúdo publicado pelos usuários, mas reserva-se o direito de remover qualquer conteúdo que viole estes Termos.`,

        prohibitedConduct: `Ao utilizar a Plataforma, você concorda em NÃO:

• Publicar conteúdo ilegal, difamatório, obsceno, ameaçador, discriminatório ou que viole direitos de terceiros
• Fazer spam, autopromoção excessiva ou publicidade não autorizada
• Tentar acessar contas de outros usuários ou sistemas não autorizados
• Interferir no funcionamento da Plataforma ou sobrecarregar nossos servidores
• Coletar informações de outros usuários sem consentimento
• Usar bots, scrapers ou outros meios automatizados sem autorização
• Evadir suspensões ou banimentos criando novas contas
• Manipular o sistema de reputação através de votos falsos ou contas múltiplas
• Publicar malware, vírus ou código malicioso
• Assediar, intimidar ou perseguir outros usuários`,

        moderationDescription: `A Alldev emprega moderadores para manter a qualidade e segurança da comunidade. Moderadores podem editar, ocultar ou remover conteúdo que viole estes Termos.`,

        penaltiesDescription: `Penalidades por violações podem incluir:

• Aviso: Notificação sobre comportamento inadequado
• Suspensão temporária: Bloqueio de acesso por período determinado (1 dia a 30 dias)
• Suspensão permanente: Banimento definitivo da Plataforma
• Remoção de conteúdo: Exclusão de posts, comentários ou perfil
• Redução de reputação: Perda de pontos de reputação`,

        appealProcess: `Decisões de moderação podem ser contestadas através do sistema de apelação. Recursos devem ser apresentados em até 7 dias após a penalidade.`,

        disclaimerSection: `A Plataforma é fornecida "como está" e "conforme disponível", sem garantias de qualquer tipo, expressas ou implícitas. Não garantimos que a Plataforma será ininterrupta, segura, livre de erros ou que atenderá a suas expectativas específicas. O conteúdo publicado por usuários representa apenas as opiniões de seus autores. A Alldev não endossa nem se responsabiliza por tais opiniões. Código-fonte e soluções técnicas compartilhados na Plataforma são fornecidos para fins educacionais. Use-os por sua conta e risco.`,

        liabilityLimit: `Na extensão máxima permitida pela lei aplicável, a Alldev não será responsável por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos decorrentes do uso ou incapacidade de uso da Plataforma. Nossa responsabilidade total por quaisquer reclamações relacionadas a estes Termos não excederá o valor pago por você à Alldev nos últimos 12 meses, se aplicável.`,

        changesAndTermination: `Podemos modificar, suspender ou descontinuar qualquer aspecto da Plataforma a qualquer momento, com ou sem aviso prévio. Você pode encerrar sua conta a qualquer momento através das configurações de perfil. Ao encerrar, seu conteúdo permanecerá na Plataforma sob as licenças concedidas. Reservamo-nos o direito de encerrar ou suspender sua conta por violação destes Termos ou por qualquer motivo razoável.`,

        governingLaw: `Estes Termos são regidos pelas leis da República Federativa do Brasil, independentemente de conflitos de disposições legais.`,

        jurisdiction: `Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias decorrentes destes Termos.`,

        entireAgreement: `Estes Termos, junto com nossa Política de Privacidade e Política de Cookies, constituem o acordo integral entre você e a Alldev.`,

        severability: `Se qualquer disposição destes Termos for considerada inválida, as demais disposições permanecerão em pleno vigor.`,

        contactEmail: "legal@alldev.com.br",
        contactPage: "alldev.com.br/contato",
      },
    });

    return { message: "Conteúdo padrão criado com sucesso" };
  }
}
