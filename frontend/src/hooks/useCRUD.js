import { devicesApi, roomsApi, employeesApi, categoriesApi, exportApi } from '../services/api';
import { message } from 'antd';
import { downloadBlob } from '../utils/helpers';

/**
 * useCRUD hook - all CRUD operations for devices, rooms, employees, categories
 */
export const useCRUD = (fetchData, t) => {

    // -------- DEVICES --------
    const saveDevice = async (values, editingDevice) => {
        try {
            if (editingDevice) {
                await devicesApi.update(editingDevice.id, values);
            } else {
                await devicesApi.create(values);
            }
            message.success(t('msg_success_add'));
            fetchData();
        } catch (error) {
            console.error(error);
            message.error(t('msg_error'));
        }
    };

    const deleteDevice = async (id) => {
        try {
            await devicesApi.delete(id);
            message.success(t('msg_success_del'));
            fetchData();
        } catch (error) {
            console.error(error);
            message.error(t('msg_error'));
        }
    };

    // -------- ROOMS --------
    const saveRoom = async (values, editingRoom) => {
        try {
            if (editingRoom) {
                await roomsApi.update(editingRoom.id, values);
            } else {
                await roomsApi.create(values);
            }
            message.success(t('msg_success_add'));
            fetchData();
        } catch (error) {
            console.error(error);
            message.error(t('msg_error'));
        }
    };

    const deleteRoom = async (id) => {
        try {
            await roomsApi.delete(id);
            message.success(t('msg_success_del'));
            fetchData();
        } catch (error) {
            console.error(error);
            message.error(t('msg_error'));
        }
    };

    // -------- CATEGORIES --------
    const saveCategory = async (values, editingCategory) => {
        try {
            if (editingCategory) {
                await categoriesApi.update(editingCategory.id, values);
            } else {
                await categoriesApi.create(values);
            }
            message.success(t('msg_success_add'));
            fetchData();
        } catch (error) {
            console.error(error);
            message.error(t('msg_error'));
        }
    };

    const deleteCategory = async (id) => {
        try {
            await categoriesApi.delete(id);
            message.success(t('msg_success_del'));
            fetchData();
        } catch (error) {
            console.error(error);
            message.error(t('msg_error'));
        }
    };

    // -------- EMPLOYEES --------
    const saveEmployee = async (values, editingEmployee) => {
        try {
            if (editingEmployee) {
                await employeesApi.update(editingEmployee.id, values);
            } else {
                await employeesApi.create(values);
            }
            message.success(t('msg_success_add'));
            fetchData();
        } catch (error) {
            console.error(error);
            message.error(t('msg_error'));
        }
    };

    const deleteEmployee = async (id) => {
        try {
            await employeesApi.delete(id);
            message.success(t('msg_success_del'));
            fetchData();
        } catch (error) {
            console.error(error);
            message.error(t('msg_error'));
        }
    };

    // -------- EXPORT/IMPORT --------
    const handleExport = (lang) => {
        exportApi.exportExcel(lang);
    };

    const handlePrintQR = async (selectedDevices, t) => {
        if (selectedDevices.length === 0) {
            message.warning(t('select_devices_first') || 'Сначала выберите устройства');
            return;
        }

        try {
            const blob = await exportApi.exportQRPdf(selectedDevices);
            downloadBlob(blob, `qr_codes_${selectedDevices.length}_devices.pdf`);
            message.success(`PDF с ${selectedDevices.length} QR-кодами скачан!`);
            return true; // Success signal to clear selection
        } catch (error) {
            console.error(error);
            message.error('Ошибка при генерации PDF');
            return false;
        }
    };

    const handleImport = async (file, onSuccess, onError) => {
        try {
            await exportApi.importExcel(file);
            message.success('Импорт успешно завершен!');
            onSuccess("Ok");
            fetchData();
        } catch (error) {
            message.error('Ошибка импорта');
            onError({ error });
        }
    };

    return {
        saveDevice,
        deleteDevice,
        saveRoom,
        deleteRoom,
        saveCategory,
        deleteCategory,
        saveEmployee,
        deleteEmployee,
        handleExport,
        handlePrintQR,
        handleImport,
    };
};
