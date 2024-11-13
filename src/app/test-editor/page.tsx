// Define the types for the structure of your project data
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

interface ProjectData {
  name: string;
  id: string;
  thumbnailUrl: string;
  isTemplate: boolean;
  isPro: boolean;
  pages: Page[];
}

("use client");
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Navbar } from "@/features/editor/components/navbar";
import { Footer } from "@/features/editor/components/footer";
import { useEditor } from "@/features/editor/hooks/use-editor";
import { Sidebar } from "@/features/editor/components/sidebar";
import { ActiveTool, selectionDependentTools } from "@/features/editor/types";
import { useUpdateProject } from "@/features/projects/api/use-update-project";
import debounce from "lodash.debounce";
import { Toolbar } from "@/features/editor/components/toolbar";
import { fabric } from "fabric";
import { useUpdatePage } from "@/features/projects/api/use-update-page";

// Simulate fetching data from an API
const fetchInitialData = async (): Promise<ProjectData> => {
  return {
    name: "Hello",
    id: "4072ecb4-aecd-4ae4-b61c-bea10e340222",
    thumbnailUrl: "https://example.com/thumbnail.jpg",
    isTemplate: false,
    isPro: true,
    pages: [
      {
        id: "page1-uuid",
        pageNumber: 1,
        name: "Page 1",
        json: "{}",
        width: 1200,
        height: 900,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "page2-uuid",
        pageNumber: 2,
        name: "Page 2",
        json: "{}",
        width: 1200,
        height: 900,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };
};

const Page = () => {
  const [initialData, setInitialData] = useState<ProjectData | null>(null); // Correctly type the state
  const [activePage, setActivePage] = useState<Page | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool>("select");
  const canvasRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { mutate: updateProject } = useUpdateProject(initialData?.id as string);
  const { mutate: updatePage } = useUpdatePage(activePage?.id as string);

  // Fetch data and set the first page as active
  useEffect(() => {
    const loadInitialData = async () => {
      const data = await fetchInitialData();
      setInitialData(data);
      setActivePage(data.pages[0]); // Set the first page as active
    };

    loadInitialData();
  }, []);

  const onClearSelection = useCallback(() => {
    if (selectionDependentTools.includes(activeTool)) {
      setActiveTool("select");
    }
  }, [activeTool]);

  const { init, editor } = useEditor({
    defaultState: activePage?.json,
    defaultWidth: activePage?.width,
    defaultHeight: activePage?.height,
    clearSelectionCallback: onClearSelection,
  });

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
      (
        updatedData: Partial<{ json: string; width: number; height: number }>
      ) => {
        if (activePage?.id) {
          // Only pass the relevant fields (json, width, height) to updatePage
          updatePage(updatedData);
        }
      },
      500
    ),
    [updatePage] // Make sure updatePage is a dependency
  );

  
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

  // Initialize the canvas on first render and whenever activePage changes
  useEffect(() => {
    if (!activePage) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      controlsAboveOverlay: true,
      preserveObjectStacking: true,
    });

    init({
      initialCanvas: canvas,
      initialContainer: containerRef.current!,
    });

    return () => {
      canvas.dispose();
    };
  }, [init, activePage]);

  // Use effect to save project name changes
  useEffect(() => {
    if (initialData?.name) {
      debouncedUpdateProjectName(initialData.name);
    }
  }, [initialData?.name, debouncedUpdateProjectName]);

  // Use effect to save page changes (json, width, height)
  useEffect(() => {
    if (activePage) {
      debouncedUpdatePageData({
        json: activePage?.json,
        width: activePage?.width,
        height: activePage?.height,
      });
    }
  }, [activePage, debouncedUpdatePageData]);

  return (
    <div className="h-full flex flex-col">
      <Navbar
        id={initialData?.id as string}
        editor={editor}
        activeTool={activeTool}
        onChangeActiveTool={onChangeActiveTool}
      />

      <div className="absolute h-[calc(100%-68px)] w-full top-[68px] flex">
        <Sidebar
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
          <div
            className="flex-1 h-[calc(100%-124px)] bg-muted"
            ref={containerRef}
          >
            <canvas ref={canvasRef} />
          </div>
          <Footer editor={editor} />
        </main>
      </div>
    </div>
  );
};

export default Page;
