import React from 'react';
import { X, FileText, CheckCircle, Scale, AlertTriangle } from 'lucide-react';

export default function TutorAgreementModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="relative bg-brand-cream border border-brand-moss/20 rounded-[2.5rem] w-full max-w-2xl p-8 md:p-10 shadow-2xl z-10 max-h-[85vh] overflow-y-auto font-sans text-brand-charcoal leading-relaxed scrollbar-thin scrollbar-thumb-brand-moss/20 animate-fade-in">
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-brand-moss/60 hover:text-brand-moss transition-colors rounded-full p-1 bg-brand-moss/5 hover:bg-brand-moss/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6 border-b border-brand-moss/10 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-moss text-brand-cream flex items-center justify-center">
            <Scale className="w-6 h-6 text-brand-clay" />
          </div>
          <div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-brand-clay font-bold block mb-1">Legal & Compliance</span>
            <h2 className="font-heading font-bold text-2xl text-brand-moss">Tutor Independent Contractor Agreement</h2>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs text-brand-charcoal/85 pr-2">
          <p className="italic text-brand-charcoal/70">
            Please read this document carefully before submitting your application to the EduVista Africa platform. By submitting your application, you agree to comply with all terms set forth by **Zeerocodes Automation Limited**.
          </p>

          {/* Section 1 */}
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-sm text-brand-moss uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-brand-clay shrink-0" />
              1. Platform Commission & Fees
            </h3>
            <p>
              EduVista Africa charges a standard service commission fee for facilitating classroom matchmaking, escrow transactions, and support infrastructure:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 font-bold text-brand-moss">
              <li>A commission fee of **15% (fifteen percent)** will be automatically deducted from your raw hourly teaching earnings for every completed session.</li>
              <li>Payouts will be credited to your teacher wallet in minor units (kobo/cents) immediately upon confirmation of the completed class by the parent or the automated classroom verification system.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-sm text-brand-moss uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-brand-clay shrink-0" />
              2. Class Attendance & Missed Session Penalties
            </h3>
            <p>
              Educator consistency is critical to student success. To prevent instructional disruptions, the following policies apply to scheduled sessions:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Cancellation Notice:</strong> Tutors must provide at least <strong>24 hours</strong> advance notice via the platform dashboard to cancel or reschedule a confirmed session.</li>
              <li><strong>Late Attendance:</strong> Arriving more than 15 minutes late without prior communication will be logged as a missed class.</li>
              <li><strong>Missed Session Penalty:</strong> If you miss a scheduled class without giving 24-hour advance notice, a penalty fee of <strong>₦5,000 (or currency equivalent)</strong> will be debited from your teacher wallet balance.</li>
              <li><strong>Account Suspension:</strong> Two (2) or more missed classes within a 30-day window without verifiable medical or emergency documentation will result in temporary account suspension or permanent termination from the platform.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-sm text-brand-moss uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-clay shrink-0" />
              3. Classroom Recording & Media Consent
            </h3>
            <p>
              For security, pedagogical quality, and dispute resolution:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Tutors consent to the recording of classroom audio and video feeds when initiated by the parent or student.</li>
              <li>All classroom recording files are stored under secure encryption for a maximum of 30 days and are accessible only to the parent, the tutor, and administrators for review.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-sm text-brand-moss uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-brand-clay shrink-0" />
              4. Platform Integrity & Non-Circumvention
            </h3>
            <p>
              Tutors must conduct all educational bookings and transactional communications exclusively through the EduVista Africa portal:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 font-semibold text-red-700">
              <li>You agree not to solicit parents, exchange personal phone numbers, emails, or bank coordinates to process lessons off-platform (circumvention).</li>
              <li>Any detected attempt to bypass the platform escrow system will result in immediate termination of your platform contract and forfeiture of all accumulated funds in your educator wallet.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-brand-moss/10 pt-6 flex justify-between items-center text-[10px] text-brand-charcoal/50">
          <span>Zeerocodes Automation Limited © 2026</span>
          <button 
            onClick={onClose} 
            className="bg-brand-moss text-white font-heading font-bold uppercase tracking-wider px-6 py-2.5 rounded-full hover:bg-brand-clay transition-colors hover:scale-103 duration-300"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}
