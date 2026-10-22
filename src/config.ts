// 站点自定义配置（构建时读取，改完需重新 build / 重启 dev）
export const siteConfig = {
  // 每页展示的说说条数，默认 10；建议不超过 20（Telegram 单窗口返回量的硬限制）
  pageSize: 10,

  // PWA：Service Worker 离线缓存（由 swpp 生成 sw.js，构建后自动运行 swpp-cli）
  pwa: {
    // 是否注册 Service Worker（仅生产构建生效，dev 不注册）
    enabled: true,
  },

  // Moments 主题（朋友圈风格）自定义项
  moments: {
    // 启用 Moments 主题：注入 /themes/moments.css 并显示明暗切换按钮。
    // 启用后无需再通过 HEADER_INJECT 注入主题样式（环境变量值不允许空格）
    enabled: true,
    // 头部封面图 URL（旧字段，留空则使用主题内置渐变；设置 cover 后仅在 cover.images 为空时兜底）
    coverImage: '',
    // 封面媒体扩展配置：视频 / 多图轮播 / 明暗双图
    cover: {
      // 多图轮播：填 2-6 个图片地址（public/ 相对路径或完整 URL）启用自动淡切轮播，超出 6 张只取前 6 张
      images: [],
      // 暗色模式对应图，与 images 按下标一一对应，可只填部分
      imagesDark: [],
      // 视频封面地址，设置后优先于图片；建议 mp4、静音短循环，明暗模式共用这一套
      video: '/bg.mp4',
      // 视频是否静音（默认 true 静音循环自动播放；改 false 开启声音，浏览器不允许带声自动播放，需点击封面开始）
      videoMuted: true,
      // 视频封面帧图片，未配置时浏览器取视频首帧
      videoPoster: '',
      // 轮播每张停留秒数（最小 2）
      interval: 6,
    },
    // 自定义头像 URL，留空则使用 Telegram 频道头像
    avatar: 'https://q2.qlogo.cn/headimg_dl?dst_uin=3149261770&spec=0',
    // 自定义昵称，留空则使用 Telegram 频道名称
    name: '喵洛阁',
    // 头部标题文字颜色（如 '#fff'、'rgba(255, 255, 255, 0.9)'），适配封面背景；留空跟随主题（浅色黑/深色白）
    titleColor: '#fff',
    // 暗色模式标题颜色，留空则与 titleColor 相同
    titleColorDark: '#fff',
    // 顶部左上角音乐播放器，src 留空则整个组件不渲染
    music: {
      // 音频直链，或网易云歌曲 ID（纯数字自动转外链 mp3）
      src: '/m1.mp3',
      // 尝试自动播放（多数浏览器禁止带声自动播放，被拦截时保持暂停、点击封面开始）
      autoplay: false,
      // 循环播放（默认开）
      loop: true,
      // 歌曲名，悬停提示用，可留空
      title: '不可得',
    },
  },
}
