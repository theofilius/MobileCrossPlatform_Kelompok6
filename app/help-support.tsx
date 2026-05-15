import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from './context/LanguageContext';
import { TranslationKey } from '../translations';

type Guide = {
  icon: string;
  color: string;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
};

const GUIDES: Guide[] = [
  { icon: 'shield-cross', color: '#DC2626', titleKey: 'hs_sos_title', bodyKey: 'hs_sos_body' },
  { icon: 'account-plus', color: '#0C4F8D', titleKey: 'hs_add_contact_title', bodyKey: 'hs_add_contact_body' },
  { icon: 'star-circle', color: '#EA580C', titleKey: 'hs_primary_title', bodyKey: 'hs_primary_body' },
  { icon: 'map-marker-radius', color: '#059669', titleKey: 'hs_sos_what_title', bodyKey: 'hs_sos_what_body' },
];

type FAQ = { q: TranslationKey; a: TranslationKey };
const FAQS: FAQ[] = [
  { q: 'hs_faq1_q', a: 'hs_faq1_a' },
  { q: 'hs_faq2_q', a: 'hs_faq2_a' },
  { q: 'hs_faq3_q', a: 'hs_faq3_a' },
];

function GuideCard({ guide, expanded, onToggle }: { guide: Guide; expanded: boolean; onToggle: () => void }) {
  const { t } = useLanguage();
  return (
    <TouchableOpacity style={styles.card} onPress={onToggle} activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: guide.color + '18' }]}>
          <MaterialCommunityIcons name={guide.icon as any} size={20} color={guide.color} />
        </View>
        <Text style={styles.cardTitle}>{t(guide.titleKey)}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#9CA3AF" />
      </View>
      {expanded && <Text style={styles.cardBody}>{t(guide.bodyKey)}</Text>}
    </TouchableOpacity>
  );
}

function FAQItem({ faq, expanded, onToggle }: { faq: FAQ; expanded: boolean; onToggle: () => void }) {
  const { t } = useLanguage();
  return (
    <TouchableOpacity style={styles.faqRow} onPress={onToggle} activeOpacity={0.85}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQ}>{t(faq.q)}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#9CA3AF" />
      </View>
      {expanded && <Text style={styles.faqA}>{t(faq.a)}</Text>}
    </TouchableOpacity>
  );
}

export default function HelpSupportScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [openGuide, setOpenGuide] = useState<number | null>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleContact = () => {
    Linking.openURL(`mailto:${t('hs_contact_email')}?subject=Aegis%20Call%20Support`).catch(() => {});
  };

  const handleReport = () => {
    Linking.openURL(`mailto:${t('hs_contact_email')}?subject=Aegis%20Call%20Problem%20Report`).catch(() => {});
  };

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#003B71" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('hs_title')}</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Quick Guide */}
          <Text style={styles.section}>{t('hs_guide_section')}</Text>
          <View style={styles.cardList}>
            {GUIDES.map((g, idx) => (
              <GuideCard
                key={g.titleKey}
                guide={g}
                expanded={openGuide === idx}
                onToggle={() => setOpenGuide(openGuide === idx ? null : idx)}
              />
            ))}
          </View>

          {/* FAQ */}
          <Text style={styles.section}>{t('hs_faq_section')}</Text>
          <View style={styles.faqCard}>
            {FAQS.map((f, idx) => (
              <View key={f.q}>
                <FAQItem
                  faq={f}
                  expanded={openFaq === idx}
                  onToggle={() => setOpenFaq(openFaq === idx ? null : idx)}
                />
                {idx < FAQS.length - 1 && <View style={styles.faqSep} />}
              </View>
            ))}
          </View>

          {/* Contact buttons */}
          <View style={styles.btnGroup}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleContact}>
              <Ionicons name="mail" size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>{t('hs_contact_btn')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleReport}>
              <MaterialCommunityIcons name="bug-outline" size={18} color="#003B71" />
              <Text style={styles.secondaryBtnText}>{t('hs_report_btn')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.emailLabel}>{t('hs_contact_email')}</Text>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#003B71' },

  scroll: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 4 },

  section: {
    fontSize: 12, fontWeight: '700', color: '#6B7280',
    letterSpacing: 0.5, textTransform: 'uppercase',
    marginTop: 16, marginBottom: 8, marginLeft: 4,
  },

  cardList: { gap: 10 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827' },
  cardBody: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginTop: 10, marginLeft: 50 },

  faqCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  faqRow: { padding: 14 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827', paddingRight: 8 },
  faqA: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginTop: 8 },
  faqSep: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 14 },

  btnGroup: { marginTop: 24, gap: 10 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#003B71', height: 50, borderRadius: 12,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFFFFF', height: 50, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#003B71',
  },
  secondaryBtnText: { color: '#003B71', fontSize: 14, fontWeight: '700' },

  emailLabel: {
    textAlign: 'center', fontSize: 12, color: '#9CA3AF',
    marginTop: 16, fontWeight: '500',
  },
});
