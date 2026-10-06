import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);
const viteRequire=createRequire(require.resolve('vite'));
const {rolldown}=await import(pathToFileURL(viteRequire.resolve('rolldown')).href);
const {default:tailwind}=await import('@tailwindcss/postcss');
const {default:postcss}=await import(pathToFileURL(createRequire(require.resolve('@tailwindcss/postcss')).resolve('postcss')).href);
await fs.mkdir('dist',{recursive:true});
const bundle=await rolldown({input:'app/client.tsx',platform:'browser',resolve:{alias:{'@':path.resolve('.')}},transform:{jsx:{runtime:'automatic'},define:{'process.env.NODE_ENV':'"production"'}}});
await bundle.write({dir:'dist',format:'esm',entryFileNames:'app.js',minify:true});
await bundle.close();
const css=await postcss([tailwind()]).process(await fs.readFile('app/globals.css','utf8'),{from:path.resolve('app/globals.css'),to:path.resolve('dist/app.css')});
await fs.writeFile('dist/app.css',css.css);
await fs.cp('public','dist',{recursive:true});
await fs.writeFile('dist/index.html','<!doctype html><html lang="ko"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/><meta name="theme-color" content="#225ad5"/><meta name="description" content="나의 Gemini API로 기업 분석과 경험 기반 자기소개서 초안을 만드세요."/><meta name="apple-mobile-web-app-capable" content="yes"/><link rel="manifest" href="./manifest.webmanifest"/><link rel="apple-touch-icon" href="./icon-192.png"/><title>커리어캐쳐 | 나의 경험으로 쓰는 자기소개서</title><link rel="stylesheet" href="./app.css"/></head><body><div id="root"></div><script type="module" src="./app.js"></script></body></html>');
console.log('Static build complete.');

