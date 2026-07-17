import { AppFloatingDock } from "@/components/layout/app-floating-dock";
import Navbar from "@/components/layout/navbar";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-background flex min-h-svh flex-col pb-28">
      <Navbar />
      {children}
      <AppFloatingDock />
    </div>
  );
}
