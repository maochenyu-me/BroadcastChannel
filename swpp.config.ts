import process from 'node:process'
import { defineConfig, defineCrossDep, defineRuntimeCore, defineRuntimeDep } from 'swpp-backends'

// 生产站点地址：swpp 用它判断资源是否本站、计算线上更新文件地址
// 可通过环境变量 SITE_URL 覆盖（CI 中与站点部署域名保持一致）
const SITE_URL = process.env.SITE_URL || 'https://memo.518339.xyz'

defineConfig({
  compilationEnv: {
    DOMAIN_HOST: new URL(SITE_URL),
  },
})

// 缓存规则：正数 = 定时缓存（毫秒），负数 = 永久缓存（本站资源，增量更新失效），0 = 不缓存
defineCrossDep({
  matchCacheRule: {
    // 构建期：扫描 dist/client 里的静态文件，决定进入预缓存清单的策略
    runOnNode: (url: URL) => {
      const p = url.pathname
      if (p.startsWith('/swpp/') || p === '/sw.js' || p === '/sw-dom.js')
        return 0
      if (p === '/bg.mp4')
        return 0
      if (p.endsWith('.mp3'))
        return -1
      if (p.startsWith('/_astro/'))
        return -1
      if (/\.(?:png|jpe?g|webp|gif|avif|bmp)$/i.test(p))
        return -1
      if (/\.(?:css|js|svg|ico|xsl|webmanifest|txt)$/.test(p))
        return -1
      return 0
    },
    // 运行时：拦截到的请求按 URL 分类
    runOnBrowser: (url: URL) => {
      const p = url.pathname
      if (p.startsWith('/swpp/') || p === '/sw.js' || p === '/sw-dom.js')
        return 0
      if (p === '/bg.mp4' || p === '/favicon.png')
        return 0
      if (p.endsWith('.mp3'))
        return -1
      if (p.startsWith('/_astro/'))
        return -1
      if (p.startsWith('/static/')) {
        return /\.(?:png|jpe?g|webp|gif|avif|bmp)$/i.test(p) ? 604800000 : 0
      }
      if (/\.(?:png|css|js|svg|ico|xsl|webmanifest|txt)$/.test(p))
        return -1
      if (/\.(?:xml|json)$/.test(p))
        return 60 * 60 * 1000
      if (!p.includes('.'))
        return 86400000
      return 0
    },
  },
})

// 覆盖缓存有效性判断：HTML 永远视为过期（在线必拉最新，断网由 handleFetchEvent 回退到缓存）
declare const INVALID_KEY: string
declare const STORAGE_TIMESTAMP: string
declare const BASE_URL: string

defineRuntimeDep({
  // runtime 环境常量由 swpp 生成时注入到 sw.js 作用域，此处仅作类型提示
  isValidCache: (response: Response, rule: number) => {
    const headers = response.headers
    if (headers.has(INVALID_KEY))
      return false
    const type = headers.get('content-type') || ''
    if (type.includes('text/html'))
      return false
    if (rule < 0) {
      const url = response.url
      const baseLength = BASE_URL.length
      if (url.startsWith(BASE_URL) && (url.length === baseLength || url[baseLength] === '/')) {
        return true
      }
      rule = 86400000
    }
    const storage = headers.get(STORAGE_TIMESTAMP)
    if (!storage)
      return true
    return Date.now() - new Date(storage).getTime() < rule
  },
})

// 复写请求处理流程：写缓存时记录时间戳，让定时缓存真正生效（swpp 默认不带时间戳）
declare const normalizeUrl: (url: string) => string
declare const matchCacheRule: (url: URL) => undefined | null | false | number
declare const matchFromCaches: (request: RequestInfo | URL) => Promise<Response | undefined>
declare const isValidCache: (response: Response, rule: number) => boolean
declare const fetchFile: (request: RequestInfo | URL, optional?: RequestInit) => Promise<Response>
declare const isFetchSuccessful: (response: Response) => boolean
declare const writeResponseToCache: (request: RequestInfo | URL, response: Response, date?: boolean) => Promise<void>
declare const fetchWrapper: (request: Request, banCache: boolean, cors: boolean) => Promise<Response>
declare const isCors: (request: Request) => boolean
declare const isBlockRequest: (request: Request) => boolean
declare const modifyRequest: (request: Request) => Request | null | undefined

defineRuntimeCore({
  handleFetchEvent: (event: { request: Request, respondWith: (response: Response | Promise<Response>) => void }) => {
    let request = event.request
    if (request.method !== 'GET' || !request.url.startsWith('http'))
      return
    if (isBlockRequest(request)) {
      return event.respondWith(new Response(null, { status: 204 }))
    }
    const newRequest = modifyRequest(request)
    if (newRequest)
      request = newRequest
    let cleanUrl = request.url
    for (let i = 0; i < cleanUrl.length; i++) {
      const item = cleanUrl[i]
      if (item === '?' || item === '#') {
        cleanUrl = cleanUrl.substring(0, i)
        break
      }
    }
    const cacheKey = new URL(normalizeUrl(cleanUrl))
    const cacheRule = matchCacheRule(cacheKey)
    if (cacheRule) {
      event.respondWith(
        matchFromCaches(cacheKey).then((cacheResponse) => {
          if (cacheResponse && isValidCache(cacheResponse, cacheRule)) {
            return cacheResponse
          }
          const responsePromise = fetchFile(request).then((response) => {
            if (isFetchSuccessful(response)) {
              writeResponseToCache(cacheKey, response.clone(), true)
              return response
            }
            return cacheResponse ?? response
          })
          return cacheResponse ? responsePromise.catch(() => cacheResponse) : responsePromise
        }),
      )
    }
    else if (newRequest) {
      event.respondWith(fetchWrapper(request, false, isCors(request)))
    }
  },
})
