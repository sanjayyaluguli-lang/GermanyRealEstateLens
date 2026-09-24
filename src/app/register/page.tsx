import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  const { lang } = await getT();
  return (
    <div className="mx-auto max-w-md">
      <RegisterForm lang={lang} />
    </div>
  );
}
