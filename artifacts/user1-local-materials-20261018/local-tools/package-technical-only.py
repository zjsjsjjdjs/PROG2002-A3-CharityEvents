from pathlib import Path, PurePosixPath
import subprocess, json, hashlib, zipfile, re, datetime

root=Path.cwd()
outer=Path('E:/workplace/user1-A3')
dest=Path('E:/workplace/A3')
log=(root/'submission/final-technical-package-build.log').read_text(encoding='utf-8-sig')
release_dir=Path(re.findall(r'RELEASE_DIRECTORY=(.+)',log)[-1].strip())
release=release_dir/'release'
build_manifest=json.loads((release_dir/'manifest.json').read_text())
commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
assert commit==build_manifest['sourceCommit'] and not build_manifest['trackedChanges']
assert not subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],text=True).strip()
protected=json.loads((root/'submission/package-protected-docs-before.json').read_text(encoding='utf-8-sig'))
def sha(data):return hashlib.sha256(data).hexdigest()
for item in protected:
    assert sha(Path(item['Path']).read_bytes()).upper()==item['Hash'], 'Protected document changed'
excluded={'user1-local-acceptance.md','user1-angular-handoff.md'}
for name,expected in build_manifest['files'].items():
    assert sha((release/name).read_bytes())==expected, name

# Validate all built entrypoint assets, base paths, and equality with the reviewed build.
frontend_checks=[]
for app,base in [('public','/'),('admin','/admin/')]:
    folder=release/'frontend'/app
    html=(folder/'index.html').read_text()
    assert f'<base href="{base}">' in html
    for ref in re.findall(r'(?:src|href)="([^"]+\.(?:js|css))"',html):
        assert (folder/ref).is_file(), ref
    old=root/'submission/restored-candidate/release/frontend'/app
    fresh={p.relative_to(folder).as_posix():sha(p.read_bytes()) for p in folder.rglob('*') if p.is_file()}
    previous={p.relative_to(old).as_posix():sha(p.read_bytes()) for p in old.rglob('*') if p.is_file()}
    assert fresh==previous, f'{app}: build differs from accepted assets'
    frontend_checks.append({'app':app,'base':base,'assetsAvailable':True,'matchesReviewedBuildByteForByte':True,'files':fresh})

install='''Harbour Hope A3 — technical delivery only

Source commit: {commit}
Repository: https://github.com/zjsjsjjdjs/PROG2002-A3-CharityEvents
PR #22 contains the documentation/comment additions and was still open at packaging.
The technical packages use its exact source revision; no GitHub merge or deployment was performed.

Course source packages:
- houyan10A3-clientside.zip: source/angular public + shared + workspace configuration; public runtime.
- houyan10A3-adminside.zip: source/angular admin + shared + workspace configuration; admin runtime.
- houyan10A3-api.zip: source/api, clientside validation/legacy source, database, scripts; API runtime and SQL.
Combine both source/angular trees into one workspace. They intentionally share identical configuration/shared files.
Combine all three source/ trees for the complete code and test workspace. Install locked dependencies with
npm ci --prefix angular and npm ci --prefix api. Build with Node 24.19.0 (used here),
then npm run build --prefix angular. Real .env, node_modules and Git history are excluded.
The source environment template defaults to local legacy mode; use runtime/api/.env.example
and APP_FRONTEND=angular when configuring the integrated Angular runtime.

The companion complete-cpanel-release.zip contains one release/ directory.
For a NEW installation, keep it outside public_html, configure api/app.js as startup,
public /, admin /admin/, API /api/. Set APP_FRONTEND=angular,
ANGULAR_PUBLIC_DIR=../frontend/public, ANGULAR_ADMIN_DIR=../frontend/admin,
PUBLIC_ORIGIN to your HTTPS origin, and private admin/DB credentials in the hosting environment.
Run npm ci --omit=dev inside api. Import database/a3-fresh-install.sql ONLY into a NEW EMPTY database.
Do not import sample SQL over an existing live database. Do not upload the entire source tree into public_html.
The existing school deployment is already working: this package is a backup/reproducible delivery,
not an instruction to redeploy, change its a3-api application root, or replace its database.

The school runtime was Node 18.20.8 serving prebuilt assets/API. Angular builds ran locally on 24.19.0.
Use the existing cPanel account configuration for its absolute frontend paths. Do not overwrite Passenger rules.

Separate materials intentionally excluded:
- The student's two editable local acceptance/handoff documents, including committed older copies.
- Final report, personal video, peer evaluation and personal submission/declaration material.
The student packages those separately. The technical attachments contain historical test evidence,
ERD images and generated source reference, not a replacement report or a new live acceptance claim.
'''.format(commit=commit)

# Source bytes come directly from the committed Git tree, not from user-edited drafts.
tracked=subprocess.check_output(['git','ls-tree','-r','--name-only',commit],text=True).splitlines()
def blob(name):return subprocess.check_output(['git','show',commit+':'+name])
def public_source(p):return p.startswith(('angular/projects/public/','angular/projects/shared/')) or (p.startswith('angular/') and not p.startswith('angular/projects/'))
def admin_source(p):return p.startswith(('angular/projects/admin/','angular/projects/shared/')) or (p.startswith('angular/') and not p.startswith('angular/projects/'))
def api_source(p):return p.startswith(('api/','clientside/','database/','scripts/'))
packages={}
source_sets={}
for part,predicate,app in [('clientside',public_source,'public'),('adminside',admin_source,'admin'),('api',api_source,None)]:
    prefix='houyan10A3-'+part
    files={prefix+'/README.txt':install.encode()}
    selected=[p for p in tracked if predicate(p)]
    assert selected
    source_sets[part]=selected
    for p in selected:files[prefix+'/source/'+p]=blob(p)
    for p in release.rglob('*'):
        if not p.is_file():continue
        rel=p.relative_to(release).as_posix()
        wanted=rel.startswith('frontend/'+app+'/') if app else rel.startswith(('api/','clientside/','database/'))
        if wanted:files[prefix+'/runtime/'+rel]=p.read_bytes()
    packages['01-代码提交包/'+prefix+'.zip']=files

code_inventory=set().union(*[set(x) for x in source_sets.values()])
expected={p for p in tracked if p.startswith(('angular/','api/','clientside/','database/','scripts/'))}
assert expected==code_inventory, 'Source coverage gap: '+repr(expected-code_inventory)

runtime={}
for p in release.rglob('*'):
    if p.is_file() and p.relative_to(release).parts[0] in {'api','clientside','database','frontend'}:
        runtime['release/'+p.relative_to(release).as_posix()]=p.read_bytes()
runtime['release/INSTALL.txt']=install.encode()
runtime_manifest={'sourceCommit':commit,'node':build_manifest['node'],'builtAt':build_manifest['builtAt'],'files':{k.removeprefix('release/'):sha(v) for k,v in sorted(runtime.items())}}
runtime['release/manifest.json']=(json.dumps(runtime_manifest,indent=2)+'\n').encode()
packages['02-cPanel备用部署包/complete-cpanel-release.zip']=runtime

attachments={}
def attach(path,target):
    assert path.is_file(), str(path)
    attachments['technical-attachments/'+target]=path.read_bytes()
for name in ['a3-erd.mmd','a3-erd.svg','a3-erd.png']:
    attach(root/'docs'/name,'ERD/'+name)
for name in ['code-reference.html','code-reference.json','comment-verification.json','live-link-check.json']:
    attach(root/'submission/a2-feedback-review'/name,'documentation-and-checks/'+name)
for dirname in ['admin-appearance-qa','angular-deployment-qa']:
    for p in (root/'submission'/dirname).rglob('*'):
        if p.is_file() and p.suffix in {'.png','.json'}:
            attach(p,'evidence-20261016/'+dirname+'/'+p.relative_to(root/'submission'/dirname).as_posix())
foundation=outer/'submission/angular-foundation-worktree'
for dirname in ['angular-public-checks','angular-integration-checks']:
    for p in (foundation/'submission'/dirname).rglob('*'):
        if p.is_file() and p.suffix in {'.png','.json'}:
            attach(p,'evidence-public-history/'+dirname+'/'+p.relative_to(foundation/'submission'/dirname).as_posix())
for name in ['admin-build.log','admin-tests.log','admin-restored-integration.log']:
    attach(root/'submission'/name,'evidence-20261016/'+name)
attach(foundation/'submission/test-joint-acceptance.cjs.log','evidence-public-history/test-joint-acceptance.cjs.log')
attach(outer/'submission/cpanel-node18-8d4b71c-check/node18-check-results.json','documentation-and-checks/node18-check-results.json')
attach(root/'submission/final-technical-package-build.log','packaging-20261017/build.log')
attachments['technical-attachments/packaging-20261017/frontend-verification.json']=(json.dumps(frontend_checks,indent=2)+'\n').encode()
attachments['technical-attachments/README.txt']=('''技术附件说明
这些附件与代码提交包分开保存，可按需要取用；不是正式报告、互评表或视频。
ERD/: 三种格式的数据库关系图。documentation-and-checks/: 源码文档和已保留的检查结果。
evidence-20261016/ 与 evidence-public-history/: 原日期的本地测试截图、JSON 和日志，按原样复制。
packaging-20261017/: 本次公众端/后台生产构建日志及与已验收产物逐字节比对结果。
历史 JSON 中的 PR #17 或“cPanel pending”文字是当时/模板说明，不代表当前部署未完成。
这些历史结果不等于今天重新执行了全部测试，也不是老师的验收结论。
两份你自行修改的本地验收/交接文档没有收录，原文件没有修改。
源码生成器在 API 代码包 source/scripts/generate-code-reference.cjs 中。
''').encode('utf-8')
packages['03-技术附件/technical-attachments.zip']=attachments

# Reject sensitive or unrelated document types and unsafe paths before creating archives.
for archive,files in packages.items():
    for name,data in files.items():
        pp=PurePosixPath(name)
        assert not pp.is_absolute() and '..' not in pp.parts
        assert not set(pp.parts)&{'.git','node_modules','.env','__pycache__'}
        assert pp.name not in excluded
        assert pp.suffix.lower() not in {'.docx','.doc','.pdf','.mp4','.mov','.mkv','.bak','.map','.zip'}
        assert not (pp.name.startswith('.env.') and pp.name!='.env.example')
        assert not any(marker in data for marker in [b'-----BEGIN PRIVATE KEY-----',b'-----BEGIN RSA PRIVATE KEY-----'])
        assert not re.search(rb'\b(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})',data)

outputs=list(packages)+['00-先读我.txt','manifest.json','SHA256SUMS.txt','文件清单.csv']
for relative in outputs:
    assert not (dest/relative).exists(), 'Refuse to overwrite: '+relative
dest.mkdir(parents=True,exist_ok=True)
archive_results=[]
inventory=[]
for relative,files in packages.items():
    target=dest/relative
    target.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(target,'x',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for name,data in sorted(files.items()):
            info=zipfile.ZipInfo(name,datetime.datetime.now().timetuple()[:6])
            info.create_system=3
            info.external_attr=0o100644<<16
            info.compress_type=zipfile.ZIP_DEFLATED
            z.writestr(info,data)
            inventory.append({'archive':relative,'path':name,'bytes':len(data),'sha256':sha(data)})
    with zipfile.ZipFile(target) as z:
        assert z.testzip() is None
        assert set(z.namelist())==set(files)
        for name,data in files.items():assert sha(z.read(name))==sha(data)
    archive_results.append({'path':relative,'bytes':target.stat().st_size,'sha256':sha(target.read_bytes()),'files':len(files),'integrity':'passed'})

readme='''A3 技术交付包（与个人资料分开）

1. 01-代码提交包：houyan10A3-clientside.zip、houyan10A3-adminside.zip、houyan10A3-api.zip。
   这三份对应课程列出的代码包名称，包含可编辑源码和对应运行文件。
2. 02-cPanel备用部署包：complete-cpanel-release.zip，完整运行目录的备份/重新安装包。
   你当前网站已部署正常，本次不需要再次部署，也不要把示例 SQL 导入现有数据库。
3. 03-技术附件：technical-attachments.zip，ERD、源码文档、历史测试截图/日志及本次构建检查。

两份你修改的本地审查文档、正式报告、视频、互评表均未加入这些压缩包，原文件未改动。
请将这些个人资料按你自己的安排另行打包。本目录不是包含所有材料的一键提交总包。
代码包中的 docs/ 审查材料被有意分开；代码、SQL、测试、构建脚本完整保留。

源码提交：{commit}
来源分支：codex/user1-a2-feedback-fixes
PR： https://github.com/zjsjsjjdjs/PROG2002-A3-CharityEvents/pull/22
打包时 PR #22 尚未合并，main 为 61f293c。本包包含 PR #22 的技术改进；本次没有执行合并或上传。
公众端： https://24832591.it.scu.edu.au/
后台： https://24832591.it.scu.edu.au/admin/
GitHub： https://github.com/zjsjsjjdjs/PROG2002-A3-CharityEvents

验证：公众端和后台重新生产构建通过；两端静态产物与原验收版本逐字节一致；
三包合并包含所有已跟踪 Angular/API/旧版客户端/数据库/脚本源码；ZIP CRC 与逐文件 SHA256 通过。
没有声称本次重跑了全部应用测试，也没有自动提交 Moodle。
manifest.json 记录版本/检查，文件清单.csv 记录压缩包内全部文件，SHA256SUMS.txt 用于核对完整性。
包内 README.txt/INSTALL.txt 有重建和新环境安装说明，实际密码须私下配置。
'''.format(commit=commit)
(dest/'00-先读我.txt').write_text(readme,encoding='utf-8-sig')
manifest={'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceCommit':commit,'sourceBranch':'codex/user1-a2-feedback-fixes','remoteMainAtPackaging':'61f293caea27da8b09c1f58f0793a1e7317714c6','pullRequest':22,'pullRequestMergedAtPackaging':False,'schoolUsername':'houyan10','scope':'technical-only; student-edited review documents and personal submission material excluded','node':build_manifest['node'],'checks':{'productionBuilds':'public/admin passed','frontendMatchesPreviouslyReviewedBuild':frontend_checks,'trackedTechnicalSourceFilesCovered':len(code_inventory),'zipIntegrity':'all entries CRC and SHA256 passed','protectedDocuments':'unchanged','fullApplicationTestsRerun':False,'uploaded':False,'deployed':False},'archives':archive_results}
(dest/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(dest/'SHA256SUMS.txt').write_text(''.join(x['sha256']+'  '+x['path']+'\n' for x in archive_results),encoding='utf-8')
import csv
with (dest/'文件清单.csv').open('w',newline='',encoding='utf-8-sig') as f:
    writer=csv.DictWriter(f,fieldnames=['archive','path','bytes','sha256']);writer.writeheader();writer.writerows(inventory)
for item in protected:assert sha(Path(item['Path']).read_bytes()).upper()==item['Hash']
print(json.dumps({'destination':str(dest),'commit':commit,'archives':archive_results,'sourceFilesCovered':len(code_inventory),'protectedDocumentsUnchanged':True},ensure_ascii=False,indent=2))
