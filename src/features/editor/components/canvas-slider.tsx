"use client"
import React, { useState, useEffect, useRef } from "react";
import { fabric } from "fabric";
import { useReadProject } from "@/features/projects/api/use-read-project";
import { Loader, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Assuming you have a utility function for class merging

interface Page {
  width: number;
  height: number;
  json: string;
}

const CanvasSlider = ({ projectId }: { projectId: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: pages, isLoading, error } = useReadProject(projectId);

  const calculateScale = (canvasWidth: number, canvasHeight: number) => {
    if (!containerRef.current) return 1;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const widthScale = containerWidth / canvasWidth;
    const heightScale = containerHeight / canvasHeight;

    return Math.min(widthScale, heightScale, 1);
  };

  const initializeCanvas = (width: number, height: number) => {
    const canvasElement = canvasRef.current!;
    
    if (!fabricCanvas.current) {
      fabricCanvas.current = new fabric.Canvas(canvasElement, {
        width,
        height,
        selection: false,
        renderOnAddRemove: true,
      });
    } else {
      fabricCanvas.current.setWidth(width);
      fabricCanvas.current.setHeight(height);
    }
    
    return fabricCanvas.current;
  };

  const loadPage = async (page: Page) => {
    if (!page) return;
    
    setIsTransitioning(true);
    const { width, height, json } = page;

    try {
      const parsedJson = JSON.parse(JSON.parse(json));
      const canvas = initializeCanvas(width, height);

      canvas.clear();
      canvas.loadFromJSON(parsedJson, () => {
        canvas.renderAll();
        
        const scale = calculateScale(width, height);
        canvas.setZoom(scale);
        
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;
        
        canvas.setDimensions({
          width: scaledWidth,
          height: scaledHeight,
        });

        setIsTransitioning(false);
      });
    } catch (error) {
      console.error("Error loading page:", error);
      setIsTransitioning(false);
    }
  };

  const handlePrevious = () => {
    if (!pages || isTransitioning) return;
    setCurrentIndex((prev) => (prev === 0 ? pages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (!pages || isTransitioning) return;
    setCurrentIndex((prev) => (prev === pages.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!pages || pages.length === 0 || isTransitioning) return;

    switch (e.key) {
      case "ArrowLeft":
      case "ArrowUp":
        handlePrevious();
        break;
      case "ArrowRight":
      case "ArrowDown":
        handleNext();
        break;
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
      }
    };
  }, [pages, isTransitioning]);

  useEffect(() => {
    if (pages?.[currentIndex]) {
      loadPage(pages[currentIndex]);
    }
  }, [currentIndex, pages]);

  useEffect(() => {
    const handleResize = () => {
      if (pages?.[currentIndex]) {
        loadPage(pages[currentIndex]);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentIndex, pages]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-red-500">Failed to load project pages.</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center w-full h-full min-h-[80vh] max-w-7xl mx-auto p-4">
      <div 
        ref={containerRef} 
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
      >
        {/* Canvas Container */}
        <div className={cn(
          "relative flex items-center justify-center",
          "w-full h-full max-w-full max-h-full",
          "transition-opacity duration-300",
          isTransitioning ? "opacity-50" : "opacity-100"
        )}>
          <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
          
          {/* Loading Overlay */}
          {isTransitioning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-sm">
              <Loader className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none">
          <Button
            variant="secondary"
            size="icon"
            onClick={handlePrevious}
            disabled={isTransitioning}
            className={cn(
              "rounded-full shadow-lg pointer-events-auto",
              "bg-white/80 hover:bg-white",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            onClick={handleNext}
            disabled={isTransitioning}
            className={cn(
              "rounded-full shadow-lg pointer-events-auto",
              "bg-white/80 hover:bg-white",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Page Counter */}
      {pages && (
        <div className="mt-4 flex items-center justify-center">
          <p className="text-sm font-medium text-muted-foreground">
            Page {currentIndex + 1} of {pages.length}
          </p>
        </div>
      )}
    </div>
  );
};

export default CanvasSlider;