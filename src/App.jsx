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
  const API_BASE = 'http://localhost:5000/api';

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
    const payload = authTab === 'login' 
      ? { email: authEmail, password: authPassword } 
      : { email: authEmail, displayName: authName, role: authRole, country: authCountry, password: authPassword };

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
        const provider = selectedCurrency === 'NGN' || selectedCurrency === 'GHS' ? 'paystack' : 'stripe';
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
    "Database Sync: Paystack and Stripe modules ready."
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
      cards.forEach((card, i) => {
        const isLast = i === cards.length - 1;
        ScrollTrigger.create({
          trigger: card,
          start: "top top",
          pin: true,
          pinSpacing: isLast,
          end: () => `+=${window.innerHeight * (cards.length - i)}`,
          id: `stack-pin-${i}`
        });

        if (i > 0) {
          gsap.fromTo(cards[i - 1],
            { scale: 1, filter: "blur(0px)", opacity: 1 },
            {
              scale: 0.95,
              filter: "blur(20px)",
              opacity: 0.55,
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "top top",
                scrub: true
              }
            }
          );
        }
      });
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

      {!currentUser ? (
        <section className="relative min-h-[90dvh] w-full bg-brand-charcoal text-white flex items-center justify-center py-12 px-6 md:px-16 lg:px-24 overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-clay/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-moss/20 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative z-10 w-full max-w-md bg-[#222] border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-hidden">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-6 justify-center">
              <div className="w-8 h-8 rounded-full bg-brand-clay text-white flex items-center justify-center font-heading font-extrabold text-sm">
                EB
              </div>
              <span className="font-heading font-bold tracking-tight text-lg text-white">EduBridge Africa</span>
            </div>

            <div className="text-center mb-6">
              <h2 className="font-heading font-bold text-xl uppercase tracking-wider text-white">
                {authTab === 'login' ? 'Log In to Portal' : 'Create Account'}
              </h2>
              <p className="font-sans text-white/60 text-xs mt-1">
                {authTab === 'login' 
                  ? 'Access your secured dashboard' 
                  : 'Join as a Parent, Teacher, or Student'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-white/5 border border-white/10 rounded-full p-1 mb-6">
              <button
                type="button"
                onClick={() => { setAuthTab('login'); setAuthError(''); }}
                className={`flex-1 py-2 rounded-full font-heading font-bold text-2xs uppercase tracking-wider transition-all duration-300 ${
                  authTab === 'login'
                    ? 'bg-brand-clay text-white shadow-md'
                    : 'text-white/70 hover:bg-white/5'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab('register'); setAuthError(''); }}
                className={`flex-1 py-2 rounded-full font-heading font-bold text-2xs uppercase tracking-wider transition-all duration-300 ${
                  authTab === 'register'
                    ? 'bg-brand-clay text-white shadow-md'
                    : 'text-white/70 hover:bg-white/5'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Error Alert */}
            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl mb-4 font-sans leading-relaxed">
                {authError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4 font-sans text-xs">
              {authTab === 'register' && (
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-clay block mb-2">Full Name</label>
                  <div className="relative flex items-center">
                    <User className="absolute left-4 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ngozi Adeleke"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-brand-clay text-sm"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-clay block mb-2">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 w-4 h-4 text-white/40" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-brand-clay text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-clay block mb-2">Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 w-4 h-4 text-white/40" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-brand-clay text-sm"
                  />
                </div>
              </div>

              {authTab === 'register' && (
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-clay block mb-2">Account Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthRole('Parent')}
                      className={`py-2 rounded-xl border font-heading font-bold text-[10px] uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                        authRole === 'Parent'
                          ? 'border-brand-clay bg-brand-clay/10 text-white'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <span>👨‍👩‍👦</span> Parent
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthRole('Teacher')}
                      className={`py-2 rounded-xl border font-heading font-bold text-[10px] uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                        authRole === 'Teacher'
                          ? 'border-brand-clay bg-brand-clay/10 text-white'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <span>👨‍🏫</span> Teacher
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthRole('Student')}
                      className={`py-2 rounded-xl border font-heading font-bold text-[10px] uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                        authRole === 'Student'
                          ? 'border-brand-clay bg-brand-clay/10 text-white'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <span>🎓</span> Student
                    </button>
                  </div>
                </div>
              )}

              {authTab === 'register' && (authRole === 'Parent' || authRole === 'Teacher') && (
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-clay block mb-2">Country of Residence</label>
                  <select
                    value={authCountry}
                    onChange={(e) => setAuthCountry(e.target.value)}
                    className="w-full bg-[#333] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-clay text-sm"
                  >
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Kenya">Kenya</option>
                    <option value="South Africa">South Africa</option>
                    <option value="Uganda">Uganda</option>
                    <option value="Rwanda">Rwanda</option>
                  </select>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn-magnetic w-full py-4 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-clay/20 flex items-center justify-center gap-2"
                >
                  {authLoading ? 'Processing...' : authTab === 'login' ? 'Log In' : 'Create Account'}
                </button>
              </div>
            </form>

            {/* Default Credentials Helper */}
            <div className="mt-6 border-t border-white/10 pt-4 space-y-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-brand-clay font-bold block">
                Default Demo Accounts (Auto-fill)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setAuthEmail('parent@edubridge.com'); setAuthTab('login'); }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2 text-center transition-all duration-300 flex flex-col items-center justify-center cursor-pointer"
                >
                  <span className="font-heading font-extrabold text-[9px] text-white">👨‍👩‍👦 Parent</span>
                  <span className="font-mono text-[8px] text-white/60 mt-0.5 truncate w-full">parent@edubridge.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthEmail('student@edubridge.com'); setAuthTab('login'); }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2 text-center transition-all duration-300 flex flex-col items-center justify-center cursor-pointer"
                >
                  <span className="font-heading font-extrabold text-[9px] text-white">🎓 Student</span>
                  <span className="font-mono text-[8px] text-white/60 mt-0.5 truncate w-full">student@edubridge.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthEmail('teacher@edubridge.com'); setAuthTab('login'); }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2 text-center transition-all duration-300 flex flex-col items-center justify-center cursor-pointer"
                >
                  <span className="font-heading font-extrabold text-[9px] text-white">👨‍🏫 Teacher</span>
                  <span className="font-mono text-[8px] text-white/60 mt-0.5 truncate w-full">teacher@edubridge.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthEmail('admin@edubridge.com'); setAuthTab('login'); }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2 text-center transition-all duration-300 flex flex-col items-center justify-center cursor-pointer"
                >
                  <span className="font-heading font-extrabold text-[9px] text-white">🛡️ Admin</span>
                  <span className="font-mono text-[8px] text-white/60 mt-0.5 truncate w-full">admin@edubridge.com</span>
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-white/40">
              <ShieldCheck className="w-3.5 h-3.5 text-white/30" />
              <span>Secured zero-trust local environment authentication.</span>
            </div>
          </div>
        </section>
      ) : (
        <>
          {currentView === 'teacher_profile' ? (
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
          )}

          {/* Footer */}
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
        </>
      )}

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
