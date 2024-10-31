import { redirect } from "next/navigation";

import { auth } from "@/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = async ({ children }: DashboardLayoutProps) => {
  const session = await auth();
  if (!session) {
    redirect("/sign-in");
  }

  return { children };
};

export default DashboardLayout;
