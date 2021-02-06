$(document).ready(() => {
    initRender();
    $('#refresh').click(() => {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, (tabs) => {
            chrome.tabs.update(tabs[0].id, {
                url: tabs[0].url
            });
        });
    });
    $('#back').click(() => {
        location.href = 'popup.html';
    });
    $("input[name='filterMode']").click(() => {
        chrome.storage.sync.set({
            'fmkFilter::filterMode': $("input[name='filterMode']:checked").val()
        });
    });
    $("#hideTodaySwitch").click(() => {
        chrome.storage.sync.set({
            'fmkFilter::hideToday': !!$("#hideTodaySwitch:checked").val()
        });
    });
    $("#hidePoliticsSwitch").click(() => {
        chrome.storage.sync.set({
            'fmkFilter::hidePolitics': !!$("#hidePoliticsSwitch:checked").val()
        });
    });
    $("#hideHotPostsSwitch").click(() => {
        chrome.storage.sync.set({
            'fmkFilter::hideHotPosts': !!$("#hideHotPostsSwitch:checked").val()
        });
    });
    $('#remove-keywords').click(() => {
        chrome.storage.sync.remove('fmkFilter::keywords');
    });
});

function initRender() {
    chrome.storage.sync.get(['fmkFilter::filterMode', 'fmkFilter::hideToday', 'fmkFilter::hidePolitics', 'fmkFilter::hideHotPosts'], (result) => {
        $(`input[name='filterMode'][value=${result['fmkFilter::filterMode']}]`).prop('checked', true);
        $('#hideTodaySwitch').prop('checked', result['fmkFilter::hideToday']);
        $('#hidePoliticsSwitch').prop('checked', result['fmkFilter::hidePolitics']);
        $('#hideHotPostsSwitch').prop('checked', result['fmkFilter::hideHotPosts']);
    });
    const manifest = chrome.runtime.getManifest();
    $('#version').text(`버전: v${manifest.version}`);
}