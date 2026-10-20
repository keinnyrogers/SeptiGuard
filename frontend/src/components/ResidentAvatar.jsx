import { useAuth } from "../context/AuthContext.jsx";

export default function ResidentAvatar({ className = "h-9 w-9", textClassName = "text-[10px]" }) {
  const { user, profilePhotoUrl } = useAuth();
  const name = user?.name ?? "Resident";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "R";

  return profilePhotoUrl
    ? <img src={profilePhotoUrl} alt={`${name}'s profile`} className={`${className} rounded-full border border-primary object-cover`} />
    : <div className={`${className} flex items-center justify-center rounded-full border border-primary ${textClassName} font-semibold`}>
      {initials}
    </div>;
}
