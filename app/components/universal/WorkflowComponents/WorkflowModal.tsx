import React, { useState } from 'react';
import { Save, Users, AlertCircle, Search, X, UserPlus, FileEdit, ArrowLeft } from 'lucide-react';
import { Functionality, Employee, WorkflowNode, WorkflowEdge, FormSchema } from './types';
import EmployeeDragItem from './EmployeeDragItem';
import GroupDragItem from './GroupDragItem';
import WorkflowCanvas from './WorkflowCanvas';
import FormBuilderModal from './FormBuilderModal';
import { useTheme } from '@/app/context/ThemeContext';

interface GroupData {
  id: string;
  lead: Employee;
  members: Employee[];
}

interface Props {
  functionality: Functionality | null;
  employees: Employee[];
  onClose: () => void;
  onSave: (func: any) => void;
}

export default function WorkflowModal({ functionality, employees, onClose, onSave }: Props) {
  const { theme, colors, cardCharacters } = useTheme();
  const charColors = cardCharacters.informative;
  
  const [name, setName] = useState(functionality?.name || '');
  const [description, setDescription] = useState(functionality?.description || '');
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
  const [errors, setErrors] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupLead, setGroupLead] = useState<string>('');
  const [createdGroups, setCreatedGroups] = useState<GroupData[]>([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');

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

  // Loading state
  const [isSaving, setIsSaving] = useState(false);

  // Solid backgrounds based on theme
  const modalBg = theme === 'dark' ? '#0a0a1a' : '#ffffff';
  const sidebarBg = theme === 'dark' ? '#16213E' : '#f8f9fa';
  const modalBorder = theme === 'dark' ? '#2196F3' : '#2196F3';

  const filteredEmployees = employees.filter(emp =>
    emp.basicDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupModalEmployees = employees.filter(emp => 
    emp._id !== groupLead && (
      emp.basicDetails.name.toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
      emp.title.toLowerCase().includes(groupSearchQuery.toLowerCase())
    )
  );

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
    
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSave = async () => {
    if (isSaving) return; // Prevent multiple saves
    
    if (validateWorkflow()) {
      setIsSaving(true);
      try {
        await onSave({ name, description, workflow: { nodes, edges }, formSchema });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCreateGroup = () => {
    if (selectedMembers.length === 0 || !groupLead) {
      alert('Please select at least one member and a group lead');
      return;
    }

    const leadEmployee = employees.find(e => e._id === groupLead);
    const memberEmployees = selectedMembers
      .map(id => employees.find(e => e._id === id))
      .filter(Boolean) as Employee[];

    if (!leadEmployee) return;

    const newGroup: GroupData = {
      id: `group-${Date.now()}`,
      lead: leadEmployee,
      members: memberEmployees,
    };

    setCreatedGroups(prev => [...prev, newGroup]);
    setShowGroupModal(false);
    setSelectedMembers([]);
    setGroupLead('');
    setGroupSearchQuery('');
  };

  const toggleMemberSelection = (empId: string) => {
    setSelectedMembers(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
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
                {functionality ? 'Edit' : 'Create'} Workflow
              </h2>
            </div>
            
            {/* Name Input */}
            <div>
              <label className={`block text-xs font-bold mb-2 ${colors.textSecondary} uppercase tracking-wide`}>
                Functionality Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                className={`w-full px-4 py-3 rounded-lg text-sm transition-all ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder} focus:outline-none focus:border-[#64B5F6] ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="e.g., IT Support, HR Requests..."
              />
            </div>
            
            {/* Description */}
            <div>
              <label className={`block text-xs font-bold mb-2 ${colors.textSecondary} uppercase tracking-wide`}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
                rows={3}
                className={`w-full px-4 py-3 rounded-lg text-sm transition-all ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder} focus:outline-none focus:border-[#64B5F6] resize-none ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="Brief description of this workflow..."
              />
            </div>

            {/* Form Customization */}
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

            {/* Errors */}
            {errors.length > 0 && (
              <div className={`relative overflow-hidden p-3 rounded-lg border-2 ${cardCharacters.urgent.border}`}>
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                <div className="relative flex items-start gap-2">
                  <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${cardCharacters.urgent.iconColor}`} />
                  <div className="space-y-1">
                    {errors.map((err, i) => (
                      <p key={i} className={`text-xs ${cardCharacters.urgent.text}`}>{err}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
                  <span className="relative z-10">Save Workflow</span>
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

        {/* RIGHT SIDEBAR - Nodes & Employees */}
        <div 
          className="w-80 relative overflow-hidden border-l-2 flex flex-col"
          style={{ 
            background: sidebarBg,
            borderColor: modalBorder
          }}
        >
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          
          <div className="relative p-6 space-y-4 flex-1 overflow-y-auto">
            <h3 className={`text-lg font-black ${charColors.text} uppercase tracking-wide`}>
              Build Workflow
            </h3>

            {/* Create Group Button */}
            <button
              onClick={() => setShowGroupModal(true)}
              disabled={isSaving}
              className={`group relative w-full overflow-hidden rounded-lg px-4 py-3 font-bold text-sm transition-all duration-300 bg-gradient-to-r ${cardCharacters.creative.bg} border-2 ${cardCharacters.creative.border} ${cardCharacters.creative.text} flex items-center justify-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: 'inset 0 0 20px rgba(161, 136, 127, 0.2)' }}
              ></div>
              <Users className={`w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-12 ${cardCharacters.creative.iconColor}`} />
              <span className="relative z-10">Create Parallel Group</span>
            </button>

            {/* Parallel Groups */}
            {createdGroups.length > 0 && (
              <div className="space-y-2">
                <p className={`text-xs font-bold ${colors.textSecondary} uppercase tracking-wide`}>
                  Parallel Groups
                </p>
                <div className="space-y-2">
                  {createdGroups.map(group => (
                    <GroupDragItem
                      key={group.id}
                      groupLead={group.lead}
                      members={group.members}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Individual Employees */}
            <div className="space-y-2">
              <p className={`text-xs font-bold ${colors.textSecondary} uppercase tracking-wide`}>
                Individual Employees
              </p>

              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${colors.textMuted}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isSaving}
                  placeholder="Search employees..."
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg text-sm ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder} focus:outline-none focus:border-[#64B5F6] ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} disabled={isSaving} className={`absolute right-3 top-1/2 -translate-y-1/2 ${colors.textMuted} hover:${cardCharacters.urgent.iconColor} transition-colors ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {filteredEmployees.length === 0 ? (
                  <p className={`text-center text-sm ${colors.textSecondary} py-8`}>
                    No employees found
                  </p>
                ) : (
                  filteredEmployees.map(emp => (
                    <EmployeeDragItem key={emp._id} employee={emp} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div 
            className={`w-full max-w-2xl relative overflow-hidden rounded-2xl border-2 ${colors.shadowToast}`}
            style={{ 
              background: modalBg,
              borderColor: cardCharacters.creative.border.replace('border-', '')
            }}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
            
            <div className="relative p-6">
              <h3 className={`text-2xl font-black ${cardCharacters.creative.text} mb-6`}>
                Create Parallel Group
              </h3>

              <div className="space-y-4">
                <div>
                  <label className={`block ${colors.textSecondary} text-sm font-bold mb-2`}>
                    Group Lead *
                  </label>
                  <select
                    value={groupLead}
                    onChange={(e) => setGroupLead(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg text-sm ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.textPrimary} focus:outline-none focus:border-[#64B5F6]`}
                  >
                    <option value="">Select a group lead...</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.basicDetails.name} - {emp.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block ${colors.textSecondary} text-sm font-bold mb-2`}>
                    Group Members *
                  </label>
                  
                  <div className="relative mb-3">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${colors.textMuted}`} />
                    <input
                      type="text"
                      value={groupSearchQuery}
                      onChange={(e) => setGroupSearchQuery(e.target.value)}
                      placeholder="Search members..."
                      className={`w-full pl-10 pr-10 py-2.5 rounded-lg text-sm ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.textPrimary} focus:outline-none focus:border-[#64B5F6]`}
                    />
                    {groupSearchQuery && (
                      <button onClick={() => setGroupSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <X className={`w-4 h-4 ${colors.textMuted}`} />
                      </button>
                    )}
                  </div>

                  <div className={`max-h-64 overflow-y-auto space-y-2 p-3 rounded-lg border-2 ${colors.inputBorder}`}>
                    {groupModalEmployees.length === 0 ? (
                      <p className={`text-center text-sm ${colors.textSecondary} py-4`}>
                        {groupSearchQuery ? 'No employees found' : 'Select a group lead first'}
                      </p>
                    ) : (
                      groupModalEmployees.map(emp => (
                        <label
                          key={emp._id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                            selectedMembers.includes(emp._id) 
                              ? `bg-gradient-to-r ${cardCharacters.creative.bg} border-2 ${cardCharacters.creative.border}` 
                              : `${colors.inputBg} border-2 ${colors.inputBorder} hover:${colors.borderHover}`
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(emp._id)}
                            onChange={() => toggleMemberSelection(emp._id)}
                            className="w-4 h-4"
                          />
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{ background: `linear-gradient(135deg, ${cardCharacters.creative.iconColor.replace('text-', '')}, ${cardCharacters.creative.accent.replace('text-', '')})` }}
                          >
                            {emp.basicDetails.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-bold ${colors.textPrimary}`}>
                              {emp.basicDetails.name}
                            </p>
                            <p className={`text-xs ${colors.textSecondary}`}>
                              {emp.title}
                            </p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>

                  {selectedMembers.length > 0 && (
                    <p className={`text-sm ${colors.textSecondary} mt-2`}>
                      ✓ {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateGroup}
                  className={`group relative flex-1 overflow-hidden rounded-lg px-6 py-3 font-bold text-sm transition-all duration-300 bg-gradient-to-r ${cardCharacters.creative.bg} border-2 ${cardCharacters.creative.border} ${cardCharacters.creative.text} flex items-center justify-center gap-2`}
                >
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: 'inset 0 0 30px rgba(161, 136, 127, 0.2)' }}
                  ></div>
                  <UserPlus className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Create Group</span>
                </button>
                <button
                  onClick={() => {
                    setShowGroupModal(false);
                    setSelectedMembers([]);
                    setGroupLead('');
                    setGroupSearchQuery('');
                  }}
                  className={`relative px-6 py-3 rounded-lg font-bold text-sm border-2 ${colors.inputBorder} ${colors.inputBg} ${colors.textPrimary} group`}
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 20px ${colors.glowSecondary}` }}
                  ></div>
                  <span className="relative z-10">Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}