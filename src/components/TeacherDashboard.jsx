import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, CheckCircle2, ChevronRight, Activity, Calendar, Download, RefreshCw, Star, MessageSquare, Clipboard, User, Users, Award, Trophy, TrendingUp, Video, Clock, Lock, PlusCircle, FolderOpen, AlertOctagon } from 'lucide-react';

export default function TeacherDashboard({
  currentUser,
  selectedCurrency,
  formatCurrency,
  convertMinor,
  onOpenChat,
  onGradeHomework,
  gradesLog
}) {
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0, escrow: 0 });
  const [loading, setLoading] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'profile' | 'students' | 'earnings' | 'reputation' | 'academy'

  // Availability Grid states
  const [availabilityGrid, setAvailabilityGrid] = useState({
    Monday: ['Afternoon', 'Evening'],
    Tuesday: ['Afternoon'],
    Wednesday: ['Evening'],
    Thursday: ['Afternoon', 'Evening'],
    Friday: ['Evening'],
    Saturday: ['Morning', 'Afternoon'],
    Sunday: []
  });
  const [googleCalendarSync, setGoogleCalendarSync] = useState(true);
  const [holidayMode, setHolidayMode] = useState(false);
  const [minNotice, setMinNotice] = useState('24 hours');

  // Student Roster state & notes
  const [roster, setRoster] = useState([
    { uid: 'student_1', name: 'Timi Okafor', subject: 'Mathematics', lastSession: 'Yesterday', nextSession: 'Tomorrow 4:00 PM', assignments: 0, trend: '↑ Upward', note: 'Comprehension is fast. Timi is doing great in trigonometry but needs to watch signs when solving standard equations.' },
    { uid: 'student_2', name: 'Zara Okafor', subject: 'English Syntax', lastSession: '3 days ago', nextSession: 'Wednesday 3:00 PM', assignments: 1, trend: '→ Stable', note: 'Has a rich vocabulary capacity. Focus on argumentative essay layout and structural transitions next.' }
  ]);
  const [selectedRosterStudent, setSelectedRosterStudent] = useState(null);
  const [rosterNoteInput, setRosterNoteInput] = useState('');

  // Reputation & Leaderboard Position states
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(true);
  const [referrals, setReferrals] = useState([
    { id: 'ref_t1', name: 'Dr. Chidi Johnson', status: 'Approved', commission: 1500000 },
    { id: 'ref_t2', name: 'Amina Yusuf', status: 'Pending Review', commission: 0 }
  ]);

  // Session Clock Log Modal States
  const [isClockLogOpen, setIsClockLogOpen] = useState(false);
  const [selectedClockSession, setSelectedClockSession] = useState(null);

  // Profile builder form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [rate, setRate] = useState(0);
  const [bio, setBio] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [selectedCurricula, setSelectedCurricula] = useState([]);
  const [customCurriculumInput, setCustomCurriculumInput] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [avatar, setAvatar] = useState('');
  const [profileMessage, setProfileMessage] = useState('');

  // Homework grading panel states
  const [gradingScore, setGradingScore] = useState(95);
  const [gradingFeedback, setGradingFeedback] = useState('Brilliant solution. Very well aligned to curriculum guidelines.');
  const [isGraded, setIsGraded] = useState(false);

  // Assignment Creator states
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignStudent, setAssignStudent] = useState('Tunde');
  const [assignMessage, setAssignMessage] = useState('');

  // Group Class States
  const [groupName, setGroupName] = useState('');
  const [groupFee, setGroupFee] = useState(15000);
  const [isGroupCreated, setIsGroupCreated] = useState(false);

  // AI Progress Report States
  const [activeReportStudent, setActiveReportStudent] = useState(null);
  const [aiReportContent, setAiReportContent] = useState('');
  const [aiReportLoading, setAiReportLoading] = useState(false);

  // Payout settings states
  const [payoutMethod, setPayoutMethod] = useState('Wise Bank Direct');
  const [minPayout, setMinPayout] = useState(50000);

  const handleGeminiSuggest = () => {
    const suggestions = [
      { title: "Algebraic quadratic factorisation worksheet", desc: "Solve all factoring polynomials on Page 54. Factor both standard and complex coefficients." },
      { title: "WAEC Wave Mechanics physics equations", desc: "Calculate the amplitude, speed, and frequency metrics for the wave graph uploaded in the classroom." },
      { title: "IGCSE Chemistry stoichiometry problems", desc: "Balance the stoichiometric equations sheet and explain molar mass conversions." }
    ];
    const item = suggestions[Math.floor(Math.random() * suggestions.length)];
    setAssignTitle(item.title);
    setAssignDesc(item.desc);
  };

  const handleGenerateReport = (studentName) => {
    setActiveReportStudent(studentName);
    setAiReportLoading(true);
    setTimeout(() => {
      setAiReportContent(`[AI Generated Report - ${studentName}]
Comprehension: Excellent capacity. Average assignment scores returned at 92%.
Strengths: Analytical algebra factorisation speed calculation accuracy.
Recommendations: Trigonometric graphing formulas require focused active drill worksheets.
Conclusion: Trajectory remains fully on-track to WAEC/JAMB exam standards.`);
      setAiReportLoading(false);
    }, 1500);
  };

  const API_BASE = '/api';

  const getAuthHeaders = (extraHeaders = {}) => {
    const token = localStorage.getItem('edubridge_token');
    return {
      'Content-Type': 'application/json',
      ...extraHeaders,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE}/teachers/dashboard/${currentUser.uid}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setTeacherProfile(data.teacher);
        setName(data.teacher.name || '');
        setUsername(data.teacher.username || '');
        setLocation(data.teacher.location || '');
        setRate(data.teacher.rate ? data.teacher.rate / 100 : 0);
        setBio(data.teacher.bio || '');
        setSelectedSubjects(data.teacher.subjects || []);
        setSelectedCurricula(data.teacher.curricula || []);
        setSelectedLanguages(data.teacher.languages || []);
        setAvatar(data.teacher.avatar || '');

        const teacherSessions = data.sessions || [];
        setBookingRequests(teacherSessions.filter(s => s.status === 'Pending Confirmation'));
        setActiveSessions(teacherSessions.filter(s => s.status !== 'Pending Confirmation'));

        setWallet({ balance: data.walletBalance || 0, escrow: data.escrowBalance || 0 });
      }
    } catch (err) {
      console.warn("Backend API offline, using local states simulation for teacher:", err);
      // Local state fallback simulation
      setTeacherProfile({
        uid: currentUser.uid,
        name: currentUser.displayName,
        location: "Lagos, Nigeria",
        subjects: ["Mathematics"],
        curricula: ["WAEC"],
        rate: 400000,
        rating: 4.9,
        reviewsCount: 1,
        badges: ["badge-verified"],
        bio: "Bio description here.",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop"
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    setLoading(true);

    const payload = {
      uid: currentUser.uid,
      name,
      username,
      location,
      rate: Math.round(rate * 100), // convert back to minor units
      bio,
      subjects: selectedSubjects,
      curricula: selectedCurricula,
      languages: selectedLanguages,
      avatar
    };

    try {
      const response = await fetch(`${API_BASE}/teachers/profile`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setProfileMessage('✓ Profile successfully updated!');
        fetchData();
      } else {
        setProfileMessage('Error updating profile details.');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setProfileMessage('✓ Profile successfully updated (Local Sandbox Fallback)');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingRespond = async (sessionId, action) => {
    try {
      const response = await fetch(`${API_BASE}/sessions/respond`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sessionId, action })
      });
      if (response.ok) {
        fetchData();
        alert(`Booking request successfully ${action === 'Confirm' ? 'approved and scheduled' : 'rejected'}.`);
      }
    } catch (err) {
      console.error('Error responding to booking:', err);
      // Fallback
      if (action === 'Confirm') {
        setBookingRequests(prev => prev.filter(s => s.id !== sessionId));
        alert('Booking successfully confirmed (Local Sandbox Fallback).');
      } else {
        setBookingRequests(prev => prev.filter(s => s.id !== sessionId));
        alert('Booking successfully rejected (Local Sandbox Fallback).');
      }
    }
  };

  const toggleSubject = (subj) => {
    setSelectedSubjects(prev =>
      prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj]
    );
  };

  const toggleCurriculum = (curr) => {
    setSelectedCurricula(prev =>
      prev.includes(curr) ? prev.filter(c => c !== curr) : [...prev, curr]
    );
  };

  const toggleLanguage = (lang) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handleHomeworkGrade = (e) => {
    e.preventDefault();
    onGradeHomework({
      id: Date.now(),
      student: 'Tunde',
      title: 'Homework #4 (Quadratic Equations)',
      score: parseInt(gradingScore),
      feedback: gradingFeedback,
      date: 'Today'
    });
    setIsGraded(true);
    setTimeout(() => setIsGraded(false), 3000);
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setAssignMessage('Creating...');
    try {
      const response = await fetch(`${API_BASE}/assignments/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: assignTitle,
          description: assignDesc,
          teacherName: teacherProfile?.name || currentUser?.displayName,
          studentName: assignStudent,
          dueDate: 'Next Week'
        })
      });
      if (response.ok) {
        setAssignMessage('✓ Assignment Created successfully');
        setAssignTitle('');
        setAssignDesc('');
        setTimeout(() => setAssignMessage(''), 3000);
      } else {
        setAssignMessage('Error creating assignment.');
      }
    } catch (err) {
      console.error(err);
      setAssignMessage('✓ Assignment Created (Sandbox Mode)');
      setAssignTitle('');
      setAssignDesc('');
      setTimeout(() => setAssignMessage(''), 3000);
    }
  };

  const availableSubjects = ["Mathematics", "Physics", "Chemistry", "English", "Literature"];
  const availableCurricula = ["WAEC", "JAMB", "IGCSE", "Cambridge", "IB Diploma", "Primary (Ages 6-11)", "Middle School (Ages 12-14)", "High School (Ages 15-18)"];
  const availableLanguages = ["English", "Yoruba", "Igbo", "Hausa", "French", "Swahili"];

  return (
    <section id="dashboard" className="py-24 px-6 md:px-16 lg:px-24 bg-brand-cream max-w-7xl mx-auto border-t border-brand-moss/10">
      
      {/* Dashboard Switcher Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-12 border-b border-brand-moss/10 pb-8">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-brand-clay font-bold block mb-1">Dual Portal Sandbox</span>
          <h2 className="font-heading font-bold text-3xl text-brand-moss">Platform Teacher Dashboard</h2>
          <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
            Build your faculty profile, confirm incoming manual booking requests, and coordinate scheduling options.
          </p>
        </div>

        {/* Pill Navigation Switcher */}
        <div className="flex bg-brand-moss/5 border border-brand-moss/10 rounded-full p-1.5 self-center max-w-full flex-wrap gap-1">
          {[
            { id: 'overview', label: 'Overview & Bookings' },
            { id: 'profile', label: 'Faculty Profile' },
            { id: 'students', label: 'Students & Grading' },
            { id: 'earnings', label: 'Earnings & Payouts' },
            { id: 'reputation', label: 'Reputation & Growth' },
            { id: 'academy', label: 'AI Academy' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-4 rounded-full font-heading font-bold text-[10px] uppercase tracking-wider transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-brand-moss text-white shadow-md'
                  : 'text-brand-moss hover:bg-brand-moss/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8 animate-fade-up">
        
        {/* TAB 1: OVERVIEW & BOOKINGS */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Wallet Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white border border-brand-moss/10 rounded-[1.5rem] p-5 shadow-sm">
                <span className="font-heading font-extrabold text-2xl text-emerald-600 block">₦84,500</span>
                <span className="font-sans text-2xs text-brand-charcoal/60 block mt-1">Earned this month</span>
                <span className="font-mono text-[9px] text-emerald-600 font-bold block mt-2">↑ +18% vs last month</span>
              </div>
              <div className="bg-white border border-brand-moss/10 rounded-[1.5rem] p-5 shadow-sm">
                <span className="font-heading font-extrabold text-2xl text-brand-clay block">₦12,300</span>
                <span className="font-sans text-2xs text-brand-charcoal/60 block mt-1">In escrow (pending)</span>
                <span className="font-mono text-[9px] text-brand-clay font-bold block mt-2">Releases in 18 hours</span>
              </div>
              <div className="bg-white border border-brand-moss/10 rounded-[1.5rem] p-5 shadow-sm">
                <span className="font-heading font-extrabold text-2xl text-brand-moss block">₦72,200</span>
                <span className="font-sans text-2xs text-brand-charcoal/60 block mt-1">Paid out to date</span>
                <span className="font-mono text-[9px] text-brand-charcoal/40 block mt-2">Last payout: 8 Jun</span>
              </div>
              <div className="bg-white border border-brand-moss/10 rounded-[1.5rem] p-5 shadow-sm">
                <span className="font-heading font-extrabold text-2xl text-rose-600 block">₦14,300</span>
                <span className="font-sans text-2xs text-brand-charcoal/60 block mt-1">Commission</span>
                <span className="font-mono text-[9px] text-rose-600 font-bold block mt-2">17% platform gross</span>
              </div>
              <div className="bg-white border border-brand-moss/10 rounded-[1.5rem] p-5 shadow-sm col-span-2 md:col-span-1">
                <span className="font-heading font-extrabold text-2xl text-brand-moss block">{activeSessions.length + bookingRequests.length}</span>
                <span className="font-sans text-2xs text-brand-charcoal/60 block mt-1">Sessions this month</span>
                <span className="font-mono text-[9px] text-brand-moss font-bold block mt-2">↑ +3 vs last month</span>
              </div>
            </div>

            {/* Incoming Booking Requests */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
              <h3 className="font-heading font-bold text-xl text-brand-moss mb-4 flex items-center justify-between">
                <span>Incoming Booking Requests</span>
                <span className="font-mono text-2xs bg-brand-clay/10 text-brand-clay font-bold py-1 px-3 rounded-full uppercase tracking-wider">
                  {bookingRequests.length} Pending Confirm
                </span>
              </h3>

              {bookingRequests.length === 0 ? (
                <div className="py-8 text-center text-brand-charcoal/50 text-sm font-sans">
                  No pending booking confirmation requests.
                </div>
              ) : (
                <div className="space-y-4">
                  {bookingRequests.map((request) => (
                    <div key={request.id} className="bg-brand-cream/30 border border-brand-moss/5 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover-lift">
                      <div>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-brand-clay font-bold block mb-1">
                          NEW MANUAL BOOKING REQUEST
                        </span>
                        <h4 className="font-heading font-bold text-brand-moss text-base">
                          Class with {request.studentName} (Parent: Ngozi A.)
                        </h4>
                        <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                          Proposed Slot: <span className="font-bold">{request.slot.day} at {request.slot.time}</span> · Value: {formatCurrency(convertMinor(request.cost, selectedCurrency), selectedCurrency)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                          onClick={() => handleBookingRespond(request.id, 'Confirm')}
                          className="flex-1 md:flex-none py-2 px-5 bg-brand-moss hover:bg-brand-moss/95 text-white rounded-full font-sans font-bold text-xs uppercase tracking-wider transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleBookingRespond(request.id, 'Reject')}
                          className="flex-1 md:flex-none py-2 px-5 border border-brand-clay hover:bg-brand-clay hover:text-white text-brand-clay rounded-full font-sans font-bold text-xs uppercase tracking-wider transition-all duration-300"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Classrooms */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm">
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-4">ACTIVE TUTORING CLASSROOMS</span>
              
              {activeSessions.length === 0 ? (
                <div className="text-center text-brand-charcoal/40 text-xs py-6 font-sans">
                  No scheduled lessons found. Pending confirm requests will appear here once approved.
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="bg-brand-cream/20 border border-brand-moss/5 rounded-2xl p-4 flex justify-between items-center gap-4 hover-lift">
                      <div>
                        <h4 className="font-heading font-bold text-sm text-brand-moss">
                          {session.studentName} (Parent: Ngozi A.)
                        </h4>
                        <span className="font-mono text-[9px] text-brand-charcoal/50 block mt-0.5 uppercase">
                          {session.slot.day} · {session.slot.time} · Value: {formatCurrency(convertMinor(session.cost, selectedCurrency), selectedCurrency)}
                        </span>
                        <span className="font-mono text-[9px] text-emerald-600 font-bold block mt-1 uppercase">
                          ✓ {session.status}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {session.status === 'Completed' && (
                          <button
                            onClick={() => {
                              setSelectedClockSession(session);
                              setIsClockLogOpen(true);
                            }}
                            className="py-2 px-4 bg-brand-moss/5 border border-brand-moss/10 rounded-xl font-heading font-bold text-2xs text-brand-moss hover:bg-brand-clay hover:text-white transition-all flex items-center gap-1.5"
                          >
                            <Clock className="w-3.5 h-3.5" /> Session Clock Log
                          </button>
                        )}
                        <button
                          onClick={() => onOpenChat(session)}
                          className="btn-magnetic w-9 h-9 rounded-full bg-brand-moss/5 border border-brand-moss/10 flex items-center justify-center text-brand-moss hover:bg-brand-clay hover:text-white transition-colors"
                        >
                          <MessageSquare className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FACULTY PROFILE */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Profile Builder */}
            <div className="lg:col-span-7 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-2">PROFILE BUILDER</span>
              <h3 className="font-heading font-bold text-2xl text-brand-moss mb-6">Edit Faculty Profile</h3>
              
              {profileMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs py-3 px-4 rounded-xl mb-6 font-mono animate-pulse">
                  {profileMessage}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-6 font-sans text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Display Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Public Username</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 font-mono text-brand-charcoal/40">@</span>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl pl-8 pr-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Location</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lagos, Nigeria"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Hourly rate (NGN)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 4000"
                      value={rate}
                      onChange={(e) => setRate(parseFloat(e.target.value))}
                      className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Profile Avatar URL</label>
                    <input
                      type="text"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-3">Taught Subjects</label>
                  <div className="flex flex-wrap gap-2">
                    {availableSubjects.map(s => {
                      const active = selectedSubjects.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSubject(s)}
                          className={`py-2 px-4 rounded-xl border font-sans text-xs transition-all duration-300 ${
                            active
                              ? 'border-brand-clay bg-brand-clay/5 text-brand-charcoal font-bold'
                              : 'border-brand-moss/10 bg-white text-brand-charcoal/70'
                          }`}
                        >
                          {active ? '✓ ' : ''}{s}
                        </button>
                      );
                    })}
                    {selectedSubjects.filter(s => !availableSubjects.includes(s)).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSubject(s)}
                        className="py-2 px-4 rounded-xl border font-sans text-xs transition-all duration-300 border-brand-clay bg-brand-clay/5 text-brand-charcoal font-bold"
                      >
                        ✓ {s}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2 max-w-sm">
                    <input
                      type="text"
                      placeholder="Other subject (e.g. Tech Skills)"
                      value={customSubjectInput}
                      onChange={(e) => setCustomSubjectInput(e.target.value)}
                      className="flex-1 bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-3 py-2 text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = customSubjectInput.trim();
                        if (val) {
                          if (!selectedSubjects.includes(val)) {
                            setSelectedSubjects(prev => [...prev, val]);
                          }
                          setCustomSubjectInput('');
                        }
                      }}
                      className="py-2 px-4 bg-brand-moss hover:bg-brand-clay text-white rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-3">Supported Curricula</label>
                  <div className="flex flex-wrap gap-2">
                    {availableCurricula.map(c => {
                      const active = selectedCurricula.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCurriculum(c)}
                          className={`py-2 px-4 rounded-xl border font-sans text-xs transition-all duration-300 ${
                            active
                              ? 'border-brand-clay bg-brand-clay/5 text-brand-charcoal font-bold'
                              : 'border-brand-moss/10 bg-white text-brand-charcoal/70'
                          }`}
                        >
                          {active ? '✓ ' : ''}{c}
                        </button>
                      );
                    })}
                    {selectedCurricula.filter(c => !availableCurricula.includes(c)).map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCurriculum(c)}
                        className="py-2 px-4 rounded-xl border font-sans text-xs transition-all duration-300 border-brand-clay bg-brand-clay/5 text-brand-charcoal font-bold"
                      >
                        ✓ {c}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2 max-w-sm">
                    <input
                      type="text"
                      placeholder="Other curriculum (e.g. Custom standard)"
                      value={customCurriculumInput}
                      onChange={(e) => setCustomCurriculumInput(e.target.value)}
                      className="flex-1 bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-3 py-2 text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = customCurriculumInput.trim();
                        if (val) {
                          if (!selectedCurricula.includes(val)) {
                            setSelectedCurricula(prev => [...prev, val]);
                          }
                          setCustomCurriculumInput('');
                        }
                      }}
                      className="py-2 px-4 bg-brand-moss hover:bg-brand-clay text-white rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Short Bio description</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl p-4 text-brand-charcoal focus:outline-none focus:border-brand-clay h-28 resize-none text-sm leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-magnetic w-full py-4 bg-brand-clay hover:bg-brand-clay/90 text-white rounded-full font-heading font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-clay/20"
                >
                  {loading ? 'Saving Changes...' : 'Save & Publish Profile'}
                </button>
              </form>
            </div>

            {/* Availability Grid */}
            <div className="lg:col-span-5 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-6">
              <div>
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">SCHEDULING ENGINE</span>
                <h4 className="font-heading font-bold text-lg text-brand-moss mt-0.5">Availability Slot Grid</h4>
                <p className="font-sans text-[11px] text-brand-charcoal/60 mt-1">Configure weekly available timings. Autodetects conflict overlays with Google Calendar.</p>
              </div>

              <div className="space-y-3 font-sans text-xs">
                {Object.entries(availabilityGrid).map(([day, slots]) => (
                  <div key={day} className="flex justify-between items-center border-b border-brand-moss/5 pb-2">
                    <span className="font-bold text-brand-moss w-20">{day}</span>
                    <div className="flex gap-1">
                      {['Morning', 'Afternoon', 'Evening'].map(slot => {
                        const isAvailable = slots.includes(slot);
                        return (
                          <button
                            key={slot}
                            onClick={() => {
                              setAvailabilityGrid(prev => {
                                const current = prev[day];
                                const updated = current.includes(slot) ? current.filter(s => s !== slot) : [...current, slot];
                                return { ...prev, [day]: updated };
                              });
                            }}
                            className={`py-1.5 px-3 rounded-lg border text-[9px] font-bold uppercase transition-all duration-300 ${
                              isAvailable
                                ? 'bg-brand-moss text-white border-brand-moss'
                                : 'bg-brand-cream/30 border-brand-moss/10 text-brand-charcoal/50 hover:border-brand-moss/30'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-brand-moss/5 pt-4 space-y-4 font-sans text-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold block text-brand-charcoal">Google Calendar Sync</span>
                    <span className="text-[10px] text-brand-charcoal/50">Auto-block busy time blocks.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGoogleCalendarSync(!googleCalendarSync)}
                    className={`w-10 h-5 rounded-full transition-all relative ${googleCalendarSync ? 'bg-brand-moss' : 'bg-brand-charcoal/20'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${googleCalendarSync ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold block text-brand-charcoal">Holiday Mode</span>
                    <span className="text-[10px] text-brand-charcoal/50">Block all bookings for 2 weeks.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHolidayMode(!holidayMode)}
                    className={`w-10 h-5 rounded-full transition-all relative ${holidayMode ? 'bg-brand-clay' : 'bg-brand-charcoal/20'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${holidayMode ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-brand-charcoal/50 uppercase font-bold mb-1">Timezone</label>
                    <div className="bg-brand-cream/30 border border-brand-moss/10 rounded-xl p-2 font-mono text-[10px]">
                      WAT (GMT+1)
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] text-brand-charcoal/50 uppercase font-bold mb-1">Min Notice Window</label>
                    <select
                      value={minNotice}
                      onChange={(e) => setMinNotice(e.target.value)}
                      className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl p-2 text-[10px] focus:outline-none"
                    >
                      <option value="12 hours">12 hours</option>
                      <option value="24 hours">24 hours</option>
                      <option value="48 hours">48 hours</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STUDENTS & GRADING */}
        {activeTab === 'students' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Student Roster list */}
              <div className="lg:col-span-7 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-6">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">STUDENT ROSTER</span>
                  <h3 className="font-heading font-bold text-xl text-brand-moss mt-0.5">Active Study Roster</h3>
                  <p className="font-sans text-[11px] text-brand-charcoal/60 mt-1">Track child performance milestones, notes, and outstanding tasks.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-brand-moss/10 text-brand-charcoal/50 font-mono text-[9px] uppercase tracking-wider">
                        <th className="py-2.5 pb-4">Student</th>
                        <th className="py-2.5 pb-4">Subject</th>
                        <th className="py-2.5 pb-4">Last Active</th>
                        <th className="py-2.5 pb-4 text-center">Tasks</th>
                        <th className="py-2.5 pb-4 text-right">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-moss/5 text-brand-charcoal/80">
                      {roster.map((student) => (
                        <tr 
                          key={student.uid} 
                          onClick={() => { setSelectedRosterStudent(student); setRosterNoteInput(student.note); }}
                          className="hover:bg-brand-moss/5 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 font-bold text-brand-moss">{student.name}</td>
                          <td className="py-3.5">{student.subject}</td>
                          <td className="py-3.5 font-mono text-[10px]">{student.lastSession}</td>
                          <td className="py-3.5 text-center font-bold">{student.assignments} pending</td>
                          <td className="py-3.5 text-right font-bold text-emerald-600">{student.trend}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Group Class Manager */}
              <div className="lg:col-span-5 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm">
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-2">GROUP MODULE</span>
                <h4 className="font-heading font-bold text-sm text-brand-moss mb-4">Create Group Session (Max 10)</h4>
                <form onSubmit={(e) => { e.preventDefault(); setIsGroupCreated(true); setTimeout(() => { setIsGroupCreated(false); setGroupName(''); }, 3000); }} className="space-y-4 font-sans text-xs">
                  <input
                    type="text"
                    required
                    placeholder="Group Name (e.g. WAEC Math study group)"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-clay"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      required
                      placeholder="Fee (₦ per student)"
                      value={groupFee}
                      onChange={(e) => setGroupFee(e.target.value)}
                      className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-clay"
                    />
                    <span className="text-[10px] text-brand-charcoal/60 self-center">System auto-splits cost</span>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-brand-moss hover:bg-brand-clay text-white rounded-full font-heading font-bold uppercase text-[10px] tracking-wider transition-colors">
                    Create Group Class
                  </button>
                  {isGroupCreated && <span className="text-emerald-600 block text-[9px] font-mono text-center animate-pulse">✓ Group session scheduled. Invites ready!</span>}
                </form>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Assignment Creator */}
              <div className="bg-brand-charcoal border border-brand-cream/10 rounded-[3rem] p-6 text-brand-cream shadow-sm">
                <div className="flex items-center justify-between border-b border-brand-cream/10 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-brand-clay" />
                    <h4 className="font-heading font-bold text-sm text-white">Create Assignment</h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleGeminiSuggest}
                    className="bg-brand-clay text-white border border-brand-clay/35 py-1 px-3 rounded-full font-mono text-[8px] uppercase tracking-wider font-bold hover:scale-[1.03] transition-all cursor-pointer"
                  >
                    🪄 Gemini Suggestion
                  </button>
                </div>

                <form onSubmit={handleCreateAssignment} className="space-y-4 font-sans text-xs">
                  <div>
                    <label className="font-heading font-bold text-[10px] uppercase tracking-wider text-brand-cream/60 block mb-1">Student</label>
                    <select
                      value={assignStudent}
                      onChange={(e) => setAssignStudent(e.target.value)}
                      className="w-full bg-brand-cream/5 border border-brand-cream/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-clay text-brand-charcoal"
                    >
                      <option value="Tunde" className="text-brand-charcoal">Tunde (Parent: Ngozi A.)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-heading font-bold text-[10px] uppercase tracking-wider text-brand-cream/60 block mb-1">Assignment Title</label>
                    <input
                      type="text"
                      required
                      value={assignTitle}
                      onChange={(e) => setAssignTitle(e.target.value)}
                      placeholder="e.g., Algebra Worksheet 2"
                      className="w-full bg-brand-cream/5 border border-brand-cream/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-clay"
                    />
                  </div>

                  <div>
                    <label className="font-heading font-bold text-[10px] uppercase tracking-wider text-brand-cream/60 block mb-1">Description / Link</label>
                    <textarea
                      required
                      value={assignDesc}
                      onChange={(e) => setAssignDesc(e.target.value)}
                      placeholder="Instructions or link to Google Doc..."
                      className="w-full bg-brand-cream/5 border border-brand-cream/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-clay h-20 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-magnetic w-full py-2.5 px-4 rounded-full bg-white text-brand-charcoal font-bold hover:bg-white/90 transition-colors shadow-lg text-2xs uppercase tracking-wider"
                  >
                    Send to Student
                  </button>

                  {assignMessage && (
                    <div className="text-center text-emerald-400 font-mono text-[9px] animate-pulse mt-2">
                      {assignMessage}
                    </div>
                  )}
                </form>
              </div>

              {/* Grading Homework reviewer */}
              <div className="bg-brand-charcoal border border-brand-cream/10 rounded-[3rem] p-6 text-brand-cream">
                <div className="flex items-center justify-between border-b border-brand-cream/10 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-clay" />
                    <h4 className="font-heading font-bold text-sm text-white">Homework Submissions</h4>
                  </div>
                  <span className="font-mono text-2xs text-brand-clay uppercase tracking-widest font-bold">1 PENDING</span>
                </div>

                <form onSubmit={handleHomeworkGrade} className="space-y-4 font-sans text-xs">
                  <div className="bg-brand-moss/10 border border-brand-cream/10 rounded-xl p-3 font-mono text-[10px]">
                    <div className="flex justify-between items-center text-brand-clay font-bold mb-1">
                      <span>Tunde Okafor</span>
                      <span>algebra_hw_4.txt</span>
                    </div>
                    <div className="text-brand-cream/70 leading-normal">
                      x² - 5x + 6 = 0 <br />
                      (x - 2)(x - 3) = 0 <br />
                      Therefore, x = 2 or x = 3.
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-heading font-bold text-[10px] uppercase tracking-wider text-brand-cream/60 block mb-1">Score (1-100)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={gradingScore}
                        onChange={(e) => setGradingScore(e.target.value)}
                        className="w-full bg-brand-cream/5 border border-brand-cream/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-clay"
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <button
                        type="button"
                        onClick={() => alert('Simulated: Audio feedback recorded. File feedback_audio_dsp.mp3 attached.')}
                        className="py-2.5 bg-brand-cream/10 hover:bg-brand-cream/15 text-white border border-brand-cream/20 rounded-xl font-mono text-[9px] uppercase tracking-wider font-bold text-center flex items-center justify-center gap-1 cursor-pointer"
                      >
                        🎤 Voice Note Feedback
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-heading font-bold text-[10px] uppercase tracking-wider text-brand-cream/60 block mb-1">Teacher Feedback</label>
                    <textarea
                      value={gradingFeedback}
                      onChange={(e) => setGradingFeedback(e.target.value)}
                      className="w-full bg-brand-cream/5 border border-brand-cream/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-clay h-16 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-magnetic w-full py-2.5 px-4 rounded-full bg-brand-clay text-white font-bold hover:bg-brand-clay/90 transition-colors shadow-lg text-2xs uppercase tracking-wider"
                  >
                    Grade Submission
                  </button>

                  {isGraded && (
                    <div className="text-center text-emerald-400 font-mono text-[9px] animate-pulse">
                      ✓ Grade recorded successfully.
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* AI Progress Report Generator */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm">
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-2">PROGRESS REPORT BUILDER</span>
              <h4 className="font-heading font-bold text-sm text-brand-moss mb-4">Gemini Progress Report Generator</h4>
              <button
                type="button"
                onClick={() => handleGenerateReport('Tunde')}
                className="w-full py-3 bg-brand-moss hover:bg-brand-clay text-white rounded-full font-heading font-bold uppercase text-[10px] tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-brand-clay animate-pulse" /> Generate Gemini Report for Tunde
              </button>

              {aiReportLoading && (
                <div className="animate-pulse space-y-2 mt-4">
                  <div className="h-3 bg-brand-moss/10 rounded w-3/4"></div>
                  <div className="h-3 bg-brand-moss/10 rounded w-5/6"></div>
                </div>
              )}

              {aiReportContent && !aiReportLoading && (
                <div className="mt-4 bg-brand-cream/30 border border-brand-moss/10 p-4 rounded-xl font-mono text-[10px] text-brand-moss space-y-2">
                  <pre className="whitespace-pre-wrap leading-relaxed">{aiReportContent}</pre>
                  <button
                    type="button"
                    onClick={() => { alert('Draft Report successfully published and sent to parent dashboard!'); setAiReportContent(''); }}
                    className="w-full py-2 bg-brand-clay hover:bg-brand-clay/90 text-white rounded-lg font-heading text-[9px] uppercase tracking-wider font-bold"
                  >
                    ✓ Publish Draft to Parent
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: EARNINGS & PAYOUTS */}
        {activeTab === 'earnings' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Earnings info card */}
              <div className="lg:col-span-4 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between h-48 hover-lift">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-2">AVAILABLE SETTLED BALANCE</span>
                  <span className="font-heading font-bold text-3xl text-brand-moss block">
                    {formatCurrency(wallet.balance, selectedCurrency)}
                  </span>
                  <span className="font-sans text-[10px] text-brand-charcoal/50 block mt-1">Ready for transfer to connected payout method.</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-brand-moss bg-brand-moss/5 border border-brand-moss/10 rounded-full px-3 py-1 w-fit">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-clay" /> Payout Active
                </div>
              </div>

              {/* Payout configuration settings */}
              <div className="lg:col-span-8 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-4 font-sans text-xs">
                <h5 className="font-mono text-[9px] uppercase tracking-widest text-brand-clay font-bold">Payout Settings & Financials</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-brand-charcoal/50 uppercase font-bold mb-1">Payout Method</label>
                    <select
                      value={payoutMethod}
                      onChange={(e) => setPayoutMethod(e.target.value)}
                      className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl p-2.5 text-xs focus:outline-none"
                    >
                      <option value="Wise Bank Direct">Wise Bank Direct</option>
                      <option value="Paystack Bank Account">Paystack Bank Account</option>
                      <option value="Mobile Money Wallet">Mobile Money Wallet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-brand-charcoal/50 uppercase font-bold mb-1">Min Threshold</label>
                    <input
                      type="number"
                      value={minPayout}
                      onChange={(e) => setMinPayout(parseInt(e.target.value))}
                      className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl p-2.5 text-xs focus:outline-none"
                    />
                  </div>
                </div>
                
                {/* payout ledger log */}
                <div className="pt-4 border-t border-brand-moss/5">
                  <span className="text-[9px] text-brand-charcoal/50 uppercase font-bold block mb-1.5">Payout History Ledger</span>
                  <div className="space-y-1.5 text-[10px] font-mono">
                    <div className="flex justify-between border-b border-brand-moss/5 pb-1">
                      <span>June 8, 2026: ₦72,200</span>
                      <span className="text-emerald-700">Settled (Ref #482)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: REPUTATION & GROWTH */}
        {activeTab === 'reputation' && (
          <div className="space-y-8 animate-fade-up">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Badge Progress & Ratings */}
              <div className="lg:col-span-6 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-6">
                
                {/* Badge Checklist */}
                <div className="space-y-3">
                  <h5 className="font-mono text-[9px] uppercase tracking-widest text-brand-clay font-bold">Badge Progress (Tutor level)</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { badge: "Verified Tutor", status: "Earned", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
                      { badge: "Elite Certified", status: "Earned", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
                      { badge: "Top Rated", status: "Earned", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
                      { badge: "Elite Educator", status: "Locked (80%)", color: "bg-amber-50 text-amber-800 border-amber-200" }
                    ].map((b, i) => (
                      <div key={i} className={`p-2 border rounded-xl flex justify-between items-center text-[10px] ${b.color}`}>
                        <span className="font-bold">{b.badge}</span>
                        <span className="text-[8px] uppercase">{b.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ratings Breakdown */}
                <div className="space-y-2 border-t border-brand-moss/5 pt-4">
                  <h5 className="font-mono text-[9px] uppercase tracking-widest text-brand-clay font-bold">Ratings Breakdown (5 dimensions)</h5>
                  <div className="space-y-1 text-[11px] font-sans text-brand-charcoal/80">
                    <div className="flex justify-between"><span>Punctuality</span><span className="font-bold text-brand-moss">4.9★</span></div>
                    <div className="flex justify-between"><span>Teaching Quality</span><span className="font-bold text-brand-moss">5.0★</span></div>
                    <div className="flex justify-between"><span>Communication</span><span className="font-bold text-brand-moss">4.8★</span></div>
                    <div className="flex justify-between"><span>Preparedness</span><span className="font-bold text-brand-moss">4.9★</span></div>
                    <div className="flex justify-between"><span>Student Progress</span><span className="font-bold text-brand-moss">4.9★</span></div>
                  </div>
                </div>
              </div>

              {/* Leaderboard Position */}
              <div className="lg:col-span-6 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">WEEKLY COMPETITION</span>
                  <h4 className="font-heading font-bold text-base text-brand-moss">Leaderboard Position</h4>
                  <p className="font-sans text-[10px] text-brand-charcoal/60 mt-0.5">Your ranking compared to all vetted tutors in Lagos.</p>
                </div>
                
                <div className="bg-brand-cream/20 border border-brand-moss/5 p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="font-mono text-[10px] text-brand-charcoal/50 block">CURRENT RANK</span>
                    <span className="font-heading font-extrabold text-2xl text-brand-moss block mt-0.5">#4 in Lagos</span>
                    <span className="font-mono text-[9px] text-emerald-600 block mt-1 font-bold">↑ Moved up 2 spots this week</span>
                  </div>
                  <Trophy className="w-10 h-10 text-brand-clay animate-pulse" />
                </div>

                <div className="flex items-center justify-between font-sans text-xs border-t border-brand-moss/5 pt-4">
                  <div>
                    <span className="font-bold block">Opt-in to Teacher Leaderboard</span>
                    <span className="text-[10px] text-brand-charcoal/50">Show rank publically to parents.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLeaderboardOptIn(!leaderboardOptIn)}
                    className={`w-10 h-5 rounded-full transition-all relative ${leaderboardOptIn ? 'bg-brand-moss' : 'bg-brand-charcoal/20'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${leaderboardOptIn ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Growth tools: referrals and profile views */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Referral Programme */}
              <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-6">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">GROWTH CAMPAIGN</span>
                  <h4 className="font-heading font-bold text-lg text-brand-moss mt-0.5">Referral Programme</h4>
                  <p className="font-sans text-[11px] text-brand-charcoal/60 mt-1">Earn 10% commission on referred teacher revenues for 3 months.</p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://edubridge.com/register?ref=${currentUser.uid}`}
                    className="flex-1 bg-brand-cream/50 border border-brand-moss/10 rounded-xl px-3 py-2 text-xs font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={() => { navigator.clipboard.writeText(`https://edubridge.com/register?ref=${currentUser.uid}`); alert('Referral link copied to clipboard!'); }}
                    className="bg-brand-clay text-white px-4 py-2 rounded-xl font-heading font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-brand-clay/90"
                  >
                    Copy Link
                  </button>
                </div>

                <div className="overflow-x-auto pt-4 border-t border-brand-moss/5">
                  <span className="text-[10px] text-brand-charcoal/50 uppercase font-bold block mb-2">Referred Teachers</span>
                  <table className="w-full text-left font-sans text-2xs border-collapse">
                    <thead>
                      <tr className="border-b border-brand-moss/10 text-brand-charcoal/40 font-mono uppercase tracking-wider">
                        <th className="py-2">Teacher Name</th>
                        <th className="py-2">Status</th>
                        <th className="py-2 text-right">Commission Earned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-moss/5 text-brand-charcoal/80">
                      {referrals.map((r, idx) => (
                        <tr key={idx}>
                          <td className="py-2 font-bold text-brand-moss">{r.name}</td>
                          <td className="py-2"><span className="font-mono bg-emerald-50 text-emerald-800 py-0.5 px-2 rounded-full uppercase tracking-wider text-[8px] border border-emerald-100">{r.status}</span></td>
                          <td className="py-2 text-right font-bold text-brand-moss">{formatCurrency(r.commission, selectedCurrency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Profile Analytics */}
              <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">PERFORMANCE INSIGHTS</span>
                  <h4 className="font-heading font-bold text-lg text-brand-moss mt-0.5">Profile Analytics</h4>
                  <p className="font-sans text-[11px] text-brand-charcoal/60 mt-1">Track traffic impressions and keyword optimization levels.</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center font-sans text-xs">
                  <div className="bg-brand-cream/20 border border-brand-moss/5 p-3 rounded-xl">
                    <span className="text-brand-charcoal/50 block text-[9px] font-mono">Views (30d)</span>
                    <span className="font-heading font-bold text-base text-brand-moss block mt-0.5">342 views</span>
                    <span className="text-[9px] text-emerald-600 block font-bold">↑ +15%</span>
                  </div>
                  <div className="bg-brand-cream/20 border border-brand-moss/5 p-3 rounded-xl">
                    <span className="text-brand-charcoal/50 block text-[9px] font-mono">Impressions</span>
                    <span className="font-heading font-bold text-base text-brand-moss block mt-0.5">1,240</span>
                    <span className="text-[9px] text-brand-charcoal/50 block">Keyword searches</span>
                  </div>
                  <div className="bg-brand-cream/20 border border-brand-moss/5 p-3 rounded-xl">
                    <span className="text-brand-charcoal/50 block text-[9px] font-mono">Conversion</span>
                    <span className="font-heading font-bold text-base text-brand-clay block mt-0.5">18.2%</span>
                    <span className="text-[9px] text-brand-charcoal/50 block">Views to Bookings</span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3.5 text-[11px] font-sans flex items-start gap-2.5 mt-2">
                  <Sparkles className="w-5 h-5 text-brand-clay shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-brand-clay uppercase tracking-wider font-mono text-[9px]">AI BIO TIP SUGGESTION</span>
                    Tutors who upload a short 60-second video introduction increase their profile request booking conversion rates by 40%. Upload an intro file now.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AI ACADEMY */}
        {activeTab === 'academy' && (
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-8 animate-fade-up">
            <div>
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">ACADEMIC MODULE PROGRESSION</span>
              <h3 className="font-heading font-bold text-xl text-brand-moss mt-0.5">EduBridge Teacher Academy</h3>
              <p className="font-sans text-xs text-brand-charcoal/60 mt-1">Complete structural teaching modules and receive certificate credentials.</p>
            </div>

            {/* Modules list progress */}
            <div className="space-y-4">
              {[
                { title: 'Module 1: Platform Billing & Escrow Rules', status: 'Passed', score: '100%' },
                { title: 'Module 2: Direct Interactive Teaching Methods', status: 'Passed', score: '95%' },
                { title: 'Module 3: Deploying Gemini AI Tools in class', status: 'Passed', score: '90%' },
                { title: 'Module 4: Student Motivation Techniques', status: 'In Progress', score: null },
                { title: 'Module 5: Dispute Claims Management', status: 'Locked', score: null },
                { title: 'Module 6: Capstone Teaching Roleplay Practice', status: 'Locked', score: null }
              ].map((m, idx) => (
                <div key={idx} className="border border-brand-moss/5 rounded-2xl p-4 bg-brand-cream/5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-brand-moss block">{m.title}</span>
                    <span className="text-[10px] text-brand-charcoal/50 mt-0.5 block">Module {idx+1} Vetting Program</span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-mono text-[9px] uppercase tracking-wider font-bold py-1 px-3 rounded-full border ${
                      m.status === 'Passed'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : m.status === 'In Progress'
                        ? 'bg-amber-50 border-amber-200 text-amber-800 animate-pulse'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      {m.status} {m.score ? `(${m.score})` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Certificate sharing */}
            <div className="bg-brand-charcoal border border-brand-cream/10 rounded-[3rem] p-6 text-brand-cream flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-base text-white">Academy Certifications</h4>
                <p className="font-sans text-[11px] text-brand-cream/70 leading-relaxed">
                  You have successfully completed 3 of 6 training levels. Your final certificate will release upon passing the Capstone Roleplay test.
                </p>
              </div>

              <button
                disabled
                className="py-3 px-6 bg-brand-cream/20 text-brand-cream rounded-full font-heading font-bold text-[10px] uppercase tracking-wider opacity-50 shrink-0"
              >
                Download Certificate PDF
              </button>
            </div>
          </div>
        )}

      </div>

      {/* INDEPENDENT STUDENT DETAILS ROSTER MODAL */}
      {selectedRosterStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-charcoal/40 backdrop-blur-xs" onClick={() => setSelectedRosterStudent(null)} />
          
          <div className="bg-brand-cream border border-brand-moss/10 rounded-[2.5rem] p-8 w-full max-w-lg relative z-10 shadow-2xl animate-fade-up">
            <button 
              onClick={() => setSelectedRosterStudent(null)} 
              className="absolute top-6 right-6 text-brand-charcoal/60 hover:text-brand-charcoal font-bold text-base"
            >
              ✕
            </button>
            <h3 className="font-heading font-bold text-xl text-brand-moss mb-1">{selectedRosterStudent.name}</h3>
            <span className="font-mono text-[9px] uppercase tracking-wider text-brand-clay font-bold block mb-4">
              Student Profile & Private Teacher Notes
            </span>

            <div className="bg-white border border-brand-moss/10 rounded-2xl p-4 mb-4 font-sans text-xs space-y-3">
              <div className="grid grid-cols-2 gap-4 border-b border-brand-moss/5 pb-2">
                <div>
                  <span className="text-brand-charcoal/50 block text-[9px] uppercase font-bold">Curriculum Subject</span>
                  <span className="font-bold text-brand-moss block mt-0.5">{selectedRosterStudent.subject} Instruction</span>
                </div>
                <div>
                  <span className="text-brand-charcoal/50 block text-[9px] uppercase font-bold">Last Lesson Date</span>
                  <span className="font-bold text-brand-moss block mt-0.5">{selectedRosterStudent.lastSession}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-brand-moss/5 pb-2">
                <div>
                  <span className="text-brand-charcoal/50 block text-[9px] uppercase font-bold">Next Lesson Slot</span>
                  <span className="font-bold text-brand-moss block mt-0.5">{selectedRosterStudent.nextSession}</span>
                </div>
                <div>
                  <span className="text-brand-charcoal/50 block text-[9px] uppercase font-bold">Progress Milestone</span>
                  <span className="font-bold text-brand-moss block mt-0.5">{selectedRosterStudent.trend} Comprehension</span>
                </div>
              </div>

              <div>
                <label className="font-heading font-bold text-[10px] uppercase tracking-wider text-brand-moss block mb-2">Private Lesson Diary Notes</label>
                <textarea
                  value={rosterNoteInput}
                  onChange={(e) => setRosterNoteInput(e.target.value)}
                  className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl p-3 text-brand-charcoal focus:outline-none focus:border-brand-clay h-24 resize-none text-xs leading-relaxed"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedRosterStudent(null)}
                className="flex-1 border border-brand-moss/10 hover:border-brand-moss hover:bg-white rounded-xl py-3 font-heading font-bold text-brand-charcoal text-xs uppercase"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setRoster(prev => prev.map(s => s.uid === selectedRosterStudent.uid ? { ...s, note: rosterNoteInput } : s));
                  alert('Private student progress notes updated successfully!');
                  setSelectedRosterStudent(null);
                }}
                className="flex-1 bg-brand-moss hover:bg-brand-clay text-white rounded-xl py-3 font-heading font-bold uppercase tracking-wider text-xs"
              >
                Save Private Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SESSION CLOCK LOG TIMELINE MODAL */}
      {isClockLogOpen && selectedClockSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-charcoal/40 backdrop-blur-xs" onClick={() => setIsClockLogOpen(false)} />
          
          <div className="bg-brand-cream border border-brand-moss/10 rounded-[2.5rem] p-8 w-full max-w-md relative z-10 shadow-2xl animate-fade-up">
            <button 
              onClick={() => setIsClockLogOpen(false)} 
              className="absolute top-6 right-6 text-brand-charcoal/60 hover:text-brand-charcoal font-bold text-base"
            >
              ✕
            </button>
            <h3 className="font-heading font-bold text-xl text-brand-moss mb-2">Lesson Clock Log</h3>
            <p className="font-sans text-xs text-brand-charcoal/70 mb-4">
              Tamper-proof server clock records for session with <span className="font-bold">{selectedClockSession.studentName}</span>.
            </p>

            <div className="bg-white border border-brand-moss/10 rounded-2xl p-4 mb-4 font-mono text-[11px] space-y-2">
              <div className="flex justify-between border-b border-brand-moss/5 pb-2">
                <span>Scheduled Slot:</span>
                <span className="font-bold">{selectedClockSession.slot.day} at {selectedClockSession.slot.time}</span>
              </div>
              <div className="flex justify-between border-b border-brand-moss/5 pb-2">
                <span>Total Billed Time:</span>
                <span className="font-bold text-brand-moss">60 minutes</span>
              </div>
              <div className="pt-2">
                <span className="text-[9px] uppercase font-bold text-brand-clay block mb-1">Server Clock Timeline Audit</span>
                <div className="space-y-1.5 text-[9px] text-brand-charcoal/80">
                  <div className="flex justify-between">
                    <span>🟢 Video Channel Opened</span>
                    <span>{selectedClockSession.slot.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🔴 Video Channel Closed</span>
                    <span>Completed (+60m)</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => alert('Clock Log evidence PDF exported and downloaded successfully!')}
              className="btn-magnetic w-full py-3 bg-brand-moss hover:bg-brand-clay text-white rounded-full font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
            >
              <Download className="w-4 h-4" /> Download Evidence PDF
            </button>
          </div>
        </div>
      )}

    </section>
  );
}
