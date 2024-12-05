import { Hono } from "hono";
import { cookies } from "next/headers";
import { verifyAuth } from "@hono/auth-js";

const DEFAULT_COUNT = 50;
const DEFAULT_COLLECTION_IDS = ["317099"];

const app = new Hono();
app.get("/proxy", async (c) => {
  const imageUrl = c.req.query("url"); // Get the image URL from the query parameter

  if (!imageUrl) {
    return c.json({ error: "Image URL is required" }, 400);
  }

  try {
    // Extract the `wp-jwt` token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get("wp-jwt")?.value;

    if (!token) {
      return c.json({ error: "Authentication token is missing" }, 401);
    }

    // Fetch the image from the provided URL with the Bearer token
    const fetchResponse = await fetch(imageUrl, {
      headers: {
        Authorization: `Bearer ${token}`, // Include the Bearer token
      },
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch the image: ${fetchResponse.statusText}`);
    }

    // Extract image content and content type
    const contentType =
      fetchResponse.headers.get("Content-Type") || "application/octet-stream";
    const imageBuffer = await fetchResponse.arrayBuffer();

    // Return the image with the appropriate headers
    return c.body(Buffer.from(imageBuffer), 200, {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return c.json({ error: "Failed to fetch the image" }, 500);
  }
});

export default app;
