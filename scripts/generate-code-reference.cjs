/** Generate a source-linked HTML reference from JSDoc blocks using the installed TypeScript parser. */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('../angular/node_modules/typescript');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'submission/a2-feedback-review');
const folders = ['api', 'angular/projects/public/src', 'angular/projects/admin/src', 'angular/projects/shared/src'];
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function files(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return ['node_modules','test'].includes(entry.name) ? [] : files(full);
    return /\.(?:js|ts)$/.test(entry.name) && !/\.spec\.ts$/.test(entry.name) ? [full] : [];
  });
}
const entries = [];
for (const file of folders.flatMap(folder => files(path.join(root, folder)))) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  function visit(node) {
    if (node.jsDoc?.length) {
      const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
      entries.push({file:path.relative(root,file).replaceAll('\\','/'),line,
        symbol:node.name?.getText(source) || ts.SyntaxKind[node.kind],
        documentation:node.jsDoc.map(doc => doc.getText(source)).join('\n')});
    }
    ts.forEachChild(node,visit);
  }
  visit(source);
}
if (!entries.length) throw new Error('No JSDoc documentation found.');
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'code-reference.json'), JSON.stringify(entries,null,2));
fs.writeFileSync(path.join(output,'code-reference.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><title>A3 code reference</title><style>body{font:16px/1.6 Arial;max-width:1000px;margin:40px auto;padding:0 24px;color:#17201d}h1,h2{color:#0f4c5c}section{border-top:1px solid #bbb;padding:18px 0}pre{white-space:pre-wrap;background:#f1f6f3;padding:18px;overflow-wrap:anywhere}small{color:#52645b}</style><h1>A3 source documentation</h1><p>Generated from ${entries.length} JSDoc blocks in JavaScript and TypeScript. This is a focused reference, not a claim that every private member is documented. Rebuild using <code>node scripts/generate-code-reference.cjs</code> after installing angular dependencies.</p>${entries.map(e=>`<section><h2>${escape(e.symbol)}</h2><small>${escape(e.file)}:${e.line}</small><pre>${escape(e.documentation)}</pre></section>`).join('')}</html>`);
console.log(`Generated ${entries.length} documented declarations: ${path.join(output,'code-reference.html')}`);
