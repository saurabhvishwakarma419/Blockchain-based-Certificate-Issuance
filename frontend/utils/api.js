const API_BASE_URL = "http://localhost:5000";

export const generateHash = async (certData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/generate-hash`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(certData)
        });
        return await response.json();
    } catch (error) {
        console.error("Backend connection failed:", error);
        return { error: "Backend not reachable" };
    }
};
