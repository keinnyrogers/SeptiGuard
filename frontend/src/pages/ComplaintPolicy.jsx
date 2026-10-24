import LegalPage from "../components/LegalPage.jsx";

const sections = [
  {
    id: "purpose",
    heading: "1. Purpose of the complaint form",
    body: <p>Use the SeptiGuard complaint form to report a community concern to the homeowners association (HOA). Submitting a complaint creates a record for review; it does not mean that the issue has already been verified, resolved, or scheduled for service.</p>,
  },
  {
    id: "before-submitting",
    heading: "2. Before submitting",
    body: (
      <>
        <p>Choose the category that best matches the concern, provide a short and clear subject, and describe what happened using factual, respectful language.</p>
        <p>Include useful details such as the location, dates or times, and any relevant context. Check that the location is accurate so the HOA can identify where follow-up may be needed.</p>
      </>
    ),
  },
  {
    id: "evidence",
    heading: "3. Photos and supporting information",
    body: <p>Attach a clear PNG or JPG photo when it can safely help explain the issue. Photos are optional, limited to 10 MB in the form, and should relate to the complaint. Do not put yourself or anyone else at risk to collect evidence.</p>,
  },
  {
    id: "review",
    heading: "4. Review and response",
    body: (
      <>
        <p>After submission, the complaint is available to authorized HOA administrators for review and status updates. You can follow its status from the Complaints section of the resident portal.</p>
        <p>The filing guidelines currently shown in the form indicate a response within 48 hours during weekdays. This is a response target, not a guarantee of resolution within that period. Additional review, information, or coordination may be needed.</p>
      </>
    ),
  },
  {
    id: "emergencies",
    heading: "5. Emergencies",
    body: <p>Do not rely on the complaint form or portal notifications for an urgent or life-threatening situation. Contact the appropriate emergency service or the HOA emergency hotline shown on the complaint form directly.</p>,
  },
  {
    id: "privacy",
    heading: "6. Respectful and appropriate use",
    body: <p>Submit accurate information relevant to the issue. Avoid personal attacks, threats, knowingly false reports, or unnecessary sensitive information about other people. Complaint details are handled through the portal by authorized HOA administrators for community follow-up.</p>,
  },
];

export default function ComplaintPolicy() {
  return (
    <LegalPage
      title="Complaint Filing Policy"
      updated="October 22, 2026"
      backTo="/complaints/new"
      backLabel="Back to complaint form"
      intro={<p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">This guide explains how to submit and follow a complaint through the SeptiGuard resident portal. It describes the portal’s current filing guidance and does not replace official HOA rules or emergency services.</p>}
      sections={sections}
    />
  );
}
