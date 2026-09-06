const SOURCES=[
  {url:'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',size:1128375},
  {url:'https://zupwbfmacwzexyvznlzq.supabase.co/storage/v1/object/public/ktalk-videos/guest/1788516701116-emysxm.mp4',size:6910677},
  {url:'https://zupwbfmacwzexyvznlzq.supabase.co/storage/v1/object/public/ktalk-videos/guest/1788516656323-4elqcf.mp4',size:15576757}
];
const MAX_CHUNK=2*1024*1024;

function parseRange(value,total){
  const raw=String(value||'').trim();
  if(!raw){
    const start=0,end=Math.min(total-1,MAX_CHUNK-1);
    return {start,end,header:'bytes='+start+'-'+end};
  }
  let m=/^bytes=(\d+)-(\d*)$/i.exec(raw);
  if(m){
    const start=parseInt(m[1],10);
    if(!Number.isFinite(start)||start>=total)return null;
    let end=m[2]?parseInt(m[2],10):Math.min(total-1,start+MAX_CHUNK-1);
    if(!Number.isFinite(end)||end<start)return null;
    end=Math.min(total-1,end,start+MAX_CHUNK-1);
    return {start,end,header:'bytes='+start+'-'+end};
  }
  m=/^bytes=-(\d+)$/i.exec(raw);
  if(m){
    let count=parseInt(m[1],10);
    if(!Number.isFinite(count)||count<=0)return null;
    count=Math.min(total,MAX_CHUNK,count);
    const start=Math.max(0,total-count),end=total-1;
    return {start,end,header:'bytes='+start+'-'+end};
  }
  return null;
}

async function fetchChunk(source,range,userAgent){
  const r=await fetch(source.url,{
    headers:{
      'user-agent':userAgent||'K-Talk-Video',
      'range':range.header,
      'accept':'video/mp4,*/*'
    },
    cache:'no-store'
  });
  let buf=Buffer.from(await r.arrayBuffer());
  const expected=range.end-range.start+1;

  if(r.status===200&&buf.length>=source.size){
    buf=buf.subarray(range.start,range.end+1);
  }else if(buf.length>expected){
    buf=buf.subarray(0,expected);
  }
  return {response:r,buf};
}

export default async function handler(req,res){
  try{
    const n=Math.max(0,Math.min(SOURCES.length-1,parseInt((req.query&&req.query.i)||'0',10)||0));
    const source=SOURCES[n];

    if(req.query&&req.query.debug==='1'){
      const head=await fetch(source.url,{method:'HEAD',headers:{'user-agent':req.headers['user-agent']||'K-Talk-Debug'},cache:'no-store'});
      const first=await fetch(source.url,{headers:{'user-agent':req.headers['user-agent']||'K-Talk-Debug','range':'bytes=0-63'},cache:'no-store'});
      const firstBuf=Buffer.from(await first.arrayBuffer());
      const tailStart=Math.max(0,source.size-256);
      const tail=await fetch(source.url,{headers:{'user-agent':req.headers['user-agent']||'K-Talk-Debug','range':'bytes='+tailStart+'-'+(source.size-1)},cache:'no-store'});
      const tailBuf=Buffer.from(await tail.arrayBuffer());
      res.status(200).setHeader('content-type','application/json; charset=utf-8').setHeader('cache-control','no-store');
      return res.end(JSON.stringify({
        source:n,knownSize:source.size,
        headStatus:head.status,headType:head.headers.get('content-type'),headLength:head.headers.get('content-length'),headRanges:head.headers.get('accept-ranges'),
        firstStatus:first.status,firstRange:first.headers.get('content-range'),firstBytes:firstBuf.length,firstHex:firstBuf.subarray(0,24).toString('hex'),
        tailStatus:tail.status,tailRange:tail.headers.get('content-range'),tailBytes:tailBuf.length,tailHasMoov:tailBuf.indexOf(Buffer.from('moov'))>=0
      }));
    }

    const range=parseRange(req.headers.range,source.size);
    if(!range){
      res.status(416);
      res.setHeader('content-range','bytes */'+source.size);
      res.setHeader('accept-ranges','bytes');
      return res.end();
    }

    const out=await fetchChunk(source,range,req.headers['user-agent']);
    const r=out.response,buf=out.buf;
    if(!r.ok&&r.status!==206){
      res.status(r.status||502).setHeader('cache-control','no-store');
      return res.end();
    }
    if(!buf.length){
      res.status(502).setHeader('cache-control','no-store');
      return res.end();
    }

    const actualEnd=Math.min(source.size-1,range.start+buf.length-1);
    res.status(206);
    res.setHeader('content-type',r.headers.get('content-type')||'video/mp4');
    res.setHeader('content-range','bytes '+range.start+'-'+actualEnd+'/'+source.size);
    res.setHeader('content-length',String(buf.length));
    res.setHeader('accept-ranges','bytes');
    res.setHeader('cache-control','public, max-age=300, stale-while-revalidate=600');
    res.setHeader('content-disposition','inline');
    res.setHeader('access-control-allow-origin','*');
    res.setHeader('x-ktalk-video-range','bytes='+range.start+'-'+actualEnd);
    if(req.method==='HEAD')return res.end();
    return res.send(buf);
  }catch(e){
    res.status(502).setHeader('content-type','application/json; charset=utf-8').setHeader('cache-control','no-store');
    return res.end(JSON.stringify({error:String(e&&e.message||e)}));
  }
}
