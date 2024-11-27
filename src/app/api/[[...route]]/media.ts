import { Hono } from "hono";
import { verifyAuth } from "@hono/auth-js";
import { cookies } from "next/headers";

const app = new Hono();

// Define the API route
app.get("/user", verifyAuth(), async (c) => {
  const cookieStore = cookies();
  const authToken = cookieStore.get("wp-jwt")?.value;

  if (!authToken) {
    return c.json({ error: "Unauthorized: No token provided" }, 401);
  }

  try {
    const response = await fetch(
      "https://app.scoutabasegroup.com/wp-json/user-media/v1/files",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      return c.json(
        { error: "API Error", details: await response.text() },
        500
      );
    }

    const data = await response.json();
    return c.json({ data });
  } catch (error) {
    console.error("Error fetching User Media:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// app.get("/sab", async (c) => {
//   const cookieStore = cookies();
//   const authToken = cookieStore.get("wp-jwt")?.value;
//   const page = c.req.query("page") || "1"; // Default to page 1 if not provided

//   try {
//     // Fetch SAB media data from the external API
//     const response = await fetch(
//       `https://app.scoutabasegroup.com/wp-json/wp/v2/sab_media?page=${page}&per_page=100`,
//       {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${authToken}`,
//         },
//       }
//     );

//     if (!response.ok) {
//       const errorDetails = await response.text();
//       return c.json({
//         error: `HTTP Error: ${response.status}`,
//         details: errorDetails,
//       });
//     }

//     const data = await response.json();
//     return c.json({ data });
//   } catch (error) {
//     console.error("Error fetching SAB media data:", error);
//     return c.json({ error: "Internal Server Error" }, 500);
//   }
// });

app.get("/sab", async (c) => {
  const cookieStore = cookies();
  const authToken = cookieStore.get("wp-jwt")?.value;
  const page = c.req.query("page") || "1"; // Default to page 1 if not provided
  const perPage = c.req.query("per_page") || "10"; // Default to 10 items per page

  // Helper function to fetch data from an endpoint
  const fetchData = async (url: any, options = {}) => {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(
        `Error fetching data: ${response.status} - ${errorDetails}`
      );
    }
    return response.json();
  };

  // Helper to fetch media details by ID
  const fetchMediaDetailsById = async (id: any) => {
    try {
      const mediaData = await fetchData(
        `https://app.scoutabasegroup.com/wp-json/wp/v2/media/${id}`
      );
      return mediaData;
    } catch (error) {
      console.error(`Failed to fetch media details for ID: ${id}`, error);
      return null;
    }
  };

  // Map category/tag ID to their names
  const getCategoryNameById = (categories: any, id: any) =>
    categories.find((cat: any) => cat.id === id)?.name || "Unknown Category";

  const getTagNameById = (tags: any, id: any) =>
    tags.find((tag: any) => tag.id === id)?.name || "Unknown Tag";

  try {
    // Fetch the main SAB media data
    const sabMediaData = await fetchData(
      `https://app.scoutabasegroup.com/wp-json/wp/v2/sab_media?page=${page}&per_page=${perPage}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    // Fetch categories and tags data
    const [categories, tags] = await Promise.all([
      fetchData("https://app.scoutabasegroup.com/wp-json/wp/v2/categories", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }),
      fetchData("https://app.scoutabasegroup.com/wp-json/wp/v2/tags", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }),
    ]);

    // console.log(sabMediaData.acf.media);

    // Process and flatten the SAB media data
    const processedData = [];

    for (const item of sabMediaData) {
      const title = item.title?.rendered || "No Title";
      const categoriesNames = item.categories.map((id: any) =>
        getCategoryNameById(categories, id)
      );
      const tagsNames = item.tags.map((id: any) => getTagNameById(tags, id));
      const location = item.acf?.location || {};
      const mediaIDs = item.acf?.media || [];

      // Fetch and process each media detail, flattening into individual objects
      for (const mediaID of mediaIDs) {
        const media = await fetchMediaDetailsById(mediaID);

        if (media) {
          processedData.push({
            id: mediaID,
            title,
            categories: categoriesNames,
            tags: tagsNames,
            location: {
              city: location.city || "Unknown City",
              state: location.state || "Unknown State",
              country: location.country || "Unknown Country",
            },
            url: {
              full: media.media_details?.sizes?.full?.source_url || null,
              thumb: media.media_details?.sizes?.thumbnail?.source_url || null,
            },
            width: media.media_details?.width || 0,
            height: media.media_details?.height || 0,
          });
        }
      }
    }

    return c.json({ data: processedData });
  } catch (error) {
    console.error("Error processing SAB data:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

export default app;
