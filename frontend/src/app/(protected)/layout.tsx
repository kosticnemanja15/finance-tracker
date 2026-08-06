import { AuthGuard } from "@/components/AuthGuard";

// Layout za sve privatne rute. AuthGuard obmotava sve ispod ove grupe.
// Dodaš rutu u (protected)/ → automatski je zaštićena, bez ponavljanja.
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}