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
  }
}

const GoogleTranslate = () => {
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
        className="text-white/90 flex-shrink-0"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
      {/* Google Translate dropdown gets injected here */}
      <div id="google_translate_element" className="translate-widget-container" />
    </div>
  );
};

export default GoogleTranslate;