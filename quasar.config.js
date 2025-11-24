import { defineConfig } from '#q-app/wrappers'

export default defineConfig(() => {
  return {
    boot: [],
    css: ['app.scss'],
    extras: ['roboto-font', 'material-icons'],
    build: {
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
        node: 'node20'
      },
      vueRouterMode: 'hash'
    },
    devServer: {
      open: true
    },
    framework: {
      config: {},
      plugins: ['Notify']
    },
    animations: [],
    ssr: {
      prodPort: 3000,
      middlewares: ['render'],
      pwa: false
    },
    pwa: {
      workboxMode: 'GenerateSW'
    },
    cordova: {},
    capacitor: {
      hideSplashscreen: true
    },
    electron: {
      preloadScripts: ['electron-preload'],
      inspectPort: 5858,
      bundler: 'packager',
      packager: {},
      builder: {
        appId: 'video-transcription-app'
      }
    },
    bex: {
      extraScripts: []
    }
  }
})
