// attendance.js
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = '/index.html';
        return;
    }
    
    // Update welcome message
    document.getElementById('welcomeMessage').textContent = `Welcome, ${currentUser.name || currentUser.student_id}`;
    
    // Initialize clock
    updateClock();
    setInterval(updateClock, 1000);
    
    // Load attendance status
    loadAttendanceStatus();
    
    // Load recent attendance history
    loadRecentAttendance();
    
    // Event listeners for buttons
    document.getElementById('checkInBtn').addEventListener('click', handleCheckIn);
    document.getElementById('checkOutBtn').addEventListener('click', handleCheckOut);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
});

function updateClock() {
    const now = new Date();
    
    // Update time
    const timeString = now.toLocaleTimeString();
    document.getElementById('clock').textContent = timeString;
    
    // Update date
    const dateString = now.toLocaleDateString();
    document.getElementById('date').textContent = `Date: ${dateString}`;
}

function loadAttendanceStatus() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const today = new Date().toLocaleDateString();
    
    // Get today's attendance from local storage
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || {};
    const userRecords = attendanceRecords[currentUser.student_id] || {};
    const todayRecord = userRecords[today];
    
    if (todayRecord) {
        if (todayRecord.checkIn) {
            document.getElementById('status').textContent = todayRecord.checkOut ? 'Completed' : 'Checked In';
            document.getElementById('checkInTime').textContent = todayRecord.checkIn;
            document.getElementById('checkInBtn').disabled = true;
        }
        
        if (todayRecord.checkOut) {
            document.getElementById('checkOutTime').textContent = todayRecord.checkOut;
            document.getElementById('checkOutBtn').disabled = true;
        }
    }
}

function handleCheckIn() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const today = new Date().toLocaleDateString();
    const now = new Date().toLocaleTimeString();
    
    // Get existing records or initialize new object
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || {};
    const userRecords = attendanceRecords[currentUser.student_id] || {};
    
    // Update today's record
    userRecords[today] = {
        ...userRecords[today],
        checkIn: now,
        date: today
    };
    
    // Save back to storage
    attendanceRecords[currentUser.student_id] = userRecords;
    localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
    
    // Update UI
    document.getElementById('status').textContent = 'Checked In';
    document.getElementById('checkInTime').textContent = now;
    document.getElementById('checkInBtn').disabled = true;
    
    // Reload recent attendance
    loadRecentAttendance();
}

function handleCheckOut() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const today = new Date().toLocaleDateString();
    const now = new Date().toLocaleTimeString();
    
    // Get existing records
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || {};
    const userRecords = attendanceRecords[currentUser.student_id] || {};
    
    // Check if checked in first
    if (!userRecords[today] || !userRecords[today].checkIn) {
        alert('You need to check in first!');
        return;
    }
    
    // Update today's record
    userRecords[today] = {
        ...userRecords[today],
        checkOut: now
    };
    
    // Save back to storage
    attendanceRecords[currentUser.student_id] = userRecords;
    localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
    
    // Update UI
    document.getElementById('status').textContent = 'Completed';
    document.getElementById('checkOutTime').textContent = now;
    document.getElementById('checkOutBtn').disabled = true;
    
    // Reload recent attendance
    loadRecentAttendance();
}

function loadRecentAttendance() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || {};
    const userRecords = attendanceRecords[currentUser.student_id] || {};
    
    const recentAttendanceEl = document.getElementById('recentAttendance');
    
    // Get dates and sort them in reverse chronological order
    const dates = Object.keys(userRecords).sort((a, b) => {
        return new Date(b) - new Date(a);
    });
    
    if (dates.length === 0) {
        recentAttendanceEl.innerHTML = '<p>No attendance records found.</p>';
        return;
    }
    
    // Create HTML for recent attendance
    let html = '<table class="attendance-table"><thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th></tr></thead><tbody>';
    
    // Show only the 5 most recent records
    const recentDates = dates.slice(0, 5);
    
    recentDates.forEach(date => {
        const record = userRecords[date];
        const status = record.checkOut ? 'Completed' : (record.checkIn ? 'Checked In' : 'Absent');
        
        html += `
            <tr>
                <td>${date}</td>
                <td>${record.checkIn || '--:--'}</td>
                <td>${record.checkOut || '--:--'}</td>
                <td>${status}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    recentAttendanceEl.innerHTML = html;
}

function handleLogout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '/index.html';
}
