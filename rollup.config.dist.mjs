import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

export default {
    external: [
        'pixi.js',
        'pixi-spine',
        'howler',
        '@tweenjs/tween.js'
    ],
    input: [
        './src/index.ts'
    ],
    output: {
        file: './public/js/black-jack.min.js',
        name: 'App',
        format: 'iife',
        sourcemap: false,
        globals: {
            'pixi.js': 'PIXI',
            'pixi-spine': 'PIXI.spine',
            'howler': 'HowlerJS',
            '@tweenjs/tween.js': 'TWEEN'
        }
    },
    plugins: [
        nodeResolve({
            extensions: ['.ts', '.tsx']
        }),
        commonjs(),
        typescript(),
        terser()
    ]
};