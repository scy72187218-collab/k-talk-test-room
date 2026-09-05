export default async function handler(req,res){
  const target='https://k-talk-live-final.vercel.app/';
  const r=await fetch(target,{headers:{'user-agent':req.headers['user-agent']||'K-Talk-Proxy','cache-control':'no-cache'}});
  let html=await r.text();
  const video='https://zupwbfmacwzexyvznlzq.supabase.co/storage/v1/object/public/ktalk-videos/guest/1788516701116-emysxm.mp4';
  html=html.replace(/\s+poster="https:\/\/images\.unsplash\.com\/photo-1500530855697-b586d89ba3ee[^\"]*"/g,'');
  html=html.replace(/https:\/\/interactive-examples\.mdn\.mozilla\.net\/media\/cc0-videos\/flower\.mp4/g,video);
  html=html.replace(/camera-recovery\.js\?v=20260904-camera02/g,'camera-recovery.js?v=20260906-camera-root01');
  res.status(r.status);
  res.setHeader('content-type','text/html; charset=utf-8');
  res.setHeader('cache-control','no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('x-ktalk-root-fix','1');
  res.send(html);
}
