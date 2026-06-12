import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ShieldCheck,
  Layers,
  Globe,
  Calendar,
  Cpu,
  CheckCircle2,
  ArrowRight,
  Lock,
  Activity,
  Sparkles,
  Star,
  BookOpen,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Bell,
  MessageSquare,
  Send,
  X,
  HelpCircle,
  Mail,
  User
} from 'lucide-react';

import BookingModal from './components/BookingModal';
import Marketplace from './components/Marketplace';
import SessionEngine from './components/SessionEngine';
import ParentDashboard from './components/ParentDashboard';
import Academy from './components/Academy';
import AuthModal from './components/AuthModal';
import ChatPanel from './components/ChatPanel';
import TeacherDashboard from './components/TeacherDashboard';
import TeacherOnboarding from './components/TeacherOnboarding';
import AdminDashboard from './components/AdminDashboard';
import TeacherPublicProfile from './components/TeacherPublicProfile';
import StudentPortal from './components/StudentPortal';
import heroImage from './assets/hero.jpg';
import { translations } from './locales/i18n';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [lang, setLang] = useState('en');
  const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;

  const [scrolled, setScrolled] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState(0);
  
  // Current user authentication states
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('edubridge_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
    return null;
  });
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'teacher_profile'
  const [profileUsername, setProfileUsername] = useState('');
  const [isTutorOnboarding, setIsTutorOnboarding] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatSession, setSelectedChatSession] = useState(null);

  // Waitlist form states
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistRole, setWaitlistRole] = useState('Parent');
  const [waitlistStatus, setWaitlistStatus] = useState('');

  // Inline Gated Authentication Form States
  const [authTab, setAuthTab] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('Parent');
  const [authCountry, setAuthCountry] = useState('Nigeria');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dynamic App States for Portals Sync
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [walletBalance, setWalletBalance] = useState(0); // in minor units
  const [escrowBalance, setEscrowBalance] = useState(0); // in minor units
  
  // Booked sessions state
  const [bookedSessions, setBookedSessions] = useState([]);

  // Homework grading portal sync state
  const [gradesLog, setGradesLog] = useState([]);
  const [pendingAssignments, setPendingAssignments] = useState([]);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  
  // AI Customer Support Agent States
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMessages, setSupportMessages] = useState([
    { sender: 'agent', text: "Hello! I am your EduBridge Virtual Assistant. How can I help you navigate our platform today?" }
  ]);
  const [supportInput, setSupportInput] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  const prevUnreadCountRef = useRef(0);

  // Vetted Teachers Database state (so we can append reviews)
  const [teachers, setTeachers] = useState([
    {
      id: "teacher_1",
      uid: "teacher_1",
      name: "Mr. Adebayo Okafor",
      location: "Lagos, Nigeria",
      subjects: ["Mathematics", "Physics"],
      curriculums: ["WAEC", "JAMB", "IGCSE", "High School (Ages 15-18)", "University Prep"],
      rate: 400000, // ₦4,000/hr
      rating: 4.9,
      reviewsCount: 247,
      badges: ["badge-verified", "badge-top-rated", "badge-bg-checked"],
      bio: "12 years teaching mathematics preparation. Specializes in algebra speed calculations and IGCSE/WAEC exam setups.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=600&auto=format&fit=crop",
      online: true,
      reviews: [
        { parent: "Kehinde A.", text: "Excellent algebra prep. Tunde passed his WAEC with an A1!", score: 5 },
        { parent: "Sarah M.", text: "Great physics explanations. Highly recommend.", score: 5 }
      ]
    }
  ]);

  // Booking Modal Trigger State
  const [selectedTeacherForBooking, setSelectedTeacherForBooking] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Exchange Rates & Display Engine (Integer logic)
  const exchangeRates = {
    NGN_USD: 0.00125,
    NGN_GBP: 0.001,
    NGN_EUR: 0.00116,
    NGN_GHS: 0.0143,
    NGN_CAD: 0.00172
  };

  const convertMinor = (ngnMinor, targetCurrency) => {
    if (targetCurrency === 'NGN') return ngnMinor;
    const rateKey = `NGN_${targetCurrency}`;
    const rate = exchangeRates[rateKey] || 1;
    return Math.round(ngnMinor * rate);
  };

  const formatCurrency = (amountInMinor, currency) => {
    const value = amountInMinor / 100;
    const formatters = {
      NGN: new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }),
      USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      GBP: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
      EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
      GHS: new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }),
      CAD: new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }),
    };
    return formatters[currency]?.format(value) ?? `${currency} ${value}`;
  };

  // API Backend Sync
  const API_BASE = '/api';

  const getAuthHeaders = (extraHeaders = {}) => {
    const token = localStorage.getItem('edubridge_token');
    return {
      'Content-Type': 'application/json',
      ...extraHeaders,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const fetchInitialData = async () => {
    try {
      const teachersRes = await fetch(`${API_BASE}/teachers`, {
        headers: getAuthHeaders()
      });
      let latestTeachers = [];
      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        latestTeachers = teachersData.map(t => ({
          ...t,
          id: t.uid || t.id,
          curriculums: t.curricula || t.curriculums || [],
          reviews: t.reviews || []
        }));
        setTeachers(latestTeachers);
      }

      const activeUid = currentUser ? currentUser.uid : 'parent_1';
      const dashboardRes = await fetch(`${API_BASE}/parents/dashboard/${activeUid}`, {
        headers: getAuthHeaders()
      });
      if (dashboardRes.ok) {
        const d = await dashboardRes.json();
        setWalletBalance(d.walletBalance);
        setEscrowBalance(d.escrowBalance);
        if (d.sessions) {
          setBookedSessions(d.sessions.map(s => {
            const matchedTeacher = latestTeachers.find(t => t.id === s.teacherId || t.uid === s.teacherId) || teachers.find(t => t.id === s.teacherId || t.uid === s.teacherId);
            return {
              ...s,
              id: s.id,
              teacherId: s.teacherId,
              teacherName: s.teacherName,
              avatar: s.avatar || matchedTeacher?.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
              subject: s.subject,
              slot: s.slot,
              cost: s.cost,
              status: s.status
            };
          }));
        }
        if (d.gradesLog) {
          setGradesLog(d.gradesLog.map(g => ({
            id: g.id,
            student: g.studentName || 'Tunde',
            title: g.title,
            score: g.grade?.score || 0,
            feedback: g.grade?.feedback || "",
            date: g.grade?.date || "3 days ago"
          })));
        }
        if (d.pendingAssignments) {
            setPendingAssignments(d.pendingAssignments);
          }
      }

      // Check onboarding status if user is a teacher
      if (currentUser && currentUser.role === 'Teacher') {
        try {
          const profileRes = await fetch(`${API_BASE}/teachers/${currentUser.uid}`, {
            headers: getAuthHeaders()
          });
          if (profileRes.ok) {
            const data = await profileRes.json();
            if (data.status === 'onboarding') {
              setIsTutorOnboarding(true);
            } else {
              setIsTutorOnboarding(false);
            }
          }
        } catch (e) {
          console.warn("Failed to check onboarding status from API");
        }
      } else {
        setIsTutorOnboarding(false);
      }
    } catch (err) {
      console.warn("Backend API offline, using local states: ", err);
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/${currentUser.uid}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const unread = data.filter(n => !n.read);
        if (unread.length > prevUnreadCountRef.current && unread.length > 0) {
          const newest = unread[0];
          setActiveToast(newest);
          setTimeout(() => setActiveToast(null), 4000);
        }
        prevUnreadCountRef.current = unread.length;
        setNotifications(data);
      }
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/read-all/${currentUser.uid}`, { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      prevUnreadCountRef.current = 0;
    }
  }, [currentUser]);

  useEffect(() => {
    fetchInitialData();
  }, [currentUser]);

  // Check for referral code and register hit
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) {
      localStorage.setItem('edubridge_ref', ref);
      fetch(`${API_BASE}/parents/referral/hit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref })
      })
      .then(res => res.json())
      .then(data => console.log("Referral hit registered:", data))
      .catch(err => console.warn("Failed to register referral hit:", err));
    }
  }, []);

  // Handle URL path client-side routing
  useEffect(() => {
    const handleUrlCheck = () => {
      const path = window.location.pathname;
      if (path.startsWith('/teacher/')) {
        const username = path.split('/')[2];
        if (username) {
          setCurrentView('teacher_profile');
          setProfileUsername(username);
        }
      } else {
        setCurrentView('home');
        setProfileUsername('');
      }
    };

    handleUrlCheck();
    window.addEventListener('popstate', handleUrlCheck);
    return () => window.removeEventListener('popstate', handleUrlCheck);
  }, []);

  // State handlers
  const handleBookClick = (teacher) => {
    if (!currentUser) {
      setAuthTab('login');
      setIsAuthOpen(true);
      return;
    }
    setSelectedTeacherForBooking(teacher);
    setIsBookingOpen(true);
  };

  const handleBackToHome = () => {
    window.history.pushState({}, '', '/');
    setCurrentView('home');
    setProfileUsername('');
  };

  const handleTutorProfileSelect = (username) => {
    window.history.pushState({}, '', `/teacher/${username}`);
    setCurrentView('teacher_profile');
    setProfileUsername(username);
  };

  const handleOpenChat = (session) => {
    setSelectedChatSession(session);
    setIsChatOpen(true);
  };

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    setWaitlistStatus('Submitting...');
    try {
      const response = await fetch(`${API_BASE}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: waitlistName, email: waitlistEmail, role: waitlistRole })
      });
      if (response.ok) {
        setWaitlistStatus('✓ Success! You are on the waitlist.');
        setWaitlistName('');
        setWaitlistEmail('');
      } else {
        const data = await response.json();
        setWaitlistStatus(`Error: ${data.error || 'Failed to submit'}`);
      }
    } catch (err) {
      console.error('Waitlist API error:', err);
      setWaitlistStatus('✓ Success (Local Sandbox Fallback)');
      setWaitlistName('');
      setWaitlistEmail('');
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = authTab === 'login' ? '/auth/login' : '/auth/register';
    const refCode = localStorage.getItem('edubridge_ref');
    const payload = authTab === 'login' 
      ? { email: authEmail, password: authPassword } 
      : { email: authEmail, displayName: authName, role: authRole, country: authCountry, password: authPassword, referredBy: refCode || undefined };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        if (data.token) {
          localStorage.setItem('edubridge_token', data.token);
          localStorage.setItem('edubridge_user', JSON.stringify(data));
        } else {
          localStorage.setItem('edubridge_user', JSON.stringify(data));
        }
        setCurrentUser(data);
      } else {
        setAuthError(data.error || 'Something went wrong.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      // Fallback local simulation if backend offline
      if (authTab === 'login') {
        const lowerEmail = authEmail.toLowerCase();
        if (lowerEmail.includes('parent')) {
          const u = { uid: 'parent_1', displayName: 'Ngozi Adeleke', role: 'Parent', email: authEmail, country: 'Nigeria' };
          localStorage.setItem('edubridge_user', JSON.stringify(u));
          setCurrentUser(u);
        } else if (lowerEmail.includes('teacher')) {
          const u = { uid: 'teacher_1', displayName: 'Mr. Adebayo Okafor', role: 'Teacher', email: authEmail, country: 'Nigeria' };
          localStorage.setItem('edubridge_user', JSON.stringify(u));
          setCurrentUser(u);
        } else if (lowerEmail.includes('student')) {
          const u = { uid: 'student_1', displayName: 'Tunde Okafor', role: 'Student', email: authEmail };
          localStorage.setItem('edubridge_user', JSON.stringify(u));
          setCurrentUser(u);
        } else if (lowerEmail.includes('admin')) {
          const u = { uid: 'admin_1', displayName: 'System Admin', role: 'Admin', email: authEmail };
          localStorage.setItem('edubridge_user', JSON.stringify(u));
          setCurrentUser(u);
        } else {
          setAuthError('Simulated error: use parent@edubridge.com, teacher@edubridge.com, student@edubridge.com or admin@edubridge.com');
        }
      } else {
        const mockUid = `user_${Date.now()}`;
        const u = { uid: mockUid, displayName: authName, role: authRole, email: authEmail, country: authCountry };
        localStorage.setItem('edubridge_user', JSON.stringify(u));
        setCurrentUser(u);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendSupportMessage = async (e) => {
    e.preventDefault();
    if (!supportInput.trim() || supportLoading) return;

    const userMsg = { sender: 'user', text: supportInput };
    setSupportMessages(prev => [...prev, userMsg]);
    const messageToSend = supportInput;
    setSupportInput('');
    setSupportLoading(true);

    try {
      const response = await fetch(`${API_BASE}/support/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          history: supportMessages
        })
      });
      if (response.ok) {
        const data = await response.json();
        setSupportMessages(prev => [...prev, { sender: 'agent', text: data.reply }]);
      } else {
        setSupportMessages(prev => [...prev, { sender: 'agent', text: "Sorry, I am having trouble connecting to support right now." }]);
      }
    } catch (err) {
      console.error("Support API error:", err);
      setSupportMessages(prev => [...prev, { sender: 'agent', text: "Connection error. Please try again." }]);
    } finally {
      setSupportLoading(false);
    }
  };

  const handleBookingConfirm = async (costNgnMinor, slot, paymentMethod = 'wallet') => {
    try {
      if (paymentMethod === 'card') {
        const provider = 'paystack';
        const checkoutRes = await fetch(`${API_BASE}/payments/checkout`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            parentId: currentUser ? currentUser.uid : 'parent_1',
            amount: convertMinor(costNgnMinor, selectedCurrency),
            currency: selectedCurrency,
            provider
          })
        });
        if (checkoutRes.ok) {
          const data = await checkoutRes.json();
          appendTelemetryLog(`Initiating ${provider} checkout for ${formatCurrency(data.amount, data.currency)}`);
          alert(`Redirecting to ${provider} checkout: ${data.checkoutUrl}`);
          return;
        }
      }

      const response = await fetch(`${API_BASE}/sessions/book`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          teacherId: selectedTeacherForBooking.id || selectedTeacherForBooking.uid,
          teacherName: selectedTeacherForBooking.name,
          studentId: 'student_1',
          studentName: 'Tunde',
          parentId: currentUser ? currentUser.uid : 'parent_1',
          cost: costNgnMinor,
          slot
        })
      });

      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.walletBalance);
        setEscrowBalance(data.escrowBalance);
        await fetchInitialData();
        appendTelemetryLog(`Escrow Locked: ${formatCurrency(convertMinor(costNgnMinor, selectedCurrency), selectedCurrency)} secured for ${selectedTeacherForBooking.name}`);
      } else {
        const errData = await response.json();
        alert(`Booking failed: ${errData.error}`);
      }
    } catch (err) {
      console.error("Booking API error:", err);
      // Fallback local operation
      setWalletBalance(prev => prev - costNgnMinor);
      setEscrowBalance(prev => prev + costNgnMinor);
      
      const newSession = {
        teacherId: selectedTeacherForBooking.id,
        teacherName: selectedTeacherForBooking.name,
        avatar: selectedTeacherForBooking.avatar,
        subject: selectedTeacherForBooking.subjects[0] + " Class",
        slot: slot,
        cost: costNgnMinor,
        status: "Scheduled"
      };
      setBookedSessions(prev => [...prev, newSession]);
      appendTelemetryLog(`Escrow Locked (Local Fallback): ${formatCurrency(convertMinor(costNgnMinor, selectedCurrency), selectedCurrency)} secured for ${selectedTeacherForBooking.name}`);
    }
  };

  // Grading sync
  const handleGradeHomework = async (newGrade) => {
    try {
      const response = await fetch(`${API_BASE}/assignments/grade`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: newGrade.id,
          score: newGrade.score,
          feedback: newGrade.feedback
        })
      });
      if (response.ok) {
        await fetchInitialData();
      }
    } catch (err) {
      console.error("Grading API error:", err);
      setGradesLog(prev => [newGrade, ...prev]);
    }
  };

  // Wallet topup sync
  const handleTopupWallet = async (amountNgnMinor) => {
    try {
      const response = await fetch(`${API_BASE}/parents/wallet/topup`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          parentId: currentUser ? currentUser.uid : 'parent_1',
          amount: amountNgnMinor
        })
      });
      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.walletBalance);
        setEscrowBalance(data.escrowBalance);
        await fetchInitialData();
        appendTelemetryLog(`Wallet Topup: Success adding ${formatCurrency(convertMinor(amountNgnMinor, selectedCurrency), selectedCurrency)} to parent wallet.`);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Wallet topup API error:", err);
      setWalletBalance(prev => prev + amountNgnMinor);
      appendTelemetryLog(`Wallet Topup (Local Fallback): Success adding ${formatCurrency(convertMinor(amountNgnMinor, selectedCurrency), selectedCurrency)}.`);
      return true;
    }
  };

  // Complete session escrow release logic
  const handleEndSession = async (session, ratingScore, commentText) => {
    const releaseCost = session.cost;
    try {
      const response = await fetch(`${API_BASE}/sessions/end`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sessionId: session.id,
          rating: ratingScore,
          comment: commentText
        })
      });

      if (response.ok) {
        await fetchInitialData();
        const commissionMinor = Math.round(releaseCost * 0.15);
        const payoutMinor = releaseCost - commissionMinor;
        appendTelemetryLog(`Escrow Released: ${formatCurrency(convertMinor(releaseCost, selectedCurrency), selectedCurrency)} settled. Commission: ${formatCurrency(convertMinor(commissionMinor, selectedCurrency), selectedCurrency)} (15% platform tier). Payout: ${formatCurrency(convertMinor(payoutMinor, selectedCurrency), selectedCurrency)} routed to ${session.teacherName} bank wallet.`);
      } else {
        const errData = await response.json();
        alert(`Failed to complete session: ${errData.error}`);
      }
    } catch (err) {
      console.error("End session API error:", err);
      // Fallback local operation
      setEscrowBalance(prev => Math.max(0, prev - releaseCost));
      
      const commissionMinor = Math.round(releaseCost * 0.15);
      const payoutMinor = releaseCost - commissionMinor;
      appendTelemetryLog(`Escrow Released (Local Fallback): ${formatCurrency(convertMinor(releaseCost, selectedCurrency), selectedCurrency)} settled.`);

      // Add review to the teacher
      setTeachers(prev => prev.map(t => {
        if (t.id === session.teacherId || t.uid === session.teacherId) {
          const updatedReviews = [...t.reviews, { parent: "Parent", text: commentText, score: ratingScore }];
          const newRating = parseFloat((updatedReviews.reduce((sum, r) => sum + r.score, 0) / updatedReviews.length).toFixed(1));
          return {
            ...t,
            reviews: updatedReviews,
            reviewsCount: t.reviewsCount + 1,
            rating: newRating
          };
        }
        return t;
      }));

      // Remove from scheduled sessions
      setBookedSessions(prev => prev.filter(s => !(s.teacherId === session.teacherId && s.slot.day === session.slot.day && s.slot.time === session.slot.time)));
    }
  };

  // Badge certified trigger from Academy module quiz correct submission
  const handleUnlockBadge = async (badgeName) => {
    try {
      const response = await fetch(`${API_BASE}/academy/submit-quiz`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: 'teacher_1',
          moduleId: 1,
          answer: 0
        })
      });

      if (response.ok) {
        await fetchInitialData();
        appendTelemetryLog(`Vetting Log: Teacher Adebayo Okafor earned 'AI-Certified' Badge. Platform placement priority boosted.`);
      }
    } catch (err) {
      console.error("Unlock badge API error:", err);
      // Fallback local operation
      setTeachers(prev => prev.map(t => {
        if ((t.id === 1 || t.uid === 'teacher_1') && !t.badges.includes(badgeName)) {
          return {
            ...t,
            badges: [...t.badges, badgeName]
          };
        }
        return t;
      }));
      appendTelemetryLog(`Vetting Log: Teacher Adebayo Okafor earned 'AI-Certified' Badge (Local Fallback).`);
    }
  };

  // Telemetry updates handler
  const [telemetryLogs, setTelemetryLogs] = useState([
    "Security check: standard biometric verification systems online.",
    "Database Sync: Paystack module ready."
  ]);
  const appendTelemetryLog = (logText) => {
    setTelemetryLogs(prev => [logText, ...prev]);
  };

  // Scroll header morph
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // GSAP hero entrances
  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo('.hero-fade',
        { y: 45, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.3, stagger: 0.12, ease: "power3.out" }
      );
    });
    return () => ctx.revert();
  }, []);

  // GSAP trust section scroll entrances
  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo('.trust-fade',
        { y: 35, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: '.trust-section',
            start: "top 80%",
            toggleActions: "play none none none"
          }
        }
      );
    });
    return () => ctx.revert();
  }, []);

  // Protocol pin ScrollTrigger stacks
  useEffect(() => {
    let ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.protocol-stack');
      if (cards.length === 0) return;

      // Position cards 1 and 2 below card 0 initially
      gsap.set(cards.slice(1), { yPercent: 100 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#protocol',
          start: 'top top',
          end: () => `+=${window.innerHeight * 2}`,
          pin: true,
          scrub: true,
          anticipatePin: 1
        }
      });

      // Animate Card 1 sliding up over Card 0
      tl.to(cards[1], {
        yPercent: 0,
        ease: 'none',
        duration: 1
      });
      tl.to(cards[0], {
        scale: 0.9,
        filter: 'blur(10px)',
        opacity: 0.55,
        ease: 'none',
        duration: 1
      }, '<');

      // Animate Card 2 sliding up over Card 1
      tl.to(cards[2], {
        yPercent: 0,
        ease: 'none',
        duration: 1
      });
      tl.to(cards[1], {
        scale: 0.9,
        filter: 'blur(10px)',
        opacity: 0.55,
        ease: 'none',
        duration: 1
      }, '<');

    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="relative min-h-screen bg-brand-cream text-brand-charcoal overflow-x-hidden selection:bg-brand-clay selection:text-white">
      
      {/* Static Header Navbar */}
      <nav className="w-full bg-brand-charcoal text-white py-4 px-6 md:px-12 border-b border-brand-cream/10 z-50 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-heading font-extrabold bg-brand-cream text-brand-moss">
              EB
            </div>
            <span className="font-heading font-bold tracking-tight text-lg text-white">EduBridge Africa</span>
          </div>
          
          {currentUser && (
            <div className="hidden lg:flex items-center gap-6 font-sans font-semibold text-xs uppercase tracking-wider text-white/80">
              {currentUser.role === 'Parent' && (
                <a href="#marketplace" className="hover:text-brand-clay transition-colors hover-lift">{t('navFindTeachers')}</a>
              )}
              {currentUser.role === 'Teacher' && (
                <a href="#academy" className="hover:text-brand-clay transition-colors hover-lift">{t('navAcademy')}</a>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            {/* Multilingual Selector */}
            <div className="flex items-center gap-1.5">
              <span className="hidden lg:inline font-mono text-[9px] font-bold uppercase tracking-wider text-white/65">
                Lang:
              </span>
              <div className="flex items-center bg-black/15 border border-white/10 rounded-full p-1 select-none">
                <div className="hidden sm:flex items-center">
                  {[
                    { code: 'en', label: 'EN' },
                    { code: 'fr', label: 'FR' },
                    { code: 'sw', label: 'SW' }
                  ].map(item => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setLang(item.code)}
                      className={`py-1 px-2.5 rounded-full font-mono text-[9px] font-bold tracking-wider transition-all duration-300 ${
                        lang === item.code
                          ? 'bg-brand-cream text-brand-moss shadow-sm'
                          : 'text-white/70 hover:bg-white/5'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="flex sm:hidden bg-transparent text-[10px] font-bold outline-none border-none py-0.5 px-1.5 cursor-pointer text-white"
                >
                  <option value="en" className="text-black">EN</option>
                  <option value="fr" className="text-black">FR</option>
                  <option value="sw" className="text-black">SW</option>
                </select>
              </div>
            </div>

            {/* Multi-currency Selector */}
            <div className="flex items-center gap-2">
              <span className="hidden md:inline font-mono text-[9px] font-bold uppercase tracking-wider text-white/65">
                {t('chooseCurrency')}
              </span>
              <div className="flex items-center bg-black/15 border border-white/10 rounded-full p-1 select-none">
                <div className="hidden md:flex items-center">
                  {['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'CAD'].map(curr => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setSelectedCurrency(curr)}
                      className={`py-1 px-2.5 rounded-full font-mono text-[9px] font-bold tracking-wider transition-all duration-300 ${
                        selectedCurrency === curr
                          ? 'bg-brand-cream text-brand-moss shadow-sm'
                          : 'text-white/70 hover:bg-white/5'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="flex md:hidden bg-transparent text-[10px] font-bold outline-none border-none py-0.5 px-1.5 cursor-pointer text-white"
                >
                  {['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'CAD'].map(curr => (
                    <option key={curr} value={curr} className="text-black">{curr}</option>
                  ))}
                </select>
              </div>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-3">
                {/* Notification Bell Icon */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                    className="p-2 rounded-full relative transition-colors text-white hover:bg-white/10"
                  >
                    <Bell className="w-4.5 h-4.5" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-clay rounded-full border border-white animate-pulse" />
                    )}
                  </button>
                  
                  {/* Notifications Dropdown */}
                  {showNotificationsDropdown && (
                    <div className="absolute right-0 mt-3 w-80 bg-white border border-brand-moss/10 rounded-[1.5rem] p-4 shadow-xl z-50 animate-fade-in text-brand-charcoal">
                      <div className="flex justify-between items-center border-b border-brand-moss/5 pb-2 mb-3">
                        <span className="font-heading font-bold text-xs text-brand-moss">Notifications</span>
                        {notifications.filter(n => !n.read).length > 0 && (
                          <button 
                            onClick={handleMarkAllNotificationsRead}
                            className="font-mono text-[9px] uppercase tracking-wider text-brand-clay font-bold hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                        {notifications.length === 0 ? (
                          <div className="text-center font-sans text-brand-charcoal/40 text-[10px] py-6">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              onClick={() => handleMarkNotificationRead(notif.id)}
                              className="p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer hover:bg-brand-cream/20 bg-brand-moss/5 border-brand-moss/10 hover:border-brand-moss/20 font-medium"
                            >
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <span className="font-heading text-2xs text-brand-moss font-bold">{notif.title}</span>
                                <span className="font-mono text-[8px] text-brand-charcoal/40 uppercase">
                                  {notif.type.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="font-sans text-[10px] text-brand-charcoal/80 leading-relaxed">
                                {notif.body}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-[10px] font-bold text-white">
                    {currentUser.displayName}
                  </span>
                  <span className="text-[8px] font-mono opacity-70 uppercase tracking-widest text-brand-clay">
                    {currentUser.role}
                  </span>
                </div>

                {currentUser.role === 'Teacher' && (
                  <a 
                    href="#academy" 
                    className="btn-magnetic bg-brand-clay hover:bg-brand-clay/90 text-white font-sans text-[10px] uppercase tracking-wider font-bold py-2 px-4 rounded-full flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    Academy Enrollment
                  </a>
                )}

                <button
                  onClick={() => {
                    localStorage.removeItem('edubridge_user');
                    localStorage.removeItem('edubridge_token');
                    setCurrentUser(null);
                  }}
                  className="btn-magnetic font-sans text-[10px] uppercase tracking-wider font-bold py-2 px-4 rounded-full border bg-brand-cream border-brand-cream text-brand-moss hover:bg-brand-clay hover:border-brand-clay hover:text-white"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setAuthTab('login');
                    setIsAuthOpen(true);
                  }}
                  className="btn-magnetic font-sans text-[10px] uppercase tracking-wider font-bold py-2 px-4 rounded-full border border-white/20 text-white hover:bg-white/10"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setAuthTab('register');
                    setIsAuthOpen(true);
                  }}
                  className="btn-magnetic font-sans text-[10px] uppercase tracking-wider font-bold py-2 px-4 rounded-full bg-brand-clay text-white hover:bg-brand-clay/90"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {currentUser ? (
        currentView === 'teacher_profile' ? (
          <TeacherPublicProfile 
            username={profileUsername}
            onBack={handleBackToHome}
            onBookClick={handleBookClick}
            selectedCurrency={selectedCurrency}
            formatCurrency={formatCurrency}
            convertMinor={convertMinor}
          />
        ) : isTutorOnboarding ? (
          <TeacherOnboarding 
            currentUser={currentUser}
            onComplete={(profile) => {
              setIsTutorOnboarding(false);
              fetchInitialData();
              alert("Application submitted successfully! Your account status is now Pending Approval.");
            }}
          />
        ) : (
          <div className="py-6 min-h-[75vh]">
            {currentUser.role === 'Admin' ? (
              <AdminDashboard
                currentUser={currentUser}
                selectedCurrency={selectedCurrency}
                formatCurrency={formatCurrency}
                convertMinor={convertMinor}
              />
            ) : currentUser.role === 'Teacher' ? (
              <TeacherDashboard
                currentUser={currentUser}
                selectedCurrency={selectedCurrency}
                formatCurrency={formatCurrency}
                convertMinor={convertMinor}
                onOpenChat={handleOpenChat}
                onGradeHomework={handleGradeHomework}
                gradesLog={gradesLog}
              />
            ) : currentUser.role === 'Student' ? (
              <StudentPortal
                currentUser={currentUser}
                selectedCurrency={selectedCurrency}
                formatCurrency={formatCurrency}
                convertMinor={convertMinor}
              />
            ) : (
              <ParentDashboard 
                currentUser={currentUser}
                lang={lang}
                t={t}
                selectedCurrency={selectedCurrency}
                formatCurrency={formatCurrency}
                convertMinor={convertMinor}
                gradesLog={gradesLog}
                onGradeHomework={handleGradeHomework}
                walletBalance={walletBalance}
                escrowBalance={escrowBalance}
                bookedSessions={bookedSessions}
                onOpenChat={handleOpenChat}
                pendingAssignments={pendingAssignments}
                onTopupWallet={handleTopupWallet}
                teachers={teachers}
                onBookClick={handleBookClick}
                onTeacherSelect={handleTutorProfileSelect}
              />
            )}
          </div>
        )
      ) : (
        currentView === 'teacher_profile' ? (
          <TeacherPublicProfile 
            username={profileUsername}
            onBack={handleBackToHome}
            onBookClick={handleBookClick}
            selectedCurrency={selectedCurrency}
            formatCurrency={formatCurrency}
            convertMinor={convertMinor}
          />
        ) : (
        <>
          {/* Cinematic opening shot Hero */}
      <section className="relative h-[95dvh] w-full overflow-hidden flex items-end justify-start md:justify-end pb-20 px-6 md:px-16 lg:px-24">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal via-brand-moss/80 to-transparent mix-blend-multiply opacity-95" />

        <div className="relative z-10 max-w-4xl text-left md:text-right flex flex-col items-start md:items-end">
          <h1 className="hero-fade font-heading font-bold text-white text-4xl sm:text-5xl md:text-7xl leading-[1.05] tracking-tight mb-4">
            {t('heroTitleFirst')} <br />
            <span className="hero-fade font-drama italic font-light text-brand-clay text-6xl sm:text-7xl md:text-9xl tracking-normal block mt-2">
              {t('heroTitleSecond')}
            </span>
          </h1>

          <p className="hero-fade font-sans font-light text-brand-cream/80 text-base sm:text-lg md:text-xl max-w-xl md:ml-auto mb-8 leading-relaxed">
            {t('heroSubText')}
          </p>

          <div className="hero-fade flex flex-col sm:flex-row gap-4 justify-start md:justify-end w-full">
            <a 
              href="#marketplace"
              className="btn-magnetic group font-sans font-bold text-xs uppercase tracking-wider bg-brand-clay text-white px-8 py-4 rounded-full shadow-lg shadow-brand-clay/20 flex items-center justify-center gap-2"
            >
              <span>{t('exploreMarketplace')}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a 
              href="#session-engine" 
              className="btn-magnetic font-sans font-bold text-xs uppercase tracking-wider bg-brand-cream/10 backdrop-blur-sm text-brand-cream border border-brand-cream/30 hover:bg-brand-cream hover:text-brand-charcoal px-8 py-4 rounded-full"
            >
              {t('simulateLiveClass')}
            </a>
          </div>
        </div>
      </section>

      {/* Vetting Trust Manifesto Section */}
      <section className="bg-brand-moss text-brand-cream py-24 px-6 md:px-16 lg:px-24 border-y border-brand-cream/10 relative overflow-hidden trust-section">
        {/* Subtle decorative glowing background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-clay/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <h2 className="trust-fade font-heading font-bold text-4xl sm:text-5xl md:text-6xl text-white leading-[1.15] tracking-tight max-w-3xl">
            Your child deserves a teacher <br />
            <span className="font-drama italic text-brand-clay font-light text-5xl sm:text-6xl md:text-7xl block mt-3">
              you can trust completely.
            </span>
          </h2>
          
          <p className="trust-fade font-sans font-light text-brand-cream/80 text-base sm:text-lg md:text-xl max-w-3xl mt-8 leading-relaxed">
            EduBridge Africa connects you with rigorously verified African educators for private online and in-home tutoring. Every session is time-clocked, payment-protected, and progress-tracked — so you see exactly what your child is learning.
          </p>

          <div className="trust-fade flex flex-col sm:flex-row gap-4 justify-center items-center w-full mt-10">
            <a 
              href="#marketplace"
              className="btn-magnetic group font-sans font-bold text-xs uppercase tracking-wider bg-brand-clay text-white px-8 py-4 rounded-full shadow-lg shadow-brand-clay/20 flex items-center justify-center gap-2 hover:bg-brand-clay/90"
            >
              <span>Find a Teacher Now →</span>
            </a>
            <a 
              href="#protocol" 
              className="btn-magnetic font-sans font-bold text-xs uppercase tracking-wider bg-white text-brand-moss hover:bg-brand-cream/90 px-8 py-4 rounded-full transition-colors"
            >
              Watch How It Works
            </a>
          </div>

          <div className="trust-fade my-8 flex justify-center">
            <a href="#marketplace" className="w-12 h-12 rounded-full border border-white/20 hover:border-brand-clay hover:text-brand-clay transition-all duration-300 flex items-center justify-center text-white/60 animate-bounce">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </a>
          </div>

          <div className="trust-fade flex flex-wrap items-center justify-center gap-8 sm:gap-16 text-3xl sm:text-4xl md:text-5xl font-heading font-extrabold tracking-tight mt-4 select-none">
            <span className="text-brand-clay font-drama">4,200+</span>
            <span className="text-white font-drama italic font-light">98 countries</span>
            <span className="text-brand-clay">4.9★</span>
          </div>

          {/* Parent Testimonials Section */}
          <div className="trust-fade mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 text-left w-full max-w-5xl mx-auto">
            {/* Testimonial 1 */}
            <div className="bg-white text-brand-charcoal rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between hover-lift">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-moss text-brand-cream flex items-center justify-center font-heading font-extrabold text-sm shrink-0">
                    NG
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-brand-moss text-base leading-snug">Ngozi A. — Lagos, Nigeria</h4>
                    <div className="flex gap-0.5 text-brand-clay mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </div>
                </div>
                <p className="font-sans italic text-sm text-brand-charcoal/80 leading-relaxed">
                  "Within two weeks I could see Timi’s algebra scores improving. For the first time I actually have proof of what’s being taught — the clock log, the assignments, the AI reports. Nothing like any other tutor I’ve used."
                </p>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white text-brand-charcoal rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between hover-lift">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-800 text-white flex items-center justify-center font-heading font-extrabold text-sm shrink-0">
                    DS
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-brand-moss text-base leading-snug">Damilola S. — London, UK</h4>
                    <div className="flex gap-0.5 text-brand-clay mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </div>
                </div>
                <p className="font-sans italic text-sm text-brand-charcoal/80 leading-relaxed">
                  "I pay in GBP from London. Zara’s teacher is in Lagos. Every session I can see the clock log — exactly how long they taught, what was covered. No other platform gives diaspora parents this level of control."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fears & Solutions Grid Section */}
      <section className="py-24 px-6 md:px-16 lg:px-24 bg-brand-cream/40 border-b border-brand-moss/10">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-brand-clay font-bold block mb-3">Addressing Objections</span>
            <h2 className="font-heading font-bold text-3xl sm:text-5xl text-brand-moss tracking-tight">
              Fears & Solutions
            </h2>
            <p className="font-sans text-brand-charcoal/70 mt-3 text-sm">
              We understand the hesitation of hiring online. Here is how EduBridge protects you and your child.
            </p>
          </div>

          {/* Fear #1 */}
          <div className="bg-white border border-brand-moss/10 rounded-[2rem] p-6 shadow-sm hover-lift flex flex-col md:flex-row gap-6">
            <div className="flex-1 bg-rose-50/50 border-l-4 border-rose-500 p-5 rounded-r-[1.5rem]">
              <span className="font-mono text-xs uppercase tracking-wider text-rose-500 font-bold block mb-1">FEAR #1</span>
              <p className="font-sans font-bold text-brand-charcoal text-sm leading-relaxed">
                "The tutor disappeared after 3 sessions — I had already paid in advance."
              </p>
            </div>
            <div className="flex-1 bg-emerald-50/60 border-l-4 border-emerald-500 p-5 rounded-r-[1.5rem]">
              <span className="font-mono text-xs uppercase tracking-wider text-emerald-600 font-bold block mb-1">EDUBRIDGE SOLUTION</span>
              <p className="font-sans text-brand-charcoal/90 text-sm leading-relaxed">
                Payments are held in escrow until after each session is confirmed. You never pre-pay for future lessons. Your money is always protected.
              </p>
            </div>
          </div>

          {/* Fear #2 */}
          <div className="bg-white border border-brand-moss/10 rounded-[2rem] p-6 shadow-sm hover-lift flex flex-col md:flex-row gap-6">
            <div className="flex-1 bg-rose-50/50 border-l-4 border-rose-500 p-5 rounded-r-[1.5rem]">
              <span className="font-mono text-xs uppercase tracking-wider text-rose-500 font-bold block mb-1">FEAR #2</span>
              <p className="font-sans font-bold text-brand-charcoal text-sm leading-relaxed">
                "I have no idea if my child is actually learning anything between sessions."
              </p>
            </div>
            <div className="flex-1 bg-emerald-50/60 border-l-4 border-emerald-500 p-5 rounded-r-[1.5rem]">
              <span className="font-mono text-xs uppercase tracking-wider text-emerald-600 font-bold block mb-1">EDUBRIDGE SOLUTION</span>
              <p className="font-sans text-brand-charcoal/90 text-sm leading-relaxed">
                Your parent dashboard shows real-time attendance, graded assignments, score trends, and AI-generated weekly progress reports — in plain language.
              </p>
            </div>
          </div>

          {/* Fear #3 */}
          <div className="bg-white border border-brand-moss/10 rounded-[2rem] p-6 shadow-sm hover-lift flex flex-col md:flex-row gap-6">
            <div className="flex-1 bg-rose-50/50 border-l-4 border-rose-500 p-5 rounded-r-[1.5rem]">
              <span className="font-mono text-xs uppercase tracking-wider text-rose-500 font-bold block mb-1">FEAR #3</span>
              <p className="font-sans font-bold text-brand-charcoal text-sm leading-relaxed">
                "How do I know this person is actually qualified and safe to teach my child?"
              </p>
            </div>
            <div className="flex-1 bg-emerald-50/60 border-l-4 border-emerald-500 p-5 rounded-r-[1.5rem]">
              <span className="font-mono text-xs uppercase tracking-wider text-emerald-600 font-bold block mb-1">EDUBRIDGE SOLUTION</span>
              <p className="font-sans text-brand-charcoal/90 text-sm leading-relaxed">
                Every educator undergoes double-ID validation, academic background verification, and a mandatory 4-week pedagogical vetting process before their profile goes live.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding Pipeline Section */}
      <section className="py-24 px-6 md:px-16 lg:px-24 bg-brand-cream text-brand-charcoal border-b border-brand-moss/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Left Column: Timeline Stepper */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-28">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-brand-clay font-bold block mb-3">FOR PARENTS</span>
              <h2 className="font-heading font-bold text-3xl sm:text-5xl text-brand-moss leading-[1.15] tracking-tight">
                From search to first <br />
                lesson in under 10 minutes.
              </h2>
              <p className="font-sans text-brand-charcoal/70 mt-6 text-base leading-relaxed">
                No agency middlemen. No upfront deposits. No uncertainty. Just a qualified, verified teacher ready to help your child.
              </p>
            </div>

            {/* Stepper Steps */}
            <div className="space-y-8 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-[2px] before:bg-brand-moss/10">
              {/* Step 1 */}
              <div className="flex gap-6 relative">
                <div className="w-12 h-12 rounded-full bg-brand-moss text-brand-cream border border-brand-moss/20 flex items-center justify-center font-heading font-extrabold text-sm shrink-0 z-10">
                  1
                </div>
                <div className="space-y-1 mt-1">
                  <h4 className="font-heading font-bold text-brand-moss text-lg">Search with confidence</h4>
                  <p className="font-sans text-brand-charcoal/70 text-sm leading-relaxed">
                    Filter by subject, curriculum (WAEC, JAMB, IGCSE, Cambridge, IB), price, rating, and availability. Every teacher you see has been verified — you cannot find an unverified teacher on EduBridge.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6 relative">
                <div className="w-12 h-12 rounded-full bg-brand-moss text-brand-cream border border-brand-moss/20 flex items-center justify-center font-heading font-extrabold text-sm shrink-0 z-10">
                  2
                </div>
                <div className="space-y-1 mt-1">
                  <h4 className="font-heading font-bold text-brand-moss text-lg">Book a risk-free trial lesson</h4>
                  <p className="font-sans text-brand-charcoal/70 text-sm leading-relaxed">
                    Your first lesson is protected by our full money-back guarantee. Pay securely via Paystack. Your payment is held in escrow — released only after the session is confirmed.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6 relative">
                <div className="w-12 h-12 rounded-full bg-brand-moss text-brand-cream border border-brand-moss/20 flex items-center justify-center font-heading font-extrabold text-sm shrink-0 z-10">
                  3
                </div>
                <div className="space-y-1 mt-1">
                  <h4 className="font-heading font-bold text-brand-moss text-lg">Watch your child grow — live</h4>
                  <p className="font-sans text-brand-charcoal/70 text-sm leading-relaxed">
                    After every session, check the clock log, view assignments, read the teacher's session notes, and see your AI-generated progress report. Your parent dashboard never leaves you guessing.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <a 
                href="#marketplace"
                className="btn-magnetic group font-sans font-bold text-xs uppercase tracking-wider bg-brand-clay text-white px-8 py-4 rounded-full shadow-lg shadow-brand-clay/20 flex items-center justify-center gap-2 hover:bg-brand-clay/90 w-fit"
              >
                <span>Find a Teacher Now</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* Right Column: Detailed Cards */}
          <div className="lg:col-span-7 space-y-8">
            {/* Card A: Session Clock */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-8 shadow-sm flex items-start gap-5 hover-lift">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                <Activity className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-xl text-brand-moss">Session Clock — to the second.</h3>
                <p className="font-sans text-brand-charcoal/70 text-sm leading-relaxed">
                  The live clock starts when both your child and the teacher join, pauses if either disconnects, and stops the moment the session ends. You are billed only for time actually taught. Every second is logged.
                </p>
              </div>
            </div>

            {/* Card B: Live Progress Dashboard */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-8 shadow-sm flex items-start gap-5 hover-lift">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-xl text-brand-moss">Live Progress Dashboard</h3>
                <p className="font-sans text-brand-charcoal/70 text-sm leading-relaxed">
                  See attendance rate, assignment scores, grade trends over time, and teacher session notes — all in one parent dashboard. The AI generates a plain-English weekly report every Monday morning.
                </p>
              </div>
            </div>

            {/* Card C: Escrow Payment Protection */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-8 shadow-sm flex items-start gap-5 hover-lift">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-xl text-brand-moss">Escrow Payment Protection</h3>
                <p className="font-sans text-brand-charcoal/70 text-sm leading-relaxed">
                  Your payment is held and released to the teacher only after the session is completed and confirmed. You can never lose money to a no-show or disappearing tutor again.
                </p>
              </div>
            </div>

            {/* Money-Back Guarantee highlighted card */}
            <div className="bg-brand-moss text-brand-cream border border-brand-cream/10 rounded-[2.5rem] p-8 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-clay/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3 mb-3 text-brand-clay">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span className="font-mono text-2xs uppercase tracking-widest font-extrabold">EduBridge Guarantee</span>
              </div>
              <h3 className="font-heading font-bold text-2xl text-white mb-2 uppercase tracking-tight">
                Money-Back Guarantee
              </h3>
              <p className="font-sans text-brand-cream/80 text-sm leading-relaxed">
                Not satisfied after your first lesson? Full refund, no questions asked. No forms to fill. Your risk is zero.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Teacher Quality Standards Section */}
      <section className="py-24 px-6 md:px-16 lg:px-24 bg-white border-b border-brand-moss/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono text-xs uppercase tracking-widest text-brand-clay font-bold block mb-3">THE EDUBRIDGE STANDARD</span>
            <h2 className="font-heading font-bold text-3xl sm:text-5xl text-brand-moss tracking-tight leading-tight">
              Not just any teacher. <br className="hidden sm:inline" />
              <span className="font-drama italic text-brand-clay font-light text-4xl sm:text-6xl block mt-2">The right teacher.</span>
            </h2>
            <p className="font-sans text-brand-charcoal/70 mt-6 max-w-xl mx-auto text-base leading-relaxed">
              We accept fewer than 1 in 5 teacher applicants. Every educator who reaches your child has passed our full verification stack.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Identity Verified */}
            <div className="bg-brand-cream/30 border border-brand-moss/5 rounded-[2.5rem] p-8 shadow-sm flex items-start gap-5 hover-lift">
              <div className="w-12 h-12 rounded-2xl bg-brand-moss/5 border border-brand-moss/10 flex items-center justify-center shrink-0 text-brand-moss">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-xl text-brand-moss">Identity Verified</h3>
                <p className="font-sans text-brand-charcoal/70 text-sm leading-relaxed">
                  Government-issued ID confirmed by our admin team before any profile goes live.
                </p>
              </div>
            </div>

            {/* Credentials Checked */}
            <div className="bg-brand-cream/30 border border-brand-moss/5 rounded-[2.5rem] p-8 shadow-sm flex items-start gap-5 hover-lift">
              <div className="w-12 h-12 rounded-2xl bg-brand-moss/5 border border-brand-moss/10 flex items-center justify-center shrink-0 text-brand-moss">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-xl text-brand-moss">Credentials Checked</h3>
                <p className="font-sans text-brand-charcoal/70 text-sm leading-relaxed">
                  Degree certificates, teaching qualifications and professional licences reviewed by hand.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Parent Stories Section */}
      <section className="py-24 px-6 md:px-16 lg:px-24 bg-brand-cream/30 border-b border-brand-moss/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="font-mono text-xs uppercase tracking-widest text-brand-clay font-bold block mb-3">PARENT STORIES</span>
            <h2 className="font-heading font-bold text-3xl sm:text-5xl text-brand-moss tracking-tight">
              What parents say after the first month.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Story 1 */}
            <div className="bg-white border border-emerald-500/20 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between hover-lift relative overflow-hidden">
              {/* Giant quote mark icon in background */}
              <div className="absolute top-4 right-6 text-brand-moss/5 font-serif text-9xl leading-none pointer-events-none select-none">“</div>
              <div className="space-y-6 relative z-10">
                <div className="flex gap-0.5 text-brand-clay">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <p className="font-sans italic text-sm sm:text-base text-brand-charcoal/85 leading-relaxed">
                  "I have tried two other platforms and three Facebook tutors. EduBridge is the only one where I actually feel in control. The dashboard shows me everything. I do not have to chase the teacher for updates."
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-brand-moss/5">
                  <div className="w-10 h-10 rounded-full bg-brand-moss text-brand-cream flex items-center justify-center font-heading font-extrabold text-xs">
                    NA
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-brand-moss text-sm">Ngozi A.</h4>
                    <p className="font-sans text-brand-charcoal/55 text-xs">Lagos - JSS3 Maths</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Story 2 */}
            <div className="bg-white border border-emerald-500/20 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between hover-lift relative overflow-hidden">
              <div className="absolute top-4 right-6 text-brand-moss/5 font-serif text-9xl leading-none pointer-events-none select-none">“</div>
              <div className="space-y-6 relative z-10">
                <div className="flex gap-0.5 text-brand-clay">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <p className="font-sans italic text-sm sm:text-base text-brand-charcoal/85 leading-relaxed">
                  "My daughter moved from D to B in IGCSE Chemistry in 8 weeks. But what I value most is the trust. I know who is teaching her, I see how long, I see the homework. EduBridge gave me that transparency."
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-brand-moss/5">
                  <div className="w-10 h-10 rounded-full bg-brand-moss text-brand-cream flex items-center justify-center font-heading font-extrabold text-xs">
                    DS
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-brand-moss text-sm">Damilola S.</h4>
                    <p className="font-sans text-brand-charcoal/55 text-xs">London - IGCSE Chemistry</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Find Teachers Component */}
      <Marketplace 
        teachers={teachers} 
        selectedCurrency={selectedCurrency} 
        onBookClick={handleBookClick}
        formatCurrency={formatCurrency}
        convertMinor={convertMinor}
        onTeacherSelect={handleTutorProfileSelect}
      />



      {/* Live Session Classroom Sandbox */}
      <SessionEngine 
        bookedSessions={bookedSessions} 
        onEndSession={handleEndSession}
        escrowBalance={escrowBalance}
        formatCurrency={formatCurrency}
        selectedCurrency={selectedCurrency}
        convertMinor={convertMinor}
      />
      {/* AI Academy */}
      <Academy 
        currentUser={currentUser}
        selectedCurrency={selectedCurrency}
        formatCurrency={formatCurrency}
        convertMinor={convertMinor}
        onUnlockBadge={handleUnlockBadge}
        onRegisterClick={() => {
          setAuthTab('register');
          setIsAuthOpen(true);
        }}
      />

      {/* Manifesto */}
      <section id="manifesto" className="relative py-32 bg-brand-charcoal text-brand-cream overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1545167622-3a6ac756afa4?q=80&w=1600&auto=format&fit=crop')` }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <p className="font-heading text-lg sm:text-2xl text-brand-cream/60 tracking-wide uppercase mb-12">
            Most teacher marketplaces focus on: check-the-box profiles.
          </p>
          <div className="h-px w-24 bg-brand-cream/15 mx-auto mb-12" />
          <h2 className="font-drama italic text-3xl sm:text-6xl md:text-7xl leading-tight text-white font-light">
            We focus on: verified <span className="text-brand-clay not-italic font-heading font-bold">pedagogical mastery.</span>
          </h2>
        </div>
      </section>

      {/* Stacking protocol cards */}
      <section id="protocol" className="relative bg-brand-moss text-brand-cream min-h-screen flex flex-col justify-between py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 w-full mb-8">
          <h2 className="font-heading font-bold text-3xl sm:text-5xl tracking-tight text-white mb-2">
            The Vetting Protocol
          </h2>
        </div>

        <div className="relative flex-1 w-full max-w-6xl mx-auto px-6 min-h-[70vh]">
          {/* Card 1 */}
          <div className="protocol-stack absolute inset-0 flex items-center justify-center">
            <div className="bg-brand-charcoal border border-brand-cream/10 rounded-[3rem] w-full p-8 md:p-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
              <div className="space-y-6">
                <span className="font-mono text-xs text-brand-clay tracking-widest block">01 // VERIFICATION</span>
                <h3 className="font-heading font-bold text-3xl sm:text-5xl text-white">Biometric Vetting & IDs</h3>
                <p className="font-sans text-brand-cream/70 text-base leading-relaxed">
                  We authenticate state IDs, university degree credentials, and perform background vetting sweeps.
                </p>
              </div>
              <div className="flex items-center justify-center h-full min-h-[300px]">
                <div className="relative w-64 h-64 flex items-center justify-center">
                  <div className="absolute inset-0 border-2 border-dashed border-brand-clay/30 rounded-full animate-[spin_20s_linear_infinite]" />
                  <div className="absolute w-48 h-48 border border-brand-cream/20 rounded-full flex items-center justify-center animate-[spin_12s_linear_infinite_reverse]">
                    <div className="w-full h-1 border-t border-brand-clay/40" />
                  </div>
                  <div className="absolute w-32 h-32 border border-brand-clay/35 rounded-full flex items-center justify-center animate-pulse-slow">
                    <div className="w-16 h-16 rounded-full bg-brand-clay/10 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-brand-clay" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="protocol-stack absolute inset-0 flex items-center justify-center">
            <div className="bg-brand-charcoal border border-brand-cream/10 rounded-[3rem] w-full p-8 md:p-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
              <div className="space-y-6">
                <span className="font-mono text-xs text-brand-clay tracking-widest block">02 // INSTRUCTION</span>
                <h3 className="font-heading font-bold text-3xl sm:text-5xl text-white">Elite Teachers Academy</h3>
                <p className="font-sans text-brand-cream/70 text-base leading-relaxed">
                  Teachers undergo training modules focusing on deploying AI tools in the classroom and modern teaching methodologies.
                </p>
              </div>
              <div className="flex items-center justify-center h-full min-h-[300px] w-full">
                <div className="relative w-64 h-48 bg-brand-moss/10 border border-brand-cream/10 rounded-2xl overflow-hidden flex flex-col justify-between p-4">
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-2 p-4 opacity-20 pointer-events-none">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-cream mx-auto my-auto" />
                    ))}
                  </div>
                  <div 
                    className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-clay to-transparent shadow-lg shadow-brand-clay animate-[scan_4s_ease-in-out_infinite]"
                    style={{
                      boxShadow: '0 0 10px #CC5833, 0 0 20px #CC5833',
                      animation: 'scan 4s ease-in-out infinite'
                    }}
                  />
                  <div className="relative z-10 flex justify-between items-start font-mono text-[9px] text-brand-cream/40">
                    <span>VETTING: RUNNING</span>
                    <span>1.5 PRO READY</span>
                  </div>
                  <style dangerouslySetInnerHTML={{__html: `
                    @keyframes scan {
                      0%, 100% { top: 5%; }
                      50% { top: 95%; }
                    }
                  `}} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="protocol-stack absolute inset-0 flex items-center justify-center">
            <div className="bg-brand-charcoal border border-brand-cream/10 rounded-[3rem] w-full p-8 md:p-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
              <div className="space-y-6">
                <span className="font-mono text-xs text-brand-clay tracking-widest block">03 // SETTLEMENT</span>
                <h3 className="font-heading font-bold text-3xl sm:text-5xl text-white">Cross-Border Timed Escrows</h3>
                <p className="font-sans text-brand-cream/70 text-base leading-relaxed">
                  Locked funds are routed safely and released to localized mobile money wallets and bank cards.
                </p>
              </div>
              <div className="flex items-center justify-center h-full min-h-[300px] w-full">
                <div className="relative w-64 h-48 flex items-center justify-center bg-brand-moss/10 border border-brand-cream/10 rounded-2xl p-4 overflow-hidden">
                  <svg viewBox="0 0 200 100" className="w-full h-full">
                    <path
                      d="M0 50 L40 50 L50 30 L60 70 L70 50 L100 50 L110 20 L120 80 L130 50 L150 50"
                      fill="none"
                      stroke="#CC5833"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="ekg-path"
                    />
                  </svg>
                  <style dangerouslySetInnerHTML={{__html: `
                    .ekg-path {
                      stroke-dasharray: 400;
                      stroke-dashoffset: 400;
                      animation: ekg-draw 3s linear infinite;
                    }
                    @keyframes ekg-draw {
                      to { stroke-dashoffset: 0; }
                    }
                  `}} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 md:px-16 lg:px-24 bg-white border-b border-brand-moss/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-brand-clay font-bold block mb-3">COMMON QUESTIONS</span>
              <h2 className="font-heading font-bold text-3xl sm:text-5xl text-brand-moss leading-tight tracking-tight">
                Everything parents ask before booking.
              </h2>
              <p className="font-sans text-brand-charcoal/70 mt-6 text-sm leading-relaxed">
                Still have questions? Our team is on WhatsApp — tap the button below and we will answer in under 5 minutes.
              </p>
            </div>

            <a 
              href="https://wa.me/2340000000000" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-magnetic bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-6 rounded-full inline-flex items-center gap-2 text-xs uppercase tracking-wider text-center"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.022-.015-.078-.046-.164-.093-.086-.047-.506-.25-5.84-2.888-2.612-1.28-4.322-3.882-4.322-6.52 0-2.316 1.155-4.148 2.37-5.18.125-.106.312-.132.464-.067.153.066.862.43 1.173.61.312.18.528.328.647.532.146.25.105.782-.124 1.174-.168.288-.667.864-.81 1.05-.143.187-.29.39-.124.673.167.283.743 1.222 1.594 1.983.85.76 1.565 1.246 1.83 1.393.264.148.47.168.65-.024.18-.19.78-.903.99-1.214.21-.31.42-.26.702-.153.284.106 1.8.848 2.11 1.002.31.155.518.232.593.36.076.128.076.743-.153 1.174-.23.43-1.346 1.702-2.373 1.702-.924 0-1.89-.356-3.83-1.298-5.84-2.888-6.195-6.666-6.195-7.394 0-.728.384-1.428 1.155-2.02.772-.593.924-.67.924-.67l.154-.067c.188-.06.34-.143.43-.228.09-.085.11-.205.07-.315-.05-.144-.72-1.745-.986-2.372-.265-.628-.535-.613-.728-.613h-.624c-.212 0-.556.08-.85.4-.294.32-1.127 1.102-1.127 2.69 0 1.588 1.156 3.125 1.316 3.34.16.216 2.274 3.473 5.51 4.878 2.766 1.2 3.84 1.446 5.2 1.25 1.5-.213 3.09-1.263 3.52-2.428.43-1.164.43-2.164.3-2.37-.123-.207-.464-.326-.81-.476z"/>
              </svg>
              Chat on WhatsApp
            </a>
          </div>

          {/* Right Column Accordion */}
          <div className="lg:col-span-7 space-y-4">
            {[
              {
                q: "What if my child is not happy with the first lesson?",
                a: "Full refund on your first session with any teacher. No questions, no forms. Just let us know within 48 hours and your money is returned."
              },
              {
                q: "Can sessions be recorded?",
                a: "Yes, with consent from both teacher and parent. Recordings are stored securely and accessible for 30 days. They are automatically deleted after that. Access is private — only you and the teacher can view."
              },
              {
                q: "How do I know the teacher is really qualified?",
                a: "Every teacher on EduBridge has submitted government-issued ID and qualification documents reviewed by our admin team. They have also completed our ELITE TEACHERS ACADEMY and hold a verified badge. Fewer than 1 in 5 applicants are accepted."
              },
              {
                q: "What happens if the teacher does not show up?",
                a: "Your payment is in escrow and is never released if the session does not happen. You receive a full refund automatically within 24 hours, with no forms to fill."
              },
              {
                q: "How is the teaching time tracked? Can it be manipulated?",
                a: "The session clock is server-side — it cannot be changed by the teacher or student. It logs every second and pauses if either party disconnects. The log is available to you to review after every session."
              },
              {
                q: "Can I pay in GBP, USD, or CAD?",
                a: "Yes. Select your currency in the top navigation. We accept NGN, USD, GBP, EUR, GHS, and CAD via Paystack. Your teacher earns in their currency — you pay in yours."
              }
            ].map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div 
                  key={idx} 
                  className="bg-brand-cream/20 border border-brand-moss/10 rounded-[1.5rem] overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full text-left py-5 px-6 flex items-center justify-between gap-4 font-heading font-bold text-brand-moss text-base hover:bg-brand-cream/10 transition-colors"
                  >
                    <span>{item.q}</span>
                    <span className={`text-brand-clay font-bold text-xl transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div className="py-4 px-6 border-t border-brand-moss/5 bg-white font-sans text-sm text-brand-charcoal/80 leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* CTA Banner Section */}
      <section className="py-12 px-6 md:px-16 lg:px-24 bg-white">
        <div className="max-w-5xl mx-auto bg-brand-moss text-brand-cream rounded-[3rem] p-12 md:p-16 text-center relative overflow-hidden shadow-2xl hover-lift">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-clay/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-extrabold block">
              YOUR CHILD'S EDUCATION IS NOT SOMETHING TO LEAVE TO CHANCE
            </span>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl text-white leading-tight tracking-tight">
              Give your child the teacher they deserve. <br />
              <span className="font-drama italic text-brand-clay font-light text-4xl sm:text-5xl md:text-6xl block mt-2">
                Start with a risk-free trial lesson.
              </span>
            </h2>
            <p className="font-sans text-brand-cream/80 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed pt-2">
              Join 18,000+ families across Africa and the diaspora who trust EduBridge Africa for their children's private tutoring. Verified teachers. Transparent progress. Payment protection. Always.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <a 
                href="#marketplace"
                className="btn-magnetic font-sans font-bold text-xs uppercase tracking-wider bg-brand-clay text-white px-8 py-4 rounded-full shadow-lg shadow-brand-clay/20 flex items-center justify-center gap-2 hover:bg-brand-clay/90"
              >
                Find My Child's Teacher →
              </a>
              <a 
                href="#marketplace" 
                className="btn-magnetic font-sans font-bold text-xs uppercase tracking-wider bg-transparent text-white border border-white/30 hover:bg-white/10 px-8 py-4 rounded-full"
              >
                View Verified Teachers
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-[11px] text-brand-cream/60 font-medium">
              <span className="flex items-center gap-1.5">✓ First lesson money-back guarantee</span>
              <span className="flex items-center gap-1.5">✓ No subscription. No pre-payment.</span>
              <span className="flex items-center gap-1.5">✓ Pay in your currency</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Packages */}
      <section id="pricing" className="py-24 px-6 md:px-16 lg:px-24 bg-brand-cream text-brand-charcoal">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-heading font-bold text-3xl sm:text-5xl text-brand-moss tracking-tight">
              Begin Academic Acceleration
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
            {/* Trial */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-8 flex flex-col justify-between h-[500px] custom-card-shadow hover-lift">
              <div className="space-y-6">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">Single session</span>
                  <h3 className="font-heading font-bold text-2xl text-brand-moss mt-1">Trial Pack</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-bold text-brand-moss">
                    {formatCurrency(convertMinor(350000, selectedCurrency), selectedCurrency)}
                  </span>
                  <span className="font-mono text-xs text-brand-charcoal/50 block mt-1">/ one-time</span>
                </div>
                <ul className="space-y-3 font-sans text-xs text-brand-charcoal/80">
                  <li className="flex items-center gap-2">✓ 1-on-1 Trial Lesson</li>
                  <li className="flex items-center gap-2">✓ Local Escrow Protection</li>
                  <li className="flex items-center gap-2">✓ 100% Refundable Guarantee</li>
                </ul>
              </div>
              <a href="#marketplace" className="btn-magnetic w-full py-3.5 px-6 rounded-full border border-brand-moss text-brand-moss font-bold hover:bg-brand-clay hover:border-brand-clay hover:text-white transition-colors text-xs uppercase tracking-wider text-center">
                Book Trial Class
              </a>
            </div>

            {/* Performance */}
            <div className="bg-brand-moss border border-brand-moss rounded-[2.5rem] p-8 flex flex-col justify-between h-[540px] text-brand-cream relative shadow-2xl scale-105 z-10 border-2 border-brand-clay">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-brand-clay text-white font-mono text-[10px] tracking-widest uppercase font-bold py-1 px-4 rounded-full">
                RECOMMENDED
              </div>
              <div className="space-y-6">
                <div>
                  <span className="font-mono text-2xs text-brand-cream/50 block uppercase">8 Session Pack</span>
                  <h3 className="font-heading font-bold text-2xl text-white mt-1 font-bold">Performance Bundle</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-bold text-white">
                    {formatCurrency(convertMinor(2400000, selectedCurrency), selectedCurrency)}
                  </span>
                  <span className="font-mono text-xs text-brand-cream/50 block mt-1">/ month</span>
                </div>
                <ul className="space-y-3 font-sans text-xs text-brand-cream/90">
                  <li className="flex items-center gap-2">✓ 8 Live Private Classes</li>
                  <li className="flex items-center gap-2">✓ Attendance & Score Tracking</li>
                  <li className="flex items-center gap-2">✓ Cognitive Gemini Insights</li>
                  <li className="flex items-center gap-2">✓ Secure Escrow Release</li>
                </ul>
              </div>
              <a href="#marketplace" className="btn-magnetic w-full py-4 px-6 rounded-full bg-brand-clay text-white font-bold hover:bg-brand-clay/90 transition-colors shadow-lg text-xs uppercase tracking-wider text-center">
                Book Bundle
              </a>
            </div>

            {/* Academic Prep */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-8 flex flex-col justify-between h-[500px] custom-card-shadow hover-lift">
              <div className="space-y-6">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">16 Session Intensive</span>
                  <h3 className="font-heading font-bold text-2xl text-brand-moss mt-1 font-bold">Academic Prep</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-bold text-brand-moss">
                    {formatCurrency(convertMinor(4500000, selectedCurrency), selectedCurrency)}
                  </span>
                  <span className="font-mono text-xs text-brand-charcoal/50 block mt-1">/ month</span>
                </div>
                <ul className="space-y-3 font-sans text-xs text-brand-charcoal/80">
                  <li className="flex items-center gap-2">✓ 16 Live Private Classes</li>
                  <li className="flex items-center gap-2">✓ Priorities Syllabus Mentorship</li>
                  <li className="flex items-center gap-2">✓ Mock WAEC/IGCSE Practice Tests</li>
                </ul>
              </div>
              <a href="#marketplace" className="btn-magnetic w-full py-3.5 px-6 rounded-full border border-brand-moss text-brand-moss font-bold hover:bg-brand-clay hover:border-brand-clay hover:text-white transition-colors text-xs uppercase tracking-wider text-center">
                Book Prep
              </a>
            </div>
          </div>

          {/* Waitlist Banner Form */}
          <div className="mt-20 bg-brand-moss border border-brand-moss rounded-[3rem] p-8 md:p-12 text-brand-cream max-w-4xl mx-auto shadow-xl relative overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-5 mix-blend-overlay pointer-events-none"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1545167622-3a6ac756afa4?q=80&w=1600&auto=format&fit=crop')` }}
            />
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="font-mono text-[10px] text-brand-clay uppercase tracking-widest font-bold block mb-2">Exclusive Acceleration</span>
                <h3 className="font-heading font-bold text-2xl sm:text-3xl text-white">Join the Waitlist</h3>
                <p className="font-sans text-xs text-brand-cream/80 mt-2 max-w-sm">
                  Subscribe to receive notifications when premium tutors match your specified subject focus, rates, and curriculums.
                </p>
              </div>
              <form onSubmit={handleWaitlistSubmit} className="space-y-3 font-sans text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={waitlistName}
                    onChange={(e) => setWaitlistName(e.target.value)}
                    className="w-full bg-brand-cream/10 border border-brand-cream/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-clay text-xs"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Your Email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    className="w-full bg-brand-cream/10 border border-brand-cream/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-clay text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={waitlistRole}
                    onChange={(e) => setWaitlistRole(e.target.value)}
                    className="bg-brand-cream/10 border border-brand-cream/20 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand-clay text-xs font-bold"
                  >
                    <option value="Parent" className="text-brand-moss">I am a Parent</option>
                    <option value="Teacher" className="text-brand-moss">I am a Teacher</option>
                  </select>
                  <button
                    type="submit"
                    className="flex-1 btn-magnetic py-2.5 px-5 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-bold transition-all text-xs uppercase tracking-wider text-center"
                  >
                    Submit Request
                  </button>
                </div>
                {waitlistStatus && (
                  <div className="text-center font-mono text-[9px] uppercase tracking-wider animate-pulse text-brand-clay mt-2">
                    {waitlistStatus}
                  </div>
                )}
              </form>
            </div>
          </div>

        </div>
      </section>

      </>
        )
      )}

      {/* Universal Footer */}
      <footer className="bg-brand-charcoal text-brand-cream pt-24 pb-12 rounded-t-[4rem] border-t border-brand-cream/10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-clay text-white flex items-center justify-center font-heading font-bold">
                EB
              </div>
              <span className="font-heading font-bold tracking-tight text-lg text-white">EduBridge Africa</span>
            </div>
            <p className="font-sans text-xs text-brand-cream/60 leading-relaxed">
              Africa's Best Teachers. The World's Best Students. Connecting local educators with international tutoring standards.
            </p>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold text-xs text-brand-clay mb-4 uppercase tracking-widest">Products</h4>
            <ul className="space-y-2.5 font-sans text-xs text-brand-cream/70">
              <li><a href="#marketplace" className="hover:text-brand-clay transition-colors block">Find Teachers</a></li>
              <li><a href="#academy" className="hover:text-brand-clay transition-colors block">ELITE TEACHERS ACADEMY</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold text-xs text-brand-clay mb-4 uppercase tracking-widest">Security</h4>
            <ul className="space-y-2.5 font-sans text-xs text-brand-cream/70">
              <li><span className="block text-brand-cream/70">Secure Escrows</span></li>
              <li><span className="block text-brand-cream/70">Biometric Verification</span></li>
              <li><span className="block text-brand-cream/70">GDPR & NDPR Compliance</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-xs text-brand-clay mb-4 uppercase tracking-widest text-[10px]">Curriculums</h4>
            <ul className="space-y-2.5 font-sans text-xs text-brand-cream/70">
              <li><span className="block text-brand-cream/70">WAEC / JAMB prep</span></li>
              <li><span className="block text-brand-cream/70">Cambridge IGCSE</span></li>
              <li><span className="block text-brand-cream/70">IB Diploma Prep</span></li>
            </ul>
          </div>
        </div>

        <div className="h-px bg-brand-cream/10 max-w-7xl mx-auto my-8 px-6" />

        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 bg-brand-moss/20 border border-brand-moss/30 rounded-full px-5 py-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-[ping_2s_linear_infinite]"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-brand-cream/80">
              SYSTEM ACTIVE // ESCROW PROTECTED // SECURED BY GEMINI AI
            </span>
          </div>
          
          <div className="flex gap-6 font-sans text-[11px] text-brand-cream/50">
            <span>© 2026 EduBridge Africa. All rights reserved.</span>
          </div>
        </div>
      </footer>

            {/* Interactive Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        teacher={selectedTeacherForBooking}
        selectedCurrency={selectedCurrency}
        walletBalance={walletBalance}
        onBook={handleBookingConfirm}
        formatCurrency={formatCurrency}
        convertMinor={convertMinor}
      />

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onSuccess={(user) => {
          if (user.token) {
            localStorage.setItem('edubridge_token', user.token);
            localStorage.setItem('edubridge_user', JSON.stringify(user));
          } else {
            // Local mock fallback support
            localStorage.setItem('edubridge_user', JSON.stringify(user));
          }
          setCurrentUser(user);
        }}
      />

      <ChatPanel 
        isOpen={isChatOpen} 
        onClose={() => {
          setIsChatOpen(false);
          setSelectedChatSession(null);
        }} 
        session={selectedChatSession} 
        currentUser={currentUser} 
      />

      {/* Real-time Toast Notifications */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-[100] bg-brand-moss border border-brand-moss/10 rounded-2xl p-5 shadow-2xl flex gap-3 text-white max-w-sm animate-slide-up">
          <div className="w-8 h-8 rounded-full bg-brand-cream/15 border border-brand-cream/20 flex items-center justify-center text-brand-clay shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono text-[9px] uppercase tracking-wider text-brand-cream/50 block mb-1">
              New Notification
            </span>
            <h5 className="font-heading font-bold text-xs text-white mb-1">
              {activeToast.title}
            </h5>
            <p className="font-sans text-[10px] text-brand-cream/80 leading-relaxed">
              {activeToast.body}
            </p>
          </div>
        </div>
      )}

      {/* Floating Support Agent Button */}
      <button
        onClick={() => setIsSupportOpen(true)}
        className="fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white flex items-center justify-center shadow-lg shadow-brand-clay/20 transition-all duration-300 scale-100 hover:scale-110 active:scale-95"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Support Chat Panel */}
      {isSupportOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-brand-charcoal/40 backdrop-blur-2xs" onClick={() => setIsSupportOpen(false)} />
          
          {/* Support Panel Container */}
          <div className="relative w-full max-w-md bg-brand-cream border-l border-brand-moss/10 h-full flex flex-col justify-between shadow-2xl z-10 animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-brand-moss/10 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-moss/5 border border-brand-moss/10 flex items-center justify-center text-brand-moss">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-brand-moss text-base">{t('supportTitle')}</h3>
                  <span className="font-sans text-[10px] text-brand-charcoal/50 block uppercase tracking-wide">
                    {t('supportSub')}
                  </span>
                </div>
              </div>
              <button onClick={() => setIsSupportOpen(false)} className="text-brand-moss/60 hover:text-brand-moss">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Support Message history */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-brand-cream/40">
              {supportMessages.map((msg, idx) => {
                const isMe = msg.sender === 'user';
                return (
                  <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="font-mono text-[9px] text-brand-charcoal/40 mb-1">{isMe ? 'You' : 'EB Advisor'}</span>
                    <div className={`p-4 rounded-[1.5rem] max-w-[85%] font-sans text-xs leading-relaxed shadow-xs ${
                      isMe 
                        ? 'bg-brand-clay text-white rounded-tr-none'
                        : 'bg-white text-brand-charcoal border border-brand-moss/10 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              {supportLoading && (
                <div className="flex flex-col items-start">
                  <span className="font-mono text-[9px] text-brand-charcoal/40 mb-1">EB Advisor</span>
                  <div className="p-4 bg-white text-brand-charcoal border border-brand-moss/10 rounded-[1.5rem] rounded-tl-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-clay animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-clay animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-clay animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input field */}
            <form onSubmit={handleSendSupportMessage} className="p-4 border-t border-brand-moss/10 bg-white flex items-center gap-3">
              <input
                type="text"
                placeholder={t('supportPlaceholder')}
                value={supportInput}
                onChange={(e) => setSupportInput(e.target.value)}
                className="flex-1 bg-brand-cream/50 border border-brand-moss/15 rounded-full px-5 py-3 font-sans text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay"
              />
              <button
                type="submit"
                disabled={!supportInput.trim() || supportLoading}
                className="w-10 h-10 rounded-full bg-brand-moss hover:bg-brand-clay text-white flex items-center justify-center shrink-0 shadow-md transition-colors disabled:opacity-40"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-up {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

    </div>
  );
}
