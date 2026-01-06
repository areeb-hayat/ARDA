// app/context/ThemeContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type ToastType = 'success' | 'error' | 'warning' | 'info';
type CardCharacter = 'authoritative' | 'creative' | 'informative' | 'interactive' | 'neutral' | 'urgent' | 'completed';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Card Character Definitions
interface CardCharacterColors {
  bg: string;
  text: string;
  border: string;
  accent: string;
  hoverBg: string;
  iconColor: string;
}

interface CardCharacterSet {
  authoritative: CardCharacterColors;
  creative: CardCharacterColors;
  informative: CardCharacterColors;
  interactive: CardCharacterColors;
  neutral: CardCharacterColors;
  urgent: CardCharacterColors;
  completed: CardCharacterColors;
}

interface ThemeColors {
  // PAPER TEXTURE BACKGROUND
  paperTexture: string;
  paperBg: string;
  paperOverlay: string;
  
  // CARD CHARACTER SETS
  cardCharacters: CardCharacterSet;
  
  // Backgrounds
  background: string;
  backgroundGradient: string;
  cardBg: string;
  cardBgHover: string;
  glassBg: string;
  sidebarBg: string;
  sidebarItemBg: string;
  sidebarItemBgHover: string;
  sidebarItemActiveBg: string;
  
  // Borders
  border: string;
  borderHover: string;
  borderStrong: string;
  borderSubtle: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textAccent: string;
  textOnDark: string;
  textOnLight: string;

  // Modal Styles - ADD THESE
  modalOverlay: string;
  modalBg: string;
  modalBorder: string;
  modalShadow: string;
  modalHeaderBg: string;
  modalHeaderText: string;
  modalContentBg: string;
  modalContentText: string;
  modalFooterBg: string;
  modalFooterBorder: string;
  
  // Input fields
  inputBg: string;
  inputBorder: string;
  inputFocusBg: string;
  inputText: string;
  inputPlaceholder: string;
  
  // Dropdown & Select
  dropdownBg: string;
  dropdownBorder: string;
  dropdownHover: string;
  dropdownText: string;
  dropdownShadow: string;
  
  // Calendar
  calendarBg: string;
  calendarBorder: string;
  calendarHeaderBg: string;
  calendarDayHover: string;
  calendarSelectedBg: string;
  calendarSelectedText: string;
  calendarText: string;
  calendarWeekend: string;
  
  // Scrollbar
  scrollbarTrack: string;
  scrollbarThumb: string;
  scrollbarThumbHover: string;
  scrollbarWidth: string;
  
  // Toast
  toastSuccess: string;
  toastSuccessBorder: string;
  toastSuccessText: string;
  toastError: string;
  toastErrorBorder: string;
  toastErrorText: string;
  toastWarning: string;
  toastWarningBorder: string;
  toastWarningText: string;
  toastInfo: string;
  toastInfoBorder: string;
  toastInfoText: string;
  
  // Button Styles
  buttonPrimary: string;
  buttonPrimaryHover: string;
  buttonPrimaryText: string;
  buttonSecondary: string;
  buttonSecondaryHover: string;
  buttonSecondaryText: string;
  buttonGhost: string;
  buttonGhostHover: string;
  buttonGhostText: string;
  
  // Shadows
  shadowCard: string;
  shadowHover: string;
  shadowDropdown: string;
  shadowToast: string;
  
  // Animation colors
  glowPrimary: string;
  glowSecondary: string;
  glowSuccess: string;
  glowWarning: string;
}

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  cardCharacters: CardCharacterSet;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  showToast: (message: string, type: ToastType) => void;
  getCardStyles: (character: CardCharacter) => string;
  getButtonStyles: (variant: 'primary' | 'secondary' | 'ghost') => string;
  getModalStyles: () => string;
  getDropdownStyles: () => string;
  getCalendarStyles: () => string;
  getSelectStyles: () => string;
}

/*
  ========================================
  BUTTON ANIMATION GUIDELINES
  ========================================
  
  ALL buttons in the application should follow this pattern:
  
  1. NO SCALE ON HOVER - Remove transform hover:scale-* classes
  2. ICON ANIMATION - Icons should rotate, translate, or animate on hover
  3. INTERNAL GLOW - Use inset box-shadow that appears on hover
  4. PAPER TEXTURE - Subtle paper texture overlay
  
  Example Button Structure:
  
  <button className="group relative ... overflow-hidden rounded-lg">
    {/* Paper Texture Layer *\/}
    <div className="absolute inset-0 opacity-[0.02] bg-paper-texture"></div>
    
    {/* Internal Glow Layer *\/}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 
      shadow-[inset_0_0_14px_var(--glow-primary),inset_0_0_28px_var(--glow-primary)]">
    </div>
    
    {/* Animated Icon *\/}
    <Icon className="... group-hover:rotate-12 group-hover:translate-x-1 transition-all duration-300" />
    
    {/* Text *\/}
    <span className="relative z-10">Button Text</span>
  </button>
  
  Example Card Structure:
  
  <div className="group relative rounded-xl overflow-hidden border border-opacity-20">
    {/* Paper Texture Background *\/}
    <div className="absolute inset-0 bg-paper-texture opacity-[0.03]"></div>
    
    {/* Card Background with Character Color *\/}
    <div className="relative bg-gradient-to-br from-card-bg/90 to-card-bg/70 backdrop-blur-sm">
      {/* Content *\/}
    </div>
    
    {/* Hover Glow *\/}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 
      shadow-[inset_0_0_20px_var(--card-glow)]"></div>
  </div>
*/

const lightCharacters: CardCharacterSet = {
  authoritative: {
    bg: 'from-[#2C3E50]/10 to-[#34495E]/5', // Deep slate blue wash
    text: 'text-[#2C3E50]', // Charcoal blue ink
    border: 'border-[#2C3E50]/20',
    accent: 'text-[#3498DB]', // Cerulean blue
    hoverBg: 'hover:from-[#2C3E50]/15 hover:to-[#34495E]/10',
    iconColor: 'text-[#3498DB]'
  },
  creative: {
    bg: 'from-[#D7CCC8]/30 to-[#BCAAA4]/20', // Warm clay wash
    text: 'text-[#5D4037]', // Dark chocolate
    border: 'border-[#A1887F]/30',
    accent: 'text-[#8D6E63]', // Warm brown
    hoverBg: 'hover:from-[#D7CCC8]/40 hover:to-[#BCAAA4]/30',
    iconColor: 'text-[#8D6E63]'
  },
  informative: {
    bg: 'from-[#E3F2FD]/40 to-[#BBDEFB]/30', // Misty blue wash
    text: 'text-[#1A237E]', // Deep indigo
    border: 'border-[#90CAF9]/40',
    accent: 'text-[#2196F3]', // Bright blue
    hoverBg: 'hover:from-[#E3F2FD]/50 hover:to-[#BBDEFB]/40',
    iconColor: 'text-[#2196F3]'
  },
  interactive: {
    bg: 'from-[#FFF3E0]/40 to-[#FFE0B2]/30', // Honey glaze
    text: 'text-[#E65100]', // Burnt orange
    border: 'border-[#FFB74D]/40',
    accent: 'text-[#FF9800]', // Orange
    hoverBg: 'hover:from-[#FFF3E0]/50 hover:to-[#FFE0B2]/40',
    iconColor: 'text-[#FF9800]'
  },
  neutral: {
    bg: 'from-[#FAFAFA]/60 to-[#F5F5F5]/40', // Clean paper
    text: 'text-[#424242]', // Dark gray
    border: 'border-[#E0E0E0]/50',
    accent: 'text-[#757575]', // Medium gray
    hoverBg: 'hover:from-[#FAFAFA]/70 hover:to-[#F5F5F5]/50',
    iconColor: 'text-[#757575]'
  },
  urgent: {
    bg: 'from-[#FFEBEE]/40 to-[#FFCDD2]/30', // Blushed clay
    text: 'text-[#C62828]', // Brick red
    border: 'border-[#EF9A9A]/40',
    accent: 'text-[#F44336]', // Red
    hoverBg: 'hover:from-[#FFEBEE]/50 hover:to-[#FFCDD2]/40',
    iconColor: 'text-[#F44336]'
  },
  completed: {
    bg: 'from-[#E8F5E9]/40 to-[#C8E6C9]/30', // Sage wash
    text: 'text-[#2E7D32]', // Forest green
    border: 'border-[#A5D6A7]/40',
    accent: 'text-[#4CAF50]', // Green
    hoverBg: 'hover:from-[#E8F5E9]/50 hover:to-[#C8E6C9]/40',
    iconColor: 'text-[#4CAF50]'
  }
};

const darkCharacters: CardCharacterSet = {
  authoritative: {
    bg: 'from-[#1A237E]/20 to-[#283593]/15', // Deep night blue
    text: 'text-[#C5CAE9]', // Pale periwinkle
    border: 'border-[#3949AB]/30',
    accent: 'text-[#7986CB]', // Lavender blue
    hoverBg: 'hover:from-[#1A237E]/30 hover:to-[#283593]/25',
    iconColor: 'text-[#7986CB]'
  },
  creative: {
    bg: 'from-[#4E342E]/20 to-[#5D4037]/15', // Burnt umber
    text: 'text-[#D7CCC8]', // Light clay
    border: 'border-[#8D6E63]/30',
    accent: 'text-[#A1887F]', // Warm taupe
    hoverBg: 'hover:from-[#4E342E]/30 hover:to-[#5D4037]/25',
    iconColor: 'text-[#A1887F]'
  },
  informative: {
    bg: 'from-[#0D47A1]/20 to-[#1565C0]/15', // Twilight blue
    text: 'text-[#BBDEFB]', // Sky mist
    border: 'border-[#2196F3]/30',
    accent: 'text-[#64B5F6]', // Soft blue
    hoverBg: 'hover:from-[#0D47A1]/30 hover:to-[#1565C0]/25',
    iconColor: 'text-[#64B5F6]'
  },
  interactive: {
    bg: 'from-[#E65100]/20 to-[#EF6C00]/15', // Deep amber
    text: 'text-[#FFE0B2]', // Pale honey
    border: 'border-[#FF9800]/30',
    accent: 'text-[#FFB74D]', // Golden
    hoverBg: 'hover:from-[#E65100]/30 hover:to-[#EF6C00]/25',
    iconColor: 'text-[#FFB74D]'
  },
  neutral: {
    bg: 'from-[#212121]/40 to-[#424242]/30', // Charcoal
    text: 'text-[#E0E0E0]', // Light gray
    border: 'border-[#616161]/40',
    accent: 'text-[#9E9E9E]', // Medium gray
    hoverBg: 'hover:from-[#212121]/50 hover:to-[#424242]/40',
    iconColor: 'text-[#9E9E9E]'
  },
  urgent: {
    bg: 'from-[#B71C1C]/20 to-[#C62828]/15', // Deep rose
    text: 'text-[#FFCDD2]', // Pale rose
    border: 'border-[#EF5350]/30',
    accent: 'text-[#EF9A9A]', // Soft red
    hoverBg: 'hover:from-[#B71C1C]/30 hover:to-[#C62828]/25',
    iconColor: 'text-[#EF9A9A]'
  },
  completed: {
    bg: 'from-[#1B5E20]/20 to-[#2E7D32]/15', // Forest night
    text: 'text-[#C8E6C9]', // Mint cream
    border: 'border-[#4CAF50]/30',
    accent: 'text-[#81C784]', // Sage
    hoverBg: 'hover:from-[#1B5E20]/30 hover:to-[#2E7D32]/25',
    iconColor: 'text-[#81C784]'
  }
};

const lightColors: ThemeColors = {
  // PAPER TEXTURE
  paperTexture: 'bg-[url("/paper-texture-light.svg")]',
  paperBg: 'from-[#F9F7F4] to-[#F5F2EE]', // Ivory parchment
  paperOverlay: 'bg-white/40',
  
  // CARD CHARACTER SETS
  cardCharacters: lightCharacters,
  
  // Backgrounds
  background: 'from-[#F9F7F4] via-[#F5F2EE] to-[#F9F7F4]',
  backgroundGradient: 'from-white/50 to-[#F9F7F4]/50',
  cardBg: 'from-white/70 to-[#FAFAFA]/50',
  cardBgHover: 'from-[#E3F2FD]/40 to-[#F5F5F5]/40',
  glassBg: 'from-white/80 to-white/60',
  sidebarBg: 'from-[#F5F2EE]/80 via-[#FAFAFA]/80 to-[#F5F2EE]/80',
  sidebarItemBg: 'bg-white/60',
  sidebarItemBgHover: 'hover:bg-[#E3F2FD]/40',
  sidebarItemActiveBg: 'bg-gradient-to-r from-[#2196F3]/20 to-[#64B5F6]/20',
  
  // Borders
  border: 'border-[#E0E0E0]/70',
  borderHover: 'hover:border-[#2196F3]/50',
  borderStrong: 'border-[#2196F3]/40',
  borderSubtle: 'border-[#E0E0E0]/30',
  
  // Text
  textPrimary: 'text-[#2C3E50]',
  textSecondary: 'text-[#546E7A]',
  textMuted: 'text-[#78909C]',
  textAccent: 'text-[#2196F3]',
  textOnDark: 'text-white',
  textOnLight: 'text-[#2C3E50]',

  // Modal Styles - ADD THESE
  modalOverlay: 'bg-black/40 backdrop-blur-sm', // Blurred overlay
  modalBg: 'bg-white/95 backdrop-blur-lg', // Solid modal background
  modalBorder: 'border-[#E0E0E0]/50',
  modalShadow: 'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]',
  modalHeaderBg: 'bg-gradient-to-r from-[#2196F3]/10 to-[#64B5F6]/5',
  modalHeaderText: 'text-[#2C3E50]',
  modalContentBg: 'bg-white/90',
  modalContentText: 'text-[#2C3E50]',
  modalFooterBg: 'bg-[#FAFAFA]/80',
  modalFooterBorder: 'border-t-[#E0E0E0]/50',
  
  // Input fields
  inputBg: 'bg-white/70',
  inputBorder: 'border-[#BDBDBD]/50',
  inputFocusBg: 'focus:bg-white/90',
  inputText: 'text-[#2C3E50]',
  inputPlaceholder: 'placeholder-[#78909C]/60',
  
  // Dropdown & Select
  dropdownBg: 'bg-white/90',
  dropdownBorder: 'border-[#BDBDBD]/50',
  dropdownHover: 'hover:bg-[#E3F2FD]/40',
  dropdownText: 'text-[#2C3E50]',
  dropdownShadow: 'shadow-lg shadow-[#2C3E50]/5',
  
  // Calendar
  calendarBg: 'bg-white/80',
  calendarBorder: 'border-[#E0E0E0]/60',
  calendarHeaderBg: 'bg-gradient-to-r from-[#2196F3]/20 to-[#64B5F6]/20',
  calendarDayHover: 'hover:bg-[#E3F2FD]/40',
  calendarSelectedBg: 'bg-[#2196F3]',
  calendarSelectedText: 'text-white',
  calendarText: 'text-[#2C3E50]',
  calendarWeekend: 'text-[#78909C]',
  
  // Scrollbar
  scrollbarTrack: 'rgba(33, 150, 243, 0.05)',
  scrollbarThumb: 'linear-gradient(135deg, #2196F3, #64B5F6)',
  scrollbarThumbHover: 'linear-gradient(135deg, #64B5F6, #2196F3)',
  scrollbarWidth: '8px',
  
  // Toast
  toastSuccess: 'from-[#E8F5E9]/80 to-[#C8E6C9]/60',
  toastSuccessBorder: 'border-[#4CAF50]/40',
  toastSuccessText: 'text-[#2E7D32]',
  toastError: 'from-[#FFEBEE]/80 to-[#FFCDD2]/60',
  toastErrorBorder: 'border-[#F44336]/40',
  toastErrorText: 'text-[#C62828]',
  toastWarning: 'from-[#FFF3E0]/80 to-[#FFE0B2]/60',
  toastWarningBorder: 'border-[#FF9800]/40',
  toastWarningText: 'text-[#EF6C00]',
  toastInfo: 'from-[#E3F2FD]/80 to-[#BBDEFB]/60',
  toastInfoBorder: 'border-[#2196F3]/40',
  toastInfoText: 'text-[#1565C0]',
  
  // Button Styles
  buttonPrimary: 'bg-gradient-to-r from-[#2196F3] to-[#64B5F6]',
  buttonPrimaryHover: 'hover:from-[#1976D2] hover:to-[#42A5F5]',
  buttonPrimaryText: 'text-white',
  buttonSecondary: 'bg-gradient-to-r from-[#8D6E63]/20 to-[#A1887F]/10',
  buttonSecondaryHover: 'hover:from-[#8D6E63]/30 hover:to-[#A1887F]/20',
  buttonSecondaryText: 'text-[#5D4037]',
  buttonGhost: 'bg-transparent',
  buttonGhostHover: 'hover:bg-[#E3F2FD]/30',
  buttonGhostText: 'text-[#2196F3]',
  
  // Shadows
  shadowCard: 'shadow-[0_4px_12px_rgba(0,0,0,0.04)]',
  shadowHover: 'shadow-[0_8px_24px_rgba(33,150,243,0.12)]',
  shadowDropdown: 'shadow-[0_10px_30px_rgba(0,0,0,0.08)]',
  shadowToast: 'shadow-[0_12px_32px_rgba(0,0,0,0.12)]',
  
  // Animation colors
  glowPrimary: 'rgba(33, 150, 243, 0.15)',
  glowSecondary: 'rgba(141, 110, 99, 0.15)',
  glowSuccess: 'rgba(76, 175, 80, 0.15)',
  glowWarning: 'rgba(255, 152, 0, 0.15)'
};

const darkColors: ThemeColors = {
  // PAPER TEXTURE
  paperTexture: 'bg-[url("/paper-texture-dark.svg")]',
  paperBg: 'from-[#1A1A2E] to-[#16213E]', // Charcoal paper
  paperOverlay: 'bg-black/30',
  
  // CARD CHARACTER SETS
  cardCharacters: darkCharacters,
  
  // Backgrounds
  background: 'from-[#1A1A2E] via-[#16213E] to-[#1A1A2E]',
  backgroundGradient: 'from-[#0F172A]/70 to-[#1A1A2E]/70',
  cardBg: 'from-[#1E293B]/60 to-[#334155]/40',
  cardBgHover: 'from-[#1E293B]/70 to-[#334155]/50',
  glassBg: 'from-[#1E293B]/40 to-[#334155]/30',
  sidebarBg: 'from-[#1A1A2E]/90 via-[#16213E]/90 to-[#1A1A2E]/90',
  sidebarItemBg: 'bg-[#1E293B]/40',
  sidebarItemBgHover: 'hover:bg-[#1E293B]/60',
  sidebarItemActiveBg: 'bg-gradient-to-r from-[#2196F3]/20 to-[#64B5F6]/20',
  
  // Borders
  border: 'border-[#334155]/50',
  borderHover: 'hover:border-[#64B5F6]/50',
  borderStrong: 'border-[#64B5F6]/40',
  borderSubtle: 'border-[#334155]/30',
  
  // Text
  textPrimary: 'text-[#E2E8F0]',
  textSecondary: 'text-[#CBD5E1]',
  textMuted: 'text-[#94A3B8]',
  textAccent: 'text-[#64B5F6]',
  textOnDark: 'text-white',
  textOnLight: 'text-[#1E293B]',

   // Modal Styles - ADD THESE
  modalOverlay: 'bg-black/60 backdrop-blur-sm', // Darker blurred overlay
  modalBg: 'bg-[#1E293B]/95 backdrop-blur-lg', // Solid modal background
  modalBorder: 'border-[#475569]/50',
  modalShadow: 'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]',
  modalHeaderBg: 'bg-gradient-to-r from-[#2196F3]/20 to-[#64B5F6]/10',
  modalHeaderText: 'text-[#E2E8F0]',
  modalContentBg: 'bg-[#1E293B]/90',
  modalContentText: 'text-[#E2E8F0]',
  modalFooterBg: 'bg-[#0F172A]/80',
  modalFooterBorder: 'border-t-[#475569]/50',
  
  // Input fields
  inputBg: 'bg-[#1E293B]/50',
  inputBorder: 'border-[#475569]/50',
  inputFocusBg: 'focus:bg-[#1E293B]/70',
  inputText: 'text-[#E2E8F0]',
  inputPlaceholder: 'placeholder-[#94A3B8]/50',
  
  // Dropdown & Select
  dropdownBg: 'bg-[#1E293B]/90',
  dropdownBorder: 'border-[#475569]/50',
  dropdownHover: 'hover:bg-[#334155]/60',
  dropdownText: 'text-[#E2E8F0]',
  dropdownShadow: 'shadow-lg shadow-black/20',
  
  // Calendar
  calendarBg: 'bg-[#1E293B]/70',
  calendarBorder: 'border-[#475569]/50',
  calendarHeaderBg: 'bg-gradient-to-r from-[#2196F3]/30 to-[#64B5F6]/30',
  calendarDayHover: 'hover:bg-[#334155]/60',
  calendarSelectedBg: 'bg-[#2196F3]',
  calendarSelectedText: 'text-white',
  calendarText: 'text-[#E2E8F0]',
  calendarWeekend: 'text-[#94A3B8]',
  
  // Scrollbar
  scrollbarTrack: 'rgba(100, 181, 246, 0.05)',
  scrollbarThumb: 'linear-gradient(135deg, #2196F3, #64B5F6)',
  scrollbarThumbHover: 'linear-gradient(135deg, #64B5F6, #2196F3)',
  scrollbarWidth: '8px',
  
  // Toast
  toastSuccess: 'from-[#1B5E20]/40 to-[#2E7D32]/30',
  toastSuccessBorder: 'border-[#4CAF50]/40',
  toastSuccessText: 'text-[#C8E6C9]',
  toastError: 'from-[#B71C1C]/40 to-[#C62828]/30',
  toastErrorBorder: 'border-[#F44336]/40',
  toastErrorText: 'text-[#FFCDD2]',
  toastWarning: 'from-[#E65100]/40 to-[#EF6C00]/30',
  toastWarningBorder: 'border-[#FF9800]/40',
  toastWarningText: 'text-[#FFE0B2]',
  toastInfo: 'from-[#0D47A1]/40 to-[#1565C0]/30',
  toastInfoBorder: 'border-[#2196F3]/40',
  toastInfoText: 'text-[#BBDEFB]',
  
  // Button Styles
  buttonPrimary: 'bg-gradient-to-r from-[#2196F3] to-[#64B5F6]',
  buttonPrimaryHover: 'hover:from-[#1976D2] hover:to-[#42A5F5]',
  buttonPrimaryText: 'text-white',
  buttonSecondary: 'bg-gradient-to-r from-[#8D6E63]/30 to-[#A1887F]/20',
  buttonSecondaryHover: 'hover:from-[#8D6E63]/40 hover:to-[#A1887F]/30',
  buttonSecondaryText: 'text-[#D7CCC8]',
  buttonGhost: 'bg-transparent',
  buttonGhostHover: 'hover:bg-[#334155]/40',
  buttonGhostText: 'text-[#64B5F6]',
  
  // Shadows
  shadowCard: 'shadow-[0_4px_12px_rgba(0,0,0,0.2)]',
  shadowHover: 'shadow-[0_8px_24px_rgba(33,150,243,0.15)]',
  shadowDropdown: 'shadow-[0_10px_30px_rgba(0,0,0,0.3)]',
  shadowToast: 'shadow-[0_12px_32px_rgba(0,0,0,0.35)]',
  
  // Animation colors
  glowPrimary: 'rgba(100, 181, 246, 0.2)',
  glowSecondary: 'rgba(167, 139, 111, 0.2)',
  glowSuccess: 'rgba(129, 199, 132, 0.2)',
  glowWarning: 'rgba(255, 183, 77, 0.2)'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    setMounted(true);
    
    const fetchTheme = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          const response = await fetch(`/api/user/theme?username=${user.username}`);
          
          if (response.ok) {
            const data = await response.json();
            const savedTheme = data.theme || 'dark';
            setThemeState(savedTheme);
            applyTheme(savedTheme);
          } else {
            applyTheme('dark');
          }
        } else {
          applyTheme('dark');
        }
      } catch (error) {
        console.error('Error fetching theme:', error);
        applyTheme('dark');
      }
    };

    fetchTheme();
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const html = document.documentElement;
    
    if (newTheme === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.add('light');
      html.classList.remove('dark');
    }
    
    html.setAttribute('data-theme', newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      fetch('/api/user/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, theme: newTheme }),
      }).catch(error => console.error('Error saving theme:', error));
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const showToast = (message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  const getCardStyles = (character: CardCharacter): string => {
    const chars = theme === 'dark' ? darkCharacters : lightCharacters;
    const char = chars[character];
    return `
      relative overflow-hidden rounded-xl border ${char.border} backdrop-blur-sm
      bg-gradient-to-br ${char.bg} ${char.text} transition-all duration-300
      hover:shadow-lg hover:shadow-${character === 'authoritative' ? '[rgba(52,152,219,0.15)]' : character === 'creative' ? '[rgba(141,110,99,0.15)]' : '[rgba(0,0,0,0.08)]'}
      group
    `;
  };

  const getButtonStyles = (variant: 'primary' | 'secondary' | 'ghost'): string => {
    const colors = theme === 'dark' ? darkColors : lightColors;
    const base = `
      relative overflow-hidden rounded-lg px-4 py-2.5 font-medium transition-all duration-300
      group border ${variant === 'ghost' ? colors.borderSubtle : 'border-transparent'}
      flex items-center justify-center gap-2
    `;
    
    switch(variant) {
      case 'primary':
        return `${base} ${colors.buttonPrimary} ${colors.buttonPrimaryText} hover:shadow-lg hover:shadow-[rgba(33,150,243,0.25)]`;
      case 'secondary':
        return `${base} ${colors.buttonSecondary} ${colors.buttonSecondaryText}`;
      case 'ghost':
        return `${base} ${colors.buttonGhost} ${colors.buttonGhostText} hover:${colors.buttonGhostHover}`;
      default:
        return base;
    }
  };

  // Add these functions inside the ThemeProvider component (after getButtonStyles function)
  const getModalStyles = (): string => {
    return `
      fixed inset-0 z-50 flex items-center justify-center p-4
      ${colors.modalOverlay}
    `;
  };

  const getDropdownStyles = (): string => {
    return `
      ${colors.dropdownBg} ${colors.dropdownBorder} ${colors.dropdownText}
      backdrop-blur-md border rounded-lg shadow-lg
      absolute z-50 mt-1 max-h-60 overflow-auto
      scrollbar-thin scrollbar-track-transparent scrollbar-thumb-current/20
    `;
  };

  const getCalendarStyles = (): string => {
    return `
      ${colors.calendarBg} ${colors.calendarBorder} ${colors.calendarText}
      backdrop-blur-md border rounded-lg shadow-lg p-4
      absolute z-50
    `;
  };

  const getSelectStyles = (): string => {
    return `
      ${colors.inputBg} ${colors.inputBorder} ${colors.inputText}
      backdrop-blur-sm border rounded-lg px-3 py-2
      focus:outline-none focus:ring-2 focus:ring-[#2196F3]/30
      cursor-pointer appearance-none pr-10
    `;
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#1A1A2E] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 border-4 border-[#64B5F6] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white text-2xl font-black">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      colors, 
      cardCharacters: theme === 'dark' ? darkCharacters : lightCharacters,
      toggleTheme, 
      setTheme, 
      showToast,
      getCardStyles,
      getButtonStyles,
      getModalStyles,
      getDropdownStyles,
      getCalendarStyles,
      getSelectStyles
    }}>
      {/* Global Paper Texture Background */}
      <div className={`fixed inset-0 ${colors.paperTexture} bg-repeat opacity-[0.02] pointer-events-none z-[-1]`}></div>
      
      <div className={`min-h-screen bg-gradient-to-br ${colors.background} transition-colors duration-500`}>
        {children}
      </div>
      
      {/* Global Styles */}
      <style jsx global>{`
        :root {
          --glow-primary: ${colors.glowPrimary};
          --glow-secondary: ${colors.glowSecondary};
          --glow-success: ${colors.glowSuccess};
          --glow-warning: ${colors.glowWarning};
          --scrollbar-width: ${colors.scrollbarWidth};
        }

        /* Paper Texture Utility Class */
        .paper-texture {
          background-image: ${theme === 'dark' ? 'url("/paper-texture-dark.svg")' : 'url("/paper-texture-light.svg")'};
          background-repeat: repeat;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: var(--scrollbar-width);
          height: var(--scrollbar-width);
        }

        ::-webkit-scrollbar-track {
          background: ${colors.scrollbarTrack};
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: ${colors.scrollbarThumb};
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: ${colors.scrollbarThumbHover};
        }

        /* Select/Dropdown Styling */
        select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'dark' ? '%2364B5F6' : '%232196F3'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 12px;
          cursor: pointer;
        }

        select option {
          background: ${theme === 'dark' ? '#1E293B' : '#FFFFFF'};
          color: ${theme === 'dark' ? '#E2E8F0' : '#2C3E50'};
          padding: 12px;
        }

        /* Dropdown Animation */
        .dropdown-animate {
          animation: dropdownSlide 0.2s ease-out;
        }

        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Icon Animation for Buttons */
        .icon-rotate {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .group:hover .icon-rotate {
          transform: rotate(12deg) translateX(2px);
        }

        /* Card Hover Glow */
        .card-glow {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.5s ease;
          border-radius: inherit;
          pointer-events: none;
        }

        .group:hover .card-glow {
          opacity: 1;
        }

        /* Button Internal Glow */
        .button-glow {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.5s ease;
          border-radius: inherit;
          pointer-events: none;
          box-shadow: inset 0 0 20px var(--glow-primary);
        }

        .group:hover .button-glow {
          opacity: 1;
        }

        /* Input Focus Ring */
        input:focus, textarea:focus, select:focus {
          outline: 2px solid ${theme === 'dark' ? 'rgba(100, 181, 246, 0.3)' : 'rgba(33, 150, 243, 0.3)'};
          outline-offset: 2px;
        }

        /* Toast Animation */
        @keyframes toastSlideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-toast-slide {
          animation: toastSlideIn 0.3s ease-out;
        }

        /* Calendar Styles */
        .calendar-cell {
          transition: all 0.2s ease;
          border-radius: 6px;
        }

        .calendar-cell:hover {
          background: ${colors.calendarDayHover.replace('hover:', '')};
        }

        .calendar-cell-selected {
          background: ${colors.calendarSelectedBg} !important;
          color: ${colors.calendarSelectedText} !important;
          font-weight: 600;
        }

        /* Status Badge Pulse */
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .status-pulse {
          animation: statusPulse 2s infinite;
        }

        /* Modal Base Styles */
        .modal-backdrop {
          backdrop-filter: blur(8px);
          animation: fadeIn 0.2s ease-out;
        }

        .modal-content {
          animation: modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          max-height: 85vh;
          overflow-y: auto;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Calendar/DatePicker Styles */
        .react-datepicker {
          font-family: inherit !important;
          border: none !important;
          border-radius: 12px !important;
          background: transparent !important;
        }

        .react-datepicker__header {
          background: ${colors.calendarHeaderBg} !important;
          border: none !important;
          border-radius: 12px 12px 0 0 !important;
          padding: 16px !important;
        }

        .react-datepicker__month-container {
          background: ${colors.calendarBg} !important;
          border-radius: 12px !important;
          padding: 8px !important;
        }

        .react-datepicker__day {
          color: ${colors.calendarText} !important;
          border-radius: 6px !important;
          transition: all 0.2s ease !important;
        }

        .react-datepicker__day:hover {
          background: ${colors.calendarDayHover.replace('hover:', '')} !important;
        }

        .react-datepicker__day--selected {
          background: ${colors.calendarSelectedBg} !important;
          color: ${colors.calendarSelectedText} !important;
          font-weight: 600 !important;
        }

        .react-datepicker__day--weekend {
          color: ${colors.calendarWeekend} !important;
        }

        /* Select/Dropdown Overrides */
        select, .react-select__control {
          background: ${colors.inputBg} !important;
          border-color: ${colors.inputBorder.replace('border-', '')} !important;
          color: ${colors.inputText} !important;
        }

        select:focus, .react-select__control--is-focused {
          border-color: ${colors.borderHover.replace('hover:', '')} !important;
          box-shadow: 0 0 0 3px ${theme === 'dark' ? 'rgba(100, 181, 246, 0.1)' : 'rgba(33, 150, 243, 0.1)'} !important;
        }

        .react-select__menu {
          background: ${colors.dropdownBg} !important;
          border: 1px solid ${colors.dropdownBorder.replace('border-', '')} !important;
          box-shadow: ${colors.dropdownShadow} !important;
        }

        .react-select__option {
          color: ${colors.dropdownText} !important;
        }

        .react-select__option:hover {
          background: ${colors.dropdownHover.replace('hover:', '')} !important;
        }

        /* Time Picker Styles */
        .react-time-picker__wrapper,
        .react-clock__face {
          background: ${colors.inputBg} !important;
          border-color: ${colors.inputBorder.replace('border-', '')} !important;
          color: ${colors.inputText} !important;
        }

        .react-clock__hand__body {
          background: ${colors.textAccent} !important;
        }

        .react-clock__mark__body {
          background: ${colors.textMuted} !important;
        }
      `}</style>

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
        {toasts.map(toast => {
          const toastColors = {
            success: {
              bg: colors.toastSuccess,
              border: colors.toastSuccessBorder,
              text: colors.toastSuccessText,
              icon: '✓',
              glow: 'var(--glow-success)'
            },
            error: {
              bg: colors.toastError,
              border: colors.toastErrorBorder,
              text: colors.toastErrorText,
              icon: '✕',
              glow: 'rgba(244, 67, 54, 0.15)'
            },
            warning: {
              bg: colors.toastWarning,
              border: colors.toastWarningBorder,
              text: colors.toastWarningText,
              icon: '⚠',
              glow: 'var(--glow-warning)'
            },
            info: {
              bg: colors.toastInfo,
              border: colors.toastInfoBorder,
              text: colors.toastInfoText,
              icon: 'ℹ',
              glow: 'var(--glow-primary)'
            }
          };

          const config = toastColors[toast.type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto relative overflow-hidden rounded-xl border backdrop-blur-md px-4 py-3 min-w-[300px] max-w-md animate-toast-slide shadow-lg ${config.bg} ${config.border}`}
            >
              {/* Toast Glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                   style={{ boxShadow: `inset 0 0 20px ${config.glow}` }}>
              </div>
              
              <div className="relative z-10 flex items-center gap-3">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold ${config.border} ${config.text}`}>
                  {config.icon}
                </div>
                <p className={`${config.text} font-medium text-sm flex-1`}>
                  {toast.message}
                </p>
                <button
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className={`${config.text} hover:opacity-70 transition-opacity font-bold text-lg leading-none`}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper hook for character-based cards
export function useCardCharacter(character: CardCharacter) {
  const { cardCharacters } = useTheme();
  return cardCharacters[character];
}

// Helper hook for buttons
export function useButtonStyles(variant: 'primary' | 'secondary' | 'ghost') {
  const { getButtonStyles } = useTheme();
  return getButtonStyles(variant);
}

