// history.js
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = '/index.html';
        return;
    }
    
    // Update welcome message
    document.getElementById('welcomeMessage').textContent = `Welcome, ${currentUser.name || currentUser.student_id}`;
    
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    document.getElementById('endDate').valueAsDate = today;
    document.getElementById('startDate').valueAsDate = thirtyDaysAgo;
    
    // Load attendance history with default filters
    loadAttendanceHistory();
    
    // Event listeners
    document.getElementById('applyFilters').addEventListener('click', loadAttendanceHistory);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
});

function loadAttendanceHistory() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    const statusFilter = document.getElementById('statusFilter').value;
    
    // Adjust end date to include the entire day
    endDate.setHours(23, 59, 59, 999);
    
    // Get attendance records
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || {};
    const userRecords = attendanceRecords[currentUser.student_id] || {};
    
    // Filter records based on date range
    const filteredDates = Object.keys(userRecords).filter(dateStr => {
        const recordDate = new Date(dateStr);
        return recordDate >= startDate && recordDate <= endDate;
    });
    
    // Sort dates in reverse chronological order
    filteredDates.sort((a, b) => new Date(b) - new Date(a));
    
    const historyContainer = document.getElementById('attendanceHistory');
    
    if (filteredDates.length === 0) {
        historyContainer.innerHTML = '<p>No attendance records found for the selected period.</p>';
        updateStatistics([], statusFilter);
        return;
    }
    
    // Create filtered records array for statistics
    const filteredRecords = filteredDates.map(date => {
        return {
            date,
            ...userRecords[date]
        };
    });
    
    // Apply status filter
    const statusFilteredRecords = filteredRecords.filter(record => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'completed') return record.checkIn && record.checkOut;
        if (statusFilter === 'checkedIn') return record.checkIn && !record.checkOut;
        if (statusFilter === 'absent') return !record.checkIn;
        return true;
    });
    
    // Create HTML table
    let html = `
        <table class="attendance-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Duration</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    statusFilteredRecords.forEach(record => {
        const status = record.checkOut ? 'Completed' : (record.checkIn ? 'Checked In' : 'Absent');
        
        // Calculate duration if both check-in and check-out exist
        let duration = '--:--';
        if (record.checkIn && record.checkOut) {
            const checkInTime = convertTimeStringToDate(record.date, record.checkIn);
            const checkOutTime = convertTimeStringToDate(record.date, record.checkOut);
            
            if (checkInTime && checkOutTime) {
                const durationMs = checkOutTime - checkInTime;
                const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
                const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                duration = `${durationHours}h ${durationMinutes}m`;
            }
        }
        
        html += `
            <tr>
                <td>${record.date}</td>
                <td>${record.checkIn || '--:--'}</td>
                <td>${record.checkOut || '--:--'}</td>
                <td>${duration}</td>
                <td>${status}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    historyContainer.innerHTML = html;
    
    // Update statistics
    updateStatistics(filteredRecords, statusFilter);
}

function convertTimeStringToDate(dateStr, timeStr) {
    try {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        const date = new Date(dateStr);
        date.setHours(hours, minutes, seconds);
        return date;
    } catch (e) {
        console.error('Error parsing time:', e);
        return null;
    }
}

function updateStatistics(records, statusFilter) {
    // Calculate total days in the selected period
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate present days (days with check-in)
    const presentDays = records.filter(record => record.checkIn).length;
    
    // Calculate attendance rate
    const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : '0.0';
    
    // Update UI
    document.getElementById('totalDays').textContent = totalDays;
    document.getElementById('presentDays').textContent = presentDays;
    document.getElementById('attendanceRate').textContent = `${attendanceRate}%`;
}

function exportToCSV() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    // Get attendance records
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || {};
    const userRecords = attendanceRecords[currentUser.student_id] || {};
    
    // Create CSV content
    let csvContent = 'Date,Check In,Check Out,Duration,Status\n';
    
    // Filter and sort dates
    const filteredDates = Object.keys(userRecords)
        .filter(dateStr => {
            const recordDate = new Date(dateStr);
            return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
        })
        .sort((a, b) => new Date(a) - new Date(b));
    
    filteredDates.forEach(date => {
        const record = userRecords[date];
        const status = record.checkOut ? 'Completed' : (record.checkIn ? 'Checked In' : 'Absent');
        
        // Calculate duration
        let duration = '';
        if (record.checkIn && record.checkOut) {
            const checkInTime = convertTimeStringToDate(date, record.checkIn);
            const checkOutTime = convertTimeStringToDate(date, record.checkOut);
            
            if (checkInTime && checkOutTime) {
                const durationMs = checkOutTime - checkInTime;
                const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
                const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                duration = `${durationHours}h ${durationMinutes}m`;
            }
        }
        
        csvContent += `${date},${record.checkIn || ''},${record.checkOut || ''},${duration},${status}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_${currentUser.student_id}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    
    // Trigger download and remove link
    link.click();
    document.body.removeChild(link);
}

function handleLogout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '/index.html';
}
