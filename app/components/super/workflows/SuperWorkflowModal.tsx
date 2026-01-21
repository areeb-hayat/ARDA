// ============================================
// app/components/super/workflows/SuperWorkflowModal.tsx
// Modal for creating/editing cross-departmental workflows
// ============================================

import React, { useState } from 'react';
import { Save, ArrowLeft, FileEdit } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { WorkflowNode, WorkflowEdge, FormSchema } from '../../universal/WorkflowComponents/types';
import SuperWorkflowForm from './SuperWorkflowForm';
import SuperEmployeePanel from './SuperEmployeePanel';
import SuperWorkflowCanvas from './WorkflowCanvas';
import FormBuilderModal from '../../universal/WorkflowComponents/FormBuilderModal';

interface SuperFunctionality {
  _id?: string;
  name: string;
  description: string;
  workflow: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  formSchema: FormSchema;
  accessControl: {
    type: 'organization' | 'departments' | 'specific_users';
    departments?: string[];
    users?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}

interface Employee {
  _id: string;
  basicDetails?: {
    name?: string;
    profileImage?: string;
  };
  name?: string;
  username?: string;
  title?: string;
  department?: string;
}

interface Props {
  functionality: SuperFunctionality | null;
  employees: Employee[];
  onClose: () => void;
  onSave: (func: any) => void;
}

export default function SuperWorkflowModal({ functionality, employees, onClose, onSave }: Props) {
  const { theme, colors, cardCharacters } = useTheme();
  const charColors = cardCharacters.informative;

  // Form state
  const [name, setName] = useState(functionality?.name || '');
  const [description, setDescription] = useState(functionality?.description || '');
  const [accessControl, setAccessControl] = useState(
    functionality?.accessControl || {
      type: 'organization' as const,
      departments: [],
      users: []
    }
  );

  // Workflow state
  const [nodes, setNodes] = useState<WorkflowNode[]>(
    functionality?.workflow.nodes || [
      { id: 'start', type: 'start', position: { x: 80, y: 240 }, data: { label: 'Ticket Raised' } },
      { id: 'end', type: 'end', position: { x: 880, y: 240 }, data: { label: 'Resolved' } }
    ]
  );
  const [edges, setEdges] = useState<WorkflowEdge[]>(functionality?.workflow.edges || []);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Form builder state
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  
  // Initialize formSchema with default fields for NEW workflows only
  const getInitialFormSchema = (): FormSchema => {
    // If editing existing workflow, use its schema as-is
    if (functionality?.formSchema && functionality.formSchema.fields.length > 0) {
      return functionality.formSchema;
    }
    
    // For NEW workflows, provide default fields
    return {
      fields: [
        {
          id: 'default-title',
          type: 'text',
          label: 'Title',
          placeholder: 'Enter ticket title',
          required: true,
          order: 0
        },
        {
          id: 'default-description',
          type: 'textarea',
          label: 'Description',
          placeholder: 'Describe the issue in detail',
          required: true,
          order: 1
        },
        {
          id: 'default-priority',
          type: 'dropdown',
          label: 'Priority',
          required: true,
          options: ['Low', 'Medium', 'High'],
          order: 2
        },
        {
          id: 'default-priority-reason',
          type: 'textarea',
          label: 'Reason for High Priority',
          placeholder: 'Explain why this is high priority',
          required: true, // FIXED: Make it required
          order: 3,
          conditional: {
            dependsOn: 'default-priority',
            showWhen: ['High']
          }
        },
        {
          id: 'default-attachments',
          type: 'file',
          label: 'Attachments',
          placeholder: 'Upload relevant files',
          required: false,
          order: 4
        }
      ],
      useDefaultFields: false
    };
  };
  
  const [formSchema, setFormSchema] = useState<FormSchema>(getInitialFormSchema());

  // Errors
  const [errors, setErrors] = useState<string[]>([]);
  
  // Loading state
  const [isSaving, setIsSaving] = useState(false);

  // Solid backgrounds based on theme
  const modalBg = theme === 'dark' ? '#0a0a1a' : '#ffffff';
  const sidebarBg = theme === 'dark' ? '#16213E' : '#f8f9fa';
  const modalBorder = theme === 'dark' ? '#2196F3' : '#2196F3';

  const validateWorkflow = () => {
    const errs: string[] = [];
    if (!name.trim()) errs.push('Functionality name is required');
    if (nodes.length < 3) errs.push('Add at least one employee node');

    const employeeNodes = nodes.filter(n => n.type === 'employee');
    for (const node of employeeNodes) {
      const hasIncoming = edges.some(e => e.target === node.id);
      const hasOutgoing = edges.some(e => e.source === node.id);
      if (!hasIncoming || !hasOutgoing) {
        errs.push(`Node "${node.data.label}" is not connected`);
      }
    }

    // Validate access control
    if (accessControl.type === 'departments' && (!accessControl.departments || accessControl.departments.length === 0)) {
      errs.push('Select at least one department for access');
    }
    if (accessControl.type === 'specific_users' && (!accessControl.users || accessControl.users.length === 0)) {
      errs.push('Select at least one user for access');
    }

    setErrors(errs);
    return errs.length === 0;
  };

  const handleSave = async () => {
    if (isSaving) return; // Prevent multiple saves
    
    if (validateWorkflow()) {
      setIsSaving(true);
      try {
        const userData = localStorage.getItem('user');
        if (!userData) return;

        const user = JSON.parse(userData);

        await onSave({
          name,
          description,
          workflow: { nodes, edges },
          formSchema,
          accessControl,
          createdBy: {
            userId: user._id,
            name: user.basicDetails?.name || user.username
          }
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleFormSave = (newSchema: FormSchema) => {
    setFormSchema(newSchema);
    setShowFormBuilder(false);
  };

  if (showFormBuilder) {
    return (
      <FormBuilderModal
        initialSchema={formSchema}
        onSave={handleFormSave}
        onCancel={() => setShowFormBuilder(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-[95vw] h-[90vh] rounded-2xl overflow-hidden flex border-2 ${colors.shadowToast}`}
        style={{
          background: modalBg,
          borderColor: modalBorder
        }}
      >
        {/* LEFT SIDEBAR - Form Details */}
        <div
          className="w-80 relative overflow-hidden border-r-2 flex flex-col"
          style={{
            background: sidebarBg,
            borderColor: modalBorder
          }}
        >
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>

          <div className="relative p-6 space-y-4 flex-1 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={onClose}
                disabled={isSaving}
                className={`group relative flex items-center justify-center p-2 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-br ${colors.cardBg} border-2 ${charColors.border} ${colors.shadowCard} hover:scale-110 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
                ></div>
                <ArrowLeft className={`h-5 w-5 relative z-10 transition-transform duration-300 group-hover:-translate-x-1 ${charColors.iconColor}`} />
              </button>
              <h2 className={`text-xl font-black ${charColors.text}`}>
                {functionality ? 'Edit' : 'Create'} Super Workflow
              </h2>
            </div>

            {/* Form Component */}
            <SuperWorkflowForm
              name={name}
              description={description}
              accessControl={accessControl}
              employees={employees}
              errors={errors}
              onNameChange={setName}
              onDescriptionChange={setDescription}
              onAccessControlChange={setAccessControl}
            />

            {/* Form Customization Button */}
            <button
              onClick={() => setShowFormBuilder(true)}
              disabled={isSaving}
              className={`group relative w-full overflow-hidden rounded-lg px-4 py-3 font-bold text-sm transition-all duration-300 bg-gradient-to-r ${cardCharacters.completed.bg} border-2 ${cardCharacters.completed.border} ${cardCharacters.completed.text} flex items-center justify-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 20px ${colors.glowSuccess}` }}
              ></div>
              <FileEdit className={`w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-12 ${cardCharacters.completed.iconColor}`} />
              <span className="relative z-10">Customize Form</span>
            </button>

            <div
              className={`relative overflow-hidden px-3 py-2 rounded-lg text-xs border-2 ${cardCharacters.completed.border}`}
              style={{ background: theme === 'dark' ? 'rgba(27, 94, 32, 0.15)' : 'rgba(27, 94, 32, 0.08)' }}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div className={`relative ${colors.textSecondary}`}>
                {formSchema.fields.length === 0 ? (
                  <p>No custom fields configured</p>
                ) : (
                  <p>✓ {formSchema.fields.length} field{formSchema.fields.length !== 1 ? 's' : ''} configured</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div
            className={`relative p-6 border-t-2 space-y-3`}
            style={{
              background: sidebarBg,
              borderColor: modalBorder
            }}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`relative w-full overflow-hidden rounded-lg px-4 py-3 font-bold text-sm transition-all duration-300 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} ${colors.shadowCard} hover:${colors.shadowHover} flex items-center justify-center gap-2 group ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 30px ${colors.glowPrimary}` }}
              ></div>
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
                  <span className="relative z-10">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Save Super Workflow</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isSaving}
              className={`relative w-full overflow-hidden rounded-lg px-4 py-3 font-bold text-sm border-2 ${colors.inputBorder} ${colors.inputBg} ${colors.textPrimary} transition-all duration-300 group ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 20px ${colors.glowSecondary}` }}
              ></div>
              <span className="relative z-10">Cancel</span>
            </button>
          </div>
        </div>

        {/* CENTER - Canvas */}
        <div className="flex-1 relative">
          <SuperWorkflowCanvas
            nodes={nodes}
            edges={edges}
            employees={employees}
            zoom={zoom}
            pan={pan}
            selectedNode={selectedNode}
            onNodesChange={setNodes}
            onEdgesChange={setEdges}
            onZoomChange={setZoom}
            onPanChange={setPan}
            onNodeSelect={setSelectedNode}
          />
        </div>

        {/* RIGHT SIDEBAR - Employee Panel */}
        <SuperEmployeePanel
          employees={employees}
          sidebarBg={sidebarBg}
          modalBorder={modalBorder}
        />
      </div>
    </div>
  );
}