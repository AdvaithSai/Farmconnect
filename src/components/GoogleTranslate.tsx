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
    <div 
      id="google_translate_element" 
      className="inline-block bg-green-600 hover:bg-green-500 transition-colors rounded-md border border-green-500"
      style={{ 
        minHeight: 0,
        minWidth: 0,
        padding: 0
      }}
    />
  );
};

export default GoogleTranslate; 