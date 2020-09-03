$(document).ready(() => {
    initRender();
    $('#refresh').click(() => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
        });
    });
    $('#back').click(() => {
        location.href = 'popup.html';
    });
    $("input[name='filterMode']").click(() => {
        chrome.storage.sync.set({ 'fmkFilter::filterMode': $("input[name='filterMode']:checked").val() });
    });
    $("#hideTodaySwitch").click(() => {
        chrome.storage.sync.set({ 'fmkFilter::hideToday': !!$("#hideTodaySwitch:checked").val() });
    });
    $('#remove-keywords').click(() => {
        chrome.storage.sync.remove('fmkFilter::keywords');
    });
});

function initRender() {
    chrome.storage.sync.get(['fmkFilter::filterMode', 'fmkFilter::hideToday'], (result) => {
        $(`input[name='filterMode'][value=${result['fmkFilter::filterMode']}]`).prop('checked', true);
        $('#hideTodaySwitch').prop('checked', result['fmkFilter::hideToday'])
    });
}