import { SEED_TEACHERS } from '../data/seedTeachers';
import React, { useEffect, useState } from 'react';
import { 
  Star, 
  ShieldCheck, 
  Video, 
  Calendar, 
  ArrowLeft, 
  Heart, 
  Languages, 
  MapPin, 
  Award, 
  CheckCircle2, 
  Zap, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  BookOpen,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { getTeacherAvatar, handleAvatarError } from '../utils/avatar';

export default function TeacherPublicProfile({ 
  username, 
  onBack, 
  onBookClick, 
  selectedCurrency, 
  formatCurrency, 
  convertMinor,
  bookedSessions = []
}) {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);

  // Accordion drop-down open/close states
  const [openSections, setOpenSections] = useState({
    about: true,
    booking: true,
    trophies: true,
    reviews: true
  });

  const toggleSection = (sectionKey) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Mobile tab selector: 'about' | 'booking' | 'all'
  const [mobileTab, setMobileTab] = useState('about');

  // Availability calendar states
  const [calendarMonth, setCalendarMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [selectedSlots, setSelectedSlots] = useState([]); // Array of { day, time, dateString }

  const API_BASE = import.meta.env.VITE_API_BASE || '/api';

  const getDaysInMonth = (d) => {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  };

  const getStartDayOfMonth = (d) => {
    return new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  };

  const isTeacherAvailableOnDate = (d) => {
    // Past dates are not available
    const today = new Date();
    today.setHours(0,0,0,0);
    const checkDate = new Date(d);
    checkDate.setHours(0,0,0,0);
    if (checkDate < today) return false;

    // If teacher has explicit custom availability days, check them
    if (teacher && teacher.availability && Object.keys(teacher.availability).length > 0) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = dayNames[d.getDay()];
      const oneDayMs = 24 * 60 * 60 * 1000;
      const isTomorrow = checkDate.getTime() - today.getTime() === oneDayMs;

      if (isTomorrow && (teacher.availability['Tomorrow'] || teacher.availability['tomorrow'])) {
        return true;
      }
      const availableDays = Object.keys(teacher.availability).map(k => k.toLowerCase());
      if (availableDays.includes(dayOfWeek.toLowerCase())) {
        return true;
      }
    }

    // By default all upcoming dates are open for booking!
    return true;
  };

  const getSlotsForDate = (d) => {
    const defaultDailySlots = ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM', '6:00 PM'];
    if (!teacher || !teacher.availability || Object.keys(teacher.availability).length === 0) {
      return defaultDailySlots;
    }
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[d.getDay()];
    
    // Check tomorrow first
    const today = new Date();
    today.setHours(0,0,0,0);
    const checkDate = new Date(d);
    checkDate.setHours(0,0,0,0);
    const oneDayMs = 24 * 60 * 60 * 1000;
    const isTomorrow = checkDate.getTime() - today.getTime() === oneDayMs;

    if (isTomorrow && (teacher.availability['Tomorrow'] || teacher.availability['tomorrow'])) {
      const slots = teacher.availability['Tomorrow'] || teacher.availability['tomorrow'];
      return (Array.isArray(slots) && slots.length > 0) ? slots : defaultDailySlots;
    }

    // Match weekday
    const matchedKey = Object.keys(teacher.availability).find(k => k.toLowerCase() === dayOfWeek.toLowerCase());
    if (matchedKey && Array.isArray(teacher.availability[matchedKey]) && teacher.availability[matchedKey].length > 0) {
      return teacher.availability[matchedKey];
    }
    return defaultDailySlots;
  };

  const handleSlotToggle = (time) => {
    if (!selectedDate) return;
    const dateString = selectedDate.toISOString().split('T')[0];
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const isSelected = selectedSlots.some(s => s.dateString === dateString && s.time === time);
    
    if (isSelected) {
      setSelectedSlots(prev => prev.filter(s => !(s.dateString === dateString && s.time === time)));
    } else {
      setSelectedSlots(prev => [...prev, { day: dayName, time, dateString }]);
    }
  };

  const isSlotSelected = (time) => {
    if (!selectedDate) return false;
    const dateString = selectedDate.toISOString().split('T')[0];
    return selectedSlots.some(s => s.dateString === dateString && s.time === time);
  };

  const isCalendarSlotBooked = (dateString, time) => {
    return (bookedSessions || []).some(session => 
      (session.teacherId === teacher?.id || session.teacherId === teacher?.uid) &&
      session.status !== 'Cancelled' &&
      session.slot &&
      (session.slot.dateString === dateString || session.slot.day === dateString || (session.slot.day && session.slot.day.includes(dateString))) &&
      session.slot.time === time
    );
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE}/teachers/by-username/${username}`);
        if (response.ok) {
          const data = await response.json();
          // Guarantee real photo if empty
          if (!data.avatar || data.avatar.includes('ui-avatars')) {
            data.avatar = getTeacherAvatar(data.avatar, data.name);
          }
          setTeacher(data);
          
          // SEO Metadata optimization on mount
          document.title = `${data.name || 'Tutor'} | Online Home Tutoring & Lessons | EduVista`;
          
          // Update or insert SEO meta description tag
          let metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
          }
          const subjects = Array.isArray(data.subjects) ? data.subjects.join(', ') : 'subjects';
          metaDesc.setAttribute('content', `Book premium online home tutoring and private lessons with ${data.name || 'this tutor'} on EduVista. Specializes in ${subjects}. Vetted credentials, secure escrow payment protection.`);
        } else {
          const usernameLower = username.toLowerCase();
          const seedMatch = SEED_TEACHERS.find(t => 
            (t.username && t.username.toLowerCase() === usernameLower) ||
            (t.uid && t.uid === username) ||
            (t.id && String(t.id) === username)
          );
          if (seedMatch) {
            setTeacher({
              ...seedMatch,
              avatar: getTeacherAvatar(seedMatch.avatar, seedMatch.name)
            });
            setError('');
            document.title = `${seedMatch.name} | Online Home Tutoring & Lessons | EduVista`;
            return;
          }
          const errData = await response.json().catch(() => ({}));
          setError(errData.error || 'Tutor public profile page not found.');
        }
      } catch (err) {
        console.warn("API offline, falling back to seed search for username:", username);
        const usernameLower = username.toLowerCase();
        
        const seedMatch = SEED_TEACHERS.find(t => 
          (t.username && t.username.toLowerCase() === usernameLower) ||
          (t.uid && t.uid === username) ||
          (t.id && String(t.id) === username)
        );
        if (seedMatch) {
          setTeacher({
            ...seedMatch,
            avatar: getTeacherAvatar(seedMatch.avatar, seedMatch.name)
          });
          setError('');
          document.title = `${seedMatch.name} | Online Home Tutoring & Lessons | EduVista`;
          return;
        }
        
        if (usernameLower === 'adenike') {
          const mockAdenike = {
            uid: "Il9kuOicX2a7PEiDwqnLZ9u02A53",
            id: "Il9kuOicX2a7PEiDwqnLZ9u02A53",
            name: "Adenike Enoch-Salami",
            location: "Lagos, Nigeria",
            subjects: ["Mathematics", "General Tutoring"],
            curricula: ["Primary (Ages 6-11)", "WAEC", "Cambridge"],
            rate: 350000,
            rating: 5.0,
            reviewsCount: 18,
            badges: ["badge-verified", "badge-bg-checked", "badge-top-rated"],
            bio: "Adenike Enoch-Salami is a verified educator on EduVista specializing in personalized instruction, foundational numeracy, and WAEC exam success. With extensive classroom experience, she tailors each lesson to the individual learner's pace.",
            avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop",
            coverImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop",
            languages: ["English", "Yoruba"],
            availability: {
              Tomorrow: ["3:00 PM", "4:00 PM", "5:00 PM"],
              Wednesday: ["2:00 PM", "3:00 PM", "4:00 PM"],
              Thursday: ["10:00 AM", "11:00 AM", "2:00 PM"],
              Friday: ["1:00 PM", "2:00 PM"]
            },
            reviews: [
              { 
                parent: "Ngozi A.", 
                text: "Fantastic tutor. Helped my child significantly with algebra concepts.", 
                score: 5, 
                date: "11/4/2026", 
                dimensions: { Punctuality: 5, Quality: 5, Communication: 4, Preparedness: 5, Impact: 5 } 
              }
            ]
          };
          setTeacher(mockAdenike);
          document.title = `${mockAdenike.name} | Online Home Tutoring & Lessons | EduVista`;
        } else if (usernameLower === 'adebayo') {
          const mockAdebayo = {
            uid: "teacher_1",
            id: "teacher_1",
            name: "Mr. Adebayo Okafor",
            location: "Lagos, Nigeria",
            subjects: ["Mathematics", "Physics"],
            curricula: ["WAEC", "JAMB", "IGCSE", "High School (Ages 15-18)"],
            rate: 400000,
            rating: 4.9,
            reviewsCount: 247,
            badges: ["badge-verified", "badge-top-rated", "badge-bg-checked"],
            bio: "12 years teaching mathematics preparation. Specializes in algebra speed calculations and IGCSE/WAEC exam setups.",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
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
          document.title = `${mockAdebayo.name} | Online Home Tutoring & Lessons | EduVista`;
        } else if (usernameLower === 'kofi') {
          const mockKofi = {
            uid: "teacher_2",
            id: "teacher_2",
            name: "Mr. Kofi Mensah",
            location: "Accra, Ghana",
            subjects: ["Chemistry", "Mathematics"],
            curricula: ["WAEC", "Cambridge", "Middle School (Ages 12-14)", "High School (Ages 15-18)"],
            rate: 450000,
            rating: 4.8,
            reviewsCount: 118,
            badges: ["badge-verified", "badge-fast"],
            bio: "Practical sciences master. Makes complex chemical formulas simple using visual laboratory representations.",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop",
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
          document.title = `${mockKofi.name} | Online Home Tutoring & Lessons | EduVista`;
        } else if (usernameLower === 'chioma') {
          const mockChioma = {
            uid: "teacher_3",
            id: "teacher_3",
            name: "Mrs. Chioma Nwachukwu",
            location: "Enugu, Nigeria",
            subjects: ["English", "Literature"],
            curricula: ["WAEC", "Cambridge", "SAT", "Primary (Ages 6-11)", "Middle School (Ages 12-14)"],
            rate: 350000,
            rating: 5.0,
            reviewsCount: 92,
            badges: ["badge-verified", "badge-elite"],
            bio: "Creative writing and syntax focus. Multi-jurisdiction English instructor with an emphasis on SAT prep.",
            avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop",
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
          document.title = `${mockChioma.name} | Online Home Tutoring & Lessons | EduVista`;
        } else if (usernameLower === 'aminata') {
          const mockAminata = {
            uid: "teacher_4",
            id: "teacher_4",
            name: "Ms. Aminata Diallo",
            location: "Nairobi, Kenya",
            subjects: ["Physics", "Chemistry"],
            curricula: ["IB Diploma", "Cambridge", "Primary (Ages 6-11)", "Middle School (Ages 12-14)"],
            rate: 550000,
            rating: 4.9,
            reviewsCount: 204,
            badges: ["badge-verified", "badge-top-rated"],
            bio: "Bilingual instructor specializing in AP, IB, and IGCSE physics frameworks.",
            avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=600&auto=format&fit=crop",
            coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop",
            languages: ["English", "French", "Swahili"],
            availability: {
              Wednesday: ["9:00 AM", "10:00 AM"],
              Friday: ["1:00 PM", "2:00 PM"]
            },
            reviews: []
          };
          setTeacher(mockAminata);
          document.title = `${mockAminata.name} | Online Home Tutoring & Lessons | EduVista`;
        } else if (usernameLower === 'fatima') {
          const mockFatima = {
            uid: "teacher_5",
            id: "teacher_5",
            name: "Mrs. Fatima Bello",
            location: "Abuja, Nigeria",
            subjects: ["English", "Mathematics"],
            curricula: ["Nursery (Ages 2-5)", "Primary (Ages 6-11)"],
            rate: 300000,
            rating: 4.9,
            reviewsCount: 84,
            badges: ["badge-verified", "badge-top-rated"],
            bio: "Early childhood development specialist. Passionate about phonics, foundational numeracy, and active learning strategies.",
            avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=600&auto=format&fit=crop",
            coverImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600&auto=format&fit=crop",
            languages: ["English", "Hausa"],
            availability: {
              Tomorrow: ["1:00 PM", "2:00 PM"],
              Thursday: ["10:00 AM", "11:00 AM"]
            },
            reviews: []
          };
          setTeacher(mockFatima);
        } else {
          setError('Tutor profile not found.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  useEffect(() => {
    if (!teacher) return;
    const teacherId = teacher.uid || teacher.id;
    fetch(`${API_BASE}/teachers/${teacherId}/reviews`)
      .then(res => res.json())
      .then(data => {
        if (data.reviews && data.reviews.length > 0) {
          setReviews(data.reviews.map(r => ({
            parent: r.parentName || 'Verified Parent',
            text: r.comment || 'Great session!',
            score: r.rating || 5,
            date: r.date,
            dimensions: r.dimensions
          })));
        } else if (Array.isArray(data) && data.length > 0) {
          setReviews(data);
        } else if (teacher.reviews && teacher.reviews.length > 0) {
          setReviews(teacher.reviews);
        }
      })
      .catch(err => {
        console.warn("Failed to fetch live reviews:", err);
        if (teacher.reviews) setReviews(teacher.reviews);
      });
  }, [teacher]);

  // Clean up SEO tags when unmounting
  useEffect(() => {
    return () => {
      document.title = 'EduVista | Premium 1-on-1 Online Home Tutoring & Private Lessons';
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', 'Connect with certified, background-checked private tutors for online home tutoring and personalized academic lessons.');
      }
    };
  }, [username]);

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

  // Teacher avatar helper
  const teacherAvatarSrc = getTeacherAvatar(teacher.avatar, teacher.name);

  // Render the Booking and Classes component block
  const renderBookingAndClasses = () => (
    <div className="bg-white border border-brand-moss/10 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-lg space-y-6">
      {/* Dropdown Header */}
      <button 
        type="button"
        onClick={() => toggleSection('booking')}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-clay/10 text-brand-clay flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg sm:text-xl text-brand-moss group-hover:text-brand-clay transition-colors">
              Booking and classes
            </h3>
            <span className="font-sans text-xs text-brand-charcoal/50 block">
              Availability calendar, lesson slots & rates
            </span>
          </div>
        </div>
        <div className="p-2 rounded-full hover:bg-brand-moss/5 text-brand-moss/70 transition-transform">
          {openSections.booking ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Collapsible Content */}
      {openSections.booking && (
        <div className="space-y-6 pt-2 animate-fade-in border-t border-brand-moss/5">
          {/* Rate Header Card */}
          <div className="bg-brand-cream/40 p-4 rounded-2xl border border-brand-moss/10 flex items-center justify-between">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-brand-charcoal/60 font-bold block mb-1">STANDARD HOURLY RATE</span>
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-2xl sm:text-3xl font-extrabold text-brand-moss">
                  {formatCurrency(convertMinor(teacher.rate || 350000, selectedCurrency), selectedCurrency)}
                </span>
                <span className="font-mono text-xs text-brand-charcoal/60">/ hour</span>
              </div>
            </div>
            <div className="text-right font-sans text-xs text-brand-charcoal/60">
              <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-1">
                ✓ 100% Escrow Protected
              </span>
              <span className="block text-[11px]">60 min 1-on-1 private lesson</span>
            </div>
          </div>

          {/* Quick info row */}
          <div className="space-y-2 font-sans text-xs">
            <div className="flex justify-between text-brand-charcoal/70 py-1 border-b border-brand-moss/5">
              <span>Spoken Languages:</span>
              <span className="font-bold flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-brand-clay" /> 
                {Array.isArray(teacher.languages) ? teacher.languages.join(', ') : (teacher.languages || 'English')}
              </span>
            </div>
            <div className="flex justify-between text-brand-charcoal/70 py-1">
              <span>Vetting Status:</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Profile
              </span>
            </div>
          </div>

          {/* Interactive Availability Calendar */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-heading font-bold text-brand-moss text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-clay" /> Select Date & Slot
              </h4>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  className="p-1 rounded-full hover:bg-brand-moss/5 text-brand-moss"
                  aria-label="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-[10px] font-bold text-brand-moss min-w-[90px] text-center">
                  {calendarMonth.toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  className="p-1 rounded-full hover:bg-brand-moss/5 text-brand-moss"
                  aria-label="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="border border-brand-moss/10 rounded-2xl p-3 bg-brand-cream/15">
              {/* Day Labels */}
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] text-brand-charcoal/40 font-bold mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((l, idx) => (
                  <span key={idx}>{l}</span>
                ))}
              </div>

              {/* Days Numbers */}
              <div className="grid grid-cols-7 gap-1">
                {/* Blank lead offsets */}
                {Array.from({ length: getStartDayOfMonth(calendarMonth) }).map((_, i) => (
                  <div key={`blank-${i}`} />
                ))}

                {/* Day Cells */}
                {(() => {
                  const daysInMonth = getDaysInMonth(calendarMonth);
                  const cells = [];
                  for (let day = 1; day <= daysInMonth; day++) {
                    const cellDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                    const available = isTeacherAvailableOnDate(cellDate);
                    const isSelected = selectedDate && 
                                       selectedDate.getDate() === day && 
                                       selectedDate.getMonth() === calendarMonth.getMonth() && 
                                       selectedDate.getFullYear() === calendarMonth.getFullYear();
                    
                    cells.push(
                      <button
                        key={day}
                        disabled={!available}
                        type="button"
                        onClick={() => {
                          setSelectedDate(cellDate);
                        }}
                        className={`h-7 w-7 rounded-full text-[9px] font-mono flex items-center justify-center mx-auto transition-all ${
                          isSelected
                            ? 'bg-brand-moss text-white font-bold shadow-sm'
                            : available
                            ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold'
                            : 'text-brand-charcoal/20 cursor-not-allowed'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  }
                  return cells;
                })()}
              </div>
            </div>

            {/* Slots Panel */}
            {selectedDate && (
              <div className="bg-brand-cream/35 border border-brand-moss/10 p-3.5 rounded-2xl animate-fade-up space-y-2">
                <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-brand-moss block">
                  Available Slots ({selectedDate.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}):
                </span>
                {getSlotsForDate(selectedDate).length === 0 ? (
                  <span className="text-[10px] text-brand-charcoal/50 italic block">No slots scheduled for this day. Please pick another date.</span>
                ) : (
                  <div className="flex gap-1.5 flex-wrap">
                    {getSlotsForDate(selectedDate).map(time => {
                      const dateString = selectedDate.toISOString().split('T')[0];
                      const booked = isCalendarSlotBooked(dateString, time);
                      const activeSelected = isSlotSelected(time);
                      return (
                        <button
                          key={time}
                          disabled={booked}
                          type="button"
                          onClick={() => handleSlotToggle(time)}
                          className={`py-1.5 px-3 rounded-xl border font-mono text-[10px] transition-all ${
                            booked
                              ? 'border-gray-200 bg-gray-150 text-gray-400 cursor-not-allowed opacity-50 line-through'
                              : activeSelected
                              ? 'bg-brand-clay border-brand-clay text-white font-bold shadow-xs'
                              : 'border-brand-moss/15 bg-white hover:border-brand-clay hover:text-brand-clay text-brand-charcoal'
                          }`}
                        >
                          {time} {booked && "(Booked)"}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Selected Sessions Summary Basket */}
            {selectedSlots.length > 0 && (
              <div className="bg-brand-moss/5 border border-brand-moss/10 rounded-2xl p-4 space-y-2 font-sans text-xs">
                <span className="font-heading font-bold text-brand-moss uppercase text-[10px] tracking-wider block">
                  Selected Sessions ({selectedSlots.length}):
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {selectedSlots.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white border border-brand-moss/10 rounded-xl px-3 py-2 shadow-xs">
                      <span>{s.day} at <strong className="text-brand-moss">{s.time}</strong></span>
                      <button 
                        type="button"
                        onClick={() => setSelectedSlots(prev => prev.filter((_, i) => i !== idx))} 
                        className="text-red-500 hover:text-red-700 font-bold ml-2 text-[10px] uppercase tracking-wider"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Direct CTA button to check booking triggers */}
          <button
            type="button"
            onClick={() => {
              if (selectedSlots.length > 0) {
                onBookClick(teacher, null, selectedSlots);
              } else {
                const targetDate = selectedDate || new Date();
                const available = getSlotsForDate(targetDate);
                const firstSlotTime = available[0] || '10:00 AM';
                const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                const dateString = targetDate.toISOString().split('T')[0];
                onBookClick(teacher, null, [{ day: dayName, time: firstSlotTime, dateString }]);
              }
            }}
            className="btn-magnetic w-full py-4 font-heading font-bold text-xs uppercase tracking-wider rounded-full shadow-lg flex items-center justify-center gap-2 bg-brand-clay hover:bg-brand-clay/95 text-white shadow-brand-clay/20 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4.5 h-4.5" /> 
            {selectedSlots.length > 0 
              ? `Book Selected Sessions (${selectedSlots.length})` 
              : 'Book 1-on-1 Session Now'
            }
          </button>
        </div>
      )}
    </div>
  );

  return (
    <article className="bg-brand-cream min-h-screen pb-24 text-brand-charcoal">
      
      {/* Cover Image Banner */}
      <div className="h-44 sm:h-64 md:h-80 w-full relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${teacher.coverImage || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop'})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-cream via-brand-moss/40 to-black/30" />
        
        {/* Back navigation button */}
        <button 
          onClick={onBack} 
          className="absolute top-4 sm:top-6 left-4 sm:left-12 py-2 px-4 sm:py-2.5 sm:px-5 bg-white/95 hover:bg-white backdrop-blur-md text-brand-moss font-sans font-bold text-xs uppercase tracking-wider rounded-full flex items-center gap-2 border border-brand-moss/10 shadow-md transition-all z-20"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 -mt-14 sm:-mt-20 md:-mt-24 relative z-10 space-y-6">
        
        {/* Main header block card with prominent, reactive mobile picture */}
        <div className="bg-white border border-brand-moss/10 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 w-full md:w-auto">
            {/* Tutor Picture */}
            <div className="relative shrink-0">
              <img 
                src={teacherAvatarSrc} 
                alt={teacher.name || 'Verified Tutor'} 
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl sm:rounded-[2rem] object-cover border-4 border-white shadow-md mx-auto sm:mx-0"
                onError={handleAvatarError(teacher.name)}
              />
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full border-2 border-white shadow-xs" title="Verified & Active" />
            </div>

            {/* Tutor Details */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="font-heading font-bold text-xl sm:text-3xl text-brand-moss leading-tight tracking-tight">
                  {teacher.name}
                </h1>
                <Award className="w-5 h-5 text-brand-clay" title="Verified Tutor Profile" />
              </div>
              <p className="font-drama italic text-sm text-brand-clay font-medium">
                Professional Instructor in {Array.isArray(teacher.subjects) ? teacher.subjects.join(' & ') : (teacher.subjects || 'General Tutoring')}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2 font-mono text-[10px] uppercase tracking-wider text-brand-charcoal/70">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-charcoal/40" />
                  <span>{teacher.location || 'Nigeria'}</span>
                </div>
                <span className="text-brand-charcoal/20">|</span>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-current text-brand-clay" />
                  <span className="font-bold text-brand-moss">{teacher.rating || 5.0}</span>
                  <span className="text-brand-charcoal/50">({reviews.length || teacher.reviewsCount || 0} reviews)</span>
                </div>
                <span className="text-brand-charcoal/20">|</span>
                <div className="flex items-center gap-1 text-emerald-700 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Tutor</span>
                </div>
              </div>
            </div>
          </div>

          {/* Badges checklist */}
          <div className="flex gap-2 flex-wrap justify-center md:justify-end w-full md:w-auto">
            {(teacher.badges || ['badge-verified']).filter(Boolean).map(badge => (
              <span key={badge} className={`font-mono text-[9px] uppercase tracking-wider font-bold py-1 px-3 rounded-full border ${
                badge === 'badge-bg-checked'
                  ? 'bg-amber-50 border-brand-clay/30 text-brand-clay'
                  : badge === 'badge-verified'
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : badge === 'badge-ai-cert'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]'
              }`}>
                {String(badge).replace('badge-', '').replace('-', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Mobile View Navigation Dropdown/Pill Switcher */}
        <div className="flex lg:hidden bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-brand-moss/10 shadow-sm gap-1">
          <button
            type="button"
            onClick={() => setMobileTab('about')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'about'
                ? 'bg-brand-moss text-white shadow-sm'
                : 'text-brand-charcoal/70 hover:text-brand-moss'
            }`}
          >
            <User className="w-4 h-4" /> About
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('booking')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'booking'
                ? 'bg-brand-clay text-white shadow-sm'
                : 'text-brand-charcoal/70 hover:text-brand-clay'
            }`}
          >
            <Calendar className="w-4 h-4" /> Booking & Classes
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('all')}
            className={`py-2.5 px-3 rounded-xl font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all ${
              mobileTab === 'all'
                ? 'bg-brand-charcoal text-white shadow-sm'
                : 'text-brand-charcoal/50 hover:text-brand-charcoal'
            }`}
          >
            View All
          </button>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Teacher Info (About, Trophy Cabinet, Parent Reviews) */}
          <div className={`space-y-6 lg:col-span-8 ${mobileTab === 'booking' ? 'hidden lg:block' : 'block'}`}>
            
            {/* Dropdown 1: About Tutor */}
            <div className="bg-white border border-brand-moss/10 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-sm space-y-4">
              <button
                type="button"
                onClick={() => toggleSection('about')}
                className="w-full flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-moss/10 text-brand-moss flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg sm:text-xl text-brand-moss group-hover:text-brand-clay transition-colors">
                      About
                    </h3>
                    <span className="font-sans text-xs text-brand-charcoal/50 block">
                      Teacher bio, background, and teaching methodology
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded-full hover:bg-brand-moss/5 text-brand-moss/70 transition-transform">
                  {openSections.about ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {openSections.about && (
                <div className="pt-3 border-t border-brand-moss/5 space-y-5 animate-fade-in">
                  <p className="font-sans text-brand-charcoal/80 text-sm leading-relaxed whitespace-pre-line">
                    {teacher.bio || `${teacher.name} is a verified tutor on EduVista specializing in personalized instruction, foundational concepts, and student success.`}
                  </p>

                  {/* Subjects & Curricula tags */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="bg-brand-cream/20 p-3.5 rounded-2xl border border-brand-moss/5">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 font-bold block mb-2">Specialized Subjects</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {(teacher.subjects || ['General Tutoring']).map(subj => (
                          <span key={subj} className="bg-white px-2.5 py-1 rounded-lg text-xs font-medium text-brand-moss border border-brand-moss/10">
                            {subj}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-brand-cream/20 p-3.5 rounded-2xl border border-brand-moss/5">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 font-bold block mb-2">Curriculum Standards</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {(teacher.curricula || ['Primary (Ages 6-11)', 'WAEC']).map(curr => (
                          <span key={curr} className="bg-white px-2.5 py-1 rounded-lg text-xs font-medium text-brand-clay border border-brand-clay/10">
                            {curr}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Video Intro (if available) */}
                  {teacher.videoUrl && (
                    <div className="border-t border-brand-moss/5 pt-4">
                      <h4 className="font-heading font-bold text-sm text-brand-moss mb-3 flex items-center gap-2">
                        <Video className="w-4 h-4 text-brand-clay" /> Video Introduction
                      </h4>
                      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-brand-charcoal border border-brand-moss/10 shadow-md">
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
              )}
            </div>

            {/* Mobile Booking Dropdown: Show right here when in 'all' view on small screens */}
            <div className="block lg:hidden">
              {mobileTab === 'all' && renderBookingAndClasses()}
            </div>

            {/* Dropdown 2: Trophy Cabinet */}
            {teacher.badges && teacher.badges.length > 0 && (
              <div className="bg-white border border-brand-moss/10 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-sm space-y-4">
                <button
                  type="button"
                  onClick={() => toggleSection('trophies')}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5 text-brand-clay" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg sm:text-xl text-brand-moss group-hover:text-brand-clay transition-colors">
                        Trophy Cabinet
                      </h3>
                      <span className="font-sans text-xs text-brand-charcoal/50 block">
                        Verified badges, identity checks & academic tiers
                      </span>
                    </div>
                  </div>
                  <div className="p-2 rounded-full hover:bg-brand-moss/5 text-brand-moss/70 transition-transform">
                    {openSections.trophies ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {openSections.trophies && (
                  <div className="pt-3 border-t border-brand-moss/5 flex gap-3 flex-wrap animate-fade-in">
                    {(teacher.badges || []).filter(Boolean).map(badge => (
                      <div key={badge} className="flex flex-col items-center justify-center p-4 border border-brand-moss/10 rounded-2xl bg-brand-cream/30 min-w-[110px] flex-1">
                        {badge === 'badge-top-rated' && <Star className="w-8 h-8 text-[#92400E] mb-2 fill-current" />}
                        {badge === 'badge-ai-cert' && <Zap className="w-8 h-8 text-emerald-600 mb-2 fill-current" />}
                        {badge === 'badge-verified' && <ShieldCheck className="w-8 h-8 text-blue-600 mb-2" />}
                        {badge === 'badge-bg-checked' && <ShieldCheck className="w-8 h-8 text-brand-clay mb-2 fill-brand-clay/10 animate-pulse" />}
                        <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-brand-charcoal text-center">
                          {String(badge).replace('badge-', '').replace('-', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Dropdown 3: Parent Assessment Reviews */}
            <div className="bg-white border border-brand-moss/10 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-sm space-y-4">
              <button
                type="button"
                onClick={() => toggleSection('reviews')}
                className="w-full flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-800 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg sm:text-xl text-brand-moss group-hover:text-brand-clay transition-colors">
                      Parent Assessment Reviews
                    </h3>
                    <span className="font-sans text-xs text-brand-charcoal/50 block">
                      {reviews.length} verified ratings & feedback
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded-full hover:bg-brand-moss/5 text-brand-moss/70 transition-transform">
                  {openSections.reviews ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {openSections.reviews && (
                <div className="pt-3 border-t border-brand-moss/5 space-y-4 animate-fade-in">
                  {(!reviews || reviews.length === 0) ? (
                    <div className="py-6 text-center font-sans text-brand-charcoal/50 text-xs">
                      No reviews logged yet. Active reviews display once tutoring sessions conclude.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((rev, index) => (
                        <div key={rev.id || index} className="bg-brand-cream/15 border border-brand-moss/5 rounded-2xl p-4 sm:p-5 space-y-3">
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
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-brand-moss/5">
                              {Object.entries(rev.dimensions).map(([dim, score]) => (
                                <div key={dim}>
                                  <div className="flex justify-between font-mono text-[8px] text-brand-charcoal/60 uppercase mb-0.5">
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
                          
                          <p className="font-sans text-xs text-brand-charcoal/80 leading-relaxed italic bg-white p-3 rounded-xl border border-brand-moss/5 shadow-xs">
                            "{rev.comment || rev.text}"
                          </p>

                          {rev.reply && (
                            <div className="bg-brand-moss/5 border border-brand-moss/10 rounded-xl p-3 ml-4 mt-2">
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
              )}
            </div>

          </div>

          {/* Right Column / Mobile Booking Tab: Booking and Classes Dropdown Card */}
          <div className={`lg:col-span-4 ${mobileTab === 'about' ? 'hidden lg:block' : 'block'} lg:sticky lg:top-24`}>
            {renderBookingAndClasses()}
          </div>

        </div>

      </div>

    </article>
  );
}
