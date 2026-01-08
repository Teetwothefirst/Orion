import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, Dimensions, ActivityIndicator, SectionList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';

const { width } = Dimensions.get('window');
const GIPHY_API_KEY = 'dc6zaTOxFJmzC'; // Public Beta Key

interface MediaPickerProps {
    onSelect: (url: string, type: 'gif' | 'sticker') => void;
    onClose: () => void;
}

export default function MediaPicker({ onSelect, onClose }: MediaPickerProps) {
    const [tab, setTab] = useState<'gif' | 'sticker'>('gif');
    const [search, setSearch] = useState('');
    const [gifs, setGifs] = useState<any[]>([]);
    const [stickerPacks, setStickerPacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (tab === 'gif') {
            fetchGifs();
        } else {
            fetchStickers();
        }
    }, [tab, search]);

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

    const fetchStickers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/chats/stickers');
            setStickerPacks(response.data.packs || []);
        } catch (error) {
            console.error('Error fetching stickers:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderGifItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => onSelect(item.images.original.url, 'gif')}
            style={styles.gifItem}
        >
            <Image
                source={{ uri: item.images.fixed_height_small.url }}
                style={styles.gif}
            />
        </TouchableOpacity>
    );

    const renderStickerItem = ({ item }: { item: any }) => (
        <View style={styles.stickerPack}>
            <Text style={styles.stickerPackTitle}>{item.name}</Text>
            <FlatList
                data={item.stickers}
                keyExtractor={(s) => s.id}
                numColumns={4}
                renderItem={({ item: sticker }) => (
                    <TouchableOpacity
                        onPress={() => onSelect(sticker.url, 'sticker')}
                        style={styles.stickerItem}
                    >
                        <Image
                            source={{ uri: sticker.url }}
                            style={styles.sticker}
                        />
                    </TouchableOpacity>
                )}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.tabs}>
                    <TouchableOpacity
                        onPress={() => setTab('gif')}
                        style={[styles.tab, tab === 'gif' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, tab === 'gif' && styles.activeTabText]}>GIFs</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setTab('sticker')}
                        style={[styles.tab, tab === 'sticker' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, tab === 'sticker' && styles.activeTabText]}>Stickers</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {tab === 'gif' && (
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="#999" />
                        <TextInput
                            style={styles.input}
                            placeholder="Search GIFs..."
                            placeholderTextColor="#999"
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                </View>
            )}

            {loading && tab === 'gif' && gifs.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                tab === 'gif' ? (
                    <FlatList
                        data={gifs}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        renderItem={renderGifItem}
                        contentContainerStyle={styles.list}
                    />
                ) : (
                    <FlatList
                        data={stickerPacks}
                        keyExtractor={(item) => item.id}
                        renderItem={renderStickerItem}
                        contentContainerStyle={styles.list}
                    />
                )
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
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 5,
    },
    tabs: {
        flexDirection: 'row',
        gap: 20,
    },
    tab: {
        paddingVertical: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#007AFF',
    },
    tabText: {
        color: '#999',
        fontSize: 16,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#007AFF',
    },
    closeButton: {
        padding: 5,
    },
    searchContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        marginLeft: 8,
    },
    list: {
        padding: 10,
    },
    gifItem: {
        flex: 0.5,
        aspectRatio: 1.5,
        margin: 5,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#333',
    },
    gif: {
        width: '100%',
        height: '100%',
    },
    stickerPack: {
        marginBottom: 20,
    },
    stickerPackTitle: {
        color: '#999',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 10,
        marginLeft: 5,
    },
    stickerItem: {
        flex: 0.25,
        aspectRatio: 1,
        margin: 5,
        borderRadius: 8,
        overflow: 'hidden',
    },
    sticker: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
