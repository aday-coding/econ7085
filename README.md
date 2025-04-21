# ECON7085 Cloud Computing - Attendance System Project
# ECON7085 云计算考勤系统

## 项目概述
本项目是为ECON7085课程开发的云端考勤系统，基于阿里云服务实现。系统允许用户（学生）使用桌面或移动设备进行签到和签退，并提供管理功能。

## 系统架构
- 前端：响应式Web界面，支持桌面和移动设备
- 后端：基于阿里云ECS的服务器应用
- 数据存储：阿里云RDS MySQL
- 通知系统：阿里云消息服务MNS和短信服务SMS
- 数据集成：与虚拟学生/员工数据库集成

## 团队分工
1. 组员1：用户签到签退界面 ✅ 已完成
2. 组员2：云端数据存储 🔄 进行中
3. 组员3：管理员报告系统 🔄 进行中
4. 组员4：通知系统 🔄 进行中
5. 组员5：数据库集成 ✅ 已完成

## 快速开始
1. 克隆仓库：`git clone https://github.com/aday-coding/econ7085.git`
2. 安装依赖：`cd econ7085/frontend && npm install`
3. 运行前端：`npm start`
4. 访问：`http://localhost:3000`

## 文档导航
- [系统架构文档](./docs/architecture.md)
- [API接口规范](./docs/api-specs.md)
- [数据模型文档](./docs/data-models.md)
- [部署指南](./docs/deployment-guide.md)

## 阿里云资源
- ECS实例：用于部署Web应用
- RDS MySQL：存储考勤数据
- OSS：数据备份和文件存储
- MNS：消息处理
- SMS：发送通知
- DTS：数据传输服务
