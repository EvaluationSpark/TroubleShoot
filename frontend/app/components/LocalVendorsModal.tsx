import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface LocalVendorsModalProps {
  visible: boolean;
  itemType: string;
  onClose: () => void;
}

interface Vendor {
  id: string;
  name: string;
  specialization: string;
  address: string;
  phone: string;
  rating: number;
  reviews_count: number;
  distance: string;
  estimated_cost: string;
  hours: string;
  website?: string;
}

export default function LocalVendorsModal({
  visible,
  itemType,
  onClose,
}: LocalVendorsModalProps) {
  const [location, setLocation] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState<{latitude: number, longitude: number} | null>(null);

  const getCurrentLocation = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'GPS location is not available on web. Please enter your location manually.');
      return;
    }

    setGettingLocation(true);
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to find nearby repair shops.');
        setGettingLocation(false);
        return;
      }

      // Get current position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      setCoordinates({ latitude, longitude });

      // Reverse geocode to get city name
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        const locationText = `${address.city || address.subregion || address.region}, ${address.country}`;
        setLocation(locationText);
      }

      setGettingLocation(false);
      
      // Automatically search with GPS location
      searchVendorsWithCoords(latitude, longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your current location. Please enter it manually.');
      setGettingLocation(false);
    }
  };

  const searchVendorsWithCoords = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/find-local-vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: itemType,
          location: location || `${lat}, ${lng}`,
          latitude: lat,
          longitude: lng,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors);
        setSearched(true);
      } else {
        Alert.alert('Error', 'Failed to find local vendors');
      }
    } catch (error) {
      console.error('Error searching vendors:', error);
      Alert.alert('Error', 'Failed to search for vendors');
    } finally {
      setLoading(false);
    }
  };

  const searchVendors = async () => {
    if (!location.trim() && !coordinates) {
      Alert.alert('Location Required', 'Please enter your city/zip code or use GPS location');
      return;
    }

    if (coordinates) {
      searchVendorsWithCoords(coordinates.latitude, coordinates.longitude);
    } else {
      setLoading(true);
      try {
        const response = await fetch(`${BACKEND_URL}/api/find-local-vendors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_type: itemType,
            location: location,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setVendors(data.vendors);
          setSearched(true);
        } else {
          Alert.alert('Error', 'Failed to find local vendors');
        }
      } catch (error) {
        console.error('Error searching vendors:', error);
        Alert.alert('Error', 'Failed to search for vendors');
      } finally {
        setLoading(false);
      }
    }
  };

  const callVendor = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const openWebsite = (url: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const openMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/?q=${encodedAddress}`);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= Math.floor(rating) ? 'star' : i - 0.5 <= rating ? 'star-half' : 'star-outline'}
          size={16}
          color="#fbbf24"
        />
      );
    }
    return stars;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Find Local Repair Shops</Text>
            <Text style={styles.headerSubtitle}>Professional repair services near you</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Search Section */}
          <View style={styles.searchSection}>
            <Text style={styles.itemTypeLabel}>Looking for: {itemType}</Text>
            
            <View style={styles.searchContainer}>
              <Ionicons name="location" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your city or zip code"
                placeholderTextColor="#666"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <TouchableOpacity
              style={[styles.searchButton, loading && styles.disabledButton]}
              onPress={searchVendors}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="search" size={20} color="#fff" />
                  <Text style={styles.searchButtonText}>Find Repair Shops</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Vendors List */}
          {searched && vendors.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={64} color="#555" />
              <Text style={styles.emptyText}>No repair shops found</Text>
              <Text style={styles.emptySubtext}>Try a different location</Text>
            </View>
          )}

          {vendors.map((vendor) => (
            <View key={vendor.id} style={styles.vendorCard}>
              {/* Vendor Header */}
              <View style={styles.vendorHeader}>
                <View style={styles.vendorIcon}>
                  <Ionicons name="business" size={24} color="#00D9FF" />
                </View>
                <View style={styles.vendorMainInfo}>
                  <Text style={styles.vendorName}>{vendor.name}</Text>
                  <View style={styles.ratingContainer}>
                    <View style={styles.starsContainer}>
                      {renderStars(vendor.rating)}
                    </View>
                    <Text style={styles.ratingText}>
                      {vendor.rating.toFixed(1)} ({vendor.reviews_count} reviews)
                    </Text>
                  </View>
                </View>
              </View>

              {/* Specialization */}
              <View style={styles.infoRow}>
                <Ionicons name="construct" size={16} color="#00D9FF" />
                <Text style={styles.infoText}>{vendor.specialization}</Text>
              </View>

              {/* Distance */}
              <View style={styles.infoRow}>
                <Ionicons name="location" size={16} color="#00D9FF" />
                <Text style={styles.infoText}>{vendor.distance}</Text>
              </View>

              {/* Estimated Cost */}
              <View style={styles.infoRow}>
                <Ionicons name="cash" size={16} color="#4ade80" />
                <Text style={[styles.infoText, { color: '#4ade80' }]}>{vendor.estimated_cost}</Text>
              </View>

              {/* Hours */}
              <View style={styles.infoRow}>
                <Ionicons name="time" size={16} color="#fbbf24" />
                <Text style={styles.infoText}>{vendor.hours}</Text>
              </View>

              {/* Address */}
              <TouchableOpacity
                style={styles.addressContainer}
                onPress={() => openMaps(vendor.address)}
              >
                <Ionicons name="map" size={16} color="#666" />
                <Text style={styles.addressText}>{vendor.address}</Text>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => callVendor(vendor.phone)}
                >
                  <Ionicons name="call" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Call</Text>
                </TouchableOpacity>

                {vendor.website && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.websiteButton]}
                    onPress={() => openWebsite(vendor.website!)}
                  >
                    <Ionicons name="globe" size={20} color="#00D9FF" />
                    <Text style={[styles.actionButtonText, { color: '#00D9FF' }]}>Website</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionButton, styles.directionsButton]}
                  onPress={() => openMaps(vendor.address)}
                >
                  <Ionicons name="navigate" size={20} color="#4ade80" />
                  <Text style={[styles.actionButtonText, { color: '#4ade80' }]}>Directions</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  searchSection: {
    marginBottom: 24,
  },
  itemTypeLabel: {
    fontSize: 16,
    color: '#00D9FF',
    marginBottom: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    padding: 16,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#00D9FF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  vendorCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  vendorHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  vendorIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorMainInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
    color: '#aaa',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#ccc',
    flex: 1,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    marginBottom: 16,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: '#aaa',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#00D9FF',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  websiteButton: {
    backgroundColor: '#2a2a2a',
  },
  directionsButton: {
    backgroundColor: '#2a2a2a',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
