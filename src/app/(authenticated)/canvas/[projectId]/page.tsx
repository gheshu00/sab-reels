"use client";

import Link from "next/link";
import { Loader, TriangleAlert } from "lucide-react";

import { useGetProject } from "@/features/projects/api/use-get-project";

import { Editor } from "@/features/editor/components/editor";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface EditorProjectIdPageProps {
  params: {
    projectId: string;
  };
}

const EditorProjectIdPage = ({ params }: EditorProjectIdPageProps) => {
  const { data, isLoading, isError } = useGetProject(params.projectId);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  if (isLoading || !data) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full flex flex-col gap-y-5 items-center justify-center">
        <TriangleAlert className="size-6 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Failed to fetch project</p>
        <Button asChild variant="secondary">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }
  // Transform the pages array into an object
  const pagesObject = data.pages.reduce(
    (acc: Record<string, any>, page: any) => {
      acc[page.pageNumber] = page; // Use `id` as the key
      return acc;
    },
    {}
  );

  // Create the modified data object
  const modifiedData = {
    ...data,
    pages: pagesObject, // Replace the array with the object
  };

  // console.log({ modifiedData });

  return (
    <Editor
      initialData={data}
      pageData={data.pages[currentPageIndex]}
      onPageSelect={setCurrentPageIndex}
      currentPageIndex={currentPageIndex}
    />
  );
};

export default EditorProjectIdPage;
