import { EmailLinkForm } from "@/components/AuthForms";
import { getT } from "@/lib/i18n/server";

export default async function MagicLinkPage() {
  const { lang } = await getT();
  return (
    <div className="mx-auto max-w-md">
      <EmailLinkForm lang={lang} kind="magic" />
    </div>
  );
}
