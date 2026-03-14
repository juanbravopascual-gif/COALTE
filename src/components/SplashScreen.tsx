import { useState, useEffect } from 'react';
import animatedLogo from '@/assets/images/logo-coalte-animated.mov';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Check if splash has already been shown in this session
    const hasShownSplash = sessionStorage.getItem('hasShownSplash');
    
    if (hasShownSplash) {
      setShouldRender(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('hasShownSplash', 'true');
      
      // Wait for fade out animation to finish before removing from DOM
      setTimeout(() => {
        setShouldRender(false);
      }, 500);
    }, 3000); // Show for 3 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-white transition-opacity duration-500 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative w-64 md:w-96 aspect-video flex items-center justify-center">
        <video 
          src={animatedLogo} 
          autoPlay 
          muted 
          playsInline
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}
