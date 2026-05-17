import React from 'react';
import { Wheat } from 'lucide-react';

const ThemeLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[120px]">
    <div className="relative flex items-center justify-center w-20 h-20">
      {/* Glowing background */}
      <div className="absolute inset-0 bg-green-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
      
      {/* Outer spinning dashed ring */}
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-green-500 animate-[spin_3s_linear_infinite]"></div>
      
      {/* Inner spinning solid ring */}
      <div className="absolute inset-2 rounded-full border-t-2 border-l-2 border-yellow-400 animate-[spin_1.5s_linear_infinite_reverse]"></div>
      
      {/* Center Icon container */}
      <div className="absolute inset-4 bg-white rounded-full shadow-inner flex items-center justify-center z-10">
        <Wheat className="text-green-600 animate-pulse" size={24} />
      </div>
    </div>
    
    <div className="mt-6 flex flex-col items-center">
      <div className="text-green-800 font-bold tracking-[0.2em] text-sm uppercase bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-yellow-500">
        FarmConnect
      </div>
      <div className="flex space-x-1 mt-2">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  </div>
);

export default ThemeLoader; 