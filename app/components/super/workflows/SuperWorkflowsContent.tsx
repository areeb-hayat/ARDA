// ============================================
// app/components/super/workflows/SuperWorkflowsContent.tsx
// Main view for Super Workflows (cross-departmental)
// ============================================

'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Loader, AlertCircle, Zap } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import SuperWorkflowModal from './SuperWorkflowModal';
import SuperDeleteConfirmModal from './SuperDeleteConfirmModal';
import SuperFunctionalityCard from './SuperFunctionalityCard';

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
  createdBy: {
    userId: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Employee {
  _id: string;
  basicDetails: {
    name: string;
    profileImage?: string;
  };
  title: string;
  department: string;
}

export default function SuperWorkflowsContent() {
  const { colors, cardCharacters } = useTheme();
  const charColors = cardCharacters.informative;
  
  const [functionalities, setFunctionalities] = useState<SuperFunctionality[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFunctionality, setEditingFunctionality] = useState<SuperFunctionality | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{message: string, count: number} | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch super functionalities and all organization employees
      const [funcRes, empRes] = await Promise.all([
        fetch('/api/super/workflows'),
        fetch('/api/org-employees')
      ]);

      if (funcRes.ok) {
        const funcData = await funcRes.json();
        setFunctionalities(funcData.functionalities || []);
        console.log('✅ Loaded super functionalities:', funcData.functionalities?.length);
      }

      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.employees || []);
        console.log('✅ Loaded employees:', empData.employees?.length);
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFunctionality(null);
    setShowModal(true);
  };

  const handleEdit = (func: SuperFunctionality) => {
    setEditingFunctionality(func);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/super/workflows/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        setFunctionalities(prev => prev.filter(f => f._id !== id));
        setDeleteConfirm(null);
        setDeleteError(null);
        console.log('✅ Super functionality deleted');
      } else {
        setDeleteError({
          message: data.message || data.error,
          count: data.activeTicketCount || 0
        });
        console.error('❌ Delete failed:', data.message);
      }
    } catch (error) {
      console.error('❌ Error deleting functionality:', error);
      setDeleteError({
        message: 'An unexpected error occurred while deleting the super functionality',
        count: 0
      });
    }
  };

  const handleSave = async (functionality: any) => {
    try {
      const method = editingFunctionality ? 'PUT' : 'POST';
      const url = editingFunctionality 
        ? `/api/super/workflows/${editingFunctionality._id}`
        : '/api/super/workflows';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(functionality),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Show update message if tickets were reset
        if (method === 'PUT' && data.ticketsReset > 0) {
          setUpdateMessage(
            `Super workflow updated successfully. ${data.ticketsReset} active ticket(s) have been reset to the start of the new workflow.`
          );
          setTimeout(() => setUpdateMessage(null), 5000);
        }
        
        await loadData();
        setShowModal(false);
        setEditingFunctionality(null);
        console.log('✅ Super functionality saved');
      }
    } catch (error) {
      console.error('❌ Error saving functionality:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Loader className="w-12 h-12 animate-spin mx-auto" style={{ color: colors.brandBlue }} />
          <p className={`${colors.textPrimary} text-lg font-black`}>Loading Super Workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.background} p-8`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="p-3 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${colors.brandBlue}, ${colors.brandLightBlue})`,
              boxShadow: `0 0 30px ${colors.brandBlue}40`
            }}
          >
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className={`text-4xl font-black ${colors.textPrimary}`}>
              Super Workflows
            </h1>
            <p className={colors.textSecondary}>
              Create cross-departmental workflows accessible organization-wide
            </p>
          </div>
        </div>
      </div>

      {/* Update Message */}
      {updateMessage && (
        <div className={`mb-6 p-4 rounded-lg border-2 bg-gradient-to-r ${cardCharacters.completed.bg}`}>
          <div className="flex items-start space-x-3">
            <AlertCircle className={`w-5 h-5 ${cardCharacters.completed.iconColor} mt-0.5 flex-shrink-0`} />
            <p className={`${colors.textPrimary} text-sm`}>{updateMessage}</p>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className={`mb-6 p-4 rounded-xl border-2 ${charColors.border} bg-gradient-to-r ${charColors.bg}`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
        <div className="relative flex items-start space-x-3">
          <AlertCircle className={`w-5 h-5 ${charColors.iconColor} mt-0.5 flex-shrink-0`} />
          <div>
            <p className={`${colors.textPrimary} text-sm font-bold mb-1`}>
              About Super Workflows
            </p>
            <p className={`${colors.textSecondary} text-xs`}>
              Super Workflows enable you to create ticketing processes that span multiple departments. 
              You can assign employees from any department and control who can create tickets through 
              organization-wide, department-specific, or user-specific access controls.
            </p>
          </div>
        </div>
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Create New Card */}
        <button
          onClick={handleCreate}
          className={`relative group bg-gradient-to-br ${colors.cardBg} backdrop-blur-xl border-2 ${colors.border} rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${colors.cardBgHover} ${colors.borderHover} hover:shadow-2xl`}
          style={{ boxShadow: `0 0 30px ${colors.brandBlue}20` }}
        >
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
          <div className="relative flex flex-col items-center justify-center space-y-4 h-full min-h-[280px]">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{
                background: `linear-gradient(135deg, ${colors.brandBlue}20, ${colors.brandLightBlue}20)`,
                boxShadow: `0 0 30px ${colors.brandBlue}40`,
              }}
            >
              <Plus className="w-10 h-10" style={{ color: colors.brandSkyBlue }} />
            </div>
            <div>
              <h3 className={`text-xl font-black ${colors.textPrimary} text-center`}>
                Create Super Workflow
              </h3>
              <p className={`${colors.textSecondary} text-sm text-center mt-2`}>
                Build a cross-departmental workflow
              </p>
            </div>
          </div>
        </button>

        {/* Existing Functionalities */}
        {functionalities.map((func) => (
          <SuperFunctionalityCard
            key={func._id}
            functionality={func}
            onEdit={handleEdit}
            onDelete={() => setDeleteConfirm(func._id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {functionalities.length === 0 && (
        <div className="text-center py-16">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              background: `linear-gradient(135deg, ${colors.brandBlue}10, ${colors.brandLightBlue}10)`,
            }}
          >
            <Zap className="w-12 h-12" style={{ color: colors.brandSkyBlue }} />
          </div>
          <h3 className={`text-2xl font-black ${colors.textPrimary} mb-2`}>
            No Super Workflows Yet
          </h3>
          <p className={`${colors.textSecondary} mb-6`}>
            Create your first cross-departmental workflow to get started
          </p>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <SuperWorkflowModal
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
        <SuperDeleteConfirmModal
          error={deleteError}
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => {
            setDeleteConfirm(null);
            setDeleteError(null);
          }}
        />
      )}
    </div>
  );
}