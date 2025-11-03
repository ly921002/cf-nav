// Cloudflare Worker 单文件导航站应用
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // API 路由处理
  if (url.pathname.startsWith('/api/')) {
    return handleAPI(request)
  }
  
  // 静态资源处理
  if (url.pathname === '/favicon.ico') {
    return new Response(null, { status: 404 })
  }
  
  // 主页面
  return new Response(renderHTML(), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}

// API 处理函数
async function handleAPI(request) {
  const url = new URL(request.url)
  const path = url.pathname
  
  // 模拟数据存储
  const mockData = {
    menus: [
      { id: 1, name: '常用工具', icon: '🔧', order: 1 },
      { id: 2, name: '自建服务', icon: '💞', order: 2 },
      { id: 3, name: 'AI平台', icon: '🤖', order: 3 },
      { id: 4, name: '设计素材', icon: '🎨', order: 4 },
      { id: 5, name: '娱乐影音', icon: '🎬', order: 5 },
      { id: 6, name: '其他工具', icon: '🧰', order: 6 },
      { id: 7, name: '开发资源', icon: '💻', order: 7 },
      { id: 8, name: '社区博客', icon: '📚', order: 8 }
    ],
    cards: [
      { id: 1, menuId: 1, title: 'Google', url: 'https://google.com', icon: '🌐', description: '全球搜索引擎' },
      { id: 2, menuId: 1, title: 'GitHub', url: 'https://github.com', icon: '🐙', description: '代码托管平台' },
      { id: 3, menuId: 1, title: 'ChatGPT', url: 'https://chatgpt.com', icon: '🤖', description: 'AI智能助手' },
      { id: 4, menuId: 2, title: 'MDN', url: 'https://developer.mozilla.org', icon: '📖', description: '开发文档' },
      { id: 5, menuId: 2, title: 'Vue.js', url: 'https://vuejs.org', icon: '⚡', description: '前端框架' },
      { id: 6, menuId: 3, title: 'Coursera', url: 'https://coursera.org', icon: '🎓', description: '在线课程' },
      { id: 7, menuId: 3, title: 'Bilibili', url: 'https://bilibili.com', icon: '📺', description: '视频学习' },
      { id: 8, menuId: 4, title: 'Dribbble', url: 'https://dribbble.com', icon: '✨', description: '设计灵感' },
      { id: 9, menuId: 4, title: 'Unsplash', url: 'https://unsplash.com', icon: '📷', description: '免费图片' },
      { id: 10, menuId: 5, title: 'YouTube', url: 'https://youtube.com', icon: '🎥', description: '视频平台' }
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

// JSON 响应辅助函数
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

// 渲染主页面 HTML
function renderHTML() {
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
      --card-bg: rgba(255, 255, 255, 0.85);
      --text-color: #1e293b;
      --link-hover: #3b82f6;
      --header-color: rgba(255, 255, 255, 0.2);
      --uptime-bg: rgba(255, 255, 255, 0.8);
      --glass-bg: rgba(255, 255, 255, 0.1);
      --glass-border: rgba(255, 255, 255, 0.2);
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
    
    /* 背景叠加层 */
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
    
    /* 动态粒子背景 */
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
    
    /* 头部样式 */
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
    
    /* 菜单标签 */
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
    
    /* 卡片网格 - 调整为更小的卡片 */
    .cards-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); 
      gap: 20px; 
      margin-bottom: 2rem;
    }
    
    .card { 
      background: var(--card-bg);
      padding: 1.5rem; 
      border-radius: 16px; 
      text-decoration: none; 
      color: var(--text-color); 
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: block;
      backdrop-filter: blur(12px) saturate(180%);
      border: 1px solid var(--glass-border);
      box-shadow: 
        0 6px 24px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      position: relative;
      overflow: hidden;
      height: 140px; /* 固定高度使卡片更紧凑 */
      display: flex;
      flex-direction: column;
      justify-content: center;
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
    
    .card:hover { 
      transform: translateY(-5px) scale(1.02);
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 
        0 12px 32px rgba(0, 0, 0, 0.15),
        0 6px 20px rgba(59, 130, 246, 0.2);
      text-decoration: none;
      color: var(--text-color);
    }
    
    .card-content {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .card-icon { 
      width: 30px;
      height: 30px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 1;
      transition: transform 0.3s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .card:hover .card-icon {
      transform: scale(1.1) rotate(3deg);
    }
    
    .card-text {
      flex: 1;
      min-width: 0;
    }
    
    .card-title { 
      font-size: 1.1rem; 
      margin-bottom: 0.4rem; 
      font-weight: 600;
      color: var(--primary-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .card-desc { 
      color: #64748b; 
      font-size: 0.85rem; 
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    /* 运行时间显示 */
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
    
    /* 加载动画 */
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
    
    /* 响应式设计 */
    @media (max-width: 768px) {
      .cards-grid { 
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); 
        gap: 15px;
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
    
    /* 暗色模式支持 */
    @media (prefers-color-scheme: dark) {
      :root {
        --text-color: #e2e8f0;
        --card-bg: rgba(15, 23, 42, 0.8);
        --header-color: rgba(15, 23, 42, 0.5);
        --uptime-bg: rgba(15, 23, 42, 0.8);
        --glass-bg: rgba(255, 255, 255, 0.05);
        --glass-border: rgba(255, 255, 255, 0.1);
      }
      
      .card {
        background: var(--card-bg);
        color: var(--text-color);
      }
      
      .card:hover {
        background: rgba(30, 41, 59, 0.9);
      }
      
      .card-icon {
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
    }
  </style>
</head>
<body>
  <!-- 粒子背景容器 -->
  <div id="particles-js"></div>
  
  <div class="container">
    <header class="header">
      <h1>✨ 我的导航</h1>
      <p>个人专属导航页面 - 高效访问常用资源</p>
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
      
      // 简单的粒子实现
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const particles = [];
      const particleCount = 25; // 减少粒子数量提高性能
      
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
          
          // 绘制粒子
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.fill();
          
          // 绘制连线
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
      
      // 窗口大小变化时重置canvas
      window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
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
      const launchDate = new Date('2024-01-01T00:00:00');
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
    
    // 初始化应用
    document.addEventListener('DOMContentLoaded', () => {
      // 初始化各种效果
      initParticles();
      initMouseEffect();
      
      // 启动运行时间计时器
      updateUptime();
      setInterval(updateUptime, 1000);
      
      // 更新背景（每天更换）
      updateBackground();
      
      // 加载数据
      store.fetchData();
    });
    
    // 暴露 store 到全局
    window.store = store
  </script>
</body>
</html>`
}
