import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, CheckCircle2, ChevronRight, Activity, Calendar, Download, RefreshCw, Star, MessageSquare } from 'lucide-react';

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

  // Profile builder form states
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [rate, setRate] = useState(0);
  const [bio, setBio] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedCurricula, setSelectedCurricula] = useState([]);
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

  const API_BASE = 'http://localhost:5000/api';

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
      // Fetch teacher specific details
      const profileRes = await fetch(`${API_BASE}/teachers/${currentUser.uid}`, {
        headers: getAuthHeaders()
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        setTeacherProfile(data);
        setName(data.name || '');
        setLocation(data.location || '');
        setRate(data.rate ? data.rate / 100 : 0); // convert kobo minor unit to standard naira
        setBio(data.bio || '');
        setSelectedSubjects(data.subjects || []);
        setSelectedCurricula(data.curricula || []);
        setSelectedLanguages(data.languages || []);
        setAvatar(data.avatar || '');
      }

      // Fetch all parent dashboard data to find active sessions for this teacher
      const parentRes = await fetch(`${API_BASE}/parents/dashboard/parent_1`, {
        headers: getAuthHeaders()
      });
      if (parentRes.ok) {
        const parentData = await parentRes.json();
        // Filter sessions by teacherId
        const teacherSessions = (parentData.sessions || []).filter(
          s => s.teacherId === currentUser.uid
        );
        setBookingRequests(teacherSessions.filter(s => s.status === 'Pending Confirmation'));
        setActiveSessions(teacherSessions.filter(s => s.status !== 'Pending Confirmation'));
      }

      // Sync wallet values for current user
      const dashboardRes = await fetch(`${API_BASE}/parents/dashboard/${currentUser.uid}`, {
        headers: getAuthHeaders()
      });
      if (dashboardRes.ok) {
        const d = await dashboardRes.json();
        setWallet({ balance: d.walletBalance, escrow: d.escrowBalance });
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
      location,
      rate: Math.round(rate * 100), // convert standard naira back to kobo minor unit
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
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 border-b border-brand-moss/10 pb-8">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-brand-clay font-bold block mb-1">Dual Portal Sandbox</span>
          <h2 className="font-heading font-bold text-3xl text-brand-moss">Platform Teacher Dashboard</h2>
          <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
            Build your faculty profile, confirm incoming manual booking requests, and coordinate scheduling options.
          </p>
        </div>
      </div>

      <div className="space-y-8 animate-fade-up">
        
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
            <span className="font-heading font-extrabold text-2xl text-brand-moss block">22</span>
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

        {/* Profile Builder & Active Sessions Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Profile Builder Form */}
          <div className="lg:col-span-7 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
            <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-2">PROFILE BUILDER</span>
            <h3 className="font-heading font-bold text-2xl text-brand-moss mb-6">Edit Tutor Profile Details</h3>
            
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

              {/* Checkbox fields: Subjects */}
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
                </div>
              </div>

              {/* Checkbox fields: Curricula */}
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
                </div>
              </div>

              {/* Checkbox fields: Languages */}
              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-3">Spoken Languages</label>
                <div className="flex flex-wrap gap-2">
                  {availableLanguages.map(l => {
                    const active = selectedLanguages.includes(l);
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => toggleLanguage(l)}
                        className={`py-2 px-4 rounded-xl border font-sans text-xs transition-all duration-300 ${
                          active
                            ? 'border-brand-clay bg-brand-clay/5 text-brand-charcoal font-bold'
                            : 'border-brand-moss/10 bg-white text-brand-charcoal/70'
                        }`}
                      >
                        {active ? '✓ ' : ''}{l}
                      </button>
                    );
                  })}
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

          {/* Active Sessions & Chat Trigger Panel */}
          <div className="lg:col-span-5 space-y-8">
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
                    <div key={session.id} className="bg-brand-cream/20 border border-brand-moss/5 rounded-2xl p-4 flex justify-between items-center gap-4">
                      <div>
                        <h4 className="font-heading font-bold text-sm text-brand-moss">
                          Tunde (Parent: Ngozi A.)
                        </h4>
                        <span className="font-mono text-[9px] text-brand-charcoal/50 block mt-0.5 uppercase">
                          {session.slot.day} · {session.slot.time}
                        </span>
                        <span className="font-mono text-[9px] text-emerald-600 font-bold block mt-1 uppercase">
                          ✓ {session.status}
                        </span>
                      </div>
                      <button
                        onClick={() => onOpenChat(session)}
                        className="btn-magnetic w-9 h-9 rounded-full bg-brand-moss/5 border border-brand-moss/10 flex items-center justify-center text-brand-moss hover:bg-brand-clay hover:text-white transition-colors"
                      >
                        <MessageSquare className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Group Class Manager */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm">
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

            {/* Badge progress tracker & ratings breakdown & payouts grid & settings */}
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-6">
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-2">REPUTATION & PERFORMANCE</span>
              
              {/* Badge Progress Grid */}
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

              {/* Ratings breakdown */}
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

              {/* Payout configuration settings */}
              <div className="space-y-4 border-t border-brand-moss/5 pt-4 font-sans text-xs">
                <h5 className="font-mono text-[9px] uppercase tracking-widest text-brand-clay font-bold">Payout Settings & Financials</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-brand-charcoal/50 uppercase font-bold mb-1">Payout Method</label>
                    <select
                      value={payoutMethod}
                      onChange={(e) => setPayoutMethod(e.target.value)}
                      className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl p-2 text-xs focus:outline-none"
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
                      className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl p-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>
                
                {/* payout ledger log */}
                <div>
                  <span className="text-[9px] text-brand-charcoal/50 uppercase font-bold block mb-1.5">Payout History Ledger</span>
                  <div className="space-y-1.5 text-[10px] font-mono">
                    <div className="flex justify-between border-b border-brand-moss/5 pb-1">
                      <span>June 8: ₦72,200</span>
                      <span className="text-emerald-700">Settled (Ref #482)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </section>
  );
}
