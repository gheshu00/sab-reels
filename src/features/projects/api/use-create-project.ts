import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<
  (typeof client.api.projects)["$post"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.projects)["$post"]
>["json"];

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.projects.$post({ json });

      if (!response.ok) {
        throw new Error("Something went wrong");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      toast.success("Project and initial page created.");

      // Invalidate the projects query to reflect the new project
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => {
      toast.error(
        "Failed to create project. The session token may have expired, logout and login again, and everything will work fine."
      );
    },
  });

  return mutation;
};
