import { z } from "zod";
import { Hono } from "hono";
import { cors } from "hono/cors";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";

import { db } from "@/db/drizzle";
import { users } from "@/db/schema";

const app = new Hono();

// Define the list of allowed origins and methods
const allowedOrigins = ["http://127.0.0.1:5500"];
const allowedMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];

// // CORS OPTIONS route
// app.options("/api/sign-up", (c) => {
//   const origin = c.req.header("origin") || "";

//   return c.text("", 204, {
//     "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
//       ? origin
//       : "",
//     "Access-Control-Allow-Methods": allowedMethods.join(", "),
//     "Access-Control-Allow-Headers": "Content-Type, Authorization",
//     "Access-Control-Max-Age": "86400", // 24 hours
//   });
// });

app.post(
  "/",
  zValidator(
    "json",
    z.object({
      username: z.string(),
      email: z.string().email(),
      password: z.string().min(3).max(20),
    })
  ),
  async (c) => {
    const { username, email, password } = c.req.valid("json");

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if email is already in use
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (userExists[0]) {
      return c.json({ error: "Email already in use" }, 400);
    }

    // Insert new user
    await db.insert(users).values({
      email,
      name: username,
      password: hashedPassword,
    });

    console.log("user created");

    return c.json({ message: "User created successfully" }, 201);
  }
);

app.delete(
  "/",
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
    })
  ),
  async (c) => {
    const { email } = c.req.valid("json");

    // Check if the user exists
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!userExists[0]) {
      return c.json({ error: "User not found" }, 404);
    }

    // Delete the user
    await db.delete(users).where(eq(users.email, email));

    console.log("user deleted");

    return c.json({ message: "User deleted successfully" }, 200);
  }
);

export default app;
