export const clearAllClientCache = () => {
    try {
        console.log('🧹 NUKE: Clearing Local Storage...');
        localStorage.clear();

        console.log('🧹 NUKE: Clearing Session Storage...');
        sessionStorage.clear();

        console.log('🧹 NUKE: Unregistering Service Workers...');
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for (let registration of registrations) {
                    registration.unregister();
                }
            });
        }

        console.log('🧹 NUKE: Clearing Cookies...');
        document.cookie.split(";").forEach(function (c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        console.log('✅ REFRESHING PAGE IN 1 SECOND...');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);

    } catch (e) {
        console.error('Failed to clear cache', e);
    }
};
