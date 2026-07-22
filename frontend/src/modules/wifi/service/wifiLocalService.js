import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

const ACTIVE = 'ACTIVE';
const EXPIRED = 'EXPIRED';
const USED_UP = 'USED_UP';
const DISCONNECTED = 'DISCONNECTED';

function getAuthHeaders() {
    const token = localStorage.getItem('jwt_token');

    return token
        ? { Authorization: `Bearer ${token}` }
        : {};
}

async function get(url) {
    const response = await axios.get(`${API_BASE_URL}${url}`, {
        headers: getAuthHeaders()
    });

    return response.data;
}

async function post(url, payload = {}) {
    const response = await axios.post(`${API_BASE_URL}${url}`, payload, {
        headers: getAuthHeaders()
    });

    return response.data;
}

async function put(url, payload = {}) {
    const response = await axios.put(`${API_BASE_URL}${url}`, payload, {
        headers: getAuthHeaders()
    });

    return response.data;
}

export const wifiLocalService = {
    async getPlans() {
        return get('/wifi/plans');
    },

    async getCurrentSession() {
        return get('/wifi/sessions/current');
    },

    async purchasePlan(planId) {
        return post('/wifi/purchase', { planId });
    },

    async addUsage(sessionId, usedMb = 5) {
        return post(`/wifi/sessions/${sessionId}/usage`, { usedMb });
    },

    async getAllSessions() {
        return get('/admin/wifi/sessions');
    },

    async disconnectSession(sessionId) {
        return post(`/admin/wifi/sessions/${sessionId}/disconnect`);
    },

    // Admin: Plan CRUD
    async getAllPlans() {
        return get('/admin/wifi/plans');
    },

    async createPlan(planData) {
        return post('/admin/wifi/plans', planData);
    },

    async updatePlan(planId, planData) {
        return put(`/admin/wifi/plans/${planId}`, planData);
    },

    async togglePlan(planId) {
        return post(`/admin/wifi/plans/${planId}/toggle`);
    },

    // Admin: Stats
    async getStats() {
        return get('/admin/wifi/stats');
    },

    // Admin: Payment
    async updatePaymentStatus(sessionId, status) {
        return post(`/admin/wifi/sessions/${sessionId}/payment`, { status });
    }
};

export const wifiSessionStatus = {
    ACTIVE,
    EXPIRED,
    USED_UP,
    DISCONNECTED
};
