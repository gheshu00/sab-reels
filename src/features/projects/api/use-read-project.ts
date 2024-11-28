import { InferResponseType } from "hono";
import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/hono";

export type ResponseType = InferResponseType<
  (typeof client.api.projects.read)[":id"]["$get"],
  200
>;

export const useReadProject = (id: string) => {
  const query = useQuery({
    enabled: !!id,
    queryKey: ["projectRead", { id }],
    queryFn: async () => {
      const response = await client.api.projects.read[":id"].$get({
        param: {
          id,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }

      const { data } = await response.json();
      console.log(data);
      return data;
    },
  });

  return query;
};
