import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0B0E13] text-[#EDEFF3]">
      <Navbar />
      <main className="flex-1 pb-16">{children}</main>
      <Footer />
    </div>
  );
}
