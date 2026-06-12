import React, { useState } from 'react';
import { Search, Star, ShieldCheck, CheckCircle2, Award, Zap, HelpCircle } from 'lucide-react';

export default function Marketplace({ 
  teachers, 
  selectedCurrency, 
  onBookClick, 
  formatCurrency, 
  convertMinor,
  onTeacherSelect
}) {
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [curriculumFilter, setCurriculumFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);

  React.useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => setLeaderboard(data))
      .catch(console.error);
  }, []);

  // Filter teachers based on state
  const filteredTeachers = teachers.filter(t => {
    const matchesSubject = subjectFilter === 'All' || t.subjects.includes(subjectFilter);
    const matchesCurriculum = curriculumFilter === 'All' || t.curriculums.includes(curriculumFilter);
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.bio.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesCurriculum && matchesSearch;
  });

  return (
    <section id="marketplace" className="py-24 px-6 md:px-16 lg:px-24 bg-brand-cream max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="font-mono text-xs uppercase tracking-widest text-brand-clay font-bold block mb-3">EduBridge Marketplace</span>
        <h2 className="font-heading font-bold text-3xl sm:text-5xl text-brand-moss tracking-tight">
          Find Your Perfect Verified Instructor
        </h2>
        <p className="font-sans text-sm text-brand-charcoal/70 mt-3 max-w-xl mx-auto">
          Every teacher is biometrically verified, Elite-Academy certified, and rated by parents. Top 5% of African pedagogy.
        </p>
      </div>

      {/* Leaderboard Section */}
      {leaderboard.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-heading font-bold text-2xl text-brand-moss flex items-center gap-2">
                <Award className="w-6 h-6 text-brand-clay" /> Featured Elite Tutors
              </h3>
              <p className="font-sans text-xs text-brand-charcoal/60 mt-1">This week's top-rated educators by parent reviews and platform achievements.</p>
            </div>
            <span className="bg-[#FEF3C7] text-[#92400E] font-mono text-[10px] uppercase tracking-wider font-bold py-1.5 px-3 rounded-full border border-[#FDE68A]">
              Top 3 Global
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {leaderboard.map((teacher, idx) => (
              <div 
                key={teacher.id}
                onClick={() => onTeacherSelect && onTeacherSelect(teacher.username || teacher.id)}
                className="bg-brand-charcoal text-brand-cream border border-brand-cream/10 rounded-3xl p-5 flex items-center gap-4 cursor-pointer hover:border-brand-clay/50 transition-colors shadow-lg shadow-brand-charcoal/20 relative overflow-hidden"
              >
                <div className="absolute -right-6 -top-6 text-brand-cream/5 font-heading font-bold text-9xl pointer-events-none">
                  {idx + 1}
                </div>
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-clay bg-brand-moss z-10">
                  <img src={teacher.avatar} alt={teacher.name} className="w-full h-full object-cover" />
                </div>
                <div className="z-10">
                  <h4 className="font-heading font-bold text-lg text-white flex items-center gap-1.5">
                    {teacher.name}
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </h4>
                  <div className="flex items-center text-brand-clay mt-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-heading font-bold text-xs ml-1 text-white">{teacher.rating}</span>
                    <span className="text-xs text-brand-cream/50 ml-1">({teacher.reviewsCount})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters panel */}
      <div className="bg-white border border-brand-moss/10 rounded-3xl p-6 mb-12 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="w-4.5 h-4.5 text-brand-moss/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, expertise, bio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full border border-brand-moss/10 bg-brand-cream/10 focus:outline-none focus:border-brand-moss focus:ring-1 focus:ring-brand-moss text-sm"
            />
          </div>

          <div className="text-xs text-brand-charcoal/50 font-mono">
            SHOWING {filteredTeachers.length} OF {teachers.length} EDUCATORS
          </div>
        </div>

        {/* Filter categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-brand-moss/5">
          {/* Subject Filter */}
          <div>
            <span className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-3">Subjects</span>
            <div className="flex flex-wrap gap-2">
              {[
                'All', 
                'Mathematics', 
                'Physics', 
                'Chemistry', 
                'English', 
                'Literature', 
                'French', 
                'Spanish', 
                'Coding & Robotics', 
                'Data Science'
              ].map(subj => (
                <button
                  key={subj}
                  onClick={() => setSubjectFilter(subj)}
                  className={`py-1.5 px-4 rounded-full border font-sans text-xs font-semibold transition-all duration-300 ${
                    subjectFilter === subj
                      ? 'bg-brand-moss border-brand-moss text-white shadow-sm'
                      : 'bg-brand-cream/20 border-brand-moss/10 hover:border-brand-moss/30 text-brand-moss/80'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>
          </div>

          {/* Curriculum Filter */}
          <div>
            <span className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-3">Curriculum Standard</span>
            <div className="flex flex-wrap gap-2">
              {[
                'All', 
                'Nursery (Ages 2-5)', 
                'Primary (Ages 6-11)', 
                'Middle School (Ages 12-14)', 
                'High School (Ages 15-18)', 
                'University Prep', 
                'WAEC', 
                'JAMB', 
                'IGCSE', 
                'Cambridge', 
                'IB Diploma', 
                'SAT',
                'Professional Certs',
                'Vocational & Technical',
                'Others (Professional)'
              ].map(curr => (
                <button
                  key={curr}
                  onClick={() => setCurriculumFilter(curr)}
                  className={`py-1.5 px-4 rounded-full border font-sans text-xs font-semibold transition-all duration-300 ${
                    curriculumFilter === curr
                      ? 'bg-brand-moss border-brand-moss text-white shadow-sm'
                      : 'bg-brand-cream/20 border-brand-moss/10 hover:border-brand-moss/30 text-brand-moss/80'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTeachers.map(teacher => {
          const convertedRate = convertMinor(teacher.rate, selectedCurrency);
          const formattedRate = formatCurrency(convertedRate, selectedCurrency);
          
          return (
            <div 
              key={teacher.id} 
              className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 flex flex-col justify-between custom-card-shadow hover-lift relative overflow-hidden"
            >
              <div>
                {/* Intro video simulated screen */}
                <div 
                  onClick={() => onTeacherSelect && onTeacherSelect(teacher.username || teacher.id)}
                  className="relative h-44 bg-brand-charcoal rounded-2xl overflow-hidden mb-6 group cursor-pointer border border-brand-moss/10"
                >
                  <img 
                    src={teacher.coverImage || 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=600&auto=format&fit=crop'} 
                    alt={teacher.name} 
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal via-transparent to-transparent opacity-60" />
                  
                  {/* Status Indicator */}
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-brand-charcoal/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                    <span className={`w-1.5 h-1.5 rounded-full ${teacher.online ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="font-mono text-[8px] tracking-wider text-white uppercase">
                      {teacher.online ? 'LIVE // ONLINE' : 'OFFLINE'}
                    </span>
                  </div>

                  {/* Vetting standard display */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className="flex gap-1.5 flex-wrap">
                      {teacher.badges && teacher.badges.map(badge => {
                        if (badge === 'badge-top-rated') {
                          return (
                            <span key={badge} className="bg-[#FEF3C7] text-[#92400E] font-mono text-[8px] uppercase tracking-wider font-bold py-0.5 px-2 rounded-full border border-[#FDE68A] shadow-sm">
                              ★ TOP RATED
                            </span>
                          );
                        }
                        if (badge === 'badge-ai-cert') {
                          return (
                            <span key={badge} className="bg-emerald-50 text-emerald-800 font-mono text-[8px] uppercase tracking-wider font-bold py-0.5 px-2 rounded-full border border-emerald-200 shadow-sm">
                              ELITE CERTIFIED
                            </span>
                          );
                        }
                        if (badge === 'badge-verified') {
                          return (
                            <span key={badge} className="bg-blue-50 text-blue-800 font-mono text-[8px] uppercase tracking-wider font-bold py-0.5 px-2 rounded-full border border-blue-200 shadow-sm flex items-center gap-1">
                              <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
                            </span>
                          );
                        }
                        if (badge === 'badge-bg-checked') {
                          return (
                            <span key={badge} className="bg-amber-50/80 border border-brand-clay/30 text-brand-clay font-mono text-[8px] uppercase tracking-wider font-bold py-0.5 px-2 rounded-full shadow-sm flex items-center gap-1">
                              <ShieldCheck className="w-2.5 h-2.5 text-brand-clay fill-brand-clay/10" /> BACKGROUND CHECKED
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>

                {/* Avatar and Info */}
                <div className="flex gap-4 items-start mb-4">
                  <div 
                    onClick={() => onTeacherSelect && onTeacherSelect(teacher.username || teacher.id)}
                    className="w-14 h-14 rounded-full overflow-hidden border border-brand-moss/10 bg-brand-moss/5 cursor-pointer"
                  >
                    <img src={teacher.avatar} alt={teacher.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 
                      onClick={() => onTeacherSelect && onTeacherSelect(teacher.username || teacher.id)}
                      className="font-heading font-bold text-lg text-brand-moss flex items-center gap-1.5 cursor-pointer hover:underline"
                    >
                      {teacher.name}
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-50" />
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center text-brand-clay">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="font-heading font-bold text-xs ml-1 text-brand-moss">{teacher.rating}</span>
                      </div>
                      <span className="text-xs text-brand-charcoal/50">({teacher.reviewsCount} sessions)</span>
                    </div>
                  </div>
                </div>

                {/* Location and Subject tags */}
                <div className="font-sans text-xs text-brand-charcoal/70 mb-4 space-y-1.5 border-b border-brand-moss/5 pb-4">
                  <div>📍 {teacher.location} · <span className="font-medium text-brand-moss">Teaches Globally</span></div>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {teacher.subjects.map(s => (
                      <span key={s} className="bg-brand-moss/5 text-brand-moss font-medium text-[10px] px-2.5 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                    {teacher.curriculums.map(c => (
                      <span key={c} className="bg-brand-clay/10 text-brand-clay font-medium text-[10px] px-2.5 py-0.5 rounded-full">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bio text excerpt */}
                <p className="font-sans text-xs text-brand-charcoal/80 leading-relaxed mb-6 line-clamp-2">
                  "{teacher.bio}"
                </p>
              </div>

              {/* Hourly Rate & CTA buttons */}
              <div>
                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-xs text-brand-charcoal/50">Rate:</span>
                  <div className="text-right">
                    <span className="font-heading font-bold text-xl text-brand-moss">{formattedRate}</span>
                    <span className="font-sans text-2xs text-brand-charcoal/50 block">/ hour</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onBookClick(teacher)}
                    className="btn-magnetic bg-brand-clay hover:bg-brand-clay/90 text-white font-bold py-2.5 px-4 rounded-full text-xs uppercase tracking-wider text-center"
                  >
                    Book Trial
                  </button>
                  <a
                    href="#chat"
                    onClick={(e) => { e.preventDefault(); alert(`Simulated Chat with ${teacher.name}. Interface is active in parent/teacher dashboards.`); }}
                    className="btn-magnetic border border-brand-moss/20 text-brand-moss font-bold py-2.5 px-4 rounded-full text-xs uppercase tracking-wider text-center hover:bg-brand-moss/5"
                  >
                    Message
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
