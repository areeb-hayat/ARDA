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
import WorkflowCanvas from '../../universal/WorkflowComponents/WorkflowCanvas';
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
  basicDetails: {
    name: string;
    profileImage?: string;
  };
  title: string;
  department: string;
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
  const [formSchema, setFormSchema] = useState<FormSchema>(
    functionality?.formSchema || { fields: [], useDefaultFields: true }
  );

  // Errors
  const [errors, setErrors] = useState<string[]>([]);

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

  const handleSave = () => {
    if (validateWorkflow()) {
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);

      onSave({
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
                className={`group relative flex items-center justify-center p-2 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-br ${colors.cardBg} border-2 ${charColors.border} ${colors.shadowCard} hover:scale-110`}
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
              className={`group relative w-full overflow-hidden rounded-lg px-4 py-3 font-bold text-sm transition-all duration-300 bg-gradient-to-r ${cardCharacters.completed.bg} border-2 ${cardCharacters.completed.border} ${cardCharacters.completed.text} flex items-center justify-center gap-2`}
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
                {formSchema.useDefaultFields && formSchema.fields.length === 0 && (
                  <p>✓ Using default form fields</p>
                )}
                {formSchema.fields.length > 0 && (
                  <p>✓ {formSchema.fields.length} custom field{formSchema.fields.length !== 1 ? 's' : ''}</p>
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
              className={`relative w-full overflow-hidden rounded-lg px-4 py-3 font-bold text-sm transition-all duration-300 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} ${colors.shadowCard} hover:${colors.shadowHover} flex items-center justify-center gap-2 group`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 30px ${colors.glowPrimary}` }}
              ></div>
              <Save className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Save Super Workflow</span>
            </button>
            <button
              onClick={onClose}
              className={`relative w-full overflow-hidden rounded-lg px-4 py-3 font-bold text-sm border-2 ${colors.inputBorder} ${colors.inputBg} ${colors.textPrimary} transition-all duration-300 group`}
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
          <WorkflowCanvas
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