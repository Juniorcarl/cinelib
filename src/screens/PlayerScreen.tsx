import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { colors } from '../theme';
import { MediaRepository } from '../database/repositories/mediaRepository';
import { MediaFile } from '../types';
import { parseFilename } from '../services/recognition/RulesEngine';

export const PlayerScreen = ({ route, navigation }: any) => {
  const { file } = route.params;
  const videoRef = useRef<VideoRef>(null);
  const [resizeMode, setResizeMode] = useState<'contain' | 'cover' | 'stretch'>('contain');
  
  // Next Episode State
  const [nextEpisode, setNextEpisode] = useState<MediaFile | null>(null);
  const [showEndCard, setShowEndCard] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Save progress every 10 seconds during playback
  const saveProgress = async (currentTime: number) => {
    await MediaRepository.saveProgress(file.id, currentTime * 1000, file.durationMs || 0);
  };

  // When video ends, calculate the next episode
  const handleVideoEnd = async () => {
    await MediaRepository.saveProgress(file.id, 0, file.durationMs || 0); // Reset progress
    
    if (file.category === 'Series' || file.category === 'Anime') {
      const allFiles = await MediaRepository.getAllFiles();
      const currentParsed = parseFilename(file.filename);
      
      const related = allFiles
        .filter(f => {
          const p = parseFilename(f.filename);
          return p.title.toLowerCase() === currentParsed.title.toLowerCase();
        })
        .sort((a, b) => {
          const pA = parseFilename(a.filename);
          const pB = parseFilename(b.filename);
          if (pA.seasonNumber !== pB.seasonNumber) return pA.seasonNumber - pB.seasonNumber;
          return pA.episodeNumber - pB.episodeNumber;
        });

      const currentIndex = related.findIndex(f => f.id === file.id);
      if (currentIndex >= 0 && currentIndex < related.length - 1) {
        setNextEpisode(related[currentIndex + 1]);
        setShowEndCard(true);
      } else {
        navigation.goBack(); 
      }
    } else {
      navigation.goBack(); 
    }
  };

  // Countdown timer for Next Episode
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (showEndCard && nextEpisode) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigation.replace('Player', { file: nextEpisode }); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [showEndCard, nextEpisode, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Video
        ref={videoRef}
        source={{ uri: `file://${file.path}` }}
        style={StyleSheet.absoluteFill}
        resizeMode={resizeMode}
        controls={!showEndCard}
        onEnd={handleVideoEnd}
        onProgress={(data) => {
          // Save progress every 10 seconds
          if (Math.floor(data.currentTime) % 10 === 0) {
            saveProgress(data.currentTime);
          }
        }}
      />
      
      {/* Top Overlay */}
      {!showEndCard && (
        <SafeAreaView style={styles.topOverlay}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: '#fff', fontSize: 24 }}>←</Text></TouchableOpacity>
            <Text style={{ color: '#fff', marginLeft: 16, fontSize: 16, flex: 1 }} numberOfLines={1}>{file.filename}</Text>
            <TouchableOpacity onPress={() => setResizeMode(resizeMode === 'contain' ? 'cover' : 'contain')}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{resizeMode.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* Next Episode Overlay */}
      {showEndCard && nextEpisode && (
        <View style={styles.endCardOverlay}>
          <Text style={styles.endCardTitle}>Up Next</Text>
          <Text style={styles.endCardSubtitle}>{nextEpisode.filename.replace(/\.[^/.]+$/, "")}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 16 }}>Playing in {countdown} seconds...</Text>
          
          <View style={{ flexDirection: 'row', marginTop: 24, gap: 16 }}>
            <TouchableOpacity 
              style={styles.playNowBtn}
              onPress={() => navigation.replace('Player', { file: nextEpisode })}
            >
              <Text style={{ color: colors.background, fontWeight: 'bold', fontSize: 16 }}>▶ Play Now</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  topBar: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  endCardOverlay: { 
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, 
    backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' 
  },
  endCardTitle: { color: colors.accent, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  endCardSubtitle: { color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center', paddingHorizontal: 20 },
  playNowBtn: { backgroundColor: colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  cancelBtn: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }
});