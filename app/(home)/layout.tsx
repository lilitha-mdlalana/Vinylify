import Navbar from "@/components/layout/navbar";
import "./home.css";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="home-shell">
      <Navbar />
      {children}
    </div>
  );
}
