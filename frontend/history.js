// history.js
document.addEventListener('DOMContentLoaded', function() {
    // 获取用户信息
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('welcomeMessage').textContent = `Welcome, ${userData.studentId}`;
    
    // 设置默认日期范围（过去30天）
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    document.getElementById('startDate').valueAsDate = thirtyDaysAgo;
    document.getElementById('endDate').valueAsDate = today;
    
    // 加载课程选项
    loadCourseOptions();
    
    // 加载考勤历史
    loadAttendanceHistory();
    
    // 添加事件监听器
    document.getElementById('applyFilters').addEventListener('click', loadAttendanceHistory);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
});

function loadCourseOptions() {
    const courseFilter = document.getElementById('courseFilter');
    const userData = JSON.parse(localStorage.getItem('userData'));
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    
    // 获取用户的所有考勤记录中的课程
    const userAttendance = attendance.filter(record => record.studentId === userData.studentId);
    const courses = new Set();
    
    // 添加用户当前课程
    if (userData.class) {
        const courseInfo = courseSchedule.courses.find(
            course => course.courseId.toLowerCase() === userData.class.toLowerCase()
        );
        if (courseInfo) {
            courses.add(courseInfo.courseId);
        }
    }
    
    // 添加历史记录中的课程
    userAttendance.forEach(record => {
        if (record.courseId) {
            courses.add(record.courseId);
        }
    });
    
    // 清除现有选项（保留"All Courses"选项）
    while (courseFilter.options.length > 1) {
        courseFilter.remove(1);
    }
    
    // 添加课程选项
    courses.forEach(courseId => {
        const courseInfo = courseSchedule.courses.find(
            course => course.courseId.toLowerCase() === courseId.toLowerCase()
        );
        const option = document.createElement('option');
        option.value = courseId;
        option.textContent = courseInfo ? `${courseInfo.courseName} (${courseId})` : courseId;
        courseFilter.appendChild(option);
    });
}

function loadAttendanceHistory() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const attendance = JSON.parse(localStorage.getItem('attendance')) || [];
    
    // 获取过滤条件
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    endDate.setHours(23, 59, 59); // 设置为当天的最后一秒
    
    const courseFilter = document.getElementById('courseFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    // 过滤用户的考勤记录
    const filteredAttendance = attendance.filter(record => {
        const recordDate = new Date(record.date);
        const matchesStudent = record.studentId === userData.studentId;
        const matchesDateRange = recordDate >= startDate && recordDate <= endDate;
        const matchesCourse = courseFilter === 'all' || record.courseId === courseFilter;
        const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
        
        return matchesStudent && matchesDateRange && matchesCourse && matchesStatus;
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // 按日期倒序排列
    
    // 更新历史记录表格
    const tableBody = document.getElementById('attendanceHistory');
    tableBody.innerHTML = '';
    
    if (filteredAttendance.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5">No attendance records found for the selected criteria</td>`;
        tableBody.appendChild(row);
    } else {
        filteredAttendance.forEach(record => {
            const row = document.createElement('tr');
            
            // 格式化状态显示
            let statusDisplay = '';
            let statusClass = '';
            switch(record.status) {
                case 'ontime':
                    statusDisplay = 'On Time';
                    statusClass = 'status-ontime';
                    break;
                case 'late':
                    statusDisplay = 'Late';
                    statusClass = 'status-late';
                    break;
                case 'earlyleave':
                    statusDisplay = 'Early Leave';
                    statusClass = 'status-earlyleave';
                    break;
                case 'absent':
                    statusDisplay = 'Absent';
                    statusClass = 'status-absent';
                    break;
                default:
                    statusDisplay = record.checkOut ? 'Completed' : 'In Progress';
            }
            
            // 获取课程名称
            let courseName = record.courseName || record.courseId || 'N/A';
            if (!record.courseName && record.courseId) {
                const courseInfo = courseSchedule.courses.find(
                    course => course.courseId.toLowerCase() === record.courseId.toLowerCase()
                );
                if (courseInfo) {
                    courseName = courseInfo.courseName;
                }
            }
            
            row.innerHTML = `
                <td>${record.date}</td>
                <td>${courseName}</td>
                <td>${record.checkIn || '--'}</td>
                <td>${record.checkOut || '--'}</td>
                <td class="${statusClass}">${statusDisplay}</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // 更新统计信息
    updateStatistics(filteredAttendance);
}

function updateStatistics(records) {
    const totalDays = records.length;
    const presentDays = records.filter(record => record.checkIn).length;
    const ontimeDays = records.filter(record => record.status === 'ontime').length;
    
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays * 100).toFixed(1) : 0;
    const ontimeRate = presentDays > 0 ? (ontimeDays / presentDays * 100).toFixed(1) : 0;
    
    document.getElementById('totalDays').textContent = totalDays;
    document.getElementById('presentDays').textContent = presentDays;
    document.getElementById('attendanceRate').textContent = `${attendanceRate}%`;
    document.getElementById('ontimeRate').textContent = `${ontimeRate}%`;
}

function exportToCSV() {
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
        const recordDate = new Date(record.date);
        const matchesStudent = record.studentId === userData.studentId;
        const matchesDateRange = recordDate >= startDate && recordDate <= endDate;
        const matchesCourse = courseFilter === 'all' || record.courseId === courseFilter;
        const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
        
        return matchesStudent && matchesDateRange && matchesCourse && matchesStatus;
    }).sort((a, b) => new Date(a.date) - new Date(b.date)); // 按日期升序排列
    
    if (filteredAttendance.length === 0) {
        alert('No attendance records to export');
        return;
    }
    
    // 创建CSV内容
    let csvContent = 'Date,Course,Check In,Check Out,Status\n';
    
    filteredAttendance.forEach(record => {
        // 获取课程名称
        let courseName = record.courseName || record.courseId || 'N/A';
        if (!record.courseName && record.courseId) {
            const courseInfo = courseSchedule.courses.find(
                course => course.courseId.toLowerCase() === record.courseId.toLowerCase()
            );
            if (courseInfo) {
                courseName = courseInfo.courseName;
            }
        }
        
        // 格式化状态
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
        
        // 添加行到CSV
        csvContent += `"${record.date}","${courseName}","${record.checkIn || ''}","${record.checkOut || ''}","${statusDisplay}"\n`;
    });
    
    // 创建下载链接
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_${userData.studentId}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    
    // 触发下载
    link.click();
    
    // 清理
    document.body.removeChild(link);
}

function logout() {
    localStorage.removeItem('userData');
    window.location.href = 'index.html';
}
