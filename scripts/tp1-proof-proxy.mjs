// Relais local de vérification : aucune valeur de mot de passe/JWT n'est écrite.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'captures/tp1-requetes-reelles.json');
const modeFile = path.join(root, 'scripts/.tp1-invalid-next');
const records = [];
const clean = value => Array.isArray(value) ? value.map(clean) : value && typeof value === 'object'
  ? Object.fromEntries(Object.entries(value).map(([k,v]) => [k, /password|token|secret|authorization/i.test(k) ? '[MASQUÉ]' : clean(v)])) : value;
const parse = buffer => { try { return clean(JSON.parse(buffer.toString())); } catch { return '[Corps non JSON omis]'; } };
const escape = value => JSON.stringify(value, null, 2).replaceAll('&','&amp;').replaceAll('<','&lt;');
http.createServer((req,res) => {
  if (req.url === '/__tp1/preuves') {
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.end(`<!doctype html><html lang="fr"><meta charset="utf-8"><title>TP1 — Requêtes réelles expurgées</title><style>body{font:16px system-ui;margin:32px;background:#f2f6fa;color:#132b42}article{background:white;padding:20px;margin:18px 0;border-radius:12px}pre{white-space:pre-wrap;font-size:13px}h1{font-size:25px}</style><h1>TP1 — Requêtes HTTP réellement observées</h1><p>Relais local 127.0.0.1:4201 → API 3000. Secrets masqués avant écriture. Ce journal n’est pas le panneau DevTools Network.</p>${records.filter(x=>x.url.includes('/auth/')||x.url.includes('/users/me')).map(x=>`<article><h2>${x.method} ${x.url} — HTTP ${x.status}</h2><pre>${escape(x)}</pre></article>`).join('')}</html>`);
    return;
  }
  const api = req.url.startsWith('/api/');
  const chunks=[];
  req.on('data', c=>chunks.push(c));
  req.on('end',()=>{
    const body=Buffer.concat(chunks);
    const headers={...req.headers,host:api?'localhost:3000':'127.0.0.1:4200'};
    let injected=false;
    if(api && req.url === '/api/users/me' && fs.existsSync(modeFile)) {
      fs.unlinkSync(modeFile); headers.authorization='Bearer tp1-invalid-signature'; injected=true;
    }
    const upstream=http.request({hostname:'127.0.0.1',port:api?3000:4200,path:req.url,method:req.method,headers},up=>{
      res.writeHead(up.statusCode,up.headers);
      const received=[];
      up.on('data',c=>{res.write(c);if(api)received.push(c);});
      up.on('end',()=>{
        if(api){
          records.push({observedAt:new Date().toISOString(),method:req.method,url:req.url,
            authorization:headers.authorization?'Bearer [MASQUÉ]':'absent',
            ...(injected?{testCondition:'JWT remplacé par un jeton invalide dans le relais, avant envoi à l’API'}:{}),
            requestContentType:headers['content-type']??null,requestBody:body.length?parse(body):null,
            status:up.statusCode,responseContentType:up.headers['content-type']??null,
            responseBody:parse(Buffer.concat(received))});
          fs.writeFileSync(output,JSON.stringify({date:'2026-10-31',source:'Relais HTTP local ; réponses API réelles ; aucun mock',records},null,2));
        }
        res.end();
      });
    });
    upstream.on('error',()=>{res.writeHead(502);res.end('Service local indisponible');});
    upstream.end(body);
  });
}).listen(4201,'127.0.0.1',()=>console.log('Relais TP1 : http://127.0.0.1:4201'));
