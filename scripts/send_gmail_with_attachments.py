#!/usr/bin/env python3
"""Send MAGG CRM HTML email with optional underwriting attachments.

Recipient is intentionally restricted to Eduardo's approved SmartRental address.
"""
import argparse, base64, json, mimetypes, sys
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

WORKDIR = Path('/Users/tenacitas/.openclaw/workspace')
TOKEN = WORKDIR / '.credentials' / 'gmail_token.json'
DEFAULT_TO = 'e.martin@smartrental.com'
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def load_creds():
    creds = Credentials.from_authorized_user_file(str(TOKEN), SCOPES)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        TOKEN.write_text(creds.to_json(), encoding='utf-8')
    if not creds or not creds.valid:
        raise RuntimeError('Gmail credentials are not valid')
    return creds

def attach_file(msg, path: Path):
    ctype, _ = mimetypes.guess_type(path.name)
    maintype, subtype = (ctype or 'application/octet-stream').split('/', 1)
    part = MIMEBase(maintype, subtype)
    part.set_payload(path.read_bytes())
    encoders.encode_base64(part)
    part.add_header('Content-Disposition', 'attachment', filename=path.name)
    msg.attach(part)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--to', default=DEFAULT_TO)
    ap.add_argument('--subject', required=True)
    ap.add_argument('--html-file', required=True)
    ap.add_argument('--attach', action='append', default=[])
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()
    if args.to.strip().lower() != DEFAULT_TO:
        raise ValueError('Refusing non-approved recipient for MAGG CRM/deal emails')
    html = Path(args.html_file).read_text(encoding='utf-8')
    attachments = [Path(p) for p in args.attach]
    for p in attachments:
        if not p.exists():
            raise FileNotFoundError(p)
    if args.dry_run:
        print(json.dumps({'status':'dry_run','to':args.to,'subject':args.subject,'attachments':[str(p) for p in attachments]}, ensure_ascii=False))
        return 0
    msg = MIMEMultipart()
    msg['To'] = args.to
    msg['Subject'] = args.subject
    msg['From'] = 'Hermes'
    msg.attach(MIMEText(html, 'html', 'utf-8'))
    for p in attachments:
        attach_file(msg, p)
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode('ascii')
    res = build('gmail', 'v1', credentials=load_creds()).users().messages().send(userId='me', body={'raw': raw}).execute()
    print(json.dumps({'status':'sent','id':res.get('id'),'threadId':res.get('threadId'),'to':args.to,'attachments':len(attachments)}, ensure_ascii=False))
    return 0

if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as e:
        print(json.dumps({'status':'error','error':str(e)}, ensure_ascii=False), file=sys.stderr)
        raise
