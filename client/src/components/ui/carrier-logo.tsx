import fedexLogo from '@assets/1_1754762768856.png';
import dhlLogo from '@assets/2_1754762768857.png';
import purolatorLogo from '@assets/3_1754762768857.png';
import canadaPostLogo from '@assets/7_1754765746997.png'; // Corrected to use the proper Canada Post logo
import upsLogo from '@assets/5_1754762768858.png';
import canparLogo from '@assets/6_1754762768858.png';
import loomisLogo from '@assets/7_1754763565800.png';
import glsLogo from '@assets/7_1754765376312.png';
import icsLogo from '@assets/ICS-Courier_1761879828428.png';
import intelcomLogo from '@assets/Intelcom_1761880152324.png';

interface CarrierLogoProps {
  carrierName: string;
  className?: string;
}

export function CarrierLogo({ carrierName, className = "w-8 h-8" }: CarrierLogoProps) {
  // Hide logos on mobile displays (screens smaller than md breakpoint)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  if (isMobile) {
    return null; // Don't render logos on mobile
  }

  // More flexible carrier name matching for desktop
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
    if (lowerName.includes('gls')) {
      return glsLogo;
    }
    if (lowerName.includes('ics')) {
      return icsLogo;
    }
    if (lowerName.includes('intelcom') || lowerName.includes('dragonfly')) {
      return intelcomLogo;
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