(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    let preference = 'auto';
    try { preference = localStorage.getItem('theme') || 'auto'; } catch (_) {}
    function apply() {
        const dark = preference === 'dark' || (preference === 'auto' && media.matches);
        document.documentElement.dataset.themeResolved = dark ? 'dark' : 'light';
        document.documentElement.classList.toggle('mdui-theme-dark', dark);
        document.documentElement.classList.toggle('mdui-theme-light', !dark);
        const button = document.getElementById('theme-toggle');
        if (button) button.icon = dark ? 'dark_mode' : 'light_mode';
    }
    apply();
    media.addEventListener('change', apply);
    document.addEventListener('DOMContentLoaded', () => {
        apply();
        document.getElementById('theme-toggle').addEventListener('click', () => {
            preference = document.documentElement.dataset.themeResolved === 'dark' ? 'light' : 'dark';
            try { localStorage.setItem('theme', preference); } catch (_) {}
            apply();
        });
        document.getElementById('drawer-list').addEventListener('click', () => {
            document.getElementById('drawer').open = false;
        });
    });
})();
