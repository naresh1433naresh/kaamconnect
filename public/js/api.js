// ── KaamConnect API Utility ──
const BASE_URL = '';

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('kc_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(BASE_URL + endpoint, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const API = {
  // Auth
  register: (body) => apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  // Jobs
  getJobs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/api/jobs${qs ? '?' + qs : ''}`);
  },
  getJob: (id) => apiRequest(`/api/jobs/${id}`),
  postJob: (body) => apiRequest('/api/jobs', { method: 'POST', body: JSON.stringify(body) }),
  updateJob: (id, body) => apiRequest(`/api/jobs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteJob: (id) => apiRequest(`/api/jobs/${id}`, { method: 'DELETE' }),
  getMyJobs: () => apiRequest('/api/jobs/employer/myjobs'),

  // Workers
  getWorkers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/api/workers${qs ? '?' + qs : ''}`);
  },
  getWorker: (id) => apiRequest(`/api/workers/${id}`),
  updateWorkerProfile: (body) => apiRequest('/api/workers/profile/update', { method: 'PUT', body: JSON.stringify(body) }),

  // Bookings
  applyJob: (body) => apiRequest('/api/bookings', { method: 'POST', body: JSON.stringify(body) }),
  quickBooking: (body) => apiRequest('/api/bookings/quick', { method: 'POST', body: JSON.stringify(body) }),
  getMyBookings: () => apiRequest('/api/bookings/my'),
  getJobBookings: (jobId) => apiRequest(`/api/bookings/job/${jobId}`),
  updateBookingStatus: (id, body) => apiRequest(`/api/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),
  submitReview: (id, body) => apiRequest(`/api/bookings/${id}/review`, { method: 'POST', body: JSON.stringify(body) }),

  // Stats
  getStats: () => apiRequest('/api/stats'),
};

window.API = API;
