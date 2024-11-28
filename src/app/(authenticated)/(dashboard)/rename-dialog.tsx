"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { useUpdateProjectName } from "@/features/projects/api/use-update-project-name";

export function RenameDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const { mutate, isPending } = useUpdateProjectName();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  const handleSave = () => {
    if (newName.trim() === "") {
      toast.error("Project name cannot be empty!");
      return;
    }

    mutate(
      { id: projectId, name: newName },
      {
        onSuccess: () => {
          //   toast.success("Project name updated successfully!");
          setOpen(false);
          setNewName("");
        },
        onError: () => {
          toast.error("Failed to update project name. Please try again.");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          className="h-10 cursor-pointer"
          onSelect={(e) => {
            e.preventDefault();
          }}
          onClick={handleClick}
        >
          <CopyIcon className="size-4 mr-2" />
          Rename
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Project</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter new name"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => !isPending && setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
