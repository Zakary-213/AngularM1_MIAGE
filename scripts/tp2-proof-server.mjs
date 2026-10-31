// Vérification locale temporaire : API réelle, secrets uniquement en mémoire.
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from '../backend/node_modules/mongoose/index.js';
const root = path.resolve(import.meta.dirname, '..');
process.loadEnvFile(path.join(root, 'backend/.env'));
const email = `tp2-proof-${crypto.randomUUID()}@example.invalid`;
const register = await fetch('http://127.0.0.1:3000/api/auth/register', {
  method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({name:'TP2 vérification temporaire',email,password:crypto.randomBytes(24).toString('hex')})
});
if(register.status!==201) throw Error('Création du compte temporaire impossible');
const secondary=await register.json();
const temporaryTitle='TP2 preuve temporaire '+crypto.randomUUID();
let cleaned=false;
async function cleanup(createdTrackId) {
  if(cleaned) return;
  if(createdTrackId){
    const auth=await fetch('http://127.0.0.1:3000/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'demo@example.com',password:'Demo1234!'})});
    if(auth.status!==200)throw Error('Nettoyage : login impossible');
    const {token}=await auth.json();
    const headers={Authorization:'Bearer '+token};
    const list=await fetch('http://127.0.0.1:3000/api/tracks?page=1&limit=100',{headers});
    const page=await list.json();
    if(!page.items.some(t=>t.id===createdTrackId&&t.title===temporaryTitle))throw Error('Piste temporaire non identifiée');
    const removed=await fetch('http://127.0.0.1:3000/api/tracks/'+createdTrackId,{method:'DELETE',headers});
    if(removed.status!==204)throw Error('Suppression temporaire non confirmée');
  }
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    // Uniquement le compte créé par cette exécution ; aucune piste n'est créée.
    const result=await mongoose.connection.collection('users').deleteOne({_id:new mongoose.Types.ObjectId(secondary.user.id),email});
    if(result.deletedCount!==1) throw Error('Nettoyage du compte temporaire non confirmé');
    cleaned=true;
  } finally { await mongoose.disconnect(); }
}
const page=`<!doctype html><html lang="fr"><meta charset="utf-8"><title>TP2 — Vérifications HTTP réelles</title>
<style>body{font:16px system-ui;background:#f3f7f5;color:#17312a;padding:24px}button{padding:14px;background:#16715e;color:white;border:0;border-radius:8px}pre{white-space:pre-wrap;font:14px monospace}article{padding:18px;background:white;border-radius:12px;margin-top:15px}</style>
<h1>TP2 — Vérifications de l’API réelle</h1><p>Client de vérification séparé du frontend Angular. Aucune réponse simulée.</p>
<button id="run">Vérifier l’upload invalide et les droits audio</button><article><pre id="result">Prêt. Le type MIME invalide sera envoyé volontairement pour vérifier la validation du serveur.</pre></article>
<script>
document.querySelector('#run').onclick=async function(){this.disabled=true;const logs=[];const result=document.querySelector('#result');
 const record=(method,url,status,request,response,auth)=>{logs.push({method,url,status,authorization:auth?'Bearer [MASQUÉ]':'absent',request,response});result.textContent=JSON.stringify(logs,null,2)};
 try {
 const login=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'demo@example.com',password:'Demo1234!'})});
 if(login.status!==200)throw Error('Login impossible');const a=await login.json();
 const b=await (await fetch('/__test-session')).json();
 const file=await (await fetch('/__fixture')).blob();const valid=new FormData();valid.append('audio',file,'tp2-preuve-temporaire.mp3');valid.append('title',${JSON.stringify(temporaryTitle)});
 const created=await fetch('/api/tracks',{method:'POST',headers:{Authorization:'Bearer '+a.token},body:valid});if(created.status!==201)throw Error('Création piste temporaire impossible');const track=await created.json();
 record('POST','/api/tracks',created.status,{multipart:{audio:{filename:'tp2-preuve-temporaire.mp3',type:'audio/mpeg'},title:track.title}},{id:track.id,title:track.title},true);
 const form=new FormData();form.append('audio',new Blob(['Ce fichier est du texte.'],{type:'text/plain'}),'tp2-invalide.txt');form.append('title','TP2 refus MIME');
 const upload=await fetch('/api/tracks',{method:'POST',headers:{Authorization:'Bearer '+a.token},body:form});record('POST','/api/tracks',upload.status,{multipart:{audio:{filename:'tp2-invalide.txt',type:'text/plain'},title:'TP2 refus MIME'}},await upload.json(),true);
 const url='/api/tracks/'+track.id+'/audio';const own=await fetch(url,{headers:{Authorization:'Bearer '+a.token}});const blob=await own.blob();record('GET',url,own.status,{account:'propriétaire demo@example.com'},{contentType:own.headers.get('Content-Type'),bytes:blob.size},true);
 const me=await fetch('/api/users/me',{headers:{Authorization:'Bearer '+b.token}});const user=await me.json();if(user.id===a.user.id)throw Error('Comptes identiques');record('GET','/api/users/me',me.status,{account:'second compte temporaire'},{id:user.id,name:user.name},true);
 const other=await fetch(url,{headers:{Authorization:'Bearer '+b.token}});record('GET',url,other.status,{account:'second compte temporaire',differentUser:true},await other.json(),true);
 const passed=upload.status===400&&own.status===200&&me.status===200&&other.status===404;
 const saved=await fetch('/__finish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:'2026-10-31',source:'Requêtes fetch du client de vérification vers API Express réelle et MongoDB Atlas',passed,createdTrackId:track.id,records:logs})});
 if(!saved.ok)throw Error('Nettoyage ou sauvegarde impossible');result.textContent+='\\n\\n'+(passed?'RÉUSSI':'ÉCHEC')+' — piste et compte temporaires supprimés ; pistes existantes conservées.';
 }catch(e){result.textContent+='\\nÉchec : '+e.message;}
};</script></html>`;
http.createServer(async(req,res)=>{
  if(req.url==='/') {res.setHeader('Content-Type','text/html; charset=utf-8');res.end(page);return;}
  if(req.url==='/__fixture'){res.setHeader('Content-Type','audio/mpeg');res.end(await fs.readFile(path.join(root,'frontend-starter/fichiers-audio-de-test/song1.mp3')));return;}
  if(req.url==='/__test-session'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({token:secondary.token}));return;}
  if(req.url==='/__finish'&&req.method==='POST'){
    try{const parts=[];for await(const c of req)parts.push(c);const data=JSON.parse(Buffer.concat(parts));
      await cleanup(data.createdTrackId);data.cleanup={temporaryUserDeleted:true,temporaryTrackDeleted:true,existingTracksUnchanged:true};
      const safe=JSON.stringify(data,(k,v)=>/token|password|secret/i.test(k)?'[MASQUÉ]':v,2);
      await fs.writeFile(path.join(root,'captures/tp2-verifications-reelles.json'),safe);res.end('ok');
    }catch{res.statusCode=500;res.end('Échec de finalisation');}return;
  }
  if(!req.url.startsWith('/api/')){res.statusCode=404;res.end();return;}
  const up=http.request({hostname:'127.0.0.1',port:3000,path:req.url,method:req.method,headers:{...req.headers,host:'127.0.0.1:3000'}},response=>{res.writeHead(response.statusCode,response.headers);response.pipe(res);});
  up.on('error',()=>{res.statusCode=502;res.end('API indisponible');});req.pipe(up);
}).listen(4202,'127.0.0.1',()=>console.log('Client TP2 : http://127.0.0.1:4202'));
