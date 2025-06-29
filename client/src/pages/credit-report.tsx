import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronUp,
  Brain,
  Zap,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ArrowUp,
  Info,
} from 'lucide-react';

// Credit Report Components
import { CreditReportHeader } from '@/components/credit-report/header';
import { AccountRow } from '@/components/credit-report/account-row';
import { PublicRecordRow } from '@/components/credit-report/public-record-row';
import { Inquiries } from '@/components/credit-report/inquiries-working';
import { PersonalInfo } from '@/components/credit-report/personal-info';
import { CreditSummary } from '@/components/credit-report/credit-summary';
import { CompletionCenter } from '@/components/credit-report/completion-center';
import { DisputeModal } from '@/components/credit-report/dispute-modal';
import { RippleLoader } from '@/components/ui/ripple-loader';

// Utilities and Data
import { parseCreditReport } from '@/lib/credit-data';

// Import bureau logos and score gauge
import transUnionLogo from '../assets/transunion-logo.png';
import equifaxLogo from '../assets/equifax-logo.png';
import experianLogo from '../assets/experian-logo.png';
import scoreGaugeArc from '../assets/score-gauge-arc.png';

export default function CreditReportPage() {
  // Core data state
  const [creditData, setCreditData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dispute management state
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [savedDisputes, setSavedDisputes] = useState<{
    [accountId: string]: boolean | { reason: string; instruction: string; violations?: string[] };
  }>({});

  // AI scanning state
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiViolations, setAiViolations] = useState<{ [accountId: string]: string[] }>({});
  const [aiScanCompleted, setAiScanCompleted] = useState(false);
  const [aiScanDismissed, setAiScanDismissed] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [aiSummaryData, setAiSummaryData] = useState<{
    totalViolations: number;
    affectedAccounts: number;
  }>({
    totalViolations: 0,
    affectedAccounts: 0,
  });

  // Hard Inquiries auto-collapse state
  type SavedInquiry = { bureau: 'TU' | 'EQ' | 'EX'; isRecent: boolean };
  const [savedInquiries, setSavedInquiries] = useState<Record<string, SavedInquiry>>({});
  const [hardCollapsed, setHardCollapsed] = useState(false);

  // UI state management
  const [showPositiveAccounts, setShowPositiveAccounts] = useState(false);
  const [showNegativeAccounts, setShowNegativeAccounts] = useState(false);
  const [showPublicRecords, setShowPublicRecords] = useState(false);
  const [showHardInquiries, setShowHardInquiries] = useState(false);
  const [showCreditSummary, setShowCreditSummary] = useState(false);
  const [expandAll, setExpandAll] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [negativeAccountsCollapsed, setNegativeAccountsCollapsed] = useState(false);
  const [userHasManuallyExpanded, setUserHasManuallyExpanded] = useState(false);

  // Refs for scroll behavior
  const negativeAccountsRef = useRef<HTMLDivElement>(null);
  const hardInquiriesRef = useRef<HTMLDivElement>(null);

  // Load credit data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/donald-blair-credit-report.json');
        const rawData = await response.json();
        const parsedData = parseCreditReport(rawData);
        setCreditData(parsedData);
      } catch (error) {
        console.error('Error loading credit data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Detect when all negative accounts are saved and auto-collapse
  useEffect(() => {
    if (!creditData || negativeAccountsCollapsed) {
      return;
    }

    const accounts = creditData.CREDIT_RESPONSE?.CREDIT_LIABILITY || [];
    const negativeAccounts = accounts.filter((account: any) => {
      return (
        account['@_DerogatoryDataIndicator'] === 'Y' ||
        account['@IsCollectionIndicator'] === 'Y' ||
        account['@IsChargeoffIndicator'] === 'Y' ||
        (account['@_PastDueAmount'] && parseInt(account['@_PastDueAmount']) > 0) ||
        (account._CURRENT_RATING && ['7', '8', '9'].includes(account._CURRENT_RATING['@_Code'])) ||
        (account['@_ChargeOffDate'] && account['@_ChargeOffDate'] !== '')
      );
    });

    if (negativeAccounts.length === 0) {
      return;
    }

    const allNegativeAccountsSaved = negativeAccounts.every((account: any) => {
      const accountId =
        account['@CreditLiabilityID'] ||
        account['@_AccountNumber'] ||
        account['@_AccountIdentifier'];
      return savedDisputes[accountId];
    });

    if (allNegativeAccountsSaved && !negativeAccountsCollapsed && !userHasManuallyExpanded) {
      // First: Scroll to Negative Accounts section BEFORE collapse
      if (negativeAccountsRef.current) {
        negativeAccountsRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        // Offset by 20px after a brief delay to ensure scrollIntoView completes
        setTimeout(() => {
          window.scrollBy(0, -20);
        }, 100);
      }

      // Then: Collapse after scroll completes (~400ms delay)
      setTimeout(() => {
        setNegativeAccountsCollapsed(true);
      }, 400);
    }
  }, [savedDisputes, creditData, negativeAccountsCollapsed]);

  // Hard Inquiries auto-collapse effect
  useEffect(() => {
    const anyRecent = Object.values(savedInquiries).some((x) => x.isRecent);
    if (!hardCollapsed && anyRecent) {
      setTimeout(() => {
        hardInquiriesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.scrollBy(0, -20);
        setHardCollapsed(true);
        console.log('🔔 HARD INQUIRIES COLLAPSED');
      }, 500);
    }
  }, [savedInquiries, hardCollapsed]);

  // Event handlers
  const handleAccountDispute = (account: any) => {
    setSelectedAccount(account);
    setIsDisputeModalOpen(true);
  };

  const handleDisputeSaved = (
    accountId: string,
    disputeData?: { reason: string; instruction: string; violations?: string[] }
  ) => {
    setSavedDisputes((prev) => ({
      ...prev,
      [accountId]: disputeData || true,
    }));
  };

  const handleDisputeReset = (accountId: string) => {
    setSavedDisputes((prev) => {
      const newDisputes = { ...prev };
      delete newDisputes[accountId];
      return newDisputes;
    });
  };

  const handleContinueToWizard = () => {
    console.log('Continuing to wizard...');
  };

  const handleShowDisputeItems = () => {
    console.log('Showing dispute items...');
  };

  // Hard Inquiries callback handlers
  const handleInquirySaved = (id: string, bureau: 'TU' | 'EQ' | 'EX', isRecent: boolean) => {
    console.log(`✅ SAVE-HANDLER (${isRecent ? 'recent' : 'older'}): ${id}`);
    setSavedInquiries((prev) => ({ ...prev, [id]: { bureau, isRecent } }));
  };

  const handleInquiryReset = (id: string) => {
    console.log(`🧹 RESET-HANDLER: ${id}`);
    setSavedInquiries((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleAiScan = async () => {
    setIsAiScanning(true);

    // Add 5 second delay to make it feel like AI is thinking
    await new Promise((resolve) => setTimeout(resolve, 5000));

    try {
      // Call the real AI scan API with credit data
      const response = await fetch('/api/ai-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ creditData }),
      });

      if (response.ok) {
        const violations = await response.json();

        // Count total violations and affected accounts
        let totalViolations = 0;
        let affectedAccounts = 0;

        Object.keys(violations).forEach((accountId) => {
          if (violations[accountId] && violations[accountId].length > 0) {
            totalViolations += violations[accountId].length;
            affectedAccounts++;
          }
        });

        setAiViolations(violations);
        setAiSummaryData({ totalViolations, affectedAccounts });
        setAiScanCompleted(true);
        setShowAiSummary(true);
      } else {
        console.error('AI scan failed:', response.statusText);
        // Fallback to show no violations found
        setAiViolations({});
        setAiSummaryData({ totalViolations: 0, affectedAccounts: 0 });
        setShowAiSummary(true);
      }
    } catch (error) {
      console.error('AI scan error:', error);
      // Fallback to show no violations found
      setAiViolations({});
      setAiSummaryData({ totalViolations: 0, affectedAccounts: 0 });
      setShowAiSummary(true);
    }

    setIsAiScanning(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <RippleLoader />
      </div>
    );
  }

  // Function to determine if an account is closed
  const isClosedAccount = (account: any) => {
    // Check for closed account status
    const accountStatus = account['@_AccountStatusType'];
    if (
      accountStatus &&
      (accountStatus.toLowerCase().includes('closed') ||
        accountStatus.toLowerCase().includes('paid') ||
        accountStatus === 'C')
    )
      return true;

    // Check for closed date
    if (account['@_AccountClosedDate']) return true;

    // Check current rating for closed accounts
    const currentRating = account._CURRENT_RATING?.['@_Code'];
    if (currentRating && currentRating === 'C') return true;

    return false;
  };

  // Get data arrays
  const accounts = creditData?.CREDIT_RESPONSE?.CREDIT_LIABILITY || [];
  const positiveAccounts = accounts
    .filter((account: any) => account['@_DerogatoryDataIndicator'] !== 'Y')
    .sort((a: any, b: any) => {
      const aIsClosed = isClosedAccount(a);
      const bIsClosed = isClosedAccount(b);
      
      // Open accounts first, closed accounts last
      if (aIsClosed && !bIsClosed) return 1;
      if (!aIsClosed && bIsClosed) return -1;
      return 0;
    });
  const negativeAccounts = accounts.filter(
    (account: any) => account['@_DerogatoryDataIndicator'] === 'Y'
  );

  // Create enhanced public records from credit data
  const publicRecordsFromCredit = accounts
    .filter(
      (account: any) =>
        account['@_AccountType'] &&
        ['13', '14', '15', '16', '93', '94', '95'].includes(account['@_AccountType'])
    )
    .map((account: any) => ({
      ...account,
      '@publicRecordType':
        account['@_AccountType'] === '93'
          ? 'BANKRUPTCY'
          : account['@_AccountType'] === '94'
            ? 'TAX LIEN'
            : account['@_AccountType'] === '95'
              ? 'JUDGMENT'
              : 'PUBLIC RECORD',
      '@courtName': account['@_SubscriberName'] || 'Court Name Not Available',
      '@courtAddress': 'Court Address Not Available',
      caseNumber: account['@_AccountNumber'] || 'Case Number Not Available',
      filingDate: account['@_AccountOpenedDate'] || 'Filing Date Not Available',
      status: account['@_AccountStatusType'] || 'Status Not Available',
    }));

  // Get public records from the existing structure if available
  const existingPublicRecords = creditData?.CREDIT_RESPONSE?.CREDIT_PUBLIC_RECORD || [];

  // Combine both sources, giving priority to existing public records
  const allPublicRecords = [...existingPublicRecords, ...publicRecordsFromCredit];

  // Show all public records (they are typically negative by nature)
  const publicRecords = allPublicRecords.length > 0 ? allPublicRecords : publicRecordsFromCredit;

  const hasPublicRecords = publicRecords && publicRecords.length > 0;

  // Calculate recent inquiries count (inquiries within 24 months)
  const calculateRecentInquiriesCount = () => {
    const inquiries = creditData?.CREDIT_RESPONSE?.CREDIT_INQUIRY || [];
    const inquiriesArray = Array.isArray(inquiries) ? inquiries : [inquiries];

    const currentDate = new Date('2025-06-18'); // Use consistent report date
    const cutoffDate = new Date(currentDate);
    cutoffDate.setMonth(cutoffDate.getMonth() - 24); // 24 months ago

    return inquiriesArray.filter((inquiry: any) => {
      const inquiryDate = new Date(inquiry['@_Date']);
      return inquiryDate >= cutoffDate;
    }).length;
  };

  const recentInquiriesCount = calculateRecentInquiriesCount();

  // Calculate total inquiries count
  const getTotalInquiriesCount = () => {
    const inquiries = creditData?.CREDIT_RESPONSE?.CREDIT_INQUIRY || [];
    const inquiriesArray = Array.isArray(inquiries) ? inquiries : [inquiries];
    return inquiriesArray.length;
  };

  const totalInquiriesCount = getTotalInquiriesCount();

  // Calculate counts
  const disputeReasons = [
    'This account does not belong to me',
    'Account information is inaccurate',
    'Payment history is incorrect',
    'Account should be closed/paid',
    'Duplicate account reporting',
    'Identity theft/fraud account',
    'Settled account still showing balance',
    'Account beyond statute of limitations',
    'Incorrect dates (opened/closed/last activity)',
    'Unauthorized charges on this account',
  ];

  const disputeInstructions = [
    'Please remove this inaccurate information immediately',
    'Verify and correct all account details',
    'Update payment history to reflect accurate information',
    'Remove this account as it has been paid in full',
    'Delete this duplicate entry from my credit report',
    'Remove this fraudulent account immediately',
    'Update account to show zero balance',
    'Remove this time-barred account',
    'Correct all dates associated with this account',
    'Remove all unauthorized charges and related negative marks',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-2 px-4">
        {/* Header */}
        <CreditReportHeader />

        {/* Name Section */}
        <div className="text-center mb-4 mt-6">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-1 tracking-tight">
            {creditData
              ? `${creditData.CREDIT_RESPONSE.BORROWER['@_FirstName']} ${creditData.CREDIT_RESPONSE.BORROWER['@_LastName']}`
              : 'DONALD BLAIR'}
          </h1>
          <p className="text-slate-600 text-base font-medium">
            SSN:{' '}
            {creditData &&
            creditData.CREDIT_RESPONSE.BORROWER['@_SSN'] &&
            creditData.CREDIT_RESPONSE.BORROWER['@_SSN'] !== 'XXXXXXXXX'
              ? `XXX-XX-${creditData.CREDIT_RESPONSE.BORROWER['@_SSN'].slice(-4)}`
              : 'XXX-XX-XXXX'}
          </p>
        </div>

        {/* AI-Powered Compliance Scan */}
        <div className="mb-8">
          <div className="flex justify-center">
            {!showAiSummary && !isAiScanning && !aiScanDismissed && (
              <Button
                onClick={handleAiScan}
                className="bg-blue-700 hover:bg-blue-800 border-2 border-blue-700 hover:border-blue-800 text-white font-semibold text-lg px-6 py-3 rounded-lg shadow-lg transition-all duration-300 hover:scale-105 min-w-[280px] flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                AI Metro 2 / Compliance Scan
              </Button>
            )}

            {!showAiSummary && !isAiScanning && aiScanDismissed && (
              <div className="flex items-center justify-center bg-green-50 border border-green-200 rounded-lg px-4 py-2 max-w-md">
                <div className="flex items-center gap-2 text-green-700">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span className="text-sm font-medium">AI scan completed</span>
                  <span className="text-xs text-green-600">• View dispute suggestions below</span>
                </div>
              </div>
            )}

            {isAiScanning && (
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-lg font-semibold text-blue-600">
                    AI is scanning your credit report...
                  </span>
                </div>
                <p className="text-sm text-gray-600 text-center max-w-md">
                  Examining all accounts, inquiries, and public records for compliance violations
                  and generating dispute suggestions
                </p>
              </div>
            )}

            {showAiSummary && (
              <Card className="w-full max-w-2xl border-2 border-blue-200 bg-blue-50">
                <CardHeader className="text-center">
                  <h3 className="text-xl font-bold text-blue-800 flex items-center justify-center gap-2">
                    <Zap className="w-6 h-6" />
                    AI Metro 2 / Compliance Scan Complete
                  </h3>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="text-2xl font-bold text-blue-700">
                        {aiSummaryData.totalViolations}
                      </div>
                      <div className="text-sm text-gray-600">Total Violations Found</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="text-2xl font-bold text-blue-700">
                        {aiSummaryData.affectedAccounts}
                      </div>
                      <div className="text-sm text-gray-600">Accounts Affected</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Metro 2, FCRA, and FDCPA violations detected. View accounts below for AI dispute
                    suggestions.
                  </p>
                  <Button
                    onClick={() => {
                      setShowAiSummary(false);
                      setAiScanDismissed(true);
                    }}
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100 hover:text-blue-900"
                  >
                    Got it, hide this
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Credit Scores */}
        <div className="mb-12 mt-12" data-section="credit-scores">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-gray-900">Credit Scores</h3>
            </div>
          </div>

          {/* Compact Score Gauges */}
          <div className="mb-6">
            <Card className="border-2 border-gray-200 bg-white p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* TransUnion - Circular Gauge */}
                <div className="space-y-3 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
                  <div className="flex items-start justify-center h-10 mb-2 -mt-1">
                    <img
                      src={transUnionLogo}
                      alt="TransUnion"
                      className="h-9 object-contain -mt-1"
                    />
                  </div>

                  {/* Score Gauge with PNG */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-48 h-24 mb-3">
                      <img
                        src={scoreGaugeArc}
                        alt="Score Gauge"
                        className="w-full h-full object-contain"
                      />

                      {/* Very Good text - positioned above score but under arc */}
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center"
                        style={{ marginBottom: '20px' }}
                      >
                        <div className="text-xs font-semibold text-gray-500">Very Good</div>
                      </div>

                      {/* Score in center */}
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-end"
                        style={{ marginBottom: '-5px' }}
                      >
                        <div className="text-5xl font-black text-gray-700">742</div>
                      </div>

                      {/* Score Change Badge - Top Right */}
                      <div className="absolute -top-1 -right-1 bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                        +12
                      </div>
                    </div>

                    {/* Starting Score Text */}
                    <div className="text-sm font-medium text-gray-600 mt-2">
                      Starting Score: 590
                    </div>
                  </div>
                </div>

                {/* Equifax - Circular Gauge */}
                <div className="space-y-3 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
                  <div className="flex items-start justify-center h-10 mb-2 -mt-1">
                    <img src={equifaxLogo} alt="Equifax" className="h-6 object-contain mt-1" />
                  </div>

                  {/* Score Gauge with PNG */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-48 h-24 mb-3">
                      <img
                        src={scoreGaugeArc}
                        alt="Score Gauge"
                        className="w-full h-full object-contain"
                      />

                      {/* Fair text - positioned above score but under arc */}
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center"
                        style={{ marginBottom: '20px' }}
                      >
                        <div className="text-xs font-semibold text-gray-500">Fair</div>
                      </div>

                      {/* Score in center */}
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-end"
                        style={{ marginBottom: '-5px' }}
                      >
                        <div className="text-5xl font-black text-gray-700">687</div>
                      </div>

                      {/* Score Change Badge - Top Right */}
                      <div className="absolute -top-1 -right-1 bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                        +18
                      </div>
                    </div>

                    {/* Starting Score Text */}
                    <div className="text-sm font-medium text-gray-600 mt-2">
                      Starting Score: 590
                    </div>
                  </div>
                </div>

                {/* Experian - Circular Gauge */}
                <div className="space-y-3">
                  <div className="flex items-start justify-center h-10 mb-2 -mt-1">
                    <img src={experianLogo} alt="Experian" className="h-9 object-contain" />
                  </div>

                  {/* Score Gauge with PNG */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-48 h-24 mb-3">
                      <img
                        src={scoreGaugeArc}
                        alt="Score Gauge"
                        className="w-full h-full object-contain"
                      />

                      {/* Very Good text - positioned above score but under arc */}
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center"
                        style={{ marginBottom: '20px' }}
                      >
                        <div className="text-xs font-semibold text-gray-500">Very Good</div>
                      </div>

                      {/* Score in center */}
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-end"
                        style={{ marginBottom: '-5px' }}
                      >
                        <div className="text-5xl font-black text-gray-700">756</div>
                      </div>

                      {/* Score Change Badge - Top Right */}
                      <div className="absolute -top-1 -right-1 bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                        +15
                      </div>
                    </div>

                    {/* Starting Score Text */}
                    <div className="text-sm font-medium text-gray-600 mt-2">
                      Starting Score: 590
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Credit Summary Section */}
        <div className="mb-4">
          <Card
            className={`${showCreditSummary ? 'border-2 border-gray-300' : 'border border-gray-200'} transition-all duration-300 hover:shadow-lg`}
          >
            <CardHeader
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => setShowCreditSummary(!showCreditSummary)}
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                    CS
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Credit Summary</h3>
                    <p className="text-sm text-gray-600">
                      Summary of credit accounts, balances, and score impact
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600">3 Bureaus</span>
                  {showCreditSummary ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>
            </CardHeader>
            {showCreditSummary && (
              <CardContent>
                <CreditSummary creditData={creditData} />
              </CardContent>
            )}
          </Card>
        </div>

        {/* Personal Information Section */}
        <div className="mb-4 overflow-visible">
          <PersonalInfo
            borrower={creditData?.CREDIT_RESPONSE?.BORROWER || {}}
            reportInfo={creditData?.CREDIT_RESPONSE || {}}
          />
        </div>

        {/* Hard Inquiries Section */}
        <div className="mb-4" ref={hardInquiriesRef}>
          {hardCollapsed ? (
            <Card className="border-2 border-green-300 bg-green-50 transition-all duration-300">
              <CardContent
                className="p-6 cursor-pointer hover:bg-green-100"
                onClick={() => {
                  setHardCollapsed(false);
                  console.log('↩️ HARD INQUIRIES EXPANDED');
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-green-800">Hard Inquiries Complete</h3>
                    <p className="text-sm text-green-700">
                      You've saved disputes for{' '}
                      {Object.values(savedInquiries).filter((x) => x.isRecent).length} recent
                      inquiry(ies) across TransUnion, Equifax, and Experian
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card
              className={`${showHardInquiries ? 'border-2 border-gray-300' : 'border border-gray-200'} transition-all duration-300 hover:shadow-lg`}
            >
              <CardHeader
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setShowHardInquiries(!showHardInquiries)}
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full gauge-orange flex items-center justify-center text-white text-sm font-bold">
                      {recentInquiriesCount}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Hard Inquiries</h3>
                      <p className="text-sm text-gray-600">
                        Inquiries older than 24 months do not impact the score
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600">{totalInquiriesCount} items</span>
                    {showHardInquiries ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>
              </CardHeader>
              {showHardInquiries && (
                <CardContent>
                  <Inquiries
                    creditData={creditData}
                    onDisputeSaved={handleDisputeSaved}
                    onDisputeReset={handleDisputeReset}
                    onHeaderReset={() => {}}
                    savedDisputes={savedDisputes}
                    onInquirySaved={handleInquirySaved}
                    onInquiryReset={handleInquiryReset}
                  />
                </CardContent>
              )}
            </Card>
          )}
        </div>

        {/* Positive & Closed Accounts Section */}
        <div className="mb-4">
          <Card
            className={`${showPositiveAccounts ? 'border-2 border-gray-300' : 'border border-gray-200'} transition-all duration-300 hover:shadow-lg`}
          >
            <CardHeader
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => setShowPositiveAccounts(!showPositiveAccounts)}
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full gauge-green flex items-center justify-center text-white text-sm font-bold">
                    {positiveAccounts.length}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Positive & Closed Accounts</h3>
                    <p className="text-sm text-gray-600">
                      Accounts in good standing helping your credit score
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600">{positiveAccounts.length} accounts</span>
                  {showPositiveAccounts ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>
            </CardHeader>
            {showPositiveAccounts && (
              <CardContent className="pt-2">
                <div className="space-y-6">
                  <div className="flex justify-end items-center mb-0">
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        onClick={() => setExpandAll(!expandAll)}
                      >
                        {expandAll ? 'Collapse All' : 'Expand All'}
                      </button>
                      <button
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        onClick={() => setShowAllDetails(!showAllDetails)}
                      >
                        {showAllDetails ? 'Hide Details' : 'Show All Details'}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {positiveAccounts.map((account: any, index: number) => {
                      console.log(`📋 Rendering Positive Account: ${account['@CreditLiabilityID']} with unified structure`);
                      return (
                        <AccountRow
                          key={`positive-${account['@CreditLiabilityID'] || account['@_AccountNumber'] || account['@_AccountIdentifier'] || index}`}
                          account={account}
                          aiViolations={aiViolations[account['@CreditLiabilityID']] || []}
                          disputeReasons={disputeReasons}
                          disputeInstructions={disputeInstructions}
                          onDisputeSaved={handleDisputeSaved}
                          onDisputeReset={handleDisputeReset}
                          expandAll={expandAll}
                          showAllDetails={showAllDetails}
                          aiScanCompleted={aiScanCompleted}
                          savedDisputes={savedDisputes}
                          isFirstInConnectedSection={false}
                          allNegativeAccountsSaved={false}
                        />
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Negative Accounts Section */}
        <div className="mb-4 overflow-visible" ref={negativeAccountsRef}>
          {negativeAccountsCollapsed ? (
            // Collapsed Success View
            <div className="ring-4 ring-red-500 bg-white p-4 rounded-xl">
              <Card className="border-2 border-green-500 bg-green-50 transition-all duration-300 hover:shadow-lg">
                <CardHeader
                  className="cursor-pointer hover:bg-green-100"
                  onClick={() => {
                    setNegativeAccountsCollapsed(false);
                    setShowNegativeAccounts(true);
                    setUserHasManuallyExpanded(true);
                  }}
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-green-800">
                          Negative Accounts – Disputes Saved
                        </h3>
                        <p className="text-sm text-green-600">
                          {(() => {
                            const accounts = creditData?.CREDIT_RESPONSE?.CREDIT_LIABILITY || [];
                            const negativeAccountsData = accounts.filter((account: any) => {
                              return (
                                account['@_DerogatoryDataIndicator'] === 'Y' ||
                                account['@IsCollectionIndicator'] === 'Y' ||
                                account['@IsChargeoffIndicator'] === 'Y' ||
                                (account['@_PastDueAmount'] &&
                                  parseInt(account['@_PastDueAmount']) > 0) ||
                                (account._CURRENT_RATING &&
                                  ['7', '8', '9'].includes(account._CURRENT_RATING['@_Code'])) ||
                                (account['@_ChargeOffDate'] && account['@_ChargeOffDate'] !== '')
                              );
                            });
                            const accountCount = negativeAccountsData.length;
                            return `You've saved disputes for ${accountCount} negative accounts across TransUnion, Equifax, and Experian.`;
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-green-600">
                        {(() => {
                          const accounts = creditData?.CREDIT_RESPONSE?.CREDIT_LIABILITY || [];
                          const negativeAccountsData = accounts.filter((account: any) => {
                            return (
                              account['@_DerogatoryDataIndicator'] === 'Y' ||
                              account['@IsCollectionIndicator'] === 'Y' ||
                              account['@IsChargeoffIndicator'] === 'Y' ||
                              (account['@_PastDueAmount'] &&
                                parseInt(account['@_PastDueAmount']) > 0) ||
                              (account._CURRENT_RATING &&
                                ['7', '8', '9'].includes(account._CURRENT_RATING['@_Code'])) ||
                              (account['@_ChargeOffDate'] && account['@_ChargeOffDate'] !== '')
                            );
                          });
                          return `${negativeAccountsData.length} Accounts`;
                        })()}
                      </span>
                      <ChevronDown className="text-green-600" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          ) : (
            // Normal Expanded View
            <Card
              className={`${showNegativeAccounts ? 'border-2 border-gray-300' : 'border border-gray-200'} transition-all duration-300 hover:shadow-lg`}
            >
              <CardHeader
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setShowNegativeAccounts(!showNegativeAccounts)}
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full gauge-red flex items-center justify-center text-white text-sm font-bold">
                      {negativeAccounts.length}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Negative Accounts</h3>
                      <p className="text-sm text-gray-600">
                        Accounts that may be negatively impacting your credit score
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600">
                      {negativeAccounts.length} accounts
                    </span>
                    {showNegativeAccounts ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>
              </CardHeader>
              {showNegativeAccounts && (
                <CardContent className="pt-3">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm text-gray-600 font-bold">
                        Complete steps 1-2-3 for each account below to dispute negative items
                      </p>
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                          onClick={() => setShowAllDetails(!showAllDetails)}
                        >
                          {showAllDetails ? 'Hide Details' : 'Show All Details'}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-6">
                      {negativeAccounts.map((account: any, index: number) => {
                        console.log(`📋 Rendering Negative Account: ${account['@CreditLiabilityID']} with unified structure`);
                        return (
                          <AccountRow
                            key={`negative-${account['@CreditLiabilityID'] || account['@_AccountNumber'] || account['@_AccountIdentifier'] || index}`}
                            account={account}
                            aiViolations={aiViolations[account['@CreditLiabilityID']] || []}
                            disputeReasons={disputeReasons}
                            disputeInstructions={disputeInstructions}
                            onDisputeSaved={handleDisputeSaved}
                            onDisputeReset={handleDisputeReset}
                            onHeaderReset={() => {}}
                            expandAll={expandAll}
                            showAllDetails={showAllDetails}
                            aiScanCompleted={aiScanCompleted}
                            savedDisputes={savedDisputes}
                            isFirstInConnectedSection={index === 0}
                            allNegativeAccountsSaved={negativeAccounts.every(
                              (acc: any) =>
                                savedDisputes[
                                  acc['@CreditLiabilityID'] ||
                                    acc['@_AccountNumber'] ||
                                    acc['@_AccountIdentifier']
                                ]
                            )}
                          />
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </div>

        {/* Public Records Section */}
        {hasPublicRecords && (
          <div className="mb-4">
            <Card
              className={`${showPublicRecords ? 'border-2 border-gray-300' : 'border border-gray-200'} transition-all duration-300 hover:shadow-lg`}
            >
              <CardHeader
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setShowPublicRecords(!showPublicRecords)}
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full gauge-red flex items-center justify-center text-white text-sm font-bold">
                      {publicRecords.length}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Public Records</h3>
                      <p className="text-sm text-gray-600">
                        Court records, liens, and judgments on your credit report
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600">{publicRecords.length} records</span>
                    {showPublicRecords ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>
              </CardHeader>
              {showPublicRecords && (
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="flex flex-col gap-6">
                      {publicRecords.map((record: any, index: number) => {
                        console.log(`📋 Rendering Public Record: ${record.id || record['@CreditLiabilityID']} with unified structure`);
                        return (
                          <PublicRecordRow
                            key={`public-record-${record['@CreditLiabilityID'] || record['@_SubscriberCode'] || index}`}
                            record={record}
                            onDispute={() => {}}
                            onDisputeSaved={handleDisputeSaved}
                            onDisputeReset={handleDisputeReset}
                            onHeaderReset={() => {}}
                            expandAll={expandAll}
                          />
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* Completion Center */}
        <div className="mb-12 mt-12">
          <CompletionCenter
            onContinueToWizard={handleContinueToWizard}
            onShowDisputeItems={handleShowDisputeItems}
          />
        </div>

        <DisputeModal
          isOpen={isDisputeModalOpen}
          onClose={() => setIsDisputeModalOpen(false)}
          accounts={accounts}
          selectedAccount={selectedAccount}
        />
      </div>
    </div>
  );
}
