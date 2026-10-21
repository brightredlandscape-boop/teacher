import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, CreditCard, Shield, Clock, Lock, CheckCircle2, Download, ExternalLink, Users, Sparkles } from 'lucide-react';
import { getTeacherAvatar, handleAvatarError } from '../utils/avatar';
import { 
  getUserTimezone, 
  getTimezoneAbbr, 
  convertWatTimeToLocal, 
  generateGoogleCalendarUrl, 
  downloadIcsCalendarInvite 
} from '../utils/timezone';

export default function BookingModal({ 
  isOpen, 
  onClose, 
  teacher, 
  selectedCurrency, 
  walletBalance, 
  onBook, 
  formatCurrency, 
  convertMinor,
  bookedSessions = [],
  preselectedSlots = []
}) {
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [isSiblingBundle, setIsSiblingBundle] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const userTimezone = useMemo(() => getUserTimezone(), []);
  const timezoneAbbr = useMemo(() => getTimezoneAbbr(userTimezone), [userTimezone]);

  useEffect(() => {
    if (teacher) {
      setSelectedSubject(teacher.subjects?.[0] || 'General');
      setSelectedCurriculum(teacher.curricula?.[0] || 'Standard');
    }
  }, [teacher]);
  
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [isProcessing, setIsProcessing] = useState(false);

  // Credit Card Gateway States
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  
  // OTP Verification States
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [paymentStatusText, setPaymentStatusText] = useState('');

  const isFirstTrial = !bookedSessions || bookedSessions.length === 0;
  const teacherRateMinor = teacher ? (teacher.rate || 0) : 350000;
  const baseActiveRateMinor = isFirstTrial ? 0 : teacherRateMinor;

  // Apply 10% Sibling bundle discount if selected
  const activeRateMinor = isSiblingBundle && !isFirstTrial
    ? Math.round(baseActiveRateMinor * 0.9)
    : baseActiveRateMinor;

  const convertedRateMinor = convertMinor(activeRateMinor, selectedCurrency);
  const formattedRate = isFirstTrial ? "Free (First Trial Class)" : formatCurrency(convertedRateMinor, selectedCurrency);

  // Generate upcoming slots based on teacher availability mapped to actual calendar dates
  const generateUpcomingSlots = (availability) => {
    if (!availability) return [];
    const slotsList = [];
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Loop over the next 14 days
    for (let i = 1; i <= 14; i++) {
      const futureDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const weekday = dayNames[futureDate.getDay()];
      const dateString = futureDate.toISOString().split('T')[0];
      const formattedDay = futureDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      
      // Match availability keys case-insensitively
      let times = [];
      const isTomorrow = i === 1;
      if (isTomorrow && (availability['Tomorrow'] || availability['tomorrow'])) {
        times = availability['Tomorrow'] || availability['tomorrow'] || [];
      } else {
        const matchedKey = Object.keys(availability).find(k => k.toLowerCase() === weekday.toLowerCase());
        if (matchedKey) {
          times = availability[matchedKey] || [];
        }
      }
      
      if (Array.isArray(times)) {
        times.forEach(time => {
          slotsList.push({
            day: formattedDay,
            time: time,
            dateString: dateString
          });
        });
      }
    }
    return slotsList;
  };

  // Construct availability slots list
  const slots = useMemo(() => {
    if (!teacher) return [];
    
    // Convert teacher weekly availability to actual dates
    const upcoming = generateUpcomingSlots(teacher.availability || {});
    
    // Merge preselected slots to make sure they are included
    const allSlots = [...upcoming];
    if (preselectedSlots && preselectedSlots.length > 0) {
      preselectedSlots.forEach(ps => {
        const exists = allSlots.some(s => s.dateString === ps.dateString && s.time === ps.time);
        if (!exists) {
          allSlots.push({
            day: ps.day,
            time: ps.time,
            dateString: ps.dateString
          });
        }
      });
    }

    // Fallback if none defined
    if (allSlots.length === 0) {
      const today = new Date();
      for (let i = 1; i <= 3; i++) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
        allSlots.push({
          day: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
          time: i === 1 ? "10:00 AM" : "3:30 PM",
          dateString: d.toISOString().split('T')[0]
        });
      }
    }

    // Sort slots by dateString then time
    allSlots.sort((a, b) => {
      const dDiff = a.dateString.localeCompare(b.dateString);
      if (dDiff !== 0) return dDiff;
      return a.time.localeCompare(b.time);
    });

    return allSlots.map((s, idx) => ({ id: idx + 1, ...s }));
  }, [teacher, preselectedSlots]);

  // Synchronize state when the modal opens or preselectedSlots change
  useEffect(() => {
    if (isOpen && slots.length > 0) {
      if (preselectedSlots && preselectedSlots.length > 0) {
        const matchingIds = slots.filter(s =>
          preselectedSlots.some(ps => ps.dateString === s.dateString && ps.time === s.time)
        ).map(s => s.id);
        setSelectedSlots(matchingIds.length > 0 ? matchingIds : [slots[0].id]);
      } else {
        setSelectedSlots([]);
      }
      setConfirmedBooking(null);
    }
  }, [isOpen, preselectedSlots, slots]);

  const numSelected = selectedSlots.length > 0 ? selectedSlots.length : 1;
  const totalRateMinor = activeRateMinor * numSelected;
  const formattedTotalRate = formatCurrency(convertMinor(totalRateMinor, selectedCurrency), selectedCurrency);

  const isSlotBooked = (slot) => {
    return (bookedSessions || []).some(session => 
      (session.teacherId === teacher?.id || session.teacherId === teacher?.uid) &&
      session.status !== 'Cancelled' &&
      session.slot &&
      (session.slot.dateString === slot.dateString || session.slot.day === slot.day || (session.slot.day && session.slot.day.includes(slot.dateString))) &&
      session.slot.time === slot.time
    );
  };

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const matches = value.match(/\d{1,4}/g);
    const matchString = matches ? matches.join(' ') : '';
    setCardNumber(matchString);
  };

  // Format Card Expiry (adds slash after 2 digits)
  const handleCardExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 3) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setCardExpiry(value);
  };

  // Format CVV (max 3 digits)
  const handleCardCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    setCardCvv(value);
  };

  const handlePay = () => {
    if (selectedSlots.length === 0) return;
    
    if (paymentMethod === 'card') {
      setShowCardForm(true);
    } else {
      // Wallet payment
      setIsProcessing(true);
      setTimeout(() => {
        const slotsData = selectedSlots.map(id => slots.find(s => s.id === id));
        onBook(totalRateMinor, slotsData, paymentMethod, { 
          subject: selectedSubject, 
          curriculum: selectedCurriculum,
          isSiblingBundle
        });
        setIsProcessing(false);
        setConfirmedBooking({
          slotsData,
          subject: selectedSubject,
          curriculum: selectedCurriculum,
          rateMinor: totalRateMinor
        });
        resetStates();
      }, 1200);
    }
  };

  // Simulated Card Payment Gateway Checkout Submit
  const handleCardPaymentSubmit = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentStatusText("Contacting Paystack checkout server...");
    
    setTimeout(() => {
      setPaymentStatusText("Authorizing transaction with the bank...");
      setTimeout(() => {
        setPaymentStatusText("Verifying 3D Secure verification protocol...");
        setShowOtpForm(true);
        setIsProcessing(false);
      }, 1200);
    }, 1200);
  };

  // OTP Verification Submit
  const handleOtpVerifySubmit = (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      alert("Please enter a valid verification code.");
      return;
    }

    setIsProcessing(true);
    setPaymentStatusText("Validating OTP code...");

    setTimeout(() => {
      setPaymentStatusText("Securing escrow booking deposit...");
      setTimeout(() => {
        const slotsData = selectedSlots.map(id => slots.find(s => s.id === id));
        onBook(totalRateMinor, slotsData, 'card', { 
          subject: selectedSubject, 
          curriculum: selectedCurriculum,
          isSiblingBundle 
        });
        setIsProcessing(false);
        setConfirmedBooking({
          slotsData,
          subject: selectedSubject,
          curriculum: selectedCurriculum,
          rateMinor: totalRateMinor
        });
        resetStates();
      }, 1000);
    }, 1200);
  };

  const resetStates = () => {
    setShowCardForm(false);
    setShowOtpForm(false);
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
    setOtpCode('');
    setPaymentStatusText('');
  };

  const isWalletInsufficient = paymentMethod === 'wallet' && walletBalance < totalRateMinor;

  if (!isOpen || !teacher) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-brand-cream border border-brand-moss/10 rounded-[2.5rem] w-full max-w-lg p-6 sm:p-8 shadow-2xl z-10 overflow-hidden max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-brand-moss/10 text-brand-charcoal transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* SCREEN: Booking Confirmed & 2-Way Calendar Sync */}
        {confirmedBooking ? (
          <div className="space-y-6 text-center animate-fade-up py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">
                ESCROW SECURED & CONFIRMED
              </span>
              <h3 className="font-heading font-bold text-2xl text-brand-moss">Lesson Successfully Booked!</h3>
              <p className="font-sans text-xs text-brand-charcoal/70 mt-1 max-w-sm mx-auto">
                Your lesson with <b className="text-brand-moss">{teacher.name}</b> has been booked and funds locked in escrow protection.
              </p>
            </div>

            {/* Session Summary Card */}
            <div className="bg-white border border-brand-moss/10 rounded-2xl p-5 text-left space-y-3 shadow-sm font-sans text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-brand-moss/5">
                <img
                  src={getTeacherAvatar(teacher.avatar, teacher.name)}
                  alt={teacher.name}
                  className="w-11 h-11 rounded-full object-cover border border-brand-moss/10"
                  onError={handleAvatarError(teacher.name)}
                />
                <div>
                  <h4 className="font-heading font-bold text-sm text-brand-moss">{teacher.name}</h4>
                  <span className="text-[11px] text-brand-charcoal/60 block">
                    {confirmedBooking.subject} · {confirmedBooking.curriculum}
                  </span>
                </div>
              </div>

              {/* Booked Slots Details */}
              <div className="space-y-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 block font-bold">
                  Scheduled Time Slots (Automatically Converted to {timezoneAbbr})
                </span>
                {confirmedBooking.slotsData.map((slot, idx) => {
                  const timeInfo = convertWatTimeToLocal(slot.time, slot.dateString, userTimezone);
                  return (
                    <div key={idx} className="bg-brand-cream/30 border border-brand-moss/10 rounded-xl p-3 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-brand-moss block">{slot.day}</span>
                        <span className="font-mono text-[10px] text-brand-clay">
                          {timeInfo.localTime} ({timezoneAbbr})
                        </span>
                      </div>
                      {!timeInfo.isWat && (
                        <span className="font-mono text-[9px] text-brand-charcoal/50 bg-white px-2 py-1 rounded">
                          Tutor: {timeInfo.watTime} WAT
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2-WAY CALENDAR SYNC ACTIONS */}
            <div className="space-y-3 pt-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-brand-charcoal/60 block font-bold">
                1-CLICK CALENDAR SYNCHRONIZATION
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Google Calendar Direct Add */}
                <a
                  href={generateGoogleCalendarUrl({
                    tutorName: teacher.name,
                    subject: confirmedBooking.subject,
                    dateString: confirmedBooking.slotsData[0]?.dateString,
                    timeWatString: confirmedBooking.slotsData[0]?.time
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-xl bg-white hover:bg-brand-moss/5 border border-brand-moss/20 text-brand-moss font-sans font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Google Calendar</span>
                </a>

                {/* Download .ics for Apple iCal & Outlook */}
                <button
                  type="button"
                  onClick={() => downloadIcsCalendarInvite({
                    tutorName: teacher.name,
                    subject: confirmedBooking.subject,
                    dateString: confirmedBooking.slotsData[0]?.dateString,
                    timeWatString: confirmedBooking.slotsData[0]?.time
                  })}
                  className="py-3 px-4 rounded-xl bg-white hover:bg-brand-moss/5 border border-brand-moss/20 text-brand-moss font-sans font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4 text-brand-clay" />
                  <span>Apple / Outlook (.ics)</span>
                </button>
              </div>
            </div>

            {/* Done button */}
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-brand-moss hover:bg-brand-moss/90 text-white rounded-full font-sans font-bold text-xs uppercase tracking-wider shadow-md transition-all mt-4"
            >
              Done & Return to Dashboard
            </button>
          </div>
        ) : showOtpForm ? (
          /* SCREEN: 3D Secure OTP Form Screen */
          <div className="space-y-6 animate-fade-up">
            <div className="text-center">
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">
                Verified by 3DS Core
              </span>
              <h3 className="font-heading font-bold text-2xl text-brand-moss">Bank OTP Verification</h3>
              <p className="font-sans text-xs text-brand-charcoal/70 mt-1 max-w-xs mx-auto">
                Enter the One-Time Password sent to your registered mobile phone or authenticator app.
              </p>
            </div>

            {paymentStatusText && (
              <div className="bg-brand-moss/5 border border-brand-moss/10 rounded-xl p-3 text-center text-xs font-mono text-brand-moss animate-pulse">
                {paymentStatusText}
              </div>
            )}

            <form onSubmit={handleOtpVerifySubmit} className="space-y-4 font-sans text-xs">
              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2 text-center">
                  One-Time Password (OTP)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full bg-white border border-brand-moss/20 rounded-xl px-4 py-3 font-mono text-brand-charcoal text-center text-lg tracking-widest focus:outline-none focus:border-brand-clay"
                  disabled={isProcessing}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing || !otpCode}
                  className="btn-magnetic w-full py-4 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                >
                  {isProcessing ? 'Verifying...' : 'Submit Verification Code'}
                </button>
              </div>
            </form>
          </div>
        ) : showCardForm ? (
          /* SCREEN: Card Credentials Form Screen */
          <div className="space-y-6">
            <div className="mb-4">
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">Paystack Integration</span>
              <h3 className="font-heading font-bold text-2xl text-brand-moss">Credit / Debit Card Checkout</h3>
              <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                Enter your card credentials below. Payments are held in a secure local timed escrow.
              </p>
            </div>

            {/* Virtual Card Preview */}
            <div className="bg-brand-moss text-brand-cream p-6 rounded-2xl shadow-md space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-clay/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex justify-between items-center">
                <span className="font-heading font-bold text-xs uppercase tracking-widest opacity-60">EduVista Secure Card</span>
                <Lock className="w-4 h-4 text-brand-clay" />
              </div>
              <div className="space-y-1">
                <span className="font-mono text-base tracking-widest block min-h-[24px]">
                  {cardNumber || '•••• •••• •••• ••••'}
                </span>
                <div className="flex justify-between text-2xs uppercase tracking-wider opacity-60">
                  <span>Cardholder Name</span>
                  <span>Expires</span>
                </div>
                <div className="flex justify-between font-sans font-bold text-xs">
                  <span className="truncate max-w-[70%]">{cardName || 'YOUR FULL NAME'}</span>
                  <span>{cardExpiry || 'MM/YY'}</span>
                </div>
              </div>
            </div>

            {paymentStatusText && (
              <div className="bg-brand-moss/5 border border-brand-moss/10 rounded-xl p-3.5 text-center text-xs font-mono text-brand-moss animate-pulse">
                {paymentStatusText}
              </div>
            )}

            <form onSubmit={handleCardPaymentSubmit} className="space-y-4 font-sans text-xs">
              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Cardholder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ngozi Adeleke"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Card Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4000 1234 5678 9010"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 font-mono text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                  disabled={isProcessing}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Expiration Date</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={handleCardExpiryChange}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 font-mono text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm text-center"
                    disabled={isProcessing}
                  />
                </div>
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">CVV / Security Code</label>
                  <input
                    type="password"
                    required
                    placeholder="e.g. 123"
                    value={cardCvv}
                    onChange={handleCardCvvChange}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 font-mono text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm text-center"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCardForm(false)}
                  className="w-1/3 py-4 rounded-full border border-brand-moss/20 hover:bg-brand-moss/5 text-brand-moss font-bold text-xs uppercase tracking-wider transition-colors"
                  disabled={isProcessing}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-2/3 py-4 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                >
                  {isProcessing ? 'Authorizing...' : `Pay ${formattedRate}`}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* SCREEN: Standard Lesson Booking & Method Selection Screen */
          <>
            {/* Header */}
            <div className="mb-6">
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">Secure Check-out</span>
              <h3 className="font-heading font-bold text-2xl text-brand-moss">Book a Trial Class</h3>
              <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                with <span className="font-semibold">{teacher.name}</span>
              </p>
            </div>

            {/* Lesson Info */}
            <div className="bg-brand-moss/5 border border-brand-moss/10 rounded-2xl p-4 mb-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-brand-moss/10">
                  <img 
                    src={getTeacherAvatar(teacher.avatar, teacher.name)} 
                    alt={teacher.name || 'Verified Tutor'} 
                    className="w-full h-full object-cover" 
                    onError={handleAvatarError(teacher.name)}
                  />
                </div>
                <div>
                  <span className="font-heading font-bold text-sm text-brand-moss">{selectedSubject || '1-on-1'} Trial Class</span>
                  <span className="font-sans text-xs text-brand-charcoal/60 block">60 minutes · {selectedCurriculum || 'WAEC/Cambridge'}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-heading font-bold text-base text-brand-moss block">{formattedRate}</span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-brand-clay block font-bold">100% Refundable</span>
              </div>
            </div>

            {/* Sibling Bundle Discount Toggle */}
            <div className="mb-5 bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer select-none">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSiblingBundle}
                  onChange={(e) => setIsSiblingBundle(e.target.checked)}
                  className="rounded text-brand-clay focus:ring-brand-clay w-4 h-4 border-amber-300"
                />
                <div>
                  <span className="font-heading font-bold text-xs text-amber-900 block flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Family Sibling Package (10% Discount)
                  </span>
                  <span className="font-sans text-[10px] text-amber-800/80 block">
                    Booking concurrent classes for 2 or more siblings? Apply 10% bundle savings.
                  </span>
                </div>
              </label>
              {isSiblingBundle && (
                <span className="font-mono text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                  10% OFF
                </span>
              )}
            </div>

            {/* Custom Lesson & Class Type selectors */}
            <div className="mb-5 bg-white border border-brand-moss/10 rounded-2xl p-4 space-y-3 shadow-sm">
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block">
                🏷️ Select Lesson & Class Type
              </span>
              <div className="grid grid-cols-2 gap-4 font-sans">
                <div>
                  <label className="font-sans font-bold text-[9px] uppercase tracking-wider text-brand-charcoal/60 block mb-1">Subject / Lesson</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-3 py-2 text-xs font-sans text-brand-charcoal focus:outline-none focus:border-brand-clay"
                  >
                    {teacher.subjects && teacher.subjects.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                    {(!teacher.subjects || teacher.subjects.length === 0) && (
                      <option value="General">General</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="font-sans font-bold text-[9px] uppercase tracking-wider text-brand-charcoal/60 block mb-1">Class Type / Curriculum</label>
                  <select
                    value={selectedCurriculum}
                    onChange={(e) => setSelectedCurriculum(e.target.value)}
                    className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl px-3 py-2 text-xs font-sans text-brand-charcoal focus:outline-none focus:border-brand-clay"
                  >
                    {teacher.curricula && teacher.curricula.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                    {(!teacher.curricula || teacher.curricula.length === 0) && (
                      <option value="Standard">Standard</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Select Slots with Automatic Timezone Localization */}
            <div className="mb-6">
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-brand-clay" /> 1. Select Availability Slot</span>
                <span className="font-mono text-[9px] bg-brand-moss/10 px-2 py-0.5 rounded-full text-brand-moss font-bold">
                  🌍 {timezoneAbbr}
                </span>
              </span>

              {/* Timezone conversion info ribbon */}
              <div className="bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-3 py-1.5 mb-2.5 flex items-center justify-between text-[10px] font-mono text-brand-charcoal/70">
                <span>Your Time: <b>{userTimezone} ({timezoneAbbr})</b></span>
                <span className="text-brand-charcoal/50 text-[9px]">Tutor WAT (Lagos UTC+1)</span>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {slots.map(slot => {
                  const isSelected = selectedSlots.includes(slot.id);
                  const booked = isSlotBooked(slot);
                  const timeInfo = convertWatTimeToLocal(slot.time, slot.dateString, userTimezone);

                  return (
                    <button
                      key={slot.id}
                      disabled={booked}
                      onClick={() => {
                        setSelectedSlots(prev => 
                          prev.includes(slot.id) 
                            ? prev.filter(id => id !== slot.id) 
                            : [...prev, slot.id]
                        );
                      }}
                      className={`py-3 px-3.5 rounded-xl border text-left font-sans transition-all duration-300 ${
                        booked
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                          : isSelected
                            ? 'border-brand-clay bg-brand-clay/5 text-brand-charcoal ring-2 ring-brand-clay/30'
                            : 'border-brand-moss/10 bg-white hover:border-brand-moss/40 text-brand-charcoal/80'
                      }`}
                    >
                      <span className="text-xs font-bold block flex justify-between items-center font-heading">
                        <span className="truncate">{slot.day}</span>
                        {booked && <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono uppercase font-bold shrink-0">Booked</span>}
                      </span>
                      
                      {/* Local Time + Tutor WAT Time */}
                      <span className="text-[10px] text-brand-charcoal/80 mt-1 block flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-brand-clay shrink-0" />
                        <b className="text-brand-moss">{timeInfo.localTime}</b>
                        {!timeInfo.isWat && (
                          <span className="text-brand-charcoal/50 text-[8px]">({timeInfo.watTime} WAT)</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Processor */}
            <div className="mb-6">
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-3 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-brand-clay" /> 2. Choose Payment Method
              </span>
              <div className="space-y-2">
                {/* Wallet Payment Option */}
                <button
                  onClick={() => setPaymentMethod('wallet')}
                  className={`w-full py-3 px-4 rounded-xl border text-left font-sans transition-all duration-300 flex items-center justify-between ${
                    paymentMethod === 'wallet'
                      ? 'border-brand-moss bg-brand-moss/5 ring-1 ring-brand-moss'
                      : 'border-brand-moss/10 bg-white hover:border-brand-moss/30'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block text-brand-charcoal">EduVista Balance Wallet</span>
                    <span className="text-[10px] text-brand-charcoal/60 mt-0.5 block">
                      Available: {formatCurrency(convertMinor(walletBalance, selectedCurrency), selectedCurrency)}
                    </span>
                  </div>
                  {isWalletInsufficient && (
                    <span className="font-mono text-[9px] uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-bold">
                      Low Balance
                    </span>
                  )}
                </button>
                {isWalletInsufficient && (
                  <div className="text-[11px] text-red-600 mt-1.5 px-3 py-2 font-sans flex justify-between items-center bg-rose-50/50 border border-rose-100 rounded-xl">
                    <span>Insufficient funds in balance wallet.</span>
                    <a
                      href="/#topup"
                      onClick={(e) => {
                        e.preventDefault();
                        onClose();
                        window.history.pushState(null, '', '/#topup');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-brand-clay hover:underline cursor-pointer"
                    >
                      Top Up Wallet →
                    </a>
                  </div>
                )}

                {/* Credit Card Option (Paystack simulation) */}
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full py-3 px-4 rounded-xl border text-left font-sans transition-all duration-300 flex items-center justify-between ${
                    paymentMethod === 'card'
                      ? 'border-brand-moss bg-brand-moss/5 ring-1 ring-brand-moss'
                      : 'border-brand-moss/10 bg-white hover:border-brand-moss/30'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block text-brand-charcoal">
                      Credit / Debit Card (Paystack & Stripe)
                    </span>
                    <span className="text-[10px] text-brand-charcoal/60 mt-0.5 block">
                      Local Nigerian & International Cards, Apple Pay, Mobile Money
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer actions */}
            <div className="space-y-3">
              <button
                onClick={handlePay}
                disabled={selectedSlots.length === 0 || isWalletInsufficient || isProcessing}
                className={`btn-magnetic w-full py-3.5 rounded-full font-sans font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all ${
                  selectedSlots.length === 0 || isWalletInsufficient 
                    ? 'bg-brand-moss/40 cursor-not-allowed shadow-none'
                    : 'bg-brand-clay hover:bg-brand-clay/90 shadow-brand-clay/20'
                }`}
              >
                {isProcessing 
                  ? "Securing Escrow..." 
                  : selectedSlots.length > 0
                    ? paymentMethod === 'card' 
                      ? "Enter Card Details" 
                      : `Pay ${formattedTotalRate} & Lock Escrow`
                    : "Select at least one slot"
                }
              </button>
              
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-brand-charcoal/50">
                <Shield className="w-3.5 h-3.5 text-brand-moss/40" />
                <span>Escrow lock: funds released automatically post-lesson validation.</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
