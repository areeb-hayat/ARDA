// app/components/employeeticketlogs/types.ts

// Status type alias matching database values
export type TicketStatusType = 'pending' | 'in-progress' | 'blocked' | 'resolved' | 'closed';

// Status colors mapping
export const STATUS_COLORS: Record<TicketStatusType, string> = {
  'pending': '#FFA500',      // Orange
  'in-progress': '#2196F3',  // Blue
  'blocked': '#F44336',      // Red
  'resolved': '#4CAF50',     // Green
  'closed': '#757575',       // Gray
};

// Status labels mapping
export const STATUS_LABELS: Record<TicketStatusType, string> = {
  'pending': 'Pending',
  'in-progress': 'In Progress',
  'blocked': 'Blocked',
  'resolved': 'Resolved',
  'closed': 'Closed',
};

export interface TicketStatus {
  status: string;
  count: number;
  color?: string;
  percentage: number;
}

// Alias for backward compatibility
export interface TicketStatusCount extends TicketStatus {}

export interface RecentTicket {
  ticketNumber: string;
  functionalityName: string;
  status: string;
  priority: string;
  createdAt: string;
  role: 'assignee' | 'group_lead' | 'group_member';
  contributorType?: 'primary' | 'secondary';
}

export interface TicketCollection {
  total: number;
  statusBreakdown: TicketStatus[];
  recentTickets: RecentTicket[];
}

export interface TicketAnalytics {
  employeeId: string;
  totalTickets: number;
  
  // Separate primary and secondary ticket data
  primaryTickets: TicketCollection;
  secondaryTickets: TicketCollection;
  
  // Overall data (for backward compatibility)
  statusBreakdown: TicketStatus[];
  recentTickets: RecentTicket[];
}

export interface EmployeeTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  employeeTitle: string;
}