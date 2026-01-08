// ============================================
// app/components/super/workflows/SuperDeleteConfirmModal.tsx
// Confirmation modal for deleting super functionalities
// ============================================

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface Props {
  error: { message: string; count: number } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SuperDeleteConfirmModal({ error, onConfirm, onCancel }: Props) {
  const { colors, cardCharacters } = useTheme();
  const charColors = cardCharacters.urgent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-md relative overflow-hidden rounded-2xl border-2 ${colors.shadowToast}`}
        style={{
          background: colors.background.includes('dark') ? '#0a0a1a' : '#ffffff',
          borderColor: charColors.border.replace('border-', '')
        }}
      >
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div
              className={`p-3 rounded-xl`}
              style={{
                background: `linear-gradient(135deg, rgba(244, 67, 54, 0.2), rgba(229, 57, 53, 0.2))`,
                boxShadow: '0 0 20px rgba(244, 67, 54, 0.3)'
              }}
            >
              <AlertTriangle className={`w-8 h-8 ${charColors.iconColor}`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-2xl font-black ${charColors.text} mb-2`}>
                {error ? 'Cannot Delete' : 'Confirm Deletion'}
              </h3>
              {error ? (
                <div className="space-y-2">
                  <p className={`${colors.textPrimary} text-sm`}>
                    {error.message}
                  </p>
                  {error.count > 0 && (
                    <div className={`p-3 rounded-lg border-2 ${charColors.border} bg-gradient-to-r ${charColors.bg}`}>
                      <p className={`${charColors.text} text-xs font-bold`}>
                        {error.count} active ticket{error.count !== 1 ? 's' : ''} must be closed before deletion
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className={`${colors.textSecondary} text-sm`}>
                  Are you sure you want to delete this super workflow? This action cannot be undone.
                </p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {!error && (
              <button
                onClick={onConfirm}
                className={`flex-1 relative overflow-hidden rounded-lg px-6 py-3 font-bold text-sm transition-all duration-300 bg-gradient-to-r ${charColors.bg} border-2 ${charColors.border} ${charColors.text} group`}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: 'inset 0 0 30px rgba(244, 67, 54, 0.3)' }}
                ></div>
                <span className="relative z-10">Delete Super Workflow</span>
              </button>
            )}
            <button
              onClick={onCancel}
              className={`${error ? 'flex-1' : 'flex-1'} relative overflow-hidden rounded-lg px-6 py-3 font-bold text-sm border-2 ${colors.inputBorder} ${colors.inputBg} ${colors.textPrimary} transition-all duration-300 group`}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 20px ${colors.glowSecondary}` }}
              ></div>
              <span className="relative z-10">{error ? 'Close' : 'Cancel'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}