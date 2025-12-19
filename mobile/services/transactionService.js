// REPLACE WITH YOUR IP
const API_URL = "http://192.168.1.4/nurseApp/php/api_transaction.php"; 

export const getTransactions = async () => {
    try {
        const res = await fetch(API_URL);
        return await res.json();
    } catch (e) { return []; }
};
export const addTransaction = async (data) => {
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (e) { return { success: false, message: "Network Error" }; }
};