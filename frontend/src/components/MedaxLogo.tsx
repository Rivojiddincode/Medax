interface MedaxLogoProps {
  size?: "sm" | "md" | "lg";
  showSub?: boolean;
  className?: string;
}

export function MedaxEmblem({ size = 38, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`medax-emblem-box ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img
        src="/favicon.png"
        alt="Medax"
        width={size}
        height={size}
        className="medax-emblem-img"
        loading="eager"
      />
    </span>
  );
}

export function MedaxLogo({ size = "md", showSub = true, className = "" }: MedaxLogoProps) {
  const emblemSize = size === "sm" ? 32 : size === "lg" ? 54 : 40;

  return (
    <div className={`medax-logo-wrap ${size} ${className}`}>
      <MedaxEmblem size={emblemSize} />
      <div className="medax-logo-text">
        <div className="medax-brand-name">
          <span className="brand-med">Med</span>
          <span className="brand-ax">ax</span>
        </div>
        {showSub && <span className="medax-tagline">MEDTEXNIKA MARKAZI</span>}
      </div>
    </div>
  );
}
