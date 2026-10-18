const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const ts=require('../angular/node_modules/typescript');
const changed=cp.execFileSync('git',['diff','--name-only'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(p=>/\.(js|ts)$/.test(p));
function tokens(text){text=text.replace(/\r\n/g,"\n");const s=ts.createScanner(ts.ScriptTarget.Latest,true,ts.LanguageVariant.Standard,text);const out=[];let t;while((t=s.scan())!==ts.SyntaxKind.EndOfFileToken)out.push([t,s.getTokenText()]);return JSON.stringify(out);}
for(const p of changed){const before=cp.execFileSync('git',['show','HEAD:'+p],{encoding:'utf8'}),after=fs.readFileSync(p,'utf8');if(tokens(before)!==tokens(after))throw Error('Non-comment token change: '+p);const parsed=ts.createSourceFile(p,after,ts.ScriptTarget.Latest,true);if(parsed.parseDiagnostics.length)throw Error('Parse error: '+p);}
fs.writeFileSync('submission/a2-feedback-review/comment-verification.json',JSON.stringify({result:'passed',files:changed,check:'TypeScript lexer: every non-comment/non-whitespace token unchanged; no parse errors'},null,2));
console.log('PASS: '+changed.length+' source files changed only comments; no parse errors.');
