import { Download, LogOut } from "lucide-react";
import { logoutEverywhere } from "@/app/actions/data";
import { ChangePasswordForm, DeleteAccountForm } from "@/components/AccountForms";
import { PageHeader } from "@/components/PageHeader";
import { SubmitButton } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";

function Section({
  title,
  hint,
  danger = false,
  children,
}: {
  title: string;
  hint?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 border-t border-line pt-8 first:border-t-0 first:pt-0 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
      <div className="space-y-1">
        <h2 className={`h2 text-base ${danger ? "text-bad" : ""}`}>{title}</h2>
        {hint && <p className="text-[13px] text-muted">{hint}</p>}
      </div>
      <div className={`card card-pad ${danger ? "border-bad/40" : ""}`}>{children}</div>
    </section>
  );
}

export default async function AccountPage() {
  const user = await requireUser();
  const { t, lang } = await getT();
  return (
    <div className="space-y-8">
      <PageHeader eyebrow={t.nav.account} title={t.account.title} lede={user.email} />
      <div className="space-y-8">
        <Section title={t.account.exportTitle} hint={t.account.exportText}>
          <a href="/api/account/export" className="btn-secondary" download>
            <Download className="size-4" aria-hidden />
            {t.account.export}
          </a>
        </Section>
        <Section title={t.account.changePassword} hint={t.auth.passwordHint}>
          <ChangePasswordForm lang={lang} />
        </Section>
        <Section title={t.account.sessionsTitle}>
          <form action={logoutEverywhere}>
            <SubmitButton className="btn-secondary">
              <LogOut className="size-4" aria-hidden />
              {t.account.logoutAll}
            </SubmitButton>
          </form>
        </Section>
        <Section title={t.account.danger} danger>
          <DeleteAccountForm lang={lang} />
        </Section>
      </div>
    </div>
  );
}
