import LegalPage from "../components/LegalPage.jsx";

const sections = [
  {
    id: "information",
    heading: "1. Information we collect",
    body: <p>We may collect information you provide during registration and profile updates, such as your name, email address, phone number, address or block and lot details, and account status. The service may also store tank and device identifiers, sensor readings, complaints, maintenance requests, alerts, and related activity needed to operate the portal.</p>,
  },
  {
    id: "use",
    heading: "2. How we use information",
    body: <p>Information is used to create and secure accounts, verify resident access, assign devices, display tank data, send service alerts, process complaints and maintenance requests, support HOA operations, and improve reliability. We do not need your password to provide these functions, and passwords are stored using one-way protection rather than displayed to administrators.</p>,
  },
  {
    id: "sharing",
    heading: "3. Who can access information",
    body: <p>Authorized HOA administrators may access resident and service information needed for community operations. We may use infrastructure and service providers to host or operate SeptiGuard. We do not sell personal information. Information may be disclosed when required by law or when necessary to protect the service, users, or community.</p>,
  },
  {
    id: "security",
    heading: "4. Security and retention",
    body: <p>We use reasonable administrative and technical measures to protect account and service data. No online service can guarantee absolute security. We retain information for as long as needed for account administration, service history, legal obligations, and legitimate HOA operations, after which it may be deleted or anonymized according to applicable procedures.</p>,
  },
  {
    id: "choices",
    heading: "5. Your choices",
    body: <p>You may ask the HOA administrator to review or correct your profile information and to help with account questions. Some records may need to be retained for security, audit, or community administration purposes.</p>,
  },
  {
    id: "contact",
    heading: "6. Contact",
    body: <p>For privacy questions or requests relating to your SeptiGuard account, contact your HOA administrator through the community’s established support channel.</p>,
  },
];

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="October 15, 2026"
      intro={<p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">This policy explains how SeptiGuard handles information used to provide the Broadway Hagdan Loob Homeowners Association resident and admin portals.</p>}
      sections={sections}
    />
  );
}
