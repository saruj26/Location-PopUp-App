import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getCustomer } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerDetail() {
  const params = useLocalSearchParams();
  const id = params.id as string | undefined;
  const router = useRouter();
  const [customer, setCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!id) {
      setError('Missing customer id');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await getCustomer(id);
      if (res && res.success && res.customer) {
        setCustomer(res.customer);
      } else {
        setError(res?.error || 'Customer not found');
      }
    } catch (err: any) {
      console.error('Failed to fetch customer', err);
      setError(err?.message || 'Failed to fetch customer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !customer) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'Customer not found'}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
        <Ionicons name="chevron-back" size={24} color="#333" />
      </TouchableOpacity>

      <Text style={styles.name}>{customer.name}</Text>
      <Text style={styles.status}>Status: {customer.status?.toUpperCase()}</Text>
      <Text style={styles.address}>{customer.address}</Text>

      {customer.latitude && customer.longitude ? (
        <Text style={styles.coords}>Coordinates: {customer.latitude.toFixed(6)}, {customer.longitude.toFixed(6)}</Text>
      ) : (
        <Text style={styles.coords}>Coordinates: N/A</Text>
      )}

      {customer.orderDetails ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <Text style={styles.sectionText}>{customer.orderDetails}</Text>
        </View>
      ) : null}

      {customer.deliveryPerson ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Person</Text>
          <Text style={styles.sectionText}>{customer.deliveryPerson}</Text>
        </View>
      ) : null}

      {customer.deliveryDate ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Date</Text>
          <Text style={styles.sectionText}>{new Date(customer.deliveryDate).toLocaleString()}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Close</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 20, fontWeight: '700', marginBottom: 6, color: '#222' },
  status: { fontSize: 13, color: '#007AFF', fontWeight: '700', marginBottom: 8 },
  address: { fontSize: 14, color: '#666', marginBottom: 8 },
  coords: { fontSize: 12, color: '#888', marginBottom: 12 },
  section: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  sectionText: { fontSize: 13, color: '#444' },
  button: { marginTop: 12, backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  error: { color: '#f44336' },
});
