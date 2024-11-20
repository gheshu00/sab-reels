import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

// Define the response and request types for the DELETE endpoint
type ResponseType = InferResponseType<
  (typeof client.api.canvas)[":id"]["$delete"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.canvas)[":id"]["$delete"]
>["param"];

export const useDeletePage = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (param) => {
      const response = await client.api.canvas[":id"].$delete({
        param,
      });

      if (!response.ok) {
        throw new Error("Failed to delete page");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
     toast.success("Page deleted successfully.");

     // Invalidate the project query to refetch the updated project data
     queryClient.invalidateQueries({ queryKey: ["project"] });
    },
    onError: () => {
      toast.error("Failed to delete page");
    },
  });

  return mutation;
};
