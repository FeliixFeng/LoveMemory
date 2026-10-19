# CLAUDE.md

本项目规范、架构说明、数据策略、部署方式，全部以 `AGENTS.md` 为唯一事实来源。

@AGENTS.md

补充（Claude Code 专用）：

- 改数据相关逻辑前先读 `app/lib/app-data.ts`
- 不要读写 `data/*.sqlite*`（那是运行时数据）
- 不要试图恢复 `.github/workflows/deploy.yml.disabled`，部署走 `scripts/deploy.sh`
