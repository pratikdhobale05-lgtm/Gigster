async function test() {
    try {
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test2@example.com',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("Logged in. Token:", token.substring(0, 10));
        
        const projectsRes = await fetch('http://localhost:5000/api/projects', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await projectsRes.json();
        console.log("Projects status:", projectsRes.status);
        console.log("Projects body:", data);
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
