import {
  PrismaClient,
  Role,
  UserLevel,
  NotificationType,
  VoteType,
  Tag,
  User,
  Post,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Função para criar slug
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

// Dados para seed
const TAGS_DATA = [
  { name: "JavaScript", description: "Linguagem de programação para web" },
  { name: "TypeScript", description: "JavaScript com tipagem estática" },
  { name: "React", description: "Biblioteca JavaScript para interfaces" },
  { name: "Node.js", description: "Ambiente de execução JavaScript" },
  { name: "Python", description: "Linguagem de programação versátil" },
  { name: "Django", description: "Framework web Python" },
  { name: "Express", description: "Framework web para Node.js" },
  { name: "PostgreSQL", description: "Banco de dados relacional" },
  { name: "MongoDB", description: "Banco de dados NoSQL" },
  { name: "Docker", description: "Plataforma de containerização" },
  { name: "Git", description: "Sistema de controle de versão" },
  { name: "CSS", description: "Estilização de páginas web" },
  { name: "HTML", description: "Linguagem de marcação web" },
  { name: "Next.js", description: "Framework React para produção" },
  { name: "Vue.js", description: "Framework JavaScript progressivo" },
];

const POSTS_DATA = [
  {
    title: "Como implementar autenticação JWT em Node.js?",
    content:
      "Estou desenvolvendo uma API REST e preciso implementar autenticação JWT. Quais são as melhores práticas? Devo armazenar o token no localStorage ou em cookies?",
    tags: ["Node.js", "JavaScript", "Express"],
  },
  {
    title: "Diferença entre var, let e const em JavaScript",
    content:
      "Sempre fico confuso sobre quando usar var, let ou const. Alguém pode explicar de forma clara as diferenças e quando usar cada um?",
    tags: ["JavaScript"],
  },
  {
    title: "React Hooks: useState vs useReducer",
    content:
      "Em que situações devo usar useReducer ao invés de useState? Qual a diferença de performance entre eles?",
    tags: ["React", "JavaScript"],
  },
  {
    title: "Como otimizar queries no PostgreSQL?",
    content:
      "Minha aplicação está com queries lentas. Quais técnicas vocês usam para otimizar queries complexas no PostgreSQL? Índices sempre ajudam?",
    tags: ["PostgreSQL"],
  },
  {
    title: "TypeScript vale a pena para projetos pequenos?",
    content:
      "Estou iniciando um projeto pessoal pequeno. Vale a pena usar TypeScript ou a configuração inicial não compensa? Quais os prós e contras?",
    tags: ["TypeScript", "JavaScript"],
  },
  {
    title: "Docker compose para desenvolvimento local",
    content:
      "Compartilho meu docker-compose.yml para desenvolvimento com Node.js + PostgreSQL + Redis. Inclui hot reload e debugging!",
    tags: ["Docker", "Node.js"],
  },
  {
    title: "Melhores práticas de segurança em APIs REST",
    content:
      "Lista completa de práticas de segurança: rate limiting, CORS, helmet, validação de inputs, SQL injection prevention, XSS protection...",
    tags: ["Node.js", "Express"],
  },
  {
    title: "Python vs JavaScript para backend?",
    content:
      "Estou começando no backend. Devo aprender Python (Django) ou continuar com JavaScript (Node.js)? Qual tem melhor mercado?",
    tags: ["Python", "JavaScript", "Django", "Node.js"],
  },
  {
    title: "Como fazer deploy de aplicação Next.js na Vercel",
    content:
      "Tutorial passo a passo de como fazer deploy de uma aplicação Next.js na Vercel, incluindo variáveis de ambiente e domínio customizado.",
    tags: ["Next.js", "React"],
  },
  {
    title: "Git: Como desfazer um commit já enviado?",
    content:
      "Enviei um commit com informações sensíveis para o GitHub. Como faço para remover completamente do histórico? git reset --hard não funcionou.",
    tags: ["Git"],
  },
  {
    title: "CSS Grid vs Flexbox: quando usar cada um?",
    content:
      "Ainda tenho dúvidas sobre quando usar Grid ou Flexbox. Existe uma regra geral ou depende do caso? Exemplos práticos seriam ótimos!",
    tags: ["CSS", "HTML"],
  },
  {
    title: "MongoDB vs PostgreSQL: qual escolher?",
    content:
      "Para um projeto de e-commerce, qual banco de dados vocês recomendam? Preciso de transações, mas também de flexibilidade no schema.",
    tags: ["MongoDB", "PostgreSQL"],
  },
  {
    title: "Vue 3 Composition API: Vale a migração?",
    content:
      "Tenho um projeto grande em Vue 2 Options API. Vale a pena migrar para Vue 3 Composition API? Quanto tempo leva?",
    tags: ["Vue.js", "JavaScript"],
  },
  {
    title: "Como debugar código JavaScript no VSCode?",
    content:
      "Tutorial completo de debugging no VSCode: breakpoints, watch, call stack, e configuração do launch.json para Node.js e navegador.",
    tags: ["JavaScript", "Node.js"],
  },
  {
    title: "React Context vs Redux: ainda preciso de Redux?",
    content:
      "Com Context API e hooks, ainda faz sentido usar Redux? Em que cenários Redux ainda é necessário?",
    tags: ["React", "JavaScript"],
  },
  {
    title: "TypeScript Generics: explicação simples",
    content:
      "Generics sempre foram confusos para mim. Alguém tem uma explicação simples com exemplos práticos do dia a dia?",
    tags: ["TypeScript"],
  },
  {
    title: "Como implementar SSR em React sem Next.js?",
    content:
      "É possível fazer Server-Side Rendering em React sem usar Next.js? Como configurar com Express?",
    tags: ["React", "Node.js", "Express"],
  },
  {
    title: "Docker: diferença entre CMD e ENTRYPOINT",
    content:
      "Nunca entendi direito a diferença entre CMD e ENTRYPOINT no Dockerfile. Quando usar cada um?",
    tags: ["Docker"],
  },
  {
    title: "Python: list comprehension vs map/filter",
    content:
      "Qual é mais pythônico? List comprehension ou usar map/filter? Existe diferença de performance?",
    tags: ["Python"],
  },
  {
    title: "Como fazer testes unitários em JavaScript?",
    content:
      "Tutorial básico de testes com Jest: setup, mocking, coverage, e boas práticas. Inclui exemplos de testes assíncronos!",
    tags: ["JavaScript", "Node.js"],
  },
];

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...\n");

  // Limpar banco de dados
  console.log("🗑️  Limpando banco de dados...");
  await prisma.vote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.socialLinks.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.privacyPolicyContent.deleteMany();
  await prisma.cookiePolicyContent.deleteMany();
  await prisma.termsOfUseContent.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Banco limpo!\n");

  // Criar Política de Privacidade
  console.log("📜 Criando Política de Privacidade...");
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
  console.log("✅ Política de Privacidade criada!\n");

  // Criar Termos de Uso
  console.log("📜 Criando Termos de Uso...");
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
  console.log("✅ Termos de Uso criados!\n");

  // Criar Política de Cookies
  console.log("📜 Criando Política de Cookies...");
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
  console.log("✅ Política de Cookies criada!\n");

  // Hash de senha padrão
  const passwordHash = await bcrypt.hash("senha123", 10);

  // 1. Criar Admin
  console.log("👤 Criando usuário admin...");
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@alldev.com",
      passwordHash,
      isVerified: true,
      reputation: 1000,
      level: UserLevel.GURU,
      bio: "Administrador da plataforma AllDev Community Hub",
      skills: ["Node.js", "React", "PostgreSQL", "TypeScript", "Docker"],
      roles: {
        create: {
          role: Role.ADMIN,
        },
      },
      socialLinks: {
        create: {
          github: "https://github.com/alldev",
          linkedin: "https://linkedin.com/company/alldev",
          twitter: "https://twitter.com/alldev",
        },
      },
    },
  });
  console.log(`✅ Admin criado: ${admin.username}\n`);

  // 2. Criar Usuários Comuns
  console.log("👥 Criando usuários comuns...");
  const usernames = [
    "joaosilva",
    "mariacoders",
    "pedrodev",
    "anatech",
    "carlosfullstack",
    "juliajs",
    "ricardopy",
    "beatrizfrontend",
    "lucasbackend",
    "fernandacloud",
  ];

  const users: User[] = [];
  for (const username of usernames) {
    const user = await prisma.user.create({
      data: {
        username,
        email: `${username}@email.com`,
        passwordHash,
        isVerified: true,
        reputation: Math.floor(Math.random() * 500) + 50,
        level: [UserLevel.NOVATO, UserLevel.CONTRIBUIDOR, UserLevel.EXPERT][
          Math.floor(Math.random() * 3)
        ],
        bio: `Desenvolvedor apaixonado por tecnologia. Sempre aprendendo coisas novas!`,
        skills: ["JavaScript", "React", "Node.js"].slice(
          0,
          Math.floor(Math.random() * 3) + 1
        ),
        roles: {
          create: {
            role: Role.USER,
          },
        },
      },
    });
    users.push(user);
  }
  console.log(`✅ ${users.length} usuários criados!\n`);

  // 3. Criar Tags
  console.log("🏷️  Criando tags...");
  const tags: Tag[] = [];
  for (const tagData of TAGS_DATA) {
    const tag = await prisma.tag.create({
      data: {
        name: tagData.name,
        slug: createSlug(tagData.name),
        description: tagData.description,
      },
    });
    tags.push(tag);
  }
  console.log(`✅ ${tags.length} tags criadas!\n`);

  // 4. Criar Posts
  console.log("📝 Criando posts...");
  const posts: Post[] = [];
  const allUsers = [admin, ...users];

  for (let i = 0; i < POSTS_DATA.length; i++) {
    const postData = POSTS_DATA[i];
    const author = allUsers[Math.floor(Math.random() * allUsers.length)];
    const slug = createSlug(postData.title);

    const post = await prisma.post.create({
      data: {
        title: postData.title,
        slug: `${slug}-${Date.now()}-${i}`,
        content: postData.content,
        authorId: author.id,
        votes: Math.floor(Math.random() * 50) - 10,
      },
    });

    // Associar tags
    const postTags = postData.tags
      .map((tagName) => tags.find((t) => t.name === tagName))
      .filter(Boolean);

    for (const tag of postTags) {
      if (tag) {
        await prisma.postTag.create({
          data: {
            postId: post.id,
            tagId: tag.id,
          },
        });

        // Atualizar contador de posts da tag
        await prisma.tag.update({
          where: { id: tag.id },
          data: { postCount: { increment: 1 } },
        });
      }
    }

    posts.push(post);
  }
  console.log(`✅ ${posts.length} posts criados!\n`);

  // 5. Criar Comentários
  console.log("💬 Criando comentários...");
  let commentCount = 0;
  let replyCount = 0;

  for (const post of posts) {
    // 2-5 comentários por post
    const numComments = Math.floor(Math.random() * 4) + 2;

    for (let i = 0; i < numComments; i++) {
      const author = allUsers[Math.floor(Math.random() * allUsers.length)];

      const commentTexts = [
        "Ótima pergunta! Também tenho essa dúvida.",
        "Eu uso essa abordagem no meu projeto e funciona muito bem!",
        "Excelente explicação, me ajudou bastante!",
        "Você já tentou usar essa biblioteca? Ela resolve isso facilmente.",
        "Tive o mesmo problema e resolvi fazendo assim...",
        "Obrigado por compartilhar! Muito útil.",
        "Interessante! Não conhecia essa abordagem.",
        "Acho que tem uma forma mais simples de fazer isso.",
      ];

      const comment = await prisma.comment.create({
        data: {
          content:
            commentTexts[Math.floor(Math.random() * commentTexts.length)],
          postId: post.id,
          authorId: author.id,
          votes: Math.floor(Math.random() * 20) - 5,
        },
      });

      commentCount++;

      // 30% de chance de ter respostas
      if (Math.random() > 0.7) {
        const numReplies = Math.floor(Math.random() * 3) + 1;

        for (let j = 0; j < numReplies; j++) {
          const replyAuthor =
            allUsers[Math.floor(Math.random() * allUsers.length)];

          const replyTexts = [
            "Concordo totalmente!",
            "Obrigado pela resposta!",
            "Isso faz muito sentido.",
            "Interessante ponto de vista!",
            "Vou testar essa solução.",
            "Exatamente o que eu estava procurando!",
          ];

          await prisma.comment.create({
            data: {
              content:
                replyTexts[Math.floor(Math.random() * replyTexts.length)],
              postId: post.id,
              authorId: replyAuthor.id,
              parentId: comment.id,
              votes: Math.floor(Math.random() * 10),
            },
          });

          replyCount++;
        }
      }
    }
  }
  console.log(`✅ ${commentCount} comentários criados!`);
  console.log(`✅ ${replyCount} respostas criadas!\n`);

  // 6. Criar Votos
  console.log("👍 Criando votos...");
  let voteCount = 0;

  // Votos em posts
  for (const post of posts) {
    const numVoters = Math.floor(Math.random() * 8) + 2;
    const voters = users.sort(() => 0.5 - Math.random()).slice(0, numVoters);

    for (const voter of voters) {
      try {
        await prisma.vote.create({
          data: {
            userId: voter.id,
            postId: post.id,
            type: Math.random() > 0.3 ? VoteType.UP : VoteType.DOWN,
          },
        });
        voteCount++;
      } catch (error) {
        // Ignorar duplicatas
      }
    }
  }

  // Votos em comentários
  const allComments = await prisma.comment.findMany();
  for (const comment of allComments.slice(0, 30)) {
    const numVoters = Math.floor(Math.random() * 5) + 1;
    const voters = users.sort(() => 0.5 - Math.random()).slice(0, numVoters);

    for (const voter of voters) {
      try {
        await prisma.vote.create({
          data: {
            userId: voter.id,
            commentId: comment.id,
            type: Math.random() > 0.2 ? VoteType.UP : VoteType.DOWN,
          },
        });
        voteCount++;
      } catch (error) {
        // Ignorar duplicatas
      }
    }
  }
  console.log(`✅ ${voteCount} votos criados!\n`);

  // 7. Criar Notificações
  console.log("🔔 Criando notificações...");
  const notificationTypes = [
    NotificationType.COMMENT,
    NotificationType.REPLY,
    NotificationType.VOTE,
    NotificationType.ACCEPTED,
  ];

  let notificationCount = 0;
  for (const user of users.slice(0, 5)) {
    for (let i = 0; i < 3; i++) {
      const type =
        notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const sender = allUsers[Math.floor(Math.random() * allUsers.length)];

      const messages = {
        COMMENT: `${sender.username} comentou no seu post`,
        REPLY: `${sender.username} respondeu ao seu comentário`,
        VOTE: `${sender.username} votou no seu conteúdo`,
        ACCEPTED: `${sender.username} aceitou sua resposta`,
      };

      await prisma.notification.create({
        data: {
          userId: user.id,
          type,
          message: messages[type],
          senderId: sender.id,
          read: Math.random() > 0.5,
        },
      });
      notificationCount++;
    }
  }
  console.log(`✅ ${notificationCount} notificações criadas!\n`);

  // 8. Atualizar contadores
  console.log("📊 Atualizando contadores...");

  // Atualizar voteCount dos posts
  for (const post of posts) {
    const votes = await prisma.vote.count({
      where: { postId: post.id, type: VoteType.UP },
    });
    const downvotes = await prisma.vote.count({
      where: { postId: post.id, type: VoteType.DOWN },
    });

    await prisma.post.update({
      where: { id: post.id },
      data: { votes: votes - downvotes },
    });
  }

  console.log("✅ Contadores atualizados!\n");

  // Estatísticas finais
  console.log("📈 Estatísticas do seed:");
  console.log("========================");
  console.log(`📜 Política de Privacidade: ✅`);
  console.log(`📜 Termos de Uso: ✅`);
  console.log(`📜 Política de Cookies: ✅`);
  console.log(
    `👤 Usuários: ${allUsers.length} (1 admin + ${users.length} comuns)`
  );
  console.log(`🏷️  Tags: ${tags.length}`);
  console.log(`📝 Posts: ${posts.length}`);
  console.log(`💬 Comentários: ${commentCount}`);
  console.log(`↩️  Respostas: ${replyCount}`);
  console.log(`👍 Votos: ${voteCount}`);
  console.log(`🔔 Notificações: ${notificationCount}`);
  console.log("========================\n");

  console.log("🎉 Seed concluído com sucesso!\n");
  console.log("📝 Credenciais de login:");
  console.log("------------------------");
  console.log("Admin:");
  console.log("  Email: admin@alldev.com");
  console.log("  Senha: senha123\n");
  console.log("Usuários comuns:");
  console.log("  Email: [username]@email.com");
  console.log("  Senha: senha123");
  console.log("  Exemplos: joaosilva@email.com, mariacoders@email.com\n");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
