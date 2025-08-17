import React, { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, onSnapshot, GeoPoint } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAppStore } from '../lib/store';
import { toast } from 'react-hot-toast';

// These would normally be imported from the installed packages
// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';

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

const LocationTracker: React.FC<LocationTrackerProps> = ({
  transactionId,
  offerId,
  farmerId,
  retailerId,
  isDeliveryComplete = false,
  onDeliveryComplete
}) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<'in_transit' | 'delivered' | 'acknowledged'>(isDeliveryComplete ? 'acknowledged' : 'in_transit');
  const { user } = useAppStore();
  const mapRef = useRef(null);
  
  const isFarmer = user?.role === 'farmer';
  const isRetailer = user?.role === 'retailer';

  // Watch for location updates in Firestore
  useEffect(() => {
    if (!transactionId) return;

    const unsubscribe = onSnapshot(doc(db, 'delivery_tracking', transactionId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.location) {
          setLocation({
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            timestamp: data.timestamp
          });
        }
        if (data.status) {
          setDeliveryStatus(data.status);
        }
      }
    });

    return () => unsubscribe();
  }, [transactionId]);

  // Start sharing location (for farmers)
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
        
        setLocation(newLocation);
        
        // Update location in Firestore
        try {
          await updateDoc(doc(db, 'delivery_tracking', transactionId), {
            location: new GeoPoint(latitude, longitude),
            timestamp: Date.now(),
            farmerId,
            retailerId,
            offerId,
            status: deliveryStatus
          });
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
      await updateDoc(doc(db, 'delivery_tracking', transactionId), {
        status: 'delivered',
        deliveredAt: Date.now()
      });
      setDeliveryStatus('delivered');
      stopSharingLocation();
      toast.success('Delivery marked as complete');
      if (onDeliveryComplete) onDeliveryComplete();
    } catch (error) {
      console.error('Error marking delivery as complete:', error);
      toast.error('Failed to mark delivery as complete');
    }
  };

  // Acknowledge delivery (for retailers)
  const acknowledgeDelivery = async () => {
    try {
      await updateDoc(doc(db, 'delivery_tracking', transactionId), {
        status: 'acknowledged',
        acknowledgedAt: Date.now()
      });
      setDeliveryStatus('acknowledged');
      toast.success('Delivery acknowledged');
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
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-1">Status: 
          <span className={`ml-2 font-medium ${deliveryStatus === 'in_transit' ? 'text-blue-600' : deliveryStatus === 'delivered' ? 'text-orange-600' : 'text-green-600'}`}>
            {deliveryStatus === 'in_transit' ? 'In Transit' : deliveryStatus === 'delivered' ? 'Delivered (Awaiting Confirmation)' : 'Delivery Confirmed'}
          </span>
        </p>
        {location && (
          <p className="text-xs text-gray-500">
            Last updated: {new Date(location.timestamp).toLocaleString()}
          </p>
        )}
      </div>

      {/* Map placeholder - would be replaced with actual Leaflet map */}
      <div 
        ref={mapRef}
        className="w-full h-64 bg-gray-200 rounded mb-4 flex items-center justify-center"
      >
        <p className="text-gray-500">Map would be displayed here</p>
        {/* Actual map implementation would be:
        <MapContainer 
          center={location ? [location.latitude, location.longitude] : [20.5937, 78.9629]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {location && (
            <Marker position={[location.latitude, location.longitude]}>
              <Popup>Farmer's current location</Popup>
            </Marker>
          )}
        </MapContainer>
        */}
      </div>

      {/* Controls for farmer */}
      {isFarmer && deliveryStatus === 'in_transit' && (
        <div className="flex flex-col space-y-2">
          {!isSharingLocation ? (
            <button 
              onClick={startSharingLocation}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Start Sharing Location
            </button>
          ) : (
            <>
              <button 
                onClick={stopSharingLocation}
                className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
              >
                Stop Sharing Location
              </button>
              <button 
                onClick={markDeliveryComplete}
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
              >
                Mark Delivery Complete
              </button>
            </>
          )}
        </div>
      )}

      {/* Controls for retailer */}
      {isRetailer && deliveryStatus === 'delivered' && (
        <button 
          onClick={acknowledgeDelivery}
          className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
        >
          Confirm Delivery Received
        </button>
      )}

      {/* Delivery completed message */}
      {deliveryStatus === 'acknowledged' && (
        <div className="text-center py-2 px-4 bg-green-100 text-green-800 rounded">
          Delivery completed and confirmed by both parties
        </div>
      )}
    </div>
  );
};

export default LocationTracker;