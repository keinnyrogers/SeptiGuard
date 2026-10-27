export const COMMUNITY_ADDRESS = "Sitio Broadway, Barangay Dela Paz, Antipolo, Rizal";

export function formatResidentAddress(address) {
  const householdAddress = typeof address === "string" ? address.trim() : "";
  const normalized = householdAddress.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!normalized || ["notset", "unknown"].includes(normalized)) {
    return null;
  }

  const communityIndex = householdAddress.toLowerCase().indexOf("sitio broadway");
  if (communityIndex >= 0) {
    const householdPart = householdAddress.slice(0, communityIndex).replace(/[,\s]+$/, "");
    return householdPart ? `${householdPart}, ${COMMUNITY_ADDRESS}` : COMMUNITY_ADDRESS;
  }

  if (/^(?:blk|block|lot)\b/i.test(householdAddress)) {
    return `${householdAddress}, ${COMMUNITY_ADDRESS}`;
  }

  const houseNumber = householdAddress.replace(/^(?:house\s*(?:no\.?|number)|no\.?|#)\s*/i, "");
  return `House No. ${houseNumber}, ${COMMUNITY_ADDRESS}`;
}
