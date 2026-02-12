import { useState, useEffect } from 'react';
import { dataApi } from '../services/api';

/**
 * useData hook - fetches and manages all app data (rooms, devices, employees, categories)
 */
export const useData = (isAuthenticated) => {
    const [rooms, setRooms] = useState([]);
    const [allDevices, setAllDevices] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await dataApi.getReport();
            setRooms(data.rooms);
            setEmployees(data.employees);
            setCategories(data.categories || []);

            // Flatten devices from rooms
            const devices = [];
            data.rooms.forEach(room => {
                room.devices.forEach(dev => {
                    devices.push({
                        ...dev,
                        key: dev.id,
                        room_id: room.id,
                        room_name: room.room_name,
                        floor: room.floor
                    });
                });
            });
            setAllDevices(devices);

            return devices; // Return for QR handling
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Always fetch data on mount for QR card mode
        // Even if not authenticated, we need device data for QR links
        fetchData();
    }, []);

    return {
        rooms,
        allDevices,
        employees,
        categories,
        loading,
        fetchData,
        setRooms,
        setAllDevices,
        setEmployees,
        setCategories,
    };
};
