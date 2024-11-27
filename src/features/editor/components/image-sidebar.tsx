import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Loader } from "lucide-react";
import { ActiveTool, Editor } from "@/features/editor/types";
import { ToolSidebarClose } from "@/features/editor/components/tool-sidebar-close";
import { ToolSidebarHeader } from "@/features/editor/components/tool-sidebar-header";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useGetSabMedia } from "@/features/projects/api/use-get-sab-media";
import { useGetUserMedia } from "@/features/projects/api/use-get-user-media";

interface ImageSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const ImageSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: ImageSidebarProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeImageType, setActiveImageType] = useState<"sab" | "gallery">(
    "sab"
  );

  // Fetch SAB media or Gallery media based on active image type
  const {
    data: sabData,
    isLoading: isSabLoading,
    isError: isSabError,
  } = useGetSabMedia(1);
  const {
    data: galleryData,
    isLoading: isGalleryLoading,
    isError: isGalleryError,
  } = useGetUserMedia();

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files) return;

    const files = Array.from(event.target.files);
    setIsUploading(true);

    try {
      const uploadImages = async (files: File[]): Promise<string[]> => {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));

        const response = await fetch("/api/uploadthing", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload images");
        }

        const result = await response.json();
        return result.urls;
      };

      const uploadedUrls = await uploadImages(files);
      uploadedUrls.forEach((url) => {
        editor?.addImage(url);
      });
      toast.success("Images uploaded successfully.");
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const renderImages = () => {
    if (activeImageType === "sab") {
      if (isSabLoading) {
        return (
          <div className="flex items-center justify-center flex-1">
            <Loader className="size-4 text-muted-foreground animate-spin" />
          </div>
        );
      }

      if (isSabError || !sabData) {
        return (
          <div className="flex flex-col gap-y-4 items-center justify-center flex-1">
            <AlertTriangle className="size-4 text-muted-foreground" />
            <p className="text-muted-foreground text-xs">
              Failed to fetch SAB media
            </p>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-2 gap-4">
          {sabData
            ?.filter((image: any) => image?.url?.full) // Only include images with a valid full URL
            .map((image: any) => (
              <button
                onClick={() => editor?.addImage(image.url.full)}
                key={image.id}
                className="relative w-full h-[100px] group hover:opacity-75 transition bg-muted rounded-sm overflow-hidden border"
              >
                <Image
                  src={image.url.full} // Safe to use now since it's filtered
                  alt={image?.title || "Image"}
                  className="object-cover"
                  loading="lazy"
                  width={image?.width || 100} // Provide default width
                  height={image?.height || 100} // Provide default height
                />
              </button>
            ))}
        </div>
      );
    }

    if (activeImageType === "gallery") {
      if (isGalleryLoading) {
        return (
          <div className="flex items-center justify-center flex-1">
            <Loader className="size-4 text-muted-foreground animate-spin" />
          </div>
        );
      }

      if (isGalleryError || !galleryData) {
        return (
          <div className="flex flex-col gap-y-4 items-center justify-center flex-1">
            <AlertTriangle className="size-4 text-muted-foreground" />
            <p className="text-muted-foreground text-xs">
              Failed to fetch Gallery media
            </p>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-2 gap-4">
          {galleryData.map((image: any) => (
            <button
              onClick={() => editor?.addImage(image.urls.regular)}
              key={image.id}
              className="relative w-full h-[100px] group hover:opacity-75 transition bg-muted rounded-sm overflow-hidden border"
            >
              {/* <img
                src={image.urls.small || image.urls.thumb}
                alt={image.alt_description || "Image"}
                className="object-cover"
                loading="lazy"
              /> */}
            </button>
          ))}
        </div>
      );
    }
  };

  return (
    <aside
      className={cn(
        "bg-white relative border-r z-[40] w-[360px] h-full flex flex-col",
        activeTool === "images" ? "visible" : "hidden"
      )}
    >
      <ToolSidebarHeader
        title="Images"
        description="Add images to your canvas"
      />
      <div className="p-4 border-b">
        <label className="w-full text-sm font-medium text-center cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-gray-100 border rounded-md hover:bg-gray-200">
          {isUploading ? (
            <div className="flex items-center justify-center flex-1">
              <Loader className="size-4 text-muted-foreground animate-spin" />
            </div>
          ) : (
            <h2>Upload Images</h2>
          )}

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            ref={fileInputRef}
            className="hidden"
            disabled={isUploading}
          />
        </label>
        <div className="flex gap-2 mt-4">
          <button
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium",
              activeImageType === "sab"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            )}
            onClick={() => setActiveImageType("sab")}
          >
            SAB
          </button>
          <button
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium",
              activeImageType === "gallery"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            )}
            onClick={() => setActiveImageType("gallery")}
          >
            Gallery
          </button>
        </div>
      </div>
      <ScrollArea>
        <div className="p-4">{renderImages()}</div>
      </ScrollArea>
      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};
