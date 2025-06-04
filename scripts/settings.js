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
    chrome.storage.local.set({
      'fmkFilter::filterMode': $("input[name='filterMode']:checked").val(),
    });
  });
  $('#hideTodaySwitch').click(() => {
    chrome.storage.local.set({
      'fmkFilter::hideToday': !!$('#hideTodaySwitch:checked').val(),
    });
  });
  $('#hidePoliticsSwitch').click(() => {
    chrome.storage.local.set({
      'fmkFilter::hidePolitics': !!$('#hidePoliticsSwitch:checked').val(),
    });
  });
  $('#hideHotPostsSwitch').click(() => {
    chrome.storage.local.set({
      'fmkFilter::hideHotPosts': !!$('#hideHotPostsSwitch:checked').val(),
    });
  });
  $('#openLinksInNewTabSwitch').click(() => {
    chrome.storage.local.set({
      'fmkFilter::openLinksInNewTab': !!$(
        '#openLinksInNewTabSwitch:checked'
      ).val(),
    });
  });
  $('#remove-keywords').click(() => {
    chrome.storage.local.remove('fmkFilter::keywords');
  });
  $('#remove-users').click(() => {
    chrome.storage.local.remove('fmkFilter::users');
  });
  $('#download-settings').click(() => {
    chrome.storage.local.get(null, backUpSettings);
  });
  $('#upload-settings').click(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            chrome.storage.local.clear();
            chrome.storage.local.set(data, () => {
              alert('불러오기 완료! 새로고침 후 적용됩니다.');
            });
          } catch (error) {
            alert('불러올 수 없습니다. 올바른 JSON 파일인지 확인하세요.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  });
  $('#download-sync-settings').click(() => {
    chrome.storage.sync.get(null, backUpSettings);
  });
});

function initRender() {
  chrome.storage.local.get(
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

function backUpSettings(items) {
  const blob = new Blob([JSON.stringify(items, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date();
  const formattedDate = date.toISOString().replace(/[:.]/g, '-');
  a.download = `fmkFilter-settings-${formattedDate}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
