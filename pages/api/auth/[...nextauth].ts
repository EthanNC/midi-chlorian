import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { verifyPassword, hashPassword } from "@lib/auth/passwords";
import { Session } from "@lib/auth/session";
import prisma from "@db/index";

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    jwt: true,
  },
  pages: {
    signIn: "/sign-in",
    // signOut: "/auth/logout",
    // error: "/auth/error", // Error code passed in query string as ?error=
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),

    //@ts-ignore
    CredentialsProvider({
      id: "app-login",
      name: "App Login",
      credentials: {
        email: {
          label: "Email Address",
          type: "email",
          placeholder: "john.doe@example.com",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Your super secure password",
        },
      },
      async authorize(credentials) {
        try {
          let maybeUser = await prisma.user.findFirst({
            where: {
              email: credentials?.email,
            },
            select: {
              id: true,
              email: true,
              password: true,
              name: true,
              role: true,
              stripeId: true,
            },
          });

          if (!maybeUser) {
            if (!credentials?.password || !credentials.email) {
              throw new Error("Invalid Credentials");
            }

            maybeUser = await prisma.user.create({
              data: {
                email: credentials.email,
                password: await hashPassword(credentials.password),
              },
              select: {
                id: true,
                email: true,
                password: true,
                name: true,
                role: true,
                stripeId: true,
              },
            });
          } else {
            const isValid = await verifyPassword(
              credentials?.password as string,
              maybeUser.password as string
            );

            if (!isValid) {
              throw new Error("Invalid Credentials");
            }
          }

          return {
            id: maybeUser.id,
            email: maybeUser.email,
            name: maybeUser.name,
            role: maybeUser.role,
            stripeId: maybeUser.stripeId,
          };
        } catch (error) {
          console.log(error);
          throw error;
        }
      },
    }),
    //@ts-ignore
    CredentialsProvider({
      id: "admin-login",
      name: "Administrator Login",
      credentials: {
        email: {
          label: "Email Address",
          type: "email",
          placeholder: "john.doe@example.com",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Your super secure password",
        },
      },
      async authorize(credentials) {
        let maybeUser = await prisma.user.findFirst({
          where: {
            email: credentials?.email,
          },
          select: {
            id: true,
            email: true,
            password: true,
            name: true,
            role: true,
          },
        });

        if (!maybeUser) {
          throw new Error("Unauthorized.");
        }

        if (maybeUser?.role !== "admin") {
          throw new Error("Unauthorized.");
        }

        const isValid = await verifyPassword(
          credentials?.password as string,
          maybeUser.password as string
        );

        if (!isValid) {
          throw new Error("Invalid Credentials");
        }

        return {
          id: maybeUser.id,
          email: maybeUser.email,
          name: maybeUser.name,
          role: maybeUser.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      return true;
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token, user }) {
      const sess: Session = {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
        },
      };

      return sess;
    },
  },
  events: {
    signIn: async ({ user }) => {
      //if a user already has a stripe Id exit
      if (user.stripeId !== null || user.role !== "user") {
        return;
      }
      // Create stripe API client using the secret key env variable
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

      // Create a stripe customer for the user with their email address
      await stripe.customers
        .create({
          email: user.email!,
        })
        .then(async (customer: any) => {
          // Use the Prisma Client to update the user in the database with their new Stripe customer ID
          return prisma.user.update({
            where: { id: user.id },
            data: {
              stripeId: customer.id,
            },
          });
        });
    },
  },
});
