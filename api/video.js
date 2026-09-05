const SOURCES=[
  'https://zupwbfmacwzexyvznlzq.supabase.co/storage/v1/object/public/ktalk-videos/guest/1788516701116-emysxm.mp4',
  'https://zupwbfmacwzexyvznlzq.supabase.co/storage/v1/object/public/ktalk-videos/guest/1788516656323-4elqcf.mp4',
  'https://zupwbfmacwzexyvznlzq.supabase.co/storage/v1/object/public/ktalk-videos/guest/1788516618159-4ep5ki.mp4'
];
export default async function handler(req,res){
  try{
    const n=Math.max(0,Math.min(SOURCES.length-1,parseInt((req.query&&req.query.i)||'0',10)||0));
    const headers={'user-agent':req.headers['user-agent']||'K-Talk-Video'};
    if(req.headers.range)headers.range=req.headers.range;
    const r=await fetch(SOURCES[n],{headers,cache:'no-store'});
    res.status(r.status);
    const ct=r.headers.get('content-type'); if(ct)res.setHeader('content-type',ct);
    const cr=r.headers.get('content-range'); if(cr)res.setHeader('content-range',cr);
    const cl=r.headers.get('content-length'); if(cl)res.setHeader('content-length',cl);
    const ar=r.headers.get('accept-ranges'); res.setHeader('accept-ranges',ar||'bytes');
    res.setHeader('cache-control','no-store, no-cache, must-revalidate, max-age=0');
    const buf=Buffer.from(await r.arrayBuffer());
    res.send(buf);
  }catch(e){
    res.status(502).send('video unavailable');
  }
}
