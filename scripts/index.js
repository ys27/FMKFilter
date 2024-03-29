const white = 'rgb(255, 255, 255)';

$(document).ready(() => {
  const allTypes = ['category', 'keyword', 'replies', 'user'];
  const addValueTypes = ['keyword', 'user'];
  initStorage();
  getFilters();
  addValueTypes.forEach((type) => {
    getStoredValues(type);
    $(`#button-${type}`).click(() => {
      addStoredValue(type);
    });
  });
  getHideReplies();
  $('#refresh').click(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.update(tabs[0].id, { url: tabs[0].url });
    });
  });
  $('#settings').click(() => {
    location.href = 'settings.html';
  });
  allTypes.forEach((type, typeIndex) => {
    $(`#nav-${type}`).click(() => {
      allTypes.forEach((t) => {
        $(`#content-${t}`).hide();
        $(`#nav-${t}`).removeClass('active');
      });
      $(`#content-${allTypes[typeIndex]}`).show();
      $(`#nav-${allTypes[typeIndex]}`).addClass('active');
    });
  });
  $('#button-replies').click(() => {
    applyHideReplies();
  });
  $('#input-keyword').keyup((event) => {
    if (event.keyCode === 13) {
      $('#button-keyword').trigger('click');
    }
  });
  $('#input-user').keyup((event) => {
    if (event.keyCode === 13) {
      $('#button-user').trigger('click');
    }
  });
  $('#hideRepliesSwitch').click(() => {
    chrome.storage.sync.set({
      'fmkFilter::hideReplies': !!$('#hideRepliesSwitch:checked').val(),
    });
  });
  $('#input-replies').keyup((event) => {
    if (event.keyCode === 13) {
      $('#button-replies').trigger('click');
    }
  });
  $("input[name='hideRepliesMode']").click(() => {
    chrome.storage.sync.set({
      'fmkFilter::hideRepliesMode': $(
        "input[name='hideRepliesMode']:checked"
      ).val(),
    });
  });
  $("input[name='hideRepliesCountMethod']").click(() => {
    chrome.storage.sync.set({
      'fmkFilter::hideRepliesCountMethod': $(
        "input[name='hideRepliesCountMethod']:checked"
      ).val(),
    });
  });
});

function applyHideReplies() {
  const numHideReplies = $('#input-replies').val();
  if (numHideReplies) {
    chrome.storage.sync.set({ 'fmkFilter::numHideReplies': numHideReplies });
    $('#currentNumHideReplies').html(numHideReplies);
  } else {
    chrome.storage.sync.get('fmkFilter::numHideReplies', (res) => {
      $('#input-replies').val(res['fmkFilter::numHideReplies']);
    });
  }
}

function getHideReplies() {
  chrome.storage.sync.get(
    [
      'fmkFilter::hideReplies',
      'fmkFilter::numHideReplies',
      'fmkFilter::hideRepliesMode',
      'fmkFilter::hideRepliesCountMethod',
    ],
    (res) => {
      // Set the UI switches to match the stored values
      $('#hideRepliesSwitch').prop('checked', res['fmkFilter::hideReplies']);
      $('#currentNumHideReplies').html(res['fmkFilter::numHideReplies']);
      $('#input-replies').val(res['fmkFilter::numHideReplies']);
      $(
        `input[name='hideRepliesMode'][value=${res['fmkFilter::hideRepliesMode']}]`
      ).prop('checked', true);
      $(
        `input[name='hideRepliesCountMethod'][value=${res['fmkFilter::hideRepliesCountMethod']}]`
      ).prop('checked', true);
    }
  );
  chrome.storage.sync.get('fmkFilter::numHideReplies', (res) => {
    $('#input-replies').val(res['fmkFilter::numHideReplies']);
  });
}

function addStoredValue(type) {
  const value = $(`#input-${type}`).val();
  if (value.length) {
    chrome.storage.sync.get(`fmkFilter::${type}s`, (res) => {
      chrome.storage.sync.set(
        {
          [`fmkFilter::${type}s`]: {
            ...res[`fmkFilter::${type}s`],
            [value]: true,
          },
        },
        () => getStoredValues(type)
      );
    });
  }
}

function getStoredValues(type) {
  $(`#input-${type}`).val('');
  chrome.storage.sync.get(`fmkFilter::${type}s`, (res) => {
    $(`#${type}s`).empty();
    if (res[`fmkFilter::${type}s`]) {
      for (const [value, enabled] of Object.entries(
        res[`fmkFilter::${type}s`]
      )) {
        $(`#${type}s`).append(`
                    <li class="list-group-item d-flex justify-content-between align-items-center ${type}">
                        ${value}
                        <div>
                            <span id="toggle-${type}::${value}" ${
          enabled
            ? 'class="badge badge-primary badge-pill">사용</span>'
            : 'class="badge badge-secondary badge-pill">미사용</span>'
        }
                            <span id="remove-${type}::${value}">삭제</span>
                        </div>
                    </li>`);
      }
      $(`.${type} span`).click((el) => {
        const [, mode, value] = new RegExp(`^(.+)-${type}::(.+)$`).exec(
          el.target.id
        );
        chrome.storage.sync.get(`fmkFilter::${type}s`, (res) => {
          if (mode === 'toggle') {
            const enabled = !res[`fmkFilter::${type}s`][value];
            chrome.storage.sync.set(
              {
                [`fmkFilter::${type}s`]: {
                  ...res[`fmkFilter::${type}s`],
                  [value]: enabled,
                },
              },
              () => getStoredValues(type)
            );
          } else if (mode === 'remove') {
            delete res[`fmkFilter::${type}s`][value];
            chrome.storage.sync.set(
              {
                [`fmkFilter::${type}s`]: {
                  ...res[`fmkFilter::${type}s`],
                },
              },
              () => getStoredValues(type)
            );
          }
        });
      });
    }
  });
}

function getFilters() {
  $.ajax({
    url: 'https://www.fmkorea.com/board',
  }).done((html) => {
    const filtersListBeginRegex = /<nav class="bd bList">\s*<ul class="gn">/;
    const filtersListEndRegex = /<\/ul>\s*<\/nav>/;
    const filtersHtml = getSubstring(
      html,
      filtersListBeginRegex,
      filtersListEndRegex
    );
    const filterTitleRegex =
      /<span class="a"><a href="\/(?!best).*">(\S*)<\/a><\/span>/;
    const filtersList = getListOfSubstrings(filtersHtml, filterTitleRegex);
    const filters = getFiltersJson(filtersList.slice(1));
    renderFilters(filters);
  });
}

function initStorage() {
  chrome.storage.sync.get(
    [
      'fmkFilter::filterMode',
      'fmkFilter::hideRepliesMode',
      'fmkFilter::hideRepliesCountMethod',
    ],
    (res) => {
      if (!res['fmkFilter::filterMode']) {
        chrome.storage.sync.set({ 'fmkFilter::filterMode': 'blur' });
      }
      if (!res['fmkFilter::hideRepliesMode']) {
        chrome.storage.sync.set({ 'fmkFilter::hideRepliesMode': 'blur' });
      }
      if (!res['fmkFilter::hideRepliesCountMethod']) {
        chrome.storage.sync.set({
          'fmkFilter::hideRepliesCountMethod': 'downvotes',
        });
      }
    }
  );
}

function getFiltersJson(filtersList) {
  let json = {};
  const innerTitleRegex =
    /<li>\s*<a href="\/\S*">\s*(\S*)\s*<\/a>\s|<li>\s*<span class="a2">(\S*)<\/span>/;
  for (const filter of filtersList) {
    if (innerTitleRegex.test(filter.html)) {
      let innerJson = {};
      let innerFiltersList = getListOfSubstrings(filter.html, innerTitleRegex);
      for (const innerFilter of innerFiltersList) {
        innerJson[innerFilter.title] = getListOfFilters(innerFilter.html);
      }
      json[filter.title] = innerJson;
    } else {
      json[filter.title] = getListOfFilters(filter.html);
    }
  }
  return json;
}

function getListOfFilters(srcStr) {
  let list = [];
  const filterRegex = /<li>\s*<a href="\/(\S*)">(.*\S*.*)<\/a>/;
  while (filterRegex.test(srcStr)) {
    const filter = filterRegex.exec(srcStr);
    list.push({ [filter[2]]: filter[1] });
    srcStr = srcStr.substring(filter.index + filter[0].length);
  }
  return list;
}

function getListOfSubstrings(srcStr, iterativeRegex) {
  let list = [];
  let normalFiltersStr = srcStr.substring(srcStr.search(iterativeRegex));
  while (iterativeRegex.test(normalFiltersStr)) {
    const titles = iterativeRegex.exec(normalFiltersStr);
    const title = titles[1] ? titles[1] : titles[2];
    const html = getSubstring(normalFiltersStr, iterativeRegex, iterativeRegex);
    list.push({ title, html });
    normalFiltersStr = normalFiltersStr.substring(
      titles.index + titles[0].length
    );
  }
  return list;
}

function getSubstring(srcStr, startRegex, endRegex) {
  let targetStr = '';
  const startElem = startRegex.exec(srcStr);
  const startIndex = startElem.index + startElem[0].length;
  targetStr = srcStr.substring(startIndex);
  const endIndex = targetStr.search(endRegex);
  if (endIndex === -1) {
    return targetStr;
  }
  return targetStr.substring(0, endIndex);
}

function renderFilters(filters) {
  $('#loader').hide();
  const renderCategories = (categories, index, subIndex = '') => {
    for (categoryObj of categories) {
      for (const [category, categoryId] of Object.values(
        Object.entries(categoryObj)
      )) {
        $(`#${index}${subIndex}`).append(
          `<div id="${categoryId}" class="category"><span class="filter">${category}</span></div>`
        );
        const key = `fmkFilter::${categoryId}`;
        chrome.storage.sync.get([key], (res) => {
          res[key] !== false
            ? $(`#${categoryId}`).addClass('enabled')
            : $(`#${categoryId}`).addClass('disabled');
        });
      }
    }
  };

  for (const [index, [mainCategory, subLevel]] of Object.entries(
    Object.entries(filters)
  )) {
    $('#categories').append(
      `<div id="${index}" class="mainCategory"><span class="filter">${mainCategory}</span></div>`
    );
    if (isArray(subLevel)) {
      renderCategories(subLevel, index);
    } else if (isObject(subLevel)) {
      for (const [subIndex, [subCategory, categories]] of Object.entries(
        Object.entries(subLevel)
      )) {
        $(`#${index}`).append(
          `<div id="${index}${subIndex}" class="subCategory"><span class="filter">${subCategory}</span></div>`
        );
        renderCategories(categories, index, subIndex);
      }
    }
  }
  $('span.filter').click(function () {
    toggleView($(this).parent());
  });
}

function toggleView(category) {
  if (category.hasClass('mainCategory') || category.hasClass('subCategory')) {
    category.hasClass('disabled')
      ? category.find('div').addClass('enabled').removeClass('disabled')
      : category.find('div').addClass('disabled').removeClass('enabled');

    category.find('div').each(function () {
      category.hasClass('disabled')
        ? setFilterTrue($(this).attr('id'))
        : setFilterFalse($(this).attr('id'));
    });
  }
  category.toggleClass('enabled').toggleClass('disabled');
  category.hasClass('enabled')
    ? setFilterTrue(category.attr('id'))
    : setFilterFalse(category.attr('id'));
}

function setFilterTrue(id) {
  chrome.storage.sync.set({ [`fmkFilter::${id}`]: true });
}

function setFilterFalse(id) {
  chrome.storage.sync.set({ [`fmkFilter::${id}`]: false });
}

function isObject(value) {
  return value && typeof value === 'object' && value.constructor === Object;
}

function isArray(value) {
  return value && typeof value === 'object' && value.constructor === Array;
}
