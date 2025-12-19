// REPLACE WITH YOUR PC IP ADDRESS
const API_BASE_URL = "http://192.168.1.4/nurseApp/php"; 

export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // WE SEND 'username' key to match your web code logic
      body: JSON.stringify({ username, password }),
    });
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return data;
    } catch (e) {
      console.error("Server sent raw text:", text);
      return { success: false, message: "Server Error: Not JSON" };
    }
  } catch (error) {
    return { success: false, message: "Network connection failed" };
  }
};