import {defineConfig} from 'vite';
import tailwindcss from '@tailwindcss/vite';
import {fileURLToPath} from 'node:url';
import {readFileSync, mkdirSync, copyFileSync} from 'node:fs';
import path from 'node:path';
import {menuDesignDownloads} from './server/export-downloads.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
const zip=path.resolve(root,'../../node_modules/jszip/dist/jszip.min.js');
export default defineConfig(({command})=>({
  root, base:command==='serve'?'/menu-design/':'./',
  plugins:[tailwindcss(),{
    name:'menu-design-local-zip',
    configureServer(server){server.middlewares.use(menuDesignDownloads);server.middlewares.use((req,res,next)=>{if(req.url?.split('?')[0]==='/menu-design/workspace/lib/jszip.min.js'){res.setHeader('Content-Type','application/javascript');res.end(readFileSync(zip));return;}next();});},
    configurePreviewServer(server){server.middlewares.use(menuDesignDownloads);},
    closeBundle(){const dest=path.join(root,'build/workspace/lib');mkdirSync(dest,{recursive:true});copyFileSync(zip,path.join(dest,'jszip.min.js'));},
  }],
  server:{host:'127.0.0.1',port:5174,strictPort:true,fs:{allow:[path.resolve(root,'../..')]}},
  preview:{host:'127.0.0.1',port:4174,strictPort:true},
  build:{outDir:'build',emptyOutDir:true},
}));
