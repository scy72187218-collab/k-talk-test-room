export default async function handler(req,res){
  try{
    const host=req.headers.host||'k-talk-new-room.vercel.app';
    const proto=(req.headers['x-forwarded-proto']||'https').split(',')[0];
    const r=await fetch(`${proto}://${host}/index.html?static=1`,{
      headers:{'user-agent':req.headers['user-agent']||'K-Talk','cache-control':'no-cache'}
    });
    let html=await r.text();

    const soundFix=`<script id="ktAutoSoundFix">(function(){
      var unlocked=false,raf=0;
      try{unlocked=sessionStorage.getItem('ktalk_sound_unlocked')==='1';}catch(e){}

      function cards(){return [].slice.call(document.querySelectorAll('#feed .card'));}
      function currentIndex(list){
        if(!list.length)return -1;
        var cy=(window.innerHeight-76)/2,best=0,dist=1e9;
        list.forEach(function(c,i){var r=c.getBoundingClientRect(),d=Math.abs((r.top+r.bottom)/2-cy);if(d<dist){dist=d;best=i;}});
        return best;
      }
      function prepareVideo(v,preload){
        if(!v)return;
        var lazy=v.getAttribute('data-src');
        if(lazy&&!v.getAttribute('src')){
          v.src=lazy;v.removeAttribute('data-src');
          try{v.load();}catch(e){}
        }
        v.preload=preload||'metadata';
        v.setAttribute('playsinline','');
        v.setAttribute('webkit-playsinline','');
      }
      function setSound(v,on){
        if(!v)return;
        try{
          v.muted=!on;v.defaultMuted=!on;v.volume=on?1:0;
          if(on)v.removeAttribute('muted');else v.setAttribute('muted','');
        }catch(e){}
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
            prepareVideo(v,'auto');setSound(v,unlocked);play(v);
          }else if(i===idx+1){
            prepareVideo(v,'auto');setSound(v,false);
          }else if(i===idx-1){
            prepareVideo(v,'metadata');setSound(v,false);try{v.pause();}catch(e){}
          }else{
            setSound(v,false);try{v.pause();}catch(e){}
          }
          if(!v.__ktSoundTapFixed){
            v.__ktSoundTapFixed=true;
            v.onclick=function(){
              if(!unlocked){unlock();return false;}
              setSound(v,true);play(v);return false;
            };
          }
        });
        var rv=document.getElementById('remoteVideo');
        if(rv&&document.getElementById('remote')&&document.getElementById('remote').classList.contains('show')){
          setSound(rv,unlocked);if(unlocked)play(rv);
        }
      }
      function schedule(){if(raf)return;raf=requestAnimationFrame(tune);}
      function unlock(){
        if(!unlocked){
          unlocked=true;
          try{sessionStorage.setItem('ktalk_sound_unlocked','1');}catch(e){}
        }
        tune();
      }
      function gesture(){unlock();}
      document.addEventListener('pointerdown',gesture,{capture:true,passive:true});
      document.addEventListener('touchstart',gesture,{capture:true,passive:true});
      document.addEventListener('click',function(e){
        var v=e.target&&e.target.closest?e.target.closest('video.pub'):null;
        if(v){setSound(v,true);play(v);}
      },true);
      document.addEventListener('scroll',schedule,true);
      window.addEventListener('resize',schedule,{passive:true});
      var mo=new MutationObserver(function(){setTimeout(schedule,0);setTimeout(schedule,180);});
      mo.observe(document.documentElement,{subtree:true,childList:true});
      setTimeout(schedule,0);setTimeout(schedule,250);setTimeout(schedule,900);
    })();</script>`;

    html=html.replace('</body>',soundFix+'</body>');
    res.status(r.status);
    res.setHeader('content-type','text/html; charset=utf-8');
    res.setHeader('cache-control','no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('x-ktalk-independent','2');
    res.send(html);
  }catch(e){
    res.status(500).send('K-Talk loading error');
  }
}
