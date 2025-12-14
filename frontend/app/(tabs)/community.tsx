import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ReportModal from '../components/ReportModal';
import CommunityGuidelinesModal from '../components/CommunityGuidelinesModal';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function CommunityScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // PR #6: Community Moderation
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string>('');
  const [showGuidelines, setShowGuidelines] = useState(false);

  // Create post state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [itemType, setItemType] = useState('');
  const [tips, setTips] = useState('');
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/community/posts`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const pickImage = async (type: 'before' | 'after') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        if (type === 'before') {
          setBeforeImage(result.assets[0].base64);
        } else {
          setAfterImage(result.assets[0].base64);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const createPost = async () => {
    if (!title || !description || !itemType || !beforeImage) {
      Alert.alert('Missing Info', 'Please fill in all required fields and add a before image');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/community/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          item_type: itemType,
          before_image: beforeImage,
          after_image: afterImage,
          repair_steps_used: description.split('.').filter(s => s.trim()),
          tips,
          user_name: 'Anonymous',
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Your repair story has been shared!');
        setShowCreateModal(false);
        resetForm();
        fetchPosts();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to share your repair');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setItemType('');
    setTips('');
    setBeforeImage(null);
    setAfterImage(null);
  };

  const likePost = async (postId: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/community/like/${postId}`, {
        method: 'POST',
      });
      // Update local state
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D9FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D9FF" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Community Repairs</Text>
            <Text style={styles.headerSubtitle}>Share your success stories and inspire others!</Text>
          </View>
          {/* PR #6: Guidelines Button */}
          <TouchableOpacity 
            style={styles.guidelinesButton} 
            onPress={() => setShowGuidelines(true)}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color="#00D9FF" />
          </TouchableOpacity>
        </View>

        {/* Create Post Button */}
        <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.createButtonText}>Share Your Repair</Text>
        </TouchableOpacity>

        {/* Posts */}
        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#555" />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share your repair!</Text>
          </View>
        ) : (
          posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              {/* Post Header */}
              <View style={styles.postHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={24} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.userName}>{post.user_name}</Text>
                    <Text style={styles.postDate}>
                      {new Date(post.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.itemTypeBadge}>
                  <Text style={styles.itemTypeText}>{post.item_type}</Text>
                </View>
              </View>

              {/* Post Title */}
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postDescription}>{post.description}</Text>

              {/* Images */}
              <View style={styles.imagesContainer}>
                {post.before_image && (
                  <View style={styles.imageWrapper}>
                    <Text style={styles.imageLabel}>Before</Text>
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${post.before_image}` }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
                {post.after_image && (
                  <View style={styles.imageWrapper}>
                    <Text style={styles.imageLabel}>After</Text>
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${post.after_image}` }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
              </View>

              {/* Tips */}
              {post.tips && (
                <View style={styles.tipsContainer}>
                  <Ionicons name="bulb" size={16} color="#fbbf24" />
                  <Text style={styles.tipsText}>{post.tips}</Text>
                </View>
              )}

              {/* Post Actions */}
              <View style={styles.postActions}>
                <TouchableOpacity style={styles.likeButton} onPress={() => likePost(post.id)}>
                  <Ionicons name="heart" size={20} color="#f87171" />
                  <Text style={styles.likeCount}>{post.likes}</Text>
                </TouchableOpacity>
                
                {/* PR #6: Report Button */}
                <TouchableOpacity 
                  style={styles.reportButton} 
                  onPress={() => {
                    setReportingPostId(post.id);
                    setShowReportModal(true);
                  }}
                >
                  <Ionicons name="flag-outline" size={20} color="#6b7280" />
                  <Text style={styles.reportText}>Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Post Modal */}
      <Modal visible={showCreateModal} animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Share Your Repair</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Title *"
              placeholderTextColor="#666"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={styles.input}
              placeholder="Item Type (e.g., Smartphone, Chair) *"
              placeholderTextColor="#666"
              value={itemType}
              onChangeText={setItemType}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your repair process *"
              placeholderTextColor="#666"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tips for others (optional)"
              placeholderTextColor="#666"
              value={tips}
              onChangeText={setTips}
              multiline
              numberOfLines={3}
            />

            {/* Image Pickers */}
            <View style={styles.imagePickerSection}>
              <Text style={styles.sectionLabel}>Before Image *</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('before')}>
                {beforeImage ? (
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${beforeImage}` }}
                    style={styles.pickedImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <Ionicons name="image" size={32} color="#666" />
                    <Text style={styles.imagePickerText}>Select Before Image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.imagePickerSection}>
              <Text style={styles.sectionLabel}>After Image (optional)</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('after')}>
                {afterImage ? (
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${afterImage}` }}
                    style={styles.pickedImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <Ionicons name="image" size={32} color="#666" />
                    <Text style={styles.imagePickerText}>Select After Image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.disabledButton]}
              onPress={createPost}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Share Repair</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* PR #6: Report Modal */}
      <ReportModal
        visible={showReportModal}
        postId={reportingPostId}
        onClose={() => {
          setShowReportModal(false);
          setReportingPostId('');
        }}
        onReportSubmitted={() => {
          // Optionally refresh posts or show a success indicator
          fetchPosts();
        }}
      />

      {/* PR #6: Community Guidelines Modal */}
      <CommunityGuidelinesModal
        visible={showGuidelines}
        onClose={() => setShowGuidelines(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  createButton: {
    backgroundColor: '#00D9FF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  postCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  postDate: {
    color: '#666',
    fontSize: 12,
  },
  itemTypeBadge: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  itemTypeText: {
    color: '#00D9FF',
    fontSize: 12,
    fontWeight: '600',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  postDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  imageWrapper: {
    flex: 1,
  },
  imageLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  postImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  tipsContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#2a2a00',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  tipsText: {
    flex: 1,
    color: '#fbbf24',
    fontSize: 13,
    lineHeight: 18,
  },
  postActions: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeCount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imagePickerSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  imagePicker: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  pickedImage: {
    width: '100%',
    height: '100%',
  },
  submitButton: {
    backgroundColor: '#00D9FF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
