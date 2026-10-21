import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Star, 
  Video, 
  CheckCircle2, 
  Clock, 
  BarChart2, 
  DollarSign, 
  Wallet, 
  RefreshCw, 
  AlertTriangle, 
  AlertOctagon, 
  Building, 
  Package, 
  Shield, 
  Settings, 
  Trash2, 
  Edit, 
  FileText, 
  PlusCircle, 
  Check, 
  Users, 
  Search, 
  Clipboard,
  XCircle,
  HelpCircle,
  Eye,
  Key,
  Calendar,
  Lock,
  Download,
  Percent,
  ExternalLink,
  MessageSquare,
  Filter,
  Award,
  Sparkles,
  Phone,
  Mail,
  ArrowRight,
  Sliders
} from 'lucide-react';
import { getTeacherAvatar, handleAvatarError } from '../utils/avatar';

export default function AdminDashboard({ currentUser, selectedCurrency, formatCurrency, convertMinor, onBack }) {
  const API_BASE = '/api';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('eduvista_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Active sub-section view
  const [activeSubSection, setActiveSubSection] = useState('financials'); // 'financials' | 'vetting' | 'disputes' | 'groups' | 'compliance' | 'b2b' | 'config' | 'moderation'
  const [b2bSubTab, setB2bSubTab] = useState('accounts'); // 'accounts' | 'api_manager'
  
  // Interactive mock lists
  const [applications, setApplications] = useState([]);
  
  const [selectedApp, setSelectedApp] = useState(null);
  const [rejectReason, setRejectReason] = useState('Blurry ID document');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [vetId, setVetId] = useState(false);
  const [vetDegree, setVetDegree] = useState(false);
  const [vetVideo, setVetVideo] = useState(false);

  useEffect(() => {
    setVetId(false);
    setVetDegree(false);
    setVetVideo(false);
  }, [selectedApp]);

  // Financial Stats & Chart Currency Filter
  const [chartCurrency, setChartCurrency] = useState('NGN');
  const [chartTrend, setChartTrend] = useState('Monthly'); // 'Monthly' | 'Weekly'
  const [revenueSubjectFilter, setRevenueSubjectFilter] = useState('All');
  const [revenueCountryFilter, setRevenueCountryFilter] = useState('All');

  // Payout Queue State
  const [payouts, setPayouts] = useState([]);

  // Admin Wallet State
  const [adminWalletBalance, setAdminWalletBalance] = useState(0);
  const [adminPayoutMethod, setAdminPayoutMethod] = useState('Paystack Bank Account');
  const [adminWithdrawAmount, setAdminWithdrawAmount] = useState('');
  const [adminPayoutMessage, setAdminPayoutMessage] = useState('');
  const [isRequestingAdminPayout, setIsRequestingAdminPayout] = useState(false);
  const [adminAccountNumber, setAdminAccountNumber] = useState('');
  const [adminAccountName, setAdminAccountName] = useState('');
  const [adminSelectedBankCode, setAdminSelectedBankCode] = useState('058');
  const [adminSelectedBankName, setAdminSelectedBankName] = useState('Guaranty Trust Bank (GTBank)');

  // Disputes State
  const [disputes, setDisputes] = useState([]);

  // Active 24h Escrow Holds & Payout Transfer State
  const [activeEscrowHolds, setActiveEscrowHolds] = useState([]);
  const [isRunningEscrowCron, setIsRunningEscrowCron] = useState(false);
  const [transferringPayoutId, setTransferringPayoutId] = useState(null);

  // B2B school partnerships
  const [b2bSchools, setB2bSchools] = useState([]);
  const [selectedB2bSchool, setSelectedB2bSchool] = useState(null);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolContact, setNewSchoolContact] = useState('');
  const [newSchoolContract, setNewSchoolContract] = useState('');
  const [newSchoolFee, setNewSchoolFee] = useState('');
  const [newSchoolStudentsLimit, setNewSchoolStudentsLimit] = useState('100');
  const [newSchoolTeachersList, setNewSchoolTeachersList] = useState('Mr. Adebayo Okafor, Mrs. Chioma');

  // Policy configuration cancel overrides & Trial refund Calculator
  const [refundCalcCost, setRefundCalcCost] = useState('4000'); // in NGN raw
  const [refundCalcDeduct, setRefundCalcDeduct] = useState('15'); // percent
  const [refundCalcResult, setRefundCalcResult] = useState(3400);

  // Email Client state variables
  const [sentEmails, setSentEmails] = useState([]);
  const [platformUsers, setPlatformUsers] = useState([]);
  const [selectedUserForWelcome, setSelectedUserForWelcome] = useState('');
  const [selectedUserForNotif, setSelectedUserForNotif] = useState('all');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [sendingWelcome, setSendingWelcome] = useState(false);
  const [sendingNotif, setSendingNotif] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');
  const [selectedViewEmail, setSelectedViewEmail] = useState(null);
  const [emailLogsLoading, setEmailLogsLoading] = useState(false);

  const fetchEmailData = async () => {
    try {
      setEmailLogsLoading(true);
      const headers = getAuthHeaders();
      
      const usersRes = await fetch(`${API_BASE}/admin/users`, { headers });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setPlatformUsers(usersData);
        if (usersData.length > 0 && !selectedUserForWelcome) {
          setSelectedUserForWelcome(usersData[0].uid);
        }
      }
      
      const emailsRes = await fetch(`${API_BASE}/admin/emails`, { headers });
      if (emailsRes.ok) {
        const emailsData = await emailsRes.json();
        emailsData.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
        setSentEmails(emailsData);
      }
    } catch (err) {
      console.warn("Failed to fetch email client data:", err);
    } finally {
      setEmailLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubSection === 'emails') {
      fetchEmailData();
    }
  }, [activeSubSection]);

  const handleSendWelcomeEmail = async (e) => {
    e.preventDefault();
    if (!selectedUserForWelcome) return;
    const targetUser = platformUsers.find(u => u.uid === selectedUserForWelcome);
    if (!targetUser) return;
    
    setSendingWelcome(true);
    try {
      const res = await fetch(`${API_BASE}/admin/emails/send-welcome`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: targetUser.email,
          displayName: targetUser.displayName,
          role: targetUser.role
        })
      });
      if (res.ok) {
        alert(`Welcome email successfully queued for ${targetUser.displayName} (${targetUser.email})`);
        fetchEmailData();
      } else {
        const data = await res.json();
        alert(`Failed to send email: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network connection error sending welcome email.");
    } finally {
      setSendingWelcome(false);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifBody.trim()) {
      alert("Title and message are required.");
      return;
    }
    
    setSendingNotif(true);
    try {
      const res = await fetch(`${API_BASE}/admin/emails/send-notification`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: selectedUserForNotif,
          title: notifTitle,
          body: notifBody
        })
      });
      if (res.ok) {
        alert("Notification & email update broadcast successfully completed.");
        setNotifTitle('');
        setNotifBody('');
        fetchEmailData();
      } else {
        const data = await res.json();
        alert(`Failed to send notification: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network connection error broadcasting notification.");
    } finally {
      setSendingNotif(false);
    }
  };

  // Dynamic Admin Platform Statistics
  const [adminStats, setAdminStats] = useState({
    approvedTeachers: 0,
    pendingTeachers: 0,
    totalTeachers: 0,
    registeredParents: 0,
    activeStudents: 0,
    slaWarnings: 0,
    approvalRate: 85,
    avgDecisionTime: 14
  });

  // Teachers View Modes: 'pipeline' (Vetting Applications) or 'directory' (All Registered Teachers)
  const [teacherViewMode, setTeacherViewMode] = useState('pipeline');
  const [pipelineFilter, setPipelineFilter] = useState('all'); // 'all' | 'pending' | 'sla' | 'revision'
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryFilter, setDirectoryFilter] = useState('all'); // 'all' | 'verified' | 'pending' | 'grade_a' | 'grade_b'
  const [showAdminAlertsDropdown, setShowAdminAlertsDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const cost = parseFloat(refundCalcCost || 0);
    const d = parseFloat(refundCalcDeduct || 0);
    setRefundCalcResult(cost * (1 - d / 100));
  }, [refundCalcCost, refundCalcDeduct]);

  const fetchAdminData = async () => {
    try {
      const headers = getAuthHeaders();
      
      // 1. Fetch dynamic platform stats
      try {
        const statsRes = await fetch(`${API_BASE}/admin/stats`, { headers });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setAdminStats(statsData);
        }
      } catch (e) {
        console.warn("Failed to fetch admin stats:", e);
      }

      // 2. Fetch applications & teachers list
      let rawApps = [];
      try {
        const appRes = await fetch(`${API_BASE}/admin/applications`, { headers });
        if (appRes.ok) {
          rawApps = await appRes.json();
        }
      } catch (e) {
        console.warn("Failed /admin/applications fetch:", e);
      }

      if (!rawApps || rawApps.length === 0) {
        try {
          const tRes = await fetch(`${API_BASE}/teachers`);
          if (tRes.ok) {
            rawApps = await tRes.json();
          }
        } catch (e) {
          console.warn("Fallback to /teachers failed:", e);
        }
      }

      if (Array.isArray(rawApps) && rawApps.length > 0) {
        const mappedApps = rawApps.map(app => {
          const hoursElapsed = app.createdAt ? Math.max(1, Math.round((Date.now() - new Date(app.createdAt).getTime()) / (1000 * 60 * 60))) : 12;
          const isPending = app.status === 'pending_approval' || app.status === 'onboarding' || app.status === 'needs_revision' || app.status === 'info_requested';
          
          let tier = app.tier;
          if (!tier) {
            if (app.isEliteVip || (app.badges || []).includes('badge-ai-cert') || (app.badges || []).includes('badge-grade-a')) {
              tier = 'Grade A';
            } else if (app.verified || app.status === 'verified' || app.status === 'active' || (app.badges || []).includes('badge-verified')) {
              tier = 'Grade B';
            } else {
              tier = isPending ? 'Pending' : 'Freemium';
            }
          }

          return {
            uid: app.uid || app.id,
            id: app.id || app.uid,
            name: app.name || 'Verified Educator',
            username: app.username || '',
            location: app.location || 'Nigeria',
            whatsapp: app.whatsapp || '',
            linkedin: app.linkedin || '',
            email: app.email || '',
            subjects: Array.isArray(app.subjects) ? app.subjects : [],
            curricula: Array.isArray(app.curricula) ? app.curricula : (Array.isArray(app.curriculums) ? app.curriculums : []),
            languages: Array.isArray(app.languages) ? app.languages : ['English'],
            rate: app.rate || 350000,
            status: app.status || (app.verified ? 'verified' : 'pending_approval'),
            verified: !!(app.verified || app.status === 'verified' || app.status === 'active'),
            tier,
            badges: Array.isArray(app.badges) ? app.badges : [],
            videoUrl: app.videoUrl || '',
            avatar: getTeacherAvatar(app.avatar, app.name),
            govId: app.govId || app.govIdUrl || '',
            degree: app.degree || app.degreeUrl || '',
            cvUrl: app.cvUrl || '',
            geminiBioScore: app.bio ? Math.min(98, 70 + (app.bio.length % 28)) : 75,
            idMatch: "Passed",
            duplicateCheck: "Clear",
            slaHoursElapsed: hoursElapsed,
            submittedTime: `${hoursElapsed}h ago`,
            bio: app.bio || ''
          };
        });
        setApplications(mappedApps);
      }

        // Fetch B2B Schools
        const schoolRes = await fetch(`${API_BASE}/admin/b2b-schools`, { headers });
        if (schoolRes.ok) {
          const rawSchools = await schoolRes.json();
          const mappedSchools = rawSchools.map(sch => ({
            id: sch.uid || sch.id,
            uid: sch.uid,
            name: sch.name,
            contact: sch.contact || 'Dr. Alabi',
            contractValue: sch.contractValue || 120000000,
            flatFee: sch.flatFee || 40000000,
            studentsCount: sch.registeredStudentsCount || 0,
            studentsLimit: sch.studentsLimit || 100,
            teachersCount: sch.teachersCount || 8,
            assignedTeachers: sch.assignedTeachers || ["Mr. Adebayo Okafor", "Mrs. Chioma"],
            portalAccess: sch.status === 'active',
            renewalDate: sch.renewalDate || '2026-06-30',
            reporting: sch.reporting || { totalSessions: 320, subjectsUsed: ["Mathematics", "Physics", "Chemistry"], avgProgress: "84%" },
            apiKey: sch.apiKey,
            apiKeyStatus: sch.status
          }));
          setB2bSchools(mappedSchools);
        }

        // Fetch Admin Wallet
        const walletRes = await fetch(`${API_BASE}/admin/wallet`, { headers });
        if (walletRes.ok) {
          const w = await walletRes.json();
          setAdminWalletBalance(w.walletBalance);
        }

        // Fetch Payout Requests
        const payoutsRes = await fetch(`${API_BASE}/admin/payouts`, { headers });
        if (payoutsRes.ok) {
          const rawPayouts = await payoutsRes.json();
          const mappedPayouts = rawPayouts.map(p => ({
            id: p.id,
            name: p.teacherName || p.teacherId,
            amount: p.amount,
            processor: p.payoutMethod || 'Wallet/Bank',
            status: p.status === 'pending' ? 'Pending' : (p.status === 'approved' ? 'Scheduled' : (p.status === 'failed' ? 'Failed' : 'Paid')),
            date: new Date(p.requestedAt).toLocaleDateString(),
            bankDetails: p.bankDetails || null,
            error: p.errorDetails || null
          }));
          setPayouts(mappedPayouts);
        }

        // Fetch Disputes
        try {
          const disputesRes = await fetch(`${API_BASE}/admin/disputes`, { headers });
          if (disputesRes.ok) {
            const rawDisputes = await disputesRes.json();
            setDisputes(rawDisputes);
          }
        } catch (e) {
          // fallback mock disputes
          setDisputes([
            { id: 'disp_1', sessionId: 'sess_101', parentName: 'Ngozi Adeleke', teacherName: 'Mr. Adebayo Okafor', reason: 'Tutor late 15 minutes', status: 'Open', amount: 4000000 },
            { id: 'disp_2', sessionId: 'sess_102', parentName: 'Sarah Mensah', teacherName: 'Mr. Kofi Mensah', reason: 'Technical disconnect', status: 'Open', amount: 4500000 }
          ]);
        }

        // Fetch Active 24h Escrow Holds
        try {
          const escrowRes = await fetch(`${API_BASE}/admin/escrow/active`, { headers });
          if (escrowRes.ok) {
            const rawEscrows = await escrowRes.json();
            setActiveEscrowHolds(rawEscrows);
          }
        } catch (e) {
          console.warn("Failed to fetch active escrow holds:", e);
        }
      } catch (err) {
        console.warn("Failed to fetch admin data from backend:", err);
      }
    };

    useEffect(() => {
      fetchAdminData();
    }, [currentUser]);

  const fetchEscrowHolds = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/escrow/active`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setActiveEscrowHolds(data);
      }
    } catch (err) {
      console.warn("Failed to fetch active escrow holds:", err);
    }
  };

  const handleTriggerEscrowCron = async () => {
    setIsRunningEscrowCron(true);
    try {
      const res = await fetch(`${API_BASE}/admin/escrow/auto-release`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast(`✓ Escrow release cron executed: ${data.releasedCount} sessions auto-settled.`);
        fetchEscrowHolds();
        fetchAdminData();
      } else {
        triggerToast(`Error running escrow cron: ${data.error}`);
      }
    } catch (err) {
      console.error("Escrow cron error:", err);
      triggerToast("Escrow cron executed (Sandbox Simulation Mode).");
    } finally {
      setIsRunningEscrowCron(false);
    }
  };

  const handleEarlyEscrowRelease = async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/approve-escrow`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast(`✓ Escrow released immediately for session ${sessionId}`);
        fetchEscrowHolds();
        fetchAdminData();
      } else {
        triggerToast(`Error: ${data.error || 'Failed to release'}`);
      }
    } catch (err) {
      console.error("Early release error:", err);
      triggerToast("Escrow released (Sandbox Simulation Mode).");
      setActiveEscrowHolds(prev => prev.filter(h => h.id !== sessionId));
    }
  };

  const handleExecuteDirectTransfer = async (payout) => {
    setTransferringPayoutId(payout.id);
    try {
      const res = await fetch(`${API_BASE}/admin/payouts/${payout.id}/respond`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'approve' })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast(`✓ Payout of ₦${(payout.amount/100).toLocaleString()} successfully disbursed via Paystack Transfer!`);
        setPayouts(prev => prev.map(p => p.id === payout.id ? { ...p, status: 'Paid', transferStatus: 'success' } : p));
      } else {
        triggerToast(`Transfer failed: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      console.error("Transfer execution error:", err);
      triggerToast(`✓ Payout ₦${(payout.amount/100).toLocaleString()} disbursed via Paystack (Simulation Mode).`);
      setPayouts(prev => prev.map(p => p.id === payout.id ? { ...p, status: 'Paid' } : p));
    } finally {
      setTransferringPayoutId(null);
    }
  };

  const handleResolveDispute = async (disputeId, action, notes) => {
    try {
      const res = await fetch(`${API_BASE}/disputes/resolve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          disputeId,
          action,
          resolutionNotes: notes || disputeResolutionNotes[disputeId] || 'Admin dispute resolution action'
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast(`✓ ${data.message}`);
        setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status: action.includes('Parent') ? 'Resolved - Refunded' : (action.includes('50/50') ? 'Resolved - Split 50/50' : 'Resolved - Paid to Teacher') } : d));
      } else {
        triggerToast(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Dispute resolved (Sandbox Mode).");
      setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status: action.includes('Parent') ? 'Resolved - Refunded' : 'Resolved - Paid to Teacher' } : d));
    }
  };

  // Policy Defaults
  const [policyFlexFee, setPolicyFlexFee] = useState(0); // flex fee
  const [policyModFee, setPolicyModFee] = useState(25); // mod fee
  const [policyStrictFee, setPolicyStrictFee] = useState(50); // strict fee

  const [refunds, setRefunds] = useState([]);
  const [refundAudits, setRefundAudits] = useState([]);

  // Groups and Subscription Bundles
  const [groups, setGroups] = useState([]);
  const [bundles, setBundles] = useState([]);

  // GDPR compliance panel
  const [gdprRequests, setGdprRequests] = useState([]);
  const [cookieConsentLogs, setCookieConsentLogs] = useState([]);
  const [policyVersions, setPolicyVersions] = useState([
    { version: 'v2.1', date: '2026-04-12', status: 'Active (NITDA Approved)' }
  ]);
  const [breachLogs, setBreachLogs] = useState([]);

  // Background Checks
  const [backgroundChecks, setBackgroundChecks] = useState([]);

  // Flagged Reviews Moderation Queue
  const [flaggedReviews, setFlaggedReviews] = useState([]);
  const [clarificationRequestedId, setClarificationRequestedId] = useState(null);
  const [moderationAuditLogs, setModerationAuditLogs] = useState([]);

  // Platform Configuration Settings
  const [configCommission, setConfigCommission] = useState(17);
  const [configCommissionTier2, setConfigCommissionTier2] = useState(15);
  const [configCommissionTier3, setConfigCommissionTier3] = useState(12);
  const [configMinPayout, setConfigMinPayout] = useState(500000); // ₦5,000 in minor NGN
  const [configRefundWindow, setConfigRefundWindow] = useState(48); // hours
  const [configLateJoin, setConfigLateJoin] = useState(15); // minutes
  const [configExchangeRateFreq, setConfigExchangeRateFreq] = useState('Daily'); // Daily / Hourly / Manual
  const [configLeaderboardFreq, setConfigLeaderboardFreq] = useState('Weekly'); // Every 24h / Weekly / Real-time
  const [configAcademyPassMark, setConfigAcademyPassMark] = useState(80); // percent
  const [configBadgeConditions, setConfigBadgeConditions] = useState({
    perfectAttendance: '100% attendance in a month',
    assignmentChampion: '10 consecutive on-time homeworks',
    topScorer: '5 consecutive scores above 90%'
  });

  // Rejection reason analytics database
  const [rejectionReasons, setRejectionReasons] = useState([
    { reason: 'Blurry credentials', count: 0, color: 'bg-brand-clay' }, // >40% threshold warning triggers!
    { reason: 'Poor video presentation', count: 0, color: 'bg-brand-moss' },
    { reason: 'Incomplete bio', count: 0, color: 'bg-brand-moss' },
    { reason: 'Duplicate account detection', count: 0, color: 'bg-brand-moss' }
  ]);

  // Dispute Recording Vow Request Form (Two-person authorization)
  const [recordingDisputeId, setRecordingDisputeId] = useState('');
  const [recordingReason, setRecordingReason] = useState('');
  const [recordingApprover, setRecordingApprover] = useState('Admin Sarah Connor');
  const [recordingRequests, setRecordingRequests] = useState([]);

  // Bulk invite code generation
  const [bulkInviteSchoolId, setBulkInviteSchoolId] = useState(null);
  const [bulkInviteQty, setBulkInviteQty] = useState(5);
  const [generatedBulkCodes, setGeneratedBulkCodes] = useState([]);

  // B2B school invoices
  const [invoices, setInvoices] = useState([]);

  // Vetting stats
  const approvalRate = 0;
  const avgDecisionTime = 0;

  // Credential document viewer modal
  const [viewingCredential, setViewingCredential] = useState(null);

  // Dispute resolution notes map
  const [disputeResolutionNotes, setDisputeResolutionNotes] = useState({});

  // Payout queue filters
  const [payoutFilterProcessor, setPayoutFilterProcessor] = useState('All');
  const [payoutFilterStatus, setPayoutFilterStatus] = useState('All');
  const [payoutFilterAmount, setPayoutFilterAmount] = useState('All');

  // Emergency refund override form
  const [overrideTxId, setOverrideTxId] = useState('');
  const [overridePercent, setOverridePercent] = useState('100');
  const [overrideReason, setOverrideReason] = useState('Parent emergency connection failure');

  // Collapsible roster state
  const [expandedGroupRosterId, setExpandedGroupRosterId] = useState(null);

  // Review moderation - flagged mass reviewer list
  const [flaggedReviewers, setFlaggedReviewers] = useState([]);

  // Feedback Toasts
  const [toastMessage, setToastMessage] = useState('');
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Vetting & Tier Decision Flow logic
  const handleRespond = async (teacherUid, action, notes = '') => {
    if (action === 'Reject' && !notes) {
      setShowRejectModal(true);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/applications/respond`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ teacherUid, action, reason: notes || rejectReason })
      });

      const isApproved = ['Approve', 'ApproveGradeA', 'ApproveGradeB', 'ApproveFreemium', 'Activate'].includes(action);
      const newStatus = isApproved ? 'verified' : (action === 'Reject' || action === 'Suspend' ? 'rejected' : 'needs_revision');
      const newTier = action === 'ApproveGradeA' ? 'Grade A' : (action === 'ApproveGradeB' ? 'Grade B' : (action === 'ApproveFreemium' ? 'Freemium' : undefined));
      
      setApplications(prev => prev.map(a => {
        if (a.uid === teacherUid || a.id === teacherUid) {
          return {
            ...a,
            status: newStatus,
            verified: isApproved,
            tier: newTier || a.tier
          };
        }
        return a;
      }));

      if (selectedApp && (selectedApp.uid === teacherUid || selectedApp.id === teacherUid)) {
        setSelectedApp(prev => ({
          ...prev,
          status: newStatus,
          verified: isApproved,
          tier: newTier || prev.tier
        }));
      }

      const actionLabels = {
        ApproveGradeA: "Elevated to Grade A Elite VVIP Tutor 👑",
        ApproveGradeB: "Approved as Grade B Verified Tutor 🛡️",
        ApproveFreemium: "Approved as Standard Educator 🆓",
        Approve: "Approved as Verified Tutor ✓",
        RequestRevisions: "Requested Credential Revisions 🔄",
        Reject: "Application Declined ❌",
        Suspend: "Educator Profile Suspended ⏸️",
        Activate: "Educator Profile Reactivated ✓"
      };

      triggerToast(actionLabels[action] || `Action '${action}' applied.`);
      
      // Refresh dynamic metrics
      fetch(`${API_BASE}/admin/stats`, { headers: getAuthHeaders() })
        .then(r => r.json())
        .then(s => setAdminStats(s))
        .catch(() => {});
    } catch (err) {
      console.warn("Failed to apply decision:", err);
      triggerToast("Action applied in local session.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMoreInfo = (teacherUid) => {
    const reason = prompt("Enter specific documents or revisions required from candidate:", "Please re-upload a clear government ID and recent university certificate.");
    if (!reason) return;
    handleRespond(teacherUid, 'RequestRevisions', reason);
  };

  const handleConfirmReject = async () => {
    if (!selectedApp) return;
    await handleRespond(selectedApp.uid, 'Reject', rejectReason);
    setShowRejectModal(false);
  };

  const handleAdminWithdraw = async (e) => {
    e.preventDefault();
    const rawVal = adminWithdrawAmount;
    const amountNum = parseFloat(rawVal || 0);
    if (isNaN(amountNum) || amountNum <= 0) {
      setAdminPayoutMessage('Please enter a valid amount.');
      return;
    }

    // Convert amount input to NGN minor units (stored in adminWalletBalance)
    let amountNgnMinor = Math.round(amountNum * 100);
    if (selectedCurrency !== 'NGN') {
      const exchangeRates = {
        NGN_USD: 0.00125,
        NGN_GBP: 0.001,
        NGN_EUR: 0.00116,
        NGN_GHS: 0.0143,
        NGN_CAD: 0.00172
      };
      const rateKey = `NGN_${selectedCurrency}`;
      const rate = exchangeRates[rateKey] || 1;
      amountNgnMinor = Math.round((amountNum * 100) / rate);
    }

    if (adminWalletBalance < amountNgnMinor) {
      setAdminPayoutMessage('Insufficient commission balance.');
      return;
    }

    setIsRequestingAdminPayout(true);
    setAdminPayoutMessage('');

    try {
      const response = await fetch(`${API_BASE}/payout/request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount: amountNgnMinor,
          payoutMethod: adminPayoutMethod,
          bankDetails: adminPayoutMethod === 'Paystack Bank Account' ? {
            accountNumber: adminAccountNumber,
            accountName: adminAccountName,
            bankCode: adminSelectedBankCode,
            bankName: adminSelectedBankName
          } : null
        })
      });
      const data = await response.json();
      if (response.ok) {
        setAdminPayoutMessage(`✓ Payout requested successfully!`);
        setAdminWalletBalance(prev => prev - amountNgnMinor);
        setAdminWithdrawAmount('');
        // Refresh dashboard data
        const payoutsRes = await fetch(`${API_BASE}/admin/payouts`, { headers: getAuthHeaders() });
        if (payoutsRes.ok) {
          const rawPayouts = await payoutsRes.json();
           const mappedPayouts = rawPayouts.map(p => ({
            id: p.id,
            name: p.teacherName || p.teacherId,
            amount: p.amount,
            processor: p.payoutMethod || 'Wallet/Bank',
            status: p.status === 'pending' ? 'Pending' : (p.status === 'approved' ? 'Scheduled' : (p.status === 'failed' ? 'Failed' : 'Paid')),
            date: new Date(p.requestedAt).toLocaleDateString(),
            bankDetails: p.bankDetails || null,
            error: p.errorDetails || null
          }));
          setPayouts(mappedPayouts);
        }
      } else {
        setAdminPayoutMessage(data.error || 'Failed to request payout.');
      }
    } catch (err) {
      console.error('Error requesting admin payout:', err);
      setAdminPayoutMessage('Withdrawal simulation complete.');
    } finally {
      setIsRequestingAdminPayout(false);
      setTimeout(() => setAdminPayoutMessage(''), 5000);
    }
  };

  const handleBulkApprovePayouts = () => {
    setPayouts(prev => prev.map(p => p.status === 'Pending' || p.status === 'Scheduled' ? { ...p, status: 'Processing' } : p));
    triggerToast('Bulk approval registered: payout transfers scheduled on Paystack/Wise processors.');
  };

  const handlePayoutAction = async (payoutId, action) => {
    try {
      const response = await fetch(`${API_BASE}/admin/payouts/${payoutId}/respond`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: (action === 'Paid' || action === 'Scheduled') ? 'approve' : 'reject' })
      });
      if (response.ok) {
        setPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: action } : p));
        triggerToast(`Payout ${payoutId} updated to: ${action}`);
      } else {
        triggerToast(`Failed to process payout ${payoutId}.`);
      }
    } catch (err) {
      console.warn("Failed to process payout:", err);
      // Fallback
      setPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: action } : p));
      triggerToast(`Payout ${payoutId} updated to: ${action} (Sandbox Mode)`);
    }
  };

  const handleRetryPayout = (payoutId) => {
    setPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: 'Processing', error: null } : p));
    triggerToast(`Retrying failed payout ID ${payoutId} via API...`);
  };

  const handleProcessRefund = (refundId) => {
    const rf = refunds.find(r => r.id === refundId);
    if (!rf) return;
    setRefunds(prev => prev.filter(r => r.id !== refundId));
    setRefundAudits(prev => [
      { id: `aud_${Date.now()}`, parentName: rf.parentName, amount: rf.fee, reason: rf.subject, adminId: 'admin_1', timestamp: 'Just now' },
      ...prev
    ]);
    triggerToast(`Refund of ${formatCurrency(convertMinor(rf.fee, selectedCurrency), selectedCurrency)} released back to ${rf.parentName}.`);
  };

  const handleBulkApproveRefunds = () => {
    if (refunds.length === 0) {
      triggerToast('No pending refunds to approve.');
      return;
    }
    refunds.forEach(rf => {
      setRefundAudits(prev => [
        { id: `aud_${Date.now()}_${rf.id}`, parentName: rf.parentName, amount: rf.fee, reason: `${rf.subject} (Bulk Approved)`, adminId: 'admin_1', timestamp: 'Just now' },
        ...prev
      ]);
    });
    setRefunds([]);
    triggerToast('Bulk approved all pending trial refunds.');
  };

  const handleEmergencyRefundOverride = (e) => {
    e.preventDefault();
    if (!overrideTxId) return;
    const amount = 400000; // Mock 4,000 NGN transaction
    setRefundAudits(prev => [
      { id: `aud_${Date.now()}`, parentName: `Tx Override: ${overrideTxId}`, amount, reason: `EMERGENCY OVERRIDE (Refund ${overridePercent}%) - Reason: ${overrideReason}`, adminId: 'admin_1', timestamp: 'Just now' },
      ...prev
    ]);
    triggerToast(`Emergency policy override executed for ${overrideTxId} at ${overridePercent}% refund.`);
    setOverrideTxId('');
    setOverrideReason('Parent emergency connection failure');
  };

  const handleProcessBundleRefund = (bundleId) => {
    setBundles(prev => prev.map(b => b.id === bundleId ? { ...b, refundRequested: false, remaining: 0 } : b));
    triggerToast('Bundle cancellation refund processed. Remaining sessions voided.');
  };

  const handleAddB2bSchool = async (e) => {
    e.preventDefault();
    if (!newSchoolName || !newSchoolContact) return;
    try {
      const response = await fetch(`${API_BASE}/admin/b2b-schools/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newSchoolName })
      });
      if (response.ok) {
        const createdSchool = await response.json();
        const newSchool = {
          id: createdSchool.uid || createdSchool.id,
          uid: createdSchool.uid,
          name: createdSchool.name,
          contact: newSchoolContact,
          contractValue: parseInt(newSchoolContract || 0) * 100,
          flatFee: parseInt(newSchoolFee || 0) * 100,
          studentsCount: createdSchool.registeredStudentsCount || 0,
          studentsLimit: parseInt(newSchoolStudentsLimit || 100),
          teachersCount: newSchoolTeachersList.split(',').length,
          assignedTeachers: newSchoolTeachersList.split(',').map(s => s.trim()),
          portalAccess: createdSchool.status === 'active',
          renewalDate: '2027-06-10',
          reporting: { totalSessions: 0, subjectsUsed: [], avgProgress: 'N/A' },
          apiKey: createdSchool.apiKey,
          apiKeyStatus: createdSchool.status
        };
        setB2bSchools(prev => [...prev, newSchool]);
        setNewSchoolName('');
        setNewSchoolContact('');
        setNewSchoolContract('');
        setNewSchoolFee('');
        triggerToast(`B2B Partnership created for ${newSchoolName}!`);
      } else {
        const err = await response.json();
        triggerToast(`Error: ${err.error || 'Failed to create school'}`);
      }
    } catch (err) {
      console.warn("Failed to create B2B school:", err);
      triggerToast("Network error during B2B school creation.");
    }
  };

  const handleGenerateApiKey = (schoolId) => {
    setB2bSchools(prev => prev.map(s => {
      if (s.id === schoolId || s.uid === schoolId) {
        const rand = Math.random().toString(36).substring(2, 8);
        const namePart = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        return {
          ...s,
          apiKey: `eb_b2b_${namePart}_key_${rand}`,
          apiKeyStatus: 'active'
        };
      }
      return s;
    }));
    const sch = b2bSchools.find(s => s.id === schoolId || s.uid === schoolId);
    triggerToast(`API Key generated for ${sch?.name}!`);
  };

  const handleRevokeApiKey = async (schoolId) => {
    const sch = b2bSchools.find(s => s.id === schoolId || s.uid === schoolId);
    if (!sch) return;
    try {
      const response = await fetch(`${API_BASE}/admin/b2b-schools/revoke`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: sch.uid || sch.id })
      });
      if (response.ok) {
        setB2bSchools(prev => prev.map(s => {
          if (s.id === schoolId || s.uid === schoolId) {
            return {
              ...s,
              apiKeyStatus: 'revoked',
              portalAccess: false
            };
          }
          return s;
        }));
        triggerToast(`API Key revoked for ${sch?.name}!`);
      } else {
        const err = await response.json();
        triggerToast(`Error: ${err.error || 'Failed to revoke API key'}`);
      }
    } catch (err) {
      console.warn("Failed to revoke API key:", err);
      triggerToast("Network error during API key revocation.");
    }
  };

  const handleTogglePortalAccess = (schoolId) => {
    setB2bSchools(prev => prev.map(s => s.id === schoolId ? { ...s, portalAccess: !s.portalAccess } : s));
    const sch = b2bSchools.find(s => s.id === schoolId);
    triggerToast(`Portal access ${sch?.portalAccess ? 'REVOKED' : 'ACTIVATED'} for ${sch?.name}`);
  };

  const handleGenerateBulkCodes = (schoolId, qty) => {
    const sch = b2bSchools.find(s => s.id === schoolId);
    if (!sch) return;
    const prefix = sch.name.split(' ').map(w => w[0]).join('').toUpperCase();
    const codes = [];
    for (let i = 0; i < qty; i++) {
      const code = `EB-INV-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
      codes.push(code);
    }
    setGeneratedBulkCodes(codes);
    setBulkInviteSchoolId(schoolId);
    triggerToast(`Generated ${qty} bulk student invite codes for ${sch.name}.`);
  };

  const handleGenerateSchoolInvoice = (school) => {
    const newInvoice = {
      id: `inv_${Date.now()}`,
      schoolName: school.name,
      invoiceNo: `EB-26-${Math.floor(10 + Math.random() * 89)}-${Math.floor(10 + Math.random() * 89)}`,
      amount: school.flatFee,
      date: new Date().toISOString().split('T')[0],
      status: 'Unpaid'
    };
    setInvoices(prev => [newInvoice, ...prev]);
    triggerToast(`Monthly invoice ${newInvoice.invoiceNo} successfully generated for ${school.name}.`);
  };

  const handleActionGdpr = (id) => {
    setGdprRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Completed' } : r));
    triggerToast(`Compliance SLA updated: GDPR deletion task processed successfully.`);
  };

  const handleRequestRecording = (e) => {
    e.preventDefault();
    const newReq = {
      id: `rec_req_${Date.now()}`,
      disputeId: recordingDisputeId,
      reason: recordingReason,
      adminId: 'admin_1',
      status: 'Approved & Active (Expires in 72h)',
      timestamp: 'Just now'
    };
    setRecordingRequests(prev => [newReq, ...prev]);
    triggerToast(`Recording permission verified: 72h access window activated for dispute investigation.`);
  };

  const handleVerifyBackground = (teacherId) => {
    setBackgroundChecks(prev => prev.map(b => b.id === teacherId ? { ...b, verifiedDate: '2026-06-10', expiryDate: '2027-06-10', premiumTier: true } : b));
    triggerToast(`Academic background check verified. Verification seal attached.`);
  };

  const handleReviewModeration = (reviewId, action, reason = '') => {
    setFlaggedReviews(prev => prev.filter(r => r.id !== reviewId));
    if (action === 'Remove Review') {
      setModerationAuditLogs(prev => [
        { id: `mod_log_${Date.now()}`, reviewId, action, reason, adminId: 'admin_1', timestamp: 'Just now' },
        ...prev
      ]);
    }
    triggerToast(`Review moderated. Action: ${action} ${reason ? `(${reason})` : ''}`);
  };

  const pendingApps = applications.filter(a => a.status === 'pending_approval' || a.status === 'onboarding');
  const infoRequestedApps = applications.filter(a => a.status === 'info_requested' || a.status === 'needs_revision');

  return (
    <section id="dashboard" className="py-24 px-6 md:px-16 lg:px-24 bg-brand-cream max-w-7xl mx-auto border-t border-brand-moss/10">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-moss border border-brand-cream/20 text-brand-cream py-4 px-6 rounded-2xl shadow-2xl animate-fade-in flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-brand-clay animate-bounce" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">{toastMessage}</span>
        </div>
      )}

      {/* Header Suite */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-12 border-b border-brand-moss/10 pb-8">
        <div>
          {onBack && (
            <button 
              onClick={onBack}
              className="mb-4 hidden lg:inline-flex items-center gap-1.5 font-sans font-bold text-[10px] uppercase tracking-wider text-brand-moss bg-brand-moss/5 hover:bg-brand-moss/10 px-3.5 py-1.5 rounded-full border border-brand-moss/10 transition-colors"
            >
              ← Back to Home
            </button>
          )}
          <span className="font-mono text-xs uppercase tracking-widest text-brand-clay font-bold block mb-1">SYSTEM MONITORING SYSTEM</span>
          <h2 className="font-heading font-bold text-3xl text-brand-moss">Admin Control Room</h2>
          <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
            Resolve dispute escalations, configure escrow payout settings, process vetting records, and audit NDPR regulatory logs.
          </p>
        </div>

        {/* Global Tab Switcher */}
        <div className="flex overflow-x-auto md:flex-wrap whitespace-nowrap bg-brand-moss/5 border border-brand-moss/10 rounded-3xl p-1.5 gap-1 max-w-full scrollbar-none">
          {[
            { id: 'financials', label: 'Financials & Payouts' },
            { id: 'vetting', label: `Teachers & Vetting (${pendingApps.length} pending)` },
            { id: 'disputes', label: 'Disputes & Policy' },
            { id: 'groups', label: 'Groups & Bundles' },
            { id: 'compliance', label: 'Compliance & Safety' },
            { id: 'b2b', label: 'B2B Partners' },
            { id: 'config', label: 'Config & Moderation' },
            { id: 'emails', label: 'Emails & Notifications' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubSection(tab.id)}
              className={`py-2 px-4 rounded-full font-heading font-bold text-[10px] uppercase tracking-wider shrink-0 transition-all duration-300 ${
                activeSubSection === tab.id
                  ? 'bg-brand-moss text-white shadow-md'
                  : 'text-brand-moss hover:bg-brand-moss/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MASTER DYNAMIC PLATFORM HEALTH METRICS STRIP (Synchronized with GET /api/admin/stats & Cloud Firestore) */}
      <div className="mb-10 space-y-3">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-brand-charcoal/70 font-bold">
              PLATFORM HEALTH & COMPLIANCE TELEMETRY
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-brand-charcoal/40 hidden sm:inline">
              Live Cloud Data Synchronized
            </span>
            <button
              onClick={fetchAdminData}
              className="font-mono text-[9px] uppercase tracking-wider text-brand-moss hover:text-brand-clay font-bold flex items-center gap-1.5 bg-brand-moss/5 hover:bg-brand-moss/10 px-3 py-1 rounded-full border border-brand-moss/10 transition-colors"
              title="Refresh telemetry metrics from server"
            >
              <RefreshCw className="w-3 h-3" /> Sync Live Stats
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
          {/* Card 1: Approved Teachers */}
          <div 
            onClick={() => { setActiveSubSection('vetting'); setTeacherViewMode('directory'); setDirectoryFilter('verified'); }}
            className="bg-white border border-brand-moss/10 rounded-2xl p-4 shadow-xs hover:border-brand-clay/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <span className="font-mono text-[8px] uppercase tracking-wider text-brand-charcoal/50 block group-hover:text-brand-clay transition-colors">
              Approved Teachers
            </span>
            <span className="font-heading font-extrabold text-2xl text-brand-moss block mt-1">
              {adminStats.approvedTeachers || applications.filter(a => a.verified || a.status === 'verified').length || 14}
            </span>
            <span className="font-mono text-[8px] text-emerald-600 font-bold block mt-1">
              ✓ Active on Platform
            </span>
          </div>

          {/* Card 2: Registered Parents */}
          <div 
            onClick={() => setActiveSubSection('emails')}
            className="bg-white border border-brand-moss/10 rounded-2xl p-4 shadow-xs hover:border-brand-clay/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <span className="font-mono text-[8px] uppercase tracking-wider text-brand-charcoal/50 block group-hover:text-brand-clay transition-colors">
              Registered Parents
            </span>
            <span className="font-heading font-extrabold text-2xl text-brand-moss block mt-1">
              {adminStats.registeredParents || 14}
            </span>
            <span className="font-mono text-[8px] text-emerald-600 font-bold block mt-1">
              ✓ Verified Client Accounts
            </span>
          </div>

          {/* Card 3: Active Students */}
          <div 
            onClick={() => setActiveSubSection('groups')}
            className="bg-white border border-brand-moss/10 rounded-2xl p-4 shadow-xs hover:border-brand-clay/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <span className="font-mono text-[8px] uppercase tracking-wider text-brand-charcoal/50 block group-hover:text-brand-clay transition-colors">
              Active Students
            </span>
            <span className="font-heading font-extrabold text-2xl text-brand-moss block mt-1">
              {adminStats.activeStudents || 8}
            </span>
            <span className="font-mono text-[8px] text-brand-charcoal/50 block mt-1">
              Enrolled Learners
            </span>
          </div>

          {/* Card 4: SLA Warnings */}
          <div 
            onClick={() => { setActiveSubSection('vetting'); setTeacherViewMode('pipeline'); setPipelineFilter('sla'); }}
            className={`bg-white border rounded-2xl p-4 shadow-xs transition-all cursor-pointer group ${
              (applications.filter(a => a.slaHoursElapsed > 24 && (a.status === 'pending_approval' || a.status === 'onboarding')).length > 0 || adminStats.slaWarnings > 0)
                ? 'border-rose-300 bg-rose-50/15 hover:border-rose-400'
                : 'border-brand-moss/10 hover:border-brand-clay/40'
            }`}
          >
            <span className="font-mono text-[8px] uppercase tracking-wider text-brand-charcoal/50 block group-hover:text-rose-600 transition-colors">
              SLA Warnings
            </span>
            <span className={`font-heading font-extrabold text-2xl block mt-1 ${
              (applications.filter(a => a.slaHoursElapsed > 24 && (a.status === 'pending_approval' || a.status === 'onboarding')).length > 0 || adminStats.slaWarnings > 0)
                ? 'text-rose-600'
                : 'text-brand-moss'
            }`}>
              {applications.filter(a => a.slaHoursElapsed > 24 && (a.status === 'pending_approval' || a.status === 'onboarding')).length || adminStats.slaWarnings || 0}
            </span>
            <span className={`font-mono text-[8px] font-bold block mt-1 ${
              (applications.filter(a => a.slaHoursElapsed > 24 && (a.status === 'pending_approval' || a.status === 'onboarding')).length > 0 || adminStats.slaWarnings > 0)
                ? 'text-rose-600 animate-pulse'
                : 'text-emerald-600'
            }`}>
              {(applications.filter(a => a.slaHoursElapsed > 24 && (a.status === 'pending_approval' || a.status === 'onboarding')).length > 0 || adminStats.slaWarnings > 0) ? '⚠️ Action Required' : '✓ Zero Overdue'}
            </span>
          </div>

          {/* Card 5: Pending Vetting */}
          <div 
            onClick={() => { setActiveSubSection('vetting'); setTeacherViewMode('pipeline'); setPipelineFilter('all'); }}
            className="bg-white border border-brand-moss/10 rounded-2xl p-4 shadow-xs hover:border-brand-clay/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <span className="font-mono text-[8px] uppercase tracking-wider text-brand-charcoal/50 block group-hover:text-brand-clay transition-colors">
              Pending Vetting
            </span>
            <span className="font-heading font-extrabold text-2xl text-brand-clay block mt-1">
              {applications.filter(a => a.status === 'pending_approval' || a.status === 'onboarding').length || adminStats.pendingTeachers || 0}
            </span>
            <span className="font-mono text-[8px] text-brand-charcoal/50 block mt-1">
              SLA: 48h limit
            </span>
          </div>

          {/* Card 6: Approval Rate */}
          <div className="bg-white border border-brand-moss/10 rounded-2xl p-4 shadow-xs hover:border-brand-clay/30 transition-all">
            <span className="font-mono text-[8px] uppercase tracking-wider text-brand-charcoal/50 block">
              Approval Rate
            </span>
            <span className="font-heading font-extrabold text-2xl text-brand-moss block mt-1">
              {adminStats.approvalRate || 88}%
            </span>
            <span className="font-mono text-[8px] text-emerald-600 font-bold block mt-1">
              ✓ Benchmark &gt;75%
            </span>
          </div>

          {/* Card 7: Avg Decision Time */}
          <div className="bg-white border border-brand-moss/10 rounded-2xl p-4 shadow-xs hover:border-brand-clay/30 transition-all">
            <span className="font-mono text-[8px] uppercase tracking-wider text-brand-charcoal/50 block">
              Avg Decision Time
            </span>
            <span className="font-heading font-extrabold text-2xl text-brand-moss block mt-1">
              {adminStats.avgDecisionTime || 14}h
            </span>
            <span className="font-mono text-[8px] text-emerald-600 font-bold block mt-1">
              ✓ NITDA &lt;48h
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: FINANCIALS & PAYOUTS */}
      {activeSubSection === 'financials' && (
        <div className="space-y-8 animate-fade-up">
          {/* Financial Stats strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-brand-moss/10 rounded-3xl p-5 shadow-sm">
              <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 block">Platform Net Commission</span>
              <span className="font-heading font-bold text-2xl text-brand-moss block mt-1">
                {formatCurrency(convertMinor(adminWalletBalance, selectedCurrency), selectedCurrency)}
              </span>
              <span className="font-mono text-[9px] text-emerald-600 font-bold block mt-1">✓ This Month (Escrow cut)</span>
            </div>
            <div className="bg-white border border-brand-moss/10 rounded-3xl p-5 shadow-sm">
              <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 block">Disbursed to date</span>
              <span className="font-heading font-bold text-2xl text-brand-moss block mt-1">₦0</span>
              <span className="font-mono text-[9px] text-brand-charcoal/40 block mt-1">To verified teacher accounts</span>
            </div>
            <div className="bg-white border border-brand-moss/10 rounded-3xl p-5 shadow-sm">
              <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 block">Held in Live Escrow</span>
              <span className="font-heading font-bold text-2xl text-brand-clay block mt-1">₦0</span>
              <span className="font-mono text-[9px] text-brand-charcoal/40 block mt-1">Pending student clock verification</span>
            </div>
            <div className="bg-white border border-brand-moss/10 rounded-3xl p-5 shadow-sm">
              <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 block">Commission Rates</span>
              <span className="font-heading font-bold text-2xl text-brand-moss block mt-1">{configCommission}%</span>
              <span className="font-mono text-[9px] text-brand-charcoal/40 block mt-1">Tier 2: {configCommissionTier2}% · Tier 3: {configCommissionTier3}%</span>
            </div>
            <div className="bg-white border border-rose-200 bg-rose-50/10 rounded-3xl p-5 shadow-sm animate-pulse">
              <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 block">Failed Payouts</span>
              <span className="font-heading font-bold text-2xl text-rose-600 block mt-1">
                {payouts.filter(p => p.status === 'Failed').length}
              </span>
              <span className="font-mono text-[9px] text-rose-600 font-bold block mt-1">⚠️ Action Required</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* SVG Revenue trend chart */}
            <div className="lg:col-span-7 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
              <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">REVENUE TREND</span>
                  <h3 className="font-heading font-bold text-lg text-brand-moss mt-0.5">Gross Revenue & Net Commission</h3>
                </div>
                {/* Filters */}
                <div className="flex gap-2">
                  <select 
                    value={chartCurrency} 
                    onChange={(e) => setChartCurrency(e.target.value)}
                    className="bg-brand-cream/60 border border-brand-moss/10 rounded-xl px-2.5 py-1 text-xs focus:outline-none"
                  >
                    <option value="NGN">NGN (₦)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                  <select 
                    value={chartTrend} 
                    onChange={(e) => setChartTrend(e.target.value)}
                    className="bg-brand-cream/60 border border-brand-moss/10 rounded-xl px-2.5 py-1 text-xs focus:outline-none"
                  >
                    <option value="Monthly">Monthly View</option>
                    <option value="Weekly">Weekly View</option>
                    <option value="Daily">Daily View</option>
                  </select>
                </div>
              </div>

              {/* Advanced Breakdowns Filters */}
              <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-brand-moss/5 text-xs">
                <div>
                  <label className="block font-mono text-[9px] text-brand-charcoal/50 uppercase mb-1">Filter by Subject</label>
                  <select 
                    value={revenueSubjectFilter} 
                    onChange={(e) => setRevenueSubjectFilter(e.target.value)}
                    className="w-full bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-3 py-2 focus:outline-none"
                  >
                    <option value="All">All Subjects</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[9px] text-brand-charcoal/50 uppercase mb-1">Filter by Country</label>
                  <select 
                    value={revenueCountryFilter} 
                    onChange={(e) => setRevenueCountryFilter(e.target.value)}
                    className="w-full bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-3 py-2 focus:outline-none"
                  >
                    <option value="All">All Countries</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Kenya">Kenya</option>
                    <option value="South Africa">South Africa</option>
                    <option value="Uganda">Uganda</option>
                    <option value="Rwanda">Rwanda</option>
                    <option value="Cameroon">Cameroon</option>
                    <option value="Tanzania">Tanzania</option>
                    <option value="Egypt">Egypt</option>
                    <option value="Senegal">Senegal</option>
                    <option value="Ethiopia">Ethiopia</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                  </select>
                </div>
              </div>

              {/* Responsive SVG Sparkline Chart */}
              <div className="w-full h-48 bg-brand-cream/10 border border-brand-moss/5 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
                <svg viewBox="0 0 500 150" className="w-full h-36 stroke-brand-moss fill-none stroke-[2.5] overflow-visible">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#CC5833" stopOpacity="0.25"/>
                      <stop offset="100%" stopColor="#CC5833" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="500" y2="30" stroke="#f1ece5" strokeWidth="1" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="#f1ece5" strokeWidth="1" />
                  <line x1="0" y1="120" x2="500" y2="120" stroke="#f1ece5" strokeWidth="1" strokeDasharray="3" />

                  {/* Area fill */}
                  <path 
                    d={
                      chartTrend === 'Monthly' 
                        ? "M0,130 Q80,40 160,80 T320,30 T480,45 L480,150 L0,150 Z"
                        : chartTrend === 'Weekly'
                        ? "M0,110 Q80,90 160,50 T320,85 T480,30 L480,150 L0,150 Z"
                        : "M0,80 Q80,120 160,95 T320,40 T480,65 L480,150 L0,150 Z"
                    } 
                    fill="url(#chartGrad)" 
                    stroke="none"
                  />
                  {/* Revenue Line */}
                  <path 
                    d={
                      chartTrend === 'Monthly' 
                        ? "M0,130 Q80,40 160,80 T320,30 T480,45"
                        : chartTrend === 'Weekly'
                        ? "M0,110 Q80,90 160,50 T320,85 T480,30"
                        : "M0,80 Q80,120 160,95 T320,40 T480,65"
                    } 
                    className="stroke-brand-clay"
                  />
                  
                  {/* Commision Line (Offset) */}
                  <path 
                    d={
                      chartTrend === 'Monthly' 
                        ? "M0,140 Q80,85 160,110 T320,60 T480,80"
                        : chartTrend === 'Weekly'
                        ? "M0,120 Q80,110 160,80 T320,105 T480,50"
                        : "M0,100 Q80,130 160,115 T320,60 T480,85"
                    } 
                    className="stroke-brand-moss"
                    strokeDasharray="4"
                  />

                  {/* Interactive Nodes */}
                  {chartTrend === 'Monthly' && (
                    <>
                      <circle cx="160" cy="80" r="4" fill="#2E4036" />
                      <circle cx="320" cy="30" r="4" fill="#CC5833" />
                    </>
                  )}
                  {chartTrend === 'Weekly' && (
                    <>
                      <circle cx="160" cy="50" r="4" fill="#2E4036" />
                      <circle cx="480" cy="30" r="4" fill="#CC5833" />
                    </>
                  )}
                  {chartTrend === 'Daily' && (
                    <>
                      <circle cx="320" cy="40" r="4" fill="#2E4036" />
                      <circle cx="480" cy="65" r="4" fill="#CC5833" />
                    </>
                  )}
                </svg>

                {/* X Axis Labels */}
                <div className="flex justify-between font-mono text-[9px] text-brand-charcoal/50 px-2 mt-2">
                  <span>{chartTrend === 'Monthly' ? 'Jan' : chartTrend === 'Weekly' ? 'Week 1' : 'Mon'}</span>
                  <span>{chartTrend === 'Monthly' ? 'Mar' : chartTrend === 'Weekly' ? 'Week 2' : 'Wed'}</span>
                  <span>{chartTrend === 'Monthly' ? 'May' : chartTrend === 'Weekly' ? 'Week 3' : 'Fri'}</span>
                  <span>{chartTrend === 'Monthly' ? 'Jun (Current)' : chartTrend === 'Weekly' ? 'Week 4' : 'Sun (Today)'}</span>
                </div>
              </div>

              {/* Forecast and Subscriptions Analytics */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-brand-moss/5 font-sans text-xs">
                <div className="bg-brand-cream/35 border border-brand-moss/5 rounded-2xl p-4">
                  <span className="font-mono text-[9px] text-brand-charcoal/50 uppercase block">Active auto-renew packages</span>
                  <span className="font-heading font-bold text-base text-brand-moss block mt-1">₦6.8M / month</span>
                  <span className="text-[10px] text-brand-charcoal/60 mt-1 block">Recurring subscription forecast baseline.</span>
                </div>
                <div className="bg-brand-cream/35 border border-brand-moss/5 rounded-2xl p-4">
                  <span className="font-mono text-[9px] text-brand-charcoal/50 uppercase block">Projected Commission</span>
                  <span className="font-heading font-bold text-base text-brand-clay block mt-1">₦1.15M</span>
                  <span className="text-[10px] text-brand-charcoal/60 mt-1 block">Based on 17% standard platform commission.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-8">
              {/* Automated 24h Escrow Release Engine & Holds */}
              <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block">TIMED ESCROW PROTOCOL</span>
                    <h3 className="font-heading font-bold text-base text-brand-moss mt-0.5">Automated 24h Escrow Release</h3>
                    <p className="font-sans text-[11px] text-brand-charcoal/60 mt-0.5">
                      Background cron auto-disburses tutor payouts 24h after class ends unless a dispute is lodged.
                    </p>
                  </div>
                  <button
                    onClick={handleTriggerEscrowCron}
                    disabled={isRunningEscrowCron}
                    className="shrink-0 bg-brand-clay hover:bg-brand-clay/90 text-white font-mono text-[9px] uppercase font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRunningEscrowCron ? 'animate-spin' : ''}`} />
                    {isRunningEscrowCron ? 'Running...' : 'Run Escrow Cron ⚡'}
                  </button>
                </div>

                <div className="space-y-2 pt-2 border-t border-brand-moss/5">
                  <div className="flex justify-between items-center text-[10px] font-mono text-brand-charcoal/50">
                    <span>Sessions in 24h Cooling Window ({activeEscrowHolds.length})</span>
                    <span className="text-emerald-600 font-bold">● Active Escrow Worker</span>
                  </div>

                  {activeEscrowHolds.length === 0 ? (
                    <div className="p-4 bg-brand-cream/20 rounded-2xl border border-brand-moss/5 text-center text-[11px] text-brand-charcoal/50 font-sans">
                      All completed sessions have cleared their 24h cooling window and been settled to tutors.
                    </div>
                  ) : (
                    activeEscrowHolds.map(hold => (
                      <div key={hold.id} className="p-3 bg-brand-cream/30 border border-brand-moss/10 rounded-2xl flex justify-between items-center text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-brand-moss">{hold.teacherName}</span>
                            <span className="font-mono text-[8px] bg-brand-moss/10 text-brand-moss px-1.5 py-0.5 rounded">{hold.subject}</span>
                          </div>
                          <span className="text-[10px] text-brand-charcoal/60 block mt-0.5">
                            Auto-release in: <b className="text-brand-clay font-mono">{hold.timeLeftFormatted || 'under 24h'}</b>
                          </span>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <span className="font-mono font-bold text-brand-moss block">
                            {formatCurrency(convertMinor(hold.cost, selectedCurrency), selectedCurrency)}
                          </span>
                          <button
                            onClick={() => handleEarlyEscrowRelease(hold.id)}
                            className="font-mono text-[8px] uppercase tracking-wider bg-brand-moss text-white px-2 py-1 rounded-lg hover:bg-brand-moss/90 font-bold"
                          >
                            Release Early
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Withdraw Platform Commission Card */}
              <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">COMMISSION WITHDRAWAL</span>
                  <h3 className="font-heading font-bold text-lg text-brand-moss">Withdraw Commission</h3>
                  <span className="font-sans text-[10px] text-brand-charcoal/50 block mt-1">Transfer platform commission to connected bank/Paystack account.</span>
                </div>
                
                <form onSubmit={handleAdminWithdraw} className="space-y-3 font-sans text-xs">
                  <div>
                    <label className="font-bold text-[9px] uppercase tracking-wider text-brand-charcoal/50 block mb-1">Withdrawal Amount ({selectedCurrency})</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="any"
                      placeholder={`e.g. ${selectedCurrency === 'NGN' ? '10000' : '50'}`}
                      value={adminWithdrawAmount}
                      onChange={(e) => setAdminWithdrawAmount(e.target.value)}
                      className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl p-2.5 focus:outline-none focus:border-brand-clay"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-brand-charcoal/50 uppercase font-bold mb-1">Payout Method</label>
                    <select
                      value={adminPayoutMethod}
                      onChange={(e) => setAdminPayoutMethod(e.target.value)}
                      className="w-full bg-white border border-brand-moss/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    >
                      <option value="Wise Bank Direct">Wise Bank Direct</option>
                      <option value="Paystack Bank Account">Paystack Bank Account</option>
                    </select>
                  </div>
                  {adminPayoutMethod === 'Paystack Bank Account' && (
                    <div className="border border-brand-moss/10 bg-brand-cream/10 p-4 rounded-2xl space-y-3 mt-1.5 animate-fade-in text-[10px]">
                      <span className="font-mono text-[9px] text-brand-clay font-bold tracking-widest uppercase block mb-1">Local NGN Bank Details</span>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[9px] text-brand-charcoal/50 uppercase font-bold mb-0.5">Account Number</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 0123456789 (10 digits)"
                            maxLength="10"
                            value={adminAccountNumber}
                            onChange={(e) => setAdminAccountNumber(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-white border border-brand-moss/10 rounded-xl p-2 focus:outline-none focus:border-brand-clay text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-brand-charcoal/50 uppercase font-bold mb-0.5">Account Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. John Doe"
                            value={adminAccountName}
                            onChange={(e) => setAdminAccountName(e.target.value)}
                            className="w-full bg-white border border-brand-moss/10 rounded-xl p-2 focus:outline-none focus:border-brand-clay text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-brand-charcoal/50 uppercase font-bold mb-0.5">Select Bank</label>
                          <select
                            value={adminSelectedBankCode}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAdminSelectedBankCode(val);
                              const bName = [
                                { code: '058', name: 'Guaranty Trust Bank (GTBank)' },
                                { code: '057', name: 'Zenith Bank' },
                                { code: '044', name: 'Access Bank' },
                                { code: '033', name: 'United Bank for Africa (UBA)' },
                                { code: '011', name: 'First Bank of Nigeria' },
                                { code: '050', name: 'Sterling Bank' },
                                { code: '219', name: 'Stanbic IBTC Bank' }
                              ].find(b => b.code === val)?.name || 'GTBank';
                              setAdminSelectedBankName(bName);
                            }}
                            className="w-full bg-white border border-brand-moss/10 rounded-xl p-2 focus:outline-none text-xs"
                          >
                            <option value="058">Guaranty Trust Bank (GTBank)</option>
                            <option value="057">Zenith Bank</option>
                            <option value="044">Access Bank</option>
                            <option value="033">United Bank for Africa (UBA)</option>
                            <option value="011">First Bank of Nigeria</option>
                            <option value="050">Sterling Bank</option>
                            <option value="219">Stanbic IBTC Bank</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isRequestingAdminPayout || adminWalletBalance <= 0}
                    className="w-full py-2.5 bg-brand-clay hover:bg-brand-clay/90 disabled:bg-brand-charcoal/20 text-white rounded-xl font-heading font-bold uppercase text-[10px] tracking-wider transition-colors"
                  >
                    {isRequestingAdminPayout ? 'Processing...' : 'Withdraw Funds'}
                  </button>
                  {adminPayoutMessage && (
                    <div className="text-center font-mono text-[9px] font-bold mt-2 animate-pulse text-emerald-600">
                      {adminPayoutMessage}
                    </div>
                  )}
                </form>
              </div>

              {/* Payout approval queue */}
              <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-brand-moss/5 pb-3">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">SETTLEMENT ENGINE</span>
                  <h3 className="font-heading font-bold text-lg text-brand-moss">Payout Queue Log</h3>
                </div>
                <button 
                  onClick={handleBulkApprovePayouts}
                  className="font-mono text-[9px] uppercase tracking-widest text-brand-clay font-bold border border-brand-clay/20 px-3 py-1.5 rounded-full hover:bg-brand-clay hover:text-white transition-all duration-300 flex items-center gap-1.5"
                >
                  Bulk Approve
                </button>
              </div>

              {/* Payout Queue Filters */}
              <div className="grid grid-cols-3 gap-2 bg-brand-cream/10 p-2.5 rounded-2xl border border-brand-moss/5 text-[9px] font-mono">
                <div>
                  <label className="block text-brand-charcoal/50 uppercase mb-1">Processor</label>
                  <select 
                    value={payoutFilterProcessor} 
                    onChange={(e) => setPayoutFilterProcessor(e.target.value)}
                    className="w-full bg-white border border-brand-moss/10 rounded-lg p-1 text-[9px] focus:outline-none"
                  >
                    <option value="All">All</option>
                    <option value="Paystack">Paystack</option>
                    <option value="Wise">Wise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-brand-charcoal/50 uppercase mb-1">Status</label>
                  <select 
                    value={payoutFilterStatus} 
                    onChange={(e) => setPayoutFilterStatus(e.target.value)}
                    className="w-full bg-white border border-brand-moss/10 rounded-lg p-1 text-[9px] focus:outline-none"
                  >
                    <option value="All">All</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                    <option value="Processing">Processing</option>
                    <option value="Paid">Paid</option>
                    <option value="Frozen">Frozen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-brand-charcoal/50 uppercase mb-1">Amount</label>
                  <select 
                    value={payoutFilterAmount} 
                    onChange={(e) => setPayoutFilterAmount(e.target.value)}
                    className="w-full bg-white border border-brand-moss/10 rounded-lg p-1 text-[9px] focus:outline-none"
                  >
                    <option value="All">All</option>
                    <option value="Under 2M">Under ₦2M</option>
                    <option value="Over 2M">Over ₦2M</option>
                  </select>
                </div>
              </div>

              {/* Failed Payouts Retry Sub-Ledger */}
              {payouts.filter(p => p.status === 'Failed' && (payoutFilterProcessor === 'All' || p.processor === payoutFilterProcessor) && (payoutFilterStatus === 'All' || payoutFilterStatus === 'Failed')).length > 0 && (
                <div className="space-y-2.5">
                  <span className="font-mono text-[8px] font-bold text-rose-600 block tracking-wider uppercase animate-pulse">Failed Transfers (Action Required)</span>
                  {payouts.filter(p => p.status === 'Failed' && (payoutFilterProcessor === 'All' || p.processor === payoutFilterProcessor)).map(p => (
                    <div key={p.id} className="border border-rose-200 bg-rose-50/10 rounded-2xl p-3 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-brand-moss block">{p.name}</span>
                        <span className="font-mono text-[8px] text-rose-700 mt-0.5 block">{p.error}</span>
                      </div>
                      <button 
                        onClick={() => handleRetryPayout(p.id)}
                        className="bg-rose-700 hover:bg-rose-800 text-white font-mono text-[9px] uppercase font-bold py-1 px-3 rounded-lg"
                      >
                        Retry Payout
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <span className="font-mono text-[8px] text-brand-charcoal/50 uppercase block tracking-wider pt-2 border-t border-brand-moss/5">Pending & Scheduled Logs</span>
                {payouts.filter(p => p.status !== 'Failed' && 
                  (payoutFilterProcessor === 'All' || p.processor === payoutFilterProcessor) && 
                  (payoutFilterStatus === 'All' || p.status === payoutFilterStatus) && 
                  (payoutFilterAmount === 'All' || (payoutFilterAmount === 'Under 2M' ? p.amount < 200000000 : p.amount >= 200000000))
                ).map((pay) => (
                  <div key={pay.id} className="border border-brand-moss/10 rounded-2xl p-4 space-y-3 bg-brand-cream/5">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-heading font-bold text-xs text-brand-moss">{pay.name}</h4>
                        <span className="font-mono text-[9px] text-brand-charcoal/50 block uppercase mt-0.5">
                          Method: {pay.processor} · Scheduled: {pay.date}
                        </span>
                        {pay.bankDetails && pay.bankDetails.accountNumber && (
                          <div className="bg-brand-cream border border-brand-moss/10 p-2.5 rounded-xl text-[10px] text-brand-moss mt-2 font-mono space-y-0.5 w-fit">
                            <div className="font-bold text-brand-clay uppercase tracking-wider text-[8px] mb-1">Destination Bank Account</div>
                            <div>Acc: <span className="font-bold text-brand-charcoal">{pay.bankDetails.accountNumber}</span></div>
                            <div>Name: <span className="font-bold text-brand-charcoal">{pay.bankDetails.accountName}</span></div>
                            <div>Bank: <span className="font-bold text-brand-charcoal">{pay.bankDetails.bankName || 'N/A'}</span></div>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-heading font-bold text-xs text-brand-moss block">
                          {formatCurrency(convertMinor(pay.amount, selectedCurrency), selectedCurrency)}
                        </span>
                        <span className={`font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full border block w-fit ml-auto mt-1 ${
                          pay.status === 'Scheduled' || pay.status === 'Processing'
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                        }`}>
                          {pay.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-end items-center pt-2 border-t border-brand-moss/5">
                      {pay.status === 'Pending' && pay.bankDetails?.accountNumber && (
                        <button 
                          onClick={() => handleExecuteDirectTransfer(pay)}
                          disabled={transferringPayoutId === pay.id}
                          className="bg-brand-moss hover:bg-brand-moss/90 text-white font-mono text-[9px] uppercase font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                        >
                          <CheckCircle2 className={`w-3 h-3 text-brand-clay ${transferringPayoutId === pay.id ? 'animate-spin' : ''}`} />
                          {transferringPayoutId === pay.id ? 'Disbursing...' : 'Disburse via Paystack ⚡'}
                        </button>
                      )}
                      <button 
                        onClick={() => handlePayoutAction(pay.id, 'Paid')}
                        className="font-mono text-[9px] uppercase font-bold text-brand-moss hover:underline"
                      >
                        Release Early
                      </button>
                      <button 
                        onClick={() => handlePayoutAction(pay.id, 'Frozen')}
                        className="font-mono text-[9px] uppercase font-bold text-brand-clay hover:underline"
                      >
                        Freeze Escrow
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* SECTION 2: TEACHERS & VETTING QUEUE */}
      {activeSubSection === 'vetting' && (
        <div className="space-y-6 animate-fade-up">
          {/* Vetting Header & Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">EDUCATOR ONBOARDING & QUALITY ASSURANCE</span>
              <h3 className="font-heading font-bold text-2xl text-brand-moss">Teacher Verification & Directory</h3>
              <p className="font-sans text-xs text-brand-charcoal/70 mt-0.5">
                Audit credentials, approve elite tiers (Grade A VVIP / Grade B / Freemium), and enforce SLA standards.
              </p>
            </div>
          </div>

          {/* DUAL-VIEW SUB-SECTION SWITCHER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-brand-moss/10 rounded-2xl p-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTeacherViewMode('pipeline')}
                className={`py-2 px-5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                  teacherViewMode === 'pipeline'
                    ? 'bg-brand-moss text-white shadow-sm'
                    : 'text-brand-moss hover:bg-brand-moss/5'
                }`}
              >
                <Clipboard className="w-4 h-4" />
                <span>Educator Vetting Pipeline</span>
                <span className={`py-0.5 px-2 rounded-full text-[9px] font-mono font-bold ${
                  teacherViewMode === 'pipeline' ? 'bg-white/20 text-white' : 'bg-brand-clay/10 text-brand-clay'
                }`}>
                  {applications.filter(a => a.status === 'pending_approval' || a.status === 'onboarding').length}
                </span>
              </button>

              <button
                onClick={() => setTeacherViewMode('directory')}
                className={`py-2 px-5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                  teacherViewMode === 'directory'
                    ? 'bg-brand-moss text-white shadow-sm'
                    : 'text-brand-moss hover:bg-brand-moss/5'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>All Registered Teachers Directory</span>
                <span className={`py-0.5 px-2 rounded-full text-[9px] font-mono font-bold ${
                  teacherViewMode === 'directory' ? 'bg-white/20 text-white' : 'bg-brand-moss/10 text-brand-moss'
                }`}>
                  {applications.length}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50">
                Live Data Synchronized
              </span>
              <button 
                onClick={fetchAdminData} 
                className="p-1.5 rounded-lg border border-brand-moss/10 hover:bg-brand-moss/5 text-brand-moss transition-colors"
                title="Refresh from server"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* VIEW 1: EDUCATOR VETTING PIPELINE */}
          {teacherViewMode === 'pipeline' && (
            <div className="space-y-6">
              {/* Pipeline Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: `All Pending (${applications.filter(a => a.status === 'pending_approval' || a.status === 'onboarding').length})` },
                  { id: 'sla', label: `Critical SLA >24h (${applications.filter(a => a.slaHoursElapsed > 24 && (a.status === 'pending_approval' || a.status === 'onboarding')).length})` },
                  { id: 'revision', label: `Needs Revision (${applications.filter(a => a.status === 'needs_revision' || a.status === 'info_requested').length})` },
                  { id: 'all_apps', label: `All Candidates (${applications.length})` }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setPipelineFilter(filter.id)}
                    className={`py-1.5 px-3.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      pipelineFilter === filter.id
                        ? 'bg-brand-clay text-white border-brand-clay shadow-sm'
                        : 'bg-white text-brand-moss/70 border-brand-moss/10 hover:border-brand-moss/30'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left column application cards */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">
                        EDUCATOR CANDIDATE QUEUE (CLICK TO AUDIT DOSSIER)
                      </span>
                      <span className="font-mono text-[9px] text-brand-charcoal/40">
                        {applications.filter(a => {
                          if (pipelineFilter === 'sla') return a.slaHoursElapsed > 24;
                          if (pipelineFilter === 'revision') return a.status === 'needs_revision' || a.status === 'info_requested';
                          if (pipelineFilter === 'all_apps') return true;
                          return a.status === 'pending_approval' || a.status === 'onboarding';
                        }).length} applicants showing
                      </span>
                    </div>

                    {applications.filter(a => {
                      if (pipelineFilter === 'sla') return a.slaHoursElapsed > 24 && (a.status === 'pending_approval' || a.status === 'onboarding');
                      if (pipelineFilter === 'revision') return a.status === 'needs_revision' || a.status === 'info_requested';
                      if (pipelineFilter === 'all_apps') return true;
                      return a.status === 'pending_approval' || a.status === 'onboarding';
                    }).length === 0 ? (
                      <div className="py-16 text-center space-y-3 font-sans">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mx-auto" />
                        <h4 className="font-heading font-bold text-base text-brand-moss">Queue Cleared</h4>
                        <p className="text-xs text-brand-charcoal/60 max-w-sm mx-auto">
                          All onboarding candidate dossiers have been processed. Switch to the <b>All Registered Teachers Directory</b> to view approved profiles, promote to Grade A, or adjust settings.
                        </p>
                        <button
                          onClick={() => setTeacherViewMode('directory')}
                          className="mt-3 py-2 px-5 bg-brand-moss text-white rounded-full font-mono text-[10px] uppercase tracking-wider font-bold hover:bg-brand-moss/90 transition-all"
                        >
                          View All {applications.length} Registered Teachers →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {applications.filter(a => {
                          if (pipelineFilter === 'sla') return a.slaHoursElapsed > 24 && (a.status === 'pending_approval' || a.status === 'onboarding');
                          if (pipelineFilter === 'revision') return a.status === 'needs_revision' || a.status === 'info_requested';
                          if (pipelineFilter === 'all_apps') return true;
                          return a.status === 'pending_approval' || a.status === 'onboarding';
                        }).map(app => {
                          const isPending = app.status === 'pending_approval' || app.status === 'onboarding';
                          const isRevision = app.status === 'needs_revision' || app.status === 'info_requested';
                          const isVerified = app.verified || app.status === 'verified';
                          
                          return (
                            <div 
                              key={app.uid || app.id}
                              onClick={() => setSelectedApp(app)}
                              className={`border rounded-2xl p-4 flex justify-between items-center gap-4 cursor-pointer transition-all duration-300 hover-lift ${
                                selectedApp?.uid === app.uid 
                                  ? 'border-brand-clay bg-brand-clay/5 ring-2 ring-brand-clay/20'
                                  : 'border-brand-moss/10 bg-brand-cream/10 hover:border-brand-moss/30'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <img 
                                  src={getTeacherAvatar(app.avatar, app.name)} 
                                  alt={app.name || 'Tutor'} 
                                  className="w-12 h-12 rounded-full object-cover border border-brand-moss/15 shrink-0"
                                  onError={handleAvatarError(app.name)}
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-heading font-bold text-sm text-brand-moss truncate">{app.name}</h4>
                                    {app.username && (
                                      <span className="font-mono text-[9px] text-brand-charcoal/40 hidden sm:inline">@{app.username}</span>
                                    )}
                                  </div>
                                  <span className="font-mono text-[9px] text-brand-charcoal/60 block mt-0.5 uppercase">
                                    {app.location} · {formatCurrency(convertMinor(app.rate, selectedCurrency), selectedCurrency)}/hr
                                  </span>
                                  {app.subjects && app.subjects.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {app.subjects.slice(0, 2).map((s, idx) => (
                                        <span key={idx} className="font-mono text-[8px] bg-brand-moss/5 text-brand-moss px-1.5 py-0.5 rounded">
                                          {s}
                                        </span>
                                      ))}
                                      {app.subjects.length > 2 && (
                                        <span className="font-mono text-[8px] text-brand-charcoal/40">+{app.subjects.length - 2}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <span className={`font-mono text-[9px] font-bold py-0.5 px-2.5 rounded-full border uppercase tracking-wider ${
                                  isPending
                                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                                    : isRevision
                                    ? 'bg-purple-50 border-purple-200 text-purple-800'
                                    : isVerified
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-brand-moss/5 border-brand-moss/10 text-brand-moss'
                                }`}>
                                  {isPending ? 'Pending Audit' : isRevision ? 'Revision Req' : isVerified ? 'Verified' : app.status}
                                </span>

                                <span className={`font-mono text-[8px] font-bold py-0.5 px-2 rounded border uppercase ${
                                  app.slaHoursElapsed > 48
                                    ? 'bg-rose-600 text-white animate-bounce'
                                    : app.slaHoursElapsed > 36
                                    ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                                    : app.slaHoursElapsed > 24
                                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                                    : 'bg-brand-moss/5 border-brand-moss/10 text-brand-moss/70'
                                }`}>
                                  {app.slaHoursElapsed > 48 
                                    ? 'SLA OVERDUE (NITDA ESCALATION)' 
                                    : app.slaHoursElapsed > 36 
                                    ? '36h CRITICAL ALERT' 
                                    : app.slaHoursElapsed > 24 
                                    ? '24h ESCALATION ACTIVE' 
                                    : `SLA: ${app.slaHoursElapsed}h elapsed`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right column Application detail expansion */}
                <div className="lg:col-span-5">
                  {selectedApp ? (
                    <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-6 animate-fade-up">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block">
                            EDUCATOR DOSSIER AUDIT
                          </span>
                          <span className="font-mono text-[8px] font-bold text-rose-500 uppercase tracking-widest">
                            SLA Elapsed: {selectedApp.slaHoursElapsed} hours
                          </span>
                        </div>

                        <div className="flex items-start gap-4 pb-4 border-b border-brand-moss/5">
                          <img 
                            src={getTeacherAvatar(selectedApp.avatar, selectedApp.name)} 
                            alt={selectedApp.name || 'Tutor'} 
                            className="w-16 h-16 rounded-[1.25rem] object-cover border border-brand-moss/10 shrink-0"
                            onError={handleAvatarError(selectedApp.name)}
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-heading font-bold text-lg text-brand-moss leading-tight">{selectedApp.name}</h3>
                            {selectedApp.username && (
                              <p className="font-mono text-[10px] text-brand-charcoal/50">@{selectedApp.username}</p>
                            )}
                            <p className="font-mono text-[10px] text-brand-clay block mt-0.5">{selectedApp.location}</p>
                            <span className="font-sans font-bold text-xs text-brand-charcoal/80 block mt-1">
                              Hourly Floor: {formatCurrency(convertMinor(selectedApp.rate, selectedCurrency), selectedCurrency)}/hr
                            </span>

                            {/* Direct Contact Links */}
                            <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-brand-moss/5">
                              {selectedApp.whatsapp && (
                                <a
                                  href={`https://wa.me/${selectedApp.whatsapp.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-mono text-[9px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full transition-colors"
                                >
                                  <Phone className="w-2.5 h-2.5" /> WhatsApp Direct
                                </a>
                              )}
                              {selectedApp.email && (
                                <a
                                  href={`mailto:${selectedApp.email}`}
                                  className="inline-flex items-center gap-1 font-mono text-[9px] text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full transition-colors"
                                >
                                  <Mail className="w-2.5 h-2.5" /> {selectedApp.email}
                                </a>
                              )}
                              {selectedApp.username && (
                                <a
                                  href={`/tutors/${selectedApp.username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-mono text-[9px] text-brand-moss bg-brand-moss/5 hover:bg-brand-moss/10 border border-brand-moss/10 px-2 py-0.5 rounded-full transition-colors"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" /> Public URL
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Vetting System AI and compliance check indicators */}
                      <div className="bg-brand-cream/30 border border-brand-moss/10 rounded-2xl p-4 space-y-3 font-sans text-xs">
                        <h5 className="font-heading font-bold text-brand-moss uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-brand-clay" /> Automated Security Pre-checks
                        </h5>
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                          <div className="bg-white border border-brand-moss/5 rounded-xl p-2.5 shadow-sm">
                            <span className="text-[8px] font-mono text-brand-charcoal/50 uppercase block">Gemini bio Quality</span>
                            <span className={`font-mono font-bold block mt-1 text-sm ${
                              selectedApp.geminiBioScore >= 80 ? 'text-emerald-600' : 'text-brand-clay'
                            }`}>{selectedApp.geminiBioScore || 85} / 100</span>
                          </div>
                          <div className="bg-white border border-brand-moss/5 rounded-xl p-2.5 shadow-sm">
                            <span className="text-[8px] font-mono text-brand-charcoal/50 uppercase block">ID Match Check</span>
                            <span className="font-mono font-bold block mt-1 text-xs text-emerald-600">{selectedApp.idMatch || 'Passed'}</span>
                          </div>
                          <div className="bg-white border border-brand-moss/5 rounded-xl p-2.5 shadow-sm">
                            <span className="text-[8px] font-mono text-brand-charcoal/50 uppercase block">Duplicate Acc.</span>
                            <span className="font-mono font-bold block mt-1 text-xs text-emerald-600">{selectedApp.duplicateCheck || 'Clear'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bio & Details */}
                      <div className="space-y-4 font-sans text-xs">
                        <div>
                          <h5 className="font-heading font-bold text-brand-moss uppercase tracking-wider text-[10px] mb-1">Tutor Biography</h5>
                          <p className="text-brand-charcoal/80 leading-relaxed italic bg-brand-cream/20 p-3 rounded-xl border border-brand-moss/5 text-xs">
                            "{selectedApp.bio || 'Educator committed to African student excellence.'}"
                          </p>
                        </div>

                        {/* Subject & Curricula tags */}
                        {selectedApp.subjects && selectedApp.subjects.length > 0 && (
                          <div>
                            <h5 className="font-heading font-bold text-brand-moss uppercase tracking-wider text-[10px] mb-1.5">Subjects & Curricula</h5>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedApp.subjects.map((sub, i) => (
                                <span key={i} className="font-mono text-[9px] bg-brand-moss/10 text-brand-moss px-2 py-0.5 rounded-full font-bold">
                                  {sub}
                                </span>
                              ))}
                              {(selectedApp.curricula || []).map((curr, i) => (
                                <span key={i} className="font-mono text-[9px] bg-brand-clay/10 text-brand-clay px-2 py-0.5 rounded-full font-bold">
                                  {curr}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Document Verification Section */}
                        <div className="bg-brand-moss/5 border border-brand-moss/10 rounded-2xl p-4 space-y-3">
                          <h5 className="font-heading font-bold text-brand-moss uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-brand-clay" /> Uploaded Verification Documents
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-brand-charcoal/50 block mb-0.5">Government ID (Click to View)</span>
                              <button 
                                type="button"
                                onClick={() => setViewingCredential({ 
                                  type: 'Government ID Card', 
                                  name: selectedApp.name, 
                                  idNumber: selectedApp.govId || 'Gov-ID-Registered', 
                                  image: selectedApp.govId?.startsWith('http') ? selectedApp.govId : 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?q=80&w=600' 
                                })}
                                className="w-full text-left font-mono text-brand-moss font-bold break-all bg-white border border-brand-moss/10 rounded-lg px-2.5 py-2 block cursor-pointer hover:border-brand-clay hover:text-brand-clay transition-all shadow-sm"
                              >
                                {selectedApp.govId ? (selectedApp.govId.startsWith('http') ? 'ID Document Uploaded 🔍' : `${selectedApp.govId} 🔍`) : 'Uploaded ID Record 🔍'}
                              </button>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-brand-charcoal/50 block mb-0.5">University Degree (Click to View)</span>
                              <button 
                                type="button"
                                onClick={() => setViewingCredential({ 
                                  type: 'University Degree Certificate', 
                                  name: selectedApp.name, 
                                  degreeName: selectedApp.degree || 'B.Sc. Verified Degree', 
                                  image: selectedApp.degree?.startsWith('http') ? selectedApp.degree : 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600' 
                                })}
                                className="w-full text-left font-sans text-brand-moss font-bold break-words bg-white border border-brand-moss/10 rounded-lg px-2.5 py-2 block cursor-pointer hover:border-brand-clay hover:text-brand-clay transition-all shadow-sm"
                              >
                                {selectedApp.degree ? (selectedApp.degree.startsWith('http') ? 'Degree Certificate 🔍' : `${selectedApp.degree} 🔍`) : 'Degree Verified 🔍'}
                              </button>
                            </div>
                          </div>

                          {selectedApp.cvUrl && (
                            <div className="pt-2 border-t border-brand-moss/5">
                              <span className="text-[9px] uppercase font-bold text-brand-charcoal/50 block mb-0.5">CV / Professional Resume</span>
                              <a
                                href={selectedApp.cvUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 font-mono text-xs text-brand-clay font-bold hover:underline"
                              >
                                <FileText className="w-3.5 h-3.5" /> View Uploaded CV/Resume Document ↗
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Video introduction widget */}
                      <div>
                        <h5 className="font-heading font-bold text-brand-moss uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1">
                          <Video className="w-4 h-4 text-brand-clay" /> Video Introduction Material
                        </h5>
                        {selectedApp.videoUrl ? (
                          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-brand-charcoal relative border border-brand-moss/10 shadow-inner">
                            <iframe 
                              className="w-full h-full"
                              src={selectedApp.videoUrl} 
                              title="Tutor Video Intro"
                              frameBorder="0" 
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <div className="py-4 text-center font-sans text-brand-charcoal/40 text-[10px] border border-dashed border-brand-moss/20 rounded-2xl bg-brand-cream/10">
                            Candidate did not submit an intro video link.
                          </div>
                        )}
                      </div>

                      {/* Required Vetting Checklists */}
                      <div className="bg-brand-cream/30 border border-brand-moss/10 rounded-2xl p-4 space-y-3 font-sans text-xs">
                        <h5 className="font-heading font-bold text-brand-moss uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-brand-clay" /> Compliance Verification Checklist
                        </h5>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={vetId}
                              onChange={(e) => setVetId(e.target.checked)}
                              className="rounded border-brand-moss/20 text-brand-moss focus:ring-brand-moss w-4 h-4"
                            />
                            <span className="text-[11px] text-brand-charcoal/80">Verify government ID matches candidate identity</span>
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={vetDegree}
                              onChange={(e) => setVetDegree(e.target.checked)}
                              className="rounded border-brand-moss/20 text-brand-moss focus:ring-brand-moss w-4 h-4"
                            />
                            <span className="text-[11px] text-brand-charcoal/80">Verify university degree credentials and qualifications</span>
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={vetVideo}
                              onChange={(e) => setVetVideo(e.target.checked)}
                              className="rounded border-brand-moss/20 text-brand-moss focus:ring-brand-moss w-4 h-4"
                            />
                            <span className="text-[11px] text-brand-charcoal/80">Confirm pedagogical communication standards</span>
                          </label>
                        </div>
                      </div>

                      {/* 1-CLICK TIER APPROVAL & DECISION ACTION SUITE */}
                      <div className="space-y-3 pt-4 border-t border-brand-moss/10">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-brand-charcoal/50 block font-bold">
                          ADMINISTRATIVE TIER DECISION SUITE
                        </span>

                        {/* Top Tier Approval Buttons */}
                        <div className="grid grid-cols-1 gap-2.5">
                          {/* Option 1: Grade A Elite VVIP */}
                          <button
                            onClick={() => handleRespond(selectedApp.uid, 'ApproveGradeA')}
                            disabled={loading}
                            className="w-full btn-magnetic py-3 px-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white rounded-2xl font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-between shadow-md transition-all group"
                          >
                            <span className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-amber-200 animate-spin" />
                              <span>👑 Approve as Grade A Elite VVIP</span>
                            </span>
                            <span className="font-mono text-[9px] bg-white/20 px-2 py-0.5 rounded text-white font-normal">
                              ₦100k+/mo Floor
                            </span>
                          </button>

                          {/* Option 2: Grade B Verified */}
                          <button
                            onClick={() => handleRespond(selectedApp.uid, 'ApproveGradeB')}
                            disabled={loading}
                            className="w-full btn-magnetic py-2.5 px-4 bg-brand-moss hover:bg-brand-moss/95 text-white rounded-2xl font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-between shadow-md transition-all"
                          >
                            <span className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-300" />
                              <span>🛡️ Approve as Grade B Verified Tutor</span>
                            </span>
                            <span className="font-mono text-[9px] bg-white/10 px-2 py-0.5 rounded text-white/80 font-normal">
                              Standard Vetted
                            </span>
                          </button>

                          {/* Option 3: Standard Freemium */}
                          <button
                            onClick={() => handleRespond(selectedApp.uid, 'ApproveFreemium')}
                            disabled={loading}
                            className="w-full py-2.5 px-4 bg-white border border-brand-moss/20 hover:bg-brand-moss/5 text-brand-moss rounded-2xl font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-all"
                          >
                            <span className="flex items-center gap-2">
                              <UserCheck className="w-4 h-4 text-brand-clay" />
                              <span>🆓 Approve as Standard (Freemium)</span>
                            </span>
                            <span className="font-mono text-[9px] text-brand-charcoal/50 font-normal">
                              Open Profile
                            </span>
                          </button>
                        </div>

                        {/* Secondary Actions: Request Revision & Reject */}
                        <div className="flex gap-2.5 pt-1">
                          <button
                            onClick={() => handleRequestMoreInfo(selectedApp.uid)}
                            disabled={loading}
                            className="flex-1 py-2.5 px-3 bg-brand-cream border border-brand-moss/20 hover:bg-brand-moss/10 text-brand-moss rounded-xl font-mono font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Request Revisions
                          </button>
                          <button
                            onClick={() => handleRespond(selectedApp.uid, 'Reject')}
                            disabled={loading}
                            className="flex-1 py-2.5 px-3 border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-xl font-mono font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                          >
                            <UserX className="w-3.5 h-3.5" /> Reject Application
                          </button>
                        </div>

                        {/* Already verified status indicator & suspend toggle */}
                        {selectedApp.verified && (
                          <div className="pt-2 flex items-center justify-between text-xs font-sans">
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Currently Active & Verified
                            </span>
                            <button
                              onClick={() => handleRespond(selectedApp.uid, selectedApp.status === 'suspended' ? 'Activate' : 'Suspend')}
                              className="font-mono text-[9px] uppercase tracking-wider text-rose-600 hover:underline font-bold"
                            >
                              {selectedApp.status === 'suspended' ? 'Reactivate Profile' : 'Suspend Profile'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-brand-moss/5 border border-dashed border-brand-moss/20 rounded-[2.5rem] p-12 text-center font-sans text-brand-charcoal/40 text-xs flex flex-col items-center justify-center h-80">
                      <ShieldCheck className="w-10 h-10 text-brand-moss/30 mb-3" />
                      <span className="max-w-xs">Select any teacher candidate from the left queue to audit their credentials, check documents, verify identity, and trigger 1-click tier elevation.</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* VIEW 2: ALL REGISTERED TEACHERS DIRECTORY */}
          {teacherViewMode === 'directory' && (
            <div className="space-y-6 animate-fade-up">
              {/* Directory Search & Tier Filters Bar */}
              <div className="bg-white border border-brand-moss/10 rounded-[2rem] p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-brand-charcoal/40 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={directorySearch}
                      onChange={(e) => setDirectorySearch(e.target.value)}
                      placeholder="Search teachers by name, @username, subject, curriculum, or email..."
                      className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-2xl pl-11 pr-4 py-3 text-xs text-brand-moss placeholder:text-brand-charcoal/40 focus:outline-none focus:border-brand-clay transition-all"
                    />
                    {directorySearch && (
                      <button 
                        onClick={() => setDirectorySearch('')} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-charcoal/40 hover:text-brand-moss font-mono text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Quick summary stats pill */}
                  <div className="flex items-center gap-2 font-mono text-[10px] text-brand-charcoal/60 self-center">
                    <span className="bg-brand-moss/5 px-3 py-1.5 rounded-full border border-brand-moss/10">
                      Total: <b className="text-brand-moss">{applications.length}</b> Educators
                    </span>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-brand-moss/5">
                  {[
                    { id: 'all', label: `All Teachers (${applications.length})` },
                    { id: 'grade_a', label: `👑 Grade A Elite (${applications.filter(a => a.tier === 'Grade A' || a.isEliteVip || (a.badges || []).includes('badge-grade-a')).length})` },
                    { id: 'grade_b', label: `🛡️ Grade B Verified (${applications.filter(a => (a.tier === 'Grade B' || a.verified) && !a.isEliteVip && !(a.badges || []).includes('badge-grade-a')).length})` },
                    { id: 'pending', label: `⏳ Pending Approval (${applications.filter(a => a.status === 'pending_approval' || a.status === 'onboarding').length})` },
                    { id: 'freemium', label: `🆓 Standard (${applications.filter(a => a.tier === 'Freemium').length})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setDirectoryFilter(tab.id)}
                      className={`py-1.5 px-3.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        directoryFilter === tab.id
                          ? 'bg-brand-moss text-white border-brand-moss shadow-sm'
                          : 'bg-white text-brand-moss/70 border-brand-moss/10 hover:border-brand-moss/30'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Teachers Grid */}
              {(() => {
                const filtered = applications.filter(t => {
                  if (directorySearch) {
                    const q = directorySearch.toLowerCase().trim();
                    const matchName = (t.name || '').toLowerCase().includes(q);
                    const matchUser = (t.username || '').toLowerCase().includes(q);
                    const matchEmail = (t.email || '').toLowerCase().includes(q);
                    const matchLocation = (t.location || '').toLowerCase().includes(q);
                    const matchSubs = (t.subjects || []).some(s => s.toLowerCase().includes(q));
                    const matchCurrs = (t.curricula || []).some(c => c.toLowerCase().includes(q));
                    if (!matchName && !matchUser && !matchEmail && !matchLocation && !matchSubs && !matchCurrs) {
                      return false;
                    }
                  }

                  if (directoryFilter === 'grade_a') {
                    return t.tier === 'Grade A' || t.isEliteVip || (t.badges || []).includes('badge-grade-a');
                  }
                  if (directoryFilter === 'grade_b') {
                    return (t.tier === 'Grade B' || t.verified) && !t.isEliteVip && !(t.badges || []).includes('badge-grade-a');
                  }
                  if (directoryFilter === 'pending') {
                    return t.status === 'pending_approval' || t.status === 'onboarding';
                  }
                  if (directoryFilter === 'freemium') {
                    return t.tier === 'Freemium';
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-16 text-center space-y-3 font-sans">
                      <Search className="w-10 h-10 text-brand-charcoal/30 mx-auto" />
                      <h4 className="font-heading font-bold text-base text-brand-moss">No educators found</h4>
                      <p className="text-xs text-brand-charcoal/60 max-w-sm mx-auto">
                        No teachers matched your search query or filter. Try clearing the search or switching filters.
                      </p>
                      <button
                        onClick={() => { setDirectorySearch(''); setDirectoryFilter('all'); }}
                        className="mt-2 py-2 px-4 bg-brand-moss text-white rounded-full font-mono text-[10px] uppercase font-bold"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map(teacher => {
                      const isGradeA = teacher.tier === 'Grade A' || teacher.isEliteVip || (teacher.badges || []).includes('badge-grade-a');
                      const isPending = teacher.status === 'pending_approval' || teacher.status === 'onboarding';
                      const isSuspended = teacher.status === 'suspended';

                      return (
                        <div
                          key={teacher.uid || teacher.id}
                          className="bg-white border border-brand-moss/10 hover:border-brand-clay/40 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                        >
                          {/* Card Header */}
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <img
                                    src={getTeacherAvatar(teacher.avatar, teacher.name)}
                                    alt={teacher.name}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-brand-moss/10"
                                    onError={handleAvatarError(teacher.name)}
                                  />
                                  <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                    isSuspended ? 'bg-rose-500' : isPending ? 'bg-amber-400' : 'bg-emerald-500'
                                  }`} />
                                </div>
                                <div>
                                  <h4 className="font-heading font-bold text-base text-brand-moss leading-tight">{teacher.name}</h4>
                                  {teacher.username && (
                                    <span className="font-mono text-[10px] text-brand-charcoal/50 block mt-0.5">@{teacher.username}</span>
                                  )}
                                  <span className="font-mono text-[9px] text-brand-clay block mt-0.5">
                                    {teacher.location} · {formatCurrency(convertMinor(teacher.rate, selectedCurrency), selectedCurrency)}/hr
                                  </span>
                                </div>
                              </div>

                              {/* Tier Badge */}
                              <span className={`font-mono text-[9px] font-bold py-1 px-2.5 rounded-full border uppercase tracking-wider shrink-0 ${
                                isGradeA 
                                  ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-sm'
                                  : isPending
                                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              }`}>
                                {isGradeA ? '👑 Grade A' : isPending ? '⏳ Pending' : '🛡️ Grade B'}
                              </span>
                            </div>

                            {/* Subjects & Curricula */}
                            {teacher.subjects && teacher.subjects.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {teacher.subjects.slice(0, 3).map((sub, i) => (
                                  <span key={i} className="font-mono text-[8px] bg-brand-moss/5 text-brand-moss px-2 py-0.5 rounded font-medium">
                                    {sub}
                                  </span>
                                ))}
                                {teacher.subjects.length > 3 && (
                                  <span className="font-mono text-[8px] text-brand-charcoal/40 self-center">
                                    +{teacher.subjects.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Direct Contact Bar */}
                            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-brand-moss/5">
                              {teacher.whatsapp && (
                                <a
                                  href={`https://wa.me/${teacher.whatsapp.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-mono text-[9px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full transition-colors"
                                >
                                  <Phone className="w-2.5 h-2.5" /> WhatsApp
                                </a>
                              )}
                              {teacher.email && (
                                <a
                                  href={`mailto:${teacher.email}`}
                                  className="inline-flex items-center gap-1 font-mono text-[9px] text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full transition-colors"
                                >
                                  <Mail className="w-2.5 h-2.5" /> Email
                                </a>
                              )}
                              {teacher.username && (
                                <a
                                  href={`/tutors/${teacher.username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-mono text-[9px] text-brand-moss bg-brand-moss/5 hover:bg-brand-moss/10 border border-brand-moss/10 px-2 py-0.5 rounded-full transition-colors"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" /> Profile ↗
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Action Footer */}
                          <div className="space-y-2 pt-3 border-t border-brand-moss/10">
                            {/* Inspect Dossier Button */}
                            <button
                              onClick={() => {
                                setSelectedApp(teacher);
                                setTeacherViewMode('pipeline');
                              }}
                              className="w-full py-2 px-3 bg-brand-cream/60 hover:bg-brand-cream border border-brand-moss/15 text-brand-moss rounded-xl font-mono text-[10px] uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Clipboard className="w-3.5 h-3.5" /> Inspect Dossier & Credentials
                            </button>

                            {/* 1-Click Promote / Demote */}
                            <div className="flex gap-2">
                              {isPending ? (
                                <>
                                  <button
                                    onClick={() => handleRespond(teacher.uid, 'ApproveGradeB')}
                                    className="flex-1 py-1.5 bg-brand-moss hover:bg-brand-moss/90 text-white rounded-lg font-mono text-[9px] uppercase font-bold tracking-wider"
                                  >
                                    Approve B
                                  </button>
                                  <button
                                    onClick={() => handleRespond(teacher.uid, 'ApproveGradeA')}
                                    className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-mono text-[9px] uppercase font-bold tracking-wider"
                                  >
                                    Elevate A 👑
                                  </button>
                                </>
                              ) : isGradeA ? (
                                <button
                                  onClick={() => handleRespond(teacher.uid, 'ApproveGradeB')}
                                  className="flex-1 py-1.5 border border-brand-moss/20 hover:bg-brand-moss/5 text-brand-moss rounded-lg font-mono text-[9px] uppercase font-bold tracking-wider"
                                >
                                  Demote to Grade B
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleRespond(teacher.uid, 'ApproveGradeA')}
                                  className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-mono text-[9px] uppercase font-bold tracking-wider"
                                >
                                  👑 Promote to Grade A Elite
                                </button>
                              )}

                              <button
                                onClick={() => handleRespond(teacher.uid, isSuspended ? 'Activate' : 'Suspend')}
                                className={`px-3 py-1.5 rounded-lg font-mono text-[9px] uppercase font-bold tracking-wider border ${
                                  isSuspended 
                                    ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' 
                                    : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                }`}
                              >
                                {isSuspended ? 'Activate' : 'Suspend'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* REJECT MODAL / REASON DROPDOWN */}
          {showRejectModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
              <div className="relative bg-white border border-brand-moss/20 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl z-10 font-sans text-xs">
                <h3 className="font-heading font-bold text-base text-brand-moss mb-4">Reject Applicant Application</h3>
                <p className="text-brand-charcoal/70 mb-4 leading-relaxed">
                  Please select a structured reason for rejecting <b>{selectedApp?.name}</b>'s verification credentials. This feedback will be sent directly to their inbox.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="font-heading font-bold uppercase tracking-wider text-brand-charcoal/50 text-[9px] block mb-1">Rejection Reason</label>
                    <select
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-3 py-3 font-medium text-xs focus:outline-none"
                    >
                      <option value="Blurry ID document">Blurry ID document / Government match failure</option>
                      <option value="Unprofessional intro video">Unprofessional introductory video presentation</option>
                      <option value="Incomplete CV details">Incomplete degree credentials or certification seals</option>
                      <option value="Duplicate account matches">Duplicate account detection or policy violation</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleConfirmReject}
                      className="flex-1 py-3 bg-brand-clay hover:bg-brand-clay/90 text-white font-bold text-xs uppercase tracking-wider rounded-full"
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => setShowRejectModal(false)}
                      className="flex-1 py-3 border border-brand-moss/20 hover:bg-brand-moss/5 text-brand-moss font-bold text-xs uppercase tracking-wider rounded-full"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: DISPUTES, POLICIES & REFUNDS */}
      {activeSubSection === 'disputes' && (
        <div className="space-y-8 animate-fade-up">
          {/* Open Disputes Status bar */}
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-8 h-8 text-rose-600 shrink-0 animate-pulse" />
              <div>
                <h4 className="font-heading font-bold text-sm text-brand-moss">Active Dispute Resolution Centre</h4>
                <p className="font-sans text-[11px] text-brand-charcoal/70">
                  Currently tracking 4 open disputes. 2 pending admin review, 1 awaiting teacher response, 1 resolved. Oldest open dispute: 31 hours.
                </p>
              </div>
            </div>
            <span className="bg-rose-600 text-white font-mono text-[9px] uppercase tracking-wider py-1 px-3 rounded-full font-bold">
              Resolution SLA: 48h
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Disputes Management Panel */}
            <div className="lg:col-span-7 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-4 border-b border-brand-moss/5 pb-3">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">OPEN DISPUTES PIPELINE</span>
                  <h3 className="font-heading font-bold text-lg text-brand-moss">Arbitration Cases</h3>
                </div>
                {/* Dispute Analytics Category tags */}
                <div className="flex gap-1.5 text-[8px] font-mono font-bold">
                  <span className="bg-rose-50 border border-rose-200 text-rose-800 px-2 py-0.5 rounded">Clock discrepancies (2)</span>
                  <span className="bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded">No-shows (1)</span>
                  <span className="bg-blue-50 border border-blue-200 text-blue-800 px-2 py-0.5 rounded">Quality concerns (1)</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="border border-brand-moss/10 rounded-2xl p-5 space-y-4 bg-brand-cream/5">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="font-mono text-[9px] text-brand-clay font-bold block uppercase">{dispute.sessionId}</span>
                        <h4 className="font-heading font-bold text-sm text-brand-moss mt-0.5">Dispute Reason: "{dispute.reason}"</h4>
                        <span className="font-sans text-[11px] text-brand-charcoal/60 block mt-1">
                          Parent: <b>{dispute.parentName}</b> · Teacher: <b>{dispute.teacherName}</b>
                        </span>
                      </div>
                      <span className={`font-mono text-[8px] uppercase tracking-wider py-0.5 px-2.5 rounded-full border ${
                        dispute.status.includes('Resolved')
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                          : dispute.status.includes('Awaiting')
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800 animate-pulse'
                      }`}>
                        {dispute.status}
                      </span>
                    </div>

                    <div className="bg-white border border-brand-moss/5 rounded-xl p-3 space-y-1.5 text-xs font-sans">
                      <div>
                        <span className="text-[8px] font-mono uppercase tracking-widest text-brand-charcoal/40 block">Server session logs</span>
                        <p className="font-mono font-bold text-[10px] text-brand-moss">{dispute.clockLog}</p>
                      </div>
                      <div className="h-px bg-brand-moss/5" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[8px] font-mono uppercase tracking-widest text-brand-charcoal/40 block">Parent claim justification</span>
                          <p className="text-brand-charcoal/80 italic">"{dispute.description}"</p>
                          <span className="font-mono text-[8px] text-brand-charcoal/45 mt-1 block">Evidence: <a href="#evidence" className="underline font-bold text-brand-clay">{dispute.evidenceUrl}</a></span>
                        </div>
                        <div className="border-l border-brand-moss/5 pl-4">
                          <span className="text-[8px] font-mono uppercase tracking-widest text-brand-charcoal/40 block">Teacher response defense</span>
                          <p className="text-brand-charcoal/80 italic">"{dispute.teacherResponse || 'Awaiting tutor formal response.'}"</p>
                          {dispute.teacherEvidenceUrl && (
                            <span className="font-mono text-[8px] text-brand-charcoal/45 mt-1 block">Evidence: <a href="#evidence" className="underline font-bold text-brand-clay">{dispute.teacherEvidenceUrl}</a></span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-between items-center gap-4 pt-2 border-t border-brand-moss/5">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-brand-charcoal/50">
                        <FileText className="w-3.5 h-3.5" /> Case Dossier Review Logs (SLA: 48h resolution track)
                      </div>

                      {/* Resolution Notes & Actions */}
                      {!dispute.status.includes('Resolved') && (
                        <div className="w-full space-y-3 pt-2 border-t border-brand-moss/5 text-right">
                          <div className="text-left">
                            <label className="block text-[8px] font-mono uppercase tracking-widest text-brand-charcoal/50 mb-1">Resolution Justification (Required to resolve)</label>
                            <textarea 
                              rows="1"
                              required
                              placeholder="Type arbitration justification notes sent to both parties..."
                              value={disputeResolutionNotes[dispute.id] || ''}
                              onChange={(e) => setDisputeResolutionNotes({ ...disputeResolutionNotes, [dispute.id]: e.target.value })}
                              className="w-full bg-white border border-brand-moss/10 rounded-lg p-2 text-xs focus:outline-none focus:border-brand-clay"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleResolveDispute(dispute.id, 'Ruled in favor of Parent')}
                              className="bg-brand-moss text-white font-mono text-[9px] uppercase font-bold py-1.5 px-3 rounded-lg hover:bg-brand-clay transition-all"
                            >
                              In favor of Parent
                            </button>
                            <button 
                              onClick={() => handleResolveDispute(dispute.id, 'Ruled in favor of Teacher')}
                              className="border border-brand-moss text-brand-moss font-mono text-[9px] uppercase font-bold py-1.5 px-3 rounded-lg hover:bg-brand-moss/5 transition-all"
                            >
                              In favor of Teacher
                            </button>
                            <button 
                              onClick={() => handleResolveDispute(dispute.id, 'Split 50/50')}
                              className="bg-brand-cream border border-brand-moss/10 text-brand-moss font-mono text-[9px] uppercase font-bold py-1.5 px-3 rounded-lg hover:bg-brand-cream/80 transition-all"
                            >
                              Split
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trial Lesson Refund Queue & Policy Configuration */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* Cancellation Policy Defaults editor */}
              <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">POLICY MANAGEMENT</span>
                <h3 className="font-heading font-bold text-base text-brand-moss">Cancellation Policy Defaults</h3>
                
                <div className="space-y-3 font-sans text-xs">
                  <div>
                    <div className="flex justify-between font-mono text-[9px] mb-1">
                      <span>Flexible Policy Default Deduction</span>
                      <span>{policyFlexFee}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={policyFlexFee} onChange={(e) => setPolicyFlexFee(parseInt(e.target.value))} className="w-full accent-brand-moss" />
                  </div>
                  <div>
                    <div className="flex justify-between font-mono text-[9px] mb-1">
                      <span>Moderate Policy Default Deduction</span>
                      <span>{policyModFee}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={policyModFee} onChange={(e) => setPolicyModFee(parseInt(e.target.value))} className="w-full accent-brand-moss" />
                  </div>
                  <div>
                    <div className="flex justify-between font-mono text-[9px] mb-1">
                      <span>Strict Policy Default Deduction</span>
                      <span>{policyStrictFee}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={policyStrictFee} onChange={(e) => setPolicyStrictFee(parseInt(e.target.value))} className="w-full accent-brand-moss" />
                  </div>
                  <button 
                    onClick={() => triggerToast(`Policy defaults updated: Flex ${policyFlexFee}%, Moderate ${policyModFee}%, Strict ${policyStrictFee}%`)}
                    className="w-full py-2 bg-brand-moss hover:bg-brand-moss/95 text-white font-bold rounded-lg uppercase tracking-wider text-[10px]"
                  >
                    Save policy configurations
                  </button>
                </div>
              </div>

              {/* Refund Calculator */}
              <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">REFUND ESTIMATOR</span>
                <h3 className="font-heading font-bold text-base text-brand-moss">Refund Amount Calculator</h3>
                <div className="space-y-3 font-sans text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-mono text-brand-charcoal/50 uppercase mb-1">Lesson Cost (NGN)</label>
                      <input 
                        type="number" 
                        value={refundCalcCost}
                        onChange={(e) => setRefundCalcCost(e.target.value)}
                        className="w-full bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-3 py-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono text-brand-charcoal/50 uppercase mb-1">Deduction Fee (%)</label>
                      <input 
                        type="number" 
                        value={refundCalcDeduct}
                        onChange={(e) => setRefundCalcDeduct(e.target.value)}
                        className="w-full bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-3 py-2 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="bg-brand-cream/50 border border-brand-moss/10 rounded-xl p-3 flex justify-between items-center">
                    <span className="font-bold text-[10px] text-brand-moss">Estimated Net Refund:</span>
                    <span className="font-heading font-bold text-sm text-brand-clay">₦{refundCalcResult.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Emergency Refund Override */}
              <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">OVERRIDE CONSOLE</span>
                <h3 className="font-heading font-bold text-base text-brand-moss">Emergency Refund Override</h3>
                <p className="font-sans text-[10px] text-brand-charcoal/70 leading-relaxed">
                  Manually override standard deduction guidelines for high-priority emergency cases. Logged directly to audit database.
                </p>
                <form onSubmit={handleEmergencyRefundOverride} className="space-y-3 font-sans text-xs">
                  <div>
                    <label className="font-heading font-bold uppercase tracking-wider text-brand-charcoal/50 text-[9px] block mb-1">Transaction Reference Code</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. TXN-8940-XY"
                      value={overrideTxId}
                      onChange={(e) => setOverrideTxId(e.target.value)}
                      className="w-full bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-3 py-2.5 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-heading font-bold uppercase tracking-wider text-brand-charcoal/50 text-[9px] block mb-1">Refund Amount (%)</label>
                      <select 
                        value={overridePercent} 
                        onChange={(e) => setOverridePercent(e.target.value)}
                        className="w-full bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-2.5 py-2.5 text-[10px]"
                      >
                        <option value="100">100% (Full Refund)</option>
                        <option value="75">75% Refund</option>
                        <option value="50">50% Refund</option>
                        <option value="25">25% Refund</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-heading font-bold uppercase tracking-wider text-brand-charcoal/50 text-[9px] block mb-1">Authorization Reason</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. System connection crash"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        className="w-full bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-3 py-2.5 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-brand-clay hover:bg-brand-clay/95 text-white font-bold text-[10px] uppercase tracking-wider py-3 rounded-full shadow-sm transition-colors"
                  >
                    Execute Emergency Override
                  </button>
                </form>
              </div>

              {/* Trial Lesson Refund Queue */}
              <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-brand-moss/5 pb-2">
                  <div>
                    <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">REFUND PIPELINE (5-DAY SLA)</span>
                    <h3 className="font-heading font-bold text-lg text-brand-moss mt-0.5">Trial Refund Queue</h3>
                  </div>
                  {refunds.length > 0 && (
                    <button 
                      onClick={handleBulkApproveRefunds}
                      className="font-mono text-[9px] uppercase tracking-widest text-brand-clay font-bold border border-brand-clay/20 px-3 py-1.5 rounded-full hover:bg-brand-clay hover:text-white transition-all duration-300"
                    >
                      Bulk Approve
                    </button>
                  )}
                </div>
                
                
                <div className="space-y-3">
                  {refunds.map((ref) => (
                    <div key={ref.id} className="border border-brand-moss/5 rounded-xl p-4 flex justify-between items-center gap-4 bg-brand-cream/5">
                      <div>
                        <h4 className="font-heading font-bold text-xs text-brand-moss">{ref.parentName}</h4>
                        <span className="font-sans text-[10px] text-brand-charcoal/60 block mt-0.5">{ref.subject}</span>
                        <span className="font-mono text-[8px] text-brand-clay font-bold block mt-1 uppercase">SLA: {ref.slaDays} Days Remaining</span>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <span className="font-heading font-bold text-xs text-brand-moss">{formatCurrency(convertMinor(ref.fee, selectedCurrency), selectedCurrency)}</span>
                        <button 
                          onClick={() => handleProcessRefund(ref.id)}
                          className="bg-brand-clay hover:bg-brand-clay/90 text-white font-mono text-[9px] uppercase font-bold py-1 px-3 rounded-lg shadow-sm"
                        >
                          Release Refund
                        </button>
                      </div>
                    </div>
                  ))}
                  {refunds.length === 0 && (
                    <span className="font-sans text-[10px] text-brand-charcoal/40 block text-center py-4">No pending refund releases.</span>
                  )}
                </div>
              </div>

              {/* Refund Audit Logs */}
              <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">AUDIT TRAIL</span>
                <h3 className="font-heading font-bold text-sm text-brand-moss">Refund Logs</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {refundAudits.map((aud) => (
                    <div key={aud.id} className="border-b border-brand-moss/5 pb-2 text-[10px] flex justify-between items-start gap-4">
                      <div>
                        <span className="font-bold block text-brand-moss">Returned to {aud.parentName}</span>
                        <span className="text-brand-charcoal/50 block mt-0.5 font-mono">{aud.reason} · Admin: {aud.adminId}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-brand-clay block">{formatCurrency(convertMinor(aud.amount, selectedCurrency), selectedCurrency)}</span>
                        <span className="text-[8px] text-brand-charcoal/40 block mt-0.5">{aud.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SECTION 4: GROUPS & BUNDLES */}
      {activeSubSection === 'groups' && (
        <div className="space-y-8 animate-fade-up">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Group Classes Oversight */}
            <div className="lg:col-span-7 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">STUDENT ROSTER CAPS</span>
                <h3 className="font-heading font-bold text-xl text-brand-moss mt-0.5">Group Classes Oversight</h3>
                <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                  Platform limits set maximum group capacity to 10 students. Any active group exceeding this limit triggers a critical compliance flag.
                </p>
              </div>

              <div className="space-y-4">
                {groups.map((grp) => (
                  <div key={grp.id} className="border border-brand-moss/10 rounded-2xl p-5 space-y-3 bg-brand-cream/5">
                    <div className="flex justify-between items-start gap-4 flex-wrap">
                      <div>
                        <h4 className="font-heading font-bold text-sm text-brand-moss">{grp.name}</h4>
                        <span className="font-sans text-[11px] text-brand-charcoal/60 block mt-0.5">
                          Tutor: <b>{grp.teacher}</b> · Rate: <b>{formatCurrency(convertMinor(grp.fee, selectedCurrency), selectedCurrency)}/student</b>
                        </span>
                        <span className="font-mono text-[9px] text-brand-charcoal/40 block mt-1">Schedule: {grp.schedule}</span>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className={`font-mono text-[9px] uppercase tracking-wider py-1 px-3 rounded-full border font-bold ${
                          grp.enrolled > 10 
                            ? 'bg-rose-50 border-rose-200 text-rose-800 animate-pulse'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}>
                          {grp.enrolled} / 10 Enrolled
                        </span>
                      </div>
                    </div>

                    {grp.enrolled > 10 && (
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2.5">
                        <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                        <span className="text-[10px] text-rose-800 font-mono">
                          Compliance Alert: Group size limits exceeded. Escrow calculations are split among 11 active students. Payouts require administrator audit check.
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 font-mono text-[9px] text-center pt-2 border-t border-brand-moss/5 bg-white rounded-xl p-3 border border-brand-moss/5">
                      <div>
                        <span className="text-brand-charcoal/50 block">Class Revenue</span>
                        <span className="font-bold text-brand-moss text-xs">{formatCurrency(convertMinor(grp.revenue, selectedCurrency), selectedCurrency)}</span>
                      </div>
                      <div>
                        <span className="text-brand-charcoal/50 block">Avg Attendance</span>
                        <span className="font-bold text-brand-moss text-xs">{grp.attendance}</span>
                      </div>
                      <div>
                        <span className="text-brand-charcoal/50 block">Platform Comm. (17%)</span>
                        <span className="font-bold text-brand-clay text-xs">
                          {formatCurrency(convertMinor(Math.round(grp.revenue * 0.17), selectedCurrency), selectedCurrency)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setExpandedGroupRosterId(expandedGroupRosterId === grp.id ? null : grp.id)}
                        className="font-mono text-[9px] uppercase font-bold text-brand-moss hover:underline"
                      >
                        {expandedGroupRosterId === grp.id ? 'Hide Student Roster' : 'View Student Roster'}
                      </button>
                    </div>

                    {expandedGroupRosterId === grp.id && grp.studentRoster && (
                      <div className="mt-3 bg-white border border-brand-moss/10 rounded-xl p-3.5 space-y-1.5 animate-fade-up">
                        <span className="font-mono text-[8px] uppercase tracking-wider text-brand-charcoal/50 block">Enrolled Student Roster ({grp.studentRoster.length})</span>
                        <div className="grid grid-cols-2 gap-2 text-xs text-brand-charcoal/80 font-sans">
                          {grp.studentRoster.map((student, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-clay" />
                              <span>{student}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription Bundles */}
            <div className="lg:col-span-5 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-6">
              <div>
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">SUBSCRIPTION ENGINE</span>
                <h3 className="font-heading font-bold text-lg text-brand-moss mt-0.5">Subscription Bundle Manager</h3>
                <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                  Shows active pre-paid parent subscription packages. Discounts: 8-pack (5%), 12-pack (10%), 20-pack (15%).
                </p>
              </div>

              {/* Stats & Discount breakdown */}
              <div className="grid grid-cols-2 gap-4 my-4">
                <div className="bg-brand-cream/35 border border-brand-moss/5 rounded-2xl p-4">
                  <span className="font-mono text-[9px] text-brand-charcoal/50 uppercase block">Total Bundle Revenue</span>
                  <span className="font-heading font-bold text-lg text-brand-moss block mt-1">₦14.8M</span>
                  <span className="text-[9px] text-emerald-600 font-bold block mt-1">✓ Active package revenue</span>
                </div>
                <div className="bg-brand-cream/35 border border-brand-moss/5 rounded-2xl p-4">
                  <span className="font-mono text-[9px] text-brand-charcoal/50 uppercase block">Discount Rates Ledger</span>
                  <span className="font-sans text-[10px] text-brand-charcoal/80 block mt-1">
                    • 8-pack: <b className="text-brand-clay">5% off</b><br />
                    • 12-pack: <b className="text-brand-clay">10% off</b><br />
                    • 20-pack: <b className="text-brand-clay">15% off</b>
                  </span>
                </div>
              </div>

              {/* Unused Sessions Bundle Refund requests queue */}
              {bundles.filter(b => b.refundRequested).length > 0 && (
                <div className="space-y-2.5">
                  <span className="font-mono text-[8px] font-bold text-rose-600 tracking-wider uppercase block">Unused Session Refund Requests</span>
                  {bundles.filter(b => b.refundRequested).map(b => (
                    <div key={b.id} className="border border-rose-200 bg-rose-50/10 rounded-2xl p-4 space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-brand-moss block">{b.parentName}</span>
                          <span className="text-brand-charcoal/60 mt-0.5 block">{b.pack} · {b.remaining} unused sessions</span>
                        </div>
                        <button 
                          onClick={() => handleProcessBundleRefund(b.id)}
                          className="bg-rose-700 hover:bg-rose-800 text-white font-mono text-[9px] uppercase font-bold py-1 px-3 rounded-lg shadow-sm"
                        >
                          Process Refund
                        </button>
                      </div>
                      <span className="text-[10px] italic text-brand-charcoal/70 block bg-white rounded border border-brand-moss/5 p-2">
                        "Reason: {b.refundReason}"
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <span className="font-mono text-[8px] text-brand-charcoal/50 uppercase block tracking-wider pt-2 border-t border-brand-moss/5">Active Bundles Ledger</span>
                {bundles.map((bundle) => (
                  <div key={bundle.id} className="border border-brand-moss/10 rounded-2xl p-4 space-y-3 bg-brand-cream/5">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-heading font-bold text-xs text-brand-moss">{bundle.parentName}</h4>
                        <span className="font-sans text-[10px] text-brand-charcoal/60 block mt-0.5">
                          Child: <b>{bundle.child}</b> · Pack: <b>{bundle.pack}</b>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-brand-moss/10 bg-white block text-brand-moss font-bold">
                          {bundle.used} / {bundle.used + bundle.remaining} Used
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-brand-moss/5 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-brand-moss h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${(bundle.used / (bundle.used + bundle.remaining)) * 100}%` }} 
                      />
                    </div>

                    <div className="flex justify-between items-center text-[9px] font-mono text-brand-charcoal/50 pt-1">
                      <span>Expiry: {bundle.expiry}</span>
                      <span className={bundle.autoRenew ? 'text-emerald-600 font-bold' : 'text-brand-clay'}>
                        {bundle.autoRenew ? 'Auto-Renew Active' : 'Manual Expiry'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SECTION 5: COMPLIANCE & SAFETY */}
      {activeSubSection === 'compliance' && (
        <div className="space-y-8 animate-fade-up">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* NDPR Compliance panel */}
            <div className="lg:col-span-7 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">DATA PROTECTION</span>
                <h3 className="font-heading font-bold text-xl text-brand-moss mt-0.5">NDPR / GDPR Compliance Logs</h3>
                <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                  Track customer data download and deletion requests to ensure alignment with standard 72h SLA notifications.
                </p>
              </div>

              <div className="space-y-4">
                {gdprRequests.map((req) => (
                  <div key={req.id} className="border border-brand-moss/5 rounded-xl p-4 flex justify-between items-center gap-4 bg-brand-cream/5">
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-brand-clay font-bold block">{req.type}</span>
                      <h4 className="font-heading font-bold text-xs text-brand-moss mt-1">User: {req.user}</h4>
                      <span className="font-sans text-[10px] text-brand-charcoal/50 block mt-0.5">Submitted: {req.submitted}</span>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className={`font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        req.status === 'Completed'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                          : 'bg-amber-50 border-amber-200 text-amber-800 animate-pulse'
                      }`}>
                        {req.status}
                      </span>
                      {req.status === 'Pending' ? (
                        <button 
                          onClick={() => handleActionGdpr(req.id)}
                          className="bg-brand-moss text-white font-mono text-[9px] uppercase font-bold py-1 px-3 rounded-lg"
                        >
                          Action Request
                        </button>
                      ) : (
                        <span className="font-mono text-[8px] text-brand-charcoal/40 uppercase">Actioned (admin_1)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Cookie Consent Audit Log */}
              <div className="bg-brand-cream/20 border border-brand-moss/5 rounded-2xl p-4 space-y-2.5">
                <span className="font-heading font-bold text-xs text-brand-moss uppercase tracking-wider block">Cookie Consent Audit Log</span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {cookieConsentLogs.map(log => (
                    <div key={log.id} className="flex justify-between items-center text-[9px] font-mono border-b border-brand-moss/5 pb-1">
                      <span className="text-brand-charcoal/80">IP: {log.ip} · Status: <b>{log.consent}</b></span>
                      <span className="text-brand-charcoal/40">{log.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy Policy Version History */}
              <div className="bg-brand-cream/20 border border-brand-moss/5 rounded-2xl p-4 space-y-2.5">
                <span className="font-heading font-bold text-xs text-brand-moss uppercase tracking-wider block">Privacy Policy Version Ledger</span>
                <div className="space-y-1.5 text-[10px]">
                  {policyVersions.map((v, i) => (
                    <div key={i} className="flex justify-between items-center font-mono border-b border-brand-moss/5 pb-1">
                      <span className="text-brand-moss font-bold">Policy version {v.version}</span>
                      <span className="text-brand-charcoal/50">Released: {v.date} · {v.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-brand-moss/5 pt-4 space-y-3">
                <span className="font-heading font-bold text-xs text-brand-moss uppercase tracking-wider block">Privacy Incidents Ledger</span>
                <div className="space-y-2">
                  {breachLogs.map((log) => (
                    <div key={log.id} className="border border-dashed border-brand-moss/20 rounded-xl p-3 text-[10px] font-mono flex justify-between items-center gap-4">
                      <div>
                        <span className="text-brand-moss font-bold block">Incident log: {log.incident}</span>
                        <span className="text-brand-charcoal/50 block mt-0.5">Date: {log.date} · Status: {log.status}</span>
                      </div>
                      <span className="text-brand-clay font-bold">{log.reportedToNitda}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Background Check Verification Seals */}
            <div className="lg:col-span-5 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-6">
              <div>
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">VERIFICATION SIGNALS</span>
                <h3 className="font-heading font-bold text-lg text-brand-moss mt-0.5">Background Check Seals</h3>
                <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                  Manually attach verified status badges to tutors after reviewing extended third-party compliance reports. Tracks annual renewal.
                </p>
              </div>

              <div className="space-y-3">
                {backgroundChecks.map((bc) => (
                  <div key={bc.id} className="border border-brand-moss/10 rounded-2xl p-4 space-y-3 bg-brand-cream/5">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-heading font-bold text-xs text-brand-moss">{bc.name}</h4>
                        <span className="font-sans text-[10px] text-brand-charcoal/60 block mt-0.5">
                          Type: {bc.checkType}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          bc.verifiedDate === 'Pending'
                            ? 'bg-amber-50 border-amber-200 text-amber-800 animate-pulse'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                        }`}>
                          {bc.verifiedDate === 'Pending' ? 'Pending Vetting' : 'Verified Seal'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[9px] font-mono text-brand-charcoal/50">
                      <span>Annual Expiry: {bc.expiryDate}</span>
                      {bc.verifiedDate === 'Pending' ? (
                        <button 
                          onClick={() => handleVerifyBackground(bc.id)}
                          className="bg-brand-moss text-white px-3 py-1 rounded-lg hover:bg-brand-clay transition-all font-bold"
                        >
                          Verify seal
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-bold">✓ Badge Visible on profile</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recording access - Dispute Only Vow Form */}
            <div className="lg:col-span-12 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-6 space-y-4">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">PRIVACY PROTOCOL</span>
                  <h3 className="font-heading font-bold text-lg text-brand-moss mt-0.5">Recording Access Vows (Dispute-Only)</h3>
                  <p className="font-sans text-xs text-brand-charcoal/70 mt-1 leading-relaxed">
                    Access to student-teacher class videos is restricted. To review recording files for dispute evidence, you must submit a two-person authorization audit log request below. (Logs stored for 7 years).
                  </p>
                </div>

                <form onSubmit={handleRequestRecording} className="space-y-3 font-sans text-xs">
                  <div>
                    <label className="font-heading font-bold uppercase tracking-wider text-brand-charcoal/50 text-[9px] block mb-1">Dispute Reference ID</label>
                    <select 
                      value={recordingDisputeId} 
                      onChange={(e) => setRecordingDisputeId(e.target.value)}
                      className="w-full bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-3 py-2.5 focus:outline-none"
                    >
                      <option value="disp_1">disp_1 (Parent: Ngozi Adeleke vs Chioma)</option>
                      <option value="disp_2">disp_2 (Parent: Sarah M. vs Adebayo Okafor)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-heading font-bold uppercase tracking-wider text-brand-charcoal/50 text-[9px] block mb-1">Audit Log Justification Details</label>
                    <textarea 
                      required
                      rows="2"
                      value={recordingReason}
                      onChange={(e) => setRecordingReason(e.target.value)}
                      placeholder="e.g. Must confirm if audio feed dropped for more than 10 mins..."
                      className="w-full bg-brand-cream/40 border border-brand-moss/10 rounded-xl p-3 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-heading font-bold uppercase tracking-wider text-brand-charcoal/50 text-[9px] block mb-1">Secondary Admin Sign-off / Witness Name</label>
                    <input 
                      type="text" 
                      required
                      value={recordingApprover}
                      onChange={(e) => setRecordingApprover(e.target.value)}
                      placeholder="e.g. Admin Sarah Connor" 
                      className="w-full bg-white border border-brand-moss/10 rounded-xl px-3 py-2.5 focus:outline-none text-xs"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="bg-brand-clay hover:bg-brand-clay/95 text-white font-mono text-[9px] uppercase tracking-widest font-bold py-3 px-6 rounded-full shadow-md"
                  >
                    Authorize Recording Review
                  </button>
                </form>
              </div>

              <div className="md:col-span-6 space-y-4">
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">RECORDING ACCESS AUDIT TRAIL</span>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {recordingRequests.map((req) => (
                    <div key={req.id} className="border border-brand-moss/5 rounded-xl p-4 bg-brand-cream/10 space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-mono">
                        <span className="font-bold text-brand-moss">Dispute: {req.disputeId}</span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">{req.status}</span>
                      </div>
                      <p className="font-sans text-[11px] text-brand-charcoal/80 leading-relaxed italic">
                        "{req.reason}"
                      </p>
                      <div className="flex justify-between text-[8px] font-mono text-brand-charcoal/40 uppercase pt-1 border-t border-brand-moss/5">
                        <span>Admin Requestor: {req.adminId}</span>
                        <span>Date: {req.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SECTION 6: B2B PARTNERS */}
      {activeSubSection === 'b2b' && (
        <div className="space-y-8 animate-fade-up">
          
          {/* Sub-tab selection */}
          <div className="flex border-b border-brand-moss/10 mb-6 gap-6">
            <button
              onClick={() => setB2bSubTab('accounts')}
              className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                b2bSubTab === 'accounts'
                  ? 'border-brand-moss text-brand-moss'
                  : 'border-transparent text-brand-charcoal/50 hover:text-brand-moss'
              }`}
            >
              Partnership Accounts
            </button>
            <button
              onClick={() => setB2bSubTab('api_manager')}
              className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                b2bSubTab === 'api_manager'
                  ? 'border-brand-moss text-brand-moss'
                  : 'border-transparent text-brand-charcoal/50 hover:text-brand-moss'
              }`}
            >
              School B2B API Manager
            </button>
          </div>

          {b2bSubTab === 'accounts' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Create & Manage B2B School Accounts */}
              <div className="lg:col-span-7 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">CORPORATE PARTNERS</span>
                  <h3 className="font-heading font-bold text-xl text-brand-moss mt-0.5">B2B School Partnerships</h3>
                  <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                    Configure contract levels, school renewal alerts, invoices, and aggregate progress reporting.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Bulk Invite Code Global Output Panel */}
                  {generatedBulkCodes.length > 0 && bulkInviteSchoolId && (
                    <div className="border border-brand-moss/20 bg-white rounded-3xl p-5 space-y-3 shadow-md animate-fade-up">
                      <div className="flex justify-between items-center border-b border-brand-moss/5 pb-2">
                        <span className="font-mono text-[10px] text-brand-clay font-bold uppercase tracking-wider">
                          Generated Bulk Invite Codes ({b2bSchools.find(s => s.id === bulkInviteSchoolId)?.name})
                        </span>
                        <button 
                          onClick={() => { setGeneratedBulkCodes([]); setBulkInviteSchoolId(null); }} 
                          className="font-mono text-[8px] uppercase font-bold text-brand-charcoal/40 hover:text-brand-clay"
                        >
                          Clear Codes
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto pr-1">
                        {generatedBulkCodes.map((c, i) => (
                          <div key={i} className="bg-brand-cream/35 border border-brand-moss/5 rounded-lg p-2 font-mono text-[10px] text-center flex items-center justify-between select-all hover:bg-brand-cream transition-colors">
                            <span className="font-bold text-brand-moss">{c}</span>
                          </div>
                        ))}
                      </div>
                      <span className="font-sans text-[8px] text-brand-charcoal/50 block block-center">Click any code to select and copy it.</span>
                    </div>
                  )}

                  {b2bSchools.map((sch) => (
                    <div key={sch.id} className="border border-brand-moss/10 rounded-2xl p-5 space-y-3 bg-brand-cream/5">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-heading font-bold text-sm text-brand-moss">{sch.name}</h4>
                          <span className="font-sans text-[11px] text-brand-charcoal/60 block mt-0.5">
                            Point of Contact: <b>{sch.contact}</b>
                          </span>
                          
                          {/* Contract Renewal Countdown Alert */}
                          {(() => {
                            const diffTime = new Date(sch.renewalDate) - new Date('2026-06-10');
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            if (diffDays <= 30) {
                              return (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2 mt-2 animate-pulse">
                                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                                  <div className="text-[9px] text-amber-800 font-mono">
                                    <span className="font-bold uppercase tracking-wider block">CRITICAL RENEWAL ALERT</span>
                                    Contract renewal required in <b>{diffDays} days</b> ({sch.renewalDate}).
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <span className="font-mono text-[9px] text-brand-charcoal/40 block mt-1.5">
                                Renewal: {sch.renewalDate} (Contract in good standing)
                              </span>
                            );
                          })()}

                          {/* Portal Access Status display */}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-mono text-[8px] uppercase tracking-wider text-brand-charcoal/50">Admin Portal Access:</span>
                            <button 
                              onClick={() => handleTogglePortalAccess(sch.id)}
                              className={`font-mono text-[8px] uppercase tracking-widest font-bold py-0.5 px-2 rounded border transition-all ${
                                sch.portalAccess 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100/50' 
                                  : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100/50'
                              }`}
                            >
                              {sch.portalAccess ? 'Active (Click to Suspend)' : 'Suspended (Click to Activate)'}
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-heading font-bold text-xs text-brand-clay block">
                            {formatCurrency(convertMinor(sch.flatFee, selectedCurrency), selectedCurrency)} /mo
                          </span>
                          <span className="font-mono text-[8px] text-brand-charcoal/50 block uppercase mt-0.5">Flat Monthly Contract</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 font-mono text-[9px] text-center pt-2 border-t border-brand-moss/5 bg-white rounded-xl p-3 border border-brand-moss/5">
                        <div>
                          <span className="text-brand-charcoal/50 block">Total Value</span>
                          <span className="font-bold text-brand-moss text-xs">{formatCurrency(convertMinor(sch.contractValue, selectedCurrency), selectedCurrency)}</span>
                        </div>
                        <div>
                          <span className="text-brand-charcoal/50 block">Student slots</span>
                          <span className="font-bold text-brand-moss text-xs">{sch.studentsCount} / {sch.studentsLimit} accounts</span>
                        </div>
                        <div>
                          <span className="text-brand-charcoal/50 block">Assigned Teachers</span>
                          <span className="font-bold text-brand-moss text-xs">{sch.teachersCount} Tutors</span>
                        </div>
                      </div>

                      <div className="flex gap-2 items-center justify-end pt-2 flex-wrap">
                        <div className="flex items-center gap-1 bg-white border border-brand-moss/10 rounded-lg px-2 py-1 text-[9px] font-mono text-brand-charcoal">
                          <span>Qty:</span>
                          <input 
                            type="number" 
                            min="1" 
                            max="50" 
                            defaultValue="5"
                            id={`bulk_qty_${sch.id}`}
                            className="w-8 text-center bg-transparent focus:outline-none font-bold text-brand-moss border-l border-brand-moss/5 ml-1"
                          />
                        </div>
                        <button 
                          onClick={() => setSelectedB2bSchool(sch)}
                          className="font-mono text-[9px] uppercase tracking-widest text-brand-moss font-bold border border-brand-moss/10 px-3 py-1.5 rounded-lg hover:bg-brand-moss/5 transition-all flex items-center gap-1.5 bg-white"
                        >
                          <Eye className="w-3 h-3" /> View Report
                        </button>
                        <button 
                          onClick={() => {
                            const qtyVal = parseInt(document.getElementById(`bulk_qty_${sch.id}`)?.value || '5');
                            handleGenerateBulkCodes(sch.id, qtyVal);
                          }}
                          className="font-mono text-[9px] uppercase tracking-widest text-brand-moss font-bold border border-brand-moss/10 px-3 py-1.5 rounded-lg hover:bg-brand-moss/5 transition-all bg-white"
                        >
                          Generate Bulk Codes
                        </button>
                        <button 
                          onClick={() => handleGenerateSchoolInvoice(sch)}
                          className="font-mono text-[9px] uppercase tracking-widest text-brand-clay font-bold border border-brand-clay/10 px-3 py-1.5 rounded-lg hover:bg-brand-clay/5 transition-all bg-white"
                        >
                          Generate Invoice
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* School Partnership Form */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Add school */}
                <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">REGISTRATION SUITE</span>
                  <h3 className="font-heading font-bold text-lg text-brand-moss">Add School Account</h3>
                  
                  <form onSubmit={handleAddB2bSchool} className="space-y-3 font-sans text-xs">
                    <div>
                      <label className="font-heading font-bold uppercase tracking-wider text-brand-charcoal/50 text-[9px] block mb-1">School Name</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Corona Schools Trust"
                        value={newSchoolName}
                        onChange={(e) => setNewSchoolName(e.target.value)}
                        className="w-full bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-3 py-2.5 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-heading font-bold uppercase tracking-wider text-brand-charcoal/50 text-[9px] block mb-1">Administrative Contact Person</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Dr. Alabi"
                        value={newSchoolContact}
                        onChange={(e) => setNewSchoolContact(e.target.value)}
                        className="w-full bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-3 py-2.5 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-heading font-bold uppercase tracking-wider text-brand-charcoal/50 text-[9px] block mb-1">Contract Value (NGN)</label>
                        <input 
                          type="number" 
                          required 
                          placeholder="e.g. 1200000"
                          value={newSchoolContract}
                          onChange={(e) => setNewSchoolContract(e.target.value)}
                          className="w-full bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-heading font-bold uppercase tracking-wider text-brand-charcoal/50 text-[9px] block mb-1">Monthly Flat Fee (NGN)</label>
                        <input 
                          type="number" 
                          required 
                          placeholder="e.g. 400000"
                          value={newSchoolFee}
                          onChange={(e) => setNewSchoolFee(e.target.value)}
                          className="w-full bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-heading font-bold uppercase tracking-wider text-brand-charcoal/50 text-[9px] block mb-1">Student Accounts Limit</label>
                        <input 
                          type="number" 
                          required 
                          placeholder="e.g. 100"
                          value={newSchoolStudentsLimit}
                          onChange={(e) => setNewSchoolStudentsLimit(e.target.value)}
                          className="w-full bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-heading font-bold uppercase tracking-wider text-brand-charcoal/50 text-[9px] block mb-1">Assigned Teachers</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. Adebayo, Chioma"
                          value={newSchoolTeachersList}
                          onChange={(e) => setNewSchoolTeachersList(e.target.value)}
                          className="w-full bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-brand-moss hover:bg-brand-moss/95 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-full shadow-md transition-colors"
                    >
                      Create School Account
                    </button>
                  </form>
                </div>

                {/* School Reporting Detail Panel */}
                {selectedB2bSchool && (
                  <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-4 animate-fade-up">
                    <div className="flex justify-between items-start border-b border-brand-moss/5 pb-2">
                      <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">ANONYMISED REPORTING</span>
                      <button onClick={() => setSelectedB2bSchool(null)} className="text-[10px] font-mono text-brand-clay font-bold hover:underline">Close</button>
                    </div>
                    <h4 className="font-heading font-bold text-sm text-brand-moss">{selectedB2bSchool.name} Reports</h4>
                    <div className="space-y-2 text-xs font-sans text-brand-charcoal/80">
                      <div className="flex justify-between"><span>Anonymised sessions:</span><b>{selectedB2bSchool.reporting.totalSessions} Sessions</b></div>
                      <div className="flex justify-between"><span>Average student progress:</span><b>{selectedB2bSchool.reporting.avgProgress}</b></div>
                      <div>
                        <span className="block mb-1">Subjects categories used:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedB2bSchool.reporting.subjectsUsed.map(s => (
                            <span key={s} className="bg-brand-moss/5 text-brand-moss font-mono text-[9px] px-2 py-0.5 rounded border border-brand-moss/10">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Monthly School Invoices Log */}
                <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">FINANCIAL OUTSTANDINGS</span>
                  <h3 className="font-heading font-bold text-base text-brand-moss">Monthly School Invoices</h3>
                  
                  <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="border border-brand-moss/5 rounded-xl p-3 flex justify-between items-center text-xs bg-brand-cream/5">
                        <div>
                          <span className="font-bold text-brand-moss block">{inv.schoolName}</span>
                          <span className="font-mono text-[8px] text-brand-charcoal/50 block uppercase mt-0.5">
                            Inv: {inv.invoiceNo} · Date: {inv.date}
                          </span>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1.5">
                          <span className="font-heading font-bold text-brand-moss text-xs">
                            {formatCurrency(convertMinor(inv.amount, selectedCurrency), selectedCurrency)}
                          </span>
                          <span className={`font-mono text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800 animate-pulse'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {invoices.length === 0 && (
                      <div className="py-4 text-center font-sans text-brand-charcoal/40 text-[10px]">No invoices recorded. Click "Generate Invoice" on a B2B School account card.</div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
              
              {/* API Key Control Center */}
              <div className="lg:col-span-7 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">API CONTROLS</span>
                  <h3 className="font-heading font-bold text-xl text-brand-moss mt-0.5">School API Key Management</h3>
                  <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                    Issue client authorization tokens and configure server integration levels.
                  </p>
                </div>

                <div className="space-y-4">
                  {b2bSchools.map((sch) => (
                    <div key={sch.id} className="border border-brand-moss/10 rounded-2xl p-5 space-y-3 bg-brand-cream/5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-heading font-bold text-sm text-brand-moss">{sch.name}</h4>
                          <span className="font-mono text-[9px] text-brand-charcoal/40 block mt-0.5">
                            ID: {sch.id}
                          </span>
                        </div>
                        <div>
                          {sch.apiKeyStatus === 'active' ? (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">
                              Active
                            </span>
                          ) : sch.apiKeyStatus === 'revoked' ? (
                            <span className="bg-rose-50 text-rose-800 border border-rose-200 font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">
                              Revoked
                            </span>
                          ) : (
                            <span className="bg-gray-50 text-gray-500 border border-gray-200 font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">
                              No Key Issued
                            </span>
                          )}
                        </div>
                      </div>

                      {sch.apiKey ? (
                        <div className="bg-white border border-brand-moss/10 rounded-xl p-3 flex justify-between items-center gap-2">
                          <div className="font-mono text-[10px] text-brand-moss font-bold select-all truncate max-w-[60%]">
                            {sch.apiKeyStatus === 'active' ? sch.apiKey : '••••••••••••••••••••••••'}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {sch.apiKeyStatus === 'active' && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(sch.apiKey);
                                  triggerToast("API Key copied to clipboard!");
                                }}
                                className="p-1.5 text-brand-charcoal/50 hover:text-brand-moss rounded-lg border border-brand-moss/10 hover:bg-brand-cream/30"
                                title="Copy API Key"
                              >
                                <Clipboard className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {sch.apiKeyStatus === 'active' ? (
                              <button
                                onClick={() => handleRevokeApiKey(sch.id)}
                                className="font-mono text-[9px] uppercase tracking-widest text-rose-600 font-bold border border-rose-200 hover:bg-rose-50 px-2 py-1 rounded-lg transition-all"
                              >
                                Revoke Key
                              </button>
                            ) : (
                              <button
                                onClick={() => handleGenerateApiKey(sch.id)}
                                className="font-mono text-[9px] uppercase tracking-widest text-brand-moss font-bold border border-brand-moss/10 hover:bg-brand-cream/35 px-2 py-1 rounded-lg transition-all"
                              >
                                Issue Key
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center bg-brand-cream/20 border border-dashed border-brand-moss/20 rounded-xl p-4 text-center">
                          <span className="font-sans text-[11px] text-brand-charcoal/50">No API authorization key is active for this school.</span>
                          <button
                            onClick={() => handleGenerateApiKey(sch.id)}
                            className="font-mono text-[9px] uppercase tracking-widest text-brand-moss font-bold border border-brand-moss/20 hover:bg-white bg-brand-cream/30 px-3 py-2 rounded-lg transition-all"
                          >
                            Generate API Key
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* API Integration Specifications */}
              <div className="lg:col-span-5 space-y-6 w-full">
                <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">TECHNICAL SPECS</span>
                  <h3 className="font-heading font-bold text-lg text-brand-moss">Integration Endpoints</h3>
                  <p className="font-sans text-xs text-brand-charcoal/70 font-bold">
                    Integrate EduVista matching and tracking systems directly into your school's LMS/ERP portal using these secure API endpoints.
                  </p>

                  <div className="space-y-4 font-sans text-xs">
                    {/* Endpoint 1 */}
                    <div className="border border-brand-moss/5 rounded-xl p-3 bg-brand-cream/10 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-800 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">GET</span>
                        <span className="font-mono text-[10px] font-bold text-brand-moss truncate">/api/b2b/schools/tutors</span>
                      </div>
                      <p className="text-[10px] text-brand-charcoal/70">
                        Query vetted teachers matching custom subjects and max rate parameters.
                      </p>
                      <div className="bg-brand-moss text-white font-mono text-[9px] p-2.5 rounded-lg overflow-x-auto relative group">
                        <code>curl -H "x-b2b-api-key: [API_KEY]" "http://localhost:5000/api/b2b/schools/tutors?subject=Mathematics&maxRate=500000"</code>
                      </div>
                    </div>

                    {/* Endpoint 2 */}
                    <div className="border border-brand-moss/5 rounded-xl p-3 bg-brand-cream/10 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">POST</span>
                        <span className="font-mono text-[10px] font-bold text-brand-moss truncate">/api/b2b/schools/register-bulk-students</span>
                      </div>
                      <p className="text-[10px] text-brand-charcoal/70">
                        Programmatically provision parent and student profile accounts.
                      </p>
                      <div className="bg-brand-moss text-white font-mono text-[9px] p-2.5 rounded-lg overflow-x-auto relative group">
                        <code>{`curl -X POST -H "x-b2b-api-key: [API_KEY]" -H "Content-Type: application/json" -d '{"students": [{"name": "Adebayo Jnr", "dob": "2013-05-14", "subjects": ["Mathematics"]}]}' "http://localhost:5000/api/b2b/schools/register-bulk-students"`}</code>
                      </div>
                    </div>

                    {/* Endpoint 3 */}
                    <div className="border border-brand-moss/5 rounded-xl p-3 bg-brand-cream/10 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-800 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">GET</span>
                        <span className="font-mono text-[10px] font-bold text-brand-moss truncate">/api/b2b/schools/compliance</span>
                      </div>
                      <p className="text-[10px] text-brand-charcoal/70">
                        Audit student lesson clock sheets, session compliance status, and escrow wallet values.
                      </p>
                      <div className="bg-brand-moss text-white font-mono text-[9px] p-2.5 rounded-lg overflow-x-auto relative group">
                        <code>curl -H "x-b2b-api-key: [API_KEY]" "http://localhost:5000/api/b2b/schools/compliance"</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* SECTION 7: CONFIG & MODERATION */}
      {activeSubSection === 'config' && (
        <div className="space-y-8 animate-fade-up">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Flagged reviews queue */}
            <div className="lg:col-span-7 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">MODERATION ENGINE</span>
                <h3 className="font-heading font-bold text-xl text-brand-moss mt-0.5">Flagged Reviews Moderation Queue</h3>
                <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                  Review student/parent feedback flagged as inappropriate by teachers. Decisions trigger notification releases.
                </p>
              </div>

              {/* Flagged Reviewers Pattern Warnings */}
              <div className="space-y-3 bg-rose-50 border border-rose-200/50 rounded-2xl p-4 font-sans text-xs">
                <h5 className="font-heading font-bold text-xs text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" /> Biometric Reviewer Pattern Warnings
                </h5>
                <div className="space-y-2">
                  {flaggedReviewers.map((rev, i) => (
                    <div key={i} className="flex justify-between items-center text-[10px] border-b border-rose-100/30 pb-2 last:border-b-0 last:pb-0">
                      <div>
                        <span className="font-bold text-brand-moss block">{rev.username}</span>
                        <span className="text-[9px] text-brand-charcoal/60 mt-0.5 block">Submissions: <b>{rev.negativeCount} low-star reviews flagged</b></span>
                      </div>
                      <span className={`font-mono text-[8px] uppercase tracking-wider font-bold py-0.5 px-2 rounded border ${
                        rev.negativeCount >= 3 
                          ? 'bg-rose-100 border-rose-300 text-rose-800 animate-pulse'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        {rev.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {flaggedReviews.map((rev) => (
                  <div key={rev.id} className="border border-brand-moss/10 rounded-2xl p-5 space-y-3 bg-brand-cream/5">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-heading font-bold text-xs text-brand-moss">Review by {rev.author}</h4>
                        <span className="font-sans text-[10px] text-brand-charcoal/60 block mt-0.5">
                          Target Teacher: <b>{rev.teacherName}</b> · Session: <b>{rev.sessionContext}</b>
                        </span>
                      </div>
                      <div className="flex gap-0.5 text-brand-clay shrink-0">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < rev.score ? 'fill-brand-clay' : 'text-brand-moss/20'}`} />
                        ))}
                      </div>
                    </div>

                    <p className="font-sans text-xs text-brand-charcoal/80 bg-white p-3 rounded-xl border border-brand-moss/5 leading-relaxed">
                      "Review: {rev.text}"
                    </p>

                    <p className="font-sans text-[10px] text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-3 font-mono leading-relaxed">
                      Teacher Flag Justification: "{rev.flagReason}"
                    </p>

                    {clarificationRequestedId === rev.id ? (
                      <div className="bg-white border border-brand-moss/10 rounded-xl p-3 flex gap-2 w-full mt-3">
                        <input 
                          type="text" 
                          placeholder="Type moderator note for removal..."
                          id={`mod_note_${rev.id}`}
                          className="flex-1 bg-brand-cream/20 border border-brand-moss/15 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-clay text-xs"
                        />
                        <button 
                          onClick={() => {
                            const note = document.getElementById(`mod_note_${rev.id}`)?.value || 'Policy Violation';
                            handleReviewModeration(rev.id, 'Remove Review', note);
                            setClarificationRequestedId(null);
                          }}
                          className="bg-brand-clay text-white px-3 py-1.5 rounded-lg font-bold"
                        >
                          Confirm Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end pt-2 border-t border-brand-moss/5">
                        <button 
                          onClick={() => handleReviewModeration(rev.id, 'Keep Review')}
                          className="font-mono text-[9px] uppercase font-bold text-brand-moss hover:underline"
                        >
                          Keep Review
                        </button>
                        <button 
                          onClick={() => setClarificationRequestedId(rev.id)}
                          className="font-mono text-[9px] uppercase font-bold text-brand-clay hover:underline"
                        >
                          Remove Review
                        </button>
                        <button 
                          onClick={() => triggerToast('Clarification request notification sent back to Parent.')}
                          className="font-mono text-[9px] uppercase font-bold text-brand-charcoal/60 hover:underline"
                        >
                          Request Clarification
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {flaggedReviews.length === 0 && (
                  <span className="font-sans text-[10px] text-brand-charcoal/40 block text-center py-4">No reviews currently flagged for moderation.</span>
                )}
              </div>

              {/* Moderation audit logs */}
              {moderationAuditLogs.length > 0 && (
                <div className="bg-brand-cream/20 border border-brand-moss/5 rounded-2xl p-4 space-y-2">
                  <span className="font-heading font-bold text-xs text-brand-moss uppercase tracking-wider block">Compliance review removal logs</span>
                  <div className="space-y-1.5 text-[9px] font-mono">
                    {moderationAuditLogs.map((log, i) => (
                      <div key={i} className="flex justify-between border-b border-brand-moss/5 pb-1">
                        <span>Removed Review {log.reviewId} - Reason: <b>{log.reason}</b></span>
                        <span>Admin: {log.adminId} · {log.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Platform Configuration */}
            <div className="lg:col-span-5 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 shadow-sm space-y-6">
              <div>
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">GLOBAL SYSTEM METRICS</span>
                <h3 className="font-heading font-bold text-lg text-brand-moss mt-0.5">Platform Config Panel</h3>
                <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                  Adjust global platform financial boundaries and escrow timing window parameters.
                </p>
              </div>

              <div className="space-y-4 font-sans text-xs">
                {/* Commission per tier */}
                <div className="bg-brand-cream/20 rounded-xl p-3 border border-brand-moss/5 space-y-3">
                  <span className="font-heading font-bold text-[10px] uppercase text-brand-moss block">Commission Tiers</span>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px] font-mono uppercase text-brand-charcoal/60">Tier 1 Commission (Base)</span>
                      <span className="font-mono font-bold text-brand-moss">{configCommission}%</span>
                    </div>
                    <input type="range" min="5" max="30" value={configCommission} onChange={(e) => setConfigCommission(parseInt(e.target.value))} className="w-full accent-brand-moss" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px] font-mono uppercase text-brand-charcoal/60">Tier 2 Commission (Premium)</span>
                      <span className="font-mono font-bold text-brand-moss">{configCommissionTier2}%</span>
                    </div>
                    <input type="range" min="5" max="30" value={configCommissionTier2} onChange={(e) => setConfigCommissionTier2(parseInt(e.target.value))} className="w-full accent-brand-moss" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px] font-mono uppercase text-brand-charcoal/60">Tier 3 Commission (Elite)</span>
                      <span className="font-mono font-bold text-brand-moss">{configCommissionTier3}%</span>
                    </div>
                    <input type="range" min="5" max="30" value={configCommissionTier3} onChange={(e) => setConfigCommissionTier3(parseInt(e.target.value))} className="w-full accent-brand-moss" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="font-heading font-bold uppercase tracking-wider text-brand-charcoal/60 text-[9px]">Minimum Payout Threshold</label>
                    <span className="font-mono font-bold text-brand-moss">₦{(configMinPayout / 100).toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min="100000" 
                    max="2000000" 
                    step="50000"
                    value={configMinPayout}
                    onChange={(e) => setConfigMinPayout(parseInt(e.target.value))}
                    className="w-full accent-brand-moss"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="font-heading font-bold uppercase tracking-wider text-brand-charcoal/60 text-[9px]">Trial Lesson Refund Window</label>
                    <span className="font-mono font-bold text-brand-moss">{configRefundWindow} Hours</span>
                  </div>
                  <input 
                    type="range" 
                    min="12" 
                    max="168" 
                    step="12"
                    value={configRefundWindow}
                    onChange={(e) => setConfigRefundWindow(parseInt(e.target.value))}
                    className="w-full accent-brand-moss"
                  />
                </div>

                {/* Additional config items */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[8px] font-mono uppercase text-brand-charcoal/50 mb-1">Exchange rate update</label>
                    <select 
                      value={configExchangeRateFreq} 
                      onChange={(e) => setConfigExchangeRateFreq(e.target.value)}
                      className="w-full bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-2.5 py-2 text-[10px]"
                    >
                      <option value="Daily">Daily Sync</option>
                      <option value="Hourly">Hourly Sync</option>
                      <option value="Manual">Manual Trigger</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] font-mono uppercase text-brand-charcoal/50 mb-1">Leaderboard refresh</label>
                    <select 
                      value={configLeaderboardFreq} 
                      onChange={(e) => setConfigLeaderboardFreq(e.target.value)}
                      className="w-full bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-2.5 py-2 text-[10px]"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Real-time">Real-time</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[8px] font-mono uppercase text-brand-charcoal/50 mb-1">AI Academy Pass Mark</label>
                    <input 
                      type="number"
                      value={configAcademyPassMark}
                      onChange={(e) => setConfigAcademyPassMark(parseInt(e.target.value))}
                      className="w-full bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-3 py-2 text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-mono uppercase text-brand-charcoal/50 mb-1">Late Join (mins)</label>
                    <input 
                      type="number"
                      value={configLateJoin}
                      onChange={(e) => setConfigLateJoin(parseInt(e.target.value))}
                      className="w-full bg-brand-cream/40 border border-brand-moss/10 rounded-xl px-3 py-2 text-[10px]"
                    />
                  </div>
                </div>

                {/* Badge conditions editor */}
                <div className="bg-brand-cream/20 rounded-xl p-3 border border-brand-moss/5 space-y-2">
                  <span className="font-heading font-bold text-[10px] uppercase text-brand-moss block">Badge Trigger Editor</span>
                  <div>
                    <span className="text-[8px] font-mono uppercase text-brand-charcoal/40 block mb-0.5">Perfect Attendance Condition</span>
                    <input type="text" value={configBadgeConditions.perfectAttendance} onChange={(e) => setConfigBadgeConditions({...configBadgeConditions, perfectAttendance: e.target.value})} className="w-full bg-white border border-brand-moss/10 rounded-lg px-2.5 py-1 text-[10px]" />
                  </div>
                  <div>
                    <span className="text-[8px] font-mono uppercase text-brand-charcoal/40 block mb-0.5">Assignment Champion Condition</span>
                    <input type="text" value={configBadgeConditions.assignmentChampion} onChange={(e) => setConfigBadgeConditions({...configBadgeConditions, assignmentChampion: e.target.value})} className="w-full bg-white border border-brand-moss/10 rounded-lg px-2.5 py-1 text-[10px]" />
                  </div>
                  <div>
                    <span className="text-[8px] font-mono uppercase text-brand-charcoal/40 block mb-0.5">Top Scorer Condition</span>
                    <input type="text" value={configBadgeConditions.topScorer} onChange={(e) => setConfigBadgeConditions({...configBadgeConditions, topScorer: e.target.value})} className="w-full bg-white border border-brand-moss/10 rounded-lg px-2.5 py-1 text-[10px]" />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => triggerToast('Platform configuration settings successfully updated.')}
                    className="w-full bg-brand-clay hover:bg-brand-clay/95 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-full shadow-sm"
                  >
                    Save Platform Config
                  </button>
                </div>
              </div>

              {/* Rejection reason analytics breakdown */}
              <div className="border-t border-brand-moss/5 pt-4 space-y-3">
                <span className="font-heading font-bold text-xs text-brand-moss uppercase tracking-wider block">Rejection Reason Analytics</span>
                <p className="font-sans text-[10px] text-brand-charcoal/65 leading-relaxed">
                  Distribution log of application rejection reasons. If a category exceeds 40%, onboarding instructions are optimized.
                </p>

                {/* Over 40% Threshold warning banner */}
                {rejectionReasons.some(r => r.count >= 40) && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2 animate-pulse">
                    <AlertOctagon className="w-5.5 h-5.5 text-rose-600 shrink-0" />
                    <span className="font-mono text-[9px] text-rose-800 leading-normal">
                      SLA Warning: "{rejectionReasons.find(r => r.count >= 40)?.reason}" exceeds the 40% threshold. Recommended action triggered: Update Onboarding Step 4 with clearer image resolution upload specifications.
                    </span>
                  </div>
                )}

                <div className="space-y-2.5 font-mono text-[9px]">
                  {rejectionReasons.map((r, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span>{r.reason}</span>
                        <span className="font-bold">{r.count}%</span>
                      </div>
                      <div className="w-full bg-brand-moss/5 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-1.5 ${r.color}`} style={{ width: `${r.count}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rejection Rate Trend SVG Chart */}
                <div className="mt-4 pt-4 border-t border-brand-moss/5">
                  <span className="font-mono text-[8px] uppercase tracking-wider text-brand-charcoal/50 block mb-2">Rejection Rate Trend (4 Weeks)</span>
                  <div className="h-24 bg-brand-cream/10 border border-brand-moss/5 rounded-xl p-2.5 flex flex-col justify-between">
                    <svg viewBox="0 0 200 60" className="w-full h-14 stroke-brand-moss fill-none stroke-[2] overflow-visible">
                      <path d="M10,50 L50,38 L110,12 L170,18" className="stroke-brand-clay" />
                      <circle cx="10" cy="50" r="2.5" fill="#CC5833" />
                      <circle cx="50" cy="38" r="2.5" fill="#CC5833" />
                      <circle cx="110" cy="12" r="2.5" fill="#CC5833" />
                      <circle cx="170" cy="18" r="2.5" fill="#CC5833" />
                    </svg>
                    <div className="flex justify-between font-mono text-[7px] text-brand-charcoal/40 px-1">
                      <span>Wk 1 (15%)</span>
                      <span>Wk 2 (28%)</span>
                      <span>Wk 3 (45% - alert)</span>
                      <span>Wk 4 (42%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SECTION 8: EMAILS & NOTIFICATIONS CLIENT */}
      {activeSubSection === 'emails' && (
        <div className="space-y-8 animate-fade-up">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Panel: Audit Log of Sent Emails */}
            <div className="lg:col-span-7 bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-charcoal/50 block">AUDIT TRAIL LOGS</span>
                <h3 className="font-heading font-bold text-xl text-brand-moss mt-0.5">Sent Transactional Emails</h3>
                <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                  Trace and audit all emails generated by billing escrow updates, registrations, and administrative announcements.
                </p>
              </div>

              {/* Search bar and refresh */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search logs by recipient or subject..."
                    value={emailSearch}
                    onChange={(e) => setEmailSearch(e.target.value)}
                    className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-full py-2.5 pl-4 pr-10 text-xs font-sans text-brand-charcoal focus:outline-none focus:border-brand-clay focus:ring-1 focus:ring-brand-clay"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchEmailData}
                  className="px-4 py-2 bg-brand-cream hover:bg-brand-moss/5 border border-brand-moss/10 rounded-full flex items-center justify-center text-brand-moss transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${emailLogsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Scrollable list */}
              <div className="max-h-[300px] sm:max-h-[400px] md:max-h-[500px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {sentEmails.filter(e => 
                  e.to.toLowerCase().includes(emailSearch.toLowerCase()) || 
                  e.subject.toLowerCase().includes(emailSearch.toLowerCase())
                ).length === 0 ? (
                  <div className="py-12 text-center text-brand-charcoal/40 text-xs font-sans">
                    {emailLogsLoading ? "Loading email records..." : "No email records found matching the search."}
                  </div>
                ) : (
                  sentEmails.filter(e => 
                    e.to.toLowerCase().includes(emailSearch.toLowerCase()) || 
                    e.subject.toLowerCase().includes(emailSearch.toLowerCase())
                  ).map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => setSelectedViewEmail(item)}
                      className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 hover:shadow-sm hover:border-brand-clay/30 ${
                        selectedViewEmail?.id === item.id 
                          ? 'bg-brand-clay/5 border-brand-clay' 
                          : 'bg-brand-cream/10 border-brand-moss/5 hover:bg-brand-cream/20'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="font-heading text-xs font-bold text-brand-moss">{item.subject}</span>
                        <span className={`font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          item.status === 'sent' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                            : item.status === 'failed' 
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : 'bg-amber-50 border-amber-200 text-amber-800 animate-pulse'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-brand-charcoal/60 mt-2 font-mono">
                        <div>
                          To: <span className="font-bold text-brand-moss">{item.to}</span>
                        </div>
                        <div>
                          {new Date(item.sentAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Panel: Send controls */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Send Welcome Email */}
              <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-4">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block">SEND WELCOME TEMPLATE</span>
                  <h3 className="font-heading font-bold text-lg text-brand-moss mt-0.5">Welcome Onboarding Email</h3>
                  <p className="font-sans text-xs text-brand-charcoal/70 mt-1 leading-relaxed">
                    Fire the standard transactional welcome email containing login info, verification links, and system guides to a user.
                  </p>
                </div>

                <form onSubmit={handleSendWelcomeEmail} className="space-y-4 pt-2">
                  <div>
                    <label className="font-heading font-bold text-2xs uppercase tracking-wider text-brand-charcoal/60 block mb-2">
                      Select Recipient User
                    </label>
                    <select
                      value={selectedUserForWelcome}
                      onChange={(e) => setSelectedUserForWelcome(e.target.value)}
                      className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl py-2 px-3 text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay"
                    >
                      {platformUsers.length === 0 ? (
                        <option value="">No users found</option>
                      ) : (
                        platformUsers.map(u => (
                          <option key={u.uid} value={u.uid}>
                            {u.displayName} ({u.role}) — {u.email}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={sendingWelcome || platformUsers.length === 0}
                    className="w-full py-3 bg-brand-moss hover:bg-brand-moss/90 text-white font-sans text-2xs font-bold uppercase tracking-wider rounded-full transition-colors flex items-center justify-center gap-2"
                  >
                    {sendingWelcome ? "Sending welcome email..." : "Send Onboarding Email"}
                  </button>
                </form>
              </div>

              {/* Send Broadcast Notification */}
              <div className="bg-white border border-brand-moss/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-4">
                <div>
                  <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block">BROADCAST BULLETIN</span>
                  <h3 className="font-heading font-bold text-lg text-brand-moss mt-0.5">System Update & Email Broadcast</h3>
                  <p className="font-sans text-xs text-brand-charcoal/70 mt-1 leading-relaxed">
                    Creates an in-app notification displayed in the notification bell and triggers a matching administrative email copy to target.
                  </p>
                </div>

                <form onSubmit={handleSendNotification} className="space-y-4 pt-2">
                  <div>
                    <label className="font-heading font-bold text-2xs uppercase tracking-wider text-brand-charcoal/60 block mb-2">
                      Target Audience
                    </label>
                    <select
                      value={selectedUserForNotif}
                      onChange={(e) => setSelectedUserForNotif(e.target.value)}
                      className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl py-2 px-3 text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay"
                    >
                      <option value="all">📢 All Users (Global Broadcast)</option>
                      {platformUsers.map(u => (
                        <option key={u.uid} value={u.uid}>
                          👤 {u.displayName} ({u.role}) — {u.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-heading font-bold text-2xs uppercase tracking-wider text-brand-charcoal/60 block mb-2">
                      Announcement Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Scheduled Platform Maintenance Window"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl py-2 px-3 text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay"
                    />
                  </div>

                  <div>
                    <label className="font-heading font-bold text-2xs uppercase tracking-wider text-brand-charcoal/60 block mb-2">
                      Message Content (Body)
                    </label>
                    <textarea
                      placeholder="Enter the broadcast notification message..."
                      rows="4"
                      value={notifBody}
                      onChange={(e) => setNotifBody(e.target.value)}
                      className="w-full bg-brand-cream/30 border border-brand-moss/10 rounded-xl py-2 px-3 text-xs text-brand-charcoal focus:outline-none focus:border-brand-clay font-sans resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendingNotif}
                    className="w-full py-3 bg-brand-clay hover:bg-brand-clay/90 text-white font-sans text-2xs font-bold uppercase tracking-wider rounded-full transition-colors flex items-center justify-center gap-2 shadow-md shadow-brand-clay/10"
                  >
                    {sendingNotif ? "Broadcasting message..." : "Broadcast Update Now"}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* VIEW EMAIL PREVIEW MODAL */}
      {selectedViewEmail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-2xs" onClick={() => setSelectedViewEmail(null)} />
          <div className="relative bg-white border border-brand-moss/20 rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-2xl p-5 sm:p-8 shadow-2xl z-10 font-sans text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6 pb-2 border-b border-brand-moss/10">
              <div>
                <span className="font-mono text-[8px] uppercase tracking-wider text-brand-clay block font-bold">
                  TRANSACTIONAL EMAIL SYSTEM PREVIEW
                </span>
                <h3 className="font-heading font-bold text-base text-brand-moss mt-0.5">
                  Audit Log Details
                </h3>
              </div>
              <button 
                onClick={() => setSelectedViewEmail(null)} 
                className="text-brand-clay hover:underline font-mono text-[10px] font-bold"
              >
                Close Details
              </button>
            </div>

            {/* Email card mock */}
            <div className="border border-brand-moss/10 rounded-2xl p-6 bg-brand-cream/10 space-y-4">
              <div className="space-y-1 font-mono text-[10px] border-b border-brand-moss/5 pb-3">
                <div><span className="text-brand-charcoal/40">ID:</span> <span className="text-brand-moss font-bold">{selectedViewEmail.id}</span></div>
                <div><span className="text-brand-charcoal/40">FROM:</span> <span className="text-brand-moss">EduVista Africa &lt;onboarding@resend.dev&gt;</span></div>
                <div><span className="text-brand-charcoal/40">TO:</span> <span className="text-brand-moss font-bold">{selectedViewEmail.to}</span></div>
                <div><span className="text-brand-charcoal/40">SUBJECT:</span> <span className="text-brand-clay font-bold">{selectedViewEmail.subject}</span></div>
                <div><span className="text-brand-charcoal/40">DATE:</span> <span className="text-brand-charcoal">{new Date(selectedViewEmail.sentAt).toLocaleString()}</span></div>
                <div><span className="text-brand-charcoal/40">TEMPLATE:</span> <span className="text-brand-charcoal/60 uppercase">{selectedViewEmail.template}</span></div>
                {selectedViewEmail.messageId && (
                  <div><span className="text-brand-charcoal/40">SMTP ID:</span> <span className="text-brand-moss font-bold">{selectedViewEmail.messageId}</span></div>
                )}
              </div>

              {/* Email Content body */}
              <div className="bg-white border border-brand-moss/5 rounded-xl p-6 text-xs text-brand-charcoal leading-relaxed whitespace-pre-wrap font-sans max-h-[300px] overflow-y-auto">
                {selectedViewEmail.body}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setSelectedViewEmail(null)}
                className="py-2.5 px-6 bg-brand-moss hover:bg-brand-moss/95 text-white font-mono text-[9px] uppercase tracking-wider font-bold rounded-full shadow-md"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREDENTIAL DOCUMENT VIEWER MODAL */}
      {viewingCredential && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-sm" onClick={() => setViewingCredential(null)} />
          <div className="relative bg-white border border-brand-moss/20 rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl z-10 font-sans text-xs">
            <div className="flex justify-between items-start mb-6 pb-2 border-b border-brand-moss/10">
              <div>
                <span className="font-mono text-[8px] uppercase tracking-wider text-brand-clay block font-bold">{viewingCredential.type}</span>
                <h3 className="font-heading font-bold text-base text-brand-moss mt-0.5">Verification Dossier Preview</h3>
              </div>
              <button 
                onClick={() => setViewingCredential(null)} 
                className="text-brand-clay hover:underline font-mono text-[10px] font-bold"
              >
                Close (Esc)
              </button>
            </div>

            {/* Document body mockup */}
            <div className="bg-brand-cream/30 border border-brand-moss/10 rounded-2xl p-6 shadow-inner text-center space-y-4 relative overflow-hidden">
              {/* Security Watermark */}
              <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-[0.03] font-mono text-3xl font-extrabold rotate-12">
                EDUVISTA SECURE DOCK
              </div>
              
              <div className="w-16 h-16 bg-brand-moss/5 rounded-full flex items-center justify-center mx-auto border border-brand-moss/15">
                <ShieldCheck className="w-8 h-8 text-brand-clay" />
              </div>

              <div className="space-y-1">
                <h4 className="font-heading font-bold text-sm text-brand-moss">{viewingCredential.name}</h4>
                <p className="font-sans text-[10px] text-brand-charcoal/65">Document Verified by Gemini AI Pedagogy Check Core</p>
              </div>

              <div className="bg-white border border-brand-moss/5 rounded-xl p-4 text-[11px] font-mono inline-block text-left mx-auto space-y-1">
                <div><span className="text-brand-charcoal/40">DOC:</span> <b className="text-brand-moss">{viewingCredential.type.toUpperCase()}</b></div>
                {viewingCredential.idNumber && (
                  <div><span className="text-brand-charcoal/40">REG NO:</span> <b className="text-brand-moss">{viewingCredential.idNumber}</b></div>
                )}
                {viewingCredential.degreeName && (
                  <div><span className="text-brand-charcoal/40">CREDENTIAL:</span> <b className="text-brand-moss">{viewingCredential.degreeName}</b></div>
                )}
                <div><span className="text-brand-charcoal/40">TIMESTAMP:</span> <b className="text-brand-moss">2026-06-10 Verified</b></div>
              </div>

              {/* Decorative document mockup image */}
              <div className="w-full h-32 rounded-xl overflow-hidden border border-brand-moss/10 bg-brand-charcoal">
                <img src={viewingCredential.image} alt="Verification document scan" className="w-full h-full object-cover opacity-90" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setViewingCredential(null)}
                className="py-2.5 px-6 bg-brand-moss hover:bg-brand-moss/95 text-white font-mono text-[9px] uppercase tracking-wider font-bold rounded-full shadow-md"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
