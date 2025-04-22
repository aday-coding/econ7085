document.addEventListener('DOMContentLoaded', function() {
    // 检查是否已登录
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        window.location.href = 'attendance.html';
    }
    
    // 添加登录按钮事件监听器
    document.getElementById('loginBtn').addEventListener('click', login);
    
    // 添加回车键登录
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
});

function login() {
    const studentId = document.getElementById('studentId').value.trim();
    const password = document.getElementById('password').value.trim();
    const selectedClass = document.getElementById('class').value;
    const errorMessage = document.getElementById('errorMessage');
    
    // 简单验证
    if (!studentId) {
        errorMessage.textContent = 'Please enter your student ID';
        return;
    }
    
    if (!password) {
        errorMessage.textContent = 'Please enter your password';
        return;
    }
    
    if (!selectedClass) {
        errorMessage.textContent = 'Please select your class';
        return;
    }
    
    // 验证密码是否为手机号码后8位
    if (!/^\d{8}$/.test(password)) {
        errorMessage.textContent = 'Password must be the last 8 digits of your phone number';
        return;
    }
    
    // 在实际应用中，这里应该发送请求到服务器验证
    // 这里为了演示，我们使用手机号码后8位作为密码
    // 假设验证通过
    const userData = {
        studentId: studentId,
        name: `Student ${studentId}`,
        class: selectedClass
    };
    
    // 保存用户数据到本地存储
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // 跳转到考勤页面
    window.location.href = 'attendance.html';
}
