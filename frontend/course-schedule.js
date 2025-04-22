// 课程时间表配置
const courseSchedule = {
  "courses": [
    {
      "courseId": "econ7085",
      "courseName": "Cloud Computing for Business Analytics",
      "schedule": [
        {"day": "Saturday", "startTime": "09:30", "endTime": "12:20", "location": "Room 101"},
        // 临时添加周三用于测试
        {"day": "Wednesday", "startTime": "09:30", "endTime": "12:20", "location": "Room 101"}
      ]
    },
    {
      "courseId": "econ7035",
      "courseName": "Business Analytics",
      "schedule": [
        {"day": "Friday", "startTime": "18:30", "endTime": "21:20", "location": "Room 202"},
        // 临时添加周三用于测试
        {"day": "Wednesday", "startTime": "18:30", "endTime": "21:20", "location": "Room 202"}
      ]
    }
  ],
  "attendanceRules": {
    "lateThresholdMinutes": 10,
    "earlyLeaveThresholdMinutes": 10
  }
};
