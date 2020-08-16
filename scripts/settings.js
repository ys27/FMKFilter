$(document).ready(() => {
    initStorage();
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
    $('#remove-keywords').click(() => {
        chrome.storage.sync.remove('fmkFilter::keywords');
    });
});

function initStorage() {
    chrome.storage.sync.get('fmkFilter::filterMode', (result) => {
        $(`input[name='filterMode'][value=${result['fmkFilter::filterMode']}]`).prop('checked', true);
    });
}
