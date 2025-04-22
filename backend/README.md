# 后端开发指南 - 云端数据存储（组员2）

## 概述
本模块负责将学生考勤系统的数据安全地存储在云端，使用阿里云RDS MySQL作为主要数据库和OSS服务作为备份存储。您将实现数据持久化层和RESTful API接口，替代前端目前使用的本地存储方案。

## 系统架构

### 当前架构
前端 (HTML/CSS/JS) → 本地存储 (localStorage)

### 目标架构
前端 (HTML/CSS/JS) → 后端API → RDS MySQL → OSS备份

## 数据库设计

### 主要表结构

#### 1. 用户表 (students)
```sql
CREATE TABLE students (
    student_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    class VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. 课程表 (courses)
```sql
CREATE TABLE courses (
    course_id VARCHAR(20) PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    instructor VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 3. 课程时间表 (course_schedules)
```sql
CREATE TABLE course_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id VARCHAR(20) NOT NULL,
    day TINYINT NOT NULL COMMENT '0-6, 0 is Sunday',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    classroom VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);
```

#### 4. 考勤记录表 (attendance_records)
```sql
CREATE TABLE attendance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    course_id VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    check_in DATETIME,
    check_out DATETIME,
    status ENUM('ontime', 'late', 'earlyleave', 'absent') NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    UNIQUE KEY (student_id, course_id, date)
);
```

## API接口设计

### 1. 用户认证API

#### 登录
- **路径**: `/api/auth/login`
- **方法**: POST
- **请求体**:
  ```json
  {
    "studentId": "12345678",
    "password": "12345678",
    "class": "ECON7085"
  }
  ```
- **成功响应** (200):
  ```json
  {
    "success": true,
    "data": {
      "studentId": "12345678",
      "name": "张三",
      "class": "ECON7085",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **失败响应** (401):
  ```json
  {
    "success": false,
    "message": "Invalid credentials"
  }
  ```

#### 登出
- **路径**: `/api/auth/logout`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **成功响应** (200):
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

### 2. 考勤记录API

#### 签到
- **路径**: `/api/attendance/check-in`
- **方法**: POST
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "studentId": "12345678",
    "courseId": "ECON7085",
    "date": "2025-04-22",
    "checkIn": "2025-04-22T10:05:00"
  }
  ```
- **成功响应** (200):
  ```json
  {
    "success": true,
    "data": {
      "id": 123,
      "studentId": "12345678",
      "courseId": "ECON7085",
      "courseName": "Cloud Computing for Business Analytics",
      "date": "2025-04-22",
      "checkIn": "2025-04-22T10:05:00",
      "status": "late"
    }
  }
  ```

#### 签退
- **路径**: `/api/attendance/check-out`
- **方法**: PUT
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "studentId": "12345678",
    "courseId": "ECON7085",
    "date": "2025-04-22",
    "checkOut": "2025-04-22T12:55:00"
  }
  ```
- **成功响应** (200):
  ```json
  {
    "success": true,
    "data": {
      "id": 123,
      "studentId": "12345678",
      "courseId": "ECON7085",
      "courseName": "Cloud Computing for Business Analytics",
      "date": "2025-04-22",
      "checkIn": "2025-04-22T10:05:00",
      "checkOut": "2025-04-22T12:55:00",
      "status": "late"
    }
  }
  ```

#### 获取当前课程
- **路径**: `/api/courses/current`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **成功响应** (200):
  ```json
  {
    "success": true,
    "data": {
      "courseId": "ECON7085",
      "courseName": "Cloud Computing for Business Analytics",
      "startTime": "10:00",
      "endTime": "13:00",
      "classroom": "Room 301"
    }
  }
  ```
- **无课程响应** (200):
  ```json
  {
    "success": true,
    "data": null
  }
  ```

#### 获取考勤历史
- **路径**: `/api/attendance/history`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  - `studentId`: 学生ID
  - `startDate`: 开始日期 (YYYY-MM-DD)
  - `endDate`: 结束日期 (YYYY-MM-DD)
  - `course`: 课程ID (可选)
  - `status`: 状态 (可选)
- **成功响应** (200):
  ```json
  {
    "success": true,
    "data": {
      "records": [
        {
          "id": 123,
          "studentId": "12345678",
          "courseId": "ECON7085",
          "courseName": "Cloud Computing for Business Analytics",
          "date": "2025-04-22",
          "checkIn": "2025-04-22T10:05:00",
          "checkOut": "2025-04-22T12:55:00",
          "status": "late"
        },
        // 更多记录...
      ],
      "statistics": {
        "total": 10,
        "ontime": 7,
        "late": 2,
        "earlyleave": 1,
        "absent": 0,
        "attendanceRate": 100,
        "ontimeRate": 70
      }
    }
  }
  ```

### 3. 课程API

#### 获取课程列表
- **路径**: `/api/courses`
- **方法**: GET
- **请求头**: `Authorization: Bearer {token}`
- **成功响应** (200):
  ```json
  {
    "success": true,
    "data": [
      {
        "courseId": "ECON7085",
        "courseName": "Cloud Computing for Business Analytics",
        "instructor": "张教授",
        "schedules": [
          {
            "day": 2,
            "startTime": "10:00",
            "endTime": "13:00",
            "classroom": "Room 301"
          }
        ]
      },
      // 更多课程...
    ]
  }
  ```

## 开发指南

### 1. 环境设置
- 使用阿里云RDS MySQL作为主数据库
- 配置阿里云OSS作为备份存储
- 设置开发环境变量（数据库连接信息、OSS访问密钥等）

### 2. 技术栈建议
- Node.js + Express.js 作为后端框架
- MySQL作为数据库
- JWT用于用户认证
- 阿里云SDK用于OSS操作

### 3. 开发步骤

#### 第一阶段：数据库设计与实现
1. 创建RDS MySQL数据库
2. 实现上述表结构
3. 创建初始测试数据
4. 实现数据访问层（DAO）

#### 第二阶段：API实现
1. 搭建Express.js应用
2. 实现用户认证API
3. 实现考勤记录API
4. 实现课程API
5. 添加错误处理和日志记录

#### 第三阶段：数据备份功能
1. 实现定时备份功能
2. 将数据库备份到OSS
3. 添加备份恢复功能

#### 第四阶段：与前端集成
1. 与前端开发者协作，确保API接口满足需求
2. 进行集成测试
3. 解决集成过程中的问题

### 4. 与前端集成点

#### 用户认证
替换 `login.js` 中的 `validateLogin` 函数：
```javascript
// 前端代码需要修改为:
async function validateLogin(studentId, password, selectedClass) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, password, class: selectedClass })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            return { success: false, message: data.message || 'Login failed' };
        }
        
        // 存储token和用户信息
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('userData', JSON.stringify({
            studentId: data.data.studentId,
            name: data.data.name,
            class: data.data.class
        }));
        
        return { success: true, data: data.data };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}
```

#### 考勤记录
替换 `attendance.js` 中的 `handleCheckIn` 和 `handleCheckOut` 函数：
```javascript
// 签到函数
async function handleCheckIn() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = localStorage.getItem('token');
    const currentTime = new Date().toISOString();
    const currentDate = currentTime.split('T')[0];
    
    try {
        const response = await fetch('/api/attendance/check-in', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                studentId: userData.studentId,
                courseId: currentCourse.courseId,
                date: currentDate,
                checkIn: currentTime
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Check-in failed');
        }
        
        // 更新UI
        document.getElementById('checkInStatus').textContent = '已签到';
        document.getElementById('checkInTime').textContent = new Date(data.data.checkIn).toLocaleTimeString();
        document.getElementById('checkInBtn').disabled = true;
        document.getElementById('status').textContent = getStatusText(data.data.status);
        
    } catch (error) {
        console.error('Check-in error:', error);
        alert(error.message || 'Failed to check in. Please try again.');
    }
}

// 签退函数
async function handleCheckOut() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = localStorage.getItem('token');
    const currentTime = new Date().toISOString();
    const currentDate = currentTime.split('T')[0];
    
    try {
        const response = await fetch('/api/attendance/check-out', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                studentId: userData.studentId,
                courseId: currentCourse.courseId,
                date: currentDate,
                checkOut: currentTime
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Check-out failed');
        }
        
        // 更新UI
        document.getElementById('checkOutStatus').textContent = '已签退';
        document.getElementById('checkOutTime').textContent = new Date(data.data.checkOut).toLocaleTimeString();
        document.getElementById('checkOutBtn').disabled = true;
        document.getElementById('status').textContent = getStatusText(data.data.status);
        
    } catch (error) {
        console.error('Check-out error:', error);
        alert(error.message || 'Failed to check out. Please try again.');
    }
}
```

#### 历史记录查询
替换 `history.js` 中的 `loadAttendanceHistory` 函数：
```javascript
async function loadAttendanceHistory() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = localStorage.getItem('token');
    
    // 获取过滤条件
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const courseFilter = document.getElementById('courseFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    // 构建查询参数
    const params = new URLSearchParams({
        studentId: userData.studentId,
        startDate: startDate,
        endDate: endDate
    });
    
    if (courseFilter) params.append('course', courseFilter);
    if (statusFilter) params.append('status', statusFilter);
    
    try {
        const response = await fetch(`/api/attendance/history?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to load attendance history');
        }
        
        // 更新UI
        updateAttendanceTable(data.data.records);
        updateStatistics(data.data.statistics);
        
    } catch (error) {
        console.error('Error loading attendance history:', error);
        document.getElementById('historyContainer').innerHTML = 
            `<div class="alert alert-danger">Error: ${error.message || 'Failed to load attendance records'}</div>`;
    }
}
```

#### 获取当前课程
替换 `attendance.js` 中的课程获取逻辑：
```javascript
async function getCurrentCourse() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/courses/current', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to get current course');
        }
        
        return data.data; // 返回当前课程，如果没有则为null
        
    } catch (error) {
        console.error('Error getting current course:', error);
        return null;
    }
}
```

## 数据备份策略

### 1. 定时备份
- 每日凌晨3点进行全量备份
- 每小时进行增量备份

### 2. 备份内容
- 数据库表结构和数据
- 考勤记录和用户数据

### 3. 备份存储
- 使用阿里云OSS存储备份文件
- 设置生命周期策略，保留30天的备份

### 4. 恢复机制
- 提供管理界面进行备份恢复
- 支持按日期选择备份点

## 安全性考虑

### 1. 用户认证
- 使用JWT进行用户认证
- 设置合理的token过期时间
- 实现token刷新机制

### 2. 数据安全
- 使用密码哈希存储用户密码
- 实现API访问限制和防护
- 添加SQL注入防护

### 3. 传输安全
- 使用HTTPS进行数据传输
- 实现API请求签名验证

## 测试计划

### 1. 单元测试
- 测试数据访问层
- 测试业务逻辑层
- 测试API接口

### 2. 集成测试
- 测试与前端的集成
- 测试与OSS的集成
- 测试备份恢复功能

### 3. 性能测试
- 测试API响应时间
- 测试并发请求处理能力
- 测试数据库性能

## 部署指南

### 1. 环境要求
- Node.js v14+
- MySQL 8.0+
- 阿里云ECS实例
- 阿里云RDS MySQL
- 阿里云OSS

### 2. 部署步骤
1. 克隆代码仓库
2. 安装依赖: `npm install`
3. 配置环境变量
4. 初始化数据库: `npm run db:migrate`
5. 启动应用: `npm start`

### 3. 监控与维护
- 使用PM2进行进程管理
- 设置日志轮转
- 配置监控告警

## 联系信息

如有任何问题，请联系前端开发负责人：[前端开发者联系方式]

## 参考资源
- [Express.js文档](https://expressjs.com/)
- [MySQL文档](https://dev.mysql.com/doc/)
- [阿里云RDS文档](https://www.alibabacloud.com/help/product/26090.htm)
- [阿里云OSS文档](https://www.alibabacloud.com/help/product/31815.htm)
