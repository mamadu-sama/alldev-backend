import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { env } from "./env";
import { prisma } from "./database";

// Configurar estratégia do Google OAuth 2.0
if (
  env.GOOGLE_CLIENT_ID &&
  env.GOOGLE_CLIENT_SECRET &&
  env.GOOGLE_CALLBACK_URL
) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extrair dados do perfil do Google
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value;
          const displayName = profile.displayName;
          const avatarUrl = profile.photos?.[0]?.value;

          if (!email) {
            return done(
              new Error("Email não disponível no perfil do Google"),
              undefined
            );
          }

          // Verificar se usuário já existe (por Google ID ou email)
          let user = await prisma.user.findFirst({
            where: {
              OR: [{ googleId }, { email }],
            },
            include: {
              roles: true,
              socialLinks: true,
            },
          });

          if (user) {
            // Se o usuário existe mas não tem googleId, vincular a conta
            if (!user.googleId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  googleId,
                  provider: "google",
                  isVerified: true, // Email já verificado pelo Google
                  avatarUrl: avatarUrl || user.avatarUrl,
                },
                include: {
                  roles: true,
                  socialLinks: true,
                },
              });
            }

            // Atualizar último login
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            });
          } else {
            // Criar novo usuário
            const username =
              email.split("@")[0] + Math.floor(Math.random() * 1000);

            user = await prisma.user.create({
              data: {
                email,
                username,
                googleId,
                provider: "google",
                avatarUrl,
                bio: displayName,
                isVerified: true, // Email já verificado pelo Google
                lastLoginAt: new Date(),
                roles: {
                  create: {
                    role: "USER",
                  },
                },
              },
              include: {
                roles: true,
                socialLinks: true,
              },
            });

            console.log(
              `[OAuth] Novo usuário criado via Google: ${user.email}`
            );
          }

          const userWithMappedRoles = {
            ...user,
            roles: user.roles.map((r) => r.role),
          };

          return done(null, userWithMappedRoles);
        } catch (error) {
          console.error(
            "[OAuth] Erro ao processar autenticação Google:",
            error
          );
          return done(error as Error, undefined);
        }
      }
    )
  );
} else {
  console.warn(
    "⚠️  Google OAuth não configurado. Defina GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_CALLBACK_URL no .env"
  );
}

// Configurar estratégia do GitHub OAuth
if (
  env.GITHUB_CLIENT_ID &&
  env.GITHUB_CLIENT_SECRET &&
  env.GITHUB_CALLBACK_URL
) {
  interface GitHubEmail {
    value: string;
  }

  interface GitHubPhoto {
    value: string;
  }

  interface GitHubProfile {
    id: string;
    username?: string;
    emails?: GitHubEmail[];
    photos?: GitHubPhoto[];
    displayName?: string;
  }

  interface SocialLinks {
    github?: string | null;
  }

  interface Role {
    role: string;
  }

  interface User {
    id: string;
    email?: string | null;
    username: string;
    provider?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    isVerified?: boolean;
    socialLinks?: SocialLinks | null;
    roles?: Role[];
    lastLoginAt?: Date | null;
    googleId?: string | null;
  }

  type DoneFunction = (err: Error | null, user?: User | undefined) => void;

  passport.use(
    new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: env.GITHUB_CALLBACK_URL,
        scope: ["user:email"],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: GitHubProfile,
        done: DoneFunction
      ) => {
        try {
          const githubId: string = profile.id;
          const email: string | undefined = profile.emails?.[0]?.value;
          const username: string =
            profile.username ||
            (email ? email.split("@")[0] : `gh_${githubId}`);
          const avatarUrl: string | undefined = profile.photos?.[0]?.value;

          if (!email) {
            // GitHub can sometimes hide email; allow proceed but warn
            console.warn(
              "[OAuth][GitHub] Email não disponível no perfil do GitHub"
            );
          }

          let user: User | null = await prisma.user.findFirst({
            where: {
              OR: [{ provider: "github" }, { email }],
            },
            include: {
              roles: true,
              socialLinks: true,
            },
          });

          if (user) {
            // Vincular github se necessário
            if (user.provider !== "github") {
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  provider: "github",
                  avatarUrl: avatarUrl || user.avatarUrl,
                  isVerified: user.isVerified || !!email,
                },
                include: { roles: true, socialLinks: true },
              });
            }

            // Atualizar social links
            if (user.socialLinks) {
              await prisma.socialLinks.update({
                where: { userId: user.id },
                data: { github: username },
              });
            } else {
              await prisma.socialLinks.create({
                data: { userId: user.id, github: username },
              });
            }

            await prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            });
          } else {
            // Criar novo usuário
            const generatedUsername: string =
              username + Math.floor(Math.random() * 1000);

            user = await prisma.user.create({
              data: {
                email: email || `${generatedUsername}@users.noreply.github`,
                username: generatedUsername,
                provider: "github",
                avatarUrl,
                bio: profile.displayName || undefined,
                isVerified: !!email,
                lastLoginAt: new Date(),
                roles: { create: { role: "USER" } },
                socialLinks: { create: { github: username } },
              },
              include: { roles: true, socialLinks: true },
            });

            console.log(
              `[OAuth] Novo usuário criado via GitHub: ${user.email}`
            );
          }

          const userWithMappedRoles = {
            ...user,
            roles: user.roles?.map((r) => r.role) || [],
          };

          return done(null, userWithMappedRoles as any);
        } catch (error) {
          console.error(
            "[OAuth] Erro ao processar autenticação GitHub:",
            error
          );
          return done(error as Error, undefined);
        }
      }
    )
  );
} else {
  console.warn(
    "⚠️  GitHub OAuth não configurado. Defina GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET e GITHUB_CALLBACK_URL no .env"
  );
}

// Serializar usuário (não usado em JWT, mas necessário para passport)
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserializar usuário (não usado em JWT, mas necessário para passport)
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: true,
        socialLinks: true,
      },
    });
    if (!user) return done(null, null);

    const userWithMappedRoles = {
      ...user,
      roles: user.roles.map((r) => r.role),
    };
    done(null, userWithMappedRoles);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
