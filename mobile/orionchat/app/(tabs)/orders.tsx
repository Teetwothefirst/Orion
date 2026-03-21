import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';

interface Order {
    id: number;
    buyer_id: number;
    vendor_id: number;
    total_amount: number;
    status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'disputed' | 'cancelled';
    escrow_status: 'held' | 'released' | 'refunded';
    payment_ref: string;
    created_at: string;
    vendor_name?: string;
    buyer_name?: string;
}

export default function OrdersScreen() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'buying' | 'selling'>('buying');

    const fetchOrders = useCallback(async () => {
        if (!user) return;
        try {
            const role = activeTab === 'buying' ? 'buyer' : 'vendor';
            const response = await api.get(`/marketplace/orders?role=${role}`);
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            Alert.alert('Error', 'Failed to fetch orders');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user, activeTab]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleUpdateStatus = async (orderId: number, newStatus: string) => {
        try {
            await api.post(`/marketplace/orders/${orderId}/status`, { status: newStatus });
            Alert.alert('Success', `Order marked as ${newStatus}`);
            fetchOrders();
        } catch (error) {
            console.error('Status update failed:', error);
            Alert.alert('Error', 'Failed to update order status');
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return styles.statusPending;
            case 'paid': return styles.statusPaid;
            case 'shipped': return styles.statusShipped;
            case 'delivered': return styles.statusDelivered;
            case 'cancelled': return styles.statusCancelled;
            default: return styles.statusPending;
        }
    };

    const renderOrderItem = ({ item }: { item: Order }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{item.id}</Text>
                <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                    <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.orderDetails}>
                <Text style={styles.partnerName}>
                    {activeTab === 'buying' ? `Vendor: ${item.vendor_name}` : `Buyer: ${item.buyer_name}`}
                </Text>
                <Text style={styles.amount}>₦{item.total_amount.toLocaleString()}</Text>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>

            <View style={styles.escrowBanner}>
                <Ionicons name="lock-closed" size={12} color="#4FC3F7" />
                <Text style={styles.escrowText}>
                    Escrow: {item.escrow_status === 'held' ? 'Funds Protected' : 'Funds Released'}
                </Text>
            </View>

            <View style={styles.actions}>
                {activeTab === 'selling' && item.status === 'paid' && (
                    <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: '#FFB300' }]}
                        onPress={() => handleUpdateStatus(item.id, 'shipped')}
                    >
                        <Text style={styles.actionButtonText}>Mark as Shipped</Text>
                    </TouchableOpacity>
                )}
                {activeTab === 'buying' && item.status === 'shipped' && (
                    <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: '#43A047' }]}
                        onPress={() => handleUpdateStatus(item.id, 'delivered')}
                    >
                        <Text style={styles.actionButtonText}>Confirm Delivery</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Marketplace Orders</Text>
            </View>

            <View style={styles.tabBar}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'buying' && styles.activeTab]}
                    onPress={() => setActiveTab('buying')}
                >
                    <Text style={[styles.tabText, activeTab === 'buying' && styles.activeTabText]}>Buying</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'selling' && styles.activeTab]}
                    onPress={() => setActiveTab('selling')}
                >
                    <Text style={[styles.tabText, activeTab === 'selling' && styles.activeTabText]}>Selling</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="cart-outline" size={64} color="#333" />
                            <Text style={styles.emptyText}>No orders found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginVertical: 15,
        gap: 10,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: '#1E1E1E',
    },
    activeTab: {
        backgroundColor: '#007AFF',
    },
    tabText: {
        color: '#888',
        fontWeight: '600',
    },
    activeTabText: {
        color: 'white',
    },
    list: {
        padding: 20,
        paddingBottom: 40,
    },
    orderCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderId: {
        color: '#8E8E93',
        fontSize: 14,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'white',
    },
    statusPending: { backgroundColor: '#8E8E93' },
    statusPaid: { backgroundColor: '#43A047' },
    statusShipped: { backgroundColor: '#FFB300' },
    statusDelivered: { backgroundColor: '#007AFF' },
    statusCancelled: { backgroundColor: '#D32F2F' },
    orderDetails: {
        marginBottom: 12,
    },
    partnerName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    amount: {
        color: '#4ADE80',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    date: {
        color: '#636366',
        fontSize: 12,
    },
    escrowBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0A1A2E',
        padding: 8,
        borderRadius: 8,
        gap: 6,
        marginBottom: 12,
    },
    escrowText: {
        color: '#4FC3F7',
        fontSize: 12,
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        color: '#636366',
        marginTop: 16,
        fontSize: 18,
    }
});
