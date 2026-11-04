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
- arXiv 会尝试从 arXiv API 获取元数据；Nature、DOI 及包含可识别 DOI 的地址会尝试通过 Crossref 获取标题、作者和日期，也可以在对象中手动填写 `doi`。
- 自动元数据获取可能受跨域或网络限制，失败时仍保留可点击的来源和链接。其他平台可在对象中提供 `title`、`authors`、`date`、`note`、`tags` 等字段，无需依赖自动获取。
- `reading/metadata.json` 缓存已添加论文的信息：arXiv 以不含版本号的 ID 为键，其他平台以规范化后的完整论文 URL 为键。列表对象中的字段优先于缓存。
- 所有入口仅接受不含用户名密码的 HTTPS 地址；无效条目会跳过。

本地预览：在仓库根目录运行 `python -m http.server 8000`，访问 `http://localhost:8000` 和 `/reading/`。

## 本地图标

首页和 Reading 共用 `assets/material-icons.css` 及本地 `assets/fonts/MaterialIcons-Regular.ttf`，不再请求 Google Fonts。字体为 Google Material Icons，采用 Apache-2.0 许可，许可全文见 `assets/fonts/LICENSE.txt`。
