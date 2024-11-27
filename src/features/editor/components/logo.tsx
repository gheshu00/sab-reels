import Link from "next/link";
import Image from "next/image";
import { BiSearch } from "react-icons/bi";

export const Logo = () => {
  return (
    <Link href="/">
      <div className="size-8 relative shrink-0">
        {/* <Image
          src="/logo.svg"
          fill
          alt="The Canvas"
          className="shrink-0 hover:opacity-75 transition"
        /> */}
        <h1 className="text-3xl">
          <BiSearch />
        </h1>
      </div>
    </Link>
  );
};
