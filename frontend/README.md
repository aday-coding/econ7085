# 前端模块 - 学生考勤系统

## 已完成功能
- 用户登录界面
- 学生签到/签退功能
- 考勤历史查询
- 基于本地存储的用户数据集成

## 文件结构
- **index.html** - 登录页面
- **attendance.html** - 考勤签到/签退页面
- **history.html** - 考勤历史查询页面
- **course-schedule.js** - 课程时间表配置
- **login.js** - 登录功能逻辑
- **attendance.js** - 考勤功能逻辑
- **history.js** - 历史查询逻辑
- **styles.css** - 全局样式表

## 当前实现
前端目前使用本地存储(localStorage)模拟数据持久化，登录验证通过学生ID和手机尾号8位作为密码实现。系统根据课程表自动判断当前是否有课程，并记录学生的签到/签退状态，包括是否迟到或早退。需要后端开发者实现真正的数据持久化和API接口。

## 核心功能说明

### 1. 课程时间表
- 在 `course-schedule.js` 中定义了课程时间表，包括课程ID、名称、上课时间等信息
- 系统根据当前时间自动判断是否有课程，并显示相应的课程信息
- 为测试目的，添加了周二的课程配置

### 2. 用户登录
- 使用学生ID和手机尾号8位作为密码进行登录验证
- 登录成功后将用户信息存储在localStorage中
- 登录失败时显示相应的错误信息

### 3. 考勤打卡
- 显示当前日期、时间和课程信息
- 根据课程开始时间判断是否迟到
- 根据课程结束时间判断是否早退
- 记录签到/签退时间和状态

### 4. 历史记录查询
- 显示学生的考勤历史记录
- 支持按日期范围、课程和状态筛选
- 提供考勤统计数据（出勤率、准时率等）
- 支持导出CSV功能

## 集成点

### 登录验证
在 `login.js` 中的 `validateLogin` 函数：
```javascript
function validateLogin(studentId, password, selectedClass) {
    // 验证密码是否为8位数字（模拟手机尾号验证）
    if (!/^\d{8}$/.test(password)) {
        return { success: false, message: 'Password must be 8 digits (last 8 digits of your phone number)' };
    }
    
    // 这里需要替换为真实的后端API调用
    // 例如: return fetch('/api/login', { method: 'POST', body: JSON.stringify({ studentId, password, class: selectedClass }) })
    //        .then(response => response.json());
    
    // 模拟成功登录
    return { 
        success: true, 
        data: { 
            studentId: studentId, 
            class: selectedClass 
        } 
    };
}
```

### 考勤记录存储
在 `attendance.js` 中的 `handleCheckIn` 和 `handleCheckOut` 函数：
```javascript
function handleCheckIn() {
    // ...
    
    // 这里需要替换为真实的后端API调用
    // 例如: return fetch('/api/attendance/checkin', { method: 'POST', body: JSON.stringify(attendanceRecord) })
    //        .then(response => response.json());
    
    // 模拟存储考勤记录
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    attendance.push(attendanceRecord);
    localStorage.setItem('attendance', JSON.stringify(attendance));
    
    // ...
}

function handleCheckOut() {
    // ...
    
    // 这里需要替换为真实的后端API调用
    // 例如: return fetch('/api/attendance/checkout', { method: 'PUT', body: JSON.stringify({ studentId, courseId, date, checkOut, status }) })
    //        .then(response => response.json());
    
    // 模拟更新考勤记录
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const index = attendance.findIndex(record => 
        record.studentId === userData.studentId && 
        record.date === currentDate && 
        record.courseId === currentCourse.courseId
    );
    
    if (index !== -1) {
        attendance[index].checkOut = currentTime;
        attendance[index].status = status;
        localStorage.setItem('attendance', JSON.stringify(attendance));
    }
    
    // ...
}
```

### 历史记录查询
在 `history.js` 中的 `loadAttendanceHistory` 函数：
```javascript
function loadAttendanceHistory() {
    // ...
    
    // 这里需要替换为真实的后端API调用
    // 例如: return fetch(`/api/attendance/history?studentId=${userData.studentId}&startDate=${startDate}&endDate=${endDate}&course=${courseFilter}&status=${statusFilter}`)
    //        .then(response => response.json())
    //        .then(data => { 
    //            // 使用API返回的数据更新UI
    //            updateAttendanceTable(data.records);
    //            updateStatistics(data.statistics);
    //        });
    
    // 模拟从localStorage获取考勤记录
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    
    // 过滤用户的考勤记录
    const filteredAttendance = attendance.filter(record => {
        // 过滤逻辑...
    });
    
    // 更新UI
    updateAttendanceTable(filteredAttendance);
    updateStatistics(filteredAttendance);
}
```

## 后续开发建议

1. **数据持久化**：
   - 实现后端数据库存储用户信息和考勤记录
   - 创建RESTful API接口替换当前的localStorage存储

2. **安全性增强**：
   - 实现真实的用户认证和授权机制
   - 添加API请求的token验证

3. **功能扩展**：
   - 添加管理员界面，用于管理课程和查看所有学生的考勤情况
   - 实现考勤报表导出功能
   - 添加考勤异常申诉功能

4. **性能优化**：
   - 实现分页加载考勤历史记录
   - 优化前端资源加载

## 注意事项
- 系统当前使用学生手机尾号8位作为密码，实际部署时应替换为更安全的认证方式
- 为测试目的，在课程表中添加了周二的课程，实际部署时应根据真实课程表调整
- 所有时间相关的逻辑都基于客户端时间，实际部署时应考虑使用服务器时间
