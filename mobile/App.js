import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  StatusBar,
  SafeAreaView
} from 'react-native';

export default function App() {
  const [activeTab, setActiveTab] = useState('tutors'); // 'login' | 'tutors' | 'progress' | 'schedule'
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock Tutors
  const tutors = [
    { id: '1', name: 'Dr. Chidi Johnson', subject: 'Mathematics', rate: '₦4,000/hr', rating: '5.0 (42 reviews)', location: 'Enugu, Nigeria', curricula: 'WAEC, JAMB' },
    { id: '2', name: 'Amina Yusuf', subject: 'English Language', rate: '₦3,500/hr', rating: '4.9 (18 reviews)', location: 'Kano, Nigeria', curricula: 'WAEC, NECO' },
    { id: '3', name: 'Mr. Adebayo Okafor', subject: 'Physics & Chemistry', rate: '₦5,000/hr', rating: '5.0 (65 reviews)', location: 'Lagos, Nigeria', curricula: 'WAEC, IGCSE' }
  ];

  // Filtered tutors
  const filteredTutors = tutors.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E4036" />
      
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <Text style={styles.logoText}>EduBridge Africa</Text>
        <Text style={styles.subText}>Mobile Learning Portal</Text>
      </View>

      {/* LOGIN VIEW */}
      {!isLoggedIn || activeTab === 'login' ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Secure Portal Login</Text>
            <Text style={styles.cardDesc}>Enter credentials to access classrooms, telemetry profiles, and escrow contracts.</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput style={styles.input} placeholder="parent@edubridge.com" placeholderTextColor="#888" keyboardType="email-address" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput style={styles.input} placeholder="••••••••••••" placeholderTextColor="#888" secureTextEntry />
            </View>

            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => {
                setIsLoggedIn(true);
                setActiveTab('tutors');
              }}
            >
              <Text style={styles.primaryButtonText}>AUTHENTICATE & ENTER</Text>
            </TouchableOpacity>

            {isLoggedIn && (
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={() => setIsLoggedIn(false)}
              >
                <Text style={styles.secondaryButtonText}>LOG OUT</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {/* TAB-SPECIFIC VIEWS */}
          {activeTab === 'tutors' && (
            <View style={{ flex: 1 }}>
              <View style={styles.searchBarContainer}>
                <TextInput 
                  style={styles.searchInput} 
                  placeholder="🔍 Search tutors, subjects, location..." 
                  placeholderTextColor="#888"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionHeader}>Vetted African Educators ({filteredTutors.length})</Text>
                {filteredTutors.map(tutor => (
                  <View key={tutor.id} style={styles.tutorCard}>
                    <View style={styles.tutorHeader}>
                      <View>
                        <Text style={styles.tutorName}>{tutor.name}</Text>
                        <Text style={styles.tutorSubject}>{tutor.subject} · {tutor.curricula}</Text>
                      </View>
                      <Text style={styles.tutorRate}>{tutor.rate}</Text>
                    </View>
                    <View style={styles.tutorDetails}>
                      <Text style={styles.tutorMeta}>📍 {tutor.location}</Text>
                      <Text style={styles.tutorMeta}>⭐ {tutor.rating}</Text>
                    </View>
                    <TouchableOpacity style={styles.tutorButton}>
                      <Text style={styles.tutorButtonText}>BOOK TIMED ESCROW LESSON</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {activeTab === 'progress' && (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <Text style={styles.sectionHeader}>Student Telemetries</Text>
              
              {/* Stats Grid */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statVal}>94%</Text>
                  <Text style={styles.statLabel}>Attendance</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statVal}>88%</Text>
                  <Text style={styles.statLabel}>Avg Grade</Text>
                </View>
              </View>

              {/* Progress Detail */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Tunde's Mathematics Profile</Text>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Algebra Factoring</Text>
                  <Text style={styles.progressPercent}>95%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '95%' }]} />
                </View>

                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Trigonometric Graphing</Text>
                  <Text style={styles.progressPercent}>72%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '72%' }]} />
                </View>
              </View>

              {/* AI Diagnostic Summary */}
              <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#CC5833' }]}>
                <Text style={styles.aiHeader}>🧠 AI DIAGNOSTIC REPORT</Text>
                <Text style={styles.aiBody}>
                  Tunde has shown 16% growth in mathematical calculations. Quadratic logic is sound. Trig graphing requires review of coordinate system formulas in the next scheduled meeting.
                </Text>
              </View>
            </ScrollView>
          )}

          {activeTab === 'schedule' && (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <Text style={styles.sectionHeader}>Upcoming Escrow Schedules</Text>
              
              <View style={styles.scheduleCard}>
                <View style={styles.scheduleHeader}>
                  <Text style={styles.scheduleTime}>📅 TOMORROW 4:00 PM</Text>
                  <Text style={styles.escrowStatus}>Locked Escrow</Text>
                </View>
                <Text style={styles.scheduleTitle}>Mathematics Algebra Prep</Text>
                <Text style={styles.scheduleTeacher}>Tutor: Dr. Chidi Johnson</Text>
                <View style={styles.separator} />
                <Text style={styles.escrowBody}>
                  Escrow wallet is verified. Funds will release to tutor after biometric student verification at lesson clock completion.
                </Text>
              </View>

              <View style={styles.scheduleCard}>
                <View style={styles.scheduleHeader}>
                  <Text style={styles.scheduleTime}>📅 WEDNESDAY 3:00 PM</Text>
                  <Text style={styles.escrowStatus}>Locked Escrow</Text>
                </View>
                <Text style={styles.scheduleTitle}>English Literature Essay</Text>
                <Text style={styles.scheduleTeacher}>Tutor: Amina Yusuf</Text>
                <View style={styles.separator} />
                <Text style={styles.escrowBody}>
                  Escrow wallet verified. Class connection links will activate 15 mins prior.
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {/* BOTTOM TABS */}
      {isLoggedIn && (
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'tutors' && styles.activeTabButton]}
            onPress={() => setActiveTab('tutors')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'tutors' && styles.activeTabButtonText]}>🔍 Tutors</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'progress' && styles.activeTabButton]}
            onPress={() => setActiveTab('progress')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'progress' && styles.activeTabButtonText]}>📈 Progress</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'schedule' && styles.activeTabButton]}
            onPress={() => setActiveTab('schedule')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'schedule' && styles.activeTabButtonText]}>📅 Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'login' && styles.activeTabButton]}
            onPress={() => setActiveTab('login')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'login' && styles.activeTabButtonText]}>👤 Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F0E9', // Cream BG
  },
  header: {
    backgroundColor: '#2E4036', // Moss Header
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(204, 88, 51, 0.2)', // Clay accent border
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F2F0E9',
    letterSpacing: 1.5,
  },
  subText: {
    fontSize: 11,
    color: 'rgba(242, 240, 233, 0.7)',
    fontFamily: 'Courier',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(46, 64, 54, 0.1)',
    shadowColor: '#2E4036',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E4036',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#CC5833', // Clay label
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F2F0E9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(46, 64, 54, 0.1)',
  },
  primaryButton: {
    backgroundColor: '#2E4036',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#F2F0E9',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  secondaryButton: {
    borderColor: '#CC5833',
    borderWidth: 1,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButtonText: {
    color: '#CC5833',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  searchBarContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 64, 54, 0.08)',
  },
  searchInput: {
    backgroundColor: '#F2F0E9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A1A',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E4036',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginVertical: 12,
  },
  tutorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(46, 64, 54, 0.1)',
  },
  tutorHeader: {
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'start',
    marginBottom: 8,
  },
  tutorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E4036',
  },
  tutorSubject: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  tutorRate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#CC5833',
  },
  tutorDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  tutorMeta: {
    fontSize: 11,
    color: '#444',
  },
  tutorButton: {
    backgroundColor: '#CC5833',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tutorButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46, 64, 54, 0.1)',
  },
  statVal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CC5833',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'between',
    marginTop: 12,
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E4036',
  },
  progressPercent: {
    fontSize: 12,
    color: '#666',
  },
  progressBarBg: {
    backgroundColor: '#F2F0E9',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    backgroundColor: '#2E4036',
    height: 8,
    borderRadius: 4,
  },
  aiHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#CC5833',
    letterSpacing: 1,
    marginBottom: 6,
  },
  aiBody: {
    fontSize: 12,
    color: '#1A1A1A',
    lineHeight: 18,
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(46, 64, 54, 0.1)',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'between',
    marginBottom: 8,
  },
  scheduleTime: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#CC5833',
    letterSpacing: 0.8,
  },
  escrowStatus: {
    fontSize: 8,
    fontWeight: 'bold',
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scheduleTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2E4036',
  },
  scheduleTeacher: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(46, 64, 54, 0.05)',
    marginVertical: 10,
  },
  escrowBody: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },
  tabsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2E4036',
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(204, 88, 51, 0.2)',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  activeTabButton: {
    transform: [{ scale: 1.05 }],
  },
  tabButtonText: {
    fontSize: 11,
    color: 'rgba(242, 240, 233, 0.5)',
    fontWeight: 'bold',
  },
  activeTabButtonText: {
    color: '#F2F0E9',
  }
});
