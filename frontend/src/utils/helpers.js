/**
 * Helper utilities for Office Inventory app
 */

// Get status color for Tag component
export const getStatusColor = (status) => {
    switch (status) {
        case 'working': return 'green';
        case 'in_stock': return 'blue';
        case 'repair': return 'orange';
        case 'broken': return 'red';
        case 'decommissioned': return 'default';
        default: return 'default';
    }
};

// Get localized status label
export const getStatusLabel = (status, lang) => {
    switch (status) {
        case 'working': return lang === 'uz' ? 'Ishlayapti' : 'В работе';
        case 'in_stock': return lang === 'uz' ? 'Omborda' : 'На складе';
        case 'repair': return lang === 'uz' ? 'Ta\'mirda' : 'В ремонте';
        case 'broken': return lang === 'uz' ? 'Buzilgan' : 'Сломано';
        case 'decommissioned': return lang === 'uz' ? 'Hisobdan chiqarilgan' : 'Списано';
        default: return status;
    }
};

// Download blob as file
export const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

// Download QR code label with logo
export const downloadQRCode = async (viewDevice) => {
    const container = document.getElementById("qr-label-container");
    if (!container) {
        console.error('QR label container not found');
        return;
    }

    try {
        // Use html2canvas to capture the entire container
        const html2canvas = (await import('html2canvas')).default;

        const canvas = await html2canvas(container, {
            backgroundColor: '#f5f5f5',
            scale: 2, // Higher quality
            logging: false
        });

        // Download
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `qr_label_${viewDevice.inventory_number || viewDevice.id}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    } catch (error) {
        console.error('Error generating QR label:', error);
        alert('Ошибка при создании QR наклейки. Попробуйте снова.');
    }
};
