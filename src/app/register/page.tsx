import { AuthShell } from "@/components/AuthShell";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  const { lang } = await getT();
  return (
    <AuthShell>
      <RegisterForm lang={lang} />
    </AuthShell>
  );
}
