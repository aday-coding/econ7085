# 前端模块交接文档

## 项目概述

本文档旨在帮助接手前端模块的组员了解已完成的工作、系统架构以及后续开发需求。前端模块实现了学生考勤系统的基础功能，包括登录/注册、签到/签退和历史记录查询。

## 已完成工作

### 1. 前端页面开发
- **登录页面** (`index.html`): 用户身份验证入口
- **注册页面** (`register.html`): 新用户注册功能
- **考勤页面** (`attendance.html`): 学生签到/签退功能
- **历史记录页面** (`history.html`): 考勤历史查询和统计

### 2. 功能实现
- **用户认证**: 基于OSS中CSV文件的用户数据验证
- **临时数据存储**: 使用localStorage存储考勤记录
- **响应式设计**: 适配不同屏幕尺寸的界面

### 3. 部署情况
- 已部署到阿里云ECS实例
- 使用Apache HTTP Server提供Web服务
- 前端文件位于 `/var/www/html/` 目录

## 系统架构

### 当前架构
```
前端 (HTML/CSS/JS) → OSS (用户数据CSV) → 本地存储 (考勤记录)
```

### 目标架构
```
前端 (HTML/CSS/JS) → 后端API → 数据库 → 通知服务
```

## 集成点说明

### 1. 用户认证 (`login.js`)
```javascript
// 当前: 从OSS读取CSV文件验证用户
async function validateLogin(username, password) {
    const users = await fetchUserData(); // 从OSS获取用户数据
    
    // 查找用户并验证密码
    const user = users.find(user => user.student_id === username);
    
    if (!user) return null;
    
    // 使用电话号码后8位作为密码
    if (user.phone) {
        const defaultPassword = user.phone.slice(-8);
        if (password === defaultPassword) return user;
    }
    
    // 检查本地注册用户的密码
    if (user.password && password === user.password) return user;
    
    return null;
}

// 需要替换为: 调用后端API验证用户
async function validateLogin(username, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) return null;
        
        const userData = await response.json();
        return userData;
    } catch (error) {
        console.error('Login error:', error);
        return null;
    }
}
```

### 2. 考勤记录 (`attendance.js`)
```javascript
// 当前: 使用localStorage存储考勤记录
function handleCheckIn() {
    // ...省略部分代码...
    
    // 获取现有记录或初始化新对象
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || {};
    const userRecords = attendanceRecords[currentUser.student_id] || {};
    
    // 更新今日记录
    userRecords[today] = {
        ...userRecords[today],
        checkIn: now,
        date: today
    };
    
    // 保存回存储
    attendanceRecords[currentUser.student_id] = userRecords;
    localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
    
    // ...省略部分代码...
}

// 需要替换为: 调用后端API记录签到
async function handleCheckIn() {
    // ...省略部分代码...
    
    try {
        const response = await fetch('/api/attendance/check-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: currentUser.student_id,
                timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            throw new Error('Check-in failed');
        }
        
        const result = await response.json();
        
        // 更新UI
        document.getElementById('status').textContent = 'Checked In';
        document.getElementById('checkInTime').textContent = now;
        document.getElementById('checkInBtn').disabled = true;
        
        // 重新加载最近考勤
        loadRecentAttendance();
    } catch (error) {
        console.error('Check-in error:', error);
        alert('Failed to check in. Please try again.');
    }
}
```

### 3. 历史记录查询 (`history.js`)
```javascript
// 当前: 从localStorage读取历史记录
function loadAttendanceHistory() {
    // ...省略部分代码...
    
    // 获取考勤记录
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || {};
    const userRecords = attendanceRecords[currentUser.student_id] || {};
    
    // ...省略部分代码...
}

// 需要替换为: 从后端API获取历史记录
async function loadAttendanceHistory() {
    // ...省略部分代码...
    
    try {
        const response = await fetch(`/api/attendance/history?student_id=${currentUser.student_id}&start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}&status=${statusFilter}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch attendance history');
        }
        
        const records = await response.json();
        
        // 使用获取的记录更新UI
        // ...省略部分代码...
    } catch (error) {
        console.error('Error loading attendance history:', error);
        historyContainer.innerHTML = '<p>Error loading attendance records. Please try again later.</p>';
    }
}
```

## 后续开发需求

### 组员2 (后端开发)
1. **实现API接口**:
   - 用户认证API (`/api/auth/login`, `/api/auth/register`)
   - 考勤记录API (`/api/attendance/check-in`, `/api/attendance/check-out`)
   - 历史查询API (`/api/attendance/history`)
   
2. **数据库设计**:
   - 用户表 (student_id, name, email, phone, password_hash等)
   - 考勤记录表 (id, student_id, check_in_time, check_out_time, date等)
   
3. **数据迁移**:
   - 将OSS中的CSV用户数据导入数据库
   - 设计密码重置机制

### 组员3 (管理员门户)
1. **管理员界面开发**:
   - 学生管理 (查看/添加/编辑/删除学生)
   - 考勤统计 (按班级/日期查看考勤情况)
   - 异常考勤处理 (处理缺勤、迟到等情况)
   
2. **与后端集成**:
   - 调用后端API获取和操作数据
   - 实现管理员特权操作

### 组员4 (通知服务)
1. **通知系统开发**:
   - 缺勤提醒
   - 考勤统计报告
   - 系统通知
   
2. **通知渠道**:
   - 邮件通知
   - 短信通知 (可选)
   - 系统内通知

## 技术债务与注意事项

1. **安全性改进**:
   - 当前密码存储为明文，需要实现哈希加密
   - 添加HTTPS支持
   - 实现正确的会话管理，替代localStorage

2. **性能优化**:
   - 减少不必要的API调用
   - 实现数据缓存策略
   - 优化大量历史记录的加载

3. **已知问题**:
   - 登录页面在某些移动设备上显示不正确
   - 历史记录导出CSV功能在某些浏览器可能不兼容
   - 本地时间与服务器时间可能不同步

## 部署与环境配置

### ECS实例信息
- **实例ID**: i-j6chh1f4sq2r5ow5q2co
- **公网IP**: 47.239.3.254

### 文件位置
- **网站根目录**: `/var/www/html/`
- **Apache配置**: `/etc/httpd/conf/httpd.conf`
- **日志文件**: `/var/log/httpd/`

### 部署新版本步骤
1. 连接到ECS实例
2. 导航到网站目录: `cd /var/www/html/`
3. 备份当前文件: `tar -czvf frontend_backup_$(date +%Y%m%d).tar.gz *.html *.js *.css`
4. 上传新文件 (使用SFTP或scp)
5. 检查文件权限: `chmod 644 *.html *.js *.css`
6. 重启Apache: `systemctl restart httpd`

## 用户数据

- **OSS资源**: 
  - 用户数据CSV: `https://attendance-system7085.oss-cn-hongkong.aliyuncs.com/students_data_simple.csv`


