import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  readOnly?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  maxRating = 5, 
  size = 20, 
  readOnly = true, 
  onChange,
  className = ""
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleMouseEnter = (index: number) => {
    if (!readOnly) setHoverRating(index);
  };

  const handleMouseLeave = () => {
    if (!readOnly) setHoverRating(0);
  };

  const handleClick = (index: number) => {
    if (!readOnly && onChange) onChange(index);
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {[...Array(maxRating)].map((_, i) => {
        const starValue = i + 1;
        const isActive = starValue <= (hoverRating || rating);
        const isPartial = readOnly && !isActive && starValue - 1 < rating && starValue > rating;
        
        return (
          <div 
            key={i}
            className={`relative ${!readOnly ? 'cursor-pointer transition-transform hover:scale-110' : ''}`}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(starValue)}
          >
            {/* Background Star */}
            <Star 
              size={size} 
              className="text-gray-300"
              strokeWidth={1.5}
            />
            
            {/* Active Star */}
            {(isActive || isPartial) && (
              <div 
                className="absolute inset-0 overflow-hidden" 
                style={{ width: isActive ? '100%' : `${(rating % 1) * 100}%` }}
              >
                <Star 
                  size={size} 
                  className="text-yellow-400 fill-yellow-400"
                  strokeWidth={1.5}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StarRating;
