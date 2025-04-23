# 学生考勤系统后端部署指南

## 操作流程概述

亲爱的组员2，你已经成功连接到阿里云ECS实例，接下来请按照以下步骤完成后端系统的部署。这份指南将帮助你在服务器上搭建考勤系统的后端部分。

## 步骤1: 安装必要软件

首先，我们需要安装Node.js和MySQL：

```bash
# 更新系统
sudo yum update -y

# 安装Node.js
curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs

# 验证Node.js安装
node -v
npm -v

# 安装MySQL
sudo yum install -y mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld

# 设置MySQL密码
sudo mysql_secure_installation
# 按照提示设置root密码，其他安全问题都选"Y"
```

## 步骤2: 创建数据库

登录MySQL并创建数据库和用户：

```bash
# 登录MySQL
sudo mysql -u root -p
# 输入你刚才设置的密码

# 在MySQL中执行以下命令
CREATE DATABASE attendance_system;
CREATE USER 'attendance_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON attendance_system.* TO 'attendance_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 步骤3: 创建项目目录

```bash
# 创建项目目录
sudo mkdir -p /var/www/attendance-backend
sudo chown -R $USER:$USER /var/www/attendance-backend
cd /var/www/attendance-backend
```

## 步骤4: 创建后端文件

现在，你需要创建几个关键文件。使用nano编辑器来创建这些文件：

### 创建环境变量文件

```bash
nano .env
```

粘贴以下内容（记得修改密码）：

```
DB_HOST=localhost
DB_USER=attendance_user
DB_PASSWORD=your_password
DB_NAME=attendance_system
JWT_SECRET=your_random_secret_string
PORT=3000
```

按`Ctrl+X`，然后按`Y`保存文件。

### 创建数据库结构文件

```bash
nano db-schema.sql
```

粘贴我们之前提供的数据库结构代码。保存文件。

### 创建示例数据文件

```bash
nano sample-data.sql
```

粘贴我们之前提供的示例数据代码。保存文件。

### 创建package.json文件

```bash
nano package.json
```

粘贴我们之前提供的package.json内容。保存文件。

### 创建主应用文件

```bash
nano app.js
```

粘贴我们之前提供的app.js代码。保存文件。

### 创建配置目录和文件

```bash
mkdir config
nano config/db.js
```

粘贴我们之前提供的db.js代码。保存文件。

### 创建中间件目录和文件

```bash
mkdir middleware
nano middleware/auth.js
```

粘贴我们之前提供的auth.js中间件代码。保存文件。

### 创建路由目录和文件

```bash
mkdir routes
nano routes/auth.js
```

粘贴我们之前提供的auth.js路由代码。保存文件。

```bash
nano routes/attendance.js
```

粘贴我们之前提供的attendance.js路由代码。保存文件。

```bash
nano routes/courses.js
```

粘贴我们之前提供的courses.js路由代码。保存文件。

## 步骤5: 导入数据库结构和示例数据

```bash
# 导入数据库结构
mysql -u attendance_user -p attendance_system < db-schema.sql
# 输入密码

# 导入示例数据
mysql -u attendance_user -p attendance_system < sample-data.sql
# 输入密码
```

## 步骤6: 安装依赖并启动应用

```bash
# 安装依赖
npm install

# 安装PM2进程管理器
sudo npm install -g pm2

# 启动应用
pm2 start app.js --name "attendance-backend"

# 设置PM2开机自启
pm2 save
pm2 startup
# 如果显示一个命令，请执行它

# 查看应用状态
pm2 status
```

## 步骤7: 配置防火墙

```bash
# 开放3000端口
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

## 步骤8: 配置Nginx反向代理（可选）

```bash
# 安装Nginx
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 创建Nginx配置文件
sudo nano /etc/nginx/conf.d/attendance.conf
```

粘贴以下内容（替换IP地址）：

```
server {
    listen 80;
    server_name your_server_ip;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

保存文件。

```bash
# 测试Nginx配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx

# 开放HTTP端口
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload
```

## 步骤9: 部署前端文件

```bash
# 创建前端目录
sudo mkdir -p /var/www/html
sudo chown -R $USER:$USER /var/www/html
cd /var/www/html
```

现在，你需要将前端文件上传到这个目录。你可以使用FTP客户端或者直接在服务器上创建文件。

## 步骤10: 测试系统

1. 在浏览器中访问 `http://your_server_ip`
2. 使用任意学生ID和8位数字密码尝试登录
3. 测试签到/签退功能
4. 测试历史记录查询功能

## 常见问题解决

如果遇到问题，可以查看以下日志：

```bash
# 查看应用日志
pm2 logs attendance-backend

# 查看Nginx访问日志
sudo tail -f /var/log/nginx/access.log

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log
```

## 重要提示

1. 请确保所有密码都是安全的，不要使用示例中的密码
2. 记得备份你的数据库
3. 如果修改了代码，记得重启应用：`pm2 restart attendance-backend`

恭喜你！现在你已经成功部署了学生考勤系统的后端部分。如果有任何问题，可以查看日志文件或者联系团队其他成员获取帮助。
