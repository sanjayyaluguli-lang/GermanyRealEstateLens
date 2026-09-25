import { AuthShell } from "@/components/AuthShell";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/dashboard");
  const sp = await searchParams;
  const { t, lang } = await getT();
  const next = typeof sp.next === "string" ? sp.next : undefined;
  return (
    <AuthShell>
      <LoginForm lang={lang} next={next} notice={sp.reset ? t.auth.resetDone : undefined} />
    </AuthShell>
  );
}
