# 通知系统开发指南（组员4）

## 概述
本模块负责构建一个完整的通知系统，当学生出现缺勤或迟到等情况时，自动向相关人员（学生本人、班主任、家长等）发送通知。系统将利用阿里云消息服务MNS和短信服务SMS实现高效可靠的消息传递。

## 功能需求

### 1. 通知触发规则设置
- 基于考勤状态自动触发通知
- 支持自定义触发条件和规则
- 支持不同类型通知的差异化规则

### 2. 通知发送
- 支持多渠道通知（短信、邮件、应用内通知）
- 集成阿里云SMS服务发送短信
- 集成邮件发送功能

### 3. 通知管理
- 通知历史记录查询
- 通知状态跟踪（发送中、已发送、已读等）
- 通知模板管理

### 4. 用户界面
- 通知设置界面
- 通知历史查询界面
- 通知模板编辑界面

## 系统架构

### 整体架构
```
前端应用 → 通知触发器 → 消息队列(MNS) → 通知发送器 → 通知渠道(SMS/Email)
                                      ↓
                                 通知数据库
```

### 核心组件
1. **通知触发器**：监听考勤事件，根据规则触发通知
2. **消息队列**：使用阿里云MNS处理通知请求
3. **通知发送器**：从队列获取通知请求并发送
4. **通知数据库**：存储通知历史和设置

## 开发指南

### 1. 通知触发规则设计

#### 规则类型
- **时间基础规则**：如迟到超过15分钟触发通知
- **频率基础规则**：如一周内迟到3次触发通知
- **组合规则**：多条件组合触发

#### 规则存储结构
```json
{
  "ruleId": "rule001",
  "ruleName": "迟到通知规则",
  "triggerCondition": {
    "attendanceStatus": "late",
    "timeThreshold": 15,  // 迟到超过15分钟
    "courseId": "all"     // 适用于所有课程
  },
  "notificationConfig": {
    "channels": ["sms", "email"],
    "recipients": ["student", "teacher"],
    "templates": {
      "sms": "template001",
      "email": "template002"
    }
  },
  "isActive": true,
  "createdAt": "2025-04-22T10:00:00Z",
  "updatedAt": "2025-04-22T10:00:00Z"
}
```

### 2. 通知渠道集成

#### 短信通知（阿里云SMS）
- 配置阿里云SMS服务
- 创建短信签名和模板
- 实现短信发送接口

#### 邮件通知
- 配置SMTP服务
- 创建邮件模板
- 实现邮件发送接口

#### 应用内通知
- 设计通知数据结构
- 实现通知推送机制
- 开发通知中心UI

### 3. 消息队列实现

#### 阿里云MNS配置
- 创建消息队列
- 配置队列属性（消息保留时间、最大消息大小等）
- 设置死信队列处理失败消息

#### 消息生产者
- 实现消息发送接口
- 处理消息序列化
- 实现重试机制

#### 消息消费者
- 实现消息接收和处理
- 处理并发和负载均衡
- 实现错误处理和日志记录

### 4. 通知历史记录

#### 数据结构
```json
{
  "notificationId": "notif001",
  "ruleId": "rule001",
  "studentId": "student001",
  "courseId": "course001",
  "attendanceRecord": {
    "date": "2025-04-22",
    "status": "late",
    "checkInTime": "2025-04-22T10:15:00Z"
  },
  "channels": ["sms", "email"],
  "recipients": [
    {
      "type": "student",
      "contact": "+8613800138000",
      "status": "delivered",
      "deliveredAt": "2025-04-22T10:20:00Z"
    },
    {
      "type": "teacher",
      "contact": "teacher@example.com",
      "status": "delivered",
      "deliveredAt": "2025-04-22T10:20:05Z"
    }
  ],
  "content": "学生张三于2025年4月22日10:15签到，迟到15分钟。",
  "createdAt": "2025-04-22T10:16:00Z"
}
```

#### 查询功能
- 按学生ID查询
- 按日期范围查询
- 按通知状态查询

### 5. 通知模板管理

#### 模板类型
- 短信模板
- 邮件模板
- 应用内通知模板

#### 模板变量
- 学生信息（姓名、学号等）
- 课程信息（课程名称、教师等）
- 考勤信息（日期、状态、时间等）

#### 模板示例
```
尊敬的${teacherName}老师：
  
学生${studentName}(${studentId})在${date}的${courseName}课程中${statusText}。
签到时间：${checkInTime}
  
请知悉。
```

## 与前端的集成点

### 1. 考勤状态集成

#### 考勤状态监听
前端已经实现了考勤状态判断，通知系统需要监听这些状态变化并触发通知。

```javascript
// 集成逻辑（伪代码）
function handleAttendanceStatusChange(studentId, courseId, status, checkInTime) {
  // 1. 获取适用的通知规则
  const rules = getApplicableRules(status);
  
  // 2. 评估每条规则
  for (const rule of rules) {
    if (evaluateRule(rule, status, checkInTime)) {
      // 3. 触发通知
      triggerNotification(rule, studentId, courseId, status, checkInTime);
    }
  }
}

// 前端需要在考勤状态变化时调用此函数
// 例如在 attendance.js 中的 handleCheckIn 和 handleCheckOut 函数中添加调用
```

### 2. 通知设置界面集成

#### 设置界面
开发一个通知设置界面，允许管理员配置通知规则和模板。

```javascript
// 前端路由集成
// 在前端路由中添加通知设置页面
const routes = [
  // 现有路由...
  {
    path: '/admin/notifications/settings',
    component: NotificationSettings
  },
  {
    path: '/admin/notifications/history',
    component: NotificationHistory
  },
  {
    path: '/admin/notifications/templates',
    component: NotificationTemplates
  }
];
```

### 3. 通知历史查询集成

#### 查询接口
提供API接口供前端查询通知历史。

```javascript
// 前端查询逻辑（伪代码）
async function fetchNotificationHistory(filters) {
  const token = localStorage.getItem('token');
  
  try {
    // 构建查询参数
    const params = new URLSearchParams();
    if (filters.studentId) params.append('studentId', filters.studentId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status) params.append('status', filters.status);
    
    const response = await fetch(`/api/notifications/history?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch notification history');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching notification history:', error);
    throw error;
  }
}
```

## 通知流程设计

### 1. 实时通知流程

#### 流程步骤
1. 学生签到/签退，前端记录考勤状态
2. 考勤状态变更触发通知评估
3. 符合条件的通知被发送到消息队列
4. 通知发送器从队列获取消息并发送
5. 通知结果被记录到数据库

```
学生签到/签退 → 考勤状态判断 → 通知规则评估 → 消息入队 → 消息发送 → 结果记录
```

### 2. 定时通知流程

#### 流程步骤
1. 定时任务扫描考勤记录
2. 根据规则评估需要发送的通知
3. 批量将通知发送到消息队列
4. 通知发送器处理队列消息
5. 通知结果被记录到数据库

```
定时任务 → 考勤记录扫描 → 通知规则评估 → 批量消息入队 → 消息发送 → 结果记录
```

## 阿里云服务集成

### 1. 阿里云MNS配置

#### 队列设置
- 创建标准队列：`attendance-notification-queue`
- 消息保留时间：7天
- 消息可见性超时：120秒
- 最大消息大小：64KB

#### 死信队列
- 创建死信队列：`attendance-notification-dlq`
- 配置主队列的死信策略

### 2. 阿里云SMS配置

#### 短信签名
- 创建签名：`学生考勤系统`
- 签名用途：验证码/通知

#### 短信模板
- 创建模板：`考勤通知模板`
- 模板内容：`尊敬的${recipient}，学生${studentName}在${courseName}课程中${statusText}，请知悉。`
- 模板类型：通知短信

## 安全性考虑

### 1. 数据安全
- 加密存储敏感信息（手机号、邮箱等）
- 实现访问控制，只有授权用户可以查看通知历史
- 日志记录所有通知操作

### 2. 通知频率控制
- 实现通知频率限制，避免过多通知骚扰用户
- 设置每日通知上限
- 实现通知合并功能，减少重复通知

### 3. 隐私保护
- 遵循数据保护法规
- 获取用户同意后才发送通知
- 提供通知退订选项

## 性能优化

### 1. 消息处理优化
- 实现消息批处理
- 使用消息优先级
- 实现消息去重

### 2. 通知发送优化
- 实现并行发送
- 使用连接池
- 实现重试机制

### 3. 数据库优化
- 索引优化
- 查询优化
- 定期归档历史数据

## 测试策略

### 1. 单元测试
- 测试通知规则评估
- 测试消息序列化/反序列化
- 测试模板渲染

### 2. 集成测试
- 测试与MNS的集成
- 测试与SMS的集成
- 测试与前端的集成

### 3. 负载测试
- 测试高并发下的通知处理能力
- 测试大量通知的处理性能
- 测试系统恢复能力

## 部署指南

### 1. 环境配置
- 配置阿里云访问密钥
- 配置MNS和SMS服务
- 设置环境变量

### 2. 服务部署
- 部署通知服务
- 配置定时任务
- 设置监控和告警

## 运维考虑

### 1. 监控
- 监控通知发送成功率
- 监控消息队列长度
- 监控API响应时间

### 2. 告警
- 设置通知失败率阈值告警
- 设置队列堆积告警
- 设置API错误率告警

### 3. 日志
- 记录所有通知操作
- 记录错误和异常
- 实现日志轮转和归档

## 扩展功能建议

### 1. 智能通知
- 基于机器学习预测学生考勤行为
- 实现智能通知策略
- 个性化通知内容

### 2. 多语言支持
- 支持中英文通知
- 根据用户偏好选择语言
- 提供多语言模板

### 3. 互动通知
- 实现可回复的通知
- 添加确认回执功能
- 支持通知中的操作按钮

## 与其他模块的协作

### 1. 与考勤模块协作
- 监听考勤状态变更事件
- 获取考勤详细信息
- 提供通知反馈

### 2. 与用户模块协作
- 获取用户联系信息
- 同步用户偏好设置
- 更新用户通知状态

### 3. 与报表模块协作
- 提供通知统计数据
- 支持通知效果分析
- 集成通知数据到报表

## 参考资源

### 1. 阿里云文档
- [阿里云MNS文档](https://www.alibabacloud.com/help/product/27412.htm)
- [阿里云SMS文档](https://www.alibabacloud.com/help/product/44282.htm)

### 2. 开发库
- [阿里云SDK](https://github.com/aliyun/aliyun-openapi-nodejs-sdk)
- [Nodemailer](https://nodemailer.com/)（邮件发送）
- [Bull](https://github.com/OptimalBits/bull)（队列管理）
