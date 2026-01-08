// ===== app/(Dashboard)/hr-employee/components/HomeContent/WelcomeSection.tsx =====
'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

export default function WelcomeSection() {
  const { colors } = useTheme();
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('Good Morning');

  useEffect(() => {
    // Get user name from localStorage
    const userData = localStorage.getItem('name');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserName(user.name || user.username || '');
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 17) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  return (
    <div className={`bg-gradient-to-br ${colors.cardBg} backdrop-blur-lg rounded-xl p-5 border ${colors.borderStrong}`}>
      <div className="flex items-center gap-3">
        <Sparkles className="h-7 w-7 text-[#FFD700]" />
        <div>
          <h2 className={`text-2xl font-black ${colors.textPrimary} mb-1`}>
            {greeting}{userName && `, ${userName}`}!
          </h2>
          <p className={`${colors.textAccent} text-sm font-semibold`}>
            Welcome back — Let's make today productive!
          </p>
        </div>
      </div>
    </div>
  );
}