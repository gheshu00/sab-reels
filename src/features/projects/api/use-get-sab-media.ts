"use client";
import { useQuery } from "@tanstack/react-query";

export const useGetSabMedia = (page: number = 1) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["sabMedia", { page }],
    queryFn: async () => {
      const response = await fetch(`/api/media/sab?page=${page}`);

      if (!response.ok) {
        const errorDetails = await response.json();
        throw new Error(errorDetails.error || "Failed to fetch SAB media");
      }

      const { data } = await response.json();
      console.log(data);
      return data;
    },
    // keepPreviousData: true, // Keeps the previous page data during new fetches
  });

  return { data, isLoading, isError };
};
