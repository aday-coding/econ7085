// register.js - 更新以兼容新的登录验证逻辑
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('registerForm').addEventListener('submit', handleRegistration);
});

async function handleRegistration(e) {
    e.preventDefault();
    
    const studentId = document.getElementById('studentId').value;
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value; // 添加电话输入字段
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Error message element
    const errorMsg = document.getElementById('regErrorMessage');
    
    // Basic validation
    if (password !== confirmPassword) {
        errorMsg.textContent = 'Passwords do not match';
        errorMsg.style.display = 'block';
        return;
    }
    
    // Check if student ID already exists
    try {
        const users = await fetchUserData();
        const existingUser = users.find(user => user.student_id === studentId);
        
        if (existingUser) {
            errorMsg.textContent = 'Student ID already registered';
            errorMsg.style.display = 'block';
            return;
        }
        
        // Get existing registered users
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];
        
        // Add new user
        registeredUsers.push({
            student_id: studentId,
            student_name: fullName,
            email: email,
            phone: phone, // 保存电话号码
            password: password, // 同时保存自定义密码
            registration_date: new Date().toISOString()
        });
        
        // Save back to storage
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
        
        // Redirect to login page with success message
        sessionStorage.setItem('registrationSuccess', 'true');
        window.location.href = '/index.html';
        
    } catch (error) {
        console.error('Registration error:', error);
        errorMsg.textContent = 'An error occurred during registration. Please try again.';
        errorMsg.style.display = 'block';
    }
}

// Function to fetch user data from OSS
async function fetchUserData() {
    try {
        const response = await fetch('https://attendance-system7085.oss-cn-hongkong.aliyuncs.com/students_data_simple.csv');
        const csvText = await response.text();
        
        // Parse CSV data
        const rows = csvText.split('\n');
        const headers = rows[0].split(',');
        
        const users = [];
        for(let i = 1; i < rows.length; i++) {
            if(rows[i].trim() === '') continue;
            
            const userData = rows[i].split(',');
            const user = {};
            
            headers.forEach((header, index) => {
                user[header.trim()] = userData[index]?.trim();
            });
            
            users.push(user);
        }
        
        // Also include locally registered users
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];
        return [...users, ...registeredUsers];
        
    } catch (error) {
        console.error('Error fetching user data:', error);
        return [];
    }
}
