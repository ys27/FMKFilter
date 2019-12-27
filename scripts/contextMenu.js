chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'fmkFilter::blockUser',
        title: '유저 블락하기',
        contexts: ['link'],
        documentUrlPatterns: ['https://*.fmkorea.com/*']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    alert(JSON.stringify(info))
    const username = info['selectionText'];
    chrome.storage.sync.get('fmkFilter::blockedUsers', (users) => {
        alert(JSON.stringify(users))
        chrome.storage.sync.set({
            'fmkFilter::blockedUsers': {
                ...users['fmkFilter::blockedUsers'],
                [username]: true
            }
        });
        alert(JSON.stringify({
            ...users['fmkFilter::blockedUsers'],
            [username]: true
        }))
    })
});