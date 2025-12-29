import { defineConfig } from 'vite';
import { resolve } from 'path';
import legacy from '@vitejs/plugin-legacy';

// https://vitejs.dev/config/
export default defineConfig({
    // 多頁應用配置
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                quiz: resolve(__dirname, 'quiz.html'),
                admin: resolve(__dirname, 'admin.html'),
                upload: resolve(__dirname, 'upload.html'),
                aiGenerate: resolve(__dirname, 'ai-generate.html')
            },
            output: {
                // chunk 分割策略
                manualChunks: {
                    'firebase': [
                        'firebase/app',
                        'firebase/firestore',
                        'firebase/auth'
                    ],
                    'vendor': ['chart.js']
                }
            }
        },
        // 壓縮設定
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // 移除 console.log
                drop_debugger: true
            }
        },
        // 輸出目錄
        outDir: 'dist',
        assetsDir: 'assets',
        // Source map（開發時啟用）
        sourcemap: false,
        // Chunk 大小警告
        chunkSizeWarningLimit: 500,
        // 啟用 CSS code splitting
        cssCodeSplit: true
    },

    // 開發伺服器配置
    server: {
        port: 5173,
        open: true,
        cors: true,
        // 代理配置（如果需要）
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    },

    // 預覽伺服器配置
    preview: {
        port: 4173,
        open: true
    },

    // 插件
    plugins: [
        // 舊版瀏覽器支援
        legacy({
            targets: ['defaults', 'not IE 11'],
            additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
            renderLegacyChunks: true,
            polyfills: [
                'es.promise',
                'es.array.iterator',
                'es.object.assign'
            ]
        })
    ],

    // 優化選項
    optimizeDeps: {
        include: ['firebase/app', 'firebase/firestore', 'firebase/auth']
    },

    // 靜態資源處理
    assetsInclude: ['**/*.md', '**/*.json'],

    // 全域常數替換
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '2.2.0')
    },

    // CSS 預處理器選項
    css: {
        preprocessorOptions: {
            // 如果使用 SCSS 可以在這裡配置
        },
        postcss: {
            plugins: [
                // 自動添加瀏覽器前綴
                require('autoprefixer')
            ]
        }
    }
});
