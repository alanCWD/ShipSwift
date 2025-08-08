interface CarrierLogoProps {
  carrierName: string;
  className?: string;
}

export function CarrierLogo({ carrierName, className = "w-8 h-8" }: CarrierLogoProps) {
  const normalizedName = carrierName.toLowerCase().replace(/\s+/g, '');
  
  const logoComponents: Record<string, JSX.Element> = {
    'canadapost': (
      <svg viewBox="0 0 32 32" className={className}>
        <rect width="32" height="32" fill="#FF0000" rx="4"/>
        <path d="M6 8h20v16H6z" fill="#FFFFFF"/>
        <path d="M8 12h16v2H8zm0 4h12v2H8zm0 4h16v2H8z" fill="#FF0000"/>
        <circle cx="22" cy="18" r="3" fill="#FF0000"/>
        <text x="16" y="28" textAnchor="middle" fontSize="6" fill="#FFFFFF" fontWeight="bold">CP</text>
      </svg>
    ),
    'purolator': (
      <svg viewBox="0 0 32 32" className={className}>
        <rect width="32" height="32" fill="#1E3A8A" rx="4"/>
        <circle cx="16" cy="12" r="6" fill="#FFFFFF"/>
        <path d="M10 18h12l-2 6H12z" fill="#FFFFFF"/>
        <text x="16" y="28" textAnchor="middle" fontSize="5" fill="#FFFFFF" fontWeight="bold">PUR</text>
      </svg>
    ),
    'ups': (
      <svg viewBox="0 0 32 32" className={className}>
        <rect width="32" height="32" fill="#8B4513" rx="4"/>
        <rect x="4" y="8" width="24" height="16" fill="#FFD700" rx="2"/>
        <text x="16" y="18" textAnchor="middle" fontSize="8" fill="#8B4513" fontWeight="bold">ups</text>
        <circle cx="8" cy="24" r="2" fill="#8B4513"/>
        <circle cx="24" cy="24" r="2" fill="#8B4513"/>
      </svg>
    ),
    'fedex': (
      <svg viewBox="0 0 32 32" className={className}>
        <rect width="32" height="32" fill="#4B0082" rx="4"/>
        <rect x="2" y="10" width="14" height="8" fill="#FFFFFF"/>
        <text x="9" y="17" textAnchor="middle" fontSize="6" fill="#4B0082" fontWeight="bold">Fed</text>
        <rect x="16" y="10" width="14" height="8" fill="#FF4500"/>
        <text x="23" y="17" textAnchor="middle" fontSize="6" fill="#FFFFFF" fontWeight="bold">Ex</text>
        <path d="M26 14l2 0l-2 4z" fill="#FFFFFF"/>
      </svg>
    ),
    'dhl': (
      <svg viewBox="0 0 32 32" className={className}>
        <rect width="32" height="32" fill="#FFCC00" rx="4"/>
        <rect x="4" y="8" width="24" height="16" fill="#DC143C"/>
        <text x="16" y="18" textAnchor="middle" fontSize="8" fill="#FFCC00" fontWeight="bold">DHL</text>
        <path d="M4 8h24l-4 4H8z" fill="#FFCC00"/>
      </svg>
    ),
    'canpar': (
      <svg viewBox="0 0 32 32" className={className}>
        <rect width="32" height="32" fill="#0066CC" rx="4"/>
        <circle cx="16" cy="16" r="10" fill="#FFFFFF"/>
        <text x="16" y="19" textAnchor="middle" fontSize="6" fill="#0066CC" fontWeight="bold">CAN</text>
        <text x="16" y="26" textAnchor="middle" fontSize="4" fill="#FFFFFF">PAR</text>
      </svg>
    ),
    'loomis': (
      <svg viewBox="0 0 32 32" className={className}>
        <rect width="32" height="32" fill="#228B22" rx="4"/>
        <rect x="6" y="8" width="20" height="12" fill="#FFFFFF" rx="2"/>
        <text x="16" y="16" textAnchor="middle" fontSize="6" fill="#228B22" fontWeight="bold">LOOMIS</text>
        <circle cx="10" cy="24" r="2" fill="#FFFFFF"/>
        <circle cx="22" cy="24" r="2" fill="#FFFFFF"/>
      </svg>
    ),
    'gls': (
      <svg viewBox="0 0 32 32" className={className}>
        <rect width="32" height="32" fill="#FF6600" rx="4"/>
        <circle cx="16" cy="16" r="8" fill="#FFFFFF"/>
        <text x="16" y="19" textAnchor="middle" fontSize="8" fill="#FF6600" fontWeight="bold">GLS</text>
        <path d="M16 8l3 6h-6z" fill="#FF6600"/>
      </svg>
    ),
    'nationex': (
      <svg viewBox="0 0 32 32" className={className}>
        <rect width="32" height="32" fill="#8B0000" rx="4"/>
        <rect x="4" y="10" width="24" height="8" fill="#FFFFFF"/>
        <text x="16" y="16" textAnchor="middle" fontSize="5" fill="#8B0000" fontWeight="bold">NATIONEX</text>
        <circle cx="8" cy="22" r="2" fill="#FFFFFF"/>
        <circle cx="24" cy="22" r="2" fill="#FFFFFF"/>
        <rect x="8" y="18" width="16" height="2" fill="#FFFFFF"/>
      </svg>
    )
  };

  return logoComponents[normalizedName] || (
    <svg viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" fill="#6B7280" rx="4"/>
      <rect x="6" y="8" width="20" height="12" fill="#FFFFFF" rx="2"/>
      <text x="16" y="16" textAnchor="middle" fontSize="6" fill="#6B7280" fontWeight="bold">SHIP</text>
      <circle cx="10" cy="24" r="2" fill="#FFFFFF"/>
      <circle cx="22" cy="24" r="2" fill="#FFFFFF"/>
    </svg>
  );
}