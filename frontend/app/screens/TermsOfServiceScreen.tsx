import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function TermsOfServiceScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.lastUpdated}>Last Updated: December 10, 2024</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing and using Pix-Fix ("the App"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these Terms of Service, please do not use the App.
        </Text>

        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.paragraph}>
          Pix-Fix is an AI-powered mobile application that provides repair instructions, diagnostics, and guidance for broken items. The service includes:
        </Text>
        <Text style={styles.bulletPoint}>• AI-powered image analysis and repair diagnostics</Text>
        <Text style={styles.bulletPoint}>• Step-by-step repair instructions</Text>
        <Text style={styles.bulletPoint}>• Community forum for sharing repair experiences</Text>
        <Text style={styles.bulletPoint}>• Local vendor search and recommendations</Text>
        <Text style={styles.bulletPoint}>• Progress tracking and session management</Text>

        <Text style={styles.sectionTitle}>3. User Accounts and Subscriptions</Text>
        <Text style={styles.paragraph}>
          Pix-Fix offers both free and paid subscription tiers:
        </Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Free Tier:</Text> Limited to 3 repairs per day with basic features</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Pro Tier ($4.99/month):</Text> Unlimited repairs with advanced features</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Premium Tier ($9.99/month):</Text> All features including priority support</Text>
        <Text style={styles.paragraph}>
          Subscriptions are billed monthly and will automatically renew unless canceled at least 24 hours before the end of the current period.
        </Text>

        <Text style={styles.sectionTitle}>4. User Responsibilities</Text>
        <Text style={styles.paragraph}>You agree to:</Text>
        <Text style={styles.bulletPoint}>• Provide accurate information when using the App</Text>
        <Text style={styles.bulletPoint}>• Use the repair instructions at your own risk</Text>
        <Text style={styles.bulletPoint}>• Follow all safety guidelines provided</Text>
        <Text style={styles.bulletPoint}>• Not misuse or abuse the service</Text>
        <Text style={styles.bulletPoint}>• Respect intellectual property rights</Text>
        <Text style={styles.bulletPoint}>• Not attempt to reverse engineer the App</Text>

        <Text style={styles.sectionTitle}>5. Disclaimer of Warranties</Text>
        <Text style={styles.paragraph}>
          THE APP AND ALL REPAIR INSTRUCTIONS ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. Pix-Fix does not guarantee that repairs will be successful or that the instructions are error-free. Users assume all risks associated with attempting repairs.
        </Text>

        <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          Pix-Fix, its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the App or any repairs attempted based on our instructions.
        </Text>

        <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          All content, features, and functionality of the App, including but not limited to text, graphics, logos, and software, are owned by Pix-Fix and are protected by international copyright, trademark, and other intellectual property laws.
        </Text>

        <Text style={styles.sectionTitle}>8. User Content</Text>
        <Text style={styles.paragraph}>
          By posting content to the Community forum, you grant Pix-Fix a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, and display such content in connection with the service.
        </Text>

        <Text style={styles.sectionTitle}>9. Termination</Text>
        <Text style={styles.paragraph}>
          We reserve the right to terminate or suspend your access to the App immediately, without prior notice, for any reason, including breach of these Terms. You may cancel your subscription at any time through your account settings.
        </Text>

        <Text style={styles.sectionTitle}>10. Refund Policy</Text>
        <Text style={styles.paragraph}>
          We offer a 30-day money-back guarantee for all paid subscriptions. To request a refund, contact support@pixfix.app within 30 days of your initial purchase.
        </Text>

        <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these Terms at any time. We will notify users of any material changes via email or in-app notification. Continued use of the App after changes constitutes acceptance of the modified Terms.
        </Text>

        <Text style={styles.sectionTitle}>12. Governing Law</Text>
        <Text style={styles.paragraph}>
          These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
        </Text>

        <Text style={styles.sectionTitle}>13. Contact Information</Text>
        <Text style={styles.paragraph}>
          For questions about these Terms, please contact us at:
        </Text>
        <Text style={styles.bulletPoint}>• Email: legal@pixfix.app</Text>
        <Text style={styles.bulletPoint}>• Support: support@pixfix.app</Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 Pix-Fix. All rights reserved.</Text>
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
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00D9FF',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 8,
    marginLeft: 8,
  },
  bold: {
    fontWeight: 'bold',
    color: '#fff',
  },
  footer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
});