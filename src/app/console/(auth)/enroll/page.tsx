import { redirect } from "next/navigation";

// Two-factor setup is now part of the unified sign-in flow at /console/login
// (first-time admins are walked through the QR step automatically). This route
// is kept only so old links/bookmarks land somewhere sensible.
export default function EnrollRedirect() {
  redirect("/console/login");
}
