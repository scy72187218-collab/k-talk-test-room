const SOURCES=[
  'https://zupwbfmacwzexyvznlzq.supabase.co/storage/v1/object/public/ktalk-videos/guest/1788516701116-emysxm.mp4',
  'https://zupwbfmacwzexyvznlzq.supabase.co/storage/v1/object/public/ktalk-videos/guest/1788516656323-4elqcf.mp4',
  'https://zupwbfmacwzexyvznlzq.supabase.co/storage/v1/object/public/ktalk-videos/guest/1788516618159-4ep5ki.mp4'
];

function cappedRange(value){
  const MAX=2*1024*1024;
  const m=/bytes=(\d*)-(\d*)/i.exec(String(value||''));
  if(!m)return 'bytes=0-'+(MAX-1);
  const start=parseInt(m[1]||'0',10)||0;
  let end=m[2]?parseInt(m[2],10):start+MAX-1;
  if(!Number.isFinite(end)||end<start)end=start+MAX-1;
  end=Math.min(end,start+MAX-1);
  return 'bytes='+start+'-'+end;
}

export default async function handler(req,res){
  try{
    const n=Math.max(0,Math.min(SOURCES.length-1,parseInt((req.query&&req.query.i)||'0',10)||0));
    const range=cappedRange(req.headers.range);
    const r=await fetch(SOURCES[n],{
      headers:{
        'user-agent':req.headers['user-agent']||'K-Talk-Video',
        'range':range,
        'accept':'video/mp4,*/*'
      },
      cache:'no-store'
    });

    res.status(r.status===200?206:r.status);
    ['content-type','content-range','content-length','accept-ranges','etag','last-modified'].forEach(function(name){
      const value=r.headers.get(name);
      if(value)res.setHeader(name,value);
    });
    if(!res.getHeader('content-type'))res.setHeader('content-type','video/mp4');
    res.setHeader('accept-ranges','bytes');
    res.setHeader('cache-control','public, max-age=300, stale-while-revalidate=600');
    res.setHeader('content-disposition','inline');
    res.setHeader('access-control-allow-origin','*');
    res.setHeader('x-ktalk-video-range',range);

    if(req.method==='HEAD')return res.end();
    const buf=Buffer.from(await r.arrayBuffer());
    if(!res.getHeader('content-length'))res.setHeader('content-length',String(buf.length));
    return res.send(buf);
  }catch(e){
    res.status(502).setHeader('cache-control','no-store');
    return res.end();
  }
}
