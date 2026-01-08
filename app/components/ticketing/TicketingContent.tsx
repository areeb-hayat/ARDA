// ============================================
// app/components/ticketing/TicketingContent.tsx
// Main ticketing interface with department tabs and super workflows
// ============================================

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, X, Loader2, TicketIcon, 
  AlertCircle, List, Plus, RefreshCw, ArrowLeft, Zap
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import FunctionalityCard from './FunctionalityCard';
import TicketFormModal from './TicketFormModal';
import MyTicketsWrapper from './MyTicketsWrapper';

interface Functionality {
  _id: string;
  name: string;
  description: string;
  department: string;
  formSchema: {
    fields: any[];
    useDefaultFields: boolean;
  };
  createdAt: string;
}

interface SuperFunctionality {
  _id: string;
  name: string;
  description: string;
  workflow: {
    nodes: any[];
    edges: any[];
  };
  formSchema: {
    fields: any[];
    useDefaultFields: boolean;
  };
  accessControl: {
    type: 'organization' | 'departments' | 'specific_users';
    departments?: string[];
    users?: string[];
  };
  createdAt: string;
}

interface TicketingContentProps {
  onBack?: () => void;
}

export default function TicketingContent({ onBack }: TicketingContentProps) {
  const { colors, cardCharacters } = useTheme();
  const charColors = cardCharacters.informative;
  
  const [functionalities, setFunctionalities] = useState<Functionality[]>([]);
  const [superFunctionalities, setSuperFunctionalities] = useState<SuperFunctionality[]>([]);
  const [filteredFunctionalities, setFilteredFunctionalities] = useState<Functionality[]>([]);
  const [filteredSuperFunctionalities, setFilteredSuperFunctionalities] = useState<SuperFunctionality[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'my-tickets'>('create');
  const [activeDepartmentTab, setActiveDepartmentTab] = useState<string>('');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [selectedFunctionality, setSelectedFunctionality] = useState<Functionality | SuperFunctionality | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [createdTicketNumber, setCreatedTicketNumber] = useState('');

  // Get user data
  const [userId, setUserId] = useState<string>('');
  const [userDepartment, setUserDepartment] = useState<string>('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserId(user._id || user.id || user.userId || user.username);
      setUserDepartment(user.department || '');
    }
  }, []);

  useEffect(() => {
    if (userId && userDepartment) {
      fetchData();
    }
  }, [userId, userDepartment]);

  useEffect(() => {
    applyFilters();
  }, [functionalities, superFunctionalities, searchQuery, activeDepartmentTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch regular functionalities
      const funcResponse = await fetch('/api/ticketing/functionalities');
      
      if (!funcResponse.ok) throw new Error('Failed to fetch functionalities');

      const funcData = await funcResponse.json();
      setFunctionalities(funcData.functionalities || []);
      
      // Get departments that have functionalities
      const depts = funcData.departments || [];
      
      // Fetch accessible super functionalities
      const superResponse = await fetch(
        `/api/super/workflows/access?userId=${userId}&department=${userDepartment}`
      );
      
      let accessibleSuper: SuperFunctionality[] = [];
      if (superResponse.ok) {
        const superData = await superResponse.json();
        accessibleSuper = superData.functionalities || [];
        setSuperFunctionalities(accessibleSuper);
        console.log('✅ Loaded super functionalities:', accessibleSuper.length);
      }
      
      // Add "Misc" tab if there are accessible super functionalities
      const finalDepts = [...depts];
      if (accessibleSuper.length > 0 && !finalDepts.includes('Misc')) {
        finalDepts.push('Misc');
      }
      
      setDepartments(finalDepts);
      
      // Set initial active tab to first department
      if (finalDepts.length > 0 && !activeDepartmentTab) {
        setActiveDepartmentTab(finalDepts[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Filter regular functionalities
    let filtered = [...functionalities];
    
    // Filter by department tab (exclude Misc)
    if (activeDepartmentTab && activeDepartmentTab !== 'Misc') {
      filtered = filtered.filter(f => f.department === activeDepartmentTab);
    } else if (activeDepartmentTab === 'Misc') {
      // Don't show regular functionalities in Misc tab
      filtered = [];
    }

    // Apply search to regular functionalities
    if (searchQuery && activeDepartmentTab !== 'Misc') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(query) ||
        f.description?.toLowerCase().includes(query)
      );
    }

    setFilteredFunctionalities(filtered);

    // Filter super functionalities (only shown in Misc tab)
    let filteredSuper = [...superFunctionalities];
    
    if (activeDepartmentTab === 'Misc' && searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredSuper = filteredSuper.filter(f => 
        f.name.toLowerCase().includes(query) ||
        f.description?.toLowerCase().includes(query)
      );
    }
    
    setFilteredSuperFunctionalities(activeDepartmentTab === 'Misc' ? filteredSuper : []);
  };

  const handleTicketSuccess = (ticketNumber: string) => {
    setCreatedTicketNumber(ticketNumber);
    setShowSuccessMessage(true);
    setSelectedFunctionality(null);
    
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 5000);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} p-8`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative flex items-center space-x-3">
            <button
              onClick={handleBack}
              className={`group relative flex items-center justify-center p-2 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-br ${colors.cardBg} border ${charColors.border} ${colors.borderHover} backdrop-blur-sm ${colors.shadowCard} hover:${colors.shadowHover}`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` }}
              ></div>
              <ArrowLeft className={`h-5 w-5 relative z-10 transition-transform duration-300 group-hover:-translate-x-1 ${charColors.iconColor}`} />
            </button>
            
            <div className={`p-2 rounded-lg bg-gradient-to-r ${charColors.bg}`}>
              <TicketIcon className={`h-5 w-5 ${charColors.iconColor}`} />
            </div>
            <div>
              <h2 className={`text-xl font-black ${charColors.text}`}>Create Ticket</h2>
              <p className={`text-sm ${colors.textMuted}`}>Loading functionalities...</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className={`absolute inset-0 rounded-full blur-2xl opacity-30 animate-pulse`} style={{ backgroundColor: charColors.iconColor.replace('text-', '') }} />
              <Loader2 className={`relative w-12 h-12 animate-spin ${charColors.iconColor}`} />
            </div>
            <p className={`${colors.textSecondary} text-sm font-semibold`}>
              Loading functionalities...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} p-8`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative flex items-center space-x-3">
            <button
              onClick={handleBack}
              className={`group relative flex items-center justify-center p-2 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-br ${colors.cardBg} border ${charColors.border} ${colors.borderHover} backdrop-blur-sm ${colors.shadowCard} hover:${colors.shadowHover}`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` }}
              ></div>
              <ArrowLeft className={`h-5 w-5 relative z-10 transition-transform duration-300 group-hover:-translate-x-1 ${charColors.iconColor}`} />
            </button>
            
            <div className={`p-2 rounded-lg bg-gradient-to-r ${charColors.bg}`}>
              <TicketIcon className={`h-5 w-5 ${charColors.iconColor}`} />
            </div>
            <div>
              <h2 className={`text-xl font-black ${charColors.text}`}>Create Ticket</h2>
            </div>
          </div>
        </div>

        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.urgent.bg} ${cardCharacters.urgent.border} p-10 text-center`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative">
            <div className="mb-6">
              <AlertCircle className={`w-16 h-16 mx-auto ${cardCharacters.urgent.iconColor}`} />
            </div>
            <h3 className={`text-xl font-black ${cardCharacters.urgent.text} mb-3`}>
              Error Loading Functionalities
            </h3>
            <p className={`${colors.textSecondary} text-sm mb-6 max-w-md mx-auto`}>
              {error}
            </p>
            <button 
              onClick={fetchData}
              className={`group relative px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 overflow-hidden border-2 inline-flex items-center gap-2 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText}`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
              ></div>
              <RefreshCw className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:rotate-180" />
              <span className="relative z-10">Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalCount = activeDepartmentTab === 'Misc' 
    ? filteredSuperFunctionalities.length 
    : filteredFunctionalities.length;

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      {/* Header with Back Button and Tab Navigation */}
      <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} transition-all duration-300`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        
        <div className="relative p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Back Button */}
              {onBack && (
                <button
                  onClick={handleBack}
                  className={`group relative p-3 rounded-xl transition-all duration-300 overflow-hidden bg-gradient-to-br ${colors.cardBg} border-2 ${charColors.border}`}
                >
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
                  ></div>
                  <ArrowLeft className={`h-5 w-5 relative z-10 transition-transform duration-300 group-hover:-translate-x-1 ${charColors.iconColor}`} />
                </button>
              )}

              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${charColors.bg} border-2 ${charColors.border}`}>
                  <TicketIcon className={`h-6 w-6 ${charColors.iconColor}`} />
                </div>
                <div>
                  <h1 className={`text-2xl font-black ${charColors.text}`}>Ticketing System</h1>
                  <p className={`text-sm ${colors.textMuted}`}>
                    {activeTab === 'create' 
                      ? `${totalCount} functionalities available`
                      : 'View and manage your tickets'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Refresh Button - only on create tab */}
            {activeTab === 'create' && (
              <button
                onClick={fetchData}
                disabled={loading}
                className={`group relative px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 overflow-hidden flex items-center gap-2 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} disabled:opacity-50`}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
                ></div>
                <RefreshCw className={`h-4 w-4 relative z-10 transition-transform duration-300 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                <span className="relative z-10">Refresh</span>
              </button>
            )}
          </div>

          {/* Main Tab Buttons (Create / My Tickets) */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('create')}
              className={`group relative flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden border-2 ${
                activeTab === 'create'
                  ? `bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} border-transparent`
                  : `${colors.inputBg} ${colors.textSecondary} ${colors.borderSubtle} hover:border-opacity-60`
              }`}
            >
              {activeTab === 'create' && (
                <>
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
                  ></div>
                </>
              )}
              <Plus className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Create New Ticket</span>
            </button>
            <button
              onClick={() => setActiveTab('my-tickets')}
              className={`group relative flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden border-2 ${
                activeTab === 'my-tickets'
                  ? `bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} border-transparent`
                  : `${colors.inputBg} ${colors.textSecondary} ${colors.borderSubtle} hover:border-opacity-60`
              }`}
            >
              {activeTab === 'my-tickets' && (
                <>
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
                  ></div>
                </>
              )}
              <List className="w-4 h-4 relative z-10" />
              <span className="relative z-10">My Tickets</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div 
          className={`relative overflow-hidden p-4 rounded-xl border-2 flex items-center gap-4 animate-in slide-in-from-top bg-gradient-to-br ${cardCharacters.completed.bg} ${cardCharacters.completed.border}`}
        >
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative flex-shrink-0">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r ${cardCharacters.completed.bg}`}>
              <TicketIcon className={`w-6 h-6 ${cardCharacters.completed.iconColor}`} />
            </div>
          </div>
          <div className="relative flex-1">
            <p className={`font-bold ${cardCharacters.completed.text}`}>Ticket Created Successfully!</p>
            <p className={`text-sm ${colors.textSecondary}`}>
              Your ticket <span className={`font-mono font-bold ${cardCharacters.completed.text}`}>{createdTicketNumber}</span> has been submitted.
            </p>
          </div>
          <button
            onClick={() => setShowSuccessMessage(false)}
            className={`relative flex-shrink-0 ${colors.textMuted} hover:${cardCharacters.urgent.iconColor} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Content Area - Conditional based on active tab */}
      {activeTab === 'create' ? (
        <>
          {/* Department Tabs and Search */}
          <div className={`relative overflow-hidden rounded-xl border-2 backdrop-blur-sm bg-gradient-to-br ${colors.cardBg} ${colors.borderSubtle} p-4`}>
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
            
            <div className="relative space-y-3">
              {/* Department Tabs */}
              <div className="flex flex-wrap gap-2">
                {departments.map((dept) => {
                  const isMisc = dept === 'Misc';
                  const isActive = activeDepartmentTab === dept;
                  
                  return (
                    <button
                      key={dept}
                      onClick={() => setActiveDepartmentTab(dept)}
                      className={`group relative px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 overflow-hidden border-2 ${
                        isActive
                          ? `bg-gradient-to-r ${charColors.bg} ${charColors.border} ${charColors.text}`
                          : `${colors.inputBg} ${colors.textSecondary} ${colors.borderSubtle}`
                      }`}
                    >
                      {isActive && (
                        <>
                          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                          <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
                          ></div>
                        </>
                      )}
                      <div className="relative z-10 flex items-center gap-2">
                        {isMisc && <Zap className="w-4 h-4" />}
                        <span>{dept}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${colors.textMuted}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeDepartmentTab === 'Misc' ? 'super workflows' : 'functionalities'}...`}
                  className={`w-full pl-12 pr-12 py-3 rounded-xl text-sm transition-all ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder}`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${colors.textMuted} hover:${cardCharacters.urgent.iconColor} transition-colors`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Info Banner for Misc Tab */}
              {activeDepartmentTab === 'Misc' && (
                <div className={`p-3 rounded-lg border-2 ${charColors.border} bg-gradient-to-r ${charColors.bg}`}>
                  <div className="flex items-start space-x-2">
                    <Zap className={`w-4 h-4 ${charColors.iconColor} mt-0.5 flex-shrink-0`} />
                    <p className={`${colors.textSecondary} text-xs`}>
                      Super Workflows are cross-departmental processes accessible based on your permissions.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Functionalities Grid */}
          {totalCount === 0 ? (
            <div className={`relative overflow-hidden rounded-2xl border-2 backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} p-16 text-center`}>
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              <div className="relative">
                {activeDepartmentTab === 'Misc' ? (
                  <>
                    <Zap className={`h-16 w-16 ${colors.textMuted} mx-auto mb-4 opacity-40`} />
                    <p className={`${colors.textPrimary} text-lg font-bold mb-2`}>
                      No super workflows found
                    </p>
                    <p className={`${colors.textSecondary} text-sm`}>
                      {searchQuery 
                        ? 'Try adjusting your search query'
                        : 'No super workflows are accessible to you at this time'}
                    </p>
                  </>
                ) : (
                  <>
                    <TicketIcon className={`h-16 w-16 ${colors.textMuted} mx-auto mb-4 opacity-40`} />
                    <p className={`${colors.textPrimary} text-lg font-bold mb-2`}>
                      No functionalities found
                    </p>
                    <p className={`${colors.textSecondary} text-sm`}>
                      {searchQuery 
                        ? 'Try adjusting your search query'
                        : `No functionalities available in ${activeDepartmentTab}`}
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeDepartmentTab === 'Misc' ? (
                // Super Workflows
                filteredSuperFunctionalities.map((functionality) => (
                  <FunctionalityCard
                    key={functionality._id}
                    functionality={{
                      ...functionality,
                      department: 'Super Workflow'
                    } as any}
                    onClick={() => {
                      // Ensure department is set to 'Super Workflow' for modal detection
                      const superFunc = {
                        ...functionality,
                        department: 'Super Workflow'
                      };
                      console.log('🌟 Setting super functionality:', {
                        id: superFunc._id,
                        name: superFunc.name,
                        department: superFunc.department
                      });
                      setSelectedFunctionality(superFunc as any);
                    }}
                    isSuper={true}
                  />
                ))
              ) : (
                // Regular Functionalities
                filteredFunctionalities.map((functionality) => (
                  <FunctionalityCard
                    key={functionality._id}
                    functionality={functionality}
                    onClick={() => setSelectedFunctionality(functionality)}
                  />
                ))
              )}
            </div>
          )}
        </>
      ) : (
        /* My Tickets Tab */
        <MyTicketsWrapper onBack={() => setActiveTab('create')} />
      )}

      {/* Ticket Form Modal */}
      {selectedFunctionality && (
        <TicketFormModal
          functionality={selectedFunctionality}
          onClose={() => setSelectedFunctionality(null)}
          onSuccess={handleTicketSuccess}
        />
      )}
    </div>
  );
}