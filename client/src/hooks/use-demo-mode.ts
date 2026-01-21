import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface DemoModeData {
  fromStreet: string;
  fromCity: string;
  fromProvince: string;
  fromCountry: string;
  fromPostalCode: string;
  toStreet: string;
  toCity: string;
  toProvince: string;
  toCountry: string;
  toPostalCode: string;
}

const DEFAULT_DEMO_DATA: DemoModeData = {
  fromStreet: '44322 Yale Rd #3',
  fromCity: 'Chilliwack',
  fromProvince: 'BC',
  fromCountry: 'CA',
  fromPostalCode: 'V2R 4H1',
  toStreet: '100 Queen St W',
  toCity: 'Toronto',
  toProvince: 'ON',
  toCountry: 'CA',
  toPostalCode: 'M5H 2N2',
};

export function useDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoData, setDemoData] = useState<DemoModeData | null>(null);
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const demoParam = urlParams.get('demo');
    
    if (demoParam === 'true') {
      setIsDemoMode(true);
      setDemoData(DEFAULT_DEMO_DATA);
      setShouldAutoSubmit(true);
      console.log('Demo mode activated');
    }
  }, []);

  const clearAutoSubmit = () => {
    setShouldAutoSubmit(false);
  };

  return {
    isDemoMode,
    demoData,
    shouldAutoSubmit,
    clearAutoSubmit,
  };
}
