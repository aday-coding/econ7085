# 前端模块 - 用户签到签退界面

## 功能概述
- 用户登录界面
- 学生签到/签退功能
- 考勤历史查询
- 响应式设计，支持桌面和移动设备

## 文件结构
- `index.html` - 登录页面
- `register.html` - 注册页面
- `attendance.html` - 签到签退页面
- `history.html` - 考勤历史查询页面
- `login.js` - 登录功能脚本
- `register.js` - 注册功能脚本
- `attendance.js` - 签到签退功能脚本
- `history.js` - 历史查询功能脚本
- `styles.css` - 样式表

## 数据存储
当前实现使用本地存储（localStorage）临时保存考勤记录，等待组员2实现云端存储功能。

## 用户认证
- 系统使用OSS中的CSV文件进行用户验证
- 用户可以使用学号和电话号码后8位登录
- 也支持本地注册的新用户

## 部署说明
前端代码已部署在阿里云ECS实例上，使用Apache HTTP服务器提供服务。

