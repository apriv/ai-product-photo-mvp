import AppShell from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth";
import ImageGenerator from "./ImageGenerator";

export default async function ImagePage() {
  const user = await getCurrentUser();
  const shellUser = user
    ? { username: user.username, role: user.role }
    : null;

  return (
    <AppShell initialUser={shellUser}>
      <ImageGenerator />
    </AppShell>
  );
}
