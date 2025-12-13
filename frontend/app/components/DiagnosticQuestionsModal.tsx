import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface DiagnosticQuestionsModalProps {
  visible: boolean;
  itemType: string;
  initialAnalysis: string;
  onDiagnosisComplete: (fullDiagnosis: any) => void;
  onClose: () => void;
}

// Predefined diagnostic questions based on item types
const DIAGNOSTIC_QUESTIONS: Record<string, any> = {
  refrigerator: {
    questions: [
      {
        id: 1,
        question: 'What specific problem are you experiencing?',
        options: [
          'Refrigerator not cooling at all',
          'Refrigerator not cooling enough',
          'Refrigerator making strange noises',
          'Refrigerator leaking water',
          'Light inside refrigerator not working',
          'Freezer not freezing',
          'Ice maker not working',
          'Door not closing properly',
        ],
      },
      {
        id: 2,
        question: 'When did the problem start?',
        options: ['Just today', 'A few days ago', 'About a week ago', 'More than a week ago', 'Gradually over time'],
      },
      {
        id: 3,
        question: 'Have you noticed any unusual sounds?',
        options: ['No unusual sounds', 'Clicking sounds', 'Humming/buzzing', 'Rattling', 'Loud fan noise', 'Gurgling'],
      },
    ],
  },
  'washing machine': {
    questions: [
      {
        id: 1,
        question: 'What is the main issue with your washing machine?',
        options: [
          "Won't start at all",
          "Won't spin or agitate",
          'Leaking water',
          'Making loud noises',
          'Not draining',
          'Not filling with water',
          "Door won't open/close",
          'Leaving clothes wet',
        ],
      },
      {
        id: 2,
        question: 'When does the problem occur?',
        options: ['During wash cycle', 'During spin cycle', 'During drain cycle', 'All the time', 'When filling'],
      },
      {
        id: 3,
        question: 'Is there water leaking?',
        options: ['No leaking', 'Small puddle underneath', 'Active leak during operation', 'Water from door', 'Water from hose connection'],
      },
    ],
  },
  smartphone: {
    questions: [
      {
        id: 1,
        question: "What's wrong with your smartphone?",
        options: [
          'Cracked screen',
          "Won't turn on",
          'Battery drains quickly',
          'Charging issues',
          'Camera not working',
          'Speaker/microphone issues',
          'Overheating',
          'Water damage',
        ],
      },
      {
        id: 2,
        question: 'Can you still use the phone?',
        options: ['Yes, fully functional', 'Partially functional', 'Turns on but has issues', "Won't turn on at all"],
      },
      {
        id: 3,
        question: 'Has the phone been dropped or damaged?',
        options: ['No physical damage', 'Recently dropped', 'Exposed to water', 'Screen impact', 'Unknown cause'],
      },
    ],
  },
  laptop: {
    questions: [
      {
        id: 1,
        question: 'What issue are you experiencing?',
        options: [
          "Won't power on",
          'Screen is black/blank',
          'Keyboard not working',
          'Trackpad not working',
          'Overheating',
          'Battery not charging',
          'Slow performance',
          'Making strange noises',
        ],
      },
      {
        id: 2,
        question: 'Does the laptop show any signs of power?',
        options: ['No lights at all', 'Power light on', 'Fans spinning', 'Screen lights up briefly', 'Fully powers on but has issues'],
      },
      {
        id: 3,
        question: 'When did this start?',
        options: ['Just now', 'After an update', 'After physical impact', 'Gradually over time', 'After liquid spill'],
      },
    ],
  },
  // Generic fallback for unlisted items
  default: {
    questions: [
      {
        id: 1,
        question: 'What is the primary problem?',
        options: [
          "Device won't turn on",
          'Not working as expected',
          'Making unusual sounds',
          'Physical damage visible',
          'Performance issues',
          'Safety concerns',
        ],
      },
      {
        id: 2,
        question: 'When did you first notice this issue?',
        options: ['Just now', 'Today', 'This week', 'More than a week ago', "It's been ongoing"],
      },
      {
        id: 3,
        question: 'Have you attempted any fixes?',
        options: ['No attempts yet', 'Restarted/reset', 'Checked connections', 'Consulted manual', 'Professional looked at it'],
      },
    ],
  },
};

export default function DiagnosticQuestionsModal({
  visible,
  itemType,
  initialAnalysis,
  onDiagnosisComplete,
  onClose,
}: DiagnosticQuestionsModalProps) {
  const { theme } = useTheme();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  // Get questions for this item type or use default
  const itemKey = Object.keys(DIAGNOSTIC_QUESTIONS).find((key) =>
    itemType.toLowerCase().includes(key)
  );
  const questions = DIAGNOSTIC_QUESTIONS[itemKey || 'default'].questions;
  const currentQuestion = questions[currentQuestionIndex];

  const handleSelectOption = async (option: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: option };
    setAnswers(newAnswers);

    // Move to next question or finish
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, get refined diagnosis
      await getRefinedDiagnosis(newAnswers);
    }
  };

  const getRefinedDiagnosis = async (allAnswers: Record<number, string>) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/refine-diagnosis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: itemType,
          initial_analysis: initialAnalysis,
          diagnostic_answers: allAnswers,
        }),
      });

      if (response.ok) {
        const refinedData = await response.json();
        onDiagnosisComplete(refinedData);
      } else {
        // Fallback to initial analysis
        onDiagnosisComplete({ initial_analysis: initialAnalysis });
      }
    } catch (error) {
      console.error('Error refining diagnosis:', error);
      onDiagnosisComplete({ initial_analysis: initialAnalysis });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <LinearGradient
        colors={theme.gradients.background}
        style={styles.container}
      >
        <View style={styles.safeArea}>
          {/* Header */}
          <BlurView
            intensity={theme.colors.glassBlur}
            tint={theme.colors.glassTint}
            style={[styles.header, { borderColor: theme.colors.glassBorder }]}
          >
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name=\"arrow-back\" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Diagnostic Questions</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name=\"close\" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </BlurView>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size=\"large\" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                Analyzing your answers...
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
              {/* Progress Indicator */}
              <View style={styles.progressContainer}>
                <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Question Card */}
              <BlurView
                intensity={theme.colors.glassBlur}
                tint={theme.colors.glassTint}
                style={[styles.questionCard, { borderColor: theme.colors.glassBorder }]}
              >
                <View style={styles.iconContainer}>
                  <LinearGradient
                    colors={theme.gradients.primary}
                    style={styles.iconGradient}
                  >
                    <Ionicons name=\"help-circle\" size={32} color=\"#fff\" />
                  </LinearGradient>
                </View>
                <Text style={[styles.questionText, { color: theme.colors.text }]}>
                  {currentQuestion.question}
                </Text>
                <Text style={[styles.questionSubtext, { color: theme.colors.textSecondary }]}>
                  Select the option that best describes your situation:
                </Text>
              </BlurView>

              {/* Options */}
              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleSelectOption(option)}
                    activeOpacity={0.7}
                  >
                    <BlurView
                      intensity={theme.colors.glassBlur}
                      tint={theme.colors.glassTint}
                      style={[
                        styles.optionCard,
                        {
                          borderColor: answers[currentQuestion.id] === option
                            ? theme.colors.primary
                            : theme.colors.glassBorder,
                          borderWidth: answers[currentQuestion.id] === option ? 2 : 1,
                        },
                      ]}
                    >
                      <View style={styles.optionContent}>
                        <Text
                          style={[
                            styles.optionText,
                            {
                              color: answers[currentQuestion.id] === option
                                ? theme.colors.primary
                                : theme.colors.text,
                            },
                          ]}
                        >
                          {option}
                        </Text>
                      </View>
                      <Ionicons
                        name={answers[currentQuestion.id] === option ? 'checkmark-circle' : 'chevron-forward'}
                        size={24}
                        color={
                          answers[currentQuestion.id] === option
                            ? theme.colors.primary
                            : theme.colors.textTertiary
                        }
                      />
                    </BlurView>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Help Text */}
              <BlurView
                intensity={theme.colors.glassBlur}
                tint={theme.colors.glassTint}
                style={[styles.helpCard, { borderColor: theme.colors.glassBorder }]}
              >
                <Ionicons name=\"information-circle\" size={20} color={theme.colors.info} />
                <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
                  These questions help our AI provide more accurate repair guidance tailored to your specific issue.
                </Text>
              </BlurView>
            </ScrollView>
          )}
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  questionCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  questionSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionContent: {
    flex: 1,
    marginRight: 12,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 12,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
