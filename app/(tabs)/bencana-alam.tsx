import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function BencanaAlamScreen() {
  const router = useRouter();

  const disasters = [
    {
      id: 1,
      title: 'Gempa Bumi',
      icon: 'earthquake',
      color: '#FF6B6B',
      beforeTips: [
        '• Identifikasi tempat aman di rumah (di bawah meja, dekat dinding)',
        '• Amankan furniture dan barang berat yang bisa jatuh',
        '• Buat rencana evakuasi keluarga',
        '• Siapkan tas darurat dengan perlengkapan penting',
        '• Ketahui lokasi posko darurat terdekat'
      ],
      duringTips: [
        '• JANGAN berlari keluar rumah saat gempa',
        '• Berlindung di bawah meja atau di sudut ruangan',
        '• Jika di luar, jauh dari bangunan dan kabel listrik',
        '• Tetap di tempat yang aman sampai gempa berhenti',
        '• Hindari tangga dan jendela'
      ],
      afterTips: [
        '• Periksa diri sendiri dan orang lain terhadap cedera',
        '• Keluar dari bangunan jika masih aman',
        '• Hindari area yang terlihat rusak',
        '• Hubungi keluarga untuk beri tahu keselamatan Anda',
        '• Dengarkan siaran berita resmi'
      ]
    },
    {
      id: 2,
      title: 'Banjir',
      icon: 'water-opacity',
      color: '#4ECDC4',
      beforeTips: [
        '• Ketahui area rawan banjir di sekitar Anda',
        '• Siapkan tas darurat dengan dokumen penting',
        '• Pelajari rute evakuasi terdekat',
        '• Jaga barang penting di tempat tinggi',
        '• Periksa sistem pembuangan air di rumah'
      ],
      duringTips: [
        '• Tidak boleh mengemudi melalui area banjir',
        '• Bergerak ke tempat yang lebih tinggi',
        '• Hindari air yang deras atau dalam',
        '• Jangan menyentuh kabel listrik yang basah',
        '• Tunggu peringatan resmi sebelum kembali'
      ],
      afterTips: [
        '• Periksa kerusakan pada rumah dan barang',
        '• Bersihkan dan disinfeksi area yang terkena banjir',
        '• Buang makanan yang terkena air banjir',
        '• Hati-hati dengan air yang masih tergenang',
        '• Dokumentasikan kerusakan untuk klaim asuransi'
      ]
    },
    {
      id: 3,
      title: 'Kebakaran',
      icon: 'fire',
      color: '#FF8C42',
      beforeTips: [
        '• Pasang alarm asap di rumah',
        '• Periksa sistem kelistrikan secara rutin',
        '• Jauh dari sumber api (kompor, rokok)',
        '• Siapkan tabung pemadam kebakaran',
        '• Ajarkan keluarga cara menutup api'
      ],
      duringTips: [
        '• Segera tinggalkan bangunan',
        '• Jangan ambil barang pribadi',
        '• Crawl di bawah asap jika perlu',
        '• Gunakan rute darurat yang terdekat',
        '• Hubungi 113 setelah aman'
      ],
      afterTips: [
        '• Berkumpul di tempat pertemuan yang telah ditentukan',
        '• Jangan kembali ke bangunan',
        '• Bantu penyelamat jika aman',
        '• Hubungi keluarga untuk beri tahu keselamatan',
        '• Ikuti petunjuk petugas pemadam'
      ]
    },
    {
      id: 4,
      title: 'Angin Topan / Puting Beliung',
      icon: 'weather-tornado',
      color: '#6C5CE7',
      beforeTips: [
        '• Pantau peringatan cuaca secara teratur',
        '• Amankan barang di halaman',
        '• Ketahui ruang paling aman di rumah',
        '• Siapkan tas darurat',
        '• Pasang kaca anti badai jika memungkinkan'
      ],
      duringTips: [
        '• Masuk ke ruangan paling dalam rumah',
        '• Hindari jendela dan pintu luar',
        '• Tutupi diri dengan selimut atau bantal',
        '• Jangan mencoba meninggalkan area',
        '• Dengarkan peringatan resmi'
      ],
      afterTips: [
        '• Tetap di dalam sampai peringatan dihapus',
        '• Periksa kerusakan rumah secara hati-hati',
        '• Hindari jalanan yang rusak',
        '• Bantu tetangga jika aman',
        '• Dokumentasikan kerusakan'
      ]
    },
    {
      id: 5,
      title: 'Tanah Longsor',
      icon: 'mountain',
      color: '#A29BFE',
      beforeTips: [
        '• Ketahui area rawan tanah longsor',
        '• Hindari bermukim di lereng curam',
        '• Jangan menebang pohon di lereng',
        '• Siapkan rute evakuasi',
        '• Pelajari tanda-tanda peringatan'
      ],
      duringTips: [
        '• Segera evakuasi ke tempat yang lebih tinggi',
        '• Hindari menuruni lereng',
        '• Jangan berada di area yang tidak stabil',
        '• Hubungi layanan darurat',
        '• Hindari area yang baru saja terjadi longsor'
      ],
      afterTips: [
        '• Tunggu peringatan resmi untuk kembali',
        '• Hati-hati dengan reruntuhan',
        '• Bantu pencarian dan penyelamatan',
        '• Periksa kerusakan infrastruktur',
        '• Laporkan area berbahaya ke otoritas'
      ]
    },
    {
      id: 6,
      title: 'Tsunami',
      icon: 'waves',
      color: '#00B894',
      beforeTips: [
        '• Pelajari tanda-tanda peringatan tsunami',
        '• Ketahui rute evakuasi ke tempat tinggi',
        '• Siapkan tas darurat',
        '• Dengarkan sistem peringatan dini',
        '• Ajarkan keluarga tentang tsunami'
      ],
      duringTips: [
        '• SEGERA evakuasi ke tempat tinggi',
        '• Jangan kembali ke pantai untuk mengamati',
        '• Naik ke bangunan bertingkat atau bukit',
        '• Hindari air laut yang surut aneh',
        '• Tunggu peringatan all-clear resmi'
      ],
      afterTips: [
        '• Tetap di tempat aman sebelum peringatan dihapus',
        '• Hindari area pantai yang terpengaruh',
        '• Hati-hati dengan puing-puing',
        '• Bantu evakuasi dan penyelamatan',
        '• Dokumentasikan kerugian'
      ]
    }
  ];

  return (
    <LinearGradient colors={['#D2E7FA', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0C4F8D" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bencana Alam</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.heroCard}>
            <View style={styles.heroIconContainer}>
              <MaterialCommunityIcons name="alert-circle" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.heroTitle}>Panduan Menghadapi Bencana Alam</Text>
            <Text style={styles.heroSubtitle}>
              Pelajari cara mempersiapkan diri dan merespons berbagai jenis bencana alam
            </Text>
          </View>

          {/* Disasters Grid */}
          <Text style={styles.sectionTitle}>Jenis-Jenis Bencana</Text>
          <View style={styles.disasterGrid}>
            {disasters.map((disaster) => (
              <DisasterCard key={disaster.id} disaster={disaster} />
            ))}
          </View>

          {/* General Safety Tips */}
          <View style={styles.safetySection}>
            <Text style={styles.sectionTitle}>Tips Keselamatan Umum</Text>
            <View style={styles.tipCard}>
              <MaterialCommunityIcons name="briefcase" size={20} color="#0C4F8D" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Siapkan Tas Darurat</Text>
                <Text style={styles.tipDesc}>Air minum, makanan, obat-obatan, dokumen penting</Text>
              </View>
            </View>
            <View style={styles.tipCard}>
              <MaterialCommunityIcons name="phone-alert" size={20} color="#0C4F8D" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Simpan Nomor Darurat</Text>
                <Text style={styles.tipDesc}>119 (Ambulans), 113 (Pemadam), 112 (Darurat Umum)</Text>
              </View>
            </View>
            <View style={styles.tipCard}>
              <MaterialCommunityIcons name="account-multiple" size={20} color="#0C4F8D" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Rencanakan Evakuasi</Text>
                <Text style={styles.tipDesc}>Tentukan tempat pertemuan keluarga yang aman</Text>
              </View>
            </View>
            <View style={styles.tipCard}>
              <MaterialCommunityIcons name="information" size={20} color="#0C4F8D" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Tetap Terhubung</Text>
                <Text style={styles.tipDesc}>Ikuti informasi dari sumber resmi dan otoritas</Text>
              </View>
            </View>
          </View>

          {/* Emergency Services */}
          <View style={styles.emergencySection}>
            <Text style={styles.sectionTitle}>Layanan Darurat</Text>
            <TouchableOpacity style={styles.emergencyButton}>
              <MaterialCommunityIcons name="phone" size={20} color="#FFFFFF" />
              <View style={styles.emergencyContent}>
                <Text style={styles.emergencyTitle}>119</Text>
                <Text style={styles.emergencyDesc}>Ambulans Medis</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.emergencyButton}>
              <MaterialCommunityIcons name="phone" size={20} color="#FFFFFF" />
              <View style={styles.emergencyContent}>
                <Text style={styles.emergencyTitle}>113</Text>
                <Text style={styles.emergencyDesc}>Pemadam Kebakaran</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.emergencyButton}>
              <MaterialCommunityIcons name="phone" size={20} color="#FFFFFF" />
              <View style={styles.emergencyContent}>
                <Text style={styles.emergencyTitle}>112</Text>
                <Text style={styles.emergencyDesc}>Darurat Umum</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function DisasterCard({ disaster }: { disaster: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity 
      style={[styles.disasterCard, { borderLeftColor: disaster.color }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.disasterHeader}>
        <View style={[styles.disasterIcon, { backgroundColor: disaster.color }]}>
          <MaterialCommunityIcons name={disaster.icon} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.disasterInfo}>
          <Text style={styles.disasterTitle}>{disaster.title}</Text>
        </View>
        <Ionicons 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#0C4F8D" 
        />
      </View>

      {expanded && (
        <View style={styles.disasterContent}>
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>⚠️ Sebelum Bencana:</Text>
            {disaster.beforeTips.map((tip: string, idx: number) => (
              <Text key={`before-${idx}`} style={styles.tipText}>{tip}</Text>
            ))}
          </View>

          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>🚨 Saat Bencana:</Text>
            {disaster.duringTips.map((tip: string, idx: number) => (
              <Text key={`during-${idx}`} style={styles.tipText}>{tip}</Text>
            ))}
          </View>

          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>✅ Setelah Bencana:</Text>
            {disaster.afterTips.map((tip: string, idx: number) => (
              <Text key={`after-${idx}`} style={styles.tipText}>{tip}</Text>
            ))}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0C4F8D',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#003B71',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#003B71',
    marginBottom: 12,
  },
  disasterGrid: {
    marginBottom: 24,
  },
  disasterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  disasterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disasterIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  disasterInfo: {
    flex: 1,
  },
  disasterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#003B71',
  },
  disasterContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tipsContainer: {
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#003B71',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 11,
    color: '#000000',
    marginBottom: 4,
    lineHeight: 16,
  },
  safetySection: {
    marginBottom: 24,
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#003B71',
    marginBottom: 2,
  },
  tipDesc: {
    fontSize: 10,
    color: '#8D8E8E',
  },
  emergencySection: {
    marginBottom: 20,
  },
  emergencyButton: {
    backgroundColor: '#003B71',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyContent: {
    flex: 1,
    marginLeft: 12,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emergencyDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
});
