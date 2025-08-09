import fedexLogo from '@assets/1_1754762768856.png';
import dhlLogo from '@assets/2_1754762768857.png';
import purolatorLogo from '@assets/3_1754762768857.png';
import canadaPostLogo from '@assets/4_1754762768858.png';
import upsLogo from '@assets/5_1754762768858.png';
import canparLogo from '@assets/6_1754762768858.png';
import loomisLogo from '@assets/7_1754763565800.png';

interface CarrierLogoProps {
  carrierName: string;
  className?: string;
}

export function CarrierLogo({ carrierName, className = "w-8 h-8" }: CarrierLogoProps) {
  // More flexible carrier name matching
  const findCarrierLogo = (name: string): string | null => {
    const lowerName = name.toLowerCase();
    
    // Direct matches
    if (lowerName.includes('canada post') || lowerName.includes('canadapost')) {
      return canadaPostLogo;
    }
    if (lowerName.includes('purolator')) {
      return purolatorLogo;
    }
    if (lowerName.includes('ups')) {
      return upsLogo;
    }
    if (lowerName.includes('fedex') || lowerName.includes('fed ex')) {
      return fedexLogo;
    }
    if (lowerName.includes('dhl')) {
      return dhlLogo;
    }
    if (lowerName.includes('canpar')) {
      return canparLogo;
    }
    if (lowerName.includes('loomis')) {
      return loomisLogo;
    }
    
    return null;
  };

  const logoSrc = findCarrierLogo(carrierName);

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