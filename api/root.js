export default async function handler(req,res){
  try{
    const host=req.headers.host||'k-talk-new-room.vercel.app';
    const proto=(req.headers['x-forwarded-proto']||'https').split(',')[0];
    const r=await fetch(`${proto}://${host}/index.html?static=1`,{
      headers:{'user-agent':req.headers['user-agent']||'K-Talk','cache-control':'no-cache'}
    });
    let html=await r.text();

    const soundFix=`<script id="ktAutoSoundFix">(function(){
      var unlocked=false,raf=0,soundVideo=null;

      function cards(){return [].slice.call(document.querySelectorAll('#feed .card'));}
      function currentIndex(list){
        if(!list.length)return -1;
        var cy=(window.innerHeight-76)/2,best=0,dist=1e9;
        list.forEach(function(c,i){var r=c.getBoundingClientRect(),d=Math.abs((r.top+r.bottom)/2-cy);if(d<dist){dist=d;best=i;}});
        return best;
      }
      function prepare(v,mode){
        if(!v)return;
        var lazy=v.getAttribute('data-src');
        if(lazy&&!v.getAttribute('src')){
          v.src=lazy;
          v.removeAttribute('data-src');
          try{v.load();}catch(e){}
        }
        v.preload=mode||'auto';
        v.setAttribute('playsinline','');
        v.setAttribute('webkit-playsinline','');
      }
      function mute(v){
        if(!v)return;
        try{v.muted=true;v.defaultMuted=true;v.volume=0;v.setAttribute('muted','');}catch(e){}
      }
      function sound(v){
        if(!v)return;
        try{v.muted=false;v.defaultMuted=false;v.volume=1;v.removeAttribute('muted');}catch(e){}
      }
      function play(v){try{var p=v.play();if(p&&p.catch)p.catch(function(){});}catch(e){}}

      function tune(){
        raf=0;
        var list=cards(),idx=currentIndex(list);
        if(idx<0)return;
        list.forEach(function(c,i){
          var v=c.querySelector('video.pub');
          if(!v)return;
          if(i===idx){
            prepare(v,'auto');
            if(v===soundVideo&&unlocked)sound(v);else mute(v);
            play(v);
          }else if(i===idx+1||i===idx+2){
            prepare(v,'auto');
            mute(v);
            if(i===idx+1)play(v);
          }else{
            mute(v);
            try{v.pause();}catch(e){}
          }
          if(!v.__ktTapFixed){
            v.__ktTapFixed=true;
            v.onclick=function(){
              unlocked=true;
              soundVideo=v;
              sound(v);
              if(v.paused)play(v);else{try{v.pause();}catch(e){}}
              return false;
            };
          }
        });
      }
      function schedule(){if(raf)return;raf=requestAnimationFrame(tune);}

      function activateCurrent(){
        unlocked=true;
        var list=cards(),idx=currentIndex(list);
        if(idx<0)return;
        var c=list[idx],v=c&&c.querySelector('video.pub');
        if(v){
          if(soundVideo&&soundVideo!==v)mute(soundVideo);
          soundVideo=v;
          prepare(v,'auto');
          sound(v);
          play(v);
          var n=list[idx+1]&&list[idx+1].querySelector('video.pub');
          var n2=list[idx+2]&&list[idx+2].querySelector('video.pub');
          if(n){prepare(n,'auto');mute(n);play(n);}
          if(n2){prepare(n2,'auto');mute(n2);}
        }
        var rv=document.getElementById('remoteVideo');
        var box=document.getElementById('remote');
        if(rv&&box&&box.classList.contains('show')){soundVideo=rv;sound(rv);play(rv);}
      }

      function gesture(){activateCurrent();}
      document.addEventListener('pointerdown',gesture,{capture:true,passive:true});
      document.addEventListener('pointermove',gesture,{capture:true,passive:true});
      document.addEventListener('touchstart',gesture,{capture:true,passive:true});
      document.addEventListener('touchmove',gesture,{capture:true,passive:true});
      document.addEventListener('touchend',gesture,{capture:true,passive:true});
      document.addEventListener('scroll',schedule,true);
      window.addEventListener('resize',schedule,{passive:true});
      var mo=new MutationObserver(function(){setTimeout(schedule,0);setTimeout(schedule,120);});
      mo.observe(document.documentElement,{subtree:true,childList:true});
      setTimeout(schedule,0);setTimeout(schedule,200);setTimeout(schedule,700);
    })();</script>`;

    html=html.replace('</body>',soundFix+'</body>');
    res.status(r.status);
    res.setHeader('content-type','text/html; charset=utf-8');
    res.setHeader('cache-control','no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('x-ktalk-independent','3');
    res.send(html);
  }catch(e){
    res.status(500).send('K-Talk loading error');
  }
}
