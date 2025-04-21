// login.js - 修改验证逻辑以使用电话号码后8位作为密码
document.addEventListener('DOMContentLoaded', function() {
    // Check for registration success message
    if (sessionStorage.getItem('registrationSuccess') === 'true') {
        // Create success message
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.style.backgroundColor = '#d4edda';
        successMsg.style.color = '#155724';
        successMsg.style.padding = '0.75rem';
        successMsg.style.marginBottom = '1rem';
        successMsg.style.borderRadius = '4px';
        successMsg.textContent = 'Registration successful! Please login with your credentials.';
        
        // Insert before the form
        const loginForm = document.getElementById('loginForm');
        loginForm.parentNode.insertBefore(successMsg, loginForm);
        
        // Clear the flag
        sessionStorage.removeItem('registrationSuccess');
    }
    
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const user = await validateLogin(username, password);
        
        if(user) {
            // Store user info in session storage for use across pages
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            // Redirect to attendance page
            window.location.href = '/attendance.html';
        } else {
            // Show error message
            document.getElementById('errorMessage').textContent = 'Invalid username or password';
            document.getElementById('errorMessage').style.display = 'block';
        }
    });
});

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

// Login validation function - 修改为使用电话号码后8位作为密码
async function validateLogin(username, password) {
    const users = await fetchUserData();
    
    // Find user by student_id
    const user = users.find(user => user.student_id === username);
    
    if (!user) {
        return null; // User not found
    }
    
    // For CSV users, use last 8 digits of phone as password
    if (user.phone) {
        const defaultPassword = user.phone.slice(-8); // Get last 8 digits
        if (password === defaultPassword) {
            return user;
        }
    }
    
    // For locally registered users, check the stored password
    if (user.password && password === user.password) {
        return user;
    }
    
    return null; // Password doesn't match
}
