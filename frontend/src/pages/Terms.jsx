import LegalPage from "../components/LegalPage.jsx";

const sections = [
  {
    id: "acceptance",
    heading: "1. Acceptance of these terms",
    body: <p>By creating an account or using SeptiGuard, you agree to these Terms and Conditions and to use the service in accordance with applicable laws and HOA rules. If you do not agree, please do not create or use an account.</p>,
  },
  {
    id: "service",
    heading: "2. SeptiGuard service",
    body: <p>SeptiGuard provides residents and authorized HOA administrators with septic monitoring, tank status, alerts, maintenance requests, complaints, and related community information. Sensor readings and alerts are informational and may be delayed, incomplete, or unavailable because of connectivity, device, or maintenance issues. They do not replace physical inspection or emergency services.</p>,
  },
  {
    id: "accounts",
    heading: "3. Accounts and responsibilities",
    body: <p>Provide accurate registration details and keep your login credentials confidential. Each resident account is intended for the registered resident and its assigned device. Tell the HOA administrator promptly if your account or device may have been accessed without permission. Administrators may review, approve, reject, or suspend accounts to protect the community and maintain accurate records.</p>,
  },
  {
    id: "acceptable-use",
    heading: "4. Acceptable use",
    body: <p>Do not misuse the service, interfere with its operation, submit false or unlawful content, attempt unauthorized access, or use another person’s account. We may restrict access when necessary to protect users, devices, data, or the service.</p>,
  },
  {
    id: "availability",
    heading: "5. Availability and changes",
    body: <p>We may update, suspend, or change parts of SeptiGuard as the HOA improves the service. We will make reasonable efforts to keep the service available, but continuous or error-free operation cannot be guaranteed.</p>,
  },
  {
    id: "contact",
    heading: "6. Contact",
    body: <p>For account, device, maintenance, or terms questions, contact your HOA administrator through the community’s established support channel.</p>,
  },
];

export default function Terms() {
  return (
    <LegalPage
      title="Terms and Conditions"
      updated="October 15, 2026"
      intro={<p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">These terms describe the basic rules for using SeptiGuard for the Broadway Hagdan Loob Homeowners Association community.</p>}
      sections={sections}
    />
  );
}
