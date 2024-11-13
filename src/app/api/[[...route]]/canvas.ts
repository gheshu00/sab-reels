import { z } from "zod";
import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { verifyAuth } from "@hono/auth-js";
import { zValidator } from "@hono/zod-validator";

import { db } from "@/db/drizzle";
import { pages, projects } from "@/db/schema";

const app = new Hono()
  .post(
    "/",
    verifyAuth(),
    zValidator(
      "json",
      z.object({
        projectId: z.string(),
        pageNumber: z.number(),
        name: z.string(),
        json: z.string(),
        width: z.number(),
        height: z.number(),
      })
    ),
    async (c) => {
      const auth = c.get("authUser");
      const { projectId, pageNumber, name, json, width, height } =
        c.req.valid("json");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Check if user owns the project
      const projectExists = await db
        .select()
        .from(projects)
        .where(
          and(eq(projects.id, projectId), eq(projects.userId, auth.token.id))
        );

      if (projectExists.length === 0) {
        return c.json({ error: "Project not found or unauthorized" }, 404);
      }

      // Create a new page
      const pageData = await db
        .insert(pages)
        .values({
          projectId,
          pageNumber,
          name,
          json,
          width,
          height,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return c.json({ data: pageData[0] });
    }
  )
  .patch(
    "/:id",
    verifyAuth(),
    zValidator("param", z.object({ id: z.string() })),
    zValidator(
      "json",
      z.object({
        pageNumber: z.number().optional(),
        name: z.string().optional(),
        json: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
      })
    ),
    async (c) => {
      const auth = c.get("authUser");
      const { id } = c.req.valid("param");
      const values = c.req.valid("json");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Check if user owns the page through project ownership
      const pageExists = await db
        .select()
        .from(pages)
        .leftJoin(projects, eq(pages.projectId, projects.id))
        .where(and(eq(pages.id, id), eq(projects.userId, auth.token.id)));

      if (pageExists.length === 0) {
        return c.json({ error: "Page not found or unauthorized" }, 404);
      }

      // Update the page
      const updatedPage = await db
        .update(pages)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(pages.id, id))
        .returning();

      return c.json({ data: updatedPage[0] });
    }
  )
  .delete(
    "/:id",
    verifyAuth(),
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const auth = c.get("authUser");
      const { id } = c.req.valid("param");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Check if user owns the page through project ownership
      const pageExists = await db
        .select()
        .from(pages)
        .leftJoin(projects, eq(pages.projectId, projects.id))
        .where(and(eq(pages.id, id), eq(projects.userId, auth.token.id)));

      if (pageExists.length === 0) {
        return c.json({ error: "Page not found or unauthorized" }, 404);
      }

      // Delete the page
      await db.delete(pages).where(eq(pages.id, id));

      return c.json({ data: { id } });
    }
  );

export default app;
