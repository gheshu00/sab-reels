import { InferResponseType } from "hono";
import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";

export type CanvasResponseType = InferResponseType<
  (typeof client.api.canvas)[":id"]["$get"],
  200
>;

export const useGetPagesById = (canvasId: string) => {
  const query = useQuery<CanvasResponseType, Error>({
    queryKey: ["canvas", canvasId],
    queryFn: async () => {
      const response = await client.api.canvas[":id"].$get({
        param: { id: canvasId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch page");
      }

      const data = await response.json();
      console.log(data.data.page);
      return data;
    },
    enabled: !!canvasId, // Ensure the query runs only when canvasId is provided
  });

  return query;
};
