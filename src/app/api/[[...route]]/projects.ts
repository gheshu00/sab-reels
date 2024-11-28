import { z } from "zod";
import { Hono } from "hono";
import { eq, and, desc, asc } from "drizzle-orm";
import { verifyAuth } from "@hono/auth-js";
import { zValidator } from "@hono/zod-validator";

import { db } from "@/db/drizzle";
import { projects, projectsInsertSchema } from "@/db/schema";
import { pages } from "@/db/schema"; // Import pages schema

const app = new Hono()
  .get(
    "/templates",
    verifyAuth(),
    zValidator(
      "query",
      z.object({
        page: z.coerce.number(),
        limit: z.coerce.number(),
      })
    ),
    async (c) => {
      const { page, limit } = c.req.valid("query");

      const data = await db
        .select()
        .from(projects)
        .where(eq(projects.isTemplate, true))
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(asc(projects.isPro), desc(projects.updatedAt));

      return c.json({ data });
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

      const data = await db
        .delete(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, auth.token.id)))
        .returning();

      if (data.length === 0) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data: { id } });
    }
  )
  .post(
    "/",
    verifyAuth(),
    zValidator(
      "json",
      projectsInsertSchema.pick({
        name: true,
        isTemplate: true,
        isPro: true,
        thumbnailUrl: true,
      }) as z.ZodObject<{
        name: z.ZodString;
        isTemplate: z.ZodBoolean;
        isPro: z.ZodBoolean;
        thumbnailUrl: z.ZodString;
      }>
    ),
    async (c) => {
      const auth = c.get("authUser");
      const { name, isTemplate, isPro, thumbnailUrl } = c.req.valid("json");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Create a new project
      const projectData = await db
        .insert(projects)
        .values({
          name,
          userId: auth.token.id,
          thumbnailUrl,
          isTemplate,
          isPro,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const newProject = projectData[0];

      if (!newProject) {
        return c.json({ error: "Project creation failed" }, 400);
      }

      const defaultJson = {
        json: '{"version":"5.3.0","objects":[{"type":"rect","version":"5.3.0","originX":"left","originY":"top","left":0,"top":0,"width":1200,"height":900,"fill":"white","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0,"rx":0,"ry":0,"name":"clip","selectable":false,"hasControls":false}],"clipPath":{"type":"rect","version":"5.3.0","originX":"left","originY":"top","left":0,"top":0,"width":1200,"height":900,"fill":"white","stroke":null,"strokeWidth":1,"selectable":false,"hasControls":false}}',
      };

      // Insert the initial page for the new project
      const pageData = await db
        .insert(pages)
        .values({
          projectId: newProject.id,
          pageNumber: 1, // Start with the first page
          name: "Page 1", // Default name for initial page
          json: defaultJson.json, // Initial empty JSON data for the page
          width: 800, // Default width
          height: 600, // Default height
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return c.json({
        project: newProject,
        initialPage: pageData[0],
      });
    }
  )
  .get(
    "/",
    verifyAuth(),
    zValidator(
      "query",
      z.object({
        page: z.coerce.number(),
        limit: z.coerce.number(),
      })
    ),
    async (c) => {
      const auth = c.get("authUser");
      const { page, limit } = c.req.valid("query");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const data = await db
        .select()
        .from(projects)
        .where(eq(projects.userId, auth.token.id))
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(desc(projects.updatedAt));

      return c.json({
        data,
        nextPage: data.length === limit ? page + 1 : null,
      });
    }
  )
  .patch(
    "/:id",
    verifyAuth(),
    zValidator("param", z.object({ id: z.string() })),
    zValidator(
      "json",
      projectsInsertSchema
        .omit({
          id: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        })
        .partial()
    ),
    async (c) => {
      const auth = c.get("authUser");
      const { id } = c.req.valid("param");
      const values = c.req.valid("json");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const data = await db
        .update(projects)
        .set({
          ...values,
          updatedAt: new Date(),
        })
        .where(and(eq(projects.id, id), eq(projects.userId, auth.token.id)))
        .returning();

      if (data.length === 0) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      return c.json({ data: data[0] });
    }
  )
  .get(
    "/:id",
    verifyAuth(),
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const auth = c.get("authUser");
      const { id } = c.req.valid("param");

      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Fetch the project data along with its associated pages
      const projectData = await db
        .select({
          project: projects,
          pages: pages,
        })
        .from(projects)
        .leftJoin(pages, eq(projects.id, pages.projectId))
        .where(and(eq(projects.id, id), eq(projects.userId, auth.token.id)));

      if (projectData.length === 0) {
        return c.json({ error: "Not found" }, 404);
      }

      // Restructure the result to group and sort pages under the project
      const project = projectData[0].project;
      const projectPages = projectData
        .map((row) => row.pages)
        .filter((page): page is NonNullable<typeof page> => page !== null)
        .sort((a, b) => a.pageNumber - b.pageNumber); // Sort by pageNumber in ascending order

      return c.json({ data: { ...project, pages: projectPages } });
    }
  )
  .get(
    "/read/:id",
    verifyAuth(),
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const auth = c.get("authUser");
      const { id } = c.req.valid("param");
  
      if (!auth.token?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }
  
      // Fetch pages associated with the given project ID and user ID
      const projectPages = await db
        .select({
          width: pages.width,
          height: pages.height,
          json: pages.json,
          pageNumber: pages.pageNumber,
        })
        .from(pages)
        .innerJoin(projects, eq(pages.projectId, projects.id)) // Ensure the pages belong to the requested project
        .where(and(eq(projects.id, id), eq(projects.userId, auth.token.id)))
        .orderBy(pages.pageNumber); // Sort by pageNumber in ascending order
  
      if (projectPages.length === 0) {
        return c.json({ error: "Not found" }, 404);
      }
  
      // Return only the pages array
      return c.json({ data: projectPages });
    }
  );
  

export default app;
