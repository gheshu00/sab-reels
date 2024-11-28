import { saveAs } from "file-saver";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import { fabric } from "fabric";
import { useState } from "react";
import { toast } from "sonner";

interface ExportOptions {
  projectId: string;
  fileName?: string;
}

export const useExportProject = () => {
  const [isExporting, setIsExporting] = useState(false);

  const convertCanvasToImage = async (
    canvas: fabric.Canvas,
    format: "png" | "jpg"
  ): Promise<string> => {
    return new Promise((resolve) => {
      const dataUrl = canvas.toDataURL({
        format,
        quality: 1,
      });
      resolve(dataUrl);
    });
  };

  const fetchProjectPages = async (projectId: string) => {
    const response = await fetch(`/api/projects/read/${projectId}`);
    if (!response.ok) {
      toast.error("Failed to export Page, Try again");
    }
    const { data } = await response.json();
    return data;
  };

  const exportToImages = async (
    { projectId, fileName = "export" }: ExportOptions,
    format: "png" | "jpg"
  ) => {
    try {
      setIsExporting(true);
      const pages = await fetchProjectPages(projectId);
      const zip = new JSZip();
      const sortedPages = [...pages].sort(
        (a, b) => a.pageNumber - b.pageNumber
      );

      for (const page of sortedPages) {
        const tempCanvas = new fabric.Canvas(null, {
          width: page.width,
          height: page.height,
        });

        await new Promise<void>((resolve) => {
          tempCanvas.loadFromJSON(JSON.parse(page.json), () => {
            resolve();
          });
        });

        const imageData = await convertCanvasToImage(tempCanvas, format);
        const imageBase64 = imageData.split(",")[1];
        zip.file(`${fileName}-page-${page.pageNumber}.${format}`, imageBase64, {
          base64: true,
        });

        tempCanvas.dispose();
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${fileName}.zip`);
    } catch (error) {
      console.error("Error exporting images:", error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = async ({
    projectId,
    fileName = "export",
  }: ExportOptions) => {
    try {
      setIsExporting(true);
      const pages = await fetchProjectPages(projectId);
      const sortedPages = [...pages].sort(
        (a, b) => a.pageNumber - b.pageNumber
      );
      const jsonBlob = new Blob([JSON.stringify(sortedPages, null, 2)], {
        type: "application/json",
      });
      saveAs(jsonBlob, `${fileName}.json`);
    } catch (error) {
      console.error("Error exporting JSON:", error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async ({
    projectId,
    fileName = "export",
  }: ExportOptions) => {
    try {
      setIsExporting(true);
      const pages = await fetchProjectPages(projectId);
      const sortedPages = [...pages].sort(
        (a, b) => a.pageNumber - b.pageNumber
      );

      // Use first page dimensions as default
      const firstPage = sortedPages[0];
      const defaultWidth = firstPage.width;
      const defaultHeight = firstPage.height;

      const pdf = new jsPDF({
        orientation: defaultWidth > defaultHeight ? "landscape" : "portrait",
        unit: "px",
        format: [defaultHeight, defaultWidth],
      });

      const createCanvas = (width: number, height: number) =>
        new fabric.Canvas(null, {
          width,
          height,
        });

      // Function to handle page rendering and scaling
      const renderPageToPDF = async (
        page: any,
        pdf: jsPDF,
        isFirstPage: boolean
      ) => {
        const tempCanvas = createCanvas(page.width, page.height);

        await new Promise<void>((resolve) => {
          tempCanvas.loadFromJSON(JSON.parse(page.json), () => {
            resolve();
          });
        });

        const imageData = await convertCanvasToImage(tempCanvas, "png");

        // Scale dimensions to fit the default page size
        const scaleFactor = Math.min(
          defaultWidth / page.width,
          defaultHeight / page.height
        );

        const scaledWidth = page.width * scaleFactor;
        const scaledHeight = page.height * scaleFactor;

        const offsetX = (defaultWidth - scaledWidth) / 2;
        const offsetY = (defaultHeight - scaledHeight) / 2;

        if (!isFirstPage) {
          pdf.addPage([defaultHeight, defaultWidth]);
        }

        // Add black background for blank spaces
        pdf.setFillColor(0, 0, 0); // Black color
        pdf.rect(0, 0, defaultWidth, defaultHeight, "F");

        // Add scaled image to the page
        pdf.addImage(
          imageData,
          "PNG",
          offsetX,
          offsetY,
          scaledWidth,
          scaledHeight
        );

        tempCanvas.dispose();
      };

      // Handle all pages
      for (let i = 0; i < sortedPages.length; i++) {
        const isFirstPage = i === 0;
        await renderPageToPDF(sortedPages[i], pdf, isFirstPage);
      }

      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToPNG: (options: ExportOptions) => exportToImages(options, "png"),
    exportToJPG: (options: ExportOptions) => exportToImages(options, "jpg"),
    exportToJSON,
    exportToPDF,
    isExporting,
  };
};
