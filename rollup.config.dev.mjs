import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
    external: [
        'pixi.js',
        'pixi-spine',
        '@tweenjs/tween.js'
    ],
    input: [
        './src/index.ts'
    ],
    output: {
        file: './public/js/black-jack.js',
        name: 'App',
        format: 'iife',
        sourcemap: true,
        globals: {
            'pixi.js': 'PIXI',
            'pixi-spine': 'PIXI.spine',
            '@tweenjs/tween.js': 'TWEEN'
        }
    },
    plugins: [
        nodeResolve({
            extensions: ['.ts', '.tsx']
        }),
        commonjs(),
        typescript(),
    ]
};