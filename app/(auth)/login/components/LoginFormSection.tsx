'use client';

import React, { useState } from 'react';
import { LogIn, Users, Lock, Eye, EyeOff, Hash, ArrowLeft, CheckCircle } from 'lucide-react';

export default function LoginFormSection() {
  // Use dark mode colors directly
  const darkColors = {
    textPrimary: 'text-[#E2E8F0]',
    textSecondary: 'text-[#CBD5E1]',
    textAccent: 'text-[#64B5F6]',
    inputBg: 'bg-[#1E293B]/50',
    inputBorder: 'border-[#475569]/50',
    inputFocusBg: 'focus:bg-[#1E293B]/70',
    inputText: 'text-[#E2E8F0]',
    inputPlaceholder: 'placeholder-[#94A3B8]/50',
    cardBg: 'from-[#1E293B]/60 to-[#334155]/40',
    paperTexture: 'bg-[url("/paper-texture-dark.svg")]',
  };

  const authoritativeChar = {
    bg: 'from-[#1A237E]/20 to-[#283593]/15',
    text: 'text-[#C5CAE9]',
    border: 'border-[#3949AB]/30',
    accent: 'text-[#7986CB]',
    iconColor: 'text-[#7986CB]',
  };

  const urgentChar = {
    bg: 'from-[#B71C1C]/40 to-[#C62828]/30',
    border: 'border-[#F44336]/40',
    text: 'text-[#FFCDD2]',
  };

  const successChar = {
    bg: 'from-[#1B5E20]/40 to-[#2E7D32]/30',
    border: 'border-[#4CAF50]/40',
    text: 'text-[#C8E6C9]',
  };
  
  // Login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot password states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotEmployeeId, setForgotEmployeeId] = useState('');
  
  // Common states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (data.success && data.user) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('authToken', 'authenticated');
        
        let route = '/employee/dashboard';
        
        // Route based on role assigned by backend
        switch(data.user.role) {
          case 'admin':
            route = '/admin/dashboard';
            break;
          case 'executive':
            route = '/executive/dashboard';
            break;
          case 'depthead.hr':
            route = '/hr-head/dashboard';
            break;
          case 'employee.hr':
            route = '/hr-employee/dashboard';
            break;
          case 'depthead.other':
            route = '/dept-head/dashboard';
            break;
          case 'employee.other':
            route = '/employee/dashboard';
            break;
          default:
            route = '/employee/dashboard';
        }

        console.log('Login successful:', {
          username: data.user.username,
          role: data.user.role,
          department: data.user.department,
          isDeptHead: data.user.isDeptHead,
          isExecutive: data.user.isExecutive,
          route: route
        });

        setTimeout(() => {
          window.location.href = route;
        }, 500);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotUsername || !forgotEmployeeId) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: forgotUsername, 
          employeeId: forgotEmployeeId 
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        setError('');
        // Clear form fields
        setForgotUsername('');
        setForgotEmployeeId('');
        
        // Switch back to login after 5 seconds
        setTimeout(() => {
          setIsForgotPassword(false);
          setSuccess('');
        }, 5000);
      } else {
        setError(data.message || 'Password reset failed');
        setSuccess('');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('An error occurred. Please try again.');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isForgotPassword) {
        handleForgotPassword();
      } else {
        handleLogin();
      }
    }
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setError('');
    setSuccess('');
    setUsername('');
    setPassword('');
    setForgotUsername('');
    setForgotEmployeeId('');
  };

  return (
    <div className="relative p-4 lg:p-8 flex items-center">
      {/* Mobile Logo */}
      <div className="lg:hidden flex justify-center mb-6 absolute top-4 left-1/2 -translate-x-1/2">
        <div className="relative">
          <div className="absolute inset-0 bg-[#0000FF]/30 rounded-xl blur-xl"></div>
          <div className={`relative bg-gradient-to-br from-[#0000FF] to-[#000080] px-6 py-3 rounded-xl border ${authoritativeChar.border}`}>
            <div className="text-2xl font-black text-white">PEPSI</div>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="relative max-w-lg mx-auto lg:mx-0 lg:ml-auto space-y-4 w-full">
        {/* Header */}
        <div className="space-y-3">
          {/* ARDA Badge */}
          <div className="inline-flex items-center gap-3">
            <div className={`relative px-6 py-3 rounded-xl ${authoritativeChar.bg} ${authoritativeChar.border} border-2 backdrop-blur-sm group overflow-hidden`}>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0000FF]/20 to-[#87CEEB]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className={`${authoritativeChar.accent} text-2xl font-black tracking-wider relative z-10`}>ARDA</span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-[#0000FF]/50 via-[#6495ED]/30 to-transparent"></div>
          </div>
          
          <h1 className={`text-2xl lg:text-3xl font-black ${darkColors.textPrimary}`}>
            {isForgotPassword ? 'Reset Password' : 'Welcome Back'}
          </h1>
          
          {/* Morse Code: "GOOD LUCK" - Only show on login */}
          {!isForgotPassword && (
            <div className="relative group pt-2 pb-4">
              <div className="flex items-center gap-1">
                {/* G: --. */}
                <div className="h-1 w-5 bg-gradient-to-r from-[#0000FF] to-[#6495ED] rounded-full"></div>
                <div className="h-1 w-5 bg-gradient-to-r from-[#0000FF] to-[#6495ED] rounded-full"></div>
                <div className="h-1 w-2 bg-[#87CEEB] rounded-full"></div>
                <div className="w-1.5"></div>
                {/* O: --- */}
                <div className="h-1 w-5 bg-gradient-to-r from-[#0000FF] to-[#6495ED] rounded-full"></div>
                <div className="h-1 w-5 bg-gradient-to-r from-[#0000FF] to-[#6495ED] rounded-full"></div>
                <div className="h-1 w-5 bg-gradient-to-r from-[#0000FF] to-[#6495ED] rounded-full"></div>
                <div className="w-1.5"></div>
                {/* O: --- */}
                <div className="h-1 w-5 bg-gradient-to-r from-[#0000FF] to-[#6495ED] rounded-full"></div>
                <div className="h-1 w-5 bg-gradient-to-r from-[#0000FF] to-[#6495ED] rounded-full"></div>
                <div className="h-1 w-5 bg-gradient-to-r from-[#0000FF] to-[#6495ED] rounded-full"></div>
                <div className="w-1.5"></div>
                {/* D: -.. */}
                <div className="h-1 w-5 bg-gradient-to-r from-[#0000FF] to-[#6495ED] rounded-full"></div>
                <div className="h-1 w-2 bg-[#87CEEB] rounded-full"></div>
                <div className="h-1 w-2 bg-[#87CEEB] rounded-full"></div>
                <div className="w-2"></div>
                {/* L: .-.. */}
                <div className="h-1 w-2 bg-[#FF0000] rounded-full"></div>
                <div className="h-1 w-5 bg-gradient-to-r from-[#FF0000] to-[#DC143C] rounded-full"></div>
                <div className="h-1 w-2 bg-[#FF0000] rounded-full"></div>
                <div className="h-1 w-2 bg-[#FF0000] rounded-full"></div>
                <div className="w-1.5"></div>
                {/* U: ..- */}
                <div className="h-1 w-2 bg-[#FF0000] rounded-full"></div>
                <div className="h-1 w-2 bg-[#FF0000] rounded-full"></div>
                <div className="h-1 w-5 bg-gradient-to-r from-[#FF0000] to-[#DC143C] rounded-full"></div>
                <div className="w-1.5"></div>
                {/* C: -.-. */}
                <div className="h-1 w-5 bg-gradient-to-r from-[#6495ED] to-[#87CEEB] rounded-full"></div>
                <div className="h-1 w-2 bg-[#87CEEB] rounded-full"></div>
                <div className="h-1 w-5 bg-gradient-to-r from-[#6495ED] to-[#87CEEB] rounded-full"></div>
                <div className="h-1 w-2 bg-[#87CEEB] rounded-full"></div>
                <div className="w-1.5"></div>
                {/* K: -.- */}
                <div className="h-1 w-5 bg-gradient-to-r from-[#6495ED] to-[#87CEEB] rounded-full"></div>
                <div className="h-1 w-2 bg-[#87CEEB] rounded-full"></div>
                <div className="h-1 w-5 bg-gradient-to-r from-[#6495ED] to-[#87CEEB] rounded-full"></div>
              </div>
              {/* Hidden message on hover */}
              <div className="absolute top-full mt-0.5 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className={`${darkColors.textAccent} text-xs font-medium`}>Good luck :)</p>
              </div>
            </div>
          )}
        </div>

        {/* Login/Forgot Password Card */}
        <div className="relative group">
          {/* Card glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0000FF] via-[#6495ED] to-[#87CEEB] rounded-xl opacity-20 group-hover:opacity-40 blur-lg transition-all duration-500"></div>
          
          {/* Card */}
          <div className={`relative bg-gradient-to-br ${darkColors.cardBg} backdrop-blur-xl rounded-xl p-6 border-2 ${authoritativeChar.border} hover:border-[#87CEEB]/40 transition-all duration-500`}>
            {/* Paper Texture */}
            <div className={`absolute inset-0 ${darkColors.paperTexture} opacity-[0.02] pointer-events-none`}></div>
            
            <div className="relative z-10 space-y-4">
              
              {isForgotPassword ? (
                // Forgot Password Form
                <>
                  {/* Back Button */}
                  <button
                    onClick={toggleForgotPassword}
                    className={`flex items-center gap-2 ${darkColors.textAccent} hover:text-[#87CEEB] transition-colors text-sm font-semibold`}
                    disabled={loading}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </button>

                  {/* Instructions */}
                  <p className={`${darkColors.textSecondary} text-sm`}>
                    Enter your username and Employee ID. We'll send password reset instructions to your registered email address.
                  </p>

                  {/* Username Input */}
                  <div className="space-y-2">
                    <label className={`block text-xs font-bold ${darkColors.textAccent} uppercase tracking-wider`}>
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Users className={`h-4 w-4 transition-colors duration-300 ${
                          focusedField === 'forgot-username' ? authoritativeChar.iconColor : 'text-[#6495ED]/60'
                        }`} />
                      </div>
                      <input
                        type="text"
                        value={forgotUsername}
                        onChange={(e) => setForgotUsername(e.target.value)}
                        onKeyPress={handleKeyPress}
                        onFocus={() => setFocusedField('forgot-username')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full pl-10 pr-3 py-3 ${darkColors.inputBg} border-2 ${darkColors.inputBorder} rounded-lg focus:border-[#0000FF] ${darkColors.inputFocusBg} focus:ring-2 focus:ring-[#0000FF]/30 outline-none transition-all duration-300 ${darkColors.inputText} text-sm ${darkColors.inputPlaceholder} hover:border-[#6495ED]/50`}
                        placeholder="Enter your username"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Employee ID Input */}
                  <div className="space-y-2">
                    <label className={`block text-xs font-bold ${darkColors.textAccent} uppercase tracking-wider`}>
                      Employee ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className={`h-4 w-4 transition-colors duration-300 ${
                          focusedField === 'forgot-employeeid' ? authoritativeChar.iconColor : 'text-[#6495ED]/60'
                        }`} />
                      </div>
                      <input
                        type="text"
                        value={forgotEmployeeId}
                        onChange={(e) => setForgotEmployeeId(e.target.value)}
                        onKeyPress={handleKeyPress}
                        onFocus={() => setFocusedField('forgot-employeeid')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full pl-10 pr-3 py-3 ${darkColors.inputBg} border-2 ${darkColors.inputBorder} rounded-lg focus:border-[#0000FF] ${darkColors.inputFocusBg} focus:ring-2 focus:ring-[#0000FF]/30 outline-none transition-all duration-300 ${darkColors.inputText} text-sm ${darkColors.inputPlaceholder} hover:border-[#6495ED]/50`}
                        placeholder="Enter your Employee ID"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Success Message */}
                  {success && (
                    <div className={`bg-gradient-to-br ${successChar.bg} border-2 ${successChar.border} p-3 rounded-lg backdrop-blur-sm flex items-start gap-3`}>
                      <CheckCircle className="h-5 w-5 text-[#4CAF50] flex-shrink-0 mt-0.5" />
                      <p className={`${successChar.text} text-xs font-semibold`}>{success}</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className={`bg-gradient-to-br ${urgentChar.bg} border-2 ${urgentChar.border} p-3 rounded-lg backdrop-blur-sm`}>
                      <p className={`${urgentChar.text} text-xs font-semibold`}>{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className={`relative w-full bg-gradient-to-r from-[#0000FF] to-[#6495ED] hover:from-[#6495ED] hover:to-[#0000FF] text-white font-bold text-base py-3 rounded-lg transition-all duration-500 hover:shadow-xl hover:shadow-[#0000FF]/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden group border border-[#87CEEB]/20`}
                  >
                    {/* Paper Texture Layer */}
                    <div className={`absolute inset-0 ${darkColors.paperTexture} opacity-[0.02]`}></div>
                    
                    {/* Internal Glow Layer */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                         style={{ boxShadow: 'inset 0 0 20px rgba(100, 181, 246, 0.2)' }}>
                    </div>
                    
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10"></div>
                        <span className="font-bold text-sm relative z-10">Sending...</span>
                      </>
                    ) : (
                      <>
                        <span className="relative z-10 font-black tracking-wide">RESET PASSWORD</span>
                        <Hash className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </>
              ) : (
                // Login Form
                <>
                  {/* Username Input */}
                  <div className="space-y-2">
                    <label className={`block text-xs font-bold ${darkColors.textAccent} uppercase tracking-wider`}>
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Users className={`h-4 w-4 transition-colors duration-300 ${
                          focusedField === 'username' ? authoritativeChar.iconColor : 'text-[#6495ED]/60'
                        }`} />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyPress={handleKeyPress}
                        onFocus={() => setFocusedField('username')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full pl-10 pr-3 py-3 ${darkColors.inputBg} border-2 ${darkColors.inputBorder} rounded-lg focus:border-[#0000FF] ${darkColors.inputFocusBg} focus:ring-2 focus:ring-[#0000FF]/30 outline-none transition-all duration-300 ${darkColors.inputText} text-sm ${darkColors.inputPlaceholder} hover:border-[#6495ED]/50`}
                        placeholder="Enter your username"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className={`block text-xs font-bold ${darkColors.textAccent} uppercase tracking-wider`}>
                        Password
                      </label>
                      <button 
                        type="button"
                        onClick={toggleForgotPassword}
                        className="text-xs text-[#FF0000] hover:text-[#DC143C] font-semibold transition-colors"
                        disabled={loading}
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className={`h-4 w-4 transition-colors duration-300 ${
                          focusedField === 'password' ? authoritativeChar.iconColor : 'text-[#6495ED]/60'
                        }`} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full pl-10 pr-10 py-3 ${darkColors.inputBg} border-2 ${darkColors.inputBorder} rounded-lg focus:border-[#0000FF] ${darkColors.inputFocusBg} focus:ring-2 focus:ring-[#0000FF]/30 outline-none transition-all duration-300 ${darkColors.inputText} text-sm ${darkColors.inputPlaceholder} hover:border-[#6495ED]/50`}
                        placeholder="Enter your password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6495ED]/60 hover:text-[#87CEEB] transition-colors"
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className={`bg-gradient-to-br ${urgentChar.bg} border-2 ${urgentChar.border} p-3 rounded-lg backdrop-blur-sm`}>
                      <p className={`${urgentChar.text} text-xs font-semibold`}>{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className={`relative w-full bg-gradient-to-r from-[#0000FF] to-[#6495ED] hover:from-[#6495ED] hover:to-[#0000FF] text-white font-bold text-base py-3 rounded-lg transition-all duration-500 hover:shadow-xl hover:shadow-[#0000FF]/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden group border border-[#87CEEB]/20`}
                  >
                    {/* Paper Texture Layer */}
                    <div className={`absolute inset-0 ${darkColors.paperTexture} opacity-[0.02]`}></div>
                    
                    {/* Internal Glow Layer */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                         style={{ boxShadow: 'inset 0 0 20px rgba(100, 181, 246, 0.2)' }}>
                    </div>
                    
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10"></div>
                        <span className="font-bold text-sm relative z-10">Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span className="relative z-10 font-black tracking-wide">SIGN IN</span>
                        <LogIn className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}