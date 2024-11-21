"use client";

import Link from "next/link";
import { Loader, TriangleAlert } from "lucide-react";
import { useState, useEffect } from "react";

import { useGetProject } from "@/features/projects/api/use-get-project";
import { Editor } from "@/features/editor/components/editor";
import { Button } from "@/components/ui/button";
import { constants } from "buffer";

interface EditorProjectIdPageProps {
  params: {
    projectId: string;
  };
}

const EditorProjectIdPage = ({ params }: EditorProjectIdPageProps) => {
  const { data, isLoading, isError } = useGetProject(params.projectId);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [currentPageData, setCurrentPageData] = useState<any>(null);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isPageError, setIsPageError] = useState(false);

  useEffect(() => {
    const fetchPageData = async () => {
      if (!data || !data.pages[currentPageIndex]?.id) return;

      const pageId = data.pages[currentPageIndex].id;
      setIsPageLoading(true);
      setIsPageError(false);

      try {
        const response = await fetch(`/api/canvas/${pageId}`); // Adjust URL as needed
        if (!response.ok) {
          throw new Error("Failed to fetch page data");
        }
        const result = await response.json();
        console.log(result.data.page);
        setCurrentPageData(result.data.page);
      } catch (error) {
        console.error("Error fetching page data:", error);
        setIsPageError(true);
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchPageData();
  }, [data, currentPageIndex]);

  if (isLoading) {
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

  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <TriangleAlert className="size-6 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">
          No project data available
        </p>
      </div>
    );
  }

  // if (isPageLoading) {
  //   return (
  //     <div className="h-full flex flex-col items-center justify-center">
  //       <Loader className="size-6 animate-spin text-muted-foreground" />
  //     </div>
  //   );
  // }

  if (isPageError) {
    return (
      <div className="h-full flex flex-col gap-y-5 items-center justify-center">
        <TriangleAlert className="size-6 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Failed to fetch page</p>
        <Button asChild variant="secondary">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <Editor
      initialData={data}
      pageData={currentPageData} // Pass the fetched current page data
      onPageSelect={setCurrentPageIndex}
      currentPageIndex={currentPageIndex}
      isPageLoading={isPageLoading}
      isPageError={isPageError}
    />
  );
};

export default EditorProjectIdPage;
