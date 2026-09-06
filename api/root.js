export default async function handler(req,res){
  const target='https://k-talk-live-final.vercel.app/';
  const r=await fetch(target,{headers:{'user-agent':req.headers['user-agent']||'K-Talk-Proxy','cache-control':'no-cache'}});
  let html=await r.text();
  const video='/api/video?i=0&v=20260906-mobile02';

  html=html.replace(/\s+poster="https:\/\/images\.unsplash\.com\/photo-1500530855697-b586d89ba3ee[^\"]*"/g,'');
  html=html.replace(/https:\/\/interactive-examples\.mdn\.mozilla\.net\/media\/cc0-videos\/flower\.mp4/g,video);
  html=html.replace(/https:\/\/zupwbfmacwzexyvznlzq\.supabase\.co\/storage\/v1\/object\/public\/ktalk-videos\/guest\/1788516701116-emysxm\.mp4/g,video);
  html=html.replace(/camera-recovery\.js\?v=20260904-camera02/g,'camera-recovery.js?v=20260906-camera-root02');

  const mobileFix=`<script id="ktNewAddressVideoFix">(function(){
    var VERSION='20260906-mobile02';
    function desired(i){return '/api/video?i='+i+'&v='+VERSION;}
    function setVideo(v,i){
      if(!v)return;
      i=Math.max(0,Math.min(2,Number(i)||0));
      var want=desired(i);
      if(v.getAttribute('src')===want)return;
      v.__ktNewVideoIndex=i;
      try{v.pause();}catch(e){}
      while(v.firstChild)v.removeChild(v.firstChild);
      v.removeAttribute('poster');
      v.src=want;
      v.preload='auto';
      v.muted=true;v.defaultMuted=true;v.volume=0;v.autoplay=true;v.loop=true;
      v.setAttribute('muted','');v.setAttribute('autoplay','');v.setAttribute('loop','');
      v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');
      try{v.load();}catch(e){}
      try{var p=v.play();if(p&&p.catch)p.catch(function(){});}catch(e){}
      clearTimeout(v.__ktNewVideoWait);
      v.__ktNewVideoWait=setTimeout(function(){
        if(v.isConnected&&v.readyState<2&&v.__ktNewVideoIndex===i&&i<2)setVideo(v,i+1);
      },5000);
    }
    function wire(v){
      if(!v)return;
      if(!v.__ktNewVideoEvents){
        v.__ktNewVideoEvents=true;
        v.addEventListener('loadeddata',function(){
          clearTimeout(v.__ktNewVideoWait);
          try{var p=v.play();if(p&&p.catch)p.catch(function(){});}catch(e){}
        });
        v.addEventListener('error',function(){
          var i=Number(v.__ktNewVideoIndex)||0;
          if(i<2)setTimeout(function(){setVideo(v,i+1);},120);
        });
      }
      var raw=String(v.getAttribute('src')||'');
      if(raw.indexOf('/api/video?i=')!==0)setVideo(v,Number(v.__ktNewVideoIndex)||0);
      else{
        v.removeAttribute('poster');
        v.muted=true;v.defaultMuted=true;v.autoplay=true;v.loop=true;
        try{var p=v.play();if(p&&p.catch)p.catch(function(){});}catch(e){}
      }
    }
    function scan(){wire(document.getElementById('homeVideo'));}
    var obs=new MutationObserver(scan);
    obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
    scan();setTimeout(scan,80);setTimeout(scan,450);setTimeout(scan,1000);
  })();</script>`;
  html=html.replace('</body>',mobileFix+'</body>');

  res.status(r.status);
  res.setHeader('content-type','text/html; charset=utf-8');
  res.setHeader('cache-control','no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('x-ktalk-root-fix','3');
  res.send(html);
}
