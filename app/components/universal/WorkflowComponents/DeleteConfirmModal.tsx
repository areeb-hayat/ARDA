// ============================================
// DeleteConfirmModal.tsx
// UPDATED WITH THEME CONTEXT MODAL STYLES
// ============================================

import React from 'react';
import { AlertCircle, Trash2, X } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface Props {
  error?: { message: string; count: number } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ error, onConfirm, onCancel }: Props) {
  const { colors, cardCharacters, getModalStyles } = useTheme();
  const urgentChar = cardCharacters.urgent;
  const warningChar = cardCharacters.interactive;

  return (
    <div className={getModalStyles()}>
      <div className="absolute inset-0 modal-backdrop" onClick={onCancel} aria-hidden="true" />
      
      <div 
        className={`
          relative rounded-2xl border ${colors.modalBorder}
          ${colors.modalBg} ${colors.modalShadow}
          w-full max-w-md
          modal-content
        `}
        style={{ overflow: 'hidden' }}
      >
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03] pointer-events-none`}></div>
        
        {/* Content */}
        <div className="relative p-6">
          <div className="text-center space-y-4">
            {/* Icon */}
            <div className={`relative w-20 h-20 rounded-full mx-auto flex items-center justify-center overflow-hidden bg-gradient-to-r ${error ? warningChar.bg : urgentChar.bg}`}>
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div 
                className="absolute inset-0 opacity-30 animate-pulse"
                style={{ boxShadow: `inset 0 0 30px ${error ? colors.glowWarning : 'rgba(244, 67, 54, 0.15)'}` }}
              ></div>
              <AlertCircle className={`relative w-10 h-10 ${error ? warningChar.iconColor : urgentChar.iconColor}`} />
            </div>
            
            {error ? (
              // Error state - showing why deletion failed
              <>
                <div>
                  <h3 className={`text-2xl font-black ${error ? warningChar.text : urgentChar.text} mb-2`}>
                    Cannot Delete Functionality
                  </h3>
                  <p className={`${colors.textSecondary} text-sm`}>
                    {error.message}
                  </p>
                </div>

                {error.count > 0 && (
                  <div className={`relative overflow-hidden p-4 rounded-xl border-2 bg-gradient-to-br ${warningChar.bg} ${warningChar.border}`}>
                    <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                    <div className="relative">
                      <p className={`${warningChar.text} font-black text-xl`}>
                        {error.count} Active Ticket{error.count !== 1 ? 's' : ''}
                      </p>
                      <p className={`${colors.textSecondary} text-sm mt-1`}>
                        Please close all tickets before deleting this functionality
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-center pt-4">
                  <button
                    onClick={onCancel}
                    className={`group relative overflow-hidden rounded-xl px-8 py-3 font-bold text-sm transition-all duration-300 border-2 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText}`}
                  >
                    <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ boxShadow: `inset 0 0 30px ${colors.glowPrimary}` }}
                    ></div>
                    <span className="relative z-10">Got It</span>
                  </button>
                </div>
              </>
            ) : (
              // Normal confirmation state
              <>
                <div>
                  <h3 className={`text-2xl font-black ${urgentChar.text} mb-2`}>
                    Delete Functionality?
                  </h3>
                  <p className={`${colors.textSecondary} text-sm`}>
                    This action cannot be undone. All workflow data will be permanently deleted.
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  {/* Cancel Button */}
                  <button
                    onClick={onCancel}
                    className={`group relative flex-1 overflow-hidden rounded-xl px-4 py-3 font-bold text-sm transition-all duration-300 border-2 ${colors.buttonSecondary} ${colors.buttonSecondaryText}`}
                  >
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ boxShadow: `inset 0 0 20px ${colors.glowSecondary}` }}
                    ></div>
                    <X className="w-4 h-4 inline mr-2 relative z-10 transition-transform duration-300 group-hover:rotate-90" />
                    <span className="relative z-10">Cancel</span>
                  </button>
                  
                  {/* Delete Button */}
                  <button
                    onClick={onConfirm}
                    className={`group relative flex-1 overflow-hidden rounded-xl px-4 py-3 font-bold text-sm transition-all duration-300 border-2 ${urgentChar.border} bg-gradient-to-r ${urgentChar.bg} ${urgentChar.text}`}
                  >
                    <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ boxShadow: 'inset 0 0 30px rgba(244, 67, 54, 0.2)' }}
                    ></div>
                    <Trash2 className={`w-4 h-4 inline mr-2 relative z-10 transition-transform duration-300 group-hover:scale-110 ${urgentChar.iconColor}`} />
                    <span className="relative z-10">Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}