"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";

import { useCreateProject } from "@/features/projects/api/use-create-project";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Banner = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const mutation = useCreateProject();

  const onClick = () => {
    setLoading(true);
    mutation.mutate(
      {
        name: "Untitled project",
        thumbnailUrl: "", // Default thumbnail, adjust as needed
        isTemplate: false,
        isPro: false,
      },
      {
        onSuccess: ({ project }) => {
          router.push(`/editor/${project.id}`);
        },
        onSettled: () => {
          setLoading(false); // Reset loading regardless of success or error
        },
      }
    );
  };

  return (
    <div className="text-white aspect-[5/1] min-h-[248px] flex gap-x-6 p-6 items-center rounded-xl bg-gradient-to-r from-[#2e62cb] via-[#0073ff] to-[#3faff5]">
      <div className="rounded-full size-28 items-center justify-center bg-white/50 hidden md:flex">
        <div className="rounded-full size-20 flex items-center justify-center bg-white">
          <Sparkles className="h-20 text-[#0073ff] fill-[#0073ff]" />
        </div>
      </div>
      <div className="flex flex-col gap-y-2">
        <h1 className="text-xl md:text-3xl font-semibold">
          Create your Reels with ScoutaBase
        </h1>
        <p className="text-xs md:text-sm mb-2">
         Access our libraries and tools to create your Media Reels
        </p>
        <Button
          disabled={mutation.isPending}
          onClick={onClick}
          variant="secondary"
          className="w-[160px]"
        >
          Start creating
          {loading ? (
            <Loader2 className="size-4 ml-2 animate-spin" />
          ) : (
            <ArrowRight className="size-4 ml-2" />
          )}
        </Button>
      </div>
    </div>
  );
};
