import { logoutEverywhere } from "@/app/actions/data";
import { ChangePasswordForm, DeleteAccountForm } from "@/components/AccountForms";
import { SubmitButton } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";

export default async function AccountPage() {
  const user = await requireUser();
  const { t, lang } = await getT();
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="h1">{t.account.title}</h1>
        <p className="text-sm text-slate-600">{user.email}</p>
      </div>
      <section className="card space-y-2">
        <h2 className="h2">{t.account.export}</h2>
        <p className="text-sm text-slate-600">{t.account.exportText}</p>
        <a href="/api/account/export" className="btn-secondary" download>
          ⤓ {t.account.export}
        </a>
      </section>
      <ChangePasswordForm lang={lang} />
      <form action={logoutEverywhere} className="card">
        <SubmitButton className="btn-secondary">{t.account.logoutAll}</SubmitButton>
      </form>
      <DeleteAccountForm lang={lang} />
    </div>
  );
}
