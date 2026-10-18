# A3 交付说明

状态更新：2026-10-14。M02–M11 和三个后续修复已通过各自 PR 合入远端 main（f0b51ec），代码与已验收的 26cb134 一致。本说明属于 M12 独立文档提交，按 user2 的上传指示整理，供 PR 审核；不宣称 M12 已合并或个人交付全部完成。

## 项目汇总

Harbour Hope A3 在原 A2 活动浏览系统上增加前台报名和活动管理后台。访客可以浏览、搜索活动，查看详情和报名名单，填写姓名、邮箱及票数完成报名。管理员可以查看全部活动，新建、编辑、暂停和删除活动；已有报名的活动禁止删除，编辑或暂停不会移除报名记录。

活动时间统一按 Australia/Brisbane 显示。报名邮箱去除首尾空格并转为小写，同一邮箱可报名不同活动，但同一活动只能报名一次。公开名单显示姓名、票数和报名时间，不显示报名邮箱。本项目不包含支付处理或票务容量控制。

## 双方身份和贡献

本交付统一使用以下身份，历史 Git 作者信息保持不变。

| 角色 | 姓名与 Git 邮箱 | 主要贡献 |
| --- | --- | --- |
| user1 | Hongke Ouyang，2838356314@qq.com | M02 报名数据库及样本；M03 详情与名单；M04 报名接口；M05 报名页面；M11 联调与时间修正；本轮三个问题修复；M12 交付资料整理 |
| user2 | Tianyi Li，id_09188388@foxmail.com | A2 原作者；M06 后台列表；M07 新建活动；M08 编辑与名单；M09 删除保护；M10 部署配置与说明；团队仓库工作已由本人确认完成 |

Hongke Ouyang 的报名模块增加了报名约束、前后端校验、活动详情名单和完整报名流程，并完成整合后的跨模块验证。此次后续修复由 Hongke 的 Git 身份提交，保留 Tianyi 原后台模块的贡献记录。

Tianyi Li 提供原 A2 基线并完成后台活动管理及部署支持，包含活动列表、新建、更新、删除保护、后台访问控制、数据库连接配置和 cPanel 部署指引。两人的实际个人部署、视频和互评完成情况应分别记录，不以本地测试代替。

| 模块 | 提交 | 作者 |
| --- | --- | --- |
| M02 | 4a73ac8 | Hongke Ouyang |
| M03 | 201b202 | Hongke Ouyang |
| M04 | 5dde68b | Hongke Ouyang |
| M05 | 43bc8f2 | Hongke Ouyang |
| M06 | becc5aa | Tianyi Li |
| M07 | b7cc357 | Tianyi Li |
| M08 | 7c65393 | Tianyi Li |
| M09 | bedb09c | Tianyi Li |
| M10 | 06c0b0a | Tianyi Li |
| M11 | 3972153 | Hongke Ouyang |
| 三个问题后续修复 | 26cb134 | Hongke Ouyang |
| M12 | 本文所在的 M12 文档提交（user1-m12-delivery） | Hongke Ouyang |

## 项目来源与仓库说明

A2 原作者为 Tianyi Li，来源为 https://github.com/zjsjsjjdjs/prog2002-charity-events，基线提交为 5c800ac884e4dc4c50e2ca01b87347416c116f0d。A3 保留原 A2 历史以及双方已有模块提交，没有将同伴的模块改写为另一人的作者。

A3 团队私有仓库为 [PROG2002-A3-CharityEvents](https://github.com/zjsjsjjdjs/PROG2002-A3-CharityEvents)。user1 使用 Sakitam630，user2 使用仓库所有者账号 zjsjsjjdjs。M02–M10 对应已合并 PR #1–#9，M11 对应 #11，后续修复对应 #12；原 M11 PR #10 因分支改名关闭，由 #11 替代。

原整合代码位于 E:\workplace\user1-A3，分支 codex/user1-registration；user2 原目录 E:\workplace\user2-A3 保持不变。M12 从最新 origin/main 建立 user1-m12-delivery 分支，按独立 PR 审核合入，原有模块提交及作者记录不改写。

## 数据库与最终 SQL

完整安装文件为 database/a3-fresh-install.sql。它包含 organisations、categories、events 和 registrations 四张表，样本为 1 个机构、5 个类别、8 个活动和 12 条虚构报名。文件包含主外键、同活动邮箱唯一约束和正票数约束，不含 DROP DATABASE、CREATE DATABASE 或固定 USE 语句。

在数据库工具中先创建并选中一个空数据库，再导入该文件。不要覆盖现有业务库。已有 A2 库的升级方式是备份后依次执行 database/m02-registrations.sql 和 database/m02-registration-samples.sql，不重复导入完整安装文件。

完整 SQL 是结构加项目样本数据的可复现交付版本，不包含两人手测产生的临时活动、真实报名或个人连接配置。生成命令为 node scripts/build-deployment-sql.cjs；本轮重新生成后内容与版本中的文件一致，空库导入验证通过。

registrations 主要字段为 registration_id、event_id、name、email、registered_at 和 tickets。以 event_id 与 email 联合唯一约束防止重复报名；关联活动的外键禁止删除有报名的活动。活动 DATETIME 使用 Brisbane 当地时间，API 返回带 +10:00 的时间；报名时间返回 UTC ISO 字符串。

## 本地启动

本次验证环境为 Windows、Node.js v24.10.0、MariaDB 10.4.32 和本机 Chrome。

1. 启动 MySQL 或 MariaDB，创建空库并导入 database/a3-fresh-install.sql。
2. 保持 api 和 clientside 为同级目录，在项目根目录执行 npm.cmd ci --prefix api。
3. 如 api/.env 不存在，复制 api/.env.example 为 api/.env，填写 DB_HOST、DB_PORT、DB_USER、DB_PASSWORD 和 DB_NAME；本地使用 NODE_ENV=development。
4. 执行 npm.cmd start --prefix api。入口为 api/app.js，默认绑定 127.0.0.1，默认端口 3000。
5. 打开 http://localhost:3000/、http://localhost:3000/admin.html，并检查 /api/health 返回数据库已连接。若配置了其他端口，以实际 PORT 为准。

.env 仅保留在本地或部署环境中，不提交或打包。未设置后台凭据的开发模式只允许本机访问；配置后台凭据后使用对应用户名和密码。生产环境使用 HTTPS、明确的数据库配置以及至少 16 字符的 ADMIN_PASSWORD，具体步骤见 docs/cpanel-deployment.md。

当前部署方案使用同一域名或子域名的根路径，页面与 /api 同源。两人的实际 cPanel 部署尚需各自登录和验收。

## 接口汇总

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/health | 数据库健康检查 |
| GET | /api/categories | 活动类别 |
| GET | /api/events/upcoming | Brisbane 今日及以后公开活动 |
| GET | /api/events/search | date、location、categoryId 组合搜索；允许过去的 active 活动 |
| GET | /api/events/:id | active 活动详情及倒序报名名单 |
| POST | /api/events/:id/registrations | 提交姓名、邮箱和票数 |
| GET | /api/admin/events | 全部活动、状态标签和报名数量 |
| GET | /api/admin/organisations | 可选机构 |
| GET | /api/admin/events/:id | 可编辑字段及名单，包含 suspended 活动 |
| POST | /api/admin/events | 新建活动 |
| PUT | /api/admin/events/:id | 完整更新活动字段，保留报名 |
| DELETE | /api/admin/events/:id | 删除无报名活动，有报名时拒绝 |

报名请求使用 Content-Type: application/json，请求体示例：

```json
{"name":"Alex Chen","email":"alex@example.com","tickets":2}
```

成功返回 HTTP 201 和 {message,registration}，registration 包含报名 ID、活动 ID、姓名、规范化邮箱、票数和登记时间。请求方收到的成功响应包含其提交的邮箱，公开详情名单不包含邮箱。

姓名需为 1 至 120 个字符；联系方式使用邮箱；tickets 必须是 1 至 2147483647 的 JSON 整数。主要错误为 400 参数错误、404 活动不存在或已暂停、409 DUPLICATE_REGISTRATION 重复报名、409 EVENT_HAS_REGISTRATIONS 禁止删除、413 请求过大、415 内容类型错误、500 内部错误。格式为 {code,message}，后台字段校验还可能包含 fields；后台访问另有 401、403 和未配置非本机访问的 503。

## 验收与本轮修复

2026-10-07 的完整回归记录为 80 项通过、0 项失败、0 项跳过，其中 67 个验收子项和 13 个父测试。覆盖原 A2 浏览搜索、报名、后台增删改、前后台共享数据、并发报名与删除、统一时间、启动配置及完整 SQL 导入。

新增三个回归子项在修复前全部失败，修复后全部通过：

- 列表刷新失败或仍在加载时，搜索和筛选不会恢复旧列表，也不会抹去错误或加载提示；恢复网络后刷新可正常显示结果。
- 编辑页拒绝重复 id、空值、非整数和超出活动 ID 范围的参数，保留合法编辑及新建入口。
- 测试库初始化脚本在读取来源配置或连接数据库前检查目标 .env，存在时立即退出；配置写入使用独占创建避免覆盖。

复验命令为 node scripts/test-joint-acceptance.cjs。它创建独立测试库，导入完整 SQL，运行串行测试后只清理本次创建的库。M10 启动测试还会读取本机 api/.env 指向的库做健康检查，该路径不写业务数据。

完整测试日志在 submission/final-after-fix.log，修复前证据在 submission/final-before-fix.log。三个问题修复已通过 PR #12 合入；本次 M12 文档上传不宣称重新运行应用测试。手动最终验收尚无填写结果。具体步骤见 docs/final-manual-checklist.md。

## M12 交付范围与状态

本次统一 README、前后端使用说明、数据库导入说明、文档索引、双方身份与贡献及仓库记录。原 A2 文档保留为历史记录；M06–M10 的 61 项、M11 的 76 项及后续完整回归的 80 项分别注明对应边界。

完整 SQL 已随 M10 交付，本次核对其可复现性；M12 不重复创建数据库模块或改写应用代码。交付包由 M12 提交中的跟踪文件生成，包含源码、依赖锁文件、环境模板、SQL 和说明，不包含真实 .env、node_modules、临时 SQL 备份及个人审阅稿。

打包方法与个人交付状态见 [M12 交付清单](m12-delivery-checklist.md)。手测清单保留待填写项；实际 cPanel 部署、各自不超过 15 分钟的视频和互评提交由两人分别记录。本次上传不代表这些个人任务已经完成。
