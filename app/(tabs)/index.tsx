import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
  Linking,
  Platform,
  RefreshControl,
  Modal,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { consumeFlash } from "../../services/flash";
import * as Location from "expo-location";
import LocationPopupProvider from "../../components/LocationPopupProvider";
import { Ionicons } from "@expo/vector-icons";
import { getCustomers, updateCustomerStatus } from "../../services/api";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

type Customer = {
  _id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  orderDetails?: string;
  deliveryPerson?: string;
  status: string;
  deliveryDate: string;
  createdAt: string;
  updatedAt: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const [successVisible, setSuccessVisible] = useState(false);
  const [successText, setSuccessText] = useState("");

  // State for backend data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for in-app maps
  const [mapsVisible, setMapsVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [mapsUrl, setMapsUrl] = useState("");

  useEffect(() => {
    const msg = consumeFlash();
    if (msg) {
      setSuccessText(msg);
      setSuccessVisible(true);
    }
    loadCustomers();
  }, []);

  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  // Load customers from backend
  const loadCustomers = async () => {
    try {
      setError(null);
      console.log("Loading customers from backend...");

      const response = await getCustomers();
      console.log("Backend response:", response);

      if (response.success && Array.isArray(response.customers)) {
        setCustomers(response.customers);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error: any) {
      console.error("Error loading customers:", error);
      setError(error.message || "Failed to load customers");
      Alert.alert("Error", "Failed to load customers from server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCustomers();
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance);
  };

  const startLocationTracking = async () => {
    try {
      setLocationLoading(true);

      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required for this app to work properly."
        );
        setLocationPermission(false);
        setLocationLoading(false);
        return;
      }

      setLocationPermission(true);

      // Get initial position
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });
      try {
        // Reverse geocode to get a human readable address
        const geocoded = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (geocoded && geocoded.length > 0) {
          const a = geocoded[0];
          const parts = [
            a.name,
            a.street,
            a.city,
            a.region,
            a.postalCode,
            a.country,
          ].filter(Boolean);
          setCurrentAddress(parts.join(", "));
        } else {
          setCurrentAddress(null);
        }
      } catch (err) {
        console.warn("Reverse geocode failed", err);
        setCurrentAddress(null);
      }
      setLocationLoading(false);
    } catch (error) {
      console.error("Location error:", error);
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    startLocationTracking();
  }, []);

  const formatCoordinates = (
    location: { latitude: number; longitude: number } | null
  ) => {
    if (!location) return "Unknown";
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  const openDirectionsInApp = async (customer: Customer) => {
    if (!currentLocation) {
      Alert.alert(
        "Location required",
        "Current location is required to open directions. Please enable location and try again."
      );
      return;
    }

    // Validate coordinates
    if (!customer.latitude || !customer.longitude) {
      Alert.alert(
        "Invalid Location",
        "This customer doesn't have valid location coordinates."
      );
      return;
    }

    const origin = `${currentLocation.latitude},${currentLocation.longitude}`;
    const destination = `${customer.latitude},${customer.longitude}`;

    // Create Google Maps URL for in-app browser
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(
      destination
    )}&travelmode=driving&dir_action=navigate`;

    setSelectedCustomer(customer);
    setMapsUrl(googleMapsUrl);
    setMapsVisible(true);
  };

  // Open Google Maps in in-app browser
  const openInAppBrowser = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: "#007AFF",
        controlsColor: "#FFFFFF",
        secondaryToolbarColor: "#0056b3",
        enableBarCollapsing: true,
        showTitle: true,
        dismissButtonStyle: "close",
      });
    } catch (error) {
      console.error("Error opening browser:", error);
      Alert.alert("Error", "Could not open maps. Please try again.");
    }
  };

  // Alternative: Open in external app (user's choice)
  const openInExternalApp = async (customer: Customer) => {
    if (!customer.latitude || !customer.longitude) {
      Alert.alert(
        "Invalid Location",
        "This customer doesn't have valid location coordinates."
      );
      return;
    }

    const destination = `${customer.latitude},${customer.longitude}`;

    // Try different map apps
    const urls = {
      googleMaps: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        destination
      )}&travelmode=driving`,
      waze: `https://waze.com/ul?ll=${customer.latitude},${customer.longitude}&navigate=yes`,
      appleMaps: `http://maps.apple.com/?daddr=${customer.latitude},${customer.longitude}&dirflg=d`,
    };

    try {
      // Try Google Maps first
      const supported = await Linking.canOpenURL(urls.googleMaps);
      if (supported) {
        await Linking.openURL(urls.googleMaps);
        return;
      }

      // Fallback to other apps
      Alert.alert("Open in Maps", "Choose a maps app:", [
        {
          text: "Google Maps",
          onPress: () => Linking.openURL(urls.googleMaps),
        },
        {
          text: "Waze",
          onPress: () => Linking.openURL(urls.waze),
        },
        {
          text: "Apple Maps",
          onPress: () => Linking.openURL(urls.appleMaps),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]);
    } catch (error) {
      console.error("Error opening external app:", error);
      Alert.alert("Error", "Could not open maps app. Please try again.");
    }
  };

  const handleSuccessOk = () => {
    setSuccessVisible(false);
  };

  const getNearestCustomerInfo = ():
    | (Customer & { distance: number })
    | null => {
    if (!currentLocation) return null;

    let nearest: (Customer & { distance: number }) | null = null;
    let minDistance = Infinity;

    customers.forEach((customer) => {
      // Skip customers without coordinates or already delivered
      if (!customer.latitude || !customer.longitude) return;
      if (customer.status && customer.status.toLowerCase() === "delivered")
        return;

      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        customer.latitude,
        customer.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = { ...customer, distance };
      }
    });

    return nearest;
  };

  const nearestCustomer = getNearestCustomerInfo();

  // Pending-orders list removed (nearest-customer card handles status changes)

  const handleMarkDelivered = async (id: string) => {
    try {
      await updateCustomerStatus(id, "delivered");
      // refresh lists
      await loadCustomers();
      Alert.alert("Success", "Order marked as delivered");
    } catch (err: any) {
      console.error("Failed to update status", err);
      Alert.alert("Error", err?.message || "Failed to update status");
    }
  };

  const [searchQuery, setSearchQuery] = useState("");

  // Prepare filtered and sorted customers by distance (closest first)
  // Only show customers that are NOT delivered (case-insensitive), then apply search
  const filteredCustomers = customers.filter((c) => {
    if ((c.status || "").toLowerCase() === "delivered") return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      (c.deliveryPerson && c.deliveryPerson.toLowerCase().includes(q)) ||
      (c.orderDetails && c.orderDetails.toLowerCase().includes(q))
    );
  });

  const customersWithDistance = filteredCustomers.map((c) => {
    let distance = null;
    if (currentLocation && c.latitude && c.longitude) {
      distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        c.latitude,
        c.longitude
      );
    }
    return { ...c, distance };
  });

  const sortedCustomers = customersWithDistance.sort((a, b) => {
    // Customers with coordinates first, then by distance
    if (a.distance == null && b.distance == null) return 0;
    if (a.distance == null) return 1;
    if (b.distance == null) return -1;
    return a.distance - b.distance;
  });

  // Function to generate consistent avatar based on customer ID
  const getCustomerAvatar = (customer: Customer) => {
    const seed = customer._id || customer.name;
    return `https://picsum.photos/seed/${seed}/80/80`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ImageBackground
          source={{
            uri: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=3d0b7d7d2f1b4c0e3f0b7c8f6d5a9a12",
          }}
          style={styles.header}
          imageStyle={styles.headerImage}
        >
          <View style={styles.titleRow}>
            <Image
              source={{
                uri: "https://img.icons8.com/ios-filled/50/ffffff/marker.png",
              }}
              style={styles.titleImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>Smart way to reach customers</Text>
          </View>
          <Text style={styles.subtitle}>Get alerts when near customers</Text>
        </ImageBackground>

        {/* Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Location Status</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: locationPermission ? "#4CAF50" : "#f44336" },
              ]}
            />
            <Text style={styles.statusText}>
              {locationPermission ? "Location Active" : "Location Disabled"}
            </Text>
          </View>

          <Text style={styles.infoText}>
            📍 Your Location:{" "}
            {currentAddress
              ? currentAddress
              : formatCoordinates(currentLocation)}
          </Text>
          {currentLocation && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <Ionicons
                name="location-sharp"
                size={14}
                color="#999"
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.infoText, { fontSize: 12, color: "#999" }]}>
                {formatCoordinates(currentLocation)}
              </Text>
            </View>
          )}

          {locationLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Getting location...</Text>
            </View>
          )}
        </View>

        {/* Data Loading Status */}
        {loading && (
          <View style={styles.card}>
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading customers...</Text>
            </View>
          </View>
        )}

        {error && !loading && (
          <View style={styles.card}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadCustomers}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Nearest Customer Card - Only show if we have customers with coordinates */}
        {!loading &&
          !error &&
          customers.some(
            (c) =>
              c.latitude &&
              c.longitude &&
              (!c.status || c.status.toLowerCase() !== "delivered")
          ) && (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Nearest Customer</Text>
                {nearestCustomer ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => openDirectionsInApp(nearestCustomer)}
                    style={styles.customerCard}
                  >
                    <Text style={styles.customerName}>
                      {nearestCustomer.name}
                    </Text>
                    <Text style={styles.customerAddress}>
                      {nearestCustomer.address}
                    </Text>
                    {nearestCustomer.orderDetails && (
                      <Text style={styles.orderDetails}>
                        📦 {nearestCustomer.orderDetails}
                      </Text>
                    )}
                    {nearestCustomer.deliveryPerson && (
                      <Text style={styles.deliveryPerson}>
                        🚶 {nearestCustomer.deliveryPerson}
                      </Text>
                    )}
                    <Text
                      style={[
                        styles.distanceText,
                        {
                          color:
                            nearestCustomer.distance <= 100
                              ? "#4CAF50"
                              : "#FF9800",
                        },
                      ]}
                    >
                      📏 {nearestCustomer.distance}m away
                    </Text>
                    {nearestCustomer.distance <= 100 && (
                      <Text style={styles.nearbyText}>🎉 You're nearby!</Text>
                    )}
                    <View style={styles.directionsButtonRow}>
                      <View style={styles.directionsButtonInline}>
                        <Ionicons name="navigate" size={16} color="#007AFF" />
                        <Text style={styles.directionsButtonText}>
                          Open Directions
                        </Text>
                      </View>

                      <View style={{ flex: 1 }} />

                      <View style={{ alignItems: "flex-end" }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color:
                              (nearestCustomer.status || "").toLowerCase() ===
                              "delivered"
                                ? "#4CAF50"
                                : (
                                    nearestCustomer.status || ""
                                  ).toLowerCase() === "cancelled"
                                ? "#f44336"
                                : "#FF9800",
                            marginBottom: 6,
                          }}
                        >
                          {(nearestCustomer.status || "").toUpperCase()}
                        </Text>

                        {(nearestCustomer.status || "").toLowerCase() !==
                          "delivered" && (
                          <TouchableOpacity
                            style={[
                              styles.smallButton,
                              { backgroundColor: "#4CAF50" },
                            ]}
                            onPress={() =>
                              handleMarkDelivered(nearestCustomer._id)
                            }
                          >
                            <Text style={{ color: "#fff", fontWeight: "700" }}>
                              Mark Delivered
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.noDataText}>Calculating distance...</Text>
                )}
              </View>

              {/* Recent Pending Orders removed per request */}
            </>
          )}

        {/* All Customers Card */}
        {!loading && !error && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                All Customers ({sortedCustomers.length})
              </Text>
              <TouchableOpacity
                onPress={onRefresh}
                style={styles.refreshButton}
              >
                <Ionicons name="refresh" size={18} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={16}
                color="#999"
                style={{ marginRight: 8 }}
              />
              <TextInput
                placeholder="Search by name, address, or delivery person"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  style={{ paddingLeft: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {sortedCustomers.length === 0 ? (
              <Text style={styles.noDataText}>
                {searchQuery
                  ? "No customers found matching your search"
                  : "No customers available"}
              </Text>
            ) : (
              sortedCustomers.map((customer, index) => {
                const distance = customer.distance;
                const hasCoordinates = customer.latitude && customer.longitude;

                return (
                  <TouchableOpacity
                    key={customer._id}
                    activeOpacity={0.8}
                    onPress={() => openDirectionsInApp(customer)}
                    style={[
                      styles.customerItem,
                      index < sortedCustomers.length - 1 &&
                        styles.customerItemBorder,
                      !hasCoordinates && styles.customerItemDisabled,
                    ]}
                  >
                    <Image
                      source={{ uri: getCustomerAvatar(customer) }}
                      style={styles.customerThumb}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={styles.customerHeader}>
                        <Text style={styles.customerItemName}>
                          {customer.name}
                        </Text>
                        {distance != null && (
                          <Text
                            style={[
                              styles.customerDistance,
                              { color: distance <= 100 ? "#4CAF50" : "#666" },
                            ]}
                          >
                            {distance}m
                          </Text>
                        )}
                        {!hasCoordinates && (
                          <Text style={styles.noLocationText}>No GPS</Text>
                        )}
                      </View>
                      <Text style={styles.customerItemAddress}>
                        {customer.address}
                      </Text>
                      {customer.orderDetails && (
                        <Text style={styles.customerOrderDetails}>
                          {customer.orderDetails}
                        </Text>
                      )}
                      {customer.deliveryPerson && (
                        <Text style={styles.customerDeliveryPerson}>
                          Delivery: {customer.deliveryPerson}
                        </Text>
                      )}
                      <View style={styles.customerStatusRow}>
                        <Text
                          style={[
                            styles.customerStatus,
                            {
                              color:
                                (customer.status || "").toLowerCase() ===
                                "delivered"
                                  ? "#4CAF50"
                                  : (customer.status || "").toLowerCase() ===
                                    "cancelled"
                                  ? "#f44336"
                                  : "#FF9800",
                            },
                          ]}
                        >
                          {customer.status.toUpperCase()}
                        </Text>
                        {distance != null && distance <= 100 && (
                          <Text style={styles.withinRangeText}>
                            Within range! 🎯
                          </Text>
                        )}
                      </View>
                      {hasCoordinates && (
                        <View style={styles.directionsButtonSmall}>
                          <Ionicons name="navigate" size={14} color="#007AFF" />
                          <Text style={styles.directionsButtonTextSmall}>
                            Get Directions
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Location Popup Provider */}
      <LocationPopupProvider />

      {/* Success modal (flash) */}
      <Modal visible={successVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Success</Text>
            <Text style={styles.modalMessage}>{successText}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSuccessOk}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Maps Modal for In-App Directions */}
      <Modal
        visible={mapsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.mapsModalContainer}>
          <View style={styles.mapsModalHeader}>
            <Text style={styles.mapsModalTitle}>
              Directions to {selectedCustomer?.name}
            </Text>
            <TouchableOpacity
              onPress={() => setMapsVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.mapsModalContent}>
            <Text style={styles.mapsDescription}>
              Opening Google Maps with directions to:
            </Text>
            <Text style={styles.customerInfo}>{selectedCustomer?.name}</Text>
            <Text style={styles.modalCustomerAddress}>
              {selectedCustomer?.address}
            </Text>

            <View style={styles.mapsButtonsContainer}>
              <TouchableOpacity
                style={[styles.mapsButton, styles.primaryButton]}
                onPress={() => {
                  setMapsVisible(false);
                  openInAppBrowser(mapsUrl);
                }}
              >
                <Ionicons name="compass" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Open in App</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mapsButton, styles.secondaryButton]}
                onPress={() => {
                  setMapsVisible(false);
                  if (selectedCustomer) {
                    openInExternalApp(selectedCustomer);
                  }
                }}
              >
                <Ionicons name="navigate" size={20} color="#007AFF" />
                <Text style={styles.secondaryButtonText}>External App</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setMapsVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
    padding: 15,
    paddingTop: 20,
  },
  header: {
    backgroundColor: "#007AFF",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 5,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  refreshButton: {
    padding: 5,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  infoText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 5,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#007AFF",
  },
  errorText: {
    fontSize: 14,
    color: "#f44336",
    textAlign: "center",
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  customerCard: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  customerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  customerAddress: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  orderDetails: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    fontStyle: "italic",
  },
  deliveryPerson: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },
  nearbyText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
    fontStyle: "italic",
  },
  directionsButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    padding: 8,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  directionsButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  directionsButtonInline: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
  },
  directionsButtonText: {
    color: "#007AFF",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 12,
  },
  noDataText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
  customerItem: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  customerItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  customerItemDisabled: {
    opacity: 0.6,
  },
  customerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  customerItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  customerDistance: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
  },
  noLocationText: {
    fontSize: 10,
    color: "#999",
    fontStyle: "italic",
    marginLeft: 8,
  },
  customerItemAddress: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  customerOrderDetails: {
    fontSize: 11,
    color: "#888",
    fontStyle: "italic",
    marginBottom: 2,
  },
  customerDeliveryPerson: {
    fontSize: 11,
    color: "#666",
    marginBottom: 2,
  },
  customerStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  customerStatus: {
    fontSize: 10,
    fontWeight: "700",
  },
  withinRangeText: {
    fontSize: 10,
    color: "#4CAF50",
    fontWeight: "600",
  },
  directionsButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    alignSelf: "flex-start",
  },
  directionsButtonTextSmall: {
    color: "#007AFF",
    fontWeight: "600",
    marginLeft: 4,
    fontSize: 11,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  titleImage: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 12,
    width: "100%",
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 4,
    color: "#333",
  },
  headerImage: {
    borderRadius: 15,
    opacity: 0.95,
    height: 150,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#333",
  },
  modalMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 18,
  },
  modalButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 8,
    alignItems: "center",
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  customerThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  // Maps Modal Styles
  mapsModalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mapsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  mapsModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  mapsModalContent: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  mapsDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  customerInfo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  modalCustomerAddress: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
  },
  mapsButtonsContainer: {
    marginBottom: 20,
  },
  mapsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  secondaryButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    padding: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
});
