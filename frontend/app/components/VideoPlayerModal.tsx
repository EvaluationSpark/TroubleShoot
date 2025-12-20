import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

interface VideoPlayerModalProps {
  visible: boolean;
  videoUrl: string;
  videoTitle: string;
  onClose: () => void;
}

export default function VideoPlayerModal({
  visible,
  videoUrl,
  videoTitle,
  onClose,
}: VideoPlayerModalProps) {
  const video = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setIsPlaying(status.isPlaying);
    }
  };

  const togglePlayPause = async () => {
    if (video.current) {
      if (isPlaying) {
        await video.current.pauseAsync();
      } else {
        await video.current.playAsync();
      }
    }
  };

  const handleClose = async () => {
    if (video.current) {
      await video.current.stopAsync();
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={2}>{videoTitle}</Text>
        </View>

        {/* Video Player */}
        <View style={styles.videoContainer}>
          {/* Note: For YouTube videos, we need to use WebView or extract direct video URL */}
          {/* This is a placeholder implementation using expo-av */}
          {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
            <View style={styles.youtubeNotice}>
              <Ionicons name="logo-youtube" size={64} color="#ff0000" />
              <Text style={styles.noticeTitle}>YouTube Video</Text>
              <Text style={styles.noticeText}>
                This video will open in YouTube app or browser
              </Text>
              <TouchableOpacity 
                style={styles.openButton}
                onPress={() => {
                  const Linking = require('react-native').Linking;
                  Linking.openURL(videoUrl);
                  handleClose();
                }}
              >
                <Ionicons name="open-outline" size={20} color="#fff" />
                <Text style={styles.openButtonText}>Open in YouTube</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Video
                ref={video}
                source={{ uri: videoUrl }}
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping={false}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              />
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#00D9FF" />
                </View>
              )}
            </>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.infoText}>
            Tap the screen to show video controls
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#1a1a1a',
  },
  closeButton: {
    marginRight: 16,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  youtubeNotice: {
    alignItems: 'center',
    padding: 40,
  },
  noticeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 24,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ff0000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  openButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});
