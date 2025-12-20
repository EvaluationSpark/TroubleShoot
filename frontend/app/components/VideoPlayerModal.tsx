import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

interface VideoPlayerModalProps {
  visible: boolean;
  videoUrl: string;
  videoTitle: string;
  videoId?: string;
  onClose: () => void;
}

export default function VideoPlayerModal({
  visible,
  videoUrl,
  videoTitle,
  videoId,
  onClose,
}: VideoPlayerModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Extract video ID from URL if not provided
  const getVideoId = (): string | null => {
    if (videoId) return videoId;
    
    // Extract from youtube.com/watch?v=
    const watchMatch = videoUrl.match(/[?&]v=([^&]+)/);
    if (watchMatch) return watchMatch[1];
    
    // Extract from youtu.be/
    const shortMatch = videoUrl.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) return shortMatch[1];
    
    // Extract from youtube.com/embed/
    const embedMatch = videoUrl.match(/embed\/([^?]+)/);
    if (embedMatch) return embedMatch[1];
    
    return null;
  };

  const ytVideoId = getVideoId();

  // Create embedded YouTube player HTML
  const getEmbedHtml = () => {
    if (!ytVideoId) return null;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              background: #000; 
              display: flex; 
              justify-content: center; 
              align-items: center;
              min-height: 100vh;
            }
            .video-container {
              position: relative;
              width: 100%;
              padding-bottom: 56.25%;
            }
            iframe {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              border: none;
            }
          </style>
        </head>
        <body>
          <div class="video-container">
            <iframe 
              src="https://www.youtube.com/embed/${ytVideoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
        </body>
      </html>
    `;
  };

  const embedHtml = getEmbedHtml();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={2}>{videoTitle}</Text>
        </View>

        {/* Video Player */}
        <View style={styles.videoContainer}>
          {embedHtml ? (
            <>
              <WebView
                source={{ html: embedHtml }}
                style={styles.webview}
                allowsFullscreenVideo
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
              />
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#ff0000" />
                  <Text style={styles.loadingText}>Loading video...</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={64} color="#ff4444" />
              <Text style={styles.errorTitle}>Video Unavailable</Text>
              <Text style={styles.errorText}>
                Could not load this video. The link may be invalid.
              </Text>
            </View>
          )}
        </View>

        {/* Info Bar */}
        <View style={styles.infoBar}>
          <View style={styles.youtubeTag}>
            <Ionicons name="logo-youtube" size={20} color="#ff0000" />
            <Text style={styles.youtubeText}>YouTube</Text>
          </View>
          <Text style={styles.infoText}>
            Playing in embedded player
          </Text>
        </View>
      </SafeAreaView>
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
    backgroundColor: '#1a1a1a',
  },
  closeButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#aaa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  youtubeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  youtubeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
  },
});
