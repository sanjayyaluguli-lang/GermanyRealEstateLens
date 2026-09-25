import { AuthShell } from "@/components/AuthShell";
import { EmailLinkForm } from "@/components/AuthForms";
import { getT } from "@/lib/i18n/server";

export default async function ForgotPasswordPage() {
  const { lang } = await getT();
  return (
    <AuthShell>
      <EmailLinkForm lang={lang} kind="reset" />
    </AuthShell>
  );
}
