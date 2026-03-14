import { redirect } from "next/navigation";

/**
 * Root page — redirects to the ride feed (home screen).
 * TODO: Check auth state and redirect to sign-in if not authenticated.
 */
export default function Home() {
  redirect("/rides");
}
