import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type PageResponseType = InferResponseType<
  (typeof client.api.canvas)[":id"]["$patch"],
  200
>;
type PageRequestType = InferRequestType<
  (typeof client.api.canvas)[":id"]["$patch"]
>["json"];

export const useUpdatePage = (id: string, projectId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<PageResponseType, Error, PageRequestType>({
    mutationKey: ["page", { id }],
    mutationFn: async (json) => {
      const response = await client.api.canvas[":id"].$patch({
        json,
        param: { id },
      });

      if (!response.ok) {
        throw new Error("Failed to update page");
      }

      return await response.json();
    },
    onSuccess: () => {
      // queryClient.invalidateQueries({ queryKey: ["pages"] });
      // queryClient.invalidateQueries({ queryKey: ["page", { id }] });
      // queryClient.invalidateQueries({
      //   queryKey: ["project", { id: projectId }],
      // });
    },
    onError: () => {
      toast.error("Failed to update page");
    },
  });

  return mutation;
};
