import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, ActivityIndicator, ScrollView, SafeAreaView, Modal, Pressable, TextInput, Switch } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer, useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, layout } from '../../theme';
import { injectMockData } from '../../services/scanner/MockData';
import { MediaRepository } from '../../database/repositories/mediaRepository';
import { MediaFile } from '../../types';
import { PlayerScreen } from '../../screens/PlayerScreen';
import { DetailScreen } from '../../screens/DetailScreen';

// --- HOME SCREEN ---
const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const [isScanning, setIsScanning] = useState(false);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadFiles(); }, []));

  const loadFiles = async () => {
    setLoading(true);
    try {
      const dbFiles = await MediaRepository.getAllFiles();
      setFiles(dbFiles);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleMock = async () => {
    setIsScanning(true);
    try {
      await injectMockData();
      await loadFiles();
    } catch (error: any) { Alert.alert('Error', error?.message); } finally { setIsScanning(false); }
  };

  const featuredItem = files[0];
  const continueWatching = files.slice(0, 4);
  const recentlyAdded = files.slice(0, 6);

  const renderHorizontalCard = ({ item }: { item: MediaFile }) => (
    <TouchableOpacity 
      style={styles.hCard}
      onPress={() => navigation.navigate('Detail', { file: item })}
    >
      <View style={[styles.hPoster, { backgroundColor: item.category === 'Movie' ? '#2b2b36' : '#1e2a38' }]}>
        <Text style={styles.posterText}>{item.category?.substring(0, 1) || '?'}</Text>
        <View style={{ position: 'absolute', bottom: 0, left: 0, height: 4, width: '40%', backgroundColor: colors.accent }} />
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.filename.replace(/\.[^/.]+$/, "")}</Text>
      <Text style={styles.cardSubtitle}>{item.category || 'Unknown'}</Text>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator color={colors.accent} size="large" style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.mockBtn} onPress={handleMock} disabled={isScanning}>
          <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>{isScanning ? 'Loading...' : 'Load MOCK Data'}</Text>
        </TouchableOpacity>
      </View>

      {featuredItem && (
        <View style={styles.banner}>
          <Text style={styles.bannerFeatured}>FEATURED • {featuredItem.category?.toUpperCase()}</Text>
          <Text style={styles.bannerTitle}>{featuredItem.filename.replace(/\.[^/.]+$/, "")}</Text>
          <Text style={styles.bannerSubtitle}>Season 1 • Play from beginning</Text>
          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            <TouchableOpacity 
              style={styles.playBtn}
              onPress={() => navigation.navigate('Detail', { file: featuredItem })}
            >
              <Text style={{ color: colors.background, fontWeight: 'bold' }}>▶ Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.favBtn}><Text style={{ color: colors.textPrimary }}>Add to Favourites</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {continueWatching.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continue Watching</Text>
          <FlatList horizontal showsHorizontalScrollIndicator={false} data={continueWatching} keyExtractor={(item) => 'cw-' + item.id} renderItem={renderHorizontalCard} />
        </View>
      )}
      {recentlyAdded.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recently Added</Text>
          <FlatList horizontal showsHorizontalScrollIndicator={false} data={recentlyAdded} keyExtractor={(item) => 'ra-' + item.id} renderItem={renderHorizontalCard} />
        </View>
      )}
    </ScrollView>
  );
};

// --- REUSABLE GRID SCREEN ---
const GridScreen = ({ category }: { category: string }) => {
  const navigation = useNavigation<any>();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const all = await MediaRepository.getAllFiles();
        setFiles(category === 'All' ? all : all.filter(f => f.category === category));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetch();
  }, [category]));

  const renderGridItem = ({ item }: { item: MediaFile }) => (
    <TouchableOpacity 
      style={styles.gridCard}
      onPress={() => navigation.navigate('Detail', { file: item })}
    >
      <View style={[styles.gridPoster, { backgroundColor: item.category === 'Movie' ? '#2b2b36' : '#1e2a38' }]}>
        <Text style={styles.posterText}>{item.category?.substring(0, 1) || '?'}</Text>
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.filename.replace(/\.[^/.]+$/, "")}</Text>
      <Text style={styles.cardSubtitle}>1 season • 8 eps</Text>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator color={colors.accent} size="large" style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.gridHeader}>
        <Text style={styles.gridTitle}>{category.toUpperCase()}</Text>
        <Text style={styles.gridSubtitle}>{files.length} items</Text>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 50, marginBottom: 16 }} contentContainerStyle={{ paddingHorizontal: 16 }}>
        <View style={styles.filterPillActive}><Text style={{ color: colors.background, fontWeight: 'bold' }}>All</Text></View>
        <View style={styles.filterPill}><Text style={{ color: colors.textPrimary }}>Recently added</Text></View>
        <View style={styles.filterPill}><Text style={{ color: colors.textPrimary }}>In progress</Text></View>
      </ScrollView>

      <FlatList
        data={files}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderGridItem}
        numColumns={3}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
      />
    </View>
  );
};

// --- SEARCH SCREEN ---
const SearchScreen = () => {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [results, setResults] = useState<MediaFile[]>([]);

  useFocusEffect(useCallback(() => {
    MediaRepository.getAllFiles().then(setFiles);
  }, []));

  const handleSearch = (text: string) => {
    setQuery(text);
    if (text.length < 2) return setResults([]);
    const filtered = files.filter(f => f.filename.toLowerCase().includes(text.toLowerCase()));
    setResults(filtered);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search your library..."
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={handleSearch}
        autoFocus
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.searchResultRow}
            onPress={() => navigation.navigate('Detail', { file: item })}
          >
            <View style={{ width: 60, height: 90, backgroundColor: '#2b2b36', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted }}>{item.category?.substring(0, 1)}</Text>
            </View>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 16 }}>{item.filename.replace(/\.[^/.]+$/, "")}</Text>
              <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{item.category || 'Unknown'}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

// --- SETTINGS SCREEN ---
const SettingsScreen = () => {
  const [reviewFiles, setReviewFiles] = useState<MediaFile[]>([]);
  const [fetchMetadata, setFetchMetadata] = useState(true);

  useFocusEffect(useCallback(() => {
    const fetchReview = async () => {
      const files = await MediaRepository.getNeedsReviewFiles();
      setReviewFiles(files);
    };
    fetchReview();
  }, []));

  const handleConfirm = async (id: number, category: string) => {
    await MediaRepository.confirmFile(id, category, null);
    const files = await MediaRepository.getNeedsReviewFiles();
    setReviewFiles(files);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.sectionTitle}>App Settings</Text>
      
      <View style={styles.settingRow}>
        <View>
          <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Fetch Artwork & Info</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Uses TMDB/AniList (Requires Internet)</Text>
        </View>
        <Switch 
          value={fetchMetadata} 
          onValueChange={setFetchMetadata} 
          trackColor={{ false: colors.border, true: colors.accentMuted }}
          thumbColor={fetchMetadata ? colors.accent : colors.textMuted}
        />
      </View>

      <View style={styles.settingRow}>
        <View>
          <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Video Player</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Standard Android Decoders</Text>
        </View>
      </View>
      
      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Needs Review ({reviewFiles.length})</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>The recognition engine was unsure about these. Confirm them below.</Text>
      
      {reviewFiles.map(file => (
        <View key={file.id} style={styles.reviewCard}>
          <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }} numberOfLines={1}>{file.filename}</Text>
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
            <TouchableOpacity style={styles.reviewBtn} onPress={() => handleConfirm(file.id, 'Movie')}><Text style={{ color: colors.background }}>Movie</Text></TouchableOpacity>
            <TouchableOpacity style={styles.reviewBtn} onPress={() => handleConfirm(file.id, 'Series')}><Text style={{ color: colors.background }}>Series</Text></TouchableOpacity>
            <TouchableOpacity style={styles.reviewBtn} onPress={() => handleConfirm(file.id, 'Anime')}><Text style={{ color: colors.background }}>Anime</Text></TouchableOpacity>
            <TouchableOpacity style={styles.reviewBtn} onPress={() => handleConfirm(file.id, 'Documentary')}><Text style={{ color: colors.background }}>Doc</Text></TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

// --- NAVIGATION SETUP ---
const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ backgroundColor: colors.background }}>
      <View style={styles.drawerHeader}><Text style={styles.logo}>CINELIB</Text></View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

const DrawerNavigator = () => {
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        header: () => (
          <SafeAreaView style={{ backgroundColor: colors.background, paddingTop: 20 }}>
            <View style={styles.customHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ padding: 8 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 24 }}>☰</Text>
                </TouchableOpacity>
                <Text style={{ color: colors.accent, fontWeight: '900', fontSize: 20, letterSpacing: 1, marginLeft: 8 }}>CINELIB</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity style={{ marginRight: 16 }} onPress={() => navigation.navigate('Search')}>
                  <Text style={{ color: colors.textPrimary, fontSize: 20 }}>🔍</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.profileBtn} onPress={() => setProfileMenuVisible(true)}>
                  <Text style={{ color: colors.accent, fontWeight: 'bold' }}>U</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Modal visible={profileMenuVisible} transparent={true} animationType="fade" onRequestClose={() => setProfileMenuVisible(false)}>
              <Pressable style={styles.modalOverlay} onPress={() => setProfileMenuVisible(false)}>
                <View style={styles.dropdownMenu}>
                  <View style={styles.dropdownHeader}>
                    <Text style={styles.dropdownTitle}>My CINELIB</Text>
                    <Text style={styles.dropdownSubtitle}>On this phone only</Text>
                  </View>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => { setProfileMenuVisible(false); navigation.navigate('Settings'); }}>
                    <Text style={{ color: colors.textPrimary }}>⚙️ Settings</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => { setProfileMenuVisible(false); Alert.alert("Rescanning", "Triggering scan..."); }}>
                    <Text style={{ color: colors.textPrimary }}>🔄 Rescan library</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>
          </SafeAreaView>
        ),
        drawerStyle: { backgroundColor: colors.surface, width: layout.sidebarExpandedWidth },
        drawerActiveTintColor: colors.accent,
        drawerInactiveTintColor: colors.textSecondary,
      })}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Series" component={() => <GridScreen category="Series" />} />
      <Drawer.Screen name="Anime" component={() => <GridScreen category="Anime" />} />
      <Drawer.Screen name="Movies" component={() => <GridScreen category="Movie" />} />
      <Drawer.Screen name="Documentaries" component={() => <GridScreen category="Documentary" />} />
      <Drawer.Screen name="Search" component={SearchScreen} options={{ drawerLabel: () => null, drawerItemStyle: { height: 0 } }} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={DrawerNavigator} />
        <Stack.Screen name="Detail" component={DetailScreen} />
        <Stack.Screen 
          name="Player" 
          component={PlayerScreen} 
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  text: { color: colors.textPrimary, fontSize: 16, textAlign: 'center' },
  drawerHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  logo: { color: colors.accent, fontSize: 24, fontWeight: 'bold', letterSpacing: 2 },
  
  customHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.background },
  profileBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: colors.accent, justifyContent: 'center', alignItems: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start', alignItems: 'flex-end' },
  dropdownMenu: { marginTop: 80, marginRight: 16, backgroundColor: colors.surfaceElevated, borderRadius: 8, width: 200, borderWidth: 1, borderColor: colors.border, elevation: 5 },
  dropdownHeader: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  dropdownTitle: { color: colors.textPrimary, fontWeight: 'bold', fontSize: 14 },
  dropdownSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  dropdownItem: { padding: 12, flexDirection: 'row', alignItems: 'center' },

  actionRow: { paddingHorizontal: 16, paddingTop: 16 },
  mockBtn: { backgroundColor: colors.surfaceElevated, padding: 10, borderRadius: 8, alignItems: 'center' },
  banner: { margin: 16, padding: 20, backgroundColor: '#3a1e14', borderRadius: 12, borderWidth: 1, borderColor: '#5a2a1a' },
  bannerFeatured: { color: colors.accent, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  bannerTitle: { color: colors.textPrimary, fontSize: 28, fontWeight: '900', marginBottom: 4 },
  bannerSubtitle: { color: colors.textSecondary, fontSize: 14 },
  playBtn: { backgroundColor: colors.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginRight: 12 },
  favBtn: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  section: { marginTop: 24 },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginLeft: 16, marginBottom: 12 },
  
  hCard: { width: 160, marginLeft: 16 },
  hPoster: { width: '100%', aspectRatio: 16/9, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8, overflow: 'hidden' },
  posterText: { fontSize: 32, color: colors.textMuted, fontWeight: 'bold' },
  cardTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  cardSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },

  gridHeader: { padding: 16, paddingBottom: 8 },
  gridTitle: { color: colors.textPrimary, fontSize: 32, fontWeight: '900' },
  gridSubtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  filterPillActive: { backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, justifyContent: 'center' },
  filterPill: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, justifyContent: 'center' },
  gridCard: { width: '30%', marginBottom: 20 },
  gridPoster: { width: '100%', aspectRatio: 2/3, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },

  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  reviewCard: { backgroundColor: colors.surface, padding: 16, borderRadius: 8, marginBottom: 12 },
  reviewBtn: { backgroundColor: colors.accentMuted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  
  searchInput: { backgroundColor: colors.surfaceElevated, color: colors.textPrimary, padding: 16, borderRadius: 8, fontSize: 16, marginBottom: 16 },
  searchResultRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }
});