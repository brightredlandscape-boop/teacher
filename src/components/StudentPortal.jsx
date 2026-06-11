import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Flame, Award, BarChart3, Calendar, FileText, CheckCircle2, Clock, PlayCircle, FolderOpen, ArrowRight, User } from 'lucide-react';

export default function StudentPortal({ currentUser, selectedCurrency, formatCurrency, convertMinor }) {
  const [studentData, setStudentData] = useState(null);
  const [xp, setXp] = useState(1450);
  const [streak, setStreak] = useState(7);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'assignments' | 'portfolio'
  const [submissionLink, setSubmissionLink] = useState('');
  const [submittingId, setSubmittingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    // Sync simulated details from local parameters
    setStudentData({
      level: Math.floor(xp / 400) + 1,
      levelLabel: xp >= 1200 ? 'Level 4 // Rising Scholar' : 'Level 2 // Explorer',
      nextLevelXp: 400 - (xp % 400),
      percent: Math.round(((xp % 400) / 400) * 100),
      badgesCount: 5,
      attendance: 92,
      score: 86
    });
  }, [xp]);

  const xpRules = [
    { label: "Complete a session (attend full duration)", reward: "+100 XP", icon: "🎥" },
    { label: "Submit assignment before due date", reward: "+50 XP", icon: "📝" },
    { label: "Score 90%+ on assignment", reward: "+200 XP", icon: "⭐" },
    { label: "Perfect attendance week (all sessions)", reward: "+150 XP", icon: "🗓️" },
    { label: "Complete 10 sessions total", reward: "+500 XP", icon: "🏆" },
    { label: "7-day active streak", reward: "+100 XP bonus", icon: "🔥" }
  ];

  const badges = [
    { title: "Perfect Attendance", status: "Earned", date: "June 2", icon: "🗓️", desc: "Attended 100% of sessions in a calendar month." },
    { title: "Assignment Champion", status: "Earned", date: "May 28", icon: "📝", desc: "Submitted 10 assignments on time in a row." },
    { title: "Top Scorer", status: "In Progress (80%)", date: "", icon: "⭐", desc: "Scored 90%+ on 5 consecutive assignments." },
    { title: "Consistent Learner", status: "Earned", date: "May 15", icon: "🔄", desc: "Active (1+ session or assignment) 30 days in a row." },
    { title: "Streak Master", status: "Earned", date: "June 8", icon: "🔥", desc: "7-day engagement streak maintained." },
    { title: "Fast Finisher", status: "Locked", date: "", icon: "🚀", desc: "Submitted assignment within 2 hours of release." },
    { title: "Subject Expert", status: "Earned", date: "May 20", icon: "💡", desc: "Average subject score of 85%+ over 10 sessions." },
    { title: "Most Improved", status: "In Progress (60%)", date: "", icon: "📈", desc: "Score improved 30%+ over 4-week period." }
  ];

  const subjects = [
    { name: "Algebra", percentage: 82, color: "bg-brand-moss" },
    { name: "Quadratic equations", percentage: 54, color: "bg-brand-clay" },
    { name: "Trigonometry", percentage: 31, color: "bg-rose-600" },
    { name: "Statistics", percentage: 91, color: "bg-emerald-600" }
  ];

  const [assignments, setAssignments] = useState([
    { id: 1, title: "Algebraic Factorisation homework", subject: "Mathematics", teacher: "Mr. Adebayo Okafor", dueDate: "Tomorrow", status: "Pending" },
    { id: 2, title: "WAEC Chemistry formulas", subject: "Chemistry", teacher: "Mr. Kofi Mensah", dueDate: "In 3 Days", status: "In Progress" },
    { id: 3, title: "English Syntax & Paragraphing", subject: "English", teacher: "Mrs. Chioma", dueDate: "Completed", status: "Graded", score: 92, feedback: "Fantastic paragraph transitions. Keep reviewing relative pronouns." }
  ]);

  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: "Chinedu A.", xp: 1980, active: false },
    { rank: 2, name: "Zara B.", xp: 1720, active: false },
    { rank: 3, name: "Tunde O. (You)", xp: 1450, active: true },
    { rank: 4, name: "Fatima S.", xp: 1390, active: false },
    { rank: 5, name: "Kofi K.", xp: 1210, active: false }
  ]);

  const handleAssignmentSubmit = (e, id) => {
    e.preventDefault();
    setStatusMessage('Submitting homework response...');
    setTimeout(() => {
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: 'Submitted', dueDate: 'Pending Grade' } : a));
      setXp(prev => prev + 50); // reward submission XP
      setSubmissionLink('');
      setSubmittingId(null);
      setStatusMessage('✓ Submitted successfully! Earned +50 XP!');
      setTimeout(() => setStatusMessage(''), 3000);
    }, 1200);
  };

  return (
    <section id="dashboard" className="py-24 px-6 md:px-16 lg:px-24 bg-brand-cream max-w-7xl mx-auto border-t border-brand-moss/10">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-brand-moss/10 pb-8">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-brand-clay font-bold block mb-1">STUDENT PORTAL & SANDBOX</span>
          <h2 className="font-heading font-bold text-3xl text-brand-moss">Welcome back, {currentUser?.displayName || 'Tunde'}</h2>
          <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
            Track your level progression metrics, unlock learning badges, and submit pending assignment files.
          </p>
        </div>

        {/* Level indicator pill */}
        <div className="flex items-center gap-3 bg-brand-moss text-white py-3 px-6 rounded-full shadow-lg">
          <Trophy className="w-5 h-5 text-brand-clay" />
          <div className="text-left leading-none">
            <span className="font-mono text-[9px] uppercase tracking-widest text-brand-clay block font-bold">CURRENT RANK</span>
            <span className="font-heading font-bold text-xs">{studentData?.levelLabel}</span>
          </div>
        </div>
      </div>

      <div className="space-y-8 animate-fade-up">
        
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* XP Tracker */}
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between hover-lift">
            <div>
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-2">SCHOLAR XP SYSTEM</span>
              <span className="font-heading font-bold text-4xl text-brand-moss block">{xp} XP</span>
              <div className="w-full bg-brand-moss/5 rounded-full h-2 mt-3 overflow-hidden">
                <div className="bg-brand-moss h-2 rounded-full transition-all duration-500" style={{ width: `${studentData?.percent || 0}%` }} />
              </div>
              <span className="font-sans text-[10px] text-brand-charcoal/50 block mt-1">{studentData?.nextLevelXp} XP to Level {studentData?.level + 1}</span>
            </div>
          </div>

          {/* Streak Indicator */}
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between hover-lift">
            <div>
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-2">DAILY ENGAGEMENT</span>
              <span className="font-heading font-bold text-4xl text-brand-clay block flex items-center gap-1">
                <Flame className="w-8 h-8 fill-brand-clay" /> {streak} Days
              </span>
              <span className="font-sans text-[10px] text-brand-charcoal/50 block mt-1">Keep logging in daily to protect your streak bonus!</span>
            </div>
          </div>

          {/* Badges Count */}
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between hover-lift">
            <div>
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-2">BADGES EARNED</span>
              <span className="font-heading font-bold text-4xl text-brand-moss block flex items-center gap-1.5">
                <Award className="w-8 h-8 text-brand-moss" /> {studentData?.badgesCount} / 8
              </span>
              <span className="font-sans text-[10px] text-brand-charcoal/50 block mt-1">2 progress targets currently within reach</span>
            </div>
          </div>

          {/* Average Comprehension */}
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between hover-lift">
            <div>
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-2">AVERAGE GRADE</span>
              <span className="font-heading font-bold text-4xl text-brand-moss block">86%</span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-600 font-bold block mt-1">
                ✓ Comprehension Level High
              </span>
            </div>
          </div>

        </div>

        {/* Tab switch navigation */}
        <div className="flex bg-brand-moss/5 border border-brand-moss/10 rounded-full p-1.5 max-w-md">
          {['overview', 'assignments', 'portfolio'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-2.5 rounded-full font-heading font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
                activeTab === t
                  ? 'bg-brand-moss text-white shadow-md'
                  : 'text-brand-moss hover:bg-brand-moss/5'
              }`}
            >
              {t === 'overview' ? 'Overview' : t === 'assignments' ? 'Assignments' : 'My Portfolio'}
            </button>
          ))}
        </div>

        {/* Main Content Panels */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Area: Subject Mastery & Gamification rules */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Subject Mastery Progress Bars */}
              <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-4">SUBJECT COMPREHENSION MATRIX</span>
                <h3 className="font-heading font-bold text-xl text-brand-moss mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand-clay" /> Topic Mastery Tracking
                </h3>
                
                <div className="space-y-6">
                  {subjects.map((sub, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between font-sans text-xs">
                        <span className="text-brand-charcoal/80 font-bold">{sub.name}</span>
                        <span className="font-mono font-bold text-brand-moss">{sub.percentage}% Mastered</span>
                      </div>
                      <div className="w-full bg-brand-cream/60 border border-brand-moss/5 rounded-full h-3.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${sub.color}`} 
                          style={{ width: `${sub.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student Badges */}
              <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-4">REPUTATION SYSTEM</span>
                <h3 className="font-heading font-bold text-xl text-brand-moss mb-6">Learning Achievements & Badges</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {badges.map((badge, idx) => (
                    <div key={idx} className="border border-brand-moss/10 rounded-2xl p-4 flex gap-3.5 bg-brand-cream/10 hover-lift">
                      <span className="text-3xl shrink-0">{badge.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-bold text-sm text-brand-moss">{badge.title}</h4>
                          <span className={`font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            badge.status.includes('Earned')
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : badge.status.includes('Progress')
                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                              : 'bg-rose-50 border-rose-200 text-rose-800'
                          }`}>
                            {badge.status}
                          </span>
                        </div>
                        <p className="font-sans text-[11px] text-brand-charcoal/70 mt-1 leading-normal">
                          {badge.desc}
                        </p>
                        {badge.date && (
                          <span className="font-mono text-[8px] text-brand-charcoal/40 block mt-1 uppercase">Unlocked: {badge.date}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Area: Study group leaderboards & XP rules */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Leaderboard Panel */}
              <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm">
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-4">STUDY GROUP COMPETITION</span>
                <h3 className="font-heading font-bold text-lg text-brand-moss mb-6 flex items-center gap-1.5">
                  <Trophy className="w-5 h-5 text-brand-clay" /> Study Group Leaderboard
                </h3>

                <div className="space-y-2">
                  {leaderboard.map((user, idx) => (
                    <div 
                      key={idx} 
                      className={`flex justify-between items-center p-3 rounded-xl border ${
                        user.active 
                          ? 'border-brand-clay bg-brand-clay/5' 
                          : 'border-brand-moss/5 bg-brand-cream/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 rounded-full font-mono text-[10px] font-bold flex items-center justify-center ${
                          user.rank === 1 ? 'bg-amber-100 text-amber-800' : 'bg-brand-moss/5 text-brand-moss/60'
                        }`}>
                          {user.rank}
                        </span>
                        <span className={`font-sans text-xs ${user.active ? 'font-bold text-brand-moss' : 'text-brand-charcoal/80'}`}>
                          {user.name}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-brand-moss">{user.xp} XP</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* XP Rules list */}
              <div className="bg-brand-charcoal border border-brand-cream/10 rounded-[2.5rem] p-6 text-brand-cream">
                <span className="font-mono text-[9px] uppercase tracking-widest text-brand-cream/50 block mb-4">XP ACQUISITION SYSTEM</span>
                <h4 className="font-heading font-bold text-sm text-white mb-4">XP Earning Protocols</h4>
                <div className="space-y-3 font-sans text-xs">
                  {xpRules.map((rule, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-brand-cream/5 pb-2">
                      <span className="text-brand-cream/70 flex items-center gap-1.5">
                        <span>{rule.icon}</span> {rule.label}
                      </span>
                      <span className="font-mono font-bold text-brand-clay shrink-0">{rule.reward}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Assignments Panel */}
        {activeTab === 'assignments' && (
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
            <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-4">ASSIGNMENTS SUBMISSIONS</span>
            <h3 className="font-heading font-bold text-xl text-brand-moss mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-clay" /> Pending & Graded Tasks
            </h3>

            {statusMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs py-3 px-4 rounded-xl mb-6 font-mono animate-pulse">
                {statusMessage}
              </div>
            )}

            <div className="space-y-4">
              {assignments.map(a => (
                <div key={a.id} className="border border-brand-moss/10 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-cream/5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-bold text-sm text-brand-moss">{a.title}</h4>
                      <span className={`font-mono text-[8px] uppercase tracking-wider py-0.5 px-2 rounded-full border ${
                        a.status === 'Graded'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                          : a.status === 'Submitted'
                          ? 'bg-blue-50 border-blue-200 text-blue-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800 animate-pulse'
                      }`}>
                        {a.status}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-brand-charcoal/70">
                      Subject: <b>{a.subject}</b> · Tutor: <b>{a.teacher}</b>
                    </p>
                    {a.feedback && (
                      <p className="font-sans text-xs text-brand-charcoal/75 italic bg-white p-3 rounded-xl border border-brand-moss/5 leading-relaxed mt-2">
                        "Tutor Feedback: {a.feedback}"
                      </p>
                    )}
                  </div>

                  <div className="w-full sm:w-auto shrink-0 flex items-center gap-4 justify-between sm:justify-end">
                    {a.status === 'Graded' ? (
                      <div className="bg-brand-moss/5 border border-brand-moss/10 rounded-xl px-4 py-2 text-center">
                        <span className="font-heading font-bold text-lg text-brand-moss block">{a.score}</span>
                        <span className="text-[8px] text-brand-charcoal/50 block font-mono">/100</span>
                      </div>
                    ) : a.status === 'Submitted' ? (
                      <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/40">Awaiting grade response</span>
                    ) : submittingId === a.id ? (
                      <form onSubmit={(e) => handleAssignmentSubmit(e, a.id)} className="flex gap-2 w-full sm:w-80">
                        <input
                          type="text"
                          required
                          placeholder="Paste response text or PDF drive link..."
                          value={submissionLink}
                          onChange={(e) => setSubmissionLink(e.target.value)}
                          className="flex-1 bg-white border border-brand-moss/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-clay"
                        />
                        <button 
                          type="submit"
                          className="bg-brand-moss hover:bg-brand-clay text-white px-4 py-2 rounded-xl font-heading font-bold text-xs uppercase tracking-wider"
                        >
                          Submit
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setSubmittingId(a.id)}
                        className="btn-magnetic w-full sm:w-auto py-2.5 px-6 bg-brand-clay hover:bg-brand-clay/95 text-white rounded-full font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
                      >
                        Submit Response <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio / History Panel */}
        {activeTab === 'portfolio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Session History */}
            <div className="lg:col-span-7 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-4">SESSION HISTORY LOG</span>
              <h3 className="font-heading font-bold text-xl text-brand-moss mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-clay" /> Past Tutorials Clock logs
              </h3>

              <div className="space-y-4">
                {[
                  { teacher: "Mr. Adebayo Okafor", subject: "Mathematics Algebra", date: "June 8, 2026", duration: "60 mins", hasRecording: true },
                  { teacher: "Mrs. Chioma", subject: "English Literature", date: "June 5, 2026", duration: "45 mins", hasRecording: false }
                ].map((s, idx) => (
                  <div key={idx} className="border border-brand-moss/5 bg-brand-cream/5 rounded-2xl p-4 flex justify-between items-center gap-4">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-brand-moss">{s.subject}</h4>
                      <p className="font-sans text-xs text-brand-charcoal/70 mt-0.5">
                        Taught by: <b>{s.teacher}</b> · Billed: <b>{s.duration}</b>
                      </p>
                      <span className="font-mono text-[8px] text-brand-charcoal/40 block mt-1 uppercase">Date: {s.date}</span>
                    </div>

                    {s.hasRecording && (
                      <a 
                        href="https://res.cloudinary.com/demo/video/upload/dog.mp4"
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-brand-moss/5 border border-brand-moss/10 p-2.5 rounded-full text-brand-moss hover:bg-brand-clay hover:text-white transition-all flex items-center justify-center"
                        title="Play Lesson Recording"
                      >
                        <PlayCircle className="w-4.5 h-4.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Student Portfolio */}
            <div className="lg:col-span-5 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm">
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-4">PORTFOLIO STORAGE</span>
              <h3 className="font-heading font-bold text-lg text-brand-moss mb-6 flex items-center gap-1.5">
                <FolderOpen className="w-5 h-5 text-brand-clay" /> Student Portfolio
              </h3>
              <p className="font-sans text-xs text-brand-charcoal/70 mb-4 leading-relaxed">
                All submitted assignment documents are indexed by subject and date. Use this ledger as a portfolio to demonstrate improvement.
              </p>

              <div className="space-y-3 font-sans text-xs">
                <div className="border border-brand-moss/10 rounded-xl p-3 flex justify-between items-center bg-brand-cream/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    <div>
                      <span className="font-bold block text-brand-moss">algebra_hw_3.txt</span>
                      <span className="font-mono text-[8px] text-brand-charcoal/50 block uppercase">Mathematics · Graded: 85/100</span>
                    </div>
                  </div>
                </div>
                <div className="border border-brand-moss/10 rounded-xl p-3 flex justify-between items-center bg-brand-cream/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📝</span>
                    <div>
                      <span className="font-bold block text-brand-moss">english_syntax_essay.pdf</span>
                      <span className="font-mono text-[8px] text-brand-charcoal/50 block uppercase">English · Graded: 92/100</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}
