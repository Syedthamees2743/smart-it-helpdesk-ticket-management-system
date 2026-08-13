import api from './api';

const API_URL = '/tickets/tickets/';

// Fetch Tickets
export const getTickets = (params = {}) => api.get(API_URL, { params });

// Fetch Single Ticket
export const getTicketById = (id) => api.get(`${API_URL}${id}/`);

// Create Ticket (MUST override Content-Type for file upload)
export const createTicket = (formData) => api.post(API_URL, formData, {
    headers: { 'Content-Type': 'multipart/form-data' } 
});

// Assign Technician (Custom Action)
export const assignTicket = (id, data) => api.post(`${API_URL}${id}/assign/`, data);

// Reopen Ticket (Custom Action)
export const reopenTicket = (id, data) => api.post(`${API_URL}${id}/reopen/`, data);

// Change Ticket Status (Custom Action)
export const changeTicketStatus = (id, data) => api.post(`${API_URL}${id}/change-status/`, data); 

// Comments
export const getComments = (ticketId) => api.get(`${API_URL}${ticketId}/comments/`);
export const addComment = (ticketId, data) => api.post(`${API_URL}${ticketId}/comments/`, data);

export const getCategories = async (params = {}) => {
  const response = await api.get("/tickets/categories/", { params });
  return response.data;
};
