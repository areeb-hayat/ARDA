// ===== app/components/universal/OrgInfoContent.tsx =====
'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Users, Search, Mail, Phone, Copy, Check, User, Briefcase, Loader2, RefreshCw, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface Employee {
  _id: string;
  username: string;
  basicDetails?: {
    name?: string;
    profileImage?: string;
  };
  title: string;
  department: string;
  isDeptHead?: boolean;
  employeeNumber?: string;
  contactInformation?: {
    email?: string;
    contactNumber?: string;
  };
}

interface DepartmentData {
  name: string;
  employees: Employee[];
  deptHeads: Employee[];
  totalCount: number;
}

export default function OrgInfoContent() {
  const { colors, cardCharacters } = useTheme();
  const charColors = cardCharacters.informative;
  const authChar = cardCharacters.authoritative;
  
  const [departments, setDepartments] = useState<string[]>([]);
  const [currentDepartment, setCurrentDepartment] = useState<DepartmentData | null>(null);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]); // For global search
  const [loading, setLoading] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDepartmentTab, setActiveDepartmentTab] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Tab navigation state
  const [tabScrollPosition, setTabScrollPosition] = useState(0);
  const [visibleTabsCount] = useState(8); // Show 8 tabs at a time

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (activeDepartmentTab) {
      fetchDepartmentEmployees(activeDepartmentTab);
    }
  }, [activeDepartmentTab]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const deptResponse = await fetch('/api/departments');
      const deptData = await deptResponse.json();

      if (deptData.departments && Array.isArray(deptData.departments)) {
        setDepartments(deptData.departments);
        
        // Set initial active tab to first department
        if (deptData.departments.length > 0 && !activeDepartmentTab) {
          setActiveDepartmentTab(deptData.departments[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentEmployees = async (deptName: string) => {
    try {
      setLoadingEmployees(true);
      
      // Fetch employees for this specific department
      const empResponse = await fetch(`/api/dept-employees?department=${encodeURIComponent(deptName)}`);
      const empData = await empResponse.json();

      if (empData.success && empData.employees) {
        // Fetch full details for each employee (including isDeptHead and contact info)
        const employeesWithDetails = await Promise.all(
          empData.employees.map(async (emp: Employee) => {
            try {
              const detailResponse = await fetch(`/api/employees/${emp.username}`);
              if (detailResponse.ok) {
                const detailData = await detailResponse.json();
                const fullEmployee = {
                  ...emp,
                  isDeptHead: detailData.employee?.isDeptHead === true,
                  contactInformation: detailData.employee?.contactInformation,
                  employeeNumber: detailData.employee?.employeeNumber
                };
                console.log(`Employee ${emp.username} isDeptHead:`, fullEmployee.isDeptHead);
                return fullEmployee;
              }
            } catch (error) {
              console.error(`Error fetching details for ${emp.username}:`, error);
            }
            return emp;
          })
        );

        // Separate dept heads and regular employees
        const deptHeads = employeesWithDetails.filter((emp: Employee) => emp.isDeptHead === true);
        const regularEmployees = employeesWithDetails.filter((emp: Employee) => emp.isDeptHead !== true);
        
        console.log(`Department ${deptName} - Heads: ${deptHeads.length}, Regular: ${regularEmployees.length}`);

        setCurrentDepartment({
          name: deptName,
          employees: regularEmployees,
          deptHeads: deptHeads,
          totalCount: employeesWithDetails.length
        });
        
        // Store all employees for global search
        setAllEmployees(employeesWithDetails);
      } else {
        setCurrentDepartment({
          name: deptName,
          employees: [],
          deptHeads: [],
          totalCount: 0
        });
        setAllEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching department employees:', error);
      setCurrentDepartment({
        name: deptName,
        employees: [],
        deptHeads: [],
        totalCount: 0
      });
      setAllEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleTabChange = (deptName: string) => {
    setActiveDepartmentTab(deptName);
    setSearchQuery(''); // Clear search when changing departments
  };

  const handleTabScroll = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setTabScrollPosition(Math.max(0, tabScrollPosition - 1));
    } else {
      setTabScrollPosition(Math.min(departments.length - visibleTabsCount, tabScrollPosition + 1));
    }
  };

  // Filter employees based on search - supports searching across ALL fields
  const getFilteredEmployees = () => {
    if (!searchQuery) {
      // No search query - show current department employees
      return {
        deptHeads: currentDepartment?.deptHeads || [],
        employees: currentDepartment?.employees || [],
        isGlobalSearch: false
      };
    }

    const query = searchQuery.toLowerCase();
    
    // Search across all employees if query doesn't match current department
    const shouldSearchGlobally = !activeDepartmentTab.toLowerCase().includes(query);
    
    if (shouldSearchGlobally && allEmployees.length > 0) {
      // Global search across all fields
      const filtered = allEmployees.filter(emp => {
        const name = emp.basicDetails?.name || emp.username || '';
        const title = emp.title || '';
        const email = emp.contactInformation?.email || '';
        const phone = emp.contactInformation?.contactNumber || '';
        const employeeNumber = (emp as any).employeeNumber || '';
        const department = emp.department || '';
        
        return name.toLowerCase().includes(query) || 
               title.toLowerCase().includes(query) ||
               email.toLowerCase().includes(query) ||
               phone.toLowerCase().includes(query) ||
               employeeNumber.toLowerCase().includes(query) ||
               department.toLowerCase().includes(query) ||
               emp.username.toLowerCase().includes(query);
      });
      
      return {
        deptHeads: filtered.filter(emp => emp.isDeptHead === true),
        employees: filtered.filter(emp => emp.isDeptHead !== true),
        isGlobalSearch: true
      };
    }
    
    // Search within current department
    const deptHeadsFiltered = (currentDepartment?.deptHeads || []).filter(emp => {
      const name = emp.basicDetails?.name || emp.username || '';
      const title = emp.title || '';
      const email = emp.contactInformation?.email || '';
      const phone = emp.contactInformation?.contactNumber || '';
      const employeeNumber = (emp as any).employeeNumber || '';
      
      return name.toLowerCase().includes(query) || 
             title.toLowerCase().includes(query) ||
             email.toLowerCase().includes(query) ||
             phone.toLowerCase().includes(query) ||
             employeeNumber.toLowerCase().includes(query) ||
             emp.username.toLowerCase().includes(query);
    });

    const employeesFiltered = (currentDepartment?.employees || []).filter(emp => {
      const name = emp.basicDetails?.name || emp.username || '';
      const title = emp.title || '';
      const email = emp.contactInformation?.email || '';
      const phone = emp.contactInformation?.contactNumber || '';
      const employeeNumber = (emp as any).employeeNumber || '';
      
      return name.toLowerCase().includes(query) || 
             title.toLowerCase().includes(query) ||
             email.toLowerCase().includes(query) ||
             phone.toLowerCase().includes(query) ||
             employeeNumber.toLowerCase().includes(query) ||
             emp.username.toLowerCase().includes(query);
    });
    
    return {
      deptHeads: deptHeadsFiltered,
      employees: employeesFiltered,
      isGlobalSearch: false
    };
  };

  const { deptHeads: filteredDeptHeads, employees: filteredEmployees, isGlobalSearch } = getFilteredEmployees();
  const totalCount = filteredDeptHeads.length + filteredEmployees.length;
  const visibleDepartments = departments.slice(tabScrollPosition, tabScrollPosition + visibleTabsCount);

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} p-8`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${charColors.bg}`}>
              <Building2 className={`h-5 w-5 ${charColors.iconColor}`} />
            </div>
            <div>
              <h2 className={`text-xl font-black ${charColors.text}`}>Organization Directory</h2>
              <p className={`text-sm ${colors.textMuted}`}>Loading departments...</p>
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
              Loading organization data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} transition-all duration-300`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        
        <div className="relative p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${charColors.bg} border-2 ${charColors.border}`}>
                <Building2 className={`h-6 w-6 ${charColors.iconColor}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-black ${charColors.text}`}>Organization Directory</h1>
                <p className={`text-sm ${colors.textMuted}`}>
                  {currentDepartment ? `${currentDepartment.totalCount} ${currentDepartment.totalCount === 1 ? 'employee' : 'employees'} in ${activeDepartmentTab}` : 'Select a department'}
                </p>
              </div>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={fetchDepartments}
              disabled={loading}
              className={`group relative px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden flex items-center gap-2 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} disabled:opacity-50`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
              ></div>
              <RefreshCw className={`h-4 w-4 relative z-10 transition-transform duration-300 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              <span className="relative z-10">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Department Tabs and Search */}
      <div className={`relative overflow-hidden rounded-xl border-2 backdrop-blur-sm bg-gradient-to-br ${colors.cardBg} ${colors.borderSubtle} p-4`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        
        <div className="relative space-y-3">
          {/* Department Tabs with Navigation and Scrollbar */}
          <div className="flex items-center gap-2">
            {/* Left Arrow */}
            {tabScrollPosition > 0 && (
              <button
                onClick={() => handleTabScroll('left')}
                className={`flex-shrink-0 p-2 rounded-lg transition-all duration-300 ${colors.buttonGhost} ${colors.buttonGhostText} ${colors.buttonGhostHover}`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {/* Tabs Container with Scrollbar */}
            <div className="flex-1 relative">
              {/* Scrollbar Indicator */}
              {departments.length > visibleTabsCount && (
                <div className={`absolute -bottom-2 left-0 right-0 h-1 rounded-full`} style={{ background: colors.scrollbarTrack }}>
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      background: colors.scrollbarThumb,
                      width: `${(visibleTabsCount / departments.length) * 100}%`,
                      marginLeft: `${(tabScrollPosition / departments.length) * 100}%`
                    }}
                  />
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 pb-3">
                {visibleDepartments.map((dept) => {
                  const isActive = activeDepartmentTab === dept;
                  
                  return (
                    <button
                      key={dept}
                      onClick={() => handleTabChange(dept)}
                      className={`group relative px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden border-2 ${
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
                      <span className="relative z-10">{dept}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Arrow */}
            {tabScrollPosition < departments.length - visibleTabsCount && (
              <button
                onClick={() => handleTabScroll('right')}
                className={`flex-shrink-0 p-2 rounded-lg transition-all duration-300 ${colors.buttonGhost} ${colors.buttonGhostText} ${colors.buttonGhostHover}`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${colors.textMuted}`} />
            <input
              type="text"
              placeholder="Search by department, name, title, email, phone, employee ID, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-xl text-sm transition-all ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder} focus:outline-none focus:ring-2 focus:ring-[#2196F3]/30 font-medium`}
            />
          </div>
          
          {/* Global Search Indicator */}
          {isGlobalSearch && searchQuery && (
            <div className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-r ${charColors.bg} ${charColors.border} border-2 rounded-lg`}>
              <Search className={`h-4 w-4 ${charColors.iconColor}`} />
              <p className={`text-xs font-bold ${charColors.text}`}>
                Searching across all departments: {totalCount} result{totalCount !== 1 ? 's' : ''} found
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Employees Display */}
      {loadingEmployees ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className={`absolute inset-0 rounded-full blur-2xl opacity-30 animate-pulse`} style={{ backgroundColor: charColors.iconColor.replace('text-', '') }} />
              <Loader2 className={`relative w-12 h-12 animate-spin ${charColors.iconColor}`} />
            </div>
            <p className={`${colors.textSecondary} text-sm font-semibold`}>
              Loading employees...
            </p>
          </div>
        </div>
      ) : !currentDepartment || totalCount === 0 ? (
        <div className={`relative overflow-hidden rounded-2xl border-2 backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} p-16 text-center`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative">
            <Users className={`h-16 w-16 ${colors.textMuted} mx-auto mb-4 opacity-40`} />
            <p className={`${colors.textPrimary} text-lg font-bold mb-2`}>
              No employees found
            </p>
            <p className={`${colors.textSecondary} text-sm`}>
              {searchQuery 
                ? 'Try adjusting your search query'
                : 'No employees in this department'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Department Heads Section */}
          {filteredDeptHeads.length > 0 && (
            <div className={`bg-gradient-to-br ${colors.glassBg} backdrop-blur-lg rounded-xl border ${colors.border} overflow-hidden relative`}>
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              
              <div className="relative p-5 space-y-4">
                <div className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-r ${authChar.bg} ${authChar.border} border-2 rounded-xl`}>
                  <Award className={`h-4 w-4 ${authChar.iconColor}`} />
                  <h4 className={`text-sm font-black ${authChar.text}`}>Department Heads</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDeptHeads.map((employee) => (
                    <EmployeeCard
                      key={employee._id}
                      employee={employee}
                      copiedField={copiedField}
                      onCopy={handleCopy}
                      isDeptHead={true}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Regular Employees Section */}
          {filteredEmployees.length > 0 && (
            <div className={`bg-gradient-to-br ${colors.glassBg} backdrop-blur-lg rounded-xl border ${colors.border} overflow-hidden relative`}>
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              
              <div className="relative p-5 space-y-4">
                {filteredDeptHeads.length > 0 && (
                  <div className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-r ${charColors.bg} ${charColors.border} border-2 rounded-xl`}>
                    <Users className={`h-4 w-4 ${charColors.iconColor}`} />
                    <h4 className={`text-sm font-black ${charColors.text}`}>Team Members</h4>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEmployees.map((employee) => (
                    <EmployeeCard
                      key={employee._id}
                      employee={employee}
                      copiedField={copiedField}
                      onCopy={handleCopy}
                      isDeptHead={false}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface EmployeeCardProps {
  employee: Employee;
  copiedField: string | null;
  onCopy: (text: string, fieldName: string) => void;
  isDeptHead: boolean;
}

function EmployeeCard({ employee, copiedField, onCopy, isDeptHead }: EmployeeCardProps) {
  const { colors, cardCharacters } = useTheme();
  const char = isDeptHead ? cardCharacters.authoritative : cardCharacters.informative;
  
  const displayName = employee.basicDetails?.name || employee.username || 'N/A';
  const email = employee.contactInformation?.email;
  const phone = employee.contactInformation?.contactNumber;
  const copyEmailId = `${employee._id}-email`;
  const copyPhoneId = `${employee._id}-phone`;

  return (
    <div className={`group relative rounded-xl p-5 border-2 transition-all duration-300 overflow-hidden bg-gradient-to-br ${colors.cardBg} ${colors.shadowCard} hover:${colors.shadowHover} ${char.border}`}>
      {/* Paper Texture */}
      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
      
      {/* Hover Glow */}
      <div 
        className="card-glow"
        style={{ boxShadow: `inset 0 0 20px ${isDeptHead ? 'rgba(52, 152, 219, 0.2)' : colors.glowPrimary}` }}
      ></div>

      <div className="relative space-y-4">
        {/* Avatar and Name */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 border-2 bg-gradient-to-br ${char.bg} ${char.border}`}>
            <User className={`h-6 w-6 ${char.iconColor}`} />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className={`text-base font-bold ${colors.textPrimary} truncate`}>
              {displayName}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <Briefcase className={`h-3 w-3 ${char.iconColor} flex-shrink-0`} />
              <p className={`text-xs font-semibold ${char.accent} truncate`}>
                {employee.title}
              </p>
            </div>
          </div>
        </div>

        {/* Username */}
        <div className={`pt-3 border-t ${colors.border}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${colors.textMuted}`}>Username</span>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold border-2 bg-gradient-to-r ${char.bg} ${char.text} ${char.border}`}>
              {employee.username}
            </span>
          </div>
        </div>

        {/* Contact Info */}
        {(email || phone) && (
          <div className="space-y-2">
            {/* Email */}
            {email && (
              <button
                onClick={() => onCopy(email, copyEmailId)}
                className={`group/contact w-full flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br ${colors.cardBg} backdrop-blur-sm rounded-lg border ${colors.border} ${colors.borderHover} transition-all duration-300 cursor-pointer ${colors.shadowCard}`}
              >
                <Mail className={`h-3 w-3 ${colors.textAccent}`} />
                <span className={`text-xs font-bold ${colors.textPrimary} truncate flex-1 text-left`}>
                  {email}
                </span>
                {copiedField === copyEmailId ? (
                  <Check className={`h-3 w-3 ${colors.textAccent}`} />
                ) : (
                  <Copy className={`h-3 w-3 opacity-0 group-hover/contact:opacity-100 transition-opacity ${colors.textAccent}`} />
                )}
              </button>
            )}

            {/* Phone */}
            {phone && (
              <button
                onClick={() => onCopy(phone, copyPhoneId)}
                className={`group/contact w-full flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br ${colors.cardBg} backdrop-blur-sm rounded-lg border ${colors.border} ${colors.borderHover} transition-all duration-300 cursor-pointer ${colors.shadowCard}`}
              >
                <Phone className={`h-3 w-3 ${colors.textAccent}`} />
                <span className={`text-xs font-bold ${colors.textPrimary} flex-1 text-left`}>
                  {phone}
                </span>
                {copiedField === copyPhoneId ? (
                  <Check className={`h-3 w-3 ${colors.textAccent}`} />
                ) : (
                  <Copy className={`h-3 w-3 opacity-0 group-hover/contact:opacity-100 transition-opacity ${colors.textAccent}`} />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}