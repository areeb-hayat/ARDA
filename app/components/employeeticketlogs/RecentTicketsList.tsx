// app/components/employeeticketlogs/RecentTicketsList.tsx
'use client';

import React from 'react';
import { RecentTicket, STATUS_COLORS, STATUS_LABELS } from './types';
import { useTheme } from '@/app/context/ThemeContext';
import { Ticket, AlertCircle, CheckCircle, XCircle, Clock, Users, Crown, User } from 'lucide-react';

interface RecentTicketsListProps {
  tickets: RecentTicket[];
}

const priorityColors: Record<string, string> = {
  low: '#32CD32',
  medium: '#FFA500',
  high: '#FF4500',
  critical: '#FF0000',
};

const roleIcons = {
  assignee: User,
  group_lead: Crown,
  group_member: Users,
};

const roleLabels = {
  assignee: 'Assignee',
  group_lead: 'Group Lead',
  group_member: 'Group Member',
};

export default function RecentTicketsList({ tickets }: RecentTicketsListProps) {
  const { colors } = useTheme();

  if (tickets.length === 0) {
    return (
      <div className={`relative text-center py-8 rounded-xl border-2 overflow-hidden ${colors.cardBg} ${colors.borderSubtle}`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        <div className="relative">
          <Ticket className={`h-12 w-12 ${colors.textMuted} mx-auto mb-2 opacity-50`} />
          <p className={`${colors.textMuted} font-semibold text-sm`}>No recent tickets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className={`text-sm font-bold ${colors.textPrimary} flex items-center gap-2`}>
        <Ticket className={`h-4 w-4 ${colors.textAccent}`} />
        Recent Tickets
      </h4>
      <div 
        className="space-y-2 max-h-80 overflow-y-auto pr-2"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: `${colors.scrollbarThumb} ${colors.scrollbarTrack}`,
        }}
      >
        {tickets.map((ticket) => {
          const RoleIcon = roleIcons[ticket.role] || User;
          const statusColor = STATUS_COLORS[ticket.status as keyof typeof STATUS_COLORS] || '#808080';
          const statusLabel = STATUS_LABELS[ticket.status as keyof typeof STATUS_LABELS] || ticket.status;
          
          return (
            <div
              key={ticket.ticketNumber}
              className={`group relative p-3 rounded-xl border-2 transition-all duration-200 overflow-hidden ${colors.cardBg} ${colors.borderSubtle} hover:${colors.borderHover} hover:${colors.shadowCard}`}
            >
              {/* Paper Texture */}
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              
              {/* Hover Glow */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
              />
              
              <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-black ${colors.textAccent} text-xs`}>
                        {ticket.ticketNumber}
                      </span>
                      <div
                        className="px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1"
                        style={{
                          backgroundColor: `${statusColor}20`,
                          color: statusColor,
                          border: `1px solid ${statusColor}40`,
                        }}
                      >
                        {ticket.status === 'blocked' && <XCircle className="h-3 w-3" />}
                        {ticket.status === 'resolved' && <CheckCircle className="h-3 w-3" />}
                        {ticket.status === 'in-progress' && <Clock className="h-3 w-3" />}
                        {ticket.status === 'pending' && <AlertCircle className="h-3 w-3" />}
                        {statusLabel}
                      </div>
                    </div>
                    <p className={`font-bold ${colors.textPrimary} text-sm`}>
                      {ticket.functionalityName}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className={`flex items-center justify-between mt-3 pt-3 border-t-2 ${colors.borderSubtle}`}>
                  <div className="flex items-center gap-2">
                    <RoleIcon className={`h-4 w-4 ${colors.textAccent}`} />
                    <span className={`text-xs font-bold ${colors.textSecondary}`}>
                      {roleLabels[ticket.role]}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div
                      className="px-2 py-0.5 rounded-lg text-xs font-bold"
                      style={{
                        backgroundColor: `${priorityColors[ticket.priority]}20`,
                        color: priorityColors[ticket.priority],
                        border: `1px solid ${priorityColors[ticket.priority]}40`
                      }}
                    >
                      {ticket.priority.toUpperCase()}
                    </div>
                    <span className={`text-xs font-semibold ${colors.textMuted}`}>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}