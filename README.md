# Wdcpage

Static personal homepage. Deploy the repository root; no build step is needed.

## Reading 列表

编辑 `reading/papers.js` 的 `window.READING_PAPERS` 数组即可，按数组顺序展示：

```js
window.READING_PAPERS = [
    'https://arxiv.org/abs/2405.16444',
    { url: 'https://arxiv.org/abs/2505.23416', title: 'KVzip',
      note: '关注原因或阅读笔记', tags: ['KV cache'] }
];
```

支持 arXiv、Nature、DOI、OpenReview、ACL Anthology、PMLR、CVF、bioRxiv、medRxiv、Springer、ACM、IEEE、ScienceDirect、Science、Cell 等平台，也接受其他论文网站的 HTTPS 链接。列表显示来源，可按标题、作者、平台、DOI 或 ID 搜索。

- arXiv、Nature、OpenReview、ACL、CVF 摘要页和 bioRxiv/medRxiv 内容页可自动生成相应 PDF 入口；其他平台只显示论文入口，不猜测 PDF 地址。
- 可用对象的 `pdf` 字段手动提供 HTTPS PDF 地址，例如 `{ url: 'https://proceedings.mlr.press/v235/example24a.html', title: '论文标题', pdf: 'https://example.org/paper.pdf' }`。
- **自动抓取在 GitHub Actions 中执行**：推送 `reading/papers.js` 到 `main` 后，`Update Reading metadata` 工作流获取论文信息并自动提交 `metadata.json`。也支持手动触发，每天会重试未补全的条目。仓库须启用 Actions，允许工作流写入仓库；若保护规则禁止直接提交 main，工作流会明确报错。
- 获取完成后重新加载网页即可，页面读取本站 JSON，不依赖读者的浏览器跨域访问 arXiv。标题、作者、日期等手动字段仍优先；请求失败保留已有信息，工作流会报告失败，不会静默删除数据。
- 抓取支持 arXiv / ACL / PMLR / CVF 等页面的标准 citation 元标签、OpenReview API，以及 Nature / DOI 等的 Crossref 数据。其他平台会尝试标准 citation / Open Graph 标签；出版商反爬或访问权限限制仍可能阻止获取，可手动提供字段。
- 本地添加链接后运行 `python scripts/update_reading_metadata.py`（需要 Python 3.10+ 和 Node.js），与工作流使用相同逻辑；`--refresh` 可强制刷新已有缓存。
- 页面仍保留 arXiv / Crossref 即时补全作为备用途径，但自动更新不依赖这条可能被跨域策略拦截的路径。
- `reading/metadata.json` 缓存已添加论文的信息：arXiv 以不含版本号的 ID 为键，其他平台以规范化后的完整论文 URL 为键。列表对象中的字段优先于缓存。
- 所有入口仅接受不含用户名密码的 HTTPS 地址；无效条目会跳过。

本地预览：在仓库根目录运行 `python -m http.server 8000`，访问 `http://localhost:8000` 和 `/reading/`。

## 本地图标

首页和 Reading 共用 `assets/material-icons.css` 及本地 `assets/fonts/MaterialIcons-Regular.ttf`，不再请求 Google Fonts。字体为 Google Material Icons，采用 Apache-2.0 许可，许可全文见 `assets/fonts/LICENSE.txt`。
