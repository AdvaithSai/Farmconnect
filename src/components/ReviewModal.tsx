import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { toast } from 'react-hot-toast';
import StarRating from './StarRating';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  targetUserId: string;
  targetUserName?: string;
  role: 'farmer' | 'retailer';
}

const ReviewModal: React.FC<ReviewModalProps> = ({ 
  isOpen, 
  onClose, 
  transactionId, 
  targetUserId,
  targetUserName = 'this user',
  role
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, submitReview } = useAppStore();

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await submitReview({
        transactionId,
        reviewerId: user.id,
        targetUserId,
        rating,
        comment: comment.trim()
      });

      if (error) throw error;
      
      toast.success('Review submitted successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const entityToRate = role === 'farmer' ? 'the Retailer' : 'the Farmer and their Crop';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-[fadeIn_0.2s_ease-out]">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Rate Transaction</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-gray-600 mb-6 text-center">
            How was your experience with <strong>{targetUserName}</strong>? Please rate {entityToRate} to build trust in our community.
          </p>
          
          <div className="flex flex-col items-center justify-center mb-6">
            <StarRating 
              rating={rating} 
              readOnly={false} 
              size={40} 
              onChange={setRating} 
              className="mb-2"
            />
            <span className="text-sm font-medium text-gray-500">
              {rating === 0 ? 'Select a rating' : 
               rating === 1 ? 'Poor' : 
               rating === 2 ? 'Fair' : 
               rating === 3 ? 'Good' : 
               rating === 4 ? 'Very Good' : 'Excellent'}
            </span>
          </div>
          
          <div className="mb-6">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Write a Review (Optional)
            </label>
            <textarea
              id="comment"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none"
              placeholder="Tell us what went well or what could be improved..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isSubmitting || rating === 0 
                  ? 'bg-green-400 text-white cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
