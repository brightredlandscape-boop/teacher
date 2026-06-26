import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle, ShieldCheck, Video, Calendar, BookOpen, User } from 'lucide-react';

export default function TeacherOnboarding({ currentUser, onComplete, onBack }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Personal Info
  const [name, setName] = useState(currentUser?.displayName || '');
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('Lagos, Nigeria');
  const [whatsapp, setWhatsapp] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop');

  // Step 2: Subjects & Curriculums
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [selectedCurricula, setSelectedCurricula] = useState([]);
  const [customCurriculumInput, setCustomCurriculumInput] = useState('');

  // Step 3: Rates & Availability
  const [currency, setCurrency] = useState('NGN');
  const [timezone, setTimezone] = useState('Africa/Lagos');
  const [classroomLink, setClassroomLink] = useState('');
  const [recordingTool, setRecordingTool] = useState('');
  const [rate, setRate] = useState(4000); // ₦4,000 hourly default
  const [availability, setAvailability] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: []
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hourlySlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];

  const toggleSlot = (day, hour) => {
    setAvailability(prev => {
      const daySlots = prev[day] || [];
      const updatedSlots = daySlots.includes(hour)
        ? daySlots.filter(h => h !== hour)
        : [...daySlots, hour];
      return { ...prev, [day]: updatedSlots };
    });
  };

  // Step 4: Uploads
  const [videoUrl, setVideoUrl] = useState('');
  const [govIdUrl, setGovIdUrl] = useState('');
  const [degreeUrl, setDegreeUrl] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  
  const [uploadingState, setUploadingState] = useState({ type: null, progress: 0 });

  const handleFileUpload = async (e, type, setter) => {
    const file = e.target.files[0];
    if (!file) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!uploadPreset) {
      alert("Cloudinary upload preset is not configured. Pasting a direct URL is supported as a fallback.");
      return;
    }

    setUploadingState({ type, progress: 0 });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const resourceType = type === 'video' ? 'video' : (type === 'raw' ? 'raw' : 'auto');

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadingState({ type, progress: percent });
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setter(response.secure_url);
        } else {
          console.error(xhr.responseText);
          alert("Cloudinary upload failed: " + xhr.statusText);
        }
        setUploadingState({ type: null, progress: 0 });
      };

      xhr.onerror = () => {
        alert("Network error occurred during upload.");
        setUploadingState({ type: null, progress: 0 });
      };

      xhr.send(formData);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error occurred during upload.");
      setUploadingState({ type: null, progress: 0 });
    }
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

  const availableSubjects = ["Mathematics", "Physics", "Chemistry", "English", "Literature"];
  const availableCurricula = ["WAEC", "JAMB", "IGCSE", "Cambridge", "IB Diploma", "Primary (Ages 6-11)", "Middle School (Ages 12-14)", "High School (Ages 15-18)"];

  const toggleSubject = (s) => {
    setSelectedSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const toggleCurriculum = (c) => {
    setSelectedCurricula(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!name || !bio) {
        setError('Please fill out your display name and short bio.');
        return;
      }
      if (!whatsapp || !linkedin) {
        setError('Please provide your WhatsApp number and LinkedIn profile URL.');
        return;
      }
      if (!username) {
        setError('Please choose a unique public username.');
        return;
      }
      if (!/^[a-z0-9-]+$/.test(username)) {
        setError('Username can only contain lowercase letters, numbers, and hyphens.');
        return;
      }
    }
    if (step === 2 && selectedSubjects.length === 0) {
      setError('Please select at least one subject to proceed.');
      return;
    }
    if (step === 3) {
      if (!rate || rate <= 0) {
        setError('Please enter a valid hourly rate.');
        return;
      }
      const hasSlots = Object.values(availability).some(slots => slots.length > 0);
      if (!hasSlots) {
        setError('Please select at least one available hour slot on the booking calendar.');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      uid: currentUser.uid,
      name,
      username,
      location,
      whatsapp,
      linkedin,
      currency,
      rate: Math.round(rate * 100), // convert to minor units
      timezone,
      classroomLink,
      recordingTool,
      bio,
      subjects: selectedSubjects,
      curricula: selectedCurricula,
      languages: ["English"],
      availability,
      videoUrl,
      avatar,
      govIdUrl,
      degreeUrl,
      cvUrl
    };

    try {
      const response = await fetch(`${API_BASE}/teachers/onboard`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        onComplete(data);
      } else {
        const err = await response.json();
        setError(err.error || 'Failed to complete onboarding.');
      }
    } catch (err) {
      console.error('Onboarding API error:', err);
      // Local fallback
      onComplete({
        ...payload,
        status: "pending_approval",
        username: name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative py-28 px-6 md:px-16 lg:px-24 bg-brand-cream min-h-screen flex items-center justify-center">
      {onBack && (
        <button 
          onClick={onBack} 
          className="absolute top-6 left-6 sm:left-12 py-2.5 px-5 bg-white/90 hover:bg-white backdrop-blur-md text-brand-moss font-sans font-bold text-xs uppercase tracking-wider rounded-full flex items-center gap-2 border border-brand-moss/10 shadow-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
      )}
      <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] w-full max-w-2xl p-8 md:p-12 shadow-2xl relative overflow-y-auto max-h-[85vh]">
        
        {/* Step Progress Indicators */}
        <div className="flex justify-between items-center mb-8 border-b border-brand-moss/5 pb-6">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-heading font-bold text-xs transition-all duration-300 ${
                step === s 
                  ? 'bg-brand-moss text-white shadow-md' 
                  : step > s 
                  ? 'bg-brand-clay text-white' 
                  : 'bg-brand-moss/5 border border-brand-moss/10 text-brand-moss/40'
              }`}>
                {s}
              </div>
              <span className={`hidden sm:inline font-mono text-[9px] uppercase tracking-wider ${step === s ? 'text-brand-moss font-bold' : 'text-brand-moss/45'}`}>
                {s === 1 ? 'Personal' : s === 2 ? 'Subjects' : s === 3 ? 'Pricing' : 'Video & Review'}
              </span>
              {s < 4 && <div className="hidden sm:block w-8 h-px bg-brand-moss/10" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs py-3 px-4 rounded-xl mb-6 font-mono">
            ⚠️ {error}
          </div>
        )}

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">Step 1 // Profile Info</span>
              <h2 className="font-heading font-bold text-2xl text-brand-moss">Tell us about yourself</h2>
              <p className="font-sans text-xs text-brand-charcoal/70 mt-1">This information will be displayed publicly on your teacher profile page.</p>
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Display Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                    placeholder="e.g. Dr. Chidi Johnson"
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
                      placeholder="adebayo-maths"
                    />
                  </div>
                  <span className="text-[10px] text-brand-charcoal/40 mt-1 block px-1">Your profile URL: edubridge.africa/teacher/{username || 'username'}</span>
                </div>
              </div>

              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Physical Location</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                  placeholder="e.g. Lagos, Nigeria"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">WhatsApp Number</label>
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                    placeholder="+234 800 000 0000"
                  />
                </div>
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    required
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>

              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Profile Avatar</label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-brand-moss/20 shrink-0">
                    <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'image', setAvatar)}
                      disabled={uploadingState.type === 'image'}
                      className="text-xs text-brand-charcoal/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-moss/5 file:text-brand-moss hover:file:bg-brand-moss/10"
                    />
                    {uploadingState.type === 'image' && <span className="text-xs text-brand-clay ml-2">Uploading... {uploadingState.progress}%</span>}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Tutor Biography (Bio)</label>
                <textarea
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your qualifications, teaching methodology, and tutoring experiences..."
                  className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl p-4 text-brand-charcoal focus:outline-none focus:border-brand-clay h-28 resize-none text-sm leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Subjects & Curricula */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">Step 2 // Mastery</span>
              <h2 className="font-heading font-bold text-2xl text-brand-moss">Select Taught Subjects & Curriculums</h2>
              <p className="font-sans text-xs text-brand-charcoal/70 mt-1">Select the disciplines and academic levels you specialize in instructing.</p>
            </div>

            <div className="space-y-6 font-sans text-xs">
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
                        className={`py-2.5 px-4 rounded-xl border font-sans text-xs transition-all duration-300 ${
                          active
                            ? 'border-brand-clay bg-brand-clay/5 text-brand-charcoal font-bold'
                            : 'border-brand-moss/10 bg-white text-brand-charcoal/70 hover:border-brand-moss/20'
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
                      className="py-2.5 px-4 rounded-xl border font-sans text-xs transition-all duration-300 border-brand-clay bg-brand-clay/5 text-brand-charcoal font-bold"
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
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-3">Supported Curriculums</label>
                <div className="flex flex-wrap gap-2">
                  {availableCurricula.map(c => {
                    const active = selectedCurricula.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCurriculum(c)}
                        className={`py-2.5 px-4 rounded-xl border font-sans text-xs transition-all duration-300 ${
                          active
                            ? 'border-brand-clay bg-brand-clay/5 text-brand-charcoal font-bold'
                            : 'border-brand-moss/10 bg-white text-brand-charcoal/70 hover:border-brand-moss/20'
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
                      className="py-2.5 px-4 rounded-xl border font-sans text-xs transition-all duration-300 border-brand-clay bg-brand-clay/5 text-brand-charcoal font-bold"
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
            </div>
          </div>
        )}

        {/* Step 3: Rates & Availability */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">Step 3 // Logistics</span>
              <h2 className="font-heading font-bold text-2xl text-brand-moss">Rates & Availability Slots</h2>
              <p className="font-sans text-xs text-brand-charcoal/70 mt-1">Set your hourly tuition fee and configure initial booking window times.</p>
            </div>

            <div className="space-y-6 font-sans text-xs">
              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Hourly Rate</label>
                <div className="relative flex items-center">
                  <select 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value)} 
                    className="absolute left-0 bg-transparent text-brand-moss font-heading font-bold pl-3 pr-2 py-3 focus:outline-none border-r border-brand-moss/10"
                  >
                    <option value="NGN">₦ NGN</option>
                    <option value="USD">$ USD</option>
                    <option value="GBP">£ GBP</option>
                  </select>
                  <input
                    type="number"
                    required
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl pl-[5.5rem] pr-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm font-bold"
                  />
                  <span className="absolute right-4 font-sans text-2xs text-brand-charcoal/50">/ hour</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                  >
                    <option value="Africa/Lagos">West Africa Time (WAT)</option>
                    <option value="Africa/Nairobi">East Africa Time (EAT)</option>
                    <option value="Africa/Johannesburg">South Africa Standard Time (SAST)</option>
                    <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                    <option value="America/New_York">Eastern Standard Time (EST)</option>
                  </select>
                </div>
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Preferred Classroom Link</label>
                  <input
                    type="url"
                    value={classroomLink}
                    onChange={(e) => setClassroomLink(e.target.value)}
                    className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Recording Tool Preference</label>
                  <input
                    type="text"
                    value={recordingTool}
                    onChange={(e) => setRecordingTool(e.target.value)}
                    className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                    placeholder="e.g. Recordly.site, Zoom Cloud"
                  />
                </div>
              </div>

              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-3">Weekly Booking Hours Calendar</label>
                <p className="font-sans text-[11px] text-brand-charcoal/60 mb-4">
                  Select the hours you are available to teach for each day of the week.
                </p>
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 border border-brand-moss/10 rounded-2xl p-4 bg-brand-cream/10">
                  {daysOfWeek.map(day => {
                    const selectedHours = availability[day] || [];
                    return (
                      <div key={day} className="border-b border-brand-moss/5 pb-3 last:border-b-0 last:pb-0">
                        <span className="font-heading font-bold text-xs text-brand-moss block mb-2">{day}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {hourlySlots.map(hour => {
                            const isSelected = selectedHours.includes(hour);
                            return (
                              <button
                                key={hour}
                                type="button"
                                onClick={() => toggleSlot(day, hour)}
                                className={`py-1.5 px-3 rounded-lg border text-[10px] font-mono tracking-tight transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                                  isSelected
                                    ? 'bg-brand-clay text-white border-brand-clay font-bold shadow-sm'
                                    : 'bg-white border-brand-moss/10 text-brand-charcoal/70 hover:border-brand-moss/30'
                                }`}
                              >
                                {hour}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Video Upload & Final Review */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">Step 4 // Certification</span>
              <h2 className="font-heading font-bold text-2xl text-brand-moss">Video Intro & Verification Review</h2>
              <p className="font-sans text-xs text-brand-charcoal/70 mt-1">Provide a brief 1-2 minute video introduction link and vetting credentials to complete your application.</p>
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Government ID (NIN/Passport)</label>
                  <div className="relative border border-dashed border-brand-moss/30 rounded-xl p-3 text-center bg-brand-cream/10">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => handleFileUpload(e, 'raw', setGovIdUrl)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-xs text-brand-moss font-bold">
                      {govIdUrl ? 'ID Uploaded ✓' : (uploadingState.type === 'raw' ? `Uploading ${uploadingState.progress}%` : 'Upload ID Document')}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">CV / Resume</label>
                  <div className="relative border border-dashed border-brand-moss/30 rounded-xl p-3 text-center bg-brand-cream/10">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => handleFileUpload(e, 'raw', setCvUrl)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-xs text-brand-moss font-bold">
                      {cvUrl ? 'CV Uploaded ✓' : (uploadingState.type === 'raw' ? `Uploading ${uploadingState.progress}%` : 'Upload Resume')}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">University Degree / Qualifications</label>
                <div className="relative border border-dashed border-brand-moss/30 rounded-xl p-3 text-center bg-brand-cream/10">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => handleFileUpload(e, 'raw', setDegreeUrl)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-xs text-brand-moss font-bold">
                    {degreeUrl ? 'Qualifications Uploaded ✓' : (uploadingState.type === 'raw' ? `Uploading ${uploadingState.progress}%` : 'Upload Credentials')}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Video Introduction (Cloudinary Upload or URL)</label>
                <div className="space-y-3">
                  {/* Cloudinary File Upload Box */}
                  <div className="border border-dashed border-brand-moss/30 hover:border-brand-clay/50 rounded-2xl p-5 bg-brand-cream/10 transition-colors text-center relative">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileUpload(e, 'video', setVideoUrl)}
                      disabled={uploadingState.type === 'video'}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Video className="w-8 h-8 text-brand-clay" />
                      <span className="font-heading font-bold text-xs text-brand-moss">
                        {uploadingState.type === 'video' ? `Uploading to Cloudinary: ${uploadingState.progress}%` : "Drag & Drop or Click to Upload Intro Video"}
                      </span>
                      <span className="font-sans text-[10px] text-brand-charcoal/50">MP4, WebM up to 50MB</span>
                    </div>
                    
                    {/* Progress Bar */}
                    {uploadingState.type === 'video' && (
                      <div className="w-full bg-brand-moss/10 rounded-full h-1.5 mt-3 overflow-hidden">
                        <div className="bg-brand-clay h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadingState.progress}%` }} />
                      </div>
                    )}
                  </div>

                  {/* Manual URL input fallback */}
                  <div className="relative flex items-center">
                    <span className="font-sans font-bold text-[10px] uppercase text-brand-charcoal/40 bg-brand-cream/30 border border-brand-moss/10 px-3 py-3 rounded-l-xl border-r-0">URL</span>
                    <input
                      type="url"
                      placeholder="Or paste video URL (e.g. YouTube, Cloudinary, etc.)"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-r-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Review summary cards */}
              <div className="bg-brand-moss/5 border border-brand-moss/10 rounded-2xl p-5 space-y-3 text-brand-moss leading-relaxed">
                <div className="flex items-center gap-2 border-b border-brand-moss/5 pb-2">
                  <ShieldCheck className="w-5 h-5 text-brand-clay" />
                  <span className="font-heading font-bold text-sm">Application Summary Review</span>
                </div>
                <div className="text-[11px] grid grid-cols-2 gap-y-2 gap-x-4">
                  <div>Tutor Name: <b>{name}</b></div>
                  <div>Hourly rate: <b>₦{rate}/hr</b></div>
                  <div>Subjects count: <b>{selectedSubjects.length} selected</b></div>
                  <div>Curriculums: <b>{selectedCurricula.length} selected</b></div>
                  <div className="col-span-2">Government ID: <b className="truncate block max-w-xs">{govIdUrl ? 'Uploaded' : 'Missing'}</b></div>
                  <div className="col-span-2">University Degree: <b className="truncate block max-w-xs">{degreeUrl ? 'Uploaded' : 'Missing'}</b></div>
                  <div className="col-span-2">CV / Resume: <b className="truncate block max-w-xs">{cvUrl ? 'Uploaded' : 'Missing'}</b></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex gap-4 mt-8 pt-6 border-t border-brand-moss/5">
          {step > 1 && (
            <button
              onClick={handlePrev}
              type="button"
              className="py-3 px-6 rounded-full border border-brand-moss/10 text-brand-moss hover:bg-brand-moss/5 font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={handleNext}
              type="button"
              className="flex-1 py-3 px-6 rounded-full bg-brand-moss hover:bg-brand-moss/95 text-white font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !videoUrl || !govIdUrl || !degreeUrl || !cvUrl}
              className="flex-1 py-3 px-6 rounded-full bg-brand-clay hover:bg-brand-clay/95 text-white font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-brand-clay/10 transition-all disabled:opacity-40"
            >
              {loading ? 'Submitting Application...' : 'Submit Teacher Application'} <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </section>
  );
}
