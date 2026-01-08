// app/(Dashboard)/admin/components/DownloadLogs.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import LogSelector from '@/app/components/HRDownloadLogs/LogSelector';
import DownloadButton from '@/app/components/HRDownloadLogs/DownloadButton';
import LogViewer from '@/app/components/HRDownloadLogs/LogViewer';

export default function DownloadLogs() {
  const { colors, cardCharacters } = useTheme();
  const charColors = cardCharacters.informative;
  
  const [selectedType, setSelectedType] = useState<'org' | 'dept'>('org');
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Date range state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Logs viewer state
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsError, setLogsError] = useState('');

  // Fetch departments from database
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const response = await fetch('/api/departments');
        if (response.ok) {
          const data = await response.json();
          setDepartments(data.departments);
          if (data.departments.length > 0) {
            setSelectedDepartment(data.departments[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        setErrorMessage('Failed to load departments');
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    setStatus('processing');
    setErrorMessage('');

    try {
      const response = await fetch('/api/download-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          department: selectedType === 'dept' ? selectedDepartment : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const dateRangeStr = startDate && endDate 
        ? `_${startDate}_to_${endDate}`
        : '';
      const filename = selectedType === 'org'
        ? `Org_Announcements_Log${dateRangeStr}_${new Date().toISOString().split('T')[0]}.pdf`
        : `${selectedDepartment}_Announcements_Log${dateRangeStr}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to download PDF. Please try again.');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    } finally {
      setDownloading(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    setLogsError('');

    try {
      const response = await fetch('/api/view-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          department: selectedType === 'dept' ? selectedDepartment : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load logs');
      }

      const data = await response.json();
      setLogs(data.announcements);
    } catch (error) {
      console.error('Error loading logs:', error);
      setLogsError(error instanceof Error ? error.message : 'Failed to load logs. Please try again.');
    } finally {
      setLoadingLogs(false);
    }
  };

  // Auto-fetch logs when filters change
  useEffect(() => {
    if (selectedType === 'org' || (selectedType === 'dept' && selectedDepartment)) {
      fetchLogs();
    }
  }, [selectedType, selectedDepartment, startDate, endDate]);

  const isDisabled = selectedType === 'dept' && (loadingDepartments || departments.length === 0);

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-4">
      {/* Header - Matching AssignedTickets Style */}
      <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} transition-all duration-300`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        
        <div className="relative p-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${charColors.bg}`}>
              <FileText className={`h-5 w-5 ${charColors.iconColor}`} />
            </div>
            <div>
              <h1 className={`text-xl font-black ${charColors.text}`}>Download Logs</h1>
              <p className={`text-xs ${colors.textMuted}`}>
                Export announcement logs as PDF with full history
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className={`relative overflow-hidden rounded-xl p-4 border-2 backdrop-blur-sm bg-gradient-to-br ${colors.cardBg} ${colors.borderStrong} ${colors.shadowCard}`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        <div className="relative space-y-4">
          <LogSelector
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            departments={departments}
            selectedDepartment={selectedDepartment}
            onDepartmentChange={setSelectedDepartment}
            loadingDepartments={loadingDepartments}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            colors={colors}
          />

          <DownloadButton
            selectedType={selectedType}
            selectedDepartment={selectedDepartment}
            downloading={downloading}
            status={status}
            errorMessage={errorMessage}
            onDownload={handleDownload}
            disabled={isDisabled}
          />
        </div>
      </div>

      {/* Logs Viewer */}
      <div className="space-y-4">
        {loadingLogs ? (
          <div className={`relative overflow-hidden rounded-xl p-8 border-2 backdrop-blur-sm bg-gradient-to-br ${colors.cardBg} ${colors.borderStrong} flex items-center justify-center ${colors.shadowCard}`}>
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
            <div className="relative flex items-center gap-3">
              <Loader2 className={`h-6 w-6 ${charColors.iconColor} animate-spin`} />
              <p className={`${charColors.text} font-semibold`}>Loading logs...</p>
            </div>
          </div>
        ) : logsError ? (
          <div className={`relative overflow-hidden rounded-xl p-8 border-2 backdrop-blur-sm bg-gradient-to-br ${cardCharacters.urgent.bg} ${cardCharacters.urgent.border}`}>
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
            <p className={`relative ${cardCharacters.urgent.text} font-semibold text-center`}>{logsError}</p>
          </div>
        ) : (
          <LogViewer
            announcements={logs}
            type={selectedType}
            department={selectedDepartment}
            startDate={startDate}
            endDate={endDate}
          />
        )}
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={`relative overflow-hidden p-4 rounded-xl border-2 backdrop-blur-sm bg-gradient-to-br ${cardCharacters.completed.bg} ${cardCharacters.completed.border}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative">
            <h3 className={`font-black ${cardCharacters.completed.text} mb-1 text-sm`}>Complete History</h3>
            <p className={`text-xs ${colors.textMuted}`}>All announcements including deleted items</p>
          </div>
        </div>
        <div className={`relative overflow-hidden p-4 rounded-xl border-2 backdrop-blur-sm bg-gradient-to-br ${cardCharacters.informative.bg} ${cardCharacters.informative.border}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative">
            <h3 className={`font-black ${cardCharacters.informative.text} mb-1 text-sm`}>Full Comments & Files</h3>
            <p className={`text-xs ${colors.textMuted}`}>Every comment and attachment with metadata</p>
          </div>
        </div>
        <div className={`relative overflow-hidden p-4 rounded-xl border-2 backdrop-blur-sm bg-gradient-to-br ${cardCharacters.creative.bg} ${cardCharacters.creative.border}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative">
            <h3 className={`font-black ${cardCharacters.creative.text} mb-1 text-sm`}>Professional PDF</h3>
            <p className={`text-xs ${colors.textMuted}`}>Audit-ready format with embedded images</p>
          </div>
        </div>
      </div>
    </div>
  );
}