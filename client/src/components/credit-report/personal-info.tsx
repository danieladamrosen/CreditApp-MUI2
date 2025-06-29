import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  MapPin,
  Calendar,
  Shield,
  Phone,
  Building,
  Users,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowDown,
  Briefcase,
} from 'lucide-react';

interface PersonalInfoProps {
  borrower: {
    '@_FirstName': string;
    '@_LastName': string;
    '@_MiddleName'?: string;
    '@_BirthDate': string;
    '@_SSN': string;
    '@_UnparsedName'?: string;
    _RESIDENCE: Array<{
      '@_StreetAddress': string;
      '@_City': string;
      '@_State': string;
      '@_PostalCode': string;
      '@BorrowerResidencyType': string;
    }>;
  };
  reportInfo: {
    '@CreditResponseID': string;
    '@CreditReportFirstIssuedDate': string;
  };
  onDisputeSaved?: (data: {
    reason: string;
    instruction: string;
    selectedItems: { [key: string]: boolean };
  }) => void;
  onHeaderReset?: () => void;
  initialSelections?: { [key: string]: boolean };
  initialDisputeData?: { reason: string; instruction: string; selectedItems: string[] } | null;
  forceExpanded?: boolean;
}

export function PersonalInfo({
  borrower,
  reportInfo,
  onDisputeSaved,
  onHeaderReset,
  initialSelections = {},
  initialDisputeData = null,
  forceExpanded = false,
}: PersonalInfoProps) {
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: boolean }>({});
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [selectedInstruction, setSelectedInstruction] = useState<string>('');
  const [isDisputeSaved, setIsDisputeSaved] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [isTypingReason, setIsTypingReason] = useState<boolean>(false);
  const [isTypingInstruction, setIsTypingInstruction] = useState<boolean>(false);
  const [showGuideArrow, setShowGuideArrow] = useState<boolean>(false);

  // Define dispute templates
  const disputeReasons = [
    'This personal information is incorrect',
    'This address is wrong or outdated',
    'This is not my information',
    'Incomplete or missing information',
    'Identity verification error',
  ];

  const disputeInstructions = [
    'Please remove this incorrect information from my credit report immediately',
    'Update this information to reflect accurate details',
    'Remove this outdated address from my credit profile',
    'Verify and correct this personal information',
    'Delete this unverified information',
  ];

  // Format helper functions
  const formatSSN = (ssn: string) => {
    if (!ssn || ssn.length < 4) return 'XXX-XX-1234';
    const lastFour = ssn.slice(-4);
    return `XXX-XX-${lastFour}`;
  };

  const formatBirthDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatZipCode = (zipCode: string): string => {
    if (!zipCode) return '';
    if (zipCode.length === 9) {
      return `${zipCode.slice(0, 5)}-${zipCode.slice(5)}`;
    }
    return zipCode;
  };

  const primaryResidence = borrower._RESIDENCE?.[0];
  const previousResidence = borrower._RESIDENCE?.[1];

  // Extract middle name from credit data
  const getMiddleName = () => {
    try {
      // Check if borrower has middle name field
      if (borrower?.['@_MiddleName']) {
        return borrower['@_MiddleName'];
      }

      // Parse from UnparsedName to extract middle name
      if (borrower?.['@_UnparsedName']) {
        const nameParts = borrower['@_UnparsedName'].trim().split(' ');
        if (nameParts.length === 3) {
          return nameParts[1]; // Middle name
        }
      }

      return '';
    } catch (error) {

      return '';
    }
  };

  const middleName = getMiddleName();
  const fullName = middleName
    ? `${borrower['@_FirstName']} ${middleName} ${borrower['@_LastName']}`
    : `${borrower['@_FirstName']} ${borrower['@_LastName']}`;

  // Extract employment information from credit data
  const getEmploymentInfo = () => {
    // For authentic data, return placeholder until we can map actual employment data
    return {
      currentEmployer: 'Not Available',
      previousEmployer: 'Not Available',
    };
  };

  const { currentEmployer, previousEmployer } = getEmploymentInfo();

  // Extract additional personal information
  const getAdditionalPersonalInfo = () => {
    return {
      phoneNumbers: 'Not Available',
      formerNames: 'Not Available',
    };
  };

  const { phoneNumbers, formerNames } = getAdditionalPersonalInfo();

  // Comprehensive personal information items
  const allPersonalInfoItems = [
    {
      id: 'name',
      label: 'Name',
      value: fullName,
      icon: User,
    },
    ...(middleName
      ? [
          {
            id: 'middlename',
            label: 'Middle Name/Initial',
            value: middleName,
            icon: User,
          },
        ]
      : []),
    {
      id: 'birthdate',
      label: 'Date of Birth',
      value: formatBirthDate(borrower['@_BirthDate']),
      icon: Calendar,
    },
    {
      id: 'ssn',
      label: 'Social Security Number',
      value: formatSSN(borrower['@_SSN']),
      icon: Shield,
    },
    {
      id: 'address',
      label: 'Current Address',
      value: primaryResidence
        ? `${primaryResidence['@_StreetAddress']}, ${primaryResidence['@_City']}, ${primaryResidence['@_State']} ${formatZipCode(primaryResidence['@_PostalCode'])}`
        : 'Not Available',
      icon: MapPin,
    },
    ...(previousResidence
      ? [
          {
            id: 'previous-address',
            label: 'Previous Address',
            value: `${previousResidence['@_StreetAddress']}, ${previousResidence['@_City']}, ${previousResidence['@_State']} ${formatZipCode(previousResidence['@_PostalCode'])}`,
            icon: MapPin,
          },
        ]
      : []),
    {
      id: 'phone',
      label: 'Phone Number',
      value: phoneNumbers,
      icon: Phone,
    },
    {
      id: 'former-names',
      label: 'Former Names/Aliases',
      value: formerNames,
      icon: User,
    },
    {
      id: 'current-employer',
      label: 'Current Employer',
      value: currentEmployer,
      icon: Briefcase,
    },
    {
      id: 'previous-employer',
      label: 'Previous Employer',
      value: previousEmployer,
      icon: Briefcase,
    },
  ];

  // Helper functions
  const hasSelectedItems = Object.values(selectedItems).some(Boolean);

  const toggleSelection = (itemId: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const calculatePersonalInfoItemsCount = () => {
    return Object.values(selectedItems).filter(Boolean).length;
  };

  const calculatePersonalInfoBureauDisputes = () => {
    return Object.values(selectedItems).filter(Boolean).length;
  };

  const handleSelectAllPreviousAddresses = () => {
    // Auto-expand the section if it's not already expanded
    if (!isExpanded) {
      setIsExpanded(true);
    }

    // Get all address-related item IDs across all three bureaus
    const addressItemIds = ['transunion-address', 'equifax-address', 'experian-address'];

    // If there are additional addresses available, add those too
    if (borrower._RESIDENCE?.[1]) {
      addressItemIds.push(
        'transunion-previous-address',
        'equifax-previous-address',
        'experian-previous-address'
      );
    }

    // Check if all address items are currently selected
    const allAddressesSelected = addressItemIds.every((itemId) => selectedItems[itemId]);

    // Create new selections object
    const addressSelections: { [key: string]: boolean } = {};

    if (allAddressesSelected) {
      // If all are selected, unselect them (toggle off)
      addressItemIds.forEach((itemId) => {
        addressSelections[itemId] = false;
      });

      // Clear auto-typed text when unselecting
      setSelectedReason('');
      setSelectedInstruction('');
    } else {
      // If not all are selected, select all (toggle on)
      addressItemIds.forEach((itemId) => {
        addressSelections[itemId] = true;
      });

      // Auto-type the appropriate dispute text for addresses
      setSelectedReason('This address is wrong or outdated');
      setSelectedInstruction('Remove this incorrect address from my credit profile');
    }

    setSelectedItems((prev) => ({
      ...prev,
      ...addressSelections,
    }));
  };

  const handleSaveAndContinue = () => {
    if (onDisputeSaved) {
      onDisputeSaved({
        reason: selectedReason,
        instruction: selectedInstruction,
        selectedItems: selectedItems,
      });
    }
    setIsDisputeSaved(true);
    setTimeout(() => setIsCollapsed(true), 500);
  };

  // Show collapsed state
  if (isCollapsed) {
    if (isDisputeSaved) {
      // Saved state - green with checkmark
      return (
        <div className="mb-4" data-section="personal-info">
          {/* ‼️ Debug ring removed – uncomment for troubleshooting */}
          <Card className="border-2 border-green-500 bg-green-50 hover:shadow-md transition-all duration-700 rounded-2xl cursor-pointer">
            <div
              className="-m-4 p-4 hover:bg-green-100 rounded-2xl flex items-center justify-between"
              onClick={() => setIsCollapsed(false)}
            >
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
                    Personal Information – Disputes Saved
                  </h3>
                  <p className="text-sm text-green-600">
                    You've saved disputes for {calculatePersonalInfoItemsCount()} personal info
                    items across TransUnion, Equifax, and Experian.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-green-600">
                  {calculatePersonalInfoItemsCount()} Items
                </span>
                <ChevronDown className="text-green-600" />
              </div>
            </div>
          </Card>
        </div>
      );
    } else {
      // Default collapsed state - exact copy from Negative Accounts
      return (
        <div className="mb-4" data-section="personal-info">
          <Card
            className={`border border-gray-200 transition-all duration-300 hover:shadow-lg`}
          >
            <CardHeader
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => setIsCollapsed(false)}
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    PI
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Personal Information</h3>
                    <p className="text-sm text-gray-600">
                      Identity details and addresses on your credit report
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600">3 Bureaus</span>
                  <ChevronDown />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      );
    }
  }

  return (
    <div className="mb-4" data-section="personal-info">
      <Card
        className={`${isExpanded ? 'border-2 border-gray-300' : 'border border-gray-200'} transition-all duration-300 hover:shadow-lg`}
      >
        <CardHeader
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold">
                PI
              </div>
              <div>
                <h3 className="text-lg font-bold">Personal Information</h3>
                <p className="text-sm text-gray-600">
                  Removing old personal info tied to bad accounts helps for deleting them.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">3 Bureaus</span>
              {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </div>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Section Title with Button */}
              <div className="mb-6 flex justify-between items-center">
                <div className="flex items-center gap-2 mt-[15px]">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    1
                  </div>
                  <span className="font-bold text-gray-800">Choose personal information to dispute (optional)</span>
                </div>
                <div className="mt-[15px] mb-0">
                  <Button
                    onClick={handleSelectAllPreviousAddresses}
                    variant="outline"
                    className="mb-0 bg-gray-100 hover:bg-white text-gray-700 hover:text-gray-900 border-gray-300 transition-colors"
                  >
                    Select All Previous Addresses
                  </Button>
                </div>
              </div>

              {/* Three Bureau Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-section="personal-info">
                {/* TransUnion Column */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-cyan-700">TransUnion</h3>
                  </div>
                  <div className="space-y-3">
                    {allPersonalInfoItems.map((item) => {
                      const IconComponent = item.icon;
                      const itemId = `transunion-${item.id}`;
                      const isSelected = selectedItems[itemId];

                      return (
                        <div
                          key={itemId}
                          className={`${
                            isDisputeSaved && isSelected
                              ? 'border-3 border-green-500'
                              : isSelected
                                ? 'border-3 border-red-500'
                                : 'border border-gray-200 hover:border-gray-300'
                          } ${isDisputeSaved && isSelected ? 'bg-green-50' : 'bg-gray-50'} rounded-lg p-3 cursor-pointer transition-all duration-200`}
                          onClick={() => toggleSelection(itemId)}
                        >
                          <div className="flex gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected || false}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSelection(itemId);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                            />
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <IconComponent className="w-3 h-3 text-gray-500" />
                                <span className="text-xs font-medium text-gray-700">
                                  {item.label}
                                </span>
                              </div>
                              <span className="text-sm text-gray-900 truncate">{item.value}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Equifax Column */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-bold text-red-700">Equifax</h3>
                  </div>
                  <div className="space-y-3">
                    {allPersonalInfoItems.map((item) => {
                      const IconComponent = item.icon;
                      const itemId = `equifax-${item.id}`;
                      const isSelected = selectedItems[itemId];

                      return (
                        <div
                          key={itemId}
                          className={`${
                            isDisputeSaved && isSelected
                              ? 'border-3 border-green-500'
                              : isSelected
                                ? 'border-3 border-red-500'
                                : 'border border-gray-200 hover:border-gray-300'
                          } ${isDisputeSaved && isSelected ? 'bg-green-50' : 'bg-gray-50'} rounded-lg p-3 cursor-pointer transition-all duration-200`}
                          onClick={() => toggleSelection(itemId)}
                        >
                          <div className="flex gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected || false}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSelection(itemId);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                            />
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <IconComponent className="w-3 h-3 text-gray-500" />
                                <span className="text-xs font-medium text-gray-700">
                                  {item.label}
                                </span>
                              </div>
                              <span className="text-sm text-gray-900 truncate">{item.value}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Experian Column */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-bold text-blue-800">Experian</h3>
                  </div>
                  <div className="space-y-3">
                    {allPersonalInfoItems.map((item) => {
                      const IconComponent = item.icon;
                      const itemId = `experian-${item.id}`;
                      const isSelected = selectedItems[itemId];

                      return (
                        <div
                          key={itemId}
                          className={`${
                            isDisputeSaved && isSelected
                              ? 'border-3 border-green-500'
                              : isSelected
                                ? 'border-3 border-red-500'
                                : 'border border-gray-200 hover:border-gray-300'
                          } ${isDisputeSaved && isSelected ? 'bg-green-50' : 'bg-gray-50'} rounded-lg p-3 cursor-pointer transition-all duration-200`}
                          onClick={() => toggleSelection(itemId)}
                        >
                          <div className="flex gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected || false}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSelection(itemId);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                            />
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <IconComponent className="w-3 h-3 text-gray-500" />
                                <span className="text-xs font-medium text-gray-700">
                                  {item.label}
                                </span>
                              </div>
                              <span className="text-sm text-gray-900 truncate">{item.value}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Dispute Form Section */}
              {hasSelectedItems && (
                <div className="pt-4 mt-2 border-t space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    {isDisputeSaved ? (
                      <span className="text-green-600 text-lg font-bold">✓</span>
                    ) : (
                      <span className="circle-badge-blue">2</span>
                    )}
                    <span className="font-bold">
                      {isDisputeSaved ? 'Dispute Saved' : 'Create Dispute'}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Reason Selection */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Dispute Reason</label>
                        {isTypingReason && (
                          <div className="flex items-center text-blue-600 text-sm">
                            <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse mr-1"></div>
                            <span>AI typing</span>
                          </div>
                        )}
                      </div>
                      {isTypingReason ? (
                        <div className="relative">
                          <div
                            className="w-full p-3 border-red-500 border rounded-md bg-red-50 text-gray-900"
                            style={{
                              minHeight: '40px',
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              whiteSpace: 'pre-wrap',
                              lineHeight: '1.5',
                              maxWidth: '100%',
                              boxSizing: 'border-box',
                            }}
                          >
                            {selectedReason || 'AI is typing...'}
                          </div>
                        </div>
                      ) : (
                        <Select value={selectedReason} onValueChange={setSelectedReason}>
                          <SelectTrigger
                            className={`w-full ${
                              isDisputeSaved && Object.values(selectedItems).some(Boolean)
                                ? 'border-green-500'
                                : Object.values(selectedItems).some(Boolean)
                                  ? 'border-red-500'
                                  : 'border-gray-300'
                            }`}
                          >
                            <SelectValue placeholder="Select a dispute reason..." />
                          </SelectTrigger>
                          <SelectContent>
                            {disputeReasons.map((reason, index) => (
                              <SelectItem key={index} value={reason}>
                                {reason}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Instruction Selection */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Dispute Instruction</label>
                        {isTypingInstruction && (
                          <div className="flex items-center text-blue-600 text-sm">
                            <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse mr-1"></div>
                            <span>AI typing</span>
                          </div>
                        )}
                      </div>
                      {isTypingInstruction ? (
                        <div className="relative">
                          <div
                            className="w-full p-3 border-red-500 border rounded-md bg-red-50 text-gray-900"
                            style={{
                              minHeight: '40px',
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              whiteSpace: 'pre-wrap',
                              lineHeight: '1.5',
                              maxWidth: '100%',
                              boxSizing: 'border-box',
                            }}
                          >
                            {selectedInstruction || 'AI is typing...'}
                          </div>
                        </div>
                      ) : (
                        <Select value={selectedInstruction} onValueChange={setSelectedInstruction}>
                          <SelectTrigger
                            className={`w-full ${
                              isDisputeSaved && Object.values(selectedItems).some(Boolean)
                                ? 'border-green-500'
                                : Object.values(selectedItems).some(Boolean)
                                  ? 'border-red-500'
                                  : 'border-gray-300'
                            }`}
                          >
                            <SelectValue placeholder="Select dispute instructions..." />
                          </SelectTrigger>
                          <SelectContent>
                            {disputeInstructions.map((instruction, index) => (
                              <SelectItem key={index} value={instruction}>
                                {instruction}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Save Button Section - Matching Recent Inquiries */}
                    <div className="flex gap-2 justify-between items-center pt-4">
                      {hasSelectedItems &&
                      !isDisputeSaved &&
                      !showGuideArrow &&
                      (!selectedReason || !selectedInstruction) ? (
                        <div className="warning-container">
                          <AlertTriangle className="hidden md:block w-4 h-4 warning-icon" />
                          <span className="text-xs md:text-sm font-medium warning-text">
                            <span className="md:hidden">
                              Complete
                              <br />& Save
                            </span>
                            <span className="hidden md:inline">Complete Reason & Instruction</span>
                          </span>
                        </div>
                      ) : (
                        <div></div>
                      )}
                      <div className="flex items-center gap-2 relative overflow-visible">
                        {/* Flying Arrow Guide - Exact match from Recent Inquiries */}
                        {showGuideArrow && (
                          <div
                            className="absolute right-full top-1/2 transform -translate-y-1/2 z-50 pr-2 pointer-events-none"
                            style={{ width: 'calc(100vw - 160px)', left: 'calc(-100vw + 140px)' }}
                          >
                            <div className="flex items-center animate-fly-arrow">
                              <div className="w-16 h-1 bg-blue-600"></div>
                              <div className="w-0 h-0 border-l-[10px] border-t-[6px] border-b-[6px] border-l-blue-600 border-t-transparent border-b-transparent"></div>
                            </div>
                          </div>
                        )}
                        <span
                          className={`mr-1 transition-colors duration-300 ${
                            isDisputeSaved ? 'circle-badge-green' : 'circle-badge-blue'
                          }`}
                        >
                          3
                        </span>
                        <Button
                          onClick={handleSaveAndContinue}
                          disabled={
                            !Object.values(selectedItems).some(Boolean) ||
                            !selectedReason ||
                            !selectedInstruction
                          }
                          className={`${
                            isDisputeSaved
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          } text-white px-4 py-2 rounded-md disabled:bg-gray-400 transition-colors duration-300`}
                        >
                          {isDisputeSaved ? (
                            <>
                              <span className="text-white mr-2">✓</span>
                              Dispute Saved
                            </>
                          ) : (
                            'Save Dispute and Continue'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
