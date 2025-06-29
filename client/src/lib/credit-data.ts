import creditReportData from '../../../data/donald-blair-credit-report.json';

// Normalize trade data to unified field names
function normaliseTrade(raw: any) {
  const balance =
    raw['@_UnpaidBalanceAmount'] ??
    raw['@_HighBalanceAmount'] ??
    raw['@_CreditLimitAmount'] ??
    0;

  return {
    ...raw,
    BalanceAmount: +balance,
    AccountStatusCode:
      raw['@_AccountStatusType'] ?? raw['@RawAccountStatus'] ?? 'Unknown',
    AccountOpenedDate: raw['@_AccountOpenedDate'] ?? null,
    AccountReportedDate:
      raw['@_AccountReportedDate'] ?? raw['@_AccountStatusDate'] ?? null,
  };
}

// Credit report parsing with trade normalization
export function parseCreditReport(data?: any) {
  try {
    const rawData = data || creditReportData;
    
    // Normalize trade data if it exists
    if (rawData?.CREDIT_RESPONSE?.CREDIT_LIABILITY) {
      const normalizedData = {
        ...rawData,
        CREDIT_RESPONSE: {
          ...rawData.CREDIT_RESPONSE,
          CREDIT_LIABILITY: rawData.CREDIT_RESPONSE.CREDIT_LIABILITY.map(normaliseTrade)
        }
      };
      return normalizedData;
    }
    
    return rawData;
  } catch (error) {
    console.error('Failed to parse credit report data:', error);
    return null;
  }
}

// Currency formatting
export function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) return '$0';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(num);
}

// Date formatting
export function formatDate(dateString: string): string {
  if (!dateString?.trim()) return 'N/A';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';

  return date.toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  });
}

export function getPaymentPatternVisualization(pattern: string) {
  return pattern.split('').map((char, index) => ({
    id: index,
    status: char,
    color: getPatternColor(char),
    title: getPatternTitle(char),
  }));
}

function getPatternColor(char: string): string {
  switch (char) {
    case 'C':
      return 'bg-green-500'; // Current
    case '1':
      return 'bg-yellow-500'; // 30 days late
    case '2':
      return 'bg-orange-500'; // 60 days late
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
      return 'bg-red-500'; // 90+ days late
    case 'X':
      return 'bg-gray-300'; // No data
    default:
      return 'bg-gray-300';
  }
}

function getPatternTitle(char: string): string {
  switch (char) {
    case 'C':
      return 'Current';
    case '1':
      return '30 days late';
    case '2':
      return '60 days late';
    case '3':
      return '90 days late';
    case '4':
      return '120 days late';
    case '5':
      return '150 days late';
    case '6':
      return '180 days late';
    case '7':
      return '210+ days late';
    case 'X':
      return 'No data';
    default:
      return 'Unknown';
  }
}

export function getAccountTypeIcon(accountType: string): string {
  switch (accountType.toLowerCase()) {
    case 'mortgage':
      return 'fas fa-home';
    case 'creditcard':
    case 'credit card':
      return 'fas fa-credit-card';
    case 'auto':
    case 'automobile':
      return 'fas fa-car';
    case 'student':
      return 'fas fa-graduation-cap';
    default:
      return 'fas fa-file-invoice-dollar';
  }
}

export function getAccountStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-green-500';
    case 'closed':
      return 'bg-gray-500';
    case 'charged off':
    case 'chargeoff':
      return 'bg-red-500';
    case 'collection':
      return 'bg-red-600';
    default:
      return 'bg-blue-500';
  }
}

export function calculatePaymentHistoryStats(accounts: any[]) {
  let totalLate30 = 0;
  let totalLate60 = 0;
  let totalLate90 = 0;
  const totalAccounts = accounts.length;

  accounts.forEach((account) => {
    if (account._LATE_COUNT) {
      totalLate30 += parseInt(account._LATE_COUNT['@_30Days'] || '0');
      totalLate60 += parseInt(account._LATE_COUNT['@_60Days'] || '0');
      totalLate90 += parseInt(account._LATE_COUNT['@_90Days'] || '0');
    }
  });

  const totalLatePayments = totalLate30 + totalLate60 + totalLate90;
  const onTimeRate =
    totalAccounts > 0 ? Math.max(0, 100 - (totalLatePayments / totalAccounts) * 10) : 100;

  return {
    totalLate30,
    totalLate60,
    totalLate90,
    totalLatePayments,
    onTimeRate: Math.round(onTimeRate),
    totalAccounts,
  };
}
