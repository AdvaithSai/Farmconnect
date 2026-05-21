import { useEffect } from 'react';

declare global {
  interface Window {
    google: {
      translate: {
        TranslateElement: {
          new (options: { pageLanguage: string; layout?: number }, elementId: string): void;
          InlineLayout?: {
            SIMPLE: number;
          };
        };
      };
    };
    googleTranslateElementInit: () => void;
  }
}

interface GoogleTranslateProps {
  id?: string;
}

const GoogleTranslate = ({ id = 'google_translate_element' }: GoogleTranslateProps) => {
  useEffect(() => {
    // Define the callback Google's script will invoke after loading
    window.googleTranslateElementInit = () => {
      // Initialize all translation widgets present in the DOM by class
      const containers = document.querySelectorAll('.google-translate-container');
      containers.forEach((container) => {
        if (container.children.length === 0) {
          const containerId = container.id;
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
            },
            containerId
          );
        }
      });
    };

    // If Google Translate API is already loaded, initialize immediately
    if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
    } else {
      // Otherwise inject the Google Translate script
      const alreadyLoaded = document.querySelector('script[src*="translate.google.com/translate_a"]');
      if (!alreadyLoaded) {
        const script = document.createElement('script');
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [id]);

  return (
    <div className="relative flex items-center bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 shadow-inner transition-all duration-300 rounded-full pl-3 pr-2.5 w-[145px] h-[34px] cursor-pointer overflow-hidden group">
      {/* Globe icon — positioned on the left and visual-only */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-white/80 group-hover:text-yellow-400 group-hover:rotate-12 flex-shrink-0 pointer-events-none z-10 mr-1.5 transition-all duration-300"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
      {/* Google Translate dropdown overlayed over the entire pill button */}
      <div 
        id={id} 
        className="google-translate-container absolute inset-0 w-full h-full z-20" 
      />
    </div>
  );
};

export default GoogleTranslate;