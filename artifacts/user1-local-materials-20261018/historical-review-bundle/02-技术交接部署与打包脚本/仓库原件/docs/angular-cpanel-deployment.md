# Angular 版本 cPanel 部署说明

维护人：user2，Tianyi Li。2026-10-15。本说明对应本地 Angular 联合候选版本；真实 cPanel 尚未操作。公众端报名使用 user1 PR #17 的代码做本地联调，天气功能尚待 user1 完成。

## 已确定的目录和网址

本轮只验证同一个 HTTPS 域名或子域名的根路径部署：公众端 `/`，管理端 `/admin/`，管理员登录 `/admin/login`，API `/api/`。不需要填写不同的前端 API 域名，CORS_ALLOWED_ORIGINS 保持空值。如果学校只能给 `/DataServ` 一类子目录，先暂停部署并提供实际路径，需要双方协调构建 base href 和 API_BASE_URL，不能只改一个 URL。

```
clean-release/
  api/                 Node 应用目录，启动文件 app.js
  frontend/public/     Angular 公众端构建产物
  frontend/admin/      Angular 管理端构建产物
  clientside/assets/js/admin-validation.js  现有 API 校验依赖
  database/a3-fresh-install.sql
  docs/
```

服务端只公开构建产物和 API；不能把整个项目目录映射成静态网站。源码、SQL、真实 .env 和数据库密码均应放在公开文档根目录以外。管理 HTML、深层链接和 API 都有访问保护。

## 在本机生成候选包

Angular 构建使用 Node 22.22.3+（22.x）、24.15+（24.x）或 >=26；本轮实际使用 24.19.0。安装依赖后在项目根目录执行：

```powershell
npm ci --prefix api
npm ci --prefix angular
node scripts/build-angular-release.cjs --username YOUR_SCHOOL_USERNAME
# 将上一条输出的 RELEASE_DIRECTORY 填入下面命令
powershell -ExecutionPolicy Bypass -File scripts/zip-angular-release.ps1 -ReleaseDirectory "完整输出目录"
```

没有确认学校用户名时，默认使用 user2 占位。未提交的跟踪文件会阻止正式构建；`--allow-dirty` 只生成明确标记的本地测试候选，不用于最终提交。

生成三份课程文件名格式的 ZIP：`usernameA3-clientside.zip`、`usernameA3-adminside.zip`、`usernameA3-api.zip`。每份包含 source（可编辑源码）和 runtime（对应运行文件）；合并两端 source/angular 可重建工作区，合并三份 runtime 可得到完整运行目录。另外的 `complete-cpanel-release.zip` 是便于部署的整包，不是代替老师要求的三份提交。提交入口“2 个 ZIP/三个名称”的冲突仍需按课程平台确认。

`manifest.json` 记录源提交、Node 版本、构建时间和运行文件 SHA256。整包只收录清单中的文件，排除安装验证产生的 node_modules、真实 .env 和 Git 元数据。不要把旧候选误当最新最终版。

## 你在 cPanel 中操作的顺序

1. 登录自己的 cPanel，只需向协作者提供 Node 版本列表、应用 URL 和应用目录等非敏感信息。不要发送密码或数据库凭据。
2. 检查是否有 **Setup Node.js App** 或 **Application Manager**，确认能运行 Node 22/24，优先与本地测试的 24.19.0 一致。Angular 已在本机构建，服务器只安装 API 生产依赖，不运行 ng serve。
3. 建立独立空数据库和数据库用户，将用户授予该库所需权限。记录 cPanel 自动添加的前缀，在 phpMyAdmin 选中这个空库后导入 `a3-fresh-install.sql`。不要导入覆盖已有库。样本应为四张表、1 个机构、5 个类别、8 个活动、12 条虚构报名。
4. 将整包上传到如 `~/apps/harbour-hope/`，解压后确认 api、frontend、clientside 同级。文件夹实际名字可以不同；以真实目录为准。
5. 创建 Node 应用：应用根目录指向实际的 `.../clean-release/api`，Application URL 选目标 HTTPS 域名的 `/`，环境 Production，启动文件 `app.js`。如果面板不允许配置该根路径，先停下来提供当前选项。
6. 在面板添加下表环境变量。既可使用面板，也可在服务器私有 api/.env 中保存；进程环境优先。示例文件的空凭据必须自己补齐，不能原样上线。
7. 在应用环境终端进入 api，执行 `npm ci --omit=dev`，或使用面板的依赖安装操作。终端激活命令以该账户面板给出的为准。
8. 启动或 Restart 应用。先检查 `/api/health`，再检查 `/` 和 `/admin/login`。每次改配置后重启。登录会话在重启后失效，需要重新登录。

cPanel 不同界面的项目名称可能不同，以实际账号为准。官方参考：[Application Manager](https://docs.cpanel.net/cpanel/software/application-manager/)、[Node.js 应用安装](https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/)。

## 必填环境变量

| 变量                            | 值或填写方式                                     |
| ------------------------------- | ------------------------------------------------ |
| NODE_ENV                        | production                                       |
| APP_FRONTEND                    | angular；省略时仍是原 legacy 启动方式            |
| ANGULAR_PUBLIC_DIR              | ../frontend/public                               |
| ANGULAR_ADMIN_DIR               | ../frontend/admin                                |
| PUBLIC_ORIGIN                   | 实际 https://域名，不带路径或末尾页面            |
| ADMIN_USERNAME                  | 自己设定的管理账户，不含冒号                     |
| ADMIN_PASSWORD                  | 自己设定的随机强密码，至少 16 字符               |
| DB_HOST / DB_PORT               | 学校提供的 MySQL 地址与端口                      |
| DB_USER / DB_PASSWORD / DB_NAME | 本人账户的真实数据库配置，含实际前缀             |
| DB_CONNECTION_LIMIT             | 建议先 5，并服从账号连接配额                     |
| HOST / PORT                     | 按面板或宿主要求；不要随意把其他服务端口复制过来 |
| CORS_ALLOWED_ORIGINS            | 本方案留空                                       |

路径相对于 api 目录解释，不取决于终端当前路径。缺少构建产物、base href 不匹配、生产凭据或 HTTPS 配置不全时，应用会在启动阶段报错，不能忽略后继续提交。

## 管理员登录与访问

打开 `/admin/` 自动进入登录页。登录后使用 HttpOnly、SameSite=Strict Cookie；production 额外启用 Secure。会话有效期一小时，密码不放在前端构建、URL、localStorage 或 sessionStorage 中。退出按钮使当前会话失效。错误密码十次后限制十五分钟，登录和写操作拒绝其他来源。

当前会话在单个 Node 进程内保存。应让该应用只运行一个实例；重启会清空会话。如果学校 Passenger 配置会在多个进程间分配请求，必须先协调单实例设置或改为共享会话存储，不能把这种环境标为已验收。现有 Basic API 访问方式仍兼容，但正常浏览器使用登录页。

页面深层路径由 Express 返回对应 Angular index.html，API 和缺失 JS/CSS 不走 HTML 回退。该处理符合 [Angular 路由部署说明](https://angular.dev/tools/cli/deployment)。旧 `/index.html`、`/detail.html?id=...` 等公共链接回到 Angular；`/register.html?id=...` 也由 Angular 处理。

## 每人都必须做的线上验收

- 无痕窗口直接访问管理列表、编辑深层链接和 API；未登录不能读取管理数据。
- 正常登录、错误密码、退出后重新访问，分别符合预期。
- 新建活动，公众端能搜索、打开详情；两个页面时间均为 Brisbane UTC+10。
- Angular 报名成功，详情和后台名单同步；重复邮箱和非法票数被拒绝。
- 编辑后报名保留；暂停后无法报名；有报名不可删除，无报名可删除。
- 首页、搜索、详情、报名、管理编辑页直接刷新和返回正常，手机布局可用。
- 真实天气成功与失败分支均验收，失败不阻断报名（待 user1 天气功能合入后执行）。
- `/api/health` 正常；`/.env`、`/.git/config`、`/api/event_db.js` 均 404。
- 记录本人域名、Node 版本、应用路径、数据库导入和验收时间；截图和视频不包含凭据。

## 常见阻塞的处理

500/启动失败先查看应用私有日志：重点核对环境变量、真实数据库前缀、依赖安装、构建路径和应用入口。刷新深层路径 404 先确认请求进入 Node 应用，而非 Apache 直接找静态文件。登录后反复跳回登录先核对 HTTPS Cookie、域名、PUBLIC_ORIGIN 和是否启用了多个 Node 实例。遇到缺少 Node 面板、子路径限制或无可用运行时，需要账号持有人或学校技术人员处理。

本地通过不等于 cPanel 通过。两名成员应各自按以上步骤部署完整版本，再录制自己的演示并提交。
