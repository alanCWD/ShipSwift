import fedexLogo from '@assets/1_1754762768856.png';
import dhlLogo from '@assets/2_1754762768857.png';
import purolatorLogo from '@assets/3_1754762768857.png';
import canadaPostLogo from '@assets/4_1754762768858.png';
import upsLogo from '@assets/5_1754762768858.png';
import canparLogo from '@assets/6_1754762768858.png';
import loomisLogo from '@assets/7_1754762768859.png';

interface CarrierLogoProps {
  carrierName: string;
  className?: string;
}

export function CarrierLogo({ carrierName, className = "w-8 h-8" }: CarrierLogoProps) {
  const normalizedName = carrierName.toLowerCase().replace(/\s+/g, '');
  
  const logoMap: Record<string, string> = {
    'canadapost': canadaPostLogo,
    'purolator': purolatorLogo,
    'ups': upsLogo,
    'fedex': fedexLogo,
    'dhl': dhlLogo,
    'canpar': canparLogo,
    'loomis': loomisLogo,
  };

  const logoSrc = logoMap[normalizedName];

  if (logoSrc) {
    return (
      <img 
        src={logoSrc} 
        alt={`${carrierName} logo`}
        className={className}
        style={{ objectFit: 'contain' }}
      />
    );
  }

  // Fallback for carriers without uploaded logos (GLS, Nationex)
  return (
    <div className={`${className} bg-gray-100 rounded flex items-center justify-center`}>
      <span className="text-xs font-bold text-gray-600">
        {carrierName.slice(0, 3).toUpperCase()}
      </span>
    </div>
  );
}