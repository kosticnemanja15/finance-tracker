import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");  // guard preuzima odatle
}