import { getT } from "@/lib/i18n/server";
import { PRIVACY_VERSION } from "@/lib/privacy";

// NOTE FOR OPERATORS: this is a template describing what the software does.
// Fill in the controller details and your actual hosting/mail providers and
// have it reviewed before going live. It is not legal advice.

const OPERATOR = process.env.NEXT_PUBLIC_OPERATOR_CONTACT ?? "[Name, Anschrift, E-Mail des Betreibers]";

const DE = [
  ["Verantwortlicher", `${OPERATOR}`],
  [
    "Welche Daten wir verarbeiten",
    "Konto: E-Mail-Adresse, Passwort-Hash (Argon2id), Zeitpunkt der Zustimmung zu dieser Erklärung. Profil: bevorzugte Regionen, Strategie- und Standardannahmen, Sprache. Nur mit Ihrer ausdrücklichen Einwilligung: Eigenkapital und Nettoeinkommen. Gespeicherte Szenarien und Favoriten (Eingaben und Ergebnisse). Technisch: Sitzungs-Cookie, gehashte IP-Adressen für die Missbrauchsabwehr (Rate-Limiting, max. 24 Stunden).",
  ],
  [
    "Zwecke und Rechtsgrundlagen",
    "Bereitstellung des Kontos und der gespeicherten Analysen (Art. 6 Abs. 1 lit. b DSGVO). Speicherung von Eigenkapital und Einkommen, Szenarien und Favoriten auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), jederzeit im Profil widerrufbar. Missbrauchsabwehr (Art. 6 Abs. 1 lit. f DSGVO).",
  ],
  [
    "Sicherheit",
    "Übertragung ausschließlich per HTTPS. Finanzdaten, Szenarien und Favoriten werden mit AES-256-GCM verschlüsselt gespeichert. Beträge werden nicht in Server-Logs geschrieben.",
  ],
  [
    "Speicherort und Empfänger",
    "Hosting und Datenbank innerhalb der EU. E-Mails (Passwort-Reset, Login-Link) werden über einen EU-basierten Versanddienst verschickt. Keine Weitergabe an Dritte, keine Werbe- oder Tracking-Cookies. Links zu Immobilienscout24 öffnen deren Website; dabei gelten deren Datenschutzbestimmungen.",
  ],
  [
    "Speicherdauer",
    "Bis zur Löschung Ihres Kontos. Nach Widerruf der Einwilligung werden Eigenkapital und Einkommen sofort gelöscht. Sitzungen laufen nach 30 Tagen ab.",
  ],
  [
    "Ihre Rechte",
    "Auskunft und Datenübertragbarkeit (Export unter „Konto & Daten“), Berichtigung (Profil), Löschung (Konto löschen — sofort und vollständig), Einschränkung, Widerspruch, Widerruf von Einwilligungen sowie Beschwerde bei einer Datenschutz-Aufsichtsbehörde.",
  ],
];

const EN = [
  ["Controller", `${OPERATOR}`],
  [
    "Data we process",
    "Account: e-mail address, password hash (Argon2id), time you accepted this policy. Profile: preferred regions, strategy and default assumptions, language. Only with your explicit consent: equity and net income. Saved scenarios and favourites (inputs and results). Technical: session cookie, hashed IP addresses for abuse prevention (rate limiting, max. 24 hours).",
  ],
  [
    "Purposes and legal bases",
    "Providing your account and saved analyses (Art. 6(1)(b) GDPR). Storing equity and income, scenarios and favourites based on your consent (Art. 6(1)(a) GDPR), which you can withdraw at any time in your profile. Abuse prevention (Art. 6(1)(f) GDPR).",
  ],
  [
    "Security",
    "HTTPS only. Financial data, scenarios and favourites are stored encrypted with AES-256-GCM. Amounts are never written to server logs.",
  ],
  [
    "Location and recipients",
    "Hosting and database within the EU. E-mails (password reset, login link) are sent via an EU-based provider. No sharing with third parties, no advertising or tracking cookies. Links to Immobilienscout24 open their website, where their privacy policy applies.",
  ],
  [
    "Retention",
    "Until you delete your account. Withdrawing consent deletes equity and income immediately. Sessions expire after 30 days.",
  ],
  [
    "Your rights",
    "Access and portability (export under “Account & data”), rectification (profile), erasure (delete account — immediate and complete), restriction, objection, withdrawal of consent, and complaint to a data protection supervisory authority.",
  ],
];

export default async function PrivacyPage() {
  const { t, lang } = await getT();
  const sections = lang === "en" ? EN : DE;
  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <h1 className="h1">{t.privacy.title}</h1>
      <p className="text-xs text-slate-500">Version {PRIVACY_VERSION}</p>
      {sections.map(([h, body]) => (
        <section key={h} className="space-y-1">
          <h2 className="h2">{h}</h2>
          <p className="text-sm leading-relaxed text-slate-700">{body}</p>
        </section>
      ))}
    </article>
  );
}
