import crypto from 'node:crypto'; const sessions=new Map();
export function requireConfiguredPassword(){if(!process.env.MAGG_CRM_PASSWORD||process.env.MAGG_CRM_PASSWORD.length<12)throw new Error('MAGG_CRM_PASSWORD must be configured server-side with at least 12 characters')}
export function createSession(user='eduardo'){const sid=crypto.randomBytes(32).toString('hex'); sessions.set(sid,{user,created_at:new Date().toISOString()}); return sid}
export function getSession(req){const sid=req.cookies?.magg_session; return sid?sessions.get(sid):null}
export function requireAuth(req,res,next){const session=getSession(req); if(!session)return res.status(401).json({error:'unauthorized'}); req.session=session; next()}
export function loginHandler(req,res){requireConfiguredPassword(); if(req.body?.password!==process.env.MAGG_CRM_PASSWORD)return res.status(401).json({error:'unauthorized'}); const sid=createSession('eduardo'); res.cookie('magg_session',sid,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:43200000}); res.json({ok:true,user:'eduardo'})}
export function logoutHandler(req,res){const sid=req.cookies?.magg_session; if(sid)sessions.delete(sid); res.clearCookie('magg_session'); res.json({ok:true})}
export function resetSessionsForTests(){sessions.clear()}
