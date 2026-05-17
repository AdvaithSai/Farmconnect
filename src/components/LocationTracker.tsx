import React, { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, setDoc, onSnapshot, GeoPoint } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAppStore } from '../lib/store';
import { toast } from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ReviewModal from './ReviewModal';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for differentiation
const farmerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const retailerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationTrackerProps {
  transactionId: string;
  offerId: string;
  farmerId: string;
  retailerId: string;
  isDeliveryComplete?: boolean;
  onDeliveryComplete?: () => void;
}

interface Location {
  latitude: number;
  longitude: number;
  timestamp: number;
}

// Helper component to auto-fit bounds
const MapBoundsFitter: React.FC<{ farmerLoc: Location | null, retailerLoc: Location | null }> = ({ farmerLoc, retailerLoc }) => {
  const map = useMap();
  useEffect(() => {
    if (farmerLoc && retailerLoc) {
      const bounds = L.latLngBounds(
        [farmerLoc.latitude, farmerLoc.longitude],
        [retailerLoc.latitude, retailerLoc.longitude]
      );
      // Pad bounds slightly so markers aren't exactly on the edge
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (farmerLoc) {
      map.setView([farmerLoc.latitude, farmerLoc.longitude], 14);
    } else if (retailerLoc) {
      map.setView([retailerLoc.latitude, retailerLoc.longitude], 14);
    }
  }, [map, farmerLoc, retailerLoc]);
  return null;
};

const LocationTracker: React.FC<LocationTrackerProps> = ({
  transactionId,
  offerId,
  farmerId,
  retailerId,
  isDeliveryComplete = false,
  onDeliveryComplete
}) => {
  const [farmerLocation, setFarmerLocation] = useState<Location | null>(null);
  const [retailerLocation, setRetailerLocation] = useState<Location | null>(null);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<'in_transit' | 'delivered' | 'acknowledged'>(isDeliveryComplete ? 'acknowledged' : 'in_transit');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const { user } = useAppStore();
  
  const isFarmer = user?.role === 'farmer';
  const isRetailer = user?.role === 'retailer';

  // Watch for location updates in Firestore
  useEffect(() => {
    if (!transactionId) return;

    const unsubscribe = onSnapshot(doc(db, 'delivery_tracking', transactionId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        
        // Backward compatibility with old 'location' field if it exists
        if (data.location && !data.farmerLocation) {
          setFarmerLocation({
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            timestamp: data.timestamp
          });
        }
        
        if (data.farmerLocation) {
          setFarmerLocation({
            latitude: data.farmerLocation.latitude,
            longitude: data.farmerLocation.longitude,
            timestamp: data.farmerLocation.timestamp || data.timestamp
          });
        }
        
        if (data.retailerLocation) {
          setRetailerLocation({
            latitude: data.retailerLocation.latitude,
            longitude: data.retailerLocation.longitude,
            timestamp: data.retailerLocation.timestamp || data.timestamp
          });
        }
        
        if (data.status) {
          setDeliveryStatus(data.status);
        }
      }
    });

    return () => unsubscribe();
  }, [transactionId]);

  // Start sharing location
  const startSharingLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsSharingLocation(true);
    
    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = {
          latitude,
          longitude,
          timestamp: Date.now()
        };
        
        if (isFarmer) {
          setFarmerLocation(newLocation);
        } else if (isRetailer) {
          setRetailerLocation(newLocation);
        }
        
        // Update location in Firestore
        try {
          const updateData: any = {
            farmerId,
            retailerId,
            offerId,
            status: deliveryStatus
          };
          
          if (isFarmer) {
            updateData.farmerLocation = { latitude, longitude, timestamp: Date.now() };
            // Keep original location field updated for backwards compatibility if needed
            updateData.location = new GeoPoint(latitude, longitude);
            updateData.timestamp = Date.now();
          } else if (isRetailer) {
            updateData.retailerLocation = { latitude, longitude, timestamp: Date.now() };
          }
          
          await setDoc(doc(db, 'delivery_tracking', transactionId), updateData, { merge: true });
        } catch (error) {
          console.error('Error updating location:', error);
          toast.error('Failed to update location');
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error(`Error getting location: ${error.message}`);
        stopSharingLocation();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    );

    setWatchId(id);
  };

  // Stop sharing location
  const stopSharingLocation = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsSharingLocation(false);
  };

  // Mark delivery as complete (for farmers)
  const markDeliveryComplete = async () => {
    try {
      await setDoc(doc(db, 'delivery_tracking', transactionId), {
        status: 'delivered',
        deliveredAt: Date.now()
      }, { merge: true });
      setDeliveryStatus('delivered');
      stopSharingLocation();
      toast.success('Delivery marked as complete');
      setIsReviewModalOpen(true);
      if (onDeliveryComplete) onDeliveryComplete();
    } catch (error) {
      console.error('Error marking delivery as complete:', error);
      toast.error('Failed to mark delivery as complete');
    }
  };

  // Acknowledge delivery (for retailers)
  const acknowledgeDelivery = async () => {
    try {
      await setDoc(doc(db, 'delivery_tracking', transactionId), {
        status: 'acknowledged',
        acknowledgedAt: Date.now()
      }, { merge: true });
      setDeliveryStatus('acknowledged');
      stopSharingLocation();
      toast.success('Delivery acknowledged');
      setIsReviewModalOpen(true);
      if (onDeliveryComplete) onDeliveryComplete();
    } catch (error) {
      console.error('Error acknowledging delivery:', error);
      toast.error('Failed to acknowledge delivery');
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h3 className="text-lg font-semibold mb-2">Delivery Tracking</h3>
      
      {/* Status display */}
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <p className="text-sm text-gray-600 mb-1">Status: 
            <span className={`ml-2 font-medium ${deliveryStatus === 'in_transit' ? 'text-blue-600' : deliveryStatus === 'delivered' ? 'text-orange-600' : 'text-green-600'}`}>
              {deliveryStatus === 'in_transit' ? 'In Transit' : deliveryStatus === 'delivered' ? 'Delivered (Awaiting Confirmation)' : 'Delivery Confirmed'}
            </span>
          </p>
          {(farmerLocation || retailerLocation) && (
            <p className="text-xs text-gray-500">
              Last updated: {new Date((farmerLocation?.timestamp || retailerLocation?.timestamp || Date.now())).toLocaleString()}
            </p>
          )}
        </div>
        
        {/* Controls for starting/stopping location sharing */}
        {deliveryStatus !== 'acknowledged' && (
          <div className="mt-2 md:mt-0">
            {!isSharingLocation ? (
              <button 
                onClick={startSharingLocation}
                className="bg-blue-100 text-blue-700 py-1.5 px-3 rounded hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                Share My Live Location
              </button>
            ) : (
              <button 
                onClick={stopSharingLocation}
                className="bg-red-100 text-red-700 py-1.5 px-3 rounded hover:bg-red-200 transition-colors text-sm font-medium flex items-center"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></span>
                Stop Sharing Location
              </button>
            )}
          </div>
        )}
      </div>

      {/* Actual Leaflet Map */}
      <div className="w-full h-64 bg-gray-100 rounded mb-4 overflow-hidden relative z-0">
        <MapContainer 
          center={farmerLocation ? [farmerLocation.latitude, farmerLocation.longitude] : retailerLocation ? [retailerLocation.latitude, retailerLocation.longitude] : [20.5937, 78.9629]} 
          zoom={5} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapBoundsFitter farmerLoc={farmerLocation} retailerLoc={retailerLocation} />
          
          {farmerLocation && (
            <Marker position={[farmerLocation.latitude, farmerLocation.longitude]} icon={farmerIcon}>
              <Popup>
                <strong>Farmer's Location</strong><br/>
                {isFarmer ? "You are here" : "They are bringing the crops from here"}
              </Popup>
            </Marker>
          )}
          
          {retailerLocation && (
            <Marker position={[retailerLocation.latitude, retailerLocation.longitude]} icon={retailerIcon}>
              <Popup>
                <strong>Retailer's Location</strong><br/>
                {isRetailer ? "You are here" : "Deliver the crops here"}
              </Popup>
            </Marker>
          )}
        </MapContainer>
        
        {!farmerLocation && !retailerLocation && (
          <div className="absolute inset-0 bg-black/5 flex items-center justify-center z-[1000] pointer-events-none">
            <div className="bg-white px-4 py-2 rounded-lg shadow font-medium text-gray-600">
              Waiting for locations to be shared...
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between text-xs text-gray-500 mb-4 px-1">
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-1 border border-white outline outline-1 outline-gray-300"></span> Farmer Location</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-1 border border-white outline outline-1 outline-gray-300"></span> Retailer Location</div>
      </div>

      {/* Final Action Controls */}
      {isFarmer && deliveryStatus === 'in_transit' && (
        <button 
          onClick={markDeliveryComplete}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 transition-colors shadow-sm"
        >
          Mark Delivery Complete
        </button>
      )}

      {isRetailer && deliveryStatus === 'delivered' && (
        <button 
          onClick={acknowledgeDelivery}
          className="w-full bg-orange-600 text-white py-3 px-4 rounded-md font-medium hover:bg-orange-700 transition-colors shadow-sm"
        >
          Confirm Delivery Received
        </button>
      )}

      {deliveryStatus === 'acknowledged' && (
        <div className="text-center py-3 px-4 bg-green-50 border border-green-200 text-green-800 rounded-md shadow-sm font-medium">
          ✅ Delivery completed and confirmed by both parties
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        transactionId={transactionId}
        targetUserId={isFarmer ? retailerId : farmerId}
        role={isFarmer ? 'farmer' : 'retailer'}
      />
    </div>
  );
};

export default LocationTracker;