import { AuthGuard } from "@/components/AuthGuard";
import { NavBar } from "@/components/NavBar";
import { CategoriesProvider } from "@/context/CategoriesContext";
import { Metadata } from "next";

// Layout za sve privatne rute. AuthGuard obmotava sve ispod ove grupe.
// Dodaš rutu u (protected)/ → automatski je zaštićena, bez ponavljanja.
export const metadata: Metadata = {
  title: "Finance Tracker",
  description: "Praćenje ličnih finansija — prihodi, rashodi, statistika.",
};

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>
      <CategoriesProvider>
        <NavBar/>
        {children}
      </CategoriesProvider>
  </AuthGuard>;
}