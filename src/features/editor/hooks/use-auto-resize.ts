import { fabric } from "fabric";
import { useCallback, useEffect, useState } from "react";

interface UseAutoResizeProps {
  canvas: fabric.Canvas | null;
  container: HTMLDivElement | null;
}

// Custom findScaleToFit function
const findScaleToFit = (
  object: fabric.Object,
  container: { width: number; height: number }
): number => {
  if (!object) {
    console.warn("Object is undefined or null.");
    return 1; // Default scale
  }

  const objectWidth = object.width! * object.scaleX!;
  const objectHeight = object.height! * object.scaleY!;

  const scaleX = container.width / objectWidth;
  const scaleY = container.height / objectHeight;

  // Choose the smaller scale to ensure the object fits within the container
  return Math.min(scaleX, scaleY);
};

export const useAutoResize = ({ canvas, container }: UseAutoResizeProps) => {
  const [isLoading, setIsLoading] = useState(true);

  const autoZoom = useCallback(() => {
    if (!canvas || !container) return;

    const width = container.offsetWidth;
    const height = container.offsetHeight;

    canvas.setWidth(width);
    canvas.setHeight(height);

    const center = canvas.getCenter();
    const zoomRatio = 0.85;

    const localWorkspace = canvas
      .getObjects()
      .find((object) => object.name === "clip");

    if (!localWorkspace) {
      console.warn("No object named 'clip' found in canvas.");
      setIsLoading(true);
      return;
    }

    setIsLoading(false);

    const scale = findScaleToFit(localWorkspace, {
      width: width,
      height: height,
    });

    const zoom = zoomRatio * scale;

    canvas.setViewportTransform(fabric.iMatrix.concat());
    canvas.zoomToPoint(new fabric.Point(center.left, center.top), zoom);

    const workspaceCenter = localWorkspace.getCenterPoint();
    const viewportTransform = canvas.viewportTransform;

    if (
      canvas.width === undefined ||
      canvas.height === undefined ||
      !viewportTransform
    ) {
      return;
    }

    viewportTransform[4] =
      canvas.width / 2 - workspaceCenter.x * viewportTransform[0];
    viewportTransform[5] =
      canvas.height / 2 - workspaceCenter.y * viewportTransform[3];

    canvas.setViewportTransform(viewportTransform);

    localWorkspace.clone((cloned: fabric.Rect) => {
      canvas.clipPath = cloned;
      canvas.requestRenderAll();
    });
  }, [canvas, container]);

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;

    if (canvas && container) {
      setIsLoading(true);

      resizeObserver = new ResizeObserver(() => {
        autoZoom();
      });

      resizeObserver.observe(container);
      autoZoom();
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [canvas, container, autoZoom]);

  return { autoZoom, isLoading };
};
