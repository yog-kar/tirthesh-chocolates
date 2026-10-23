import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const adminEmail = process.env.ADMIN_EMAIL;
        const passwordHash = process.env.ADMIN_PASSWORD_HASH;

        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string" ||
          !adminEmail ||
          !passwordHash
        ) {
          console.error("[admin-auth] Missing configuration:", {
            emailConfigured: Boolean(adminEmail),
            hashConfigured: Boolean(passwordHash),
          });
          return null;
        }

        const emailMatches =
          credentials.email.trim().toLowerCase() ===
          adminEmail.trim().toLowerCase();

        const passwordMatches = await bcrypt.compare(
          credentials.password,
          passwordHash,
        );

        if (!emailMatches || !passwordMatches) {
          console.error("[admin-auth] Invalid credentials:", {
            emailMatches,
            passwordMatches,
          });
          return null;
        }

        return {
          id: "store-owner",
          name: "Store Owner",
          email: adminEmail,
        };
      },
    }),
  ],
});