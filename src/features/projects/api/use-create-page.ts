import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<(typeof client.api.canvas)["$post"], 201>;
type RequestType = InferRequestType<
  (typeof client.api.canvas)["$post"]
>["json"];

export const useCreatePage = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.canvas.$post({ json });

      if (!response.ok) {
        throw new Error("Something went wrong");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      toast.success("Page created successfully.");

      // Invalidate the project query to refetch the updated project data
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
    onError: () => {
      toast.error(
        "Failed to create page. Please try again or contact support."
      );
    },
  });

  return mutation;
};
