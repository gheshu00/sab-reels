"use client";
import { InferRequestType } from "hono";
import { fabric } from "fabric";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useRef, useState } from "react";

import { ResponseType } from "@/features/projects/api/use-get-project";
import { useUpdateProject } from "@/features/projects/api/use-update-project";

import { ActiveTool, selectionDependentTools } from "@/features/editor/types";
import { Navbar } from "@/features/editor/components/navbar";
import { Footer } from "@/features/editor/components/footer";
import { useEditor } from "@/features/editor/hooks/use-editor";
import { Sidebar } from "@/features/editor/components/sidebar";
import { Toolbar } from "@/features/editor/components/toolbar";
import { ShapeSidebar } from "@/features/editor/components/shape-sidebar";
import { FillColorSidebar } from "@/features/editor/components/fill-color-sidebar";
import { StrokeColorSidebar } from "@/features/editor/components/stroke-color-sidebar";
import { StrokeWidthSidebar } from "@/features/editor/components/stroke-width-sidebar";
import { OpacitySidebar } from "@/features/editor/components/opacity-sidebar";
import { TextSidebar } from "@/features/editor/components/text-sidebar";
import { FontSidebar } from "@/features/editor/components/font-sidebar";
import { ImageSidebar } from "@/features/editor/components/image-sidebar";
import { FilterSidebar } from "@/features/editor/components/filter-sidebar";
import { DrawSidebar } from "@/features/editor/components/draw-sidebar";
// import { AiSidebar } from "@/features/editor/components/ai-sidebar";
import { TemplateSidebar } from "@/features/editor/components/template-sidebar";
import { RemoveBgSidebar } from "@/features/editor/components/remove-bg-sidebar";
import { SettingsSidebar } from "@/features/editor/components/settings-sidebar";
import { useUpdatePage } from "@/features/projects/api/use-update-page";
import { RiDeleteBin2Line } from "react-icons/ri";
import { BiAddToQueue } from "react-icons/bi";

import { client } from "@/lib/hono";
import { useCreatePage } from "@/features/projects/api/use-create-page";
import { Loader } from "lucide-react";
import { useDeletePage } from "@/features/projects/api/use-delete-page";

type UpdatePageRequest = InferRequestType<
  (typeof client.api.canvas)[":id"]["$patch"]
>["json"];

interface EditorProps {
  initialData: ResponseType["data"];
  pageData?: any;
  onPageSelect: (index: number) => void;
  currentPageIndex: number;
  isPageLoading: any;
  isPageError: any;
}

interface Page {
  id: string;
  pageNumber: number;
  name: string;
  json: string;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}

export const Editor = ({
  initialData,
  pageData,
  onPageSelect,
  currentPageIndex,
  isPageError,
  isPageLoading,
}: EditorProps) => {
  const [activePage, setActivePage] = useState<Page | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pSaving, setPsaving] = useState(false);
  const createPageMutation = useCreatePage();
  const deletePage = useDeletePage();

  useEffect(() => {
    if (!pageData && initialData?.pages) {
      const firstPage = initialData.pages[1]; // Access page with pageNumber 1
      if (firstPage) {
        setActivePage(firstPage);
      }
    }
  }, [initialData, pageData]);

  const { mutate: updateProject } = useUpdateProject(initialData?.id as string);
  const { mutate: updatePage, isPending } = useUpdatePage(
    pageData?.id as string,
    initialData.id as string
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps

  // Debounced function to update project name
  const debouncedUpdateProjectName = useCallback(
    debounce((name: string) => {
      updateProject({ name });
    }, 500),
    [updateProject]
  );

  // Debounced function to update active page's json, width, or height
  const debouncedUpdatePageData = useCallback(
    debounce(
      async (updatedData: {
        json: string;
        width?: number;
        height?: number;
      }) => {
        setPsaving(true);
        if (pageData?.id) {
          const apiData: UpdatePageRequest = updatedData;
          updatePage(apiData);
        }

        setPsaving(false);
      },
      500
    ),
    [updatePage, pageData?.id]
  );

  const [activeTool, setActiveTool] = useState<ActiveTool>("select");

  const onClearSelection = useCallback(() => {
    if (selectionDependentTools.includes(activeTool)) {
      setActiveTool("select");
    }
  }, [activeTool]);

  const { init, editor, updateCanvas } = useEditor({
    defaultState: pageData?.json,
    defaultWidth: pageData?.width,
    defaultHeight: pageData?.height,
    clearSelectionCallback: onClearSelection,
    saveCallback: (canvas) => {
      if (isInitialized && canvas) {
        // This triggers the mutation state that the Navbar is watching
        debouncedUpdatePageData({
          json: JSON.stringify(canvas.json),
          width: canvas.width || pageData?.width,
          height: canvas.height || pageData?.height,
        });
      }
    },
  });

  const onChangeActiveTool = useCallback(
    (tool: ActiveTool) => {
      if (tool === "draw") {
        editor?.enableDrawingMode();
      }

      if (activeTool === "draw") {
        editor?.disableDrawingMode();
      }

      if (tool === activeTool) {
        return setActiveTool("select");
      }

      setActiveTool(tool);
    },
    [activeTool, editor]
  );

  const canvasRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentCanvas = useRef<fabric.Canvas | null>(null);

  // useEffect(() => {
  //   if (!pageData) return;

  //   // Clean up existing canvas
  //   if (currentCanvas.current) {
  //     currentCanvas.current.dispose();
  //     currentCanvas.current = null;
  //     setIsInitialized(false);
  //   }

  //   const canvas = new fabric.Canvas(canvasRef.current, {
  //     controlsAboveOverlay: true,
  //     preserveObjectStacking: true,
  //   });

  //   currentCanvas.current = canvas;

  //   init({
  //     initialCanvas: canvas,
  //     initialContainer: containerRef.current!,
  //   });

  //   return () => {
  //     if (currentCanvas.current) {
  //       currentCanvas.current.dispose();
  //       currentCanvas.current = null;
  //     }
  //   };
  // }, [init, pageData]);

  // Use effect to save project name changes

  useEffect(() => {
    if (initialData?.name) {
      debouncedUpdateProjectName(initialData.name);
    }
  }, [initialData?.name, debouncedUpdateProjectName]);

  //////////////////////////////////////////////

  const handleCreatePage = async () => {
    if (isCreating) return; // Prevent duplicate requests
    setIsCreating(true);

    const nextPageNumber = initialData?.pages.length + 1 || 1; // Calculate next page number
    const defaultJson = {
      json: '{"version":"5.3.0","objects":[{"type":"rect","version":"5.3.0","originX":"left","originY":"top","left":0,"top":0,"width":1200,"height":900,"fill":"white","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0,"rx":0,"ry":0,"name":"clip","selectable":false,"hasControls":false}],"clipPath":{"type":"rect","version":"5.3.0","originX":"left","originY":"top","left":0,"top":0,"width":1200,"height":900,"fill":"white","stroke":null,"strokeWidth":1,"selectable":false,"hasControls":false}}',
    };

    try {
      await createPageMutation.mutateAsync({
        projectId: initialData.id,
        pageNumber: nextPageNumber,
        name: `Page ${nextPageNumber}`, // Default name
        json: defaultJson.json, // Default JSON structure
        width: 1200, // Default width
        height: 900, // Default height
      });
    } catch (error) {
      console.error("Failed to create page:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePage = async () => {
    if (isDeleting) return; // Prevent duplicate requests
    setIsDeleting(true);

    try {
      // Perform the delete operation
      await deletePage.mutateAsync({ id: pageData.id });
    } catch (error) {
      console.error("Failed to delete page:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    // Cleanup function
    const cleanupCanvas = () => {
      if (currentCanvas.current) {
        currentCanvas.current.dispose();
        currentCanvas.current = null;
        setIsInitialized(false);
      }
    };

    // Initialize canvas
    const initializeCanvas = () => {
      if (!pageData?.json) return; // Prevent initialization if no JSON

      const canvas = new fabric.Canvas(canvasRef.current, {
        controlsAboveOverlay: true,
        preserveObjectStacking: true,
      });

      currentCanvas.current = canvas;

      init({
        initialCanvas: canvas,
        initialContainer: containerRef.current!,
      });

      try {
        const jsonData = JSON.parse(pageData.json);
        canvas.loadFromJSON(jsonData, () => {
          canvas.renderAll();
          setIsInitialized(true);
        });
      } catch (error) {
        console.error("Error loading canvas data:", error);
      }
    };

    // Manage loading state and cleanup
    if (!isPageLoading) {
      cleanupCanvas();
      initializeCanvas();
    }

    return () => {
      cleanupCanvas();
    };
  }, [isPageLoading, pageData?.json, init]);


  

  //////////////////////////////////////////////

  return (
    <div className="h-full flex flex-col">
      <Navbar
        id={initialData.id}
        name={initialData.name}
        editor={editor}
        activeTool={activeTool}
        onChangeActiveTool={onChangeActiveTool}
        pSaving={pSaving}
        isPageLoading={isPageLoading}
        isPendingSave={isPending}
      />
      <div className="absolute h-[calc(100%-68px)] w-full top-[68px] flex">
        <Sidebar
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <ShapeSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <FillColorSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <StrokeColorSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <StrokeWidthSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <OpacitySidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <TextSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <FontSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <ImageSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <TemplateSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <FilterSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        {/* <AiSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        /> */}
        <RemoveBgSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <DrawSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <SettingsSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <main className="bg-muted flex-1 overflow-auto relative flex flex-col">
          <Toolbar
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
            key={JSON.stringify(editor?.canvas.getActiveObject())}
          />
          {/* <div
            className="flex-1 h-[calc(100%-124px)] bg-muted"
            ref={containerRef}
          >
            {isPageLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              // Only render the canvas container if the page is initialized
              <div className="canvas-container">
                <canvas ref={canvasRef} />
              </div>
            )}
          </div> */}

          <div
            className="flex-1 h-[calc(100%-124px)] bg-muted"
            ref={containerRef}
          >
            <canvas ref={canvasRef} />
          </div>
          <div className="absolute top-2 right-2 z-50 flex gap-2 items-center">
            <button
              onClick={handleDeletePage}
              disabled={isDeleting || initialData.pages.length <= 1}
              className="h-[50px] text-2xl flex items-center justify-center px-2 py- bg-white/0 hover:text-red-500 animate text-red-300"
            >
              {isDeleting ? (
                <Loader className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <RiDeleteBin2Line />
              )}
            </button>
            <button
              onClick={handleCreatePage}
              disabled={isCreating}
              className="h-[50px] text-2xl flex items-center justify-center px-2 py-2 bg-white/0 hover:text-blue-500 animate"
            >
              {isCreating ? (
                <Loader className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <BiAddToQueue />
              )}
            </button>
          </div>
          <Footer editor={editor} />
        </main>

        <div className="h-full overflow-y-scroll">
          <div
            className="w-[8rem] bg-white border-l flex flex-col items-center gap-4 py-4"
            style={{
              pointerEvents: isPending ? "none" : "auto",
              opacity: isPending ? 0.5 : 1, // Optional: make it visually appear disabled
            }}
          >
            {Array.from(
              { length: initialData.pages.length },
              (_, index: any) => (
                <div
                  key={index + 1}
                  className="relative w-[5rem] h-[3.5rem] flex items-center justify-center group cursor-pointer"
                  onClick={() => {
                    if (!isPending) {
                      // Prevent click logic when isPendingSave is true
                      onPageSelect(index);
                      console.log({ index, pageNum: pageData.pageNumber });
                    }
                  }}
                >
                  {/* Content container */}
                  <div
                    className={`
            bg-white border-2 w-full h-full rounded-md transition-colors duration-200
            ${
              index === pageData?.pageNumber - 1
                ? "border-blue-500"
                : "group-hover:border-blue-500"
            }
          `}
                  ></div>
                  {/* Overlay with the number */}
                  <h3
                    className={`
            absolute font-bold text-lg pointer-events-none
            ${
              index === pageData?.pageNumber - 1
                ? "text-blue-500"
                : "text-neutral-400 group-hover:text-blue-500"
            }
          `}
                  >
                    {index + 1}
                  </h3>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
