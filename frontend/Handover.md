# 前端模块交接文档

## 项目概述
本文档旨在帮助接手前端模块的组员了解已完成的工作、系统架构以及后续开发需求。前端模块实现了学生考勤系统的基础功能，包括登录、签到/签退和历史记录查询。

## 已完成工作
### 1. 前端页面开发
- **登录页面 (index.html)**: 用户身份验证入口
- **考勤页面 (attendance.html)**: 学生签到/签退功能
- **历史记录页面 (history.html)**: 考勤历史查询和统计

### 2. 功能实现
- **用户认证**: 基于学生ID和手机尾号8位的验证机制
- **课程管理**: 基于预设的课程表自动判断当前课程
- **考勤记录**: 支持签到/签退，自动判断迟到/早退状态
- **历史查询**: 支持按日期、课程和状态筛选历史记录
- **临时数据存储**: 使用localStorage存储用户信息和考勤记录
- **响应式设计**: 适配不同屏幕尺寸的界面

### 3. 部署情况
- 已部署到阿里云ECS实例
- 使用Apache HTTP Server提供Web服务
- 前端文件位于 `/var/www/html/` 目录

## 系统架构

### 当前架构
前端 (HTML/CSS/JS) → 本地存储 (用户信息和考勤记录)

### 目标架构
前端 (HTML/CSS/JS) → 后端API → 数据库 → 通知服务

### 文件结构
- **index.html** - 登录页面
- **attendance.html** - 考勤签到/签退页面
- **history.html** - 考勤历史查询页面
- **login.js** - 登录功能逻辑
- **attendance.js** - 考勤功能逻辑
- **history.js** - 历史查询逻辑
- **course-schedule.js** - 课程时间表配置
- **styles.css** - 全局样式表

## 核心业务逻辑

### 1. 用户登录流程
1. 用户输入学生ID和密码（手机尾号8位）
2. 系统验证用户凭据
3. 登录成功后，将用户信息存储在localStorage中
4. 重定向到考勤页面

### 2. 考勤流程
1. 系统根据当前时间和预设的课程表判断是否有课程
2. 如有课程，显示课程信息和签到/签退按钮
3. 用户点击签到按钮，系统记录签到时间并判断是否迟到
4. 用户点击签退按钮，系统记录签退时间并判断是否早退
5. 考勤记录存储在localStorage中

### 3. 历史记录查询流程
1. 系统从localStorage中加载用户的考勤记录
2. 用户可以按日期范围、课程和状态筛选记录
3. 系统计算并显示考勤统计数据（出勤率、准时率等）
4. 用户可以导出筛选后的记录为CSV文件

## 集成点说明

### 1. 用户认证 (login.js)
```javascript
// 当前: 本地验证用户
function validateLogin(studentId, password, selectedClass) {
    // 验证密码是否为8位数字（模拟手机尾号验证）
    if (!/^\d{8}$/.test(password)) {
        return { success: false, message: 'Password must be 8 digits (last 8 digits of your phone number)' };
    }
    
    // 模拟成功登录
    return { 
        success: true, 
        data: { 
            studentId: studentId, 
            class: selectedClass 
        } 
    };
}

// 需要替换为: 调用后端API验证用户
async function validateLogin(studentId, password, selectedClass) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, password, class: selectedClass })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            return { success: false, message: errorData.message || 'Login failed' };
        }
        
        const userData = await response.json();
        return { success: true, data: userData };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}
```

### 2. 考勤记录 (attendance.js)
```javascript
// 当前: 使用localStorage存储考勤记录
function handleCheckIn() {
    // ...省略部分代码...
    
    // 创建考勤记录
    const attendanceRecord = {
        studentId: userData.studentId,
        courseId: currentCourse.courseId,
        courseName: currentCourse.courseName,
        date: currentDate,
        checkIn: currentTime,
        status: status
    };
    
    // 存储考勤记录
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    attendance.push(attendanceRecord);
    localStorage.setItem('attendance', JSON.stringify(attendance));
    
    // ...省略部分代码...
}

// 需要替换为: 调用后端API记录签到
async function handleCheckIn() {
    // ...省略部分代码...
    
    // 创建考勤记录
    const attendanceRecord = {
        studentId: userData.studentId,
        courseId: currentCourse.courseId,
        date: currentDate,
        checkIn: currentTime,
        status: status
    };
    
    try {
        const response = await fetch('/api/attendance/check-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attendanceRecord)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Check-in failed');
        }
        
        const result = await response.json();
        
        // 更新UI
        updateAttendanceStatus(result);
    } catch (error) {
        console.error('Check-in error:', error);
        showMessage('error', error.message || 'Failed to check in. Please try again.');
    }
}
```

### 3. 历史记录查询 (history.js)
```javascript
// 当前: 从localStorage读取历史记录
function loadAttendanceHistory() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    
    // 获取过滤条件
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    endDate.setHours(23, 59, 59);
    
    const courseFilter = document.getElementById('courseFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    // 过滤用户的考勤记录
    const filteredAttendance = attendance.filter(record => {
        // 过滤逻辑...
    });
    
    // 更新UI
    updateAttendanceTable(filteredAttendance);
    updateStatistics(filteredAttendance);
}

// 需要替换为: 从后端API获取历史记录
async function loadAttendanceHistory() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    // 获取过滤条件
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const courseFilter = document.getElementById('courseFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    try {
        const response = await fetch(`/api/attendance/history?studentId=${userData.studentId}&startDate=${startDate}&endDate=${endDate}&course=${courseFilter}&status=${statusFilter}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch attendance history');
        }
        
        const data = await response.json();
        
        // 更新UI
        updateAttendanceTable(data.records);
        updateStatistics(data.statistics);
    } catch (error) {
        console.error('Error loading attendance history:', error);
        showMessage('error', error.message || 'Error loading attendance records');
    }
}
```

## 课程时间表逻辑 (course-schedule.js)
系统使用预设的课程时间表来判断当前是否有课程。课程表定义在 `course-schedule.js` 文件中：

```javascript
const courseSchedule = {
    // 课程列表
    courses: [
        {
            courseId: "ECON7085",
            courseName: "Cloud Computing for Business Analytics",
            schedule: [
                { day: 2, startTime: "10:00", endTime: "13:00" }  // 周二 10:00-13:00
            ]
        },
        // 其他课程...
    ],
    
    // 获取当前课程的方法
    getCurrentCourse: function() {
        const now = new Date();
        const currentDay = now.getDay(); // 0-6, 0 is Sunday
        const currentTime = now.getHours() + ":" + (now.getMinutes() < 10 ? "0" : "") + now.getMinutes();
        
        // 查找当前时间应该上的课程
        for (const course of this.courses) {
            for (const schedule of course.schedule) {
                if (schedule.day === currentDay) {
                    if (this.isTimeInRange(currentTime, schedule.startTime, schedule.endTime)) {
                        return {
                            ...course,
                            startTime: schedule.startTime,
                            endTime: schedule.endTime
                        };
                    }
                }
            }
        }
        
        return null; // 当前没有课程
    },
    
    // 判断时间是否在范围内的辅助方法
    isTimeInRange: function(time, startTime, endTime) {
        return time >= startTime && time <= endTime;
    }
};
```

后端开发者需要实现相应的API来替代这个静态课程表，或者将课程表数据存储在数据库中。

## 后续开发需求

### 组员2 (后端开发)
#### 实现API接口:
- **用户认证API**
  - `/api/auth/login` (POST): 验证用户凭据
  - `/api/auth/logout` (POST): 用户登出
- **考勤记录API**
  - `/api/attendance/check-in` (POST): 记录签到
  - `/api/attendance/check-out` (PUT): 记录签退
  - `/api/attendance/current` (GET): 获取当前课程信息
- **历史查询API**
  - `/api/attendance/history` (GET): 获取历史记录
  - `/api/attendance/statistics` (GET): 获取考勤统计数据
- **课程API**
  - `/api/courses` (GET): 获取课程列表
  - `/api/courses/current` (GET): 获取当前课程

#### 数据库设计:
- **用户表**
  - `student_id` (主键): 学生ID
  - `name`: 学生姓名
  - `phone`: 手机号码
  - `password_hash`: 密码哈希
  - `class`: 班级
  - `created_at`: 创建时间
  - `updated_at`: 更新时间
- **考勤记录表**
  - `id` (主键): 记录ID
  - `student_id` (外键): 学生ID
  - `course_id` (外键): 课程ID
  - `date`: 日期
  - `check_in`: 签到时间
  - `check_out`: 签退时间
  - `status`: 状态 (ontime, late, earlyleave, absent)
  - `created_at`: 创建时间
  - `updated_at`: 更新时间
- **课程表**
  - `course_id` (主键): 课程ID
  - `course_name`: 课程名称
  - `instructor`: 教师
  - `created_at`: 创建时间
  - `updated_at`: 更新时间
- **课程时间表**
  - `id` (主键): 记录ID
  - `course_id` (外键): 课程ID
  - `day`: 星期几 (0-6)
  - `start_time`: 开始时间
  - `end_time`: 结束时间
  - `classroom`: 教室
  - `created_at`: 创建时间
  - `updated_at`: 更新时间

### 组员3 (管理员门户)
#### 管理员界面开发:
- **学生管理**
  - 查看学生列表
  - 添加/编辑/删除学生
  - 导入/导出学生数据
- **课程管理**
  - 查看课程列表
  - 添加/编辑/删除课程
  - 设置课程时间表
- **考勤管理**
  - 查看考勤记录
  - 修改考勤状态
  - 生成考勤报告
- **系统设置**
  - 设置考勤规则 (迟到/早退时间阈值)
  - 设置通知规则

### 组员4 (通知服务)
#### 通知系统开发:
- **缺勤提醒**
  - 学生缺勤后发送通知
  - 连续缺勤预警
- **考勤统计报告**
  - 定期发送考勤统计报告
  - 出勤率低预警
- **系统通知**
  - 课程变更通知
  - 系统维护通知

#### 通知渠道:
- **邮件通知**
- **短信通知** (可选)
- **系统内通知**

## 技术债务与注意事项

### 安全性改进:
- **密码管理**:
  - 当前使用手机尾号8位作为密码，需要实现更安全的密码机制
  - 实现密码哈希存储，避免明文存储
- **会话管理**:
  - 实现基于token的认证，替代localStorage存储用户信息
  - 添加会话超时机制
- **数据传输**:
  - 实现HTTPS支持，保护数据传输安全

### 性能优化:
- **数据加载**:
  - 实现分页加载历史记录
  - 添加数据缓存机制
- **API调用**:
  - 减少不必要的API调用
  - 实现请求合并和批处理

### 已知问题:
- **时间同步**:
  - 当前使用客户端时间判断课程和考勤状态，可能导致不准确
  - 需要改为使用服务器时间
- **课程判断**:
  - 当前使用静态课程表判断当前课程，需要改为动态获取
- **状态管理**:
  - 页面刷新后状态丢失，需要改进状态管理机制

## 部署与环境配置

### ECS实例信息
- **实例ID**: i-j6chh1f4sq2r5ow5q2co
- **公网IP**: 47.239.3.254

### 文件位置
- **网站根目录**: /var/www/html/
- **Apache配置**: /etc/httpd/conf/httpd.conf
- **日志文件**: /var/log/httpd/

### 部署新版本步骤
1. 连接到ECS实例
2. 导航到网站目录: `cd /var/www/html/`
3. 备份当前文件: `tar -czvf frontend_backup_$(date +%Y%m%d).tar.gz *.html *.js *.css`
4. 上传新文件 (使用SFTP或scp)
5. 检查文件权限: `chmod 644 *.html *.js *.css`
6. 重启Apache: `systemctl restart httpd`

## 测试指南

### 登录测试
- 使用任意学生ID和8位数字密码登录
- 验证登录成功后重定向到考勤页面

### 考勤测试
- 测试周三 9:30-12:20 、18:30-21:20的考勤功能
- 测试签到/签退按钮状态变化
- 测试迟到/早退状态判断

### 历史记录测试
- 测试不同筛选条件下的历史记录显示
- 测试考勤统计数据计算
- 测试CSV导出功能
