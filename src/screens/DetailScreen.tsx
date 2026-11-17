import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { colors } from '../theme';
import { MediaFile } from '../types';
import { fetchMoviePoster } from '../services/metadata/TMDBService';
import { MediaRepository } from '../database/repositories/mediaRepository';
import { parseFilename } from '../services/recognition/RulesEngine';
import { db } from '../database';

export const DetailScreen = ({ route, navigation }: any) => {
  const { file }: { file: MediaFile } = route.params;
  const [poster, setPoster] = useState<string | null>(file.posterUrl);
  const [loading, setLoading] = useState(!file.posterUrl);
  const [episodes, setEpisodes] = useState<MediaFile[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [progressList, setProgressList] = useState<any[]>([]);

  const parsed = parseFilename(file.filename);
  const cleanTitle = parsed.title;

  useEffect(() => {
    // 1. Fetch Poster
    if (!poster) {
      fetchMoviePoster(cleanTitle).then(async (url) => {
        if (url) {
          setPoster(url);
          await MediaRepository.updatePoster(file.id, url);
        }
        setLoading(false);
      });
    }

    // 2. Fetch Episodes if it's a Series/Anime
    if (file.category === 'Series' || file.category === 'Anime') {
      setLoadingEpisodes(true);
      MediaRepository.getAllFiles().then(allFiles => {
        const related = allFiles.filter(f => {
          if (f.category !== file.category) return false;
          const p = parseFilename(f.filename);
          return p.title.toLowerCase() === cleanTitle.toLowerCase();
        });
        
        // Sort by Season, then Episode
        related.sort((a, b) => {
          const pA = parseFilename(a.filename);
          const pB = parseFilename(b.filename);
          if (pA.seasonNumber !== pB.seasonNumber) return pA.seasonNumber - pB.seasonNumber;
          return pA.episodeNumber - pB.episodeNumber;
        });

        setEpisodes(related);
        setLoadingEpisodes(false);
      });
    }

    // 3. Fetch Progress for progress bars
    db.execute("SELECT file_id, position_ms, duration_ms FROM progress").then(res => {
      setProgressList(res.rows || []);
    }).catch(console.error);

  }, [cleanTitle, poster, file]);

  const playEpisode = (epFile: MediaFile) => {
    navigation.navigate('Player', { file: epFile });
  };

  const renderEpisode = ({ item }: { item: MediaFile }) => {
    const p = parseFilename(item.filename);
    
    // Calculate progress percentage
    const prog = progressList.find(prog => prog.file_id === item.id);
    const progPercent = (prog && prog.duration_ms > 0) ? (prog.position_ms / prog.duration_ms) * 100 : 0;

    return (
      <TouchableOpacity style={styles.episodeRow} onPress={() => playEpisode(item)}>
        <View style={styles.episodeThumb}>
          {progPercent > 0 && (
            <View style={{ position: 'absolute', bottom: 0, left: 0, height: 4, width: `${progPercent}%`, backgroundColor: colors.accent }} />
          )}
          <Text style={{ color: '#fff', fontSize: 20 }}>▶</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 16 }}>
            S{p.seasonNumber.toString().padStart(2, '0')}E{p.episodeNumber.toString().padStart(2, '0')}
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: 4 }} numberOfLines={1}>
            {item.filename}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header with Poster or Gradient */}
      <View style={styles.heroSection}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} />
        ) : poster ? (
          <Image source={{ uri: poster }} style={styles.posterImage} />
        ) : (
          <View style={styles.fallbackPoster}><Text style={styles.fallbackText}>{file.category?.substring(0,1)}</Text></View>
        )}
        
        {/* Back Button Overlay */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: '#fff', fontSize: 24 }}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{cleanTitle}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{file.category}</Text>
          <Text style={styles.metaText}> • </Text>
          <Text style={styles.metaText}>HD</Text>
        </View>

        <TouchableOpacity 
          style={styles.playButton}
          onPress={() => playEpisode(file)}
        >
          <Text style={styles.playButtonText}>▶ Play {episodes.length > 1 ? 'First Episode' : ''}</Text>
        </TouchableOpacity>

        <Text style={styles.description}>
          This is a local file organized by CINELIB. Metadata fetched from TMDB.
        </Text>

        {/* Episodes List for Series/Anime */}
        {(file.category === 'Series' || file.category === 'Anime') && (
          <View style={styles.episodeSection}>
            <Text style={styles.sectionTitle}>Episodes ({episodes.length})</Text>
            {loadingEpisodes ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <FlatList
                data={episodes}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderEpisode}
                scrollEnabled={false} // Let the main ScrollView handle scrolling
              />
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heroSection: { width: '100%', height: 400, backgroundColor: '#1a1a1f', justifyContent: 'center', alignItems: 'center' },
  posterImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  fallbackPoster: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#2b2b36' },
  fallbackText: { fontSize: 100, color: colors.textMuted, fontWeight: '900' },
  backBtn: { position: 'absolute', top: 50, left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  title: { color: colors.textPrimary, fontSize: 32, fontWeight: '900', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  metaText: { color: colors.textSecondary, fontSize: 14 },
  playButton: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginBottom: 24 },
  playButtonText: { color: colors.background, fontSize: 18, fontWeight: 'bold' },
  description: { color: colors.textSecondary, fontSize: 16, lineHeight: 24, marginBottom: 32 },
  
  episodeSection: { marginTop: 16 },
  sectionTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  episodeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: colors.surface, padding: 12, borderRadius: 8 },
  episodeThumb: { width: 120, height: 70, backgroundColor: '#2b2b36', borderRadius: 8, marginRight: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }
});