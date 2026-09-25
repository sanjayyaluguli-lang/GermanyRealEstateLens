import { AuthShell } from "@/components/AuthShell";
import { MagicLinkConfirmForm } from "@/components/AuthForms";
import { getT } from "@/lib/i18n/server";

export default async function MagicLinkVerifyPage({ searchParams }: PageProps<"/magic-link/verify">) {
  const { token } = await searchParams;
  const { t, lang } = await getT();
  return (
    <AuthShell>
      {typeof token === "string" ? (
        <MagicLinkConfirmForm lang={lang} token={token} />
      ) : (
        <p className="text-sm text-bad">{t.auth.resetInvalid}</p>
      )}
    </AuthShell>
  );
}
