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

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.lastUpdated}>Last Updated: December 10, 2024</Text>

        <Text style={styles.paragraph}>
          At Pix-Fix, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
        </Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        
        <Text style={styles.subTitle}>1.1 Information You Provide</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Photos:</Text> Images of broken items you upload for analysis</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Community Posts:</Text> Repair stories, photos, and tips you share</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Account Information:</Text> Email, name, and profile data (if provided)</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Payment Information:</Text> Processed securely by Stripe (we don't store card details)</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Feedback:</Text> Ratings and comments on repair instructions</Text>

        <Text style={styles.subTitle}>1.2 Automatically Collected Information</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Device Information:</Text> Device type, OS version, unique identifiers</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Usage Data:</Text> Features used, time spent, repair history</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Location Data:</Text> GPS coordinates (only when searching for local vendors, with your permission)</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Analytics:</Text> App performance, crashes, and error logs</Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>We use collected information to:</Text>
        <Text style={styles.bulletPoint}>• Provide and improve our AI-powered repair analysis service</Text>
        <Text style={styles.bulletPoint}>• Process your subscription payments</Text>
        <Text style={styles.bulletPoint}>• Send repair reminders and notifications (with your consent)</Text>
        <Text style={styles.bulletPoint}>• Display relevant local repair shops based on your location</Text>
        <Text style={styles.bulletPoint}>• Improve our AI models and repair instructions</Text>
        <Text style={styles.bulletPoint}>• Provide customer support</Text>
        <Text style={styles.bulletPoint}>• Prevent fraud and ensure platform security</Text>
        <Text style={styles.bulletPoint}>• Comply with legal obligations</Text>

        <Text style={styles.sectionTitle}>3. How We Share Your Information</Text>
        <Text style={styles.paragraph}>We may share your information with:</Text>
        
        <Text style={styles.subTitle}>3.1 Service Providers</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Google Gemini AI:</Text> For image analysis and repair instructions</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Stripe:</Text> For payment processing</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Cloud Storage:</Text> For secure data storage</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Analytics Providers:</Text> For app performance monitoring</Text>

        <Text style={styles.subTitle}>3.2 Legal Requirements</Text>
        <Text style={styles.paragraph}>
          We may disclose your information if required by law, court order, or government request, or to protect our rights and safety.
        </Text>

        <Text style={styles.subTitle}>3.3 Business Transfers</Text>
        <Text style={styles.paragraph}>
          In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new owner.
        </Text>

        <Text style={styles.sectionTitle}>4. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement industry-standard security measures to protect your data:
        </Text>
        <Text style={styles.bulletPoint}>• Encryption of data in transit (SSL/TLS)</Text>
        <Text style={styles.bulletPoint}>• Encrypted data storage</Text>
        <Text style={styles.bulletPoint}>• Secure payment processing (PCI DSS compliant)</Text>
        <Text style={styles.bulletPoint}>• Regular security audits and updates</Text>
        <Text style={styles.bulletPoint}>• Access controls and authentication</Text>

        <Text style={styles.paragraph}>
          However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
        </Text>

        <Text style={styles.sectionTitle}>5. Your Privacy Rights</Text>
        <Text style={styles.paragraph}>You have the right to:</Text>
        
        <Text style={styles.subTitle}>5.1 Access and Portability</Text>
        <Text style={styles.bulletPoint}>• Request a copy of your personal data</Text>
        <Text style={styles.bulletPoint}>• Export your repair history and community posts</Text>

        <Text style={styles.subTitle}>5.2 Correction and Deletion</Text>
        <Text style={styles.bulletPoint}>• Update or correct your information</Text>
        <Text style={styles.bulletPoint}>• Request deletion of your account and data</Text>

        <Text style={styles.subTitle}>5.3 Opt-Out Rights</Text>
        <Text style={styles.bulletPoint}>• Disable location services</Text>
        <Text style={styles.bulletPoint}>• Turn off push notifications</Text>
        <Text style={styles.bulletPoint}>• Opt out of marketing communications</Text>

        <Text style={styles.subTitle}>5.4 California Privacy Rights (CCPA)</Text>
        <Text style={styles.paragraph}>
          California residents have additional rights including the right to know what personal information is collected, the right to delete personal information, and the right to opt-out of the sale of personal information (note: we do not sell your data).
        </Text>

        <Text style={styles.subTitle}>5.5 European Privacy Rights (GDPR)</Text>
        <Text style={styles.paragraph}>
          EU residents have rights including data portability, the right to be forgotten, and the right to lodge a complaint with a supervisory authority.
        </Text>

        <Text style={styles.sectionTitle}>6. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Pix-Fix is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
        </Text>

        <Text style={styles.sectionTitle}>7. Data Retention</Text>
        <Text style={styles.paragraph}>
          We retain your information for as long as your account is active or as needed to provide services. We may retain certain information for longer periods as required by law or for legitimate business purposes.
        </Text>
        <Text style={styles.bulletPoint}>• Account data: Until account deletion</Text>
        <Text style={styles.bulletPoint}>• Repair history: 2 years after last activity</Text>
        <Text style={styles.bulletPoint}>• Community posts: Indefinitely (unless deleted)</Text>
        <Text style={styles.bulletPoint}>• Payment records: 7 years (legal requirement)</Text>

        <Text style={styles.sectionTitle}>8. International Data Transfers</Text>
        <Text style={styles.paragraph}>
          Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers.
        </Text>

        <Text style={styles.sectionTitle}>9. Cookies and Tracking</Text>
        <Text style={styles.paragraph}>
          We use cookies and similar tracking technologies to:
        </Text>
        <Text style={styles.bulletPoint}>• Remember your preferences</Text>
        <Text style={styles.bulletPoint}>• Analyze app usage and performance</Text>
        <Text style={styles.bulletPoint}>• Provide personalized content</Text>
        <Text style={styles.paragraph}>
          You can control cookies through your device settings.
        </Text>

        <Text style={styles.sectionTitle}>10. Third-Party Links</Text>
        <Text style={styles.paragraph}>
          Our app may contain links to third-party websites (e.g., Amazon for parts). We are not responsible for the privacy practices of these sites. Please review their privacy policies.
        </Text>

        <Text style={styles.sectionTitle}>11. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy periodically. We will notify you of any material changes via email or in-app notification. The "Last Updated" date at the top indicates when the policy was last revised.
        </Text>

        <Text style={styles.sectionTitle}>12. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions about this Privacy Policy or want to exercise your privacy rights, contact us at:
        </Text>
        <Text style={styles.bulletPoint}>• Email: privacy@pixfix.app</Text>
        <Text style={styles.bulletPoint}>• Support: support@pixfix.app</Text>
        <Text style={styles.bulletPoint}>• Data Protection Officer: dpo@pixfix.app</Text>

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
    marginBottom: 16,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00D9FF',
    marginTop: 24,
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
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