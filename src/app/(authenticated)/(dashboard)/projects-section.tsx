"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  CopyIcon,
  FileIcon,
  Loader,
  MoreHorizontal,
  Search,
  Trash,
} from "lucide-react";

import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useDeleteProject } from "@/features/projects/api/use-delete-project";
// import { useDuplicateProject } from "@/features/projects/api/use-duplicate-project";

import {
  DropdownMenuContent,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import Link from "next/link";
import { RenameDialog } from "./rename-dialog";

export const ProjectsSection = () => {
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete this project."
  );
  // const duplicateMutation = useDuplicateProject();
  const removeMutation = useDeleteProject();
  const router = useRouter();

  // const onCopy = (id: string) => {
  //   duplicateMutation.mutate({ id });
  // };

  const onDelete = async (id: string) => {
    const ok = await confirm();

    if (ok) {
      removeMutation.mutate({ id });
    }
  };

  const { data, status, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useGetProjects();

  if (status === "pending") {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Recent projects</h3>
        <div className="flex flex-col gap-y-4 items-center justify-center h-32">
          <Loader className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Recent projects</h3>
        <div className="flex flex-col gap-y-4 items-center justify-center h-32">
          <AlertTriangle className="size-6 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            Failed to load projects
          </p>
        </div>
      </div>
    );
  }

  if (!data.pages.length || !data.pages[0].data.length) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Recent projects</h3>
        <div className="flex flex-col gap-y-4 items-center justify-center h-32">
          <Search className="size-6 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">No projects found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ConfirmDialog />
      <h3 className="font-semibold text-lg">Recent projects</h3>

      <div className="space-y-2 text-sm">
        {data.pages.map((group, i) => (
          <React.Fragment key={i}>
            {group.data.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between gap-2"
              >
                <Link
                  href={`/editor/${project.id}`}
                  className="hover:bg-muted/80 flex items-center justify-between  hover:border-white animate px-3 py-4 hover:rounded-lg w-full h-[3.5rem]"
                >
                  <div
                    className="font-medium flex items-center gap-x-2 cursor-pointer"
                    // onClick={() => router.push(`/editor/${project.id}`)}
                  >
                    <FileIcon className="size-6" />
                    {project.name}
                  </div>
                  <div
                    onClick={() => router.push(`/editor/${project.id}`)}
                    className="hidden md:block cursor-pointer"
                  >
                    {/* {project.width} x {project.height} px */}
                  </div>
                  <div
                    onClick={() => router.push(`/editor/${project.id}`)}
                    className="hidden md:block cursor-pointer"
                  >
                    {formatDistanceToNow(project.updatedAt, {
                      addSuffix: true,
                    })}
                  </div>
                </Link>
                <div className="flex flex-shrink-0 items-center justify-center rounded-md  hover:border-white animate">
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        disabled={false}
                        size="icon"
                        variant="ghost"
                        className="h-[3.4rem] w-[3.5rem]"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60">
                      <RenameDialog projectId={project.id} />
                      <DropdownMenuItem
                        className="h-10 cursor-pointer"
                        disabled={removeMutation.isPending}
                        onClick={() => onDelete(project.id)}
                      >
                        <Trash className="size-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {hasNextPage && (
        <div className="w-full flex items-center justify-center pt-4">
          <Button
            variant="ghost"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
};
