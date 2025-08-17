import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAppStore } from '../../lib/store';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const cropUnits = ['kg', 'ton', 'bushel', 'lb', 'crate', 'box'];

const AddCrop = () => {
  const navigate = useNavigate();
  const { addCrop } = useAppStore();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 0,
    unit: 'kg',
    price_expectation: 0,
    location: '',
    harvest_date: new Date().toISOString().split('T')[0], // Today as default
    image_url: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price_expectation' 
        ? parseFloat(value) || 0 
        : value
    }));
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let imageUrl = '';
    
    try {
      if (imageFile) {
        const storageRef = ref(storage, `crop-images/${Date.now()}-${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      const { error } = await addCrop({ ...formData, image_url: imageUrl });
      
      if (error) {
        const errorMsg = typeof error === 'object' && error !== null && 'message' in error && typeof (error as unknown as { message?: string }).message === 'string'
          ? (error as unknown as { message: string }).message
          : JSON.stringify(error) || 'Failed to add crop';
        toast.error(errorMsg);
      } else {
        toast.success('Crop added successfully!');
        navigate('/farmer/dashboard');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Crop</h1>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Crop Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Crop Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 p-2 border"
                placeholder="E.g. Organic Tomatoes"
                value={formData.name}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 p-2 border"
                placeholder="Describe your crop, including quality, variety, etc."
                value={formData.description}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            
            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  required
                  min="0.01"
                  step="0.01"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 p-2 border"
                  value={formData.quantity || ''}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <select
                  id="unit"
                  name="unit"
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 p-2 border"
                  value={formData.unit}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  {cropUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Expected Price */}
            <div>
              <label htmlFor="price_expectation" className="block text-sm font-medium text-gray-700 mb-1">
                Expected Price per {formData.unit} ($)
              </label>
              <input
                type="number"
                id="price_expectation"
                name="price_expectation"
                min="0.01"
                step="0.01"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 p-2 border"
                placeholder="0.00"
                value={formData.price_expectation || ''}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            
            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 p-2 border"
                placeholder="E.g. Fresno, CA"
                value={formData.location}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            
            {/* Harvest Date */}
            <div>
              <label htmlFor="harvest_date" className="block text-sm font-medium text-gray-700 mb-1">
                Harvest Date
              </label>
              <input
                type="date"
                id="harvest_date"
                name="harvest_date"
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 p-2 border"
                value={formData.harvest_date}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crop Photo (Upload or Capture)
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                disabled={isSubmitting}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 h-32 rounded object-cover border" />
              )}
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md mr-2 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                onClick={() => navigate('/farmer/dashboard')}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding Crop...' : 'Add Crop'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCrop;