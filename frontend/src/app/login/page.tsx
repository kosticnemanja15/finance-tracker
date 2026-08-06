"use client";  // Forma, hooks, event handleri = client component. Bez ovoga puca.

import { useState , useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { LoginSchema, type LoginInput } from "@/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";



export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();

  // formError = greška sa BACKENDA (401 pogrešna lozinka), odvojeno od
  // field grešaka (validacija). RHF handluje field greške sam.
  const [formError, setFormError] = useState<string | null>(null);

  // Ulogovan korisnik nema šta da traži na login stranici → dashboard.
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  const {
    register,            // veže input za RHF
    handleSubmit,        // wrapper koji prvo validira, pa zove našu funkciju
    formState: { errors, isSubmitting },  // errors = Zod poruke, isSubmitting = loading
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),  // spaja Zod sa RHF
  });

  // onSubmit se zove SAMO ako Zod validacija prođe.
  async function onSubmit(data: LoginInput) {
    setFormError(null);  // očisti prethodnu grešku
    try {
      // login() iz konteksta: poziva backend, snima token, redirect na /dashboard.
      await login(data.email, data.password);
      // Ako uspe, AuthContext već radi router.push("/dashboard") — mi ne radimo ništa.
    } catch (err) {
      // login baci ApiError na 401. Hvatamo i prikazujemo poruku.
      if (err instanceof ApiError) {
        setFormError(err.message);  // "Invalid email or password" sa backenda
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        {/* noValidate = isključi browser validaciju, koristimo Zod */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}  // veže input za RHF polje "email"
            />
            {/* Field greška iz Zod-a */}
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Backend greška (401 itd.) — odvojeno od field grešaka */}
          {formError && (
            <p className="text-sm text-destructive text-center">{formError}</p>
          )}

          {/* disabled dok traje submit → sprečava dupli klik */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-foreground underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}