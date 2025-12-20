import { prisma } from "@/config/database";
import { NotFoundError } from "@/types";

interface UpdateCookiePolicyData {
  introduction?: string;
  whatAreCookiesDescription?: string;
  similarTechnologies?: string;
  whyWeUseCookies?: string;
  essentialCookiesDescription?: string;
  functionalCookiesDescription?: string;
  analyticsCookiesDescription?: string;
  marketingCookiesDescription?: string;
  marketingNote?: string;
  cookieDurationDescription?: string;
  manageCookiesAlldev?: string;
  manageCookiesBrowser?: string;
  manageCookiesThirdParty?: string;
  manageCookiesWarning?: string;
  updatesDescription?: string;
  contactEmail?: string;
  contactPage?: string;
  changeDescription?: string;
}

export class CookiePolicyService {
  /**
   * Get current cookie policy content (PUBLIC)
   */
  static async getContent() {
    const content = await prisma.cookiePolicyContent.findFirst({
      orderBy: { lastUpdated: "desc" },
    });

    if (!content) {
      throw new NotFoundError("Conteúdo da Política de Cookies não encontrado");
    }

    return content;
  }

  /**
   * Get content for editing with metadata (ADMIN/MODERATOR)
   */
  static async getContentForEdit() {
    const content = await prisma.cookiePolicyContent.findFirst({
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
      throw new NotFoundError("Conteúdo da Política de Cookies não encontrado");
    }

    return content;
  }

  /**
   * Update cookie policy content (ADMIN/MODERATOR)
   */
  static async updateContent(
    data: UpdateCookiePolicyData,
    userId: string,
    username: string
  ) {
    // Get current content
    const current = await prisma.cookiePolicyContent.findFirst({
      orderBy: { lastUpdated: "desc" },
    });

    if (!current) {
      throw new NotFoundError("Conteúdo da Política de Cookies não encontrado");
    }

    const { changeDescription, ...updateData } = data;

    // Use transaction to update content and save history
    const result = await prisma.$transaction(async (tx) => {
      // Save current state to history
      await tx.cookiePolicyHistory.create({
        data: {
          contentId: current.id,
          introduction: current.introduction,
          whatAreCookiesDescription: current.whatAreCookiesDescription,
          similarTechnologies: current.similarTechnologies,
          whyWeUseCookies: current.whyWeUseCookies,
          essentialCookiesDescription: current.essentialCookiesDescription,
          functionalCookiesDescription: current.functionalCookiesDescription,
          analyticsCookiesDescription: current.analyticsCookiesDescription,
          marketingCookiesDescription: current.marketingCookiesDescription,
          marketingNote: current.marketingNote,
          cookieDurationDescription: current.cookieDurationDescription,
          manageCookiesAlldev: current.manageCookiesAlldev,
          manageCookiesBrowser: current.manageCookiesBrowser,
          manageCookiesThirdParty: current.manageCookiesThirdParty,
          manageCookiesWarning: current.manageCookiesWarning,
          updatesDescription: current.updatesDescription,
          contactEmail: current.contactEmail,
          contactPage: current.contactPage,
          updatedBy: userId,
          changeDescription:
            changeDescription || "Atualização da Política de Cookies",
        },
      });

      // Update content
      const updated = await tx.cookiePolicyContent.update({
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
    console.log("[Cookie Policy] Updated by:", {
      userId,
      username,
      contentId: current.id,
      changeDescription:
        changeDescription || "Atualização da Política de Cookies",
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
      prisma.cookiePolicyHistory.findMany({
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
      prisma.cookiePolicyHistory.count(),
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
   * Seed default cookie policy content
   */
  static async seedDefaultContent() {
    const existing = await prisma.cookiePolicyContent.findFirst();

    if (existing) {
      return { message: "Conteúdo já existe" };
    }

    await prisma.cookiePolicyContent.create({
      data: {
        introduction: `Esta Política de Cookies explica o que são cookies, como a Alldev os utiliza, os tipos de cookies que empregamos e como você pode gerenciar suas preferências. Esta política complementa nossa Política de Privacidade.`,

        whatAreCookiesDescription: `Cookies são pequenos arquivos de texto armazenados no seu dispositivo (computador, tablet ou celular) quando você visita um site. Eles são amplamente utilizados para fazer sites funcionarem, melhorar a experiência do usuário e fornecer informações aos proprietários do site.`,

        similarTechnologies: `Além de cookies, também utilizamos tecnologias semelhantes como:

• Local Storage: armazena dados sem data de expiração no navegador
• Session Storage: armazena dados apenas durante a sessão do navegador
• Web beacons: pequenas imagens invisíveis que ajudam a rastrear comportamento do usuário`,

        whyWeUseCookies: `Utilizamos cookies para várias finalidades essenciais:

ESSENCIAL - Autenticação: manter você logado durante a navegação
ESSENCIAL - Segurança: prevenir fraudes e proteger sua conta
FUNCIONAL - Preferências: lembrar suas configurações e idioma
FUNCIONAL - Funcionalidades: permitir recursos como temas e notificações
ANALÍTICO - Desempenho: entender como você usa a plataforma para melhorias
ANALÍTICO - Métricas: coletar dados agregados sobre uso e tráfego`,

        essentialCookiesDescription: `Cookies Essenciais são necessários para o funcionamento básico da plataforma. Sem eles, você não pode fazer login, postar conteúdo ou usar funcionalidades principais. Estes cookies não podem ser desativados.

Exemplos:
• alldev_session: mantém sua sessão de login ativa
• alldev_csrf: proteção contra ataques CSRF
• alldev_auth: token de autenticação JWT`,

        functionalCookiesDescription: `Cookies Funcionais melhoram sua experiência armazenando preferências e configurações pessoais. Você pode desativá-los, mas isso afetará funcionalidades específicas.

Exemplos:
• alldev_theme: sua preferência de tema (claro/escuro)
• alldev_language: idioma escolhido
• alldev_notifications: preferências de notificação
• alldev_sidebar: estado do sidebar (expandido/colapsado)`,

        analyticsCookiesDescription: `Cookies Analíticos nos ajudam a entender como você interage com a plataforma, permitindo melhorias baseadas em dados. Todos os dados são anonimizados e agregados.

Serviços utilizados:
• Google Analytics: análise de tráfego e comportamento (opcional)
• Hotjar ou similar: mapas de calor e gravações de sessão (opcional)

Dados coletados:
• Páginas visitadas
• Tempo de permanência
• Origem do tráfego
• Dispositivo e navegador utilizado`,

        marketingCookiesDescription: `Atualmente, a Alldev NÃO utiliza cookies de marketing ou publicidade. Não rastreamos você para fins de anúncios e não compartilhamos seus dados com redes de publicidade.`,

        marketingNote: `Se no futuro implementarmos recursos de marketing, você será notificado e terá controle total sobre essas preferências através do nosso banner de consentimento de cookies.`,

        cookieDurationDescription: `Os cookies utilizados pela Alldev têm diferentes durações:

• Cookies de Sessão: expiram quando você fecha o navegador (ex: alldev_session)
• Cookies Persistentes: permanecem por um período definido:
  - Autenticação: 7 a 30 dias
  - Preferências: 365 dias (1 ano)
  - Analytics: 90 dias

Você pode limpar todos os cookies a qualquer momento através das configurações do seu navegador.`,

        manageCookiesAlldev: `A Alldev oferece controle granular sobre cookies através do nosso banner de consentimento:

1. Ao visitar pela primeira vez, você verá um banner solicitando consentimento
2. Você pode aceitar todos os cookies ou personalizar suas preferências
3. Cookies Essenciais não podem ser desativados
4. Cookies Funcionais e Analíticos são opcionais
5. Suas preferências são salvas e respeitadas em todas as visitas

Para alterar suas preferências:
→ Acesse Configurações > Privacidade e Cookies
→ Ou clique no link "Gerenciar Cookies" no rodapé`,

        manageCookiesBrowser: `Você também pode gerenciar cookies diretamente pelo navegador:

• Google Chrome: Configurações > Privacidade e segurança > Cookies
• Firefox: Opções > Privacidade e Segurança > Cookies e dados de sites
• Safari: Preferências > Privacidade > Gerenciar dados de sites
• Edge: Configurações > Cookies e permissões de site

Para instruções detalhadas:
→ Chrome: chrome://settings/cookies
→ Firefox: about:preferences#privacy
→ Safari: support.apple.com/guide/safari
→ Edge: microsoft.com/edge/privacy-settings`,

        manageCookiesThirdParty: `Se você deseja bloquear cookies de terceiros (como Google Analytics):

1. Use extensões de navegador como Privacy Badger ou uBlock Origin
2. Ative "Não Rastrear" (DNR) nas configurações do navegador
3. Use navegação privada/anônima
4. Configure bloqueio de rastreadores nativos do navegador`,

        manageCookiesWarning: `⚠️ IMPORTANTE: Bloquear ou deletar cookies pode afetar funcionalidades da Alldev:

• Você pode ser desconectado automaticamente
• Suas preferências (tema, idioma) serão perdidas
• Algumas funcionalidades podem não funcionar corretamente
• Você terá que fazer login novamente

Recomendamos manter pelo menos os cookies Essenciais e Funcionais ativos para uma melhor experiência.`,

        updatesDescription: `Podemos atualizar esta Política de Cookies periodicamente para refletir mudanças em nossas práticas ou requisitos legais. Quando fizermos alterações significativas, notificaremos você através de:

• Um aviso destacado na plataforma
• E-mail para usuários registrados
• Atualização da data "Última atualização" no topo desta página

Recomendamos revisar esta política periodicamente para se manter informado sobre como usamos cookies.`,

        contactEmail: "privacidade@alldev.com.br",
        contactPage: "alldev.com.br/contato",
      },
    });

    return { message: "Conteúdo padrão criado com sucesso" };
  }
}
