// Cloudflare Worker 单文件导航站应用
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// 密码配置
const PASSWORD_CONFIG = {
  defaultPassword: '123456',
  sessionExpiry: 24,
  maxAttempts: 5
}

// 存储会话
let sessions = new Map()
let passwordData = new Map()

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // 静态资源处理
  if (url.pathname === '/favicon.ico') {
    return new Response(null, { status: 404 })
  }
  
  // API 路由处理
  if (url.pathname.startsWith('/api/')) {
    return handleAPI(request)
  }
  
  // 登录页面路由
  if (url.pathname === '/login') {
    if (request.method === 'POST') {
      return handleLoginPost(request)
    }
    return renderLoginPage()
  }
  
  // 退出登录
  if (url.pathname === '/logout') {
    return handleLogout(request)
  }
  
  // 检查登录状态
  const session = await checkSession(request)
  if (!session) {
    return redirectToLogin()
  }
  
  // 主页面
  return new Response(renderHTML(session.username), {
    headers: { 
      'Content-Type': 'text/html; charset=utf-8',
      'Set-Cookie': `session=${session.sessionId}; Path=/; HttpOnly; Max-Age=${PASSWORD_CONFIG.sessionExpiry * 3600}`
    }
  })
}

// 处理登录POST请求
async function handleLoginPost(request) {
  try {
    const formData = await request.formData()
    const username = formData.get('username') || 'admin'
    const password = formData.get('password')
    
    // 初始化密码存储
    if (!passwordData.has('admin')) {
      passwordData.set('admin', PASSWORD_CONFIG.defaultPassword)
    }
    
    const storedPassword = passwordData.get(username)
    
    if (storedPassword && storedPassword === password) {
      // 生成会话ID
      const sessionId = generateSessionId()
      const session = {
        sessionId,
        username,
        expires: Date.now() + (PASSWORD_CONFIG.sessionExpiry * 3600 * 1000)
      }
      
      sessions.set(sessionId, session)
      
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/',
          'Set-Cookie': `session=${sessionId}; Path=/; HttpOnly; Max-Age=${PASSWORD_CONFIG.sessionExpiry * 3600}`
        }
      })
    } else {
      return renderLoginPage('用户名或密码错误')
    }
  } catch (error) {
    return renderLoginPage('登录请求格式错误')
  }
}

// 检查会话有效性
async function checkSession(request) {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) return null
  
  const cookies = new Map(cookieHeader.split(';').map(c => c.trim().split('=')))
  const sessionId = cookies.get('session')
  
  if (!sessionId || !sessions.has(sessionId)) return null
  
  const session = sessions.get(sessionId)
  if (Date.now() > session.expires) {
    sessions.delete(sessionId)
    return null
  }
  
  // 更新会话过期时间
  session.expires = Date.now() + (PASSWORD_CONFIG.sessionExpiry * 3600 * 1000)
  return session
}

// 重定向到登录页面
function redirectToLogin() {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/login'
    }
  })
}

// 渲染登录页面
function renderLoginPage(errorMessage = '') {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>登录 - 我的导航</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      background-size: cover;
      background-position: center;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .login-container {
      background: rgba(255, 255, 255, 0.95);
      padding: 2.5rem;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
      backdrop-filter: blur(10px);
    }
    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .login-header h1 {
      color: #333;
      font-size: 1.8rem;
      margin-bottom: 0.5rem;
    }
    .login-header p {
      color: #666;
      font-size: 0.9rem;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: #333;
      font-weight: 500;
    }
    .form-group input {
      width: 100%;
      padding: 12px 15px;
      border: 1px solid #ddd;
      border-radius: 10px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }
    .form-group input:focus {
      outline: none;
      border-color: #667eea;
    }
    .login-btn {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .login-btn:hover {
      transform: translateY(-2px);
    }
    .error-message {
      color: #e74c3c;
      text-align: center;
      margin-top: 1rem;
      font-size: 0.9rem;
      min-height: 20px;
    }
    .footer-links {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.8rem;
      color: #666;
    }
    .success-message {
      color: #27ae60;
      text-align: center;
      margin-top: 1rem;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="login-header">
      <h1>🔐 登录</h1>
      <p>请输入密码访问导航站</p>
    </div>
    <form id="loginForm" method="POST" action="/login">
      <div class="form-group">
        <label for="username">用户名</label>
        <input type="text" id="username" name="username" value="admin" readonly>
      </div>
      <div class="form-group">
        <label for="password">密码</label>
        <input type="password" id="password" name="password" required autofocus placeholder="请输入密码">
      </div>
      <button type="submit" class="login-btn">登录</button>
    </form>
    ${errorMessage ? `<div class="error-message">${errorMessage}</div>` : '<div class="error-message"></div>'}
    <div class="footer-links">      
  </div>

  <script>
    // 添加表单提交反馈
    document.getElementById('loginForm').addEventListener('submit', function(e) {
      const submitBtn = this.querySelector('.login-btn');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '登录中...';
      submitBtn.disabled = true;
      
      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }, 2000);
    });

    // 自动聚焦到密码输入框
    document.getElementById('password').focus();
    
    // 回车键提交
    document.getElementById('password').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        document.getElementById('loginForm').requestSubmit();
      }
    });
  </script>
</body>
</html>`
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}

// 处理退出登录
async function handleLogout(request) {
  const cookieHeader = request.headers.get('Cookie')
  if (cookieHeader) {
    const cookies = new Map(cookieHeader.split(';').map(c => c.trim().split('=')))
    const sessionId = cookies.get('session')
    if (sessionId) {
      sessions.delete(sessionId)
    }
  }
  
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/login',
      'Set-Cookie': 'session=; Path=/; HttpOnly; Max-Age=0'
    }
  })
}

// API 处理函数
async function handleAPI(request) {
  const url = new URL(request.url)
  const path = url.pathname
  
  // 修改密码API
  if (path === '/api/change-password' && request.method === 'POST') {
    return handleChangePassword(request)
  }
  
  // 检查登录状态
  const session = await checkSession(request)
  if (!session && path !== '/api/login') {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }
  
  // 模拟数据存储
  const mockData = {
    menus: [
      { id: 1, name: '常用工具', icon: '🔧', order: 1 },
      { id: 2, name: '自建服务', icon: '💞', order: 2 },
      { id: 3, name: 'AI平台', icon: '🤖', order: 3 },
      { id: 4, name: '设计素材', icon: '🎨', order: 4 },
      { id: 5, name: '娱乐影音', icon: '🎬', order: 5 },
      { id: 6, name: '域名服务', icon: '🧰', order: 6 },
      { id: 7, name: '开发资源', icon: '💻', order: 7 },
      { id: 8, name: '社区博客', icon: '📚', order: 8 },
      { id: 9, name: '其他工具', icon: '🧰', order: 9 },
    ],
    cards: [
      { id: 1, menuId: 1, title: 'Google', url: 'https://google.com', icon: '🌐', description: '全球搜索引擎' },
      { id: 1, menuId: 1, title: 'Google', url: 'https://google.com', icon: '🌐', description: '全球搜索引擎' }
    ],
    ads: [],
    friends: []
  }
  
  // API 路由处理
  if (path === '/api/menus') {
    return jsonResponse(mockData.menus)
  }
  
  if (path === '/api/cards') {
    const menuId = url.searchParams.get('menuId')
    const cards = menuId ? mockData.cards.filter(card => card.menuId == menuId) : mockData.cards
    return jsonResponse(cards)
  }
  
  if (path === '/api/ads') {
    return jsonResponse(mockData.ads)
  }
  
  if (path === '/api/friends') {
    return jsonResponse(mockData.friends)
  }
  
  return jsonResponse({ error: 'Not found' }, 404)
}

// 处理修改密码
async function handleChangePassword(request) {
  try {
    const session = await checkSession(request)
    if (!session) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }
    
    const { currentPassword, newPassword } = await request.json()
    const storedPassword = passwordData.get(session.username) || PASSWORD_CONFIG.defaultPassword
    
    if (storedPassword !== currentPassword) {
      return jsonResponse({
        success: false,
        message: '当前密码错误'
      }, 401)
    }
    
    passwordData.set(session.username, newPassword)
    
    return jsonResponse({
      success: true,
      message: '密码修改成功'
    })
  } catch (error) {
    return jsonResponse({
      success: false,
      message: '请求格式错误'
    }, 400)
  }
}

// 生成随机会话ID
function generateSessionId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// JSON 响应辅助函数
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}

// 渲染主页面 HTML
function renderHTML(username = '用户') {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=0">
  <title>我的导航-个人专属导航页</title>
  <link rel="icon" type="image/png" href="https://img.icons8.com/lollipop/100/navigation.png" />
  <meta name="description" content="个人导航页面，提供常用网站链接和工具集合，让您快速访问常用资源" />
  <meta name="keywords" content="导航,书签,常用网站,工具集合,个人导航,快速访问" />
  <style>
    :root {
    --primary-color: #2563eb;
    --card-bg: rgba(255, 255, 255, 0.3);
    --card-bg-hover: rgba(255, 255, 255, 0.5);
    --text-color: #1e293b;
    --link-hover: #3b82f6;
    --header-color: rgba(255, 255, 255, 0.2);
    --uptime-bg: rgba(255, 255, 255, 0.5);
    --glass-bg: rgba(255, 255, 255, 0.1);
    --glass-border: rgba(255, 255, 255, 0.2);
    --card-shadow: rgba(0, 0, 0, 0.1);
    }

    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    
    body { 
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      background-image: url("https://www.loliapi.com/acg/");
      background-size: cover;
      background-position: center center;
      background-repeat: no-repeat;
      background-attachment: fixed;
      padding: 20px;
      line-height: 1.6;
      color: var(--text-color);
      min-height: 100vh;
      position: relative;
    }
    
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      z-index: -1;
    }
    
    #particles-js {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
    }
    
    .container {
      max-width: 1600px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }
    
    .header { 
      text-align: center; 
      margin-bottom: 2rem; 
      padding: 2rem 1.5rem;
      background: var(--header-color);
      border-radius: 20px;
      backdrop-filter: blur(12px) saturate(180%);
      border: 1px solid var(--glass-border);
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      transition: left 0.6s;
    }
    
    .header:hover::before {
      left: 100%;
    }
    
    .header h1 { 
      font-size: 2.5rem; 
      margin-bottom: 0.5rem; 
      color: #fff; 
      text-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-weight: 700;
      background: linear-gradient(135deg, #fff 0%, #e0e7ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .header p { 
      color: rgba(255, 255, 255, 0.9); 
      font-size: 1.1rem; 
      text-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .user-info {
      position: absolute;
      top: 20px;
      right: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: white;
      font-size: 0.9rem;
    }

    .theme-toggle-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      margin-right: 10px;
    }
    
    .theme-toggle-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }
    
    .theme-icon {
      font-size: 1.2rem;
      transition: transform 0.3s ease;
    }
    
    /* 移动端适配 */
    @media (max-width: 768px) {
      .theme-toggle-btn {
        width: 32px;
        height: 32px;
        margin-right: 8px;
      }
      
      .theme-icon {
        font-size: 1rem;
      }
    }
    
    .user-menu {
      position: relative;
      display: inline-block;
    }
    
    .user-dropdown {
      display: none;
      position: absolute;
      top: 100%;
      right: 0;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 10px;
      padding: 10px 0;
      min-width: 150px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      z-index: 1000;
    }
    
    .user-menu:hover .user-dropdown {
      display: block;
    }
    
    .user-dropdown a {
      display: block;
      padding: 10px 20px;
      color: #333;
      text-decoration: none;
      transition: background 0.3s;
    }
    
    .user-dropdown a:hover {
      background: rgba(0, 0, 0, 0.1);
    }
    
    .menu-tabs { 
      display: flex; 
      justify-content: center; 
      margin-bottom: 2rem; 
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .menu-tab { 
      padding: 12px 20px; 
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      color: #fff; 
      border-radius: 12px; 
      cursor: pointer; 
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 1rem;
      font-weight: 600;
      backdrop-filter: blur(12px);
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      position: relative;
      overflow: hidden;
    }
    
    .menu-tab::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: left 0.6s;
    }
    
    .menu-tab:hover::before {
      left: 100%;
    }
    
    .menu-tab.active, .menu-tab:hover { 
      background: rgba(59, 130, 246, 0.3);
      border-color: rgba(59, 130, 246, 0.5);
      transform: translateY(-2px) scale(1.03);
      box-shadow: 
        0 8px 20px rgba(0, 0, 0, 0.2),
        0 4px 12px rgba(59, 130, 246, 0.3);
    }
    
    .cards-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); 
      gap: 20px; 
      margin-bottom: 2rem;
    }
    
    .card { 
      background: var(--card-bg);
      padding: 1.2rem; 
      border-radius: 16px; 
      text-decoration: none; 
      color: var(--text-color); 
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: block;
      backdrop-filter: blur(16px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 
        0 8px 32px var(--card-shadow),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      position: relative;
      overflow: hidden;
      height: 120px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }
    
    .card:hover { 
      transform: translateY(-5px) scale(1.02);
      background: var(--card-bg-hover);
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 
        0 12px 40px rgba(0, 0, 0, 0.15),
        0 6px 20px rgba(59, 130, 246, 0.2);
      text-decoration: none;
      color: var(--text-color);
    }
    
    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      transition: left 0.6s;
    }
    
    .card:hover::before {
      left: 100%;
    }
    
    .card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
    }
    
    .card-icon { 
      width: 40px;
      height: 40px;
      border-radius: 10px;
      object-fit: cover;
      flex-shrink: 0;
      transition: transform 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .card:hover .card-icon {
      transform: scale(1.1) rotate(3deg);
    }
    
    .card-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      width: 100%;
    }
    
    .card-title { 
      font-size: 1.1rem;
      margin-bottom: 0.3rem;
      font-weight: 600;
      color: var(--primary-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }
    
    .card-desc { 
      color: #64748b; 
      font-size: 0.8rem;
      line-height: 1.2;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      max-width: 90%;
    }
    
    .uptime-container {
      background: var(--uptime-bg);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      padding: 1.2rem 1.5rem;
      text-align: center;
      margin: 2rem auto;
      max-width: 500px;
      backdrop-filter: blur(12px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }
    
    .uptime-container:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }
    
    .uptime-text {
      font-size: 1rem;
      color: #475569;
      margin-right: 8px;
    }
    
    .uptime-duration {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--primary-color);
      margin: 0 4px;
      min-width: 30px;
      display: inline-block;
    }
    
    .uptime-unit {
      font-size: 0.9rem;
      color: #64748b;
      margin-right: 12px;
    }
    
    .loading { 
      text-align: center; 
      padding: 3rem; 
      color: #fff;
      grid-column: 1 / -1;
    }
    
    .spinner { 
      border: 3px solid rgba(255,255,255,0.3); 
      border-top: 3px solid #fff; 
      border-radius: 50%; 
      width: 50px; 
      height: 50px; 
      animation: spin 1s linear infinite; 
      margin: 0 auto 1rem;
    }
    
    @keyframes spin { 
      0% { transform: rotate(0deg); } 
      100% { transform: rotate(360deg); } 
    }
    
    /* 密码修改模态框 */
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }
    
    .modal-content {
      background: white;
      padding: 2rem;
      border-radius: 15px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }
    
    .modal h3 {
      margin-bottom: 1.5rem;
      color: #333;
    }
    
    .modal-buttons {
      display: flex;
      gap: 10px;
      margin-top: 1.5rem;
      justify-content: flex-end;
    }
    
    .modal-buttons button {
      padding: 8px 16px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    
    .btn-primary {
      background: #2563eb;
      color: white;
    }
    
    .btn-secondary {
      background: #6b7280;
      color: white;
    }
    
    @media (max-width: 768px) {
      .card {
        padding: 1.2rem;
        height: 130px;
      }
      
      .card-content {
        gap: 10px;
      }
      
      .header h1 { 
        font-size: 2rem; 
      }
      
      .header {
        padding: 1.5rem 1rem;
        margin-bottom: 1.5rem;
      }
      
      .menu-tabs { 
        justify-content: flex-start; 
        overflow-x: auto;
        padding-bottom: 8px;
        margin-bottom: 1.5rem;
      }
      
      .menu-tab {
        padding: 10px 16px;
        font-size: 0.9rem;
      }
      
      .card {
        padding: 1.2rem;
        height: 130px;
      }
      
      .card-icon {
        width: 36px;
        height: 36px;
      }
      
      .card-title {
        font-size: 1rem;
      }
      
      .card-desc {
        font-size: 0.8rem;
      }
      
      .user-info {
        position: static;
        justify-content: center;
        margin-top: 1rem;
      }
    }
    
    @media (max-width: 480px) {
      .cards-grid { 
        grid-template-columns: 1fr; 
      }
      
      .card {
        height: auto;
        min-height: 120px;
      }
      
      .card-content {
        gap: 12px;
      }
    }
    
    /* 系统偏好暗色模式 */
    @media (prefers-color-scheme: dark) {
      :root:not([data-theme="light"]) {
        --text-color: #e2e8f0;
        --card-bg: rgba(15, 23, 42, 0.6);
        --card-bg-hover: rgba(30, 41, 59, 0.8);
        --header-color: rgba(15, 23, 42, 0.5);
        --uptime-bg: rgba(15, 23, 42, 0.8);
        --glass-bg: rgba(255, 255, 255, 0.05);
        --glass-border: rgba(255, 255, 255, 0.1);
        --card-shadow: rgba(0, 0, 0, 0.3);
      }
      
      :root:not([data-theme="light"]) .card {
        background: var(--card-bg);
        color: var(--text-color);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      :root:not([data-theme="light"]) .card:hover {
        background: var(--card-bg-hover);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      :root:not([data-theme="light"]) .card-title {
        color: #e2e8f0;
      }
      
      :root:not([data-theme="light"]) .card-desc {
        color: #94a3b8;
      }
      
      :root:not([data-theme="light"]) .modal-content {
        background: #1e293b;
        color: #e2e8f0;
      }
      
      :root:not([data-theme="light"]) .modal h3 {
        color: #e2e8f0;
      }
    
      :root:not([data-theme="light"]) .search-input-group {
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      :root:not([data-theme="light"]) .search-input-group:focus-within {
        background: rgba(30, 41, 59, 0.9);
        border-color: rgba(59, 130, 246, 0.5);
      }
      
      :root:not([data-theme="light"]) .search-input {
        color: #e2e8f0;
      }
      
      :root:not([data-theme="light"]) .search-input::placeholder {
        color: #94a3b8;
      }
    }
    
    /* 手动选择的暗色模式 */
    [data-theme="dark"] {
      --text-color: #e2e8f0;
      --card-bg: rgba(15, 23, 42, 0.6);
      --card-bg-hover: rgba(30, 41, 59, 0.8);
      --header-color: rgba(15, 23, 42, 0.5);
      --uptime-bg: rgba(15, 23, 42, 0.8);
      --glass-bg: rgba(255, 255, 255, 0.05);
      --glass-border: rgba(255, 255, 255, 0.1);
      --card-shadow: rgba(0, 0, 0, 0.3);
    }
    
    [data-theme="dark"] .card {
      background: var(--card-bg);
      color: var(--text-color);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    [data-theme="dark"] .card:hover {
      background: var(--card-bg-hover);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    [data-theme="dark"] .card-title {
      color: #e2e8f0;
    }
    
    [data-theme="dark"] .card-desc {
      color: #94a3b8;
    }
    
    [data-theme="dark"] .modal-content {
      background: #1e293b;
      color: #e2e8f0;
    }
    
    [data-theme="dark"] .modal h3 {
      color: #e2e8f0;
    }
    
    [data-theme="dark"] .search-input-group {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    [data-theme="dark"] .search-input-group:focus-within {
      background: rgba(30, 41, 59, 0.9);
      border-color: rgba(59, 130, 246, 0.5);
    }
    
    [data-theme="dark"] .search-input {
      color: #e2e8f0;
    }
    
    [data-theme="dark"] .search-input::placeholder {
      color: #94a3b8;
    }
    

    .search-container {
      max-width: 600px;
      margin: 1.5rem auto 0;
      width: 100%;
    }

    .search-form {
      width: 100%;
    }

    .search-input-group {
      display: flex;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50px;
      padding: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }

    .search-input-group:focus-within {
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
      border-color: rgba(59, 130, 246, 0.5);
    }

    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      padding: 12px 20px;
      font-size: 1rem;
      color: #1e293b;
      outline: none;
    }

    .search-input::placeholder {
      color: #94a3b8;
    }

    .search-button {
      background: #2563eb;
      border: none;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      color: white;
    }

    .search-button:hover {
      background: #1d4ed8;
      transform: scale(1.05);
    }

    .search-button:active {
      transform: scale(0.95);
    }

    @media (max-width: 768px) {
      .search-container {
        max-width: 90%;
        margin: 1rem auto 0;
      }
      
      .search-input {
        padding: 10px 16px;
        font-size: 0.9rem;
      }
      
      .search-button {
        width: 40px;
        height: 40px;
      }
      
      .search-button svg {
        width: 18px;
        height: 18px;
      }
    }

    @media (max-width: 480px) {
      .search-container {
        max-width: 95%;
      }
      
      .search-input {
        padding: 8px 14px;
      }
    }
  </style>
</head>
<body>
  <div id="particles-js"></div>
  
  <div class="container">
    <header class="header">
      <div class="user-info">
        <button id="theme-toggle" class="theme-toggle-btn" title="切换明暗模式">
          <span class="theme-icon">🌙</span>
        </button>
        <span>欢迎, ${username}</span>
        <div class="user-menu">
          <span>⚙️</span>
          <div class="user-dropdown">
            <a href="#" onclick="showChangePasswordModal()">修改密码</a>
            <a href="/logout">退出登录</a>
          </div>
        </div>
      </div>
      
      <h1>✨ 我的导航</h1>
      <p>个人专属导航页面 - 高效访问常用资源</p>
      
      <div class="search-container">
        <form action="https://www.google.com/search" method="GET" target="_blank" class="search-form">
          <div class="search-input-group">
            <input type="text" name="q" placeholder="输入关键词进行谷歌搜索..." class="search-input" autocomplete="off">
            <button type="submit" class="search-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </header>
    
    <div class="menu-tabs" id="menuTabs">
      <!-- 菜单将通过 JS 动态生成 -->
    </div>
    
    <div class="cards-grid" id="cardsGrid">
      <div class="loading">
        <div class="spinner"></div>
        <div>加载中，请稍候...</div>
      </div>
    </div>
    
    <div class="uptime-container">
      <span class="uptime-text">本站已稳定运行:</span>
      <span class="uptime-duration" id="days">0</span>
      <span class="uptime-unit">天</span>
      <span class="uptime-duration" id="hours">0</span>
      <span class="uptime-unit">小时</span>
      <span class="uptime-duration" id="minutes">0</span>
      <span class="uptime-unit">分钟</span>
      <span class="uptime-duration" id="seconds">0</span>
      <span class="uptime-unit">秒</span>
    </div>
  </div>

  <!-- 密码修改模态框 -->
  <div id="passwordModal" class="modal">
    <div class="modal-content">
      <h3>修改密码</h3>
      <form id="changePasswordForm">
        <div class="form-group">
          <label for="currentPassword">当前密码</label>
          <input type="password" id="currentPassword" name="currentPassword" required>
        </div>
        <div class="form-group">
          <label for="newPassword">新密码</label>
          <input type="password" id="newPassword" name="newPassword" required>
        </div>
        <div class="form-group">
          <label for="confirmPassword">确认新密码</label>
          <input type="password" id="confirmPassword" name="confirmPassword" required>
        </div>
        <div class="modal-buttons">
          <button type="button" class="btn-secondary" onclick="hideChangePasswordModal()">取消</button>
          <button type="submit" class="btn-primary">确认修改</button>
        </div>
      </form>
      <div id="passwordMessage" style="margin-top: 1rem; text-align: center;"></div>
    </div>
  </div>

  <script>
    // 粒子背景配置
    function initParticles() {
      const canvas = document.createElement('canvas');
      canvas.id = 'particles-js';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.zIndex = '-1';
      document.body.appendChild(canvas);
      
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const particles = [];
      const particleCount = 25;
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.5,
          speedX: Math.random() * 0.8 - 0.4,
          speedY: Math.random() * 0.8 - 0.4
        });
      }
      
      function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
          particle.x += particle.speedX;
          particle.y += particle.speedY;
          
          if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
          if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
          
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.fill();
          
          particles.forEach(otherParticle => {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
              ctx.beginPath();
              ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.2 * (1 - distance / 150)) + ')';
              ctx.lineWidth = 0.5;
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.stroke();
            }
          });
        });
        
        requestAnimationFrame(animate);
      }
      
      animate();
      
      window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      });
    }
    // 明暗模式切换功能
    function initThemeToggle() {
      const themeToggle = document.getElementById('theme-toggle');
      const themeIcon = themeToggle.querySelector('.theme-icon');
      
      // 检查本地存储的主题偏好
      const savedTheme = localStorage.getItem('theme') || 
                        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      
      // 应用保存的主题
      if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '☀️';
      } else {
        document.documentElement.removeAttribute('data-theme');
        themeIcon.textContent = '🌙';
      }
      
      // 切换主题
      themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        
        if (currentTheme === 'dark') {
          document.documentElement.removeAttribute('data-theme');
          themeIcon.textContent = '🌙';
          localStorage.setItem('theme', 'light');
        } else {
          document.documentElement.setAttribute('data-theme', 'dark');
          themeIcon.textContent = '☀️';
          localStorage.setItem('theme', 'dark');
        }
      });
    }
    // Vue.js 风格的响应式数据管理
    const store = {
      state: {
        menus: [],
        cards: [],
        activeMenu: null,
        loading: true
      },
      
      setState(newState) {
        Object.assign(this.state, newState)
        this.render()
      },
      
      async fetchData() {
        try {
          this.setState({ loading: true })
          
          const [menusResponse, cardsResponse] = await Promise.all([
            fetch('/api/menus'),
            fetch('/api/cards')
          ])
          
          const menus = await menusResponse.json()
          const cards = await cardsResponse.json()
          
          this.setState({ 
            menus: menus.sort((a, b) => a.order - b.order),
            cards,
            activeMenu: menus[0]?.id || null,
            loading: false
          })
        } catch (error) {
          console.error('数据加载失败:', error)
          this.setState({ loading: false })
        }
      }
    }
    
    // 渲染函数
    store.render = function() {
      const { menus, cards, activeMenu, loading } = this.state
        
      // 渲染菜单
      const menuTabs = document.getElementById('menuTabs')
      menuTabs.innerHTML = menus.map(menu => \`
        <button class="menu-tab \${activeMenu === menu.id ? 'active' : ''}" 
                onclick="store.setState({ activeMenu: \${menu.id} })">
          \${menu.icon} \${menu.name}
        </button>
      \`).join('')
      
      // 渲染卡片
      const cardsGrid = document.getElementById('cardsGrid')
      if (loading) {
        cardsGrid.innerHTML = \`
          <div class="loading">
            <div class="spinner"></div>
            <div>加载中，请稍候...</div>
          </div>
        \`
      } else {
        const filteredCards = activeMenu ? 
          cards.filter(card => card.menuId === activeMenu) : 
          cards
          
        cardsGrid.innerHTML = filteredCards.map(card => \`
          <a href="\${card.url}" target="_blank" class="card" rel="noopener">
            <div class="card-icon">\${card.icon}</div>
            <div class="card-title">\${card.title}</div>
            <div class="card-desc">\${card.description}</div>
          </a>
        \`).join('') || '<div style="text-align:center;color:#fff;grid-column:1/-1;padding:40px;font-size:1.2rem;">暂无内容</div>'
      }
    }
    
    // 运行时间计算
    function updateUptime() {
      const launchDate = new Date('2025-11-01T00:00:00');
      const now = new Date();
      const diff = now - launchDate;
      
      if (diff < 0) return;
      
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      document.getElementById('days').textContent = days;
      document.getElementById('hours').textContent = hours % 24;
      document.getElementById('minutes').textContent = minutes % 60;
      document.getElementById('seconds').textContent = seconds % 60;
    }
    
    // 动态背景 - 每天更换
    function updateBackground() {
      const today = new Date().getDate();
      const bgImage = "https://www.loliapi.com/acg/?" + today;
      document.body.style.backgroundImage = 'url("' + bgImage + '")';
    }
    
    // 鼠标跟随效果
    function initMouseEffect() {
      document.addEventListener('mousemove', function(e) {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          card.style.setProperty('--mouse-x', x + 'px');
          card.style.setProperty('--mouse-y', y + 'px');
        });
      });
    }
    
    // 密码修改功能
    function showChangePasswordModal() {
      document.getElementById('passwordModal').style.display = 'flex';
      document.getElementById('passwordMessage').textContent = '';
    }
    
    function hideChangePasswordModal() {
      document.getElementById('passwordModal').style.display = 'none';
      document.getElementById('changePasswordForm').reset();
    }
    
    async function handleChangePassword(event) {
      event.preventDefault();
      
      const formData = new FormData(event.target);
      const currentPassword = formData.get('currentPassword');
      const newPassword = formData.get('newPassword');
      const confirmPassword = formData.get('confirmPassword');
      
      const messageEl = document.getElementById('passwordMessage');
      
      if (newPassword !== confirmPassword) {
        messageEl.textContent = '新密码与确认密码不一致';
        messageEl.style.color = 'red';
        return;
      }
      
      if (newPassword.length < 6) {
        messageEl.textContent = '密码长度不能少于6位';
        messageEl.style.color = 'red';
        return;
      }
      
      try {
        const response = await fetch('/api/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPassword,
            newPassword
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          messageEl.textContent = '密码修改成功';
          messageEl.style.color = 'green';
          
          setTimeout(() => {
            hideChangePasswordModal();
            alert('密码修改成功，请重新登录');
            window.location.href = '/logout';
          }, 1500);
        } else {
          messageEl.textContent = result.message;
          messageEl.style.color = 'red';
        }
      } catch (error) {
        messageEl.textContent = '修改失败，请重试';
        messageEl.style.color = 'red';
      }
    }
    
    // 初始化应用
    document.addEventListener('DOMContentLoaded', () => {
      // 初始化各种效果
      initParticles();
      initMouseEffect();
      initThemeToggle();
      // 启动运行时间计时器
      updateUptime();
      setInterval(updateUptime, 1000);
      
      // 更新背景（每天更换）
      updateBackground();
      
      // 加载数据
      store.fetchData();
      
      // 绑定密码修改表单
      document.getElementById('changePasswordForm').addEventListener('submit', handleChangePassword);
    });
    
    // 暴露 store 到全局
    window.store = store
    window.showChangePasswordModal = showChangePasswordModal
    window.hideChangePasswordModal = hideChangePasswordModal
  </script>
</body>
</html>`
}
