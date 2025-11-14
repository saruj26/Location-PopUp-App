import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { setFlash } from "../../services/flash";
import { createCustomer } from "../../services/api";

export default function AddCustomerScreen() {
  const router = useRouter();

  type CustomerForm = {
    name: string;
    address: string;
    latitude: string;
    longitude: string;
    orderDetails: string;
    deliveryPerson: string;
  };

  type CustomerPayload = {
    name: string;
    address: string;
    latitude?: number | null;
    longitude?: number | null;
    orderDetails?: string;
    deliveryPerson?: string;
  };

  const [formData, setFormData] = useState<CustomerForm>({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    orderDetails: "",
    deliveryPerson: "",
  });
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successText, setSuccessText] = useState("");
  const [lastCreated, setLastCreated] = useState<any | null>(null);

  const handleInputChange = (field: keyof CustomerForm, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    // Enhanced validation
    if (!formData.name.trim()) {
      Alert.alert("Validation Error", "Please provide customer name");
      return;
    }

    if (!formData.address.trim()) {
      Alert.alert("Validation Error", "Please provide address");
      return;
    }

    setLoading(true);

    try {
      const payload: CustomerPayload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        orderDetails: formData.orderDetails.trim() || undefined,
        deliveryPerson: formData.deliveryPerson.trim() || undefined,
      };

      // Handle latitude and longitude conversion
      if (formData.latitude.trim()) {
        const lat = parseFloat(formData.latitude);
        if (isNaN(lat) || lat < -90 || lat > 90) {
          Alert.alert(
            "Validation Error",
            "Latitude must be a valid number between -90 and 90"
          );
          setLoading(false);
          return;
        }
        payload.latitude = lat;
      }

      if (formData.longitude.trim()) {
        const lng = parseFloat(formData.longitude);
        if (isNaN(lng) || lng < -180 || lng > 180) {
          Alert.alert(
            "Validation Error",
            "Longitude must be a valid number between -180 and 180"
          );
          setLoading(false);
          return;
        }
        payload.longitude = lng;
      }

      console.log("Submitting payload:", payload);
      const result = await createCustomer(payload);
      // Set transient flash message and navigate to Home where it will be shown
      setFlash("Customer added successfully");
      router.push("/");
      // optionally store the created customer if needed
      // setLastCreated(result.customer || result);
    } catch (error: any) {
      console.error("Error adding customer:", error);

      let errorMessage = "Failed to add customer";

      if (error.message) {
        try {
          // Try to parse JSON error message from backend
          const errorData = JSON.parse(error.message);
          errorMessage = errorData.error || error.message;
        } catch {
          // If not JSON, use the message directly
          errorMessage = error.message;
        }
      }

      if (
        errorMessage.includes("Network request failed") ||
        errorMessage.includes("Failed to fetch")
      ) {
        errorMessage =
          "Network error: Cannot connect to server. Please check if the backend is running.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      latitude: "",
      longitude: "",
      orderDetails: "",
      deliveryPerson: "",
    });
  };

  const handleSuccessOk = () => {
    setSuccessVisible(false);
    router.back();
  };

  const handleSuccessAddAnother = () => {
    setSuccessVisible(false);
    resetForm();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add Customer / Today Order</Text>

      <Text style={styles.label}>Customer Name *</Text>
      <TextInput
        style={styles.input}
        value={formData.name}
        onChangeText={(value) => handleInputChange("name", value)}
        placeholder="Enter customer name"
        editable={!loading}
      />

      <Text style={styles.label}>Address *</Text>
      <TextInput
        style={styles.input}
        value={formData.address}
        onChangeText={(value) => handleInputChange("address", value)}
        placeholder="Enter full address"
        editable={!loading}
      />

      <Text style={styles.label}>Latitude (Optional)</Text>
      <TextInput
        style={styles.input}
        value={formData.latitude}
        onChangeText={(value) => handleInputChange("latitude", value)}
        placeholder="6.123456"
        keyboardType="numbers-and-punctuation"
        editable={!loading}
      />

      <Text style={styles.label}>Longitude (Optional)</Text>
      <TextInput
        style={styles.input}
        value={formData.longitude}
        onChangeText={(value) => handleInputChange("longitude", value)}
        placeholder="81.123456"
        keyboardType="numbers-and-punctuation"
        editable={!loading}
      />

      <Text style={styles.label}>Order Details (Optional)</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={formData.orderDetails}
        onChangeText={(value) => handleInputChange("orderDetails", value)}
        placeholder="e.g., 2 large pizzas, 1 coke"
        multiline
        numberOfLines={3}
        editable={!loading}
      />

      <Text style={styles.label}>Delivery Person (Optional)</Text>
      <TextInput
        style={styles.input}
        value={formData.deliveryPerson}
        onChangeText={(value) => handleInputChange("deliveryPerson", value)}
        placeholder="Enter delivery person name"
        editable={!loading}
      />

      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.buttonDisabled,
          (!formData.name.trim() || !formData.address.trim()) &&
            styles.buttonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={loading || !formData.name.trim() || !formData.address.trim()}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save Customer</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => router.back()}
        disabled={loading}
      >
        <Text style={styles.secondaryButtonText}>Cancel</Text>
      </TouchableOpacity>

      {/* Success modal */}
      <Modal visible={successVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Success</Text>
            <Text style={styles.modalMessage}>{successText}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleSuccessOk}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>OK</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={handleSuccessAddAnother}
              >
                <Text style={{ color: "#007AFF", fontWeight: "700" }}>
                  Add Another
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create<any>({
  container: {
    padding: 20,
    backgroundColor: "#f8f9fa",
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    color: "#333",
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    color: "#444",
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
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
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
  },
  modalButtonSecondary: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
