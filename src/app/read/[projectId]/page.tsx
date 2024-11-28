import CanvasSlider from "@/features/editor/components/canvas-slider";
import React from "react";

interface EditorProjectId {
    params: {
      projectId: string;
    };
  }

const Page = ({ params }: EditorProjectId) => {
  return (
    <div className="h-full w-full flex justify-center items-center bg-black">
    <CanvasSlider projectId={params.projectId} />
  </div>
  );
};

export default Page;
