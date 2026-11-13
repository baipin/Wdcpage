/* 首页顶部通知：只需编辑下面三个字段。
 * enabled: true 显示 / false 隐藏
 * type: 'error' 红色警告 / 'warning' 黄色提示 / 'info' 蓝色信息
 * content: 通知纯文本（不解析 HTML）
 */
window.BAIPIN_HOME_NOTICE = {
    enabled: true,
    type: 'error',
    content: 'Due to the Microsoft Outlook outage, the response to the email to i@dcw.hk is delayed, please send email to root@baipin.pw instead to contact with me until the service recovers.'
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
    banner.hidden = false;
})();
