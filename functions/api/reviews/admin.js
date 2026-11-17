const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
async function authorized(request,env){
 const expected=env.REVIEW_ADMIN_TOKEN;
 const given=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
 if(!expected||!given||given.length!==expected.length)return false;
 const a=new TextEncoder().encode(given),b=new TextEncoder().encode(expected);let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;
}
export async function onRequest({request,env}){
 if(!await authorized(request,env))return reply({error:'Unauthorized.'},401);
 if(!env.REVIEWS_DB)return reply({error:'Database not configured.'},503);
 try{
  if(request.method==='GET'){
   const {results}=await env.REVIEWS_DB.prepare("SELECT id,name,rating,body,status,created_at FROM reviews ORDER BY created_at DESC LIMIT 200").all();return reply({reviews:results});
  }
  if(request.method==='POST'){
   const data=await request.json();if(typeof data.id!=='string'||!/^[-a-f0-9]{36}$/i.test(data.id)||!['approve','delete'].includes(data.action))return reply({error:'Invalid moderation request.'},400);
   const sql=data.action==='approve'?"UPDATE reviews SET status='approved' WHERE id=?":"DELETE FROM reviews WHERE id=?";
   const r=await env.REVIEWS_DB.prepare(sql).bind(data.id).run();return reply({success:true,changed:r.meta?.changes||0});
  }
  return reply({error:'Method not allowed.'},405);
 }catch{return reply({error:'Unable to process moderation request.'},503);}
}
