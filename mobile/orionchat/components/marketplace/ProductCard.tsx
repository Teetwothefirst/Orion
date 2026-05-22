import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProductCardProps {
    product: {
        id: number;
        name: string;
        price: number;
        unit: string;
        location: string;
        image_url?: string;
        vendor_name: string;
        category_name: string;
    };
    onPress?: () => void;
    onBuy?: () => void;
}

export default function ProductCard({ product, onPress, onBuy }: ProductCardProps) {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
            <Image 
                source={{ uri: product.image_url || 'https://via.placeholder.com/300x200?text=No+Image' }} 
                style={styles.image} 
                resizeMode="cover"
            />
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.category}>{product.category_name}</Text>
                    <Text style={styles.vendor}>By {product.vendor_name}</Text>
                </View>
                
                <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
                
                <View style={styles.priceRow}>
                    <Text style={styles.price}>₦{product.price.toLocaleString()}</Text>
                    <Text style={styles.unit}>per {product.unit}</Text>
                </View>
                
                <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color="#888" />
                    <Text style={styles.location}>{product.location}</Text>
                </View>
                
                <TouchableOpacity style={styles.buyButton} onPress={onBuy}>
                    <Text style={styles.buyButtonText}>Buy Now</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 240,
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
        marginVertical: 8,
    },
    image: {
        width: '100%',
        height: 120,
        backgroundColor: '#2A2A2A',
    },
    content: {
        padding: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    category: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#007AFF',
        textTransform: 'uppercase',
    },
    vendor: {
        fontSize: 10,
        color: '#888',
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
        marginBottom: 8,
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4ADE80',
    },
    unit: {
        fontSize: 12,
        color: '#888',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 12,
    },
    location: {
        fontSize: 12,
        color: '#888',
    },
    buyButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },
    buyButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    }
});
