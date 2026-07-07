/** @type {import('vite').UserConfig} */
export default {
    base: "./",
    build: {
        modulePreload: {
            polyfill: false
        },
        rollupOptions: {
            input: {
                main: '/main.html',
            },
        },
        commonjsOptions: {
            transformMixedEsModules: true,
        },
        minify: true,
        sourcemap: false,
        target: "es2024",
        outDir: 'build',
    },
    server: {
        allowedHosts: true,
    },
}
