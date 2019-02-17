$(document).ready(() => {
    initStorage();
    $('#refresh').on('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
        });
    });
    $('#back').on('click', () => {
        location.href = 'popup.html';
    });
    $("input[name='filterMode']").on('click', () => {
        chrome.storage.sync.set({ 'filterMode': $("input[name='filterMode']:checked").val() });
    });
});

function initStorage() {
    chrome.storage.sync.get('filterMode', (result) => {
        $(`input[name='filterMode'][value=${result['filterMode']}]`).prop('checked', true);
    });
}
