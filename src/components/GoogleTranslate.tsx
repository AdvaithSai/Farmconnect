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

const GoogleTranslate = () => {
  useEffect(() => {
    // Define the callback Google's script will invoke after loading
    window.googleTranslateElementInit = () => {
      const container = document.getElementById('google_translate_element');
      if (container && container.children.length === 0) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
          },
          'google_translate_element'
        );
      }
    };

    // If Google Translate API is already loaded, initialize immediately
    if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
    } else {
      // Otherwise inject the Google Translate script
      const alreadyLoaded = document.querySelector('script[src*="translate.google.com/translate_a"]');
      if (!alreadyLoaded) {
        const script = document.createElement('script');
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  return (
    <div className="relative flex items-center bg-white/10 hover:bg-white/20 transition-all duration-200 rounded-full pl-3 pr-2 border border-white/20 backdrop-blur-sm w-[135px] h-[34px] cursor-pointer overflow-hidden">
      {/* Globe icon — positioned on the left and visual-only */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-white/90 flex-shrink-0 pointer-events-none z-10 mr-1"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
      {/* Google Translate dropdown overlayed over the entire pill button */}
      <div id="google_translate_element" className="absolute inset-0 w-full h-full z-20" />
    </div>
  );
};

export default GoogleTranslate;