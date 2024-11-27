// import { DefaultSession } from "next-auth";

// declare module "next-auth" {
//   interface User {
//     image: string | null;
//     email: string;
//     password: string | null;
//     id: string;
//     name: string | null;
//     emailVerified: Date | null;
//     jwt: string;
//   }

//   interface Session extends DefaultSession {
//     user: {
//       image: string | null;
//       email: string;
//       password: string | null;
//       id: string;
//       name: string | null;
//       emailVerified: Date | null;
//       jwt: string;
//     };
//   }
// }

// declare module "next-auth/jwt" {
//   interface JWT extends DefaultJWT {
//     image: string | null;
//     email: string;
//     password: string | null;
//     id: string;
//     name: string | null;
//     emailVerified: Date | null;
//     jwt: string;
//   }
// }