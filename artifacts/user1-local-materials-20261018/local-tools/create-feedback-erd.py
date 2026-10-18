from pathlib import Path
import re,json,html
root=Path.cwd();out=root/'submission/a2-feedback-review';out.mkdir(exist_ok=True)
sql=(root/'database/a3-fresh-install.sql').read_text()
tables={}
for name,body in re.findall(r'CREATE TABLE (\w+) \((.*?)\n\)',sql,re.S):
 rows=[]
 for line in body.splitlines():
  m=re.match(r'\s*(\w+)\s+((?:INT|VARCHAR|DATETIME|TEXT|DECIMAL|ENUM|TIMESTAMP)\b.*)',line)
  if m:
   field,definition=m.groups();dtype=re.split(r'\s+(?:NOT|DEFAULT|CHARACTER|COLLATE|AUTO_INCREMENT|UNIQUE)',definition)[0].rstrip(',')
   flags=[]
   if 'PRIMARY KEY' in definition:flags.append('PK')
   if (name=='events' and field in ['organisation_id','category_id']) or (name=='registrations' and field=='event_id'):flags.append('FK')
   if name=='categories' and field=='name':flags.append('UQ')
   rows.append((field,dtype,','.join(flags)))
 tables[name]=rows
assert set(tables)=={'organisations','categories','events','registrations'}
mmd=['erDiagram','  organisations ||--o{ events : organises','  categories ||--o{ events : classifies','  events ||--o{ registrations : receives']
for name,rows in tables.items():
 mmd.append('  '+name+' {')
 for field,dtype,flags in rows:
  typ=dtype.split('(')[0].lower();mmd.append('    '+typ+' '+field+(' '+flags if flags else ''))
 mmd.append('  }')
(root/'docs/a3-erd.mmd').write_text('\n'.join(mmd)+'\n')
svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1720" height="1190" viewBox="0 0 1720 1190"><rect width="1720" height="1190" fill="#fbfaf5"/><style>text{font-family:Arial,sans-serif;fill:#17201d}.title{font-size:32px;font-weight:bold}.head{fill:white;font-size:22px;font-weight:bold}.field{font-size:17px}.note{font-size:20px}.edge{stroke:#0f4c5c;stroke-width:3;fill:none}</style>', '<text class="title" x="35" y="48">A3 Charity Events — Entity Relationship Diagram</text>', '<text class="note" x="35" y="82">Derived from database/a3-fresh-install.sql · PK primary key · FK foreign key · UQ unique</text>']
def table(name,x,y,w):
 rows=tables[name];h=58+len(rows)*29
 svg.extend([f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="white" stroke="#9aacaa"/>',f'<rect x="{x}" y="{y}" width="{w}" height="45" rx="8" fill="#0f4c5c"/>',f'<text class="head" x="{x+16}" y="{y+30}">{name}</text>'])
 for i,(field,dtype,flags) in enumerate(rows):
  label=html.escape(field+'  '+dtype+('  ['+flags+']' if flags else ''))
  svg.append(f'<text class="field" x="{x+16}" y="{y+72+i*29}">{label}</text>')
 return h
table('organisations',35,140,475);table('categories',1210,140,475);table('events',580,240,560);table('registrations',580,870,560)
svg.extend(['<path class="edge" d="M510 220 H545 V325 H580"/><text class="note" x="517" y="207">1</text><text class="field" x="529" y="354">0..*</text>', '<path class="edge" d="M1210 220 H1170 V354 H1140"/><text class="note" x="1180" y="207">1</text><text class="field" x="1147" y="383">0..*</text>', '<path class="edge" d="M860 820 V870"/><text class="field" x="875" y="836">1</text><text class="field" x="875" y="862">0..*</text>', '<text class="note" x="35" y="520">Relationships</text><text class="field" x="35" y="558">Each event belongs to one organisation</text><text class="field" x="35" y="586">and one category.</text><text class="field" x="35" y="626">An event may have zero or many registrations.</text><text class="field" x="35" y="654">Each registration refers to one event.</text>', '<text class="note" x="1200" y="520">Registration constraints</text><text class="field" x="1200" y="558">UNIQUE (event_id, email)</text><text class="field" x="1200" y="586">Email comparison is case-insensitive.</text><text class="field" x="1200" y="626">ON DELETE RESTRICT</text><text class="field" x="1200" y="654">ON UPDATE RESTRICT</text><text class="field" x="1200" y="694">tickets &gt; 0; name/email must not be blank.</text>', '<text class="field" x="35" y="1110">No separate users table: registrant identity is stored on each registration. The same email can register for different events.</text><text class="field" x="35" y="1142">Admin accounts are environment/session configuration, not a database entity. Weather is retrieved externally and is not stored in these tables.</text></svg>'])
(root/'docs/a3-erd.svg').write_text('\n'.join(svg),encoding='utf-8')
(out/'schema-fields.json').write_text(json.dumps(tables,indent=2))
print('Generated ERD from four SQL tables.')
