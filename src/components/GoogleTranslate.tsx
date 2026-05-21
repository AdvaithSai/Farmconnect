import { useEffect } from 'react';

declare global {
  interface Window {
    google: {
      translate: {
        TranslateElement: {
          new (options: { pageLanguage: string; layout: number }, elementId: string): void;
          InlineLayout: {
            SIMPLE: number;
          };
        };
      };
    };
    googleTranslateElementInit: () => void;
    _farmconnectTranslateInitialized?: boolean;
  }
}

const GoogleTranslate = () => {
  useEffect(() => {
    // Guard: only initialize once per page load
    if (window._farmconnectTranslateInitialized) return;

    // Define the callback Google's script will invoke after loading
    window.googleTranslateElementInit = () => {
      if (window._farmconnectTranslateInitialized) return;
      window._farmconnectTranslateInitialized = true;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        'google_translate_element'
      );
    };

    // If Google Translate API already loaded, call init now
    if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
      return;
    }

    // Otherwise inject the Google Translate script (only once)
    const alreadyLoaded = document.querySelector('script[src*="translate.google.com/translate_a"]');
    if (!alreadyLoaded) {
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-all duration-200 rounded-full px-3 py-1.5 border border-white/20 backdrop-blur-sm">
      {/* Globe icon */}
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
        className="text-white/90 flex-shrink-0 pointer-events-none"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
      {/* Google Translate widget injected here after mount */}
      <div id="google_translate_element" />
    </div>
  );
};

export default GoogleTranslate;