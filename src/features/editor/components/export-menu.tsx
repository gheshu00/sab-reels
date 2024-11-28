import { CiFileOn } from "react-icons/ci";
import { Download, Loader } from "lucide-react";
import { useExportProject } from "@/features/projects/api/use-export-pages";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ExportMenuProps {
  id: string;
  name: string;
  disabled: boolean;
}

export const ExportMenu = ({ id, name, disabled }: ExportMenuProps) => {
  const { exportToPNG, exportToJPG, exportToJSON, exportToPDF, isExporting } =
    useExportProject();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost" disabled={disabled}>
          Export
          {isExporting ? (
            <Loader className="h-4 w-4 animate-spin text-muted-foreground ml-2" />
          ) : (
            <Download className="size-4 ml-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-60">
        <DropdownMenuItem
          className="flex items-center gap-x-2"
          onClick={() => exportToJSON({ projectId: id, fileName: name })}
        >
          <CiFileOn className="size-8" />
          <div>
            <p>JSON</p>
            <p className="text-xs text-muted-foreground">
              Save for later editing
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-x-2"
          onClick={() => exportToPNG({ projectId: id, fileName: name })}
        >
          <CiFileOn className="size-8" />
          <div>
            <p>PNG</p>
            <p className="text-xs text-muted-foreground">
              Best for sharing on the web
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-x-2"
          onClick={() => exportToJPG({ projectId: id, fileName: name })}
        >
          <CiFileOn className="size-8" />
          <div>
            <p>JPG</p>
            <p className="text-xs text-muted-foreground">Best for printing</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-x-2"
          onClick={() => exportToPDF({ projectId: id, fileName: name })}
        >
          <CiFileOn className="size-8" />
          <div>
            <p>PDF</p>
            <p className="text-xs text-muted-foreground">Best for documents</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
