import React, { useEffect, useState } from 'react';
import { Star, ShieldCheck, Video, Calendar, ArrowLeft, Heart, Languages, MapPin, Award, CheckCircle2, Zap } from 'lucide-react';

export default function TeacherPublicProfile({ 
  username, 
  onBack, 
  onBookClick, 
  selectedCurrency, 
  formatCurrency, 
  convertMinor 
}) {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);

  const API_BASE = import.meta.env.VITE_API_BASE || '/api';

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE}/teachers/by-username/${username}`);
        if (response.ok) {
          const data = await response.json();
          setTeacher(data);
          
          // SEO Metadata optimization on mount
          document.title = `${data.name || 'Tutor'} | Premium Vetted Tutor | EduBridge Africa`;
          
          // Update or insert SEO meta description tag
          let metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
          }
          const subjects = Array.isArray(data.subjects) ? data.subjects.join(', ') : 'subjects';
          metaDesc.setAttribute('content', `Book private lessons with ${data.name || 'this tutor'} on EduBridge. Specializes in ${subjects}. Vetted credentials, secure escrows, and AI certified.`);
        } else {
          const errData = await response.json().catch(() => ({}));
          setError(errData.error || 'Tutor public profile page not found.');
        }
      } catch (err) {
        console.warn("API offline, falling back to mock search for username:", username);
        // Fallback mock details for adebayo
        const usernameLower = username.toLowerCase();
        if (usernameLower === 'adebayo') {
          const mockAdebayo = {
            uid: "teacher_1",
            name: "Mr. Adebayo Okafor",
            location: "Lagos, Nigeria",
            subjects: ["Mathematics", "Physics"],
            curricula: ["WAEC", "JAMB", "IGCSE", "High School (Ages 15-18)"],
            rate: 400000,
            rating: 4.9,
            reviewsCount: 247,
            badges: ["badge-verified", "badge-top-rated", "badge-bg-checked"],
            bio: "12 years teaching mathematics preparation. Specializes in algebra speed calculations and IGCSE/WAEC exam setups.",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
            coverImage: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=600&auto=format&fit=crop",
            videoUrl: "https://res.cloudinary.com/demo/video/upload/elephants.mp4",
            languages: ["English", "Yoruba"],
            availability: {
              Tomorrow: ["4:00 PM", "5:00 PM"],
              Wednesday: ["3:00 PM", "4:00 PM"]
            },
            reviews: [
              { parent: "Kehinde A.", text: "Excellent algebra prep. Tunde passed his WAEC with an A1!", score: 5 },
              { parent: "Sarah M.", text: "Great physics explanations. Highly recommend.", score: 5 }
            ]
          };
          setTeacher(mockAdebayo);
          document.title = `${mockAdebayo.name} | Premium Vetted Tutor | EduBridge Africa`;
        } else if (usernameLower === 'kofi') {
          const mockKofi = {
            uid: "teacher_2",
            name: "Mr. Kofi Mensah",
            location: "Accra, Ghana",
            subjects: ["Chemistry", "Mathematics"],
            curricula: ["WAEC", "Cambridge", "Middle School (Ages 12-14)", "High School (Ages 15-18)"],
            rate: 450000,
            rating: 4.8,
            reviewsCount: 118,
            badges: ["badge-verified", "badge-fast"],
            bio: "Practical sciences master. Makes complex chemical formulas simple using visual laboratory representations.",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop",
            coverImage: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=600&auto=format&fit=crop",
            videoUrl: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
            languages: ["English", "Twi"],
            availability: {
              Tomorrow: ["2:00 PM", "3:00 PM"],
              Wednesday: ["1:00 PM", "2:00 PM"]
            },
            reviews: []
          };
          setTeacher(mockKofi);
          document.title = `${mockKofi.name} | Premium Vetted Tutor | EduBridge Africa`;
        } else if (usernameLower === 'chioma') {
          const mockChioma = {
            uid: "teacher_3",
            name: "Mrs. Chioma Nwachukwu",
            location: "Enugu, Nigeria",
            subjects: ["English", "Literature"],
            curricula: ["WAEC", "Cambridge", "SAT", "Primary (Ages 6-11)", "Middle School (Ages 12-14)"],
            rate: 350000,
            rating: 5.0,
            reviewsCount: 92,
            badges: ["badge-verified", "badge-elite"],
            bio: "Creative writing and syntax focus. Multi-jurisdiction English instructor with an emphasis on SAT prep.",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
            coverImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop",
            videoUrl: "https://res.cloudinary.com/demo/video/upload/elephants.mp4",
            languages: ["English", "Igbo"],
            availability: {
              Tomorrow: ["9:00 AM", "10:00 AM"],
              Thursday: ["1:00 PM", "2:00 PM"]
            },
            reviews: []
          };
          setTeacher(mockChioma);
          document.title = `${mockChioma.name} | Premium Vetted Tutor | EduBridge Africa`;
        } else if (usernameLower === 'aminata') {
          const mockAminata = {
            uid: "teacher_4",
            name: "Ms. Aminata Diallo",
            location: "Nairobi, Kenya",
            subjects: ["Physics", "Chemistry"],
            curricula: ["IB Diploma", "Cambridge", "Primary (Ages 6-11)", "Middle School (Ages 12-14)"],
            rate: 550000,
            rating: 4.9,
            reviewsCount: 204,
            badges: ["badge-verified", "badge-top-rated"],
            bio: "Bilingual instructor specializing in AP, IB, and IGCSE physics frameworks.",
            avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop",
            coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop",
            languages: ["English", "French", "Swahili"],
            availability: {
              Wednesday: ["9:00 AM", "10:00 AM"],
              Friday: ["1:00 PM", "2:00 PM"]
            },
            reviews: []
          };
          setTeacher(mockAminata);
          document.title = `${mockAminata.name} | Premium Vetted Tutor | EduBridge Africa`;
        } else if (usernameLower === 'fatima') {
          const mockFatima = {
            uid: "teacher_5",
            name: "Mrs. Fatima Bello",
            location: "Abuja, Nigeria",
            subjects: ["English", "Mathematics"],
            curricula: ["Nursery (Ages 2-5)", "Primary (Ages 6-11)"],
            rate: 300000,
            rating: 4.9,
            reviewsCount: 84,
            badges: ["badge-verified", "badge-top-rated"],
            bio: "Early childhood development specialist. Passionate about phonics, foundational numeracy, and active learning strategies.",
            avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
            coverImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600&auto=format&fit=crop",
            languages: ["English", "Hausa"],
            availability: {
              Tomorrow: ["1:00 PM", "2:00 PM"],
              Thursday: ["10:00 AM", "11:00 AM"]
            },
            reviews: []
          };
          setTeacher(mockFatima);
          document.title = `${mockFatima.name} | Premium Vetted Tutor | EduBridge Africa`;
        } else {
          setError('Tutor public profile page not found.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    // Clean up SEO tags when unmounting
    return () => {
      document.title = 'EduBridge — Connecting African educators with verified training';
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', 'Connecting African educators with verified training, resources, and career-boosting opportunities.');
      }
    };
  }, [username]);

  useEffect(() => {
    if (teacher && (teacher.uid || teacher.id)) {
      fetch(`${API_BASE}/teachers/${teacher.uid || teacher.id}/reviews`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setReviews(data);
          } else {
            setReviews(teacher.reviews || []);
          }
        })
        .catch(err => {
          console.error(err);
          setReviews(teacher.reviews || []);
        });
    }
  }, [teacher?.uid, teacher?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center font-mono text-xs">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-brand-clay border-t-transparent animate-spin mx-auto" />
          <span>Synchronizing Tutor SEO Profile Registry...</span>
        </div>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-6 text-center">
        <h2 className="font-heading font-bold text-2xl text-brand-moss mb-2">Profile Not Found</h2>
        <p className="font-sans text-xs text-brand-charcoal/70 max-w-sm mb-6">{error || 'This public tutor page is suspended, unverified, or does not exist.'}</p>
        <button onClick={onBack} className="py-2.5 px-6 rounded-full bg-brand-moss text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Return to Homepage
        </button>
      </div>
    );
  }

  return (
    <article className="bg-brand-cream min-h-screen pb-24 text-brand-charcoal">
      
      {/* Cover Image Banner */}
      <div className="h-64 sm:h-80 w-full relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${teacher.coverImage || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop'})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-cream via-brand-moss/30 to-black/20" />
        
        {/* Back navigation button */}
        <button 
          onClick={onBack} 
          className="absolute top-6 left-6 sm:left-12 py-2.5 px-5 bg-white/90 hover:bg-white backdrop-blur-md text-brand-moss font-sans font-bold text-xs uppercase tracking-wider rounded-full flex items-center gap-2 border border-brand-moss/10 shadow-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-16 sm:-mt-24 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Tutor Dossier */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main header block card */}
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-10 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <img 
                src={teacher.avatar} 
                alt={teacher.name} 
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-[2rem] object-cover border-2 border-white shadow-md"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="font-heading font-bold text-xl sm:text-3xl text-brand-moss leading-tight tracking-tight">
                    {teacher.name}
                  </h1>
                  <Award className="w-5 h-5 text-brand-clay" title="Verified Tutor Profile" />
                </div>
                <p className="font-drama italic text-sm text-brand-clay font-medium">
                  Professional Instructor in {Array.isArray(teacher.subjects) ? teacher.subjects.join(' & ') : ''}
                </p>
                <div className="flex items-center gap-1.5 mt-2 font-mono text-[9px] uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-brand-charcoal/40" />
                  <span>{teacher.location}</span>
                  <span className="text-brand-charcoal/20">|</span>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-current text-brand-clay" />
                    <span className="font-bold text-brand-moss">{teacher.rating || 5.0}</span>
                    <span className="text-brand-charcoal/50">({teacher.reviewsCount || 0} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges checklist */}
            <div className="flex gap-2 flex-wrap">
              {(teacher.badges || []).filter(Boolean).map(badge => (
                  <span key={badge} className={`font-mono text-[9px] uppercase tracking-wider font-bold py-1 px-3 rounded-full border ${
                    badge === 'badge-bg-checked'
                      ? 'bg-amber-50 border-brand-clay/30 text-brand-clay'
                      : badge === 'badge-verified'
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : badge === 'badge-ai-cert'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]'
                  }`}>
                    {badge ? String(badge).replace('badge-', '').replace('-', ' ') : ''}
                  </span>
                )
              )}
            </div>
          </div>

          {/* About / Video Intro Row */}
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <h3 className="font-heading font-bold text-lg text-brand-moss mb-3">About Tutor</h3>
              <p className="font-sans text-brand-charcoal/80 text-sm leading-relaxed whitespace-pre-line">
                {teacher.bio || 'Tutor biography description currently being optimized by Gemini AI.'}
              </p>
            </div>

            {/* Video Intro */}
            {teacher.videoUrl && (
              <div className="border-t border-brand-moss/5 pt-6">
                <h3 className="font-heading font-bold text-lg text-brand-moss mb-4 flex items-center gap-2">
                  <Video className="w-5 h-5 text-brand-clay animate-pulse" /> Video Introduction
                </h3>
                <div className="aspect-video w-full rounded-[2rem] overflow-hidden bg-brand-charcoal border border-brand-moss/10 shadow-lg">
                  {teacher.videoUrl.includes('youtube.com') || teacher.videoUrl.includes('youtu.be') ? (
                    <iframe 
                      className="w-full h-full"
                      src={teacher.videoUrl.replace('watch?v=', 'embed/')} 
                      title="Tutor Video Introduction"
                      frameBorder="0" 
                      allowFullScreen
                    />
                  ) : (
                    <video controls className="w-full h-full object-cover">
                      <source src={teacher.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Trophy Cabinet */}
          {teacher.badges && teacher.badges.length > 0 && (
            <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
              <h3 className="font-heading font-bold text-lg text-brand-moss mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-brand-clay" /> Trophy Cabinet
              </h3>
              <div className="flex gap-3 flex-wrap">
                {(teacher.badges || []).filter(Boolean).map(badge => (
                  <div key={badge} className="flex flex-col items-center justify-center p-4 border border-brand-moss/10 rounded-2xl bg-brand-cream/30 min-w-[100px]">
                    {badge === 'badge-top-rated' && <Star className="w-8 h-8 text-[#92400E] mb-2 fill-current" />}
                    {badge === 'badge-ai-cert' && <Zap className="w-8 h-8 text-emerald-600 mb-2 fill-current" />}
                    {badge === 'badge-verified' && <ShieldCheck className="w-8 h-8 text-blue-600 mb-2" />}
                    {badge === 'badge-bg-checked' && <ShieldCheck className="w-8 h-8 text-brand-clay mb-2 fill-brand-clay/10 animate-pulse" />}
                    <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-brand-charcoal text-center">
                      {badge ? String(badge).replace('badge-', '').replace('-', ' ') : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews list */}
          <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
            <h3 className="font-heading font-bold text-lg text-brand-moss mb-6">Parent Assessment Reviews</h3>
            
            {(!reviews || reviews.length === 0) ? (
              <div className="py-6 text-center font-sans text-brand-charcoal/50 text-xs">
                No reviews logged yet. Active reviews display once classroom trials conclude.
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((rev, index) => (
                  <div key={rev.id || index} className="bg-brand-cream/15 border border-brand-moss/5 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-heading font-bold text-brand-moss text-sm">{rev.parentName || rev.parent || 'Verified Parent'}</h4>
                        <div className="flex gap-0.5 text-brand-clay mt-1">
                          {Array.from({ length: Math.max(0, Math.min(5, Math.round(Number(rev.overallRating || rev.score || 5)) || 5)) }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </div>
                      <span className="font-mono text-[9px] text-brand-charcoal/40 uppercase">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : rev.date || 'Recent'}
                      </span>
                    </div>

                    {/* 5 Dimensions */}
                    {rev.dimensions && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-brand-moss/5">
                        {Object.entries(rev.dimensions).map(([dim, score]) => (
                          <div key={dim}>
                            <div className="flex justify-between font-mono text-[9px] text-brand-charcoal/60 uppercase mb-1">
                              <span>{dim}</span>
                              <span>{score}/5</span>
                            </div>
                            <div className="w-full bg-brand-moss/10 rounded-full h-1.5">
                              <div className="bg-brand-clay h-1.5 rounded-full" style={{ width: `${(score / 5) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="font-sans text-xs text-brand-charcoal/80 leading-relaxed italic bg-white p-3 rounded-xl border border-brand-moss/5 shadow-sm">
                      "{rev.comment || rev.text}"
                    </p>

                    {rev.reply && (
                      <div className="bg-brand-moss/5 border border-brand-moss/10 rounded-xl p-3 ml-6 mt-2 relative">
                        <div className="absolute -left-3 top-4 w-3 h-px bg-brand-moss/20" />
                        <h5 className="font-heading font-bold text-[10px] text-brand-moss uppercase tracking-wider mb-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tutor Reply
                        </h5>
                        <p className="font-sans text-xs text-brand-charcoal/70 leading-relaxed">{rev.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Rate Card & Slot booking */}
        <div className="lg:col-span-4 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-lg space-y-6 lg:sticky lg:top-28">
          <div>
            <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block mb-1">TRIAL CLASS RATE</span>
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-4xl font-extrabold text-brand-moss">
                {formatCurrency(convertMinor(350000, selectedCurrency), selectedCurrency)}
              </span>
              <span className="font-mono text-xs text-brand-charcoal/50">/ class</span>
            </div>
          </div>

          <div className="h-px bg-brand-moss/5" />

          {/* Availability details summary */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-brand-moss text-xs uppercase tracking-wider">Available Classes</h4>
            <div className="space-y-2 font-sans text-xs">
              <div className="flex justify-between text-brand-charcoal/70">
                <span>Spoken Languages:</span>
                <span className="font-bold flex items-center gap-1"><Languages className="w-3.5 h-3.5 text-brand-clay" /> {Array.isArray(teacher.languages) ? teacher.languages.join(', ') : (typeof teacher.languages === 'string' ? teacher.languages : 'English')}</span>
              </div>
              <div className="flex justify-between text-brand-charcoal/70">
                <span>Vetting Status:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Verified Profile</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-brand-moss/5" />

          {/* Slot Scheduler options list */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-brand-moss text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-clay" /> Booking Slots
            </h4>
            <div className="space-y-2">
              {teacher.availability && Object.keys(teacher.availability).map(day => (
                <div key={day} className="bg-brand-cream/30 border border-brand-moss/5 p-3 rounded-xl">
                  <div className="font-mono text-[9px] uppercase tracking-wider font-bold text-brand-moss mb-1.5">{day}</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {Array.isArray(teacher.availability[day]) && teacher.availability[day].map(time => (
                      <button
                        key={time}
                        onClick={() => onBookClick(teacher)}
                        className="py-1 px-2.5 rounded-lg border border-brand-moss/10 hover:border-brand-clay hover:text-brand-clay bg-white font-mono text-[9px] transition-all text-brand-charcoal"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Direct CTA button to check booking triggers */}
          <button
            onClick={() => onBookClick(teacher)}
            className="btn-magnetic w-full py-4 bg-brand-clay hover:bg-brand-clay/95 text-white font-heading font-bold text-xs uppercase tracking-wider rounded-full shadow-lg shadow-brand-clay/20 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4.5 h-4.5" /> Book Trial Session
          </button>
        </div>

      </div>

    </article>
  );
}
