// REPLACE WITH YOUR COMPUTER IP
const API_URL = "http://192.168.1.4/nurseApp/php/api_staff.php"; 

export const getStaff = async () => {
  try {
    const res = await fetch(API_URL);
    return await res.json();
  } catch (e) { return []; }
};
export const addStaff = async (staffData) => {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffData)
    });
    return await res.json();
  } catch (e) { return { success: false, message: "Network Error" }; }
};

export const updateStaff = async (id, staffData) => {
  try {
    const res = await fetch(`${API_URL}?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffData)
    });
    return await res.json();
  } catch (e) { return { success: false, message: "Network Error" }; }
};

export const deleteStaff = async (id) => {
  try {
    await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
    return true;
  } catch (e) { return false; }
};