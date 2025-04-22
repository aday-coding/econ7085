document.addEventListener('DOMContentLoaded', function() {
    // 获取用户信息
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('welcomeMessage').textContent = `Welcome, ${userData.studentId}`;
    
    // 时钟更新
    updateClock();
    setInterval(updateClock, 1000);
    
    // 检查今天是否有课程
    const today = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = dayNames[today.getDay()];
    
    // 获取学生所属课程
    const studentClass = userData.class || "";
    
    // 查找学生所属课程的今日安排
    let todayCourse = null;
    let courseInfo = null;
    
    for (const course of courseSchedule.courses) {
        if (course.courseId.toLowerCase() === studentClass.toLowerCase()) {
            courseInfo = course;
            for (const schedule of course.schedule) {
                if (schedule.day === currentDay) {
                    todayCourse = schedule;
                    break;
                }
            }
            break;
        }
    }
    
    // 显示课程信息
    const courseInfoContainer = document.getElementById('courseInfoContainer');
    
    if (courseInfo) {
        courseInfoContainer.innerHTML = `
            <div class="course-info">
                <h3>${courseInfo.courseName}</h3>
                ${todayCourse ? `
                    <p><strong>Today's Schedule:</strong> ${todayCourse.startTime} - ${todayCourse.endTime}</p>
                    <p><strong>Location:</strong> ${todayCourse.location}</p>
                ` : `<p class="no-class">No class scheduled for today (${currentDay}).</p>`}
            </div>
        `;
    } else {
        courseInfoContainer.innerHTML = `
            <div class="course-info">
                <p class="no-class">No course information available for your class: ${studentClass}</p>
            </div>
        `;
    }
    
    // 设置按钮状态
    const checkInBtn = document.getElementById('checkInBtn');
    const checkOutBtn = document.getElementById('checkOutBtn');
    
    // 如果今天没有课，禁用打卡按钮
    if (!todayCourse) {
        checkInBtn.disabled = true;
        checkOutBtn.disabled = true;
        checkInBtn.title = "No class scheduled for today";
        checkOutBtn.title = "No class scheduled for today";
    }
    
    // 检查是否已经打卡
    checkAttendanceStatus();
    
    // 添加事件监听器
    checkInBtn.addEventListener('click', checkIn);
    checkOutBtn.addEventListener('click', checkOut);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('historyLink').addEventListener('click', function() {
        window.location.href = 'history.html';
    });
    
    // 显示最近的考勤记录
    displayRecentAttendance();
});

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString();
    
    document.getElementById('currentTime').textContent = timeString;
    document.getElementById('currentDate').textContent = dateString;
}

function checkAttendanceStatus() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const today = new Date().toLocaleDateString();
    
    // 获取今天的考勤记录
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    const todayRecord = attendance.find(record => 
        record.date === today && record.studentId === userData.studentId
    );
    
    const checkInBtn = document.getElementById('checkInBtn');
    const checkOutBtn = document.getElementById('checkOutBtn');
    
    if (todayRecord) {
        // 如果已经有今天的记录
        document.getElementById('checkInStatus').textContent = `Check-in time: ${todayRecord.checkIn}`;
        checkInBtn.disabled = true;
        
        if (todayRecord.checkOut) {
            // 如果已经签退
            document.getElementById('checkOutStatus').textContent = `Check-out time: ${todayRecord.checkOut}`;
            checkOutBtn.disabled = true;
            document.getElementById('attendanceStatus').textContent = `Status: Completed`;
        } else {
            // 如果还没签退
            document.getElementById('checkOutStatus').textContent = `Check-out time: --`;
            checkOutBtn.disabled = false;
            document.getElementById('attendanceStatus').textContent = `Status: ${todayRecord.status === 'ontime' ? 'On Time' : 'Late'}`;
        }
    } else {
        // 如果没有今天的记录
        document.getElementById('checkInStatus').textContent = `Check-in time: --`;
        document.getElementById('checkOutStatus').textContent = `Check-out time: --`;
        document.getElementById('attendanceStatus').textContent = `Status: Not checked in`;
        
        // 检查是否有课程，如果没有则禁用按钮
        const today = new Date();
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const currentDay = dayNames[today.getDay()];
        const studentClass = userData.class || "";
        
        let hasCourseToday = false;
        for (const course of courseSchedule.courses) {
            if (course.courseId.toLowerCase() === studentClass.toLowerCase()) {
                for (const schedule of course.schedule) {
                    if (schedule.day === currentDay) {
                        hasCourseToday = true;
                        break;
                    }
                }
                break;
            }
        }
        
        if (!hasCourseToday) {
            checkInBtn.disabled = true;
            checkOutBtn.disabled = true;
        } else {
            checkInBtn.disabled = false;
            checkOutBtn.disabled = true;
        }
    }
}

function checkIn() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const now = new Date();
    const checkInTime = now.toLocaleTimeString();
    const date = now.toLocaleDateString();
    
    // 获取学生所属课程
    const studentClass = userData.class || "";
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = dayNames[now.getDay()];
    
    // 查找今日课程安排
    let todayCourse = null;
    let courseName = "";
    
    for (const course of courseSchedule.courses) {
        if (course.courseId.toLowerCase() === studentClass.toLowerCase()) {
            courseName = course.courseName;
            for (const schedule of course.schedule) {
                if (schedule.day === currentDay) {
                    todayCourse = schedule;
                    break;
                }
            }
            break;
        }
    }
    
    // 如果今天没有课，不允许打卡
    if (!todayCourse) {
        alert("No class scheduled for today. Check-in is not available.");
        return;
    }
    
    // 计算是否迟到
    const classStartTime = new Date(`${date} ${todayCourse.startTime}`);
    const lateThreshold = courseSchedule.attendanceRules.lateThresholdMinutes;
    const isLate = now > new Date(classStartTime.getTime() + lateThreshold * 60000);
    const status = isLate ? "late" : "ontime";
    
    // 存储打卡记录
    let attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    
    // 检查是否已经有今天的记录
    const todayRecord = attendance.find(record => 
        record.date === date && record.studentId === userData.studentId
    );
    
    if (todayRecord) {
        // 更新现有记录
        todayRecord.checkIn = checkInTime;
        todayRecord.status = status;
    } else {
        // 创建新记录
        attendance.push({
            studentId: userData.studentId,
            name: userData.name,
            date: date,
            checkIn: checkInTime,
            checkOut: '',
            status: status,
            courseId: studentClass,
            courseName: courseName
        });
    }
    
    localStorage.setItem('attendance', JSON.stringify(attendance));
    
    // 更新界面
    document.getElementById('checkInStatus').textContent = `Check-in time: ${checkInTime}`;
    document.getElementById('checkInBtn').disabled = true;
    document.getElementById('checkOutBtn').disabled = false;
    document.getElementById('attendanceStatus').textContent = `Status: ${status === "ontime" ? "On Time" : "Late"}`;
    
    // 刷新状态和最近记录
    checkAttendanceStatus();
    displayRecentAttendance();
}

function checkOut() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const now = new Date();
    const checkOutTime = now.toLocaleTimeString();
    const date = now.toLocaleDateString();
    
    // 获取学生所属课程
    const studentClass = userData.class || "";
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = dayNames[now.getDay()];
    
    // 查找今日课程安排
    let todayCourse = null;
    for (const course of courseSchedule.courses) {
        if (course.courseId.toLowerCase() === studentClass.toLowerCase()) {
            for (const schedule of course.schedule) {
                if (schedule.day === currentDay) {
                    todayCourse = schedule;
                    break;
                }
            }
            break;
        }
    }
    
    // 如果今天没有课，不允许签退
    if (!todayCourse) {
        alert("No class scheduled for today. Check-out is not available.");
        return;
    }
    
    // 检查是否早退
    const classEndTime = new Date(`${date} ${todayCourse.endTime}`);
    const earlyLeaveThreshold = courseSchedule.attendanceRules.earlyLeaveThresholdMinutes;
    const isEarlyLeave = now < new Date(classEndTime.getTime() - earlyLeaveThreshold * 60000);
    
    // 如果早退，提示用户
    if (isEarlyLeave) {
        const confirmEarlyLeave = confirm("You are leaving early. This will be recorded. Continue?");
        if (!confirmEarlyLeave) {
            return;
        }
    }
    
    // 存储签退记录
    let attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    
    // 查找今天的记录
    const todayRecord = attendance.find(record => 
        record.date === date && record.studentId === userData.studentId
    );
    
    if (todayRecord) {
        // 更新签退时间
        todayRecord.checkOut = checkOutTime;
        
        // 如果早退，更新状态
        if (isEarlyLeave && todayRecord.status === 'ontime') {
            todayRecord.status = 'earlyleave';
        }
        
        localStorage.setItem('attendance', JSON.stringify(attendance));
        
        // 更新界面
        document.getElementById('checkOutStatus').textContent = `Check-out time: ${checkOutTime}`;
        document.getElementById('checkOutBtn').disabled = true;
        document.getElementById('attendanceStatus').textContent = `Status: Completed`;
    } else {
        alert("You need to check in first!");
    }
    
    // 刷新状态和最近记录
    checkAttendanceStatus();
    displayRecentAttendance();
}

function displayRecentAttendance() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    
    // 获取当前用户的考勤记录并按日期排序（最新的在前）
    const userAttendance = attendance
        .filter(record => record.studentId === userData.studentId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 获取最近5条记录
    const recentAttendance = userAttendance.slice(0, 5);
    
    const tableBody = document.getElementById('recentAttendance');
    tableBody.innerHTML = '';
    
    if (recentAttendance.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5">No attendance records found</td>`;
        tableBody.appendChild(row);
    } else {
        recentAttendance.forEach(record => {
            const row = document.createElement('tr');
            
            // 格式化状态显示
            let statusDisplay = '';
            switch(record.status) {
                case 'ontime':
                    statusDisplay = 'On Time';
                    break;
                case 'late':
                    statusDisplay = 'Late';
                    break;
                case 'earlyleave':
                    statusDisplay = 'Early Leave';
                    break;
                case 'absent':
                    statusDisplay = 'Absent';
                    break;
                default:
                    statusDisplay = record.checkOut ? 'Completed' : 'In Progress';
            }
            
            row.innerHTML = `
                <td>${record.date}</td>
                <td>${record.courseName || record.courseId || 'N/A'}</td>
                <td>${record.checkIn || '--'}</td>
                <td>${record.checkOut || '--'}</td>
                <td>${statusDisplay}</td>
            `;
            tableBody.appendChild(row);
        });
    }
}

function logout() {
    localStorage.removeItem('userData');
    window.location.href = 'index.html';
}
