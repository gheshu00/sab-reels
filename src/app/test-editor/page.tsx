"use client";
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

const Page = () => {
  const initialData = {
    name: "Hello",
    id: "4072ecb4-aecd-4ae4-b61c-bea10e340222",
    json: "{}",
    width: 1200,
    height: 900,
    thumbnailUrl: "https://example.com/thumbnail.jpg", // Add a sample URL
    isTemplate: false, // Set to true if this project is a template
    isPro: true, // Set to true if this project is a pro version
  };

  const [activeTool, setActiveTool] = useState<ActiveTool>("select");
    const canvasRef = useRef(null);
    const containerRef = useRef<HTMLDivElement>(null);

  const onClearSelection = useCallback(() => {
    if (selectionDependentTools.includes(activeTool)) {
      setActiveTool("select");
    }
  }, [activeTool]);

  const { mutate } = useUpdateProject(initialData.id);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce((values: { json: string; height: number; width: number }) => {
      mutate({
        ...values,
        name: initialData.name,
        thumbnailUrl: initialData.thumbnailUrl,
        isTemplate: initialData.isTemplate,
        isPro: initialData.isPro,
      });
    }, 500),
    [mutate]
  );

  const { init, editor } = useEditor({
    defaultState: initialData.json,
    defaultWidth: initialData.width,
    defaultHeight: initialData.height,
    clearSelectionCallback: onClearSelection,
    saveCallback: debouncedSave,
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

    useEffect(() => {
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
    }, [init]);
  return (
    <div className="h-full flex flex-col">
      <Navbar
        id={initialData.id}
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
