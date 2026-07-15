import fs from 'node:fs'; import path from 'node:path'; const AUDIT_PATH=process.env.MAGG_CRM_AUDIT_LOG||path.resolve('private/audit/events.jsonl');
export function audit(event){fs.mkdirSync(path.dirname(AUDIT_PATH),{recursive:true}); fs.appendFileSync(AUDIT_PATH,JSON.stringify({...event,at:new Date().toISOString()})+'\n')}
