import { AuthGuard } from "@/components/AuthGuard";
import { CategoriesProvider } from "@/context/CategoriesContext";

// Layout za sve privatne rute. AuthGuard obmotava sve ispod ove grupe.
// Dodaš rutu u (protected)/ → automatski je zaštićena, bez ponavljanja.
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>
      <CategoriesProvider>
        {children}
      </CategoriesProvider>
  </AuthGuard>;
}