export const adminDashboardData = {
  stats: {
    totalTickets: 1245, openTickets: 42, inProgress: 18, resolvedTickets: 1050,
    slaBreached: 5, totalEmployees: 150, totalTechnicians: 12, totalAssets: 340
  },
  ticketStatus: [
    { name: 'Open', value: 42, fill: '#3b82f6' },
    { name: 'Assigned', value: 25, fill: '#8b5cf6' },
    { name: 'In Progress', value: 18, fill: '#f59e0b' },
    { name: 'Resolved', value: 1050, fill: '#22c55e' },
    { name: 'Closed', value: 110, fill: '#64748b' },
  ],
  ticketPriority: [
    { name: 'Low', value: 200, fill: '#22c55e' },
    { name: 'Medium', value: 450, fill: '#f59e0b' },
    { name: 'High', value: 300, fill: '#ea580c' },
    { name: 'Critical', value: 95, fill: '#dc2626' },
  ],
  techWorkload: [
    { name: 'Alex', assigned: 8, resolved: 45, pending: 3 },
    { name: 'Sarah', assigned: 5, resolved: 38, pending: 2 },
    { name: 'Mike', assigned: 12, resolved: 50, pending: 5 },
    { name: 'John', assigned: 6, resolved: 42, pending: 1 },
  ],
  recentTickets: [
    { id: 'TKT-001245', employee: 'David Palmer', category: 'Hardware', priority: 'High', tech: 'Alex', status: 'Open', sla: 'Ok', date: '2023-10-25' },
    { id: 'TKT-001244', employee: 'Sarah Jenkins', category: 'Software', priority: 'Medium', tech: 'Mike', status: 'In Progress', sla: 'Ok', date: '2023-10-25' },
    { id: 'TKT-001243', employee: 'Chris Evans', category: 'Network', priority: 'Critical', tech: 'Unassigned', status: 'Open', sla: 'Breached', date: '2023-10-24' },
    { id: 'TKT-001242', employee: 'Anna Bell', category: 'Access', priority: 'Low', tech: 'Sarah', status: 'Resolved', sla: 'Ok', date: '2023-10-24' },
  ]
};

export const employeeDashboardData = {
  stats: { myTickets: 12, open: 2, inProgress: 1, resolved: 8, closed: 1 },
  recentTickets: [
    { id: 'TKT-001245', title: 'Laptop screen flickering', priority: 'High', status: 'Open', sla: 'Ok', date: '2023-10-25' },
    { id: 'TKT-001230', title: 'VPN not connecting', priority: 'Medium', status: 'In Progress', sla: 'Ok', date: '2023-10-20' },
  ],
  myAssets: [
    { name: 'MacBook Pro 14', code: 'AST-091', category: 'Laptop', status: 'Assigned', date: '2023-01-15' },
    { name: 'Dell Monitor 27"', code: 'AST-102', category: 'Monitor', status: 'Assigned', date: '2023-01-15' },
  ]
};

export const technicianDashboardData = {
  stats: { assigned: 8, inProgress: 3, resolved: 45, slaBreached: 1, avgRating: 4.8 },
  priorityWork: [
    { id: 'TKT-001243', employee: 'Chris Evans', title: 'Network down in Lab 4', priority: 'Critical', status: 'Assigned', sla: 'Breached' },
    { id: 'TKT-001240', employee: 'Tom Hardy', title: 'Server access denied', priority: 'High', status: 'Assigned', sla: 'Ok' },
  ],
  assignedTickets: [
    { id: 'TKT-001243', employee: 'Chris Evans', category: 'Network', priority: 'Critical', status: 'Assigned', sla: 'Breached', date: '2023-10-24' },
    { id: 'TKT-001240', employee: 'Tom Hardy', category: 'Access', priority: 'High', status: 'In Progress', sla: 'Ok', date: '2023-10-23' },
    { id: 'TKT-001238', employee: 'Emma W.', category: 'Software', priority: 'Medium', status: 'Assigned', sla: 'Ok', date: '2023-10-22' },
  ]
};