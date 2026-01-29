// app/(Dashboard)/executive/components/ExecutiveWorkflowsContent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle, Building2 } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import FunctionalityCard from '@/app/components/universal/WorkflowComponents/FunctionalityCard';
import WorkflowModal from '@/app/components/universal/WorkflowComponents/WorkflowModal';
import DeleteConfirmModal from '@/app/components/universal/WorkflowComponents/DeleteConfirmModal';
import { Functionality, Employee } from '@/app/components/universal/WorkflowComponents/types';

export default function ExecutiveWorkflowsContent() {
  const { colors, cardCharacters } = useTheme();
  const charColors = cardCharacters.informative;
  
  const [executiveDepartments, setExecutiveDepartments] = useState<string[]>([]);
  const [activeDepartment, setActiveDepartment] = useState<string>('');
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  
  const [functionalities, setFunctionalities] = useState<Functionality[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFunctionality, setEditingFunctionality] = useState<Functionality | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{message: string, count: number} | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  // Get user ID for fetching executive departments
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserId(user._id || user.id || user.userId || user.username);
    }
  }, []);

  // Fetch executive departments
  useEffect(() => {
    if (userId) {
      fetchExecutiveDepartments();
    }
  }, [userId]);

  // Load workflows when active department changes
  useEffect(() => {
    if (activeDepartment) {
      loadData();
    }
  }, [activeDepartment]);

  const fetchExecutiveDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await fetch(`/api/admin/executive-departments?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        const depts = data.departments || [];
        setExecutiveDepartments(depts);
        
        // Set first department as active
        if (depts.length > 0 && !activeDepartment) {
          setActiveDepartment(depts[0]);
        }
      } else {
        console.error('Failed to fetch executive departments');
      }
    } catch (error) {
      console.error('Error fetching executive departments:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadData = async () => {
    if (!activeDepartment) return;

    try {
      setLoading(true);

      const [funcRes, empRes] = await Promise.all([
        fetch(`/api/functionalities?department=${encodeURIComponent(activeDepartment)}`),
        fetch(`/api/dept-employees?department=${encodeURIComponent(activeDepartment)}`)
      ]);

      if (funcRes.ok) {
        const funcData = await funcRes.json();
        setFunctionalities(funcData.functionalities || []);
      }

      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.employees || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFunctionality(null);
    setShowModal(true);
  };

  const handleEdit = (func: Functionality) => {
    setEditingFunctionality(func);
    setShowModal(true);
  };

  const handleToggleActive = (id: string, newStatus: boolean) => {
    setFunctionalities(prev => 
      prev.map(f => f._id === id ? { ...f, isActive: newStatus } : f)
    );
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/functionalities/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        setFunctionalities(prev => prev.filter(f => f._id !== id));
        setDeleteConfirm(null);
        setDeleteError(null);
      } else {
        setDeleteError({
          message: data.message || data.error,
          count: data.activeTicketCount || 0
        });
      }
    } catch (error) {
      console.error('Error deleting functionality:', error);
      setDeleteError({
        message: 'An unexpected error occurred while deleting the functionality',
        count: 0
      });
    }
  };

  const handleSave = async (functionality: Omit<Functionality, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const method = editingFunctionality ? 'PUT' : 'POST';
      const url = editingFunctionality 
        ? `/api/functionalities/${editingFunctionality._id}`
        : '/api/functionalities';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...functionality, department: activeDepartment }),
      });

      if (res.ok) {
        const data = await res.json();
        
        if (method === 'PUT' && data.ticketsReset > 0) {
          setUpdateMessage(
            `Functionality updated successfully. ${data.ticketsReset} active ticket(s) have been reset to the start of the new workflow.`
          );
          setTimeout(() => setUpdateMessage(null), 5000);
        }
        
        await loadData();
        setShowModal(false);
        setEditingFunctionality(null);
      }
    } catch (error) {
      console.error('Error saving functionality:', error);
    }
  };

  if (loadingDepartments) {
    return (
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} p-8`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative">
            <h2 className={`text-xl font-black ${charColors.text} mb-2`}>Workflow Management</h2>
            <p className={`text-sm ${colors.textMuted}`}>Loading your departments...</p>
          </div>
        </div>
      </div>
    );
  }

  if (executiveDepartments.length === 0) {
    return (
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} p-8`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative text-center">
            <Building2 className={`h-16 w-16 ${colors.textMuted} mx-auto mb-4 opacity-40`} />
            <h2 className={`text-xl font-black ${charColors.text} mb-2`}>No Departments Assigned</h2>
            <p className={`text-sm ${colors.textMuted}`}>
              No departments have been assigned to your executive account. Please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Paper Texture Background */}
      <div className={`fixed inset-0 ${colors.paperTexture} opacity-[0.02] pointer-events-none`}></div>
      
      <div className="min-h-screen p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} p-6`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative">
            <h1 className={`text-4xl font-black ${charColors.text} mb-2`}>
              Workflow Management
            </h1>
            <p className={colors.textSecondary}>
              Create and manage ticketing functionalities with visual workflows
            </p>
          </div>
        </div>

        {/* Department Tabs */}
        <div className={`relative overflow-hidden rounded-2xl border-2 backdrop-blur-sm bg-gradient-to-br ${colors.cardBg} ${colors.border} ${colors.shadowCard}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          
          <div className="relative p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className={`h-5 w-5 ${charColors.iconColor} transition-all duration-300`} />
              <span className={`text-sm font-bold ${colors.textSecondary} uppercase tracking-wider`}>
                Your Departments
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {executiveDepartments.map((dept) => {
                const isActive = activeDepartment === dept;
                
                return (
                  <button
                    key={dept}
                    onClick={() => setActiveDepartment(dept)}
                    className={`group relative px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden border-2 ${
                      isActive
                        ? `bg-gradient-to-r ${charColors.bg} ${charColors.border} ${charColors.text}`
                        : `${colors.inputBg} ${colors.textSecondary} ${colors.borderSubtle}`
                    }`}
                  >
                    {/* Paper Texture */}
                    <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                    
                    {/* Internal Glow - appears on hover */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ 
                        boxShadow: isActive 
                          ? `inset 0 0 20px ${colors.glowPrimary}` 
                          : `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` 
                      }}
                    ></div>
                    
                    <span className="relative z-10">{dept}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Update Message */}
        {updateMessage && (
          <div className={`relative overflow-hidden p-4 rounded-xl border-2 flex items-center gap-4 bg-gradient-to-br ${cardCharacters.completed.bg} ${cardCharacters.completed.border}`}>
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
            <div className="relative flex items-start space-x-3">
              <AlertCircle className={`w-5 h-5 ${cardCharacters.completed.iconColor} mt-0.5 flex-shrink-0`} />
              <p className={`${colors.textPrimary} text-sm`}>{updateMessage}</p>
            </div>
          </div>
        )}

        {/* Workflows Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <div className={`absolute inset-0 rounded-full blur-2xl opacity-30 animate-pulse`} style={{ backgroundColor: charColors.iconColor.replace('text-', '') }} />
                <Loader2 className={`relative w-12 h-12 animate-spin ${charColors.iconColor}`} />
              </div>
              <p className={`${colors.textSecondary} text-sm font-semibold`}>
                Loading workflows for {activeDepartment}...
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Button */}
            <button
              onClick={handleCreate}
              className={`group relative overflow-hidden rounded-xl border-2 backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} p-8 transition-all duration-300`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 30px ${colors.glowPrimary}` }}
              ></div>
              <div className="relative flex flex-col items-center justify-center space-y-4 h-full min-h-[280px]">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 group-hover:rotate-90 bg-gradient-to-r ${charColors.bg} border-2 ${charColors.border}`}>
                  <Plus className={`w-10 h-10 ${charColors.iconColor} transition-all duration-300 group-hover:scale-110`} />
                </div>
                <div>
                  <h3 className={`text-xl font-black ${charColors.text} text-center`}>
                    Create New Functionality
                  </h3>
                  <p className={`${colors.textSecondary} text-sm text-center mt-2`}>
                    Build a custom workflow
                  </p>
                </div>
              </div>
            </button>

            {/* Functionality Cards */}
            {functionalities.map((func) => (
              <FunctionalityCard
                key={func._id}
                functionality={func}
                onEdit={handleEdit}
                onDelete={() => setDeleteConfirm(func._id)}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <WorkflowModal
          functionality={editingFunctionality}
          employees={employees}
          onClose={() => {
            setShowModal(false);
            setEditingFunctionality(null);
          }}
          onSave={handleSave}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal
          error={deleteError}
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => {
            setDeleteConfirm(null);
            setDeleteError(null);
          }}
        />
      )}
    </>
  );
}