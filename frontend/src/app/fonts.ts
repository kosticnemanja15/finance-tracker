import { Bricolage_Grotesque, Inter } from "next/font/google";

// latin-ext je OBAVEZAN — srpski č/ć/š/ž/đ ("potrošeno", "rashod")
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});