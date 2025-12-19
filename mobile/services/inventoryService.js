// REPLACE WITH YOUR IP ADDRESS
const API_URL = "http://192.168.1.4/nurseApp/php/api_inventory.php"; 

export const getInventory = async () => {
    try {
        const res = await fetch(API_URL);
        return await res.json();
    } catch (e) {
        console.error(e);
        return [];
    }
};
export const addItem = async (item) => {
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        return await res.json();
    } catch (e) { return { success: false }; }
};

export const updateItem = async (id, item) => {
    try {
        const res = await fetch(`${API_URL}?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        return await res.json();
    } catch (e) { return { success: false }; }
};

export const deleteItem = async (id) => {
    try {
        await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
        return true;
    } catch (e) { return false; }
};