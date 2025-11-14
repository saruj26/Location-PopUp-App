import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Image,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getCustomers } from "../../services/api";
import { Ionicons } from "@expo/vector-icons";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [delivered, setDelivered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadDelivered = async () => {
    try {
      setError(null);
      setLoading(true);
      // fetch delivered customers, limited to recent 50
      const res = await getCustomers("status=delivered&limit=50");
      console.log("History: delivered response ->", res);
      if (res && res.success && Array.isArray(res.customers)) {
        setDelivered(res.customers);
      } else {
        console.warn("History: no customers in response", res);
        setDelivered([]);
      }
    } catch (err: any) {
      console.error("Failed to load delivered customers", err);
      setError(err?.message || "Failed to load delivered customers");
      setDelivered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDelivered();
  }, []);

  const openDetail = (id: string) => {
    // use typed navigation object to satisfy router typings
    router.push({ pathname: "/customer/[id]", params: { id } } as any);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDelivered();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return delivered;
    return delivered.filter((d) => {
      return (
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.address && d.address.toLowerCase().includes(q)) ||
        (d.orderDetails && d.orderDetails.toLowerCase().includes(q))
      );
    });
  }, [delivered, searchQuery]);

  if (loading) {
    return (
      <View style={[styles.center, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading delivery history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, styles.errorContainer]}>
        <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDelivered}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />

      {/* Enhanced TrackPoint Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerBackground} />
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
              }}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>TrackPoint</Text>
              <Text style={styles.headerSubtitle}>Delivery History</Text>
            </View>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{delivered.length}</Text>
              <Text style={styles.statLabel}>Delivered</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Search deliveries..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name={searchQuery ? "search-outline" : "checkmark-done-outline"}
              size={80}
              color="#e0e0e0"
            />
            <Text style={styles.emptyTitle}>
              {searchQuery ? "No results found" : "No deliveries yet"}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? "Try adjusting your search terms"
                : "Completed deliveries will appear here"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(i) => i._id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#007AFF"]}
                tintColor="#007AFF"
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.deliveryCard,
                  index === 0 && styles.firstCard,
                  index === filtered.length - 1 && styles.lastCard,
                ]}
                onPress={() => openDetail(item._id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{item.name}</Text>
                    <View style={styles.statusBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={12}
                        color="#4CAF50"
                      />
                      <Text style={styles.statusText}>Delivered</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#007AFF" />
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text style={styles.addressText} numberOfLines={2}>
                      {item.address}
                    </Text>
                  </View>

                  {item.orderDetails && (
                    <View style={styles.infoRow}>
                      <Ionicons name="cart-outline" size={16} color="#666" />
                      <Text style={styles.orderText} numberOfLines={1}>
                        {item.orderDetails}
                      </Text>
                    </View>
                  )}

                  {item.deliveryDate && (
                    <View style={styles.infoRow}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.dateText}>
                        {new Date(item.deliveryDate).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.deliveryIndicator}>
                    <View style={styles.deliveryDot} />
                    <Text style={styles.deliveryLabel}>
                      Successfully Delivered
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  errorContainer: {
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  // Header Styles
  header: {
    backgroundColor: "#007AFF",
    borderRadius: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#007AFF",
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    width: 32,
    height: 32,
    tintColor: "#fff",
  },
  titleContainer: {
    marginLeft: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  statNumber: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  statLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },

  // Content Styles
  content: {
    flex: 1,
    padding: 20,
  },
  searchSection: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    paddingVertical: 6,
  },
  clearButton: {
    padding: 2,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    lineHeight: 22,
  },

  // List Styles
  listContainer: {
    paddingBottom: 20,
  },
  deliveryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  firstCard: {
    marginTop: 4,
  },
  lastCard: {
    marginBottom: 0,
  },

  // Card Styles
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
    marginLeft: 4,
  },

  cardBody: {
    gap: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    fontWeight: "500",
  },
  orderText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  dateText: {
    fontSize: 13,
    color: "#888",
    fontWeight: "500",
  },

  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 16,
  },
  deliveryIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deliveryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  deliveryLabel: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
