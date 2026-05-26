import AppShell from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth";
import CopyStudio from "./CopyStudio";

export default async function CopyPage() {
  const user = await getCurrentUser();
  const shellUser = user
    ? { username: user.username, role: user.role }
    : null;

  return (
    <AppShell initialUser={shellUser}>
      <CopyStudio />
    </AppShell>
  );
}
