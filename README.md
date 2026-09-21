# GSY Releases

面向闭源项目的公开二进制发布中心。

本仓库只保存产品清单、更新索引和发布自动化；安装包、便携版及校验文件存放在 GitHub Releases。公开下载不代表项目源码开源，也不授予反编译、再分发或修改许可。

## 发布规范

- 产品 ID：永久稳定的小写 kebab-case，例如 `tool-desk`
- 稳定版标签：`<product>-v<semver>`，例如 `tool-desk-v0.3.1`
- 每个 Release 只属于一个产品和一个版本
- 大文件只作为 Release asset 上传，不提交到 Git
- Electron NSIS 产品必须同时上传安装包、`.blockmap` 和 `latest.yml`
- 发布完成后，自动更新 `products/<product>/latest.json`

## 当前产品

| 产品 | ID | 类型 | 更新索引 |
|---|---|---|---|
| Tool Desk | `tool-desk` | Electron / Windows | `products/tool-desk/latest.json` |

## 新增产品

1. 新建 `products/<product>/product.json`。
2. 在 `products/index.json` 登记产品。
3. 私有源码仓库按 `<product>-v<semver>` 向本仓库发布资产。
4. 创建只安装到本仓库、仅授予 `Contents: read and write` 的 GitHub App。
5. 私有源码仓库保存 `RELEASE_APP_ID` 变量和 `RELEASE_APP_PRIVATE_KEY` Secret，发布时生成短期令牌。

客户端只读取公开索引和 Release 资产，禁止内置 GitHub token。
