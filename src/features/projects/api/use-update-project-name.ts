import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<
  (typeof client.api.projects)[":id"]["$patch"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.projects)[":id"]["$patch"]
>["json"];

export const useUpdateProjectName = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    ResponseType,
    Error,
    { id: string; name: string }
  >({
    mutationKey: ["project"],
    mutationFn: async ({ id, name }) => {
      const response = await client.api.projects[":id"].$patch({
        json: { name }, // Sending the new name in the request body
        param: { id }, // Passing the project ID as a parameter
      });

      if (!response.ok) {
        throw new Error("Failed to update project name");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] }); // Refetch the list of projects
      toast.success("Project name updated successfully");
    },
    onError: () => {
      toast.error("Failed to update project name");
    },
  });

  return mutation;
};
