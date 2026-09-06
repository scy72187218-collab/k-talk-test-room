export default async function handler(req,res){
  try{
    const host=req.headers.host||'k-talk-new-room.vercel.app';
    const proto=(req.headers['x-forwarded-proto']||'https').split(',')[0];
    const r=await fetch(`${proto}://${host}/index.html?static=1`,{
      headers:{'user-agent':req.headers['user-agent']||'K-Talk','cache-control':'no-cache'}
    });
    let html=await r.text();

    const soundFix=`<script id="ktAutoSoundFix">(function(){
      var unlocked=false;
      function currentVideos(){return [].slice.call(document.querySelectorAll('video.pub, #remoteVideo'));}
      function apply(){
        if(!unlocked)return;
        currentVideos().forEach(function(v){
          try{
            v.muted=false;
            v.defaultMuted=false;
            v.volume=1;
            v.removeAttribute('muted');
            var p=v.play();if(p&&p.catch)p.catch(function(){});
          }catch(e){}
        });
      }
      function unlock(){
        if(unlocked)return;
        unlocked=true;
        try{sessionStorage.setItem('ktalk_sound_unlocked','1');}catch(e){}
        apply();
      }
      try{unlocked=sessionStorage.getItem('ktalk_sound_unlocked')==='1';}catch(e){}
      if(unlocked)setTimeout(apply,0);
      ['pointerdown','touchstart','click'].forEach(function(ev){document.addEventListener(ev,unlock,{capture:true,passive:true});});
      document.addEventListener('scroll',apply,true);
      var mo=new MutationObserver(function(){setTimeout(apply,0);});
      mo.observe(document.documentElement,{subtree:true,childList:true});
      setInterval(apply,1200);
    })();</script>`;

    html=html.replace('</body>',soundFix+'</body>');
    res.status(r.status);
    res.setHeader('content-type','text/html; charset=utf-8');
    res.setHeader('cache-control','no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('x-ktalk-independent','1');
    res.send(html);
  }catch(e){
    res.status(500).send('K-Talk loading error');
  }
}
