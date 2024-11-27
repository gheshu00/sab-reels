import { useQuery } from "@tanstack/react-query";

export const useGetUserMedia = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["userMedia"],
    queryFn: async () => {
      const response = await fetch("/api/media/user");

      if (!response.ok) {
        const errorDetails = await response.json();
        throw new Error(errorDetails.error || "Failed to fetch user media");
      }

      const { data } = await response.json();
      console.log(data);
      return data;
    },
  });

  return { data, isLoading, isError };
};
