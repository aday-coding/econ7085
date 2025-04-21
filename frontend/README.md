# 前端模块 - 学生考勤系统

## 已完成功能
- 用户登录/注册界面
- 学生签到/签退功能
- 考勤历史查询
- 基于OSS的用户数据集成

## 文件结构
- `index.html` - 登录页面
- `register.html` - 注册页面
- `attendance.html` - 考勤签到/签退页面
- `history.html` - 考勤历史查询页面
- `login.js` - 登录功能逻辑
- `register.js` - 注册功能逻辑
- `attendance.js` - 考勤功能逻辑
- `history.js` - 历史查询逻辑
- `styles.css` - 全局样式表

## 当前实现
前端目前使用本地存储(localStorage)模拟数据持久化，登录验证通过读取OSS中的用户数据文件实现。需要后端开发者实现真正的数据持久化和API接口。

## 集成点
- 登录验证: `login.js` 中的 `validateLogin` 函数
- 考勤记录存储: `attendance.js` 中的 `handleCheckIn` 和 `handleCheckOut` 函数
- 历史记录查询: `history.js` 中的 `loadAttendanceHistory` 函数

## 后续交接
参考交接文档

