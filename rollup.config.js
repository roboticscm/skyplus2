import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import html2 from 'rollup-plugin-html2';
import svelte from 'rollup-plugin-svelte';
import serve from 'rollup-plugin-serve';
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
import livereload from 'rollup-plugin-livereload';
import sveltePreprocessor from 'svelte-preprocess';
import alias from '@rollup/plugin-alias';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';

const path = require('path');

const isDevelopment = process.env.NODE_ENV === 'development';
const extensions = ['.ts', '.svelte', '.mjs', '.js', '.jsx', 'json', '.scss', '.sass']
const customResolver = resolve({
    extensions
});


const plugins = [
    alias({
        entries: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
        customResolver
    }),
    svelte({
        dev: isDevelopment,
        extensions: ['.svelte'],
        preprocess: sveltePreprocessor(),
        emitCss: true,
    }),
    postcss({
        extract: true,
    }),
    json(),
    typescript(),
    resolve({
        extensions
    }),
    html2({
        template: 'public/template.html',
    }),
    commonjs(),

    babel({ extensions: ['.js', '.ts', '.tsx'], include: ['src/**/*'] }),
    ];
if (isDevelopment) {
    plugins.push(
        serve({
            contentBase: './dist',
            open: false,
        }),
        livereload({ watch: './dist' })
    );
} else {
    plugins.push(terser({ sourcemap: true }));
}

module.exports = {
    input: 'src/main.ts',
    output: {
        // file: 'dist/index.js',
        dir: 'dist',
        sourcemap: true,
        format: 'es',
    },
    plugins,
};
