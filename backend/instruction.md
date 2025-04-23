# 简化后端实现指南 - 学生考勤系统

根据前端模块的需求，我将提供一个简化的后端实现方案，专注于最小可行路径，帮助技术能力有限的组员2完成基本功能。

## 技术选择

- **编程语言**: Node.js + Express
- **数据库**: MySQL
- **认证方式**: JWT (JSON Web Tokens)
- **部署环境**: 阿里云ECS

## 项目结构

```
attendance-backend/
├── config/
│   └── db.js           # 数据库配置
├── routes/
│   ├── auth.js         # 认证相关路由
│   ├── attendance.js   # 考勤相关路由
│   └── courses.js      # 课程相关路由
├── app.js              # 主应用文件
├── db-schema.sql       # 数据库结构文件
├── sample-data.sql     # 示例数据
├── package.json        # 项目依赖
└── .env                # 环境变量(不提交到git)
```

## 步骤1: 初始化项目

```bash
# 创建项目文件夹
mkdir attendance-backend
cd attendance-backend

# 初始化npm项目
npm init -y

# 安装依赖
npm install express mysql2 jsonwebtoken bcrypt cors dotenv
```

## 步骤2: 创建数据库结构

创建 `db-schema.sql` 文件:

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS attendance_system;
USE attendance_system;

-- 用户表
CREATE TABLE IF NOT EXISTS students (
    student_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    class VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 课程表
CREATE TABLE IF NOT EXISTS courses (
    course_id VARCHAR(20) PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    instructor VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 课程时间表
CREATE TABLE IF NOT EXISTS course_schedules (
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

-- 考勤记录表
CREATE TABLE IF NOT EXISTS attendance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    course_id VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status ENUM('ontime', 'late', 'earlyleave', 'absent') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    UNIQUE KEY (student_id, course_id, date)
);
```

## 步骤3: 添加示例数据

创建 `sample-data.sql` 文件:

```sql
USE attendance_system;

-- 添加示例课程
INSERT INTO courses (course_id, course_name, instructor) VALUES
('ECON7085', 'Cloud Computing for Business Analytics', 'Dr. Smith'),
('ECON7960', 'UX and A/B Testing', 'Dr. Johnson'),
('ECON7950', 'Business and Economic Forecasting with Big Data', 'Dr. Williams'),
('ECON7640', 'Digital Currency Economics', 'Dr. Brown');

-- 添加课程时间表
INSERT INTO course_schedules (course_id, day, start_time, end_time, classroom) VALUES
('ECON7085', 2, '10:00', '13:00', 'Room 301'),  -- Tuesday 10:00-13:00
('ECON7960', 3, '09:30', '12:20', 'Room 302'),  -- Wednesday 9:30-12:20
('ECON7960', 3, '18:30', '21:20', 'Room 303'),  -- Wednesday 18:30-21:20
('ECON7950', 4, '14:00', '17:00', 'Room 304'),  -- Thursday 14:00-17:00
('ECON7640', 5, '10:00', '13:00', 'Room 305');  -- Friday 10:00-13:00
```

## 步骤4: 配置数据库连接

创建 `.env` 文件:

```
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=attendance_system
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

创建 `config/db.js` 文件:

```javascript
// config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();

module.exports = pool;
```

## 步骤5: 创建主应用文件

创建 `app.js` 文件:

```javascript
// app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const coursesRoutes = require('./routes/courses');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/courses', coursesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 步骤6: 实现认证路由

创建 `routes/auth.js` 文件:

```javascript
// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { studentId, password, class: studentClass } = req.body;
    
    // Validate request data
    if (!studentId || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID and password are required' 
      });
    }
    
    // Check if password is 8 digits (phone number last 8 digits)
    if (!/^\d{8}$/.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be 8 digits (last 8 digits of your phone number)' 
      });
    }
    
    // Check if user exists
    const [users] = await pool.query(
      'SELECT * FROM students WHERE student_id = ?',
      [studentId]
    );
    
    let user = users[0];
    
    // If user doesn't exist, create a new one (for demo purposes)
    if (!user) {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert new user
      await pool.query(
        'INSERT INTO students (student_id, name, phone, password_hash, class) VALUES (?, ?, ?, ?, ?)',
        [studentId, `Student ${studentId}`, `12345678${password}`, hashedPassword, studentClass]
      );
      
      // Get newly created user
      const [newUsers] = await pool.query(
        'SELECT * FROM students WHERE student_id = ?',
        [studentId]
      );
      
      user = newUsers[0];
    } else {
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { studentId: user.student_id, class: user.class },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    // Return user data and token
    res.json({
      success: true,
      data: {
        studentId: user.student_id,
        name: user.name || `Student ${user.student_id}`,
        class: user.class,
        token
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Logout route (client-side only, just for API completeness)
router.post('/logout', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
});

module.exports = router;
```

## 步骤7: 创建JWT验证中间件

创建 `middleware/auth.js` 文件:

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
}

module.exports = authMiddleware;
```

## 步骤8: 实现考勤路由

创建 `routes/attendance.js` 文件:

```javascript
// routes/attendance.js
const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Check-in route
router.post('/check-in', async (req, res) => {
  try {
    const { studentId, courseId, date, checkIn } = req.body;
    
    // Validate request data
    if (!studentId || !courseId || !date || !checkIn) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Get course details to determine if late
    const [courses] = await pool.query(
      `SELECT cs.start_time, cs.end_time, c.course_name 
       FROM courses c
       JOIN course_schedules cs ON c.course_id = cs.course_id
       WHERE c.course_id = ? AND cs.day = WEEKDAY(?) + 1`,
      [courseId, date]
    );
    
    if (courses.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found or not scheduled for this day' 
      });
    }
    
    const course = courses[0];
    
    // Determine if check-in is late
    const checkInTime = new Date(checkIn).toTimeString().slice(0, 8);
    const startTime = course.start_time;
    const status = checkInTime > startTime ? 'late' : 'ontime';
    
    // Check if record already exists
    const [existingRecords] = await pool.query(
      'SELECT * FROM attendance_records WHERE student_id = ? AND course_id = ? AND date = ?',
      [studentId, courseId, date]
    );
    
    let recordId;
    
    if (existingRecords.length > 0) {
      // Update existing record
      await pool.query(
        'UPDATE attendance_records SET check_in = ?, status = ? WHERE id = ?',
        [checkInTime, status, existingRecords[0].id]
      );
      recordId = existingRecords[0].id;
    } else {
      // Create new record
      const [result] = await pool.query(
        'INSERT INTO attendance_records (student_id, course_id, date, check_in, status) VALUES (?, ?, ?, ?, ?)',
        [studentId, courseId, date, checkInTime, status]
      );
      recordId = result.insertId;
    }
    
    // Get updated record
    const [updatedRecords] = await pool.query(
      `SELECT ar.*, c.course_name 
       FROM attendance_records ar
       JOIN courses c ON ar.course_id = c.course_id
       WHERE ar.id = ?`,
      [recordId]
    );
    
    res.json({
      success: true,
      data: updatedRecords[0]
    });
    
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Check-out route
router.put('/check-out', async (req, res) => {
  try {
    const { studentId, courseId, date, checkOut } = req.body;
    
    // Validate request data
    if (!studentId || !courseId || !date || !checkOut) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Get course details to determine if early leave
    const [courses] = await pool.query(
      `SELECT cs.start_time, cs.end_time, c.course_name 
       FROM courses c
       JOIN course_schedules cs ON c.course_id = cs.course_id
       WHERE c.course_id = ? AND cs.day = WEEKDAY(?) + 1`,
      [courseId, date]
    );
    
    if (courses.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found or not scheduled for this day' 
      });
    }
    
    const course = courses[0];
    
    // Get existing record
    const [existingRecords] = await pool.query(
      'SELECT * FROM attendance_records WHERE student_id = ? AND course_id = ? AND date = ?',
      [studentId, courseId, date]
    );
    
    if (existingRecords.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No check-in record found' 
      });
    }
    
    const existingRecord = existingRecords[0];
    
    // Determine if check-out is early
    const checkOutTime = new Date(checkOut).toTimeString().slice(0, 8);
    const endTime = course.end_time;
    
    // Determine status based on check-in and check-out times
    let status = existingRecord.status;
    if (checkOutTime < endTime) {
      status = 'earlyleave';
    }
    
    // Update record
    await pool.query(
      'UPDATE attendance_records SET check_out = ?, status = ? WHERE id = ?',
      [checkOutTime, status, existingRecord.id]
    );
    
    // Get updated record
    const [updatedRecords] = await pool.query(
      `SELECT ar.*, c.course_name 
       FROM attendance_records ar
       JOIN courses c ON ar.course_id = c.course_id
       WHERE ar.id = ?`,
      [existingRecord.id]
    );
    
    res.json({
      success: true,
      data: updatedRecords[0]
    });
    
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get attendance history
router.get('/history', async (req, res) => {
  try {
    const { studentId, startDate, endDate, course, status } = req.query;
    
    // Validate studentId
    if (!studentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID is required' 
      });
    }
    
    // Build query
    let query = `
      SELECT ar.*, c.course_name 
      FROM attendance_records ar
      JOIN courses c ON ar.course_id = c.course_id
      WHERE ar.student_id = ?
    `;
    
    const queryParams = [studentId];
    
    // Add date range filter
    if (startDate && endDate) {
      query += ' AND ar.date BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    }
    
    // Add course filter
    if (course && course !== 'all') {
      query += ' AND ar.course_id = ?';
      queryParams.push(course);
    }
    
    // Add status filter
    if (status && status !== 'all') {
      query += ' AND ar.status = ?';
      queryParams.push(status);
    }
    
    // Add order by
    query += ' ORDER BY ar.date DESC, ar.check_in DESC';
    
    // Execute query
    const [records] = await pool.query(query, queryParams);
    
    // Calculate statistics
    const totalRecords = records.length;
    const ontimeCount = records.filter(r => r.status === 'ontime').length;
    const lateCount = records.filter(r => r.status === 'late').length;
    const earlyleaveCount = records.filter(r => r.status === 'earlyleave').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    
    const statistics = {
      total: totalRecords,
      ontime: ontimeCount,
      late: lateCount,
      earlyleave: earlyleaveCount,
      absent: absentCount,
      attendanceRate: totalRecords > 0 ? ((totalRecords - absentCount) / totalRecords * 100).toFixed(2) : 0,
      ontimeRate: totalRecords > 0 ? (ontimeCount / totalRecords * 100).toFixed(2) : 0
    };
    
    res.json({
      success: true,
      data: {
        records,
        statistics
      }
    });
    
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;
```

## 步骤9: 实现课程路由

创建 `routes/courses.js` 文件:

```javascript
// routes/courses.js
const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all courses
router.get('/', async (req, res) => {
  try {
    // Get all courses with their schedules
    const [courses] = await pool.query(`
      SELECT c.course_id, c.course_name, c.instructor
      FROM courses c
    `);
    
    // For each course, get its schedules
    for (const course of courses) {
      const [schedules] = await pool.query(`
        SELECT day, start_time, end_time, classroom
        FROM course_schedules
        WHERE course_id = ?
      `, [course.course_id]);
      
      course.schedules = schedules;
    }
    
    res.json({
      success: true,
      data: courses
    });
    
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get current course
router.get('/current', async (req, res) => {
  try {
    // Get current day and time
    const now = new Date();
    const currentDay = (now.getDay() + 6) % 7 + 1; // Convert to 1-7 (Monday-Sunday)
    const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS
    
    // Get current course
    const [courses] = await pool.query(`
      SELECT c.course_id, c.course_name, c.instructor, 
             cs.start_time, cs.end_time, cs.classroom
      FROM courses c
      JOIN course_schedules cs ON c.course_id = cs.course_id
      WHERE cs.day = ? AND ? BETWEEN cs.start_time AND cs.end_time
    `, [currentDay, currentTime]);
    
    if (courses.length === 0) {
      return res.json({
        success: true,
        data: null
      });
    }
    
    res.json({
      success: true,
      data: courses[0]
    });
    
  } catch (error) {
    console.error('Get current course error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;
```

## 步骤10: 完成 package.json

更新 `package.json` 文件:

```json
{
  "name": "attendance-backend",
  "version": "1.0.0",
  "description": "Backend for Student Attendance System",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "init-db": "mysql -u root -p < db-schema.sql && mysql -u root -p < sample-data.sql"
  },
  "dependencies": {
    "bcrypt": "^5.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "mysql2": "^3.2.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
```

## 步骤11: 部署到阿里云ECS

1. **安装必要软件**

```bash
# 更新系统
sudo yum update -y

# 安装Node.js
curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs

# 安装MySQL
sudo yum install -y mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld

# 设置MySQL root密码
sudo mysql_secure_installation
```

2. **创建数据库和用户**

```bash
# 登录MySQL
sudo mysql -u root -p

# 在MySQL中执行
CREATE DATABASE attendance_system;
CREATE USER 'attendance_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON attendance_system.* TO 'attendance_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

3. **部署应用**

```bash
# 创建应用目录
mkdir -p /var/www/attendance-backend
cd /var/www/attendance-backend

# 将代码复制到服务器
# 可以使用scp, git clone或其他方式

# 安装依赖
npm install

# 创建.env文件
cat > .env << EOL
DB_HOST=localhost
DB_USER=attendance_user
DB_PASSWORD=your_password
DB_NAME=attendance_system
JWT_SECRET=your_jwt_secret_key
PORT=3000
EOL

# 导入数据库结构和示例数据
mysql -u attendance_user -p attendance_system < db-schema.sql
mysql -u attendance_user -p attendance_system < sample-data.sql

# 安装PM2进程管理器
sudo npm install -g pm2

# 启动应用
pm2 start app.js --name "attendance-backend"
pm2 save
pm2 startup

# 配置防火墙
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

4. **配置Nginx反向代理(可选)**

```bash
# 安装Nginx
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 创建Nginx配置文件
sudo nano /etc/nginx/conf.d/attendance.conf

# 添加以下内容
server {
    listen 80;
    server_name your_server_ip_or_domain;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}

# 测试Nginx配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx

# 配置防火墙
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload
```

## 步骤12: 前端集成

1. **更新前端登录功能 (login.js)**

```javascript
// 替换validateLogin函数
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

2. **更新前端考勤功能 (attendance.js)**

```javascript
// 获取当前课程
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
        document.getElementById('checkInTime').textContent = new Date(data.data.check_in).toLocaleTimeString();
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
        document.getElementById('checkOutTime').textContent = new Date(data.data.check_out).toLocaleTimeString();
        document.getElementById('checkOutBtn').disabled = true;
        document.getElementById('status').textContent = getStatusText(data.data.status);
        
    } catch (error) {
        console.error('Check-out error:', error);
        alert(error.message || 'Failed to check out. Please try again.');
    }
}

// 状态文本转换
function getStatusText(status) {
    const statusMap = {
        'ontime': '准时',
        'late': '迟到',
        'earlyleave': '早退',
        'absent': '缺勤'
    };
    return statusMap[status] || status;
}
```

3. **更新前端历史记录查询功能 (history.js)**

```javascript
// 加载考勤历史记录
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
        studentId: userData.studentId
    });
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (courseFilter && courseFilter !== 'all') params.append('course', courseFilter);
    if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
    
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

// 更新考勤表格
function updateAttendanceTable(records) {
    const tableBody = document.getElementById('attendanceTableBody');
    tableBody.innerHTML = '';
    
    if (records.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No records found</td>
            </tr>
        `;
        return;
    }
    
    records.forEach(record => {
        const row = document.createElement('tr');
        
        // 格式化日期和时间
        const date = new Date(record.date).toLocaleDateString();
        const checkIn = record.check_in ? new Date(`${record.date}T${record.check_in}`).toLocaleTimeString() : '-';
        const checkOut = record.check_out ? new Date(`${record.date}T${record.check_out}`).toLocaleTimeString() : '-';
        
        // 状态样式
        let statusClass = '';
        let statusText = getStatusText(record.status);
        
        switch(record.status) {
            case 'ontime':
                statusClass = 'text-success';
                break;
            case 'late':
                statusClass = 'text-warning';
                break;
            case 'earlyleave':
                statusClass = 'text-warning';
                break;
            case 'absent':
                statusClass = 'text-danger';
                break;
        }
        
        row.innerHTML = `
            <td>${date}</td>
            <td>${record.course_name}</td>
            <td>${checkIn}</td>
            <td>${checkOut}</td>
            <td class="${statusClass}">${statusText}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// 更新统计信息
function updateStatistics(statistics) {
    document.getElementById('totalRecords').textContent = statistics.total;
    document.getElementById('ontimeCount').textContent = statistics.ontime;
    document.getElementById('lateCount').textContent = statistics.late;
    document.getElementById('earlyleaveCount').textContent = statistics.earlyleave;
    document.getElementById('absentCount').textContent = statistics.absent;
    document.getElementById('attendanceRate').textContent = `${statistics.attendanceRate}%`;
    document.getElementById('ontimeRate').textContent = `${statistics.ontimeRate}%`;
}

// 导出CSV
function exportToCSV() {
    const table = document.getElementById('attendanceTable');
    const rows = table.querySelectorAll('tr');
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // 添加表头
    const headers = [];
    const headerCells = rows[0].querySelectorAll('th');
    headerCells.forEach(cell => {
        headers.push(cell.textContent);
    });
    csvContent += headers.join(',') + '\r\n';
    
    // 添加数据行
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.querySelectorAll('td');
        const rowData = [];
        
        cells.forEach(cell => {
            // 处理CSV中的引号和逗号
            let cellText = cell.textContent.replace(/"/g, '""');
            if (cellText.includes(',') || cellText.includes('"') || cellText.includes('\n')) {
                cellText = `"${cellText}"`;
            }
            rowData.push(cellText);
        });
        
        csvContent += rowData.join(',') + '\r\n';
    }
    
    // 创建下载链接
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 加载课程下拉列表
async function loadCourseOptions() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/courses', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to load courses');
        }
        
        const courseFilter = document.getElementById('courseFilter');
        courseFilter.innerHTML = '<option value="all">All Courses</option>';
        
        data.data.forEach(course => {
            const option = document.createElement('option');
            option.value = course.course_id;
            option.textContent = course.course_name;
            courseFilter.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading courses:', error);
        alert('Failed to load course options. Please refresh the page.');
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查用户是否登录
    const userData = localStorage.getItem('userData');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
        window.location.href = 'index.html';
        return;
    }
    
    // 设置默认日期范围（当前月份）
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    document.getElementById('startDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('endDate').value = lastDay.toISOString().split('T')[0];
    
    // 加载课程选项
    loadCourseOptions();
    
    // 加载考勤历史
    loadAttendanceHistory();
    
    // 添加事件监听器
    document.getElementById('filterBtn').addEventListener('click', loadAttendanceHistory);
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
});
```

## 步骤13: 完整部署指南

以下是完整的部署步骤，适合技术能力有限的组员2参考：

### 1. 准备工作

1. 确保你有阿里云ECS服务器的访问权限
2. 确保你有服务器的SSH登录信息（IP地址、用户名、密码或密钥）
3. 准备好所有源代码文件

### 2. 连接到服务器

使用SSH客户端（如PuTTY、Terminal或Windows的SSH命令）连接到服务器：

```bash
ssh username@your_server_ip
```

### 3. 安装必要软件

```bash
# 更新系统
sudo yum update -y

# 安装Node.js
curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node -v  # 应显示v16.x.x
npm -v   # 应显示6.x.x或更高版本

# 安装MySQL
sudo yum install -y mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld

# 设置MySQL root密码
sudo mysql_secure_installation
# 按照提示操作，设置root密码并回答安全问题（通常全部回答"Y"）
```

### 4. 创建数据库和用户

```bash
# 登录MySQL
sudo mysql -u root -p
# 输入你设置的root密码

# 在MySQL中执行以下命令
CREATE DATABASE attendance_system;
CREATE USER 'attendance_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON attendance_system.* TO 'attendance_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. 创建项目目录并上传代码

```bash
# 创建项目目录
sudo mkdir -p /var/www/attendance-backend
sudo chown -R $USER:$USER /var/www/attendance-backend
cd /var/www/attendance-backend
```

现在，你需要将代码上传到服务器。有几种方法：

**方法1: 使用scp（从本地上传）**

在本地计算机上执行：

```bash
# 在本地计算机上执行，将代码上传到服务器
scp -r /path/to/local/attendance-backend/* username@your_server_ip:/var/www/attendance-backend/
```

**方法2: 使用Git**

如果代码在Git仓库中：

```bash
# 在服务器上执行
cd /var/www/attendance-backend
git clone your_git_repository_url .
```

**方法3: 直接在服务器上创建文件**

使用文本编辑器（如nano或vim）在服务器上创建文件：

```bash
# 例如，创建app.js
nano app.js
# 粘贴代码，然后按Ctrl+X，然后Y保存
```

### 6. 创建数据库结构和示例数据

创建数据库脚本文件：

```bash
# 创建db-schema.sql文件
nano db-schema.sql
# 粘贴数据库结构代码，保存

# 创建sample-data.sql文件
nano sample-data.sql
# 粘贴示例数据代码，保存
```

执行数据库脚本：

```bash
# 导入数据库结构
mysql -u attendance_user -p attendance_system < db-schema.sql
# 输入密码

# 导入示例数据
mysql -u attendance_user -p attendance_system < sample-data.sql
# 输入密码
```

### 7. 配置环境变量

```bash
# 创建.env文件
nano .env
```

添加以下内容（替换为你的实际值）：

```
DB_HOST=localhost
DB_USER=attendance_user
DB_PASSWORD=your_secure_password
DB_NAME=attendance_system
JWT_SECRET=your_random_secret_string
PORT=3000
```

保存并关闭文件。

### 8. 安装依赖并启动应用

```bash
# 安装依赖
npm install

# 安装PM2进程管理器
sudo npm install -g pm2

# 启动应用
pm2 start app.js --name "attendance-backend"

# 设置PM2开机自启
pm2 save
pm2 startup
# 执行显示的命令（如果有）

# 查看应用状态
pm2 status
```

### 9. 配置防火墙

```bash
# 开放3000端口
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### 10. 配置Nginx反向代理（可选但推荐）

```bash
# 安装Nginx
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 创建Nginx配置文件
sudo nano /etc/nginx/conf.d/attendance.conf
```

添加以下内容：

```
server {
    listen 80;
    server_name your_server_ip_or_domain;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

保存并关闭文件。

```bash
# 测试Nginx配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx

# 开放HTTP端口
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload
```

### 11. 部署前端文件

```bash
# 创建前端目录（如果不存在）
sudo mkdir -p /var/www/html
sudo chown -R $USER:$USER /var/www/html

# 上传前端文件到/var/www/html目录
# 可以使用与后端代码相同的方法
```

### 12. 测试系统

1. 在浏览器中访问 `http://your_server_ip`
2. 尝试登录功能（任意学生ID + 8位数字密码）
3. 测试签到/签退功能
4. 测试历史记录查询功能

## 故障排除指南

如果遇到问题，可以按照以下步骤排查：

### 1. 检查后端服务是否运行

```bash
pm2 status
```

如果状态不是"online"，查看日志：

```bash
pm2 logs attendance-backend
```

### 2. 检查数据库连接

```bash
# 测试数据库连接
mysql -u attendance_user -p -e "SHOW DATABASES;"
# 输入密码
```

### 3. 检查API是否可访问

```bash
# 安装curl（如果没有）
sudo yum install -y curl

# 测试API
curl http://localhost:3000/api/courses/current
```

应该返回未认证错误（因为没有提供token）。

### 4. 检查Nginx配置

```bash
sudo nginx -t
sudo systemctl status nginx
```

### 5. 检查防火墙设置

```bash
sudo firewall-cmd --list-all
```

### 6. 检查日志

```bash
# 查看Node.js应用日志
pm2 logs attendance-backend

# 查看Nginx访问日志
sudo tail -f /var/log/nginx/access.log

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log
```

## 总结

通过以上步骤，你应该已经成功部署了学生考勤系统的后端部分。这个实现包括：

1. 用户认证API
2. 考勤记录API
3. 课程信息API
4. 与前端的集成

这个实现是一个最小可行产品(MVP)，满足了基本的功能需求。后续可以根据需要进行功能扩展和性能优化。

祝你部署顺利！如有任何问题，可以查看日志文件进行排查。
