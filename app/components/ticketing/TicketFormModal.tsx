// ============================================
// app/components/ticketing/TicketFormModal.tsx
// Modal for creating tickets with dynamic form
// UPDATED WITH THEME CONTEXT MODAL STYLES
// ============================================

import React, { useState, useEffect } from 'react';
import { X, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import DynamicFormField from './DynamicFormField';

interface Functionality {
  _id: string;
  name: string;
  description: string;
  department: string;
  formSchema: {
    fields: any[];
    useDefaultFields: boolean;
  };
}

interface Props {
  functionality: Functionality;
  onClose: () => void;
  onSuccess: (ticketNumber: string) => void;
}

export default function TicketFormModal({ functionality, onClose, onSuccess }: Props) {
  const { colors, cardCharacters, getModalStyles } = useTheme();
  const charColors = cardCharacters.informative;
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFieldChange = (fieldId: string, value: any) => {
    console.log(`🔄 Field "${fieldId}" changed:`, {
      type: typeof value,
      isArray: Array.isArray(value),
      length: Array.isArray(value) ? value.length : 'N/A',
      value: fieldId.includes('attachment') ? 
        (Array.isArray(value) ? `Array with ${value.length} items` : value) : 
        value
    });
    
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  // Debug formData changes
  useEffect(() => {
    if (formData['default-attachments']) {
      console.log('📎 FORMDATA STATE UPDATED - Attachments:', {
        type: typeof formData['default-attachments'],
        isArray: Array.isArray(formData['default-attachments']),
        data: formData['default-attachments']
      });
    }
  }, [formData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    functionality.formSchema.fields.forEach(field => {
      if (field.required) {
        const value = formData[field.id];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          newErrors[field.id] = `${field.label} is required`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setErrorMessage('Please fill in all required fields');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User not logged in');
      }

      const user = JSON.parse(userData);
      
      const userId = user._id || user.id || user.userId || user.username || user.employeeNumber;
      
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      const raisedByData = {
        userId: String(userId),
        name: user.basicDetails?.name || user.displayName || user.username || 'Unknown User',
        email: user.email || user.basicDetails?.email || user.username + '@company.com'
      };

      // Prepare form data
      const preparedFormData = { ...formData };
      
      // ====== COMPREHENSIVE DEBUG LOGGING ======
      console.log('🔍 ====== FORM SUBMISSION DEBUG ======');
      console.log('📋 All form fields:', Object.keys(preparedFormData));
      console.log('📋 Full formData:', preparedFormData);
      
      if (preparedFormData['default-attachments']) {
        console.log('📎 Attachments field exists!');
        console.log('📎 Type:', typeof preparedFormData['default-attachments']);
        console.log('📎 Is Array?:', Array.isArray(preparedFormData['default-attachments']));
        console.log('📎 Value:', preparedFormData['default-attachments']);
        
        if (Array.isArray(preparedFormData['default-attachments'])) {
          console.log('📎 Array length:', preparedFormData['default-attachments'].length);
          preparedFormData['default-attachments'].forEach((item: any, index: number) => {
            console.log(`📎 Item ${index}:`, {
              type: typeof item,
              hasName: item?.name !== undefined,
              hasData: item?.data !== undefined,
              hasContent: item?.content !== undefined,
              value: item
            });
          });
        }
      } else {
        console.log('⚠️ No attachments field in formData!');
      }
      console.log('🔍 ====== END DEBUG ======');
      // ========================================

      const requestBody = {
        functionalityId: functionality._id,
        formData: preparedFormData,
        raisedBy: raisedByData
      };

      console.log('🚀 Sending request with body:', {
        functionalityId: requestBody.functionalityId,
        formDataKeys: Object.keys(requestBody.formData),
        attachments: requestBody.formData['default-attachments']
      });

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      let responseData;
      try {
        const text = await response.text();
        responseData = text ? JSON.parse(text) : {};
      } catch (jsonError) {
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(responseData.error || `Server error: ${response.status}`);
      }

      setTicketNumber(responseData.ticket.ticketNumber);
      setSubmitted(true);

      setTimeout(() => {
        onSuccess(responseData.ticket.ticketNumber);
      }, 2500);
    } catch (error) {
      console.error('❌ Submission error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (submitted) {
    return (
      <div className={getModalStyles()}>
        <div className="absolute inset-0 modal-backdrop" onClick={onClose} aria-hidden="true" />
        
        <div className={`
          relative rounded-2xl border ${colors.modalBorder}
          ${colors.modalBg} ${colors.modalShadow}
          w-full max-w-md
          modal-content p-10 text-center
        `}
          style={{ overflow: 'hidden' }}
        >
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03] pointer-events-none`}></div>
          
          <div className="relative mb-6 flex justify-center">
            <div className="relative">
              <div className={`absolute inset-0 rounded-full blur-3xl opacity-60 animate-pulse`} style={{ backgroundColor: cardCharacters.completed.iconColor.replace('text-', '') }} />
              <CheckCircle className={`relative w-24 h-24 animate-in zoom-in duration-700 ${cardCharacters.completed.iconColor}`} />
            </div>
          </div>
          
          <h2 className={`text-3xl font-black ${cardCharacters.completed.text} mb-3`}>
            Success!
          </h2>
          
          <p className={`text-sm ${colors.textSecondary} mb-6`}>
            Your ticket has been created and submitted to the workflow.
          </p>
          
          <div 
            className={`relative overflow-hidden p-5 rounded-xl mb-8 border-2 bg-gradient-to-r ${cardCharacters.completed.bg} ${cardCharacters.completed.border}`}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
            <p className={`relative text-xs font-semibold ${colors.textSecondary} mb-2`}>
              Ticket Number
            </p>
            <p className={`relative text-3xl font-black tracking-wide ${cardCharacters.completed.text}`}>
              {ticketNumber}
            </p>
          </div>

          <button
            onClick={onClose}
            className={`group relative w-full py-3.5 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 overflow-hidden border-2 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText}`}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ boxShadow: `inset 0 0 30px ${colors.glowPrimary}` }}
            ></div>
            <span className="relative z-10">Close</span>
          </button>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className={`text-2xl font-black ${colors.modalHeaderText} mb-2`}>
                Create New Ticket
              </h2>
              <p className={`text-sm ${colors.textSecondary} flex items-center gap-2 flex-wrap`}>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r ${charColors.bg} ${charColors.text}`}>
                  {functionality.department}
                </span>
                <span>•</span>
                <span>{functionality.name}</span>
              </p>
            </div>
            
            <button
              onClick={onClose}
              className={`group relative p-2 rounded-lg transition-all duration-300 ${colors.buttonGhost} ${colors.buttonGhostText}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mx-6 mt-4">
            <div className={`relative overflow-hidden p-4 rounded-xl border-2 flex items-start gap-3 bg-gradient-to-br ${cardCharacters.urgent.bg} ${cardCharacters.urgent.border}`}>
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              <AlertCircle className={`w-5 h-5 ${cardCharacters.urgent.iconColor} flex-shrink-0 mt-0.5 relative z-10`} />
              <div className="flex-1 relative z-10">
                <p className={`text-sm font-bold ${cardCharacters.urgent.text}`}>{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className={`relative p-6 ${colors.modalContentBg} max-h-[calc(90vh-240px)] overflow-y-auto`}>
          <form onSubmit={handleSubmit} className={`space-y-6 ${colors.modalContentText}`}>
            {functionality.formSchema.fields.map((field) => {
              // Conditional rendering: only show urgency-reason if urgency is "High"
              if (field.id === 'default-urgency-reason') {
                const urgencyValue = formData['default-urgency'];
                if (urgencyValue !== 'High') {
                  return null;
                }
              }

              return (
                <DynamicFormField
                  key={field.id}
                  field={field}
                  value={formData[field.id]}
                  onChange={(value) => handleFieldChange(field.id, value)}
                  error={errors[field.id]}
                />
              );
            })}
          </form>
        </div>

        {/* Footer */}
        <div className={`
          relative px-6 py-4 border-t ${colors.modalFooterBorder}
          ${colors.modalFooterBg} flex justify-end gap-3
        `}>
          <button
            type="button"
            onClick={onClose}
            className={`group relative px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden border-2 ${colors.buttonSecondary} ${colors.buttonSecondaryText} disabled:opacity-50`}
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={`group relative px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden border-2 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText}`}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ boxShadow: `inset 0 0 30px ${colors.glowPrimary}` }}
            ></div>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                <span className="relative z-10">Creating...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Submit Ticket</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}