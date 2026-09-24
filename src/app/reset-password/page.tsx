import { ResetPasswordForm } from "@/components/AuthForms";
import { getT } from "@/lib/i18n/server";

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  const { t, lang } = await getT();
  return (
    <div className="mx-auto max-w-md">
      {typeof token === "string" ? (
        <ResetPasswordForm lang={lang} token={token} />
      ) : (
        <p className="card text-sm text-red-700">{t.auth.resetInvalid}</p>
      )}
    </div>
  );
}
