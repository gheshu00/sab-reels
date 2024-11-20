import { useEditor } from "./use-editor";
import { useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { fabric } from "fabric";

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


export const useEditorSetup = (
  activePage: Page | null,
  onClearSelection: () => void,
  updatePage: (data: any) => void
) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<fabric.Canvas | null>(null);

  const debouncedUpdatePageData = useCallback(
    debounce(
      (updatedData: { json: string; width?: number; height?: number }) => {
        if (activePage?.id) {
          updatePage(updatedData);
        }
      },
      500
    ),
    [updatePage, activePage?.id]
  );

  const { init, editor, updateCanvas } = useEditor({
    defaultState: activePage?.json,
    defaultWidth: activePage?.width ? +activePage.width : undefined,
    defaultHeight: activePage?.height ? +activePage.height : undefined,
    clearSelectionCallback: onClearSelection,
    saveCallback: (canvas) => {
      if (isInitialized && canvas) {
        debouncedUpdatePageData({
          json: JSON.stringify(canvas.json),
          width: canvas.width || activePage?.width,
          height: canvas.height || activePage?.height,
        });
      }
    },
  });

  const initializeCanvas = useCallback(
    ({
      canvasElement,
      container,
    }: {
      canvasElement: HTMLCanvasElement;
      container: HTMLDivElement;
    }) => {
      if (!activePage) return;

      // Clean up existing canvas
      if (canvasRef.current) {
        canvasRef.current.dispose();
        canvasRef.current = null;
        setIsInitialized(false);
      }

      const canvas = new fabric.Canvas(canvasElement, {
        width: +activePage.width,
        height: +activePage.height,
        controlsAboveOverlay: true,
        preserveObjectStacking: true,
      });

      canvasRef.current = canvas;

      // Load the saved state if it exists
      if (activePage.json) {
        canvas.loadFromJSON(activePage.json, () => {
          canvas.renderAll();
          setIsInitialized(true);
          setIsLoading(false);
        });
      } else {
        setIsInitialized(true);
        setIsLoading(false);
      }

      init({
        initialCanvas: canvas,
        initialContainer: container,
      });
    },
    [activePage, init]
  );

  return {
    init: initializeCanvas,
    editor,
    updateCanvas,
    isInitialized,
    setIsInitialized,
    isLoading,
  };
};
