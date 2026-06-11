import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        let user = await prisma.user.findUnique({ where: { email: credentials.email } });
        
        if (!user) {
          // If role requested is admin, check if one already exists
          if (credentials.role === "admin") {
            const adminExists = await prisma.user.findFirst({ where: { role: "admin" } });
            if (adminExists) {
              throw new Error("An admin already exists");
            }
          }
          
          user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split('@')[0],
              role: credentials.role || "employee",
            }
          });
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "google") {
          if (!user.email) return false;
          
          let dbUser = await prisma.user.findUnique({ where: { email: user.email } });
          let employee = await prisma.employee.findFirst({ where: { email: user.email } });
          
          if (!dbUser) {
            let role = "employee";
            
            const cookieStore = await cookies();
            const intendedRole = cookieStore.get("intended_role")?.value;
            
            if (intendedRole === "admin") {
              const adminExists = await prisma.user.findFirst({ where: { role: "admin" } });
              if (!adminExists) {
                role = "admin";
              }
            }

            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || user.email.split("@")[0],
                role,
              }
            });
          }
          // Attach role to the user object for the jwt callback
          (user as any).role = dbUser.role;
          
          // Override Google defaults with saved DB values
          if (employee) {
            if (employee.name) user.name = employee.name;
            if (employee.image) user.image = employee.image;
          } else if (dbUser.name) {
            user.name = dbUser.name;
          }
        }
        return true;
      } catch (error) {
        console.error("========================");
        console.error("SIGN IN ERROR:", error);
        console.error("========================");
        return false; // Will redirect to an error page instead of crashing NextAuth
      }
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role || "employee";
      }
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image) token.picture = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development-only",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
