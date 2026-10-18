# user2 Angular 本地验收记录

日期：2026-10-15。执行环境：Windows、Node 24.19.0、Chrome、本地 MySQL/MariaDB。测试使用独立临时库，结束后清理，未改真实 api/.env 或原业务数据。

## 版本与分工

本地分支 user2-angular-deployment 保留 user2 的 b8f628b（列表、新建、编辑）和 e5fb4ab（暂停、删除、名单），并整合已合并 main be283db 及 user1 报名 PR #17 的 6e51688。同伴提交和作者原样保留；PR #17 只是本地整合，没有代替 GitHub 审核或合并。

部署模块改动 api/app.js、独立 angular-server.js、admin-session.js、环境示例、打包脚本以及管理端导航。没有改写 api/server.js、api/event_db.js、共享 Angular 服务或 user1 业务页面。天气仍属 user1，尚未在本轮候选中实现。

## 已执行并通过

| 检查                      | 结果                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| 公众端与共享 Angular 单测 | 31 通过                                                                                              |
| 管理端 Angular 单测       | 28 通过                                                                                              |
| API 与原有业务全量回归    | 89 通过，含新增部署测试，无失败／跳过                                                                |
| 双端生产构建              | public 根路径、admin /admin/ 成功                                                                    |
| 独立运行包                | npm ci --omit=dev 后可启动，生产依赖审计未报漏洞                                                     |
| 实际浏览器联合流程        | 登录、创建、Angular 报名、详情名单、后台名单、暂停／恢复、编辑保留报名、删除保护、退出后拒绝访问通过 |
| 深层路由和返回            | 公众详情、后台编辑、名单刷新，旧首页链接返回通过                                                     |
| 机密文件与静态回退        | 私有文件、未知 API、缺失资源不返回 Angular 成功页面                                                  |
| 手机布局                  | 390px 登录和名单截图检查通过，无整页横向溢出                                                         |

单独的部署路由测试共 9 个 Node 测试计数，已经包含在上面的 89 项中，不重复相加。管理操作的真实竞态测试先前已验证报名与删除、报名与暂停的锁定顺序；参见 angular/projects/admin/README.md。

执行命令：

```sh
cd angular
npm run ng -- test public --watch=false
npm run ng -- test admin --watch=false
cd ..
node scripts/test-joint-acceptance.cjs
node scripts/build-angular-release.cjs --username YOUR_SCHOOL_USERNAME
npm ci --omit=dev --prefix <release-directory>/release/api
node scripts/test-angular-release.cjs <release-directory>
```

证据位于忽略目录 submission/angular-deployment-qa/，API 日志为 submission/angular-deployment-api-regression.log。发布清单记录具体构建对应的源提交和哈希；这些截图是本地开发证据，不是线上部署证据。

## user1 PR 17 本地审核

审核对象 6e51688，重点查看响应式表单校验、重复点击锁定、重复邮箱错误、活动切换时取消旧请求、不确定网络结果、个人信息存储与回跳名单更新。未发现阻塞本次本地集成的问题。复跑 31 个 public/shared 测试，并在独立部署包中实际完成 Angular 报名和名单同步。此结论不代表天气已完成，也不代表 GitHub 上已提交正式 Review。

## 尚未完成的外部条件

两人的 cPanel 实际 Node 版本、域名根路径和实例数量；HTTPS Cookie 的真实线上验证；天气成功和失败分支；学校用户名对应的最终文件名；个人报告确认、本人视频、互评和课程平台提交。候选包在这些条件完成前不应标为最终提交版。
