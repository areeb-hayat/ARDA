// ============================================
// app/components/ticketing/MyTicketsWrapper.tsx
// Wrapper that fetches user info and passes to MyTickets
// UPDATED WITH CONSISTENT THEME STYLING
// ============================================

'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, RefreshCw, TicketIcon } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import MyTickets from './MyTickets';

interface MyTicketsWrapperProps {
  onBack?: () => void;
}

export default function MyTicketsWrapper({ onBack }: MyTicketsWrapperProps) {
  const { colors, cardCharacters, showToast } = useTheme();
  const charColors = cardCharacters.informative;
  
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      setError('Please log in again');
      setLoading(false);
      return;
    }

    const user = JSON.parse(userData);
    const username = user.username;
    
    if (!username) {
      setError('Username not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/get-user-id?identifier=${encodeURIComponent(username)}`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setError('Server error: API route not found.');
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (response.ok) {
        user._id = data.userId;
        localStorage.setItem('user', JSON.stringify(user));
        
        setUserId(data.userId);
        setUserName(data.username);
      } else {
        setError(data.error || 'Unable to fetch user information');
      }
    } catch (error) {
      setError('Failed to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Card with Loading State */}
        <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} transition-all duration-300`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${charColors.bg} border-2 ${charColors.border}`}>
                  <TicketIcon className={`h-6 w-6 ${charColors.iconColor}`} />
                </div>
                <div>
                  <h1 className={`text-2xl font-black ${charColors.text}`}>My Tickets</h1>
                  <p className={`text-sm ${colors.textMuted}`}>Loading your tickets...</p>
                </div>
              </div>
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
              Loading your tickets...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* Header Card with Error State */}
        <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} transition-all duration-300`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${charColors.bg} border-2 ${charColors.border}`}>
                  <TicketIcon className={`h-6 w-6 ${charColors.iconColor}`} />
                </div>
                <div>
                  <h1 className={`text-2xl font-black ${charColors.text}`}>My Tickets</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.urgent.bg} ${cardCharacters.urgent.border} p-10 text-center`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative">
            <div className="mb-6">
              <AlertCircle className={`w-16 h-16 mx-auto ${cardCharacters.urgent.iconColor}`} />
            </div>
            
            <h3 className={`text-xl font-black ${cardCharacters.urgent.text} mb-3`}>
              Unable to Load Tickets
            </h3>
            <p className={`${colors.textSecondary} text-sm mb-6 max-w-md mx-auto`}>
              {error}
            </p>
            
            <button
              onClick={fetchUserInfo}
              className={`group relative px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 overflow-hidden border-2 inline-flex items-center gap-2 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText}`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
              ></div>
              <RefreshCw className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:rotate-180" />
              <span className="relative z-10">Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <MyTickets userId={userId} onBack={onBack} />;
}