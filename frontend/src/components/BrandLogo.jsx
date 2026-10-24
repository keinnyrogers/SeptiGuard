export function BrandMark({ className = "" }) {
  return (
    <img
      src="/brand-mark.png"
      alt=""
      aria-hidden="true"
      className={`object-contain ${className}`}
    />
  );
}

export function BrandLogo({ className = "" }) {
  return (
    <img
      src="/brand-logo.png"
      alt="SeptiGuard"
      className={`object-contain ${className}`}
    />
  );
}
