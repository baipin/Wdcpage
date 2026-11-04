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

支持 arXiv 摘要地址、PDF 地址及版本号；无效条目会被跳过。页面包含关键词筛选、摘要和 PDF 入口，移动端和深浅主题均可用。

初始三篇论文的真实标题、作者和发布日期缓存在 `reading/metadata.json`。新增论文只填地址即可直接导航，并会尝试从 arXiv API 获取信息。若 API 跨域或网络限制导致获取失败，页面仍显示 arXiv ID 和链接；可在列表对象中填写 `title`、`authors`、`date`，或在 `metadata.json` 中以 arXiv ID 为键补充这些字段，保证标题稳定显示。

本地预览：在仓库根目录运行 `python -m http.server 8000`，访问 `http://localhost:8000` 和 `/reading/`。

## 本地图标

首页和 Reading 共用 `assets/material-icons.css` 及本地 `assets/fonts/MaterialIcons-Regular.ttf`，不再请求 Google Fonts。字体为 Google Material Icons，采用 Apache-2.0 许可，许可全文见 `assets/fonts/LICENSE.txt`。
