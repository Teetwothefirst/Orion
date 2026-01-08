import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const GIPHY_API_KEY = 'dc6zaTOxFJmzC'; // Public Beta Key

interface GifPickerProps {
    onSelect: (url: string) => void;
    onClose: () => void;
}

export default function GifPicker({ onSelect, onClose }: GifPickerProps) {
    const [search, setSearch] = useState('');
    const [gifs, setGifs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchGifs();
    }, [search]);

    const fetchGifs = async () => {
        setLoading(true);
        try {
            const endpoint = search.trim()
                ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(search)}&limit=20`
                : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20`;

            const response = await fetch(endpoint);
            const data = await response.json();
            setGifs(data.data || []);
        } catch (error) {
            console.error('Error fetching GIFs:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#666" />
                    <TextInput
                        style={styles.input}
                        placeholder="Search GIFs..."
                        placeholderTextColor="#666"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
            </View>

            {loading && gifs.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    data={gifs}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => onSelect(item.images.original.url)}
                            style={styles.gifItem}
                        >
                            <Image
                                source={{ uri: item.images.fixed_height_small.url }}
                                style={styles.gif}
                            />
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1E1E1E',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 40,
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        marginLeft: 8,
    },
    closeButton: {
        marginLeft: 10,
    },
    closeText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    list: {
        padding: 5,
    },
    gifItem: {
        flex: 0.5,
        aspectRatio: 1.5,
        margin: 5,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#333',
    },
    gif: {
        width: '100%',
        height: '100%',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
