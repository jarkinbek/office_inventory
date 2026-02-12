import axios from 'axios';
import { API_URL } from '../utils/config';

/**
 * API service layer for Office Inventory app
 * All axios calls centralized here
 */

// -------- DATA API --------
export const dataApi = {
    // Get all data (rooms, devices, employees, categories)
    getReport: async () => {
        const res = await axios.get(`${API_URL}/report`);
        return res.data;
    },
};

// -------- DEVICES API --------
export const devicesApi = {
    create: async (deviceData) => {
        const res = await axios.post(`${API_URL}/devices/`, deviceData);
        return res.data;
    },

    update: async (id, deviceData) => {
        const res = await axios.put(`${API_URL}/devices/${id}`, deviceData);
        return res.data;
    },

    delete: async (id) => {
        await axios.delete(`${API_URL}/devices/${id}`);
    },
};

// -------- ROOMS API --------
export const roomsApi = {
    create: async (roomData) => {
        const res = await axios.post(`${API_URL}/rooms/`, roomData);
        return res.data;
    },

    delete: async (id) => {
        await axios.delete(`${API_URL}/rooms/${id}`);
    },
};

// -------- CATEGORIES API --------
export const categoriesApi = {
    create: async (categoryData) => {
        const res = await axios.post(`${API_URL}/categories/`, categoryData);
        return res.data;
    },

    delete: async (id) => {
        await axios.delete(`${API_URL}/categories/${id}`);
    },
};

// -------- EMPLOYEES API --------
export const employeesApi = {
    create: async (employeeData) => {
        const res = await axios.post(`${API_URL}/employees/`, employeeData);
        return res.data;
    },

    update: async (id, employeeData) => {
        const res = await axios.put(`${API_URL}/employees/${id}`, employeeData);
        return res.data;
    },

    delete: async (id) => {
        await axios.delete(`${API_URL}/employees/${id}`);
    },
};

// -------- AUTH API --------
export const authApi = {
    login: async (username, password) => {
        const res = await axios.post(`${API_URL}/login`, { username, password });
        return res.data;
    },
};

// -------- EXPORT/IMPORT API --------
export const exportApi = {
    // Export to Excel
    exportExcel: (lang) => {
        window.open(`${API_URL}/export_excel?lang=${lang}`, '_blank');
    },

    // Export QR codes to PDF
    exportQRPdf: async (deviceIds) => {
        const response = await axios.post(
            `${API_URL}/export_qr_pdf`,
            { device_ids: deviceIds },
            { responseType: 'blob' }
        );
        return response.data;
    },

    // Import from Excel
    importExcel: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await axios.post(`${API_URL}/import_excel`, formData);
        return res.data;
    },
};
