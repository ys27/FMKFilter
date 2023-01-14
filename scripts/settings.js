$(document).ready(() => {
  initRender();
  $('#refresh').click(() => {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      (tabs) => {
        chrome.tabs.update(tabs[0].id, {
          url: tabs[0].url,
        });
      }
    );
  });
  $('#back').click(() => {
    location.href = 'index.html';
  });
  $("input[name='filterMode']").click(() => {
    chrome.storage.sync.set({
      'fmkFilter::filterMode': $("input[name='filterMode']:checked").val(),
    });
  });
  $('#hideTodaySwitch').click(() => {
    chrome.storage.sync.set({
      'fmkFilter::hideToday': !!$('#hideTodaySwitch:checked').val(),
    });
  });
  $('#hidePoliticsSwitch').click(() => {
    chrome.storage.sync.set({
      'fmkFilter::hidePolitics': !!$('#hidePoliticsSwitch:checked').val(),
    });
  });
  $('#hideHotPostsSwitch').click(() => {
    chrome.storage.sync.set({
      'fmkFilter::hideHotPosts': !!$('#hideHotPostsSwitch:checked').val(),
    });
  });
  $('#openLinksInNewTabSwitch').click(() => {
    chrome.storage.sync.set({
      'fmkFilter::openLinksInNewTab': !!$(
        '#openLinksInNewTabSwitch:checked'
      ).val(),
    });
  });
  $('#remove-keywords').click(() => {
    chrome.storage.sync.remove('fmkFilter::keywords');
  });
});

function initRender() {
  chrome.storage.sync.get(
    [
      'fmkFilter::filterMode',
      'fmkFilter::hideToday',
      'fmkFilter::hidePolitics',
      'fmkFilter::hideHotPosts',
      'fmkFilter::openLinksInNewTab',
    ],
    (res) => {
      // Set the UI switches to match the stored values
      $(`input[name='filterMode'][value=${res['fmkFilter::filterMode']}]`).prop(
        'checked',
        true
      );
      $('#hideTodaySwitch').prop('checked', res['fmkFilter::hideToday']);
      $('#hidePoliticsSwitch').prop('checked', res['fmkFilter::hidePolitics']);
      $('#hideHotPostsSwitch').prop('checked', res['fmkFilter::hideHotPosts']);
      $('#openLinksInNewTabSwitch').prop(
        'checked',
        res['fmkFilter::openLinksInNewTab']
      );
    }
  );
  const manifest = chrome.runtime.getManifest();
  $('#version').text(`버전: v${manifest.version}`);
}
