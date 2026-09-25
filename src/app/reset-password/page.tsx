import { AuthShell } from "@/components/AuthShell";
import { ResetPasswordForm } from "@/components/AuthForms";
import { getT } from "@/lib/i18n/server";

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  const { t, lang } = await getT();
  return (
    <AuthShell>
      {typeof token === "string" ? (
        <ResetPasswordForm lang={lang} token={token} />
      ) : (
        <p className="text-sm text-bad">{t.auth.resetInvalid}</p>
      )}
    </AuthShell>
  );
}
