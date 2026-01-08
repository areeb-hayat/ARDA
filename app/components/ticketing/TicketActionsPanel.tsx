// ============================================
// app/components/ticketing/TicketActionsPanel.tsx
// Main panel with tabs - Details first, then Actions
// UPDATED WITH SUPER WORKFLOW SUPPORT
// ============================================

'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import TicketDetailsView from './TicketDetailsView';
import TicketActionsList from './TicketActionsList';

interface Ticket {
  _id: string;
  ticketNumber: string;
  functionalityName: string;
  status: string;
  workflowStage: string;
  currentAssignee: string;
  currentAssignees: string[];
  groupLead: string | null;
  department: string;
  functionality: any;
  raisedBy: {
    name: string;
    userId: string;
  };
  formData?: Record<string, any>;
  workflowHistory: any[];
  blockers: any[];
  createdAt: string;
}

interface Props {
  ticket: Ticket;
  userId: string;
  userName: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface WorkflowPosition {
  isFirst: boolean;
  isLast: boolean;
  canForward: boolean;
  canRevert: boolean;
  nextNodeType: string | null;
  prevNodeType: string | null;
}

export default function TicketActionsPanel({ ticket, userId, userName, onClose, onUpdate }: Props) {
  const { colors, cardCharacters, getModalStyles, showToast } = useTheme();
  const charColors = cardCharacters.informative;
  
  const [activeTab, setActiveTab] = useState<'details' | 'actions'>('details');
  const [loading, setLoading] = useState(false);

  // Workflow analysis
  const [workflowPosition, setWorkflowPosition] = useState<WorkflowPosition>({
    isFirst: false,
    isLast: false,
    canForward: false,
    canRevert: false,
    nextNodeType: null,
    prevNodeType: null
  });

  // Permission states
  const [isGroupLead, setIsGroupLead] = useState(false);
  const [isGroupMember, setIsGroupMember] = useState(false);
  const [canTakeActions, setCanTakeActions] = useState(false);

  useEffect(() => {
    analyzeWorkflowPosition();
    analyzePermissions();
  }, [ticket, userId]);

  const analyzePermissions = () => {
    const inGroup = ticket.currentAssignees && ticket.currentAssignees.length > 1;
    const isLead = ticket.groupLead === userId;
    const isMember = ticket.currentAssignees?.includes(userId);
    
    setIsGroupLead(isLead);
    setIsGroupMember(inGroup && isMember);
    setCanTakeActions(!inGroup || isLead);
  };

  const analyzeWorkflowPosition = () => {
    console.log('🔍 Analyzing workflow position for ticket:', {
      ticketNumber: ticket.ticketNumber,
      ticketId: ticket._id,
      department: ticket.department,
      currentStage: ticket.workflowStage,
      hasFunctionality: !!ticket.functionality,
      functionalityKeys: ticket.functionality ? Object.keys(ticket.functionality) : [],
      hasWorkflow: !!ticket.functionality?.workflow,
      workflowKeys: ticket.functionality?.workflow ? Object.keys(ticket.functionality.workflow) : [],
      workflowNodes: ticket.functionality?.workflow?.nodes?.length,
      workflowEdges: ticket.functionality?.workflow?.edges?.length
    });

    if (!ticket.functionality) {
      console.error('❌ No functionality object in ticket!');
      return;
    }

    if (!ticket.functionality.workflow) {
      console.error('❌ No workflow in functionality object!');
      console.log('Functionality object:', ticket.functionality);
      return;
    }

    const workflow = ticket.functionality.workflow;
    const currentNodeIndex = workflow.nodes.findIndex((n: any) => n.id === ticket.workflowStage);
    const currentNode = workflow.nodes[currentNodeIndex];

    console.log('📍 Current node:', {
      index: currentNodeIndex,
      node: currentNode,
      type: currentNode?.type
    });

    const employeeNodes = workflow.nodes.filter((n: any) => n.type === 'employee');
    const firstEmployeeNode = employeeNodes[0];
    const lastEmployeeNode = employeeNodes[employeeNodes.length - 1];

    const isFirst = currentNode?.id === firstEmployeeNode?.id;
    const isLast = currentNode?.id === lastEmployeeNode?.id;

    console.log('🎯 Position:', { isFirst, isLast });

    const nextEdge = workflow.edges.find((e: any) => e.source === ticket.workflowStage);
    let nextNode = null;
    let nextNodeType = null;
    if (nextEdge) {
      nextNode = workflow.nodes.find((n: any) => n.id === nextEdge.target);
      nextNodeType = nextNode?.type || null;
      console.log('➡️ Next node:', { edge: nextEdge, node: nextNode, type: nextNodeType });
    } else {
      console.log('⚠️ No next edge found');
    }

    const prevEdge = workflow.edges.find((e: any) => e.target === ticket.workflowStage);
    let prevNode = null;
    let prevNodeType = null;
    if (prevEdge) {
      prevNode = workflow.nodes.find((n: any) => n.id === prevEdge.source);
      prevNodeType = prevNode?.type || null;
      console.log('⬅️ Previous node:', { edge: prevEdge, node: prevNode, type: prevNodeType });
    }

    const canForward = !!nextEdge && !!nextNode;
    const canRevert = !!prevEdge && !!prevNode && prevNode.type !== 'start';

    console.log('✅ Final position:', {
      canForward,
      canRevert,
      nextNodeType,
      prevNodeType
    });

    setWorkflowPosition({
      isFirst,
      isLast,
      canForward,
      canRevert,
      nextNodeType,
      prevNodeType
    });
  };

  const performAction = async (action: string, payload: any) => {
    try {
      setLoading(true);

      console.log('🎬 Performing action:', action);
      console.log('📦 Payload:', payload);

      const response = await fetch(`/api/tickets/${ticket._id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Action failed');
      }

      showToast('Action performed successfully!', 'success');
      onUpdate();
    } catch (error) {
      console.error('Error performing action:', error);
      showToast(error instanceof Error ? error.message : 'Failed to perform action', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={getModalStyles()}>
      <div className="absolute inset-0 modal-backdrop" onClick={onClose} aria-hidden="true" />
      
      <div 
        className={`
          relative rounded-2xl border ${colors.modalBorder}
          ${colors.modalBg} ${colors.modalShadow}
          w-full max-w-3xl
          modal-content flex flex-col
        `}
        style={{ overflow: 'hidden' }}
      >
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03] pointer-events-none`}></div>

        {/* Header */}
        <div className={`
          relative px-6 py-4 border-b ${colors.modalFooterBorder}
          ${colors.modalHeaderBg}
        `}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <h2 className={`text-2xl font-black ${colors.modalHeaderText} mb-1`}>
                {ticket.ticketNumber}
              </h2>
              <p className={`text-sm ${colors.textSecondary}`}>
                {ticket.functionalityName}
              </p>
              {isGroupMember && (
                <p className={`text-xs mt-2 font-semibold flex items-center gap-1.5 ${cardCharacters.creative.text}`}>
                  {isGroupLead ? '👑 Group Lead' : '👥 Group Member'}
                </p>
              )}
            </div>
            
            <button
              onClick={onClose}
              className={`group relative p-2 rounded-lg transition-all duration-300 ${colors.buttonGhost} ${colors.buttonGhostText}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 px-6 py-3 font-bold text-sm transition-all duration-300 rounded-t-lg relative ${
                activeTab === 'details'
                  ? charColors.accent
                  : colors.textSecondary
              }`}
            >
              {activeTab === 'details' && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full"
                  style={{ backgroundColor: charColors.iconColor.replace('text-', '') }}
                />
              )}
              <span className="relative z-10">Details</span>
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`flex-1 px-6 py-3 font-bold text-sm transition-all duration-300 rounded-t-lg relative ${
                activeTab === 'actions'
                  ? charColors.accent
                  : colors.textSecondary
              }`}
            >
              {activeTab === 'actions' && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full"
                  style={{ backgroundColor: charColors.iconColor.replace('text-', '') }}
                />
              )}
              <span className="relative z-10">Actions</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`relative p-6 ${colors.modalContentBg} max-h-[calc(90vh-200px)] overflow-y-auto`}>
          <div className={colors.modalContentText}>
            {activeTab === 'details' ? (
              <TicketDetailsView 
                ticket={ticket}
                workflowPosition={workflowPosition}
              />
            ) : (
              <TicketActionsList
                ticket={ticket}
                userId={userId}
                userName={userName}
                workflowPosition={workflowPosition}
                canTakeActions={canTakeActions}
                isGroupLead={isGroupLead}
                isGroupMember={isGroupMember}
                onActionPerform={performAction}
                loading={loading}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`
          relative px-6 py-4 border-t ${colors.modalFooterBorder}
          ${colors.modalFooterBg}
        `}>
          <button
            onClick={onClose}
            className={`group relative w-full px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden border-2 ${colors.buttonSecondary} ${colors.buttonSecondaryText}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}