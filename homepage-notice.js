/* 首页顶部通知：只需编辑下面的字段。
 * enabled: true 显示 / false 隐藏
 * dismissible: true 允许用户关闭 / false 不允许（刷新页面后重新显示）
 * type: 'error' 红色警告 / 'warning' 黄色提示 / 'info' 蓝色信息
 * content: 通知纯文本（不解析 HTML）
 */
window.BAIPIN_HOME_NOTICE = {
    enabled: true,
    dismissible: true,
    type: 'info',
    content: 'As Microsoft Outlook gradually recoveries, my response for emails sent to i@dcw.hk is now available.'
};

(() => {
    const config = window.BAIPIN_HOME_NOTICE;
    const banner = document.getElementById('homepage-notice');
    if (!banner || !config.enabled || !config.content?.trim()) return;
    const icons = { error: 'error', warning: 'warning', info: 'info' };
    const type = Object.hasOwn(icons, config.type) ? config.type : 'info';
    banner.dataset.type = type;
    banner.setAttribute('role', type === 'error' ? 'alert' : 'status');
    banner.querySelector('.material-icons').textContent = icons[type];
    banner.querySelector('.homepage-notice-content').textContent = config.content;
    if (config.dismissible === true) {
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'homepage-notice-close';
        close.setAttribute('aria-label', 'Dismiss notice');
        const icon = document.createElement('span');
        icon.className = 'material-icons';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = 'close';
        close.append(icon);
        close.addEventListener('click', () => {
            banner.hidden = true;
            // Move focus out of the hidden notice after keyboard dismissal.
            document.querySelector('.nav-logo')?.focus({ preventScroll: true });
        });
        banner.append(close);
    }
    banner.hidden = false;
})();
