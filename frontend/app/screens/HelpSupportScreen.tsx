import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function HelpSupportScreen() {
  const navigation = useNavigation();

  const openEmail = () => {
    Linking.openURL('mailto:support@pixfix.app?subject=Help Request');
  };

  const faqs = [
    {
      question: 'How does Pix-Fix work?',
      answer: 'Simply take a photo of your broken item, and our AI will analyze it and provide step-by-step repair instructions, tools needed, and safety tips.',
    },
    {
      question: 'Is Pix-Fix free?',
      answer: 'Pix-Fix offers a free tier with 3 repairs per day. For unlimited repairs and premium features, upgrade to Pro ($4.99/month) or Premium ($9.99/month).',
    },
    {
      question: 'What types of items can I repair?',
      answer: 'Pix-Fix can help with electronics, furniture, appliances, clothing, toys, and much more. Our AI is trained on thousands of repair scenarios.',
    },
    {
      question: 'How accurate are the repair instructions?',
      answer: 'Our AI provides highly accurate instructions based on extensive training data. However, always use your judgment and follow safety guidelines.',
    },
    {
      question: 'Can I share my repairs with others?',
      answer: 'Yes! Use the Community tab to share your successful repairs, photos, and tips with other users.',
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes, we offer a 30-day money-back guarantee for all subscriptions. Contact support@pixfix.app for refund requests.',
    },
    {
      question: 'How do I cancel my subscription?',
      answer: 'Go to Settings → Billing to manage or cancel your subscription. You can also cancel through your Apple ID or Google Play account.',
    },
    {
      question: 'Is my data safe?',
      answer: 'Yes! We take privacy seriously. Read our Privacy Policy for details on how we protect your data.',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Contact Support */}
        <View style={styles.contactCard}>
          <View style={styles.contactIconContainer}>
            <Ionicons name="chatbubbles" size={32} color="#00D9FF" />
          </View>
          <Text style={styles.contactTitle}>Need Help?</Text>
          <Text style={styles.contactSubtitle}>Our support team is here for you</Text>
          <TouchableOpacity style={styles.contactButton} onPress={openEmail}>
            <Ionicons name="mail" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>Email Support</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq, index) => (
          <View key={index} style={styles.faqCard}>
            <View style={styles.faqHeader}>
              <Ionicons name="help-circle" size={20} color="#00D9FF" />
              <Text style={styles.faqQuestion}>{faq.question}</Text>
            </View>
            <Text style={styles.faqAnswer}>{faq.answer}</Text>
          </View>
        ))}

        {/* Quick Links */}
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <TouchableOpacity style={styles.linkCard}>
          <View style={styles.linkContent}>
            <Ionicons name="document-text" size={24} color="#00D9FF" />
            <View style={styles.linkTextContainer}>
              <Text style={styles.linkTitle}>Getting Started Guide</Text>
              <Text style={styles.linkSubtitle}>Learn the basics</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkCard}>
          <View style={styles.linkContent}>
            <Ionicons name="play-circle" size={24} color="#00D9FF" />
            <View style={styles.linkTextContainer}>
              <Text style={styles.linkTitle}>Video Tutorials</Text>
              <Text style={styles.linkSubtitle}>Watch how-to videos</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkCard}>
          <View style={styles.linkContent}>
            <Ionicons name="chatbox-ellipses" size={24} color="#00D9FF" />
            <View style={styles.linkTextContainer}>
              <Text style={styles.linkTitle}>Community Forum</Text>
              <Text style={styles.linkSubtitle}>Ask questions and share tips</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Pix-Fix v1.0.0</Text>
          <Text style={styles.appInfoText}>© 2024 Pix-Fix. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  contactCard: {
    backgroundColor: '#1a1a1a',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  contactIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#002a33',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00D9FF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    marginTop: 8,
  },
  faqCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  faqAnswer: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    marginLeft: 32,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  linkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  linkTextContainer: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  linkSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});
