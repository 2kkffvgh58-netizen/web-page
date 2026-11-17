const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const clean=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
export async function onRequestGet({env}){
 if(!env.REVIEWS_DB)return reply({error:'Reviews are not configured.'},503);
 try{const {results}=await env.REVIEWS_DB.prepare("SELECT id,name,rating,body,created_at FROM reviews WHERE status='approved' ORDER BY created_at DESC LIMIT 30").all();return reply({reviews:results});}
 catch(e){return reply({error:'Reviews temporarily unavailable.'},503);}
}
export async function onRequestPost({request,env}){
 if(!env.REVIEWS_DB)return reply({error:'Reviews are not configured.'},503);
 if(!(request.headers.get('content-type')||'').includes('application/json'))return reply({error:'Invalid request format.'},415);
 if(Number(request.headers.get('content-length')||0)>8000)return reply({error:'Submission too large.'},413);
 let data;try{data=await request.json();}catch{return reply({error:'Invalid JSON.'},400);}
 if(clean(data.website,200))return reply({message:'Review received.'},202);
 const name=clean(data.name,80),body=clean(data.body,1500),rating=Number(data.rating);
 if(name.length<2||body.length<15||body.length>1500||!Number.isInteger(rating)||rating<1||rating>5)return reply({error:'Please provide a name, a rating from 1–5, and a review of at least 15 characters.'},400);
 if(env.TURNSTILE_SECRET){
  const token=clean(data.turnstileToken,4096);if(!token)return reply({error:'Please complete the spam verification.'},400);
  const fd=new FormData();fd.append('secret',env.TURNSTILE_SECRET);fd.append('response',token);
  try{const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:fd});const v=await r.json();if(!v.success)return reply({error:'Spam verification failed.'},403);}catch{return reply({error:'Spam verification unavailable.'},503);}
 }
 try{await env.REVIEWS_DB.prepare("INSERT INTO reviews (id,name,rating,body,status) VALUES (?,?,?,?, 'pending')").bind(crypto.randomUUID(),name,rating,body).run();return reply({message:'Review received and awaiting approval.'},202);}
 catch{return reply({error:'Unable to save review right now.'},503);}
}
