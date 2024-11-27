import Link from "next/link";
import Image from "next/image";
import { Space_Grotesk } from "next/font/google";
import { BiSearch } from "react-icons/bi";

import { cn } from "@/lib/utils";

const font = Space_Grotesk({
  weight: ["700"],
  subsets: ["latin"],
});

export const Logo = () => {
  return (
    <Link href="/">
      <div className="flex items-center gap-x-2 hover:opacity-75 transition h-[68px] px-4">
        <h1 className="text-3xl">
          <BiSearch />
        </h1>
        <h1 className={cn(font.className, "text-xl font-bold")}>Sab Canvas</h1>
      </div>
    </Link>
  );
};
