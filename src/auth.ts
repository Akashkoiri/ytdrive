import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import {
  getUserByEmail,
  getUserOAuthTokens,
  registerOrGetOAuthUser,
  saveUserOAuthTokens,
} from "@/data/userStore";

const providers = [];

// 1. Google OAuth Provider (activated when credentials are supplied in .env)
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope:
            "openid email profile https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube",
        },
      },
    })
  );
}

// 2. Credentials Provider (registered user accounts)
providers.push(
  Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials) return null;

      const email = credentials.email as string | undefined;
      const password = credentials.password as string | undefined;

      if (!email || !password) {
        return null;
      }

      const user = await getUserByEmail(email);
      if (!user) {
        return null;
      }

      if (user.password && user.password !== password) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      };
    },
  })
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  secret: process.env.AUTH_SECRET || "ytdrive-super-secret-key-2026",
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const storedUser = await registerOrGetOAuthUser({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        });
        user.id = storedUser.id;

        if (account.provider === "google") {
          const syncIds = Array.from(
            new Set([storedUser.id, user.id, user.email].filter(Boolean) as string[])
          );
          for (const sId of syncIds) {
            await saveUserOAuthTokens(sId, {
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              expiresAt: account.expires_at,
              scope: account.scope,
            }).catch(() => {});
          }
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image || (user as { picture?: string }).picture;
      }
      if (account) {
        token.accessToken = account.access_token;
        token.expiresAt = account.expires_at;
        token.provider = account.provider;
        token.scope = account.scope;

        if (account.refresh_token) {
          token.refreshToken = account.refresh_token;
        } else if (account.provider === "google" && (token.id || token.email)) {
          const existingTokens = await getUserOAuthTokens(
            (token.id as string) || (token.email as string)
          ).catch(() => null);
          if (existingTokens?.refreshToken) {
            token.refreshToken = existingTokens.refreshToken;
          }
        }

        if (account.provider === "google") {
          const syncIds = Array.from(
            new Set([user?.id, token.id, user?.email].filter(Boolean) as string[])
          );
          for (const sId of syncIds) {
            await saveUserOAuthTokens(sId, {
              accessToken: account.access_token,
              refreshToken:
                account.refresh_token || (token.refreshToken as string | undefined),
              expiresAt: account.expires_at,
              scope: account.scope,
            }).catch(() => {});
          }
        }
      }

      // Auto-refresh Google access token if expiring within 2 minutes
      if (token.provider === "google" && token.refreshToken) {
        const expiresAt = (token.expiresAt as number) || 0;
        if (Date.now() / 1000 > expiresAt - 120) {
          try {
            const res = await fetch("https://oauth2.googleapis.com/token", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: process.env.AUTH_GOOGLE_ID || "",
                client_secret: process.env.AUTH_GOOGLE_SECRET || "",
                grant_type: "refresh_token",
                refresh_token: token.refreshToken as string,
              }),
            });
            const refreshed = await res.json();
            if (res.ok && refreshed.access_token) {
              token.accessToken = refreshed.access_token;
              token.expiresAt = Math.floor(
                Date.now() / 1000 + (refreshed.expires_in || 3600)
              );
              if (refreshed.refresh_token) {
                token.refreshToken = refreshed.refresh_token;
              }
              const syncIds = Array.from(
                new Set([token.id as string, token.email as string].filter(Boolean))
              );
              for (const sId of syncIds) {
                await saveUserOAuthTokens(sId, {
                  accessToken: refreshed.access_token,
                  refreshToken:
                    (refreshed.refresh_token as string) ||
                    (token.refreshToken as string),
                  expiresAt: token.expiresAt as number,
                  scope: (token.scope as string) || "",
                }).catch(() => {});
              }
            }
          } catch (err) {
            console.warn("Google token refresh error:", err);
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) {
          session.user.id = token.id as string;
        } else if (session.user.email) {
          const u = await getUserByEmail(session.user.email);
          if (u) session.user.id = u.id;
        }
        if (token.picture) {
          session.user.image = token.picture as string;
        } else if (!session.user.image && session.user.email) {
          const u = await getUserByEmail(session.user.email);
          if (u?.image) session.user.image = u.image;
        }
        const sessionRecord = session as unknown as Record<string, unknown>;
        sessionRecord.accessToken = token.accessToken;
        sessionRecord.refreshToken = token.refreshToken;
        sessionRecord.expiresAt = token.expiresAt;
        sessionRecord.scope = token.scope;
        sessionRecord.provider = token.provider;
        const grantedScopes =
          typeof token.scope === "string" ? token.scope.split(/\s+/) : [];
        sessionRecord.hasYouTubeAccess = Boolean(
          token.accessToken &&
            grantedScopes.some(
              (s) =>
                s === "https://www.googleapis.com/auth/youtube.upload" ||
                s === "https://www.googleapis.com/auth/youtube"
            )
        );

        // Keep local store in sync if accessToken is present
        if (token.accessToken && session.user.id) {
          await saveUserOAuthTokens(session.user.id, {
            accessToken: token.accessToken as string,
            refreshToken: token.refreshToken as string | undefined,
            expiresAt: token.expiresAt as number | undefined,
            scope: token.scope as string | undefined,
          }).catch(() => {});
        }
      }
      return session;
    },
  },
});
