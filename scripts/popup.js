const white = 'rgb(255, 255, 255)'

$(document).ready(() => {
    getFilters();
    getKeywords();
    $('#refresh').click(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.update(tabs[0].id, { url: tabs[0].url });
        });
    });
    $('#settings').click(() => {
        location.href = 'settings.html';
    });
    $('#nav-category, #nav-keyword').click(() => {
        $('#content-category').toggle();
        $('#content-keyword').toggle();
        $('#nav-category').toggleClass('active');
        $('#nav-keyword').toggleClass('active');
    });
    $('#button-keyword').click(() => {
        const keyword = $('#input-keyword').val();
        chrome.storage.sync.get('fmkFilter::keywords', (keywords) => {
            chrome.storage.sync.set({
                'fmkFilter::keywords': {
                    ...keywords['fmkFilter::keywords'],
                    [keyword]: true
                }
            }, getKeywords);
        });
    });
});

function getKeywords() {
    $('#input-keyword').val('');
    chrome.storage.sync.get('fmkFilter::keywords', (keywords) => {
        $('#keywords').empty();
        for (const [keyword, enabled] of Object.entries(keywords['fmkFilter::keywords'])) {
            $('#keywords').append(`
                <li class="list-group-item d-flex justify-content-between align-items-center keyword">
                    ${keyword}
                    <div>
                        <span id="toggle-keyword::${keyword}" ${enabled ? 'class="badge badge-primary badge-pill">사용</span>' : 'class="badge badge-secondary badge-pill">미사용</span>'}
                        <span id="remove-keyword::${keyword}">삭제</span>
                    </div>
                </li>`
            );
        }
        $('.keyword span').click((el) => {
            const [, mode, keyword] = /^(.+)-keyword::(.+)$/.exec(el.target.id);
            chrome.storage.sync.get('fmkFilter::keywords', (keywords) => {
                if (mode === 'toggle') {
                    const enabled = !keywords['fmkFilter::keywords'][keyword];
                    chrome.storage.sync.set({
                        'fmkFilter::keywords': {
                            ...keywords['fmkFilter::keywords'],
                            [keyword]: enabled
                        }
                    }, getKeywords)
                } else if (mode === 'remove') {
                    delete keywords['fmkFilter::keywords'][keyword];
                    chrome.storage.sync.set({
                        'fmkFilter::keywords': {
                            ...keywords['fmkFilter::keywords']
                        }
                    }, getKeywords)
                }
            })
        })
    })
}

function getFilters() {
    $.ajax({
        url: 'https://www.fmkorea.com/board'
    })
        .done((html) => {
            const filtersListBeginRegex = /<nav class="bd bList">\s*<ul class="gn">/;
            const filtersListEndRegex = /<\/ul>\s*<\/nav>/;
            const filtersHtml = getSubstring(html, filtersListBeginRegex, filtersListEndRegex);
            const filterTitleRegex = /<span class="a"><a href="\/(?!best).*">(\S*)<\/a><\/span>/;
            const filtersList = getListOfSubstrings(filtersHtml, filterTitleRegex);
            const filters = getFiltersJson(filtersList.slice(1));
            initStorage(filters);
            renderFilters(filters);
        });
}

function initStorage(filters) {
    chrome.storage.sync.get('fmkFilter::filterMode', (result) => {
        if (result['fmkFilter::filterMode'] === undefined) {
            chrome.storage.sync.set({ 'fmkFilter::filterMode': 'blur' });
        }
    });
    for (const subLevel of Object.values(Object.values(filters))) {
        if (isArray(subLevel)) {
            for (categoryObj of subLevel) {
                for (const categoryId of Object.values(Object.values(categoryObj))) {
                    const key = `fmkFilter::${categoryId}`
                    chrome.storage.sync.get([key], (result) => {
                        if (result[key] === undefined) {
                            setFilterTrue(categoryId);
                        }
                    });
                }
            }
        }
        else if (isObject(subLevel)) {
            for (const categories of Object.values(Object.values(subLevel))) {
                for (categoryObj of categories) {
                    for (const categoryId of Object.values(Object.values(categoryObj))) {
                        const key = `fmkFilter::${categoryId}`
                        chrome.storage.sync.get([key], (result) => {
                            if (result[key] === undefined) {
                                setFilterTrue(categoryId);
                            }
                        });
                    }
                }
            }
        }
    }
}

function getFiltersJson(filtersList) {
    let json = {};
    const innerTitleRegex = /<li>\s*<a href="\/\S*">\s*(\S*)\s*<\/a>\s|<li>\s*<span class="a2">(\S*)<\/span>/;
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
        normalFiltersStr = normalFiltersStr.substring(titles.index + titles[0].length);
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
    for (const [index, [mainCategory, subLevel]] of Object.entries(Object.entries(filters))) {
        $('#categories').append(`<div id="${index}" class="mainCategory"><span class="filter">${mainCategory}</span></div>`);
        if (isArray(subLevel)) {
            for (categoryObj of subLevel) {
                for (const [category, categoryId] of Object.values(Object.entries(categoryObj))) {
                    $(`#${index}`).append(`<div id="${categoryId}" class="category"><span class="filter">${category}</span></div>`);
                    const key = `fmkFilter::${categoryId}`
                    chrome.storage.sync.get([key], (result) => {
                        result[key] ? $(`#${categoryId}`).addClass('enabled') : $(`#${categoryId}`).addClass('disabled');
                    });
                }
            }
        }
        else if (isObject(subLevel)) {
            for (const [subIndex, [subCategory, categories]] of Object.entries(Object.entries(subLevel))) {
                $(`#${index}`).append(`<div id="${index}${subIndex}" class="subCategory"><span class="filter">${subCategory}</span></div>`);
                for (categoryObj of categories) {
                    for (const [category, categoryId] of Object.values(Object.entries(categoryObj))) {
                        $(`#${index}${subIndex}`).append(`<div id="${categoryId}" class="category"><span class="filter">${category}</span></div>`);
                        const key = `fmkFilter::${categoryId}`
                        chrome.storage.sync.get([key], (result) => {
                            result[key] ? $(`#${categoryId}`).addClass('enabled') : $(`#${categoryId}`).addClass('disabled');
                        });
                    }
                }
            }
        }
    }
    $('span.filter').click(function () {
        toggleView($(this).parent());
    })
}

function toggleView(category) {
    if (category.hasClass('mainCategory') || category.hasClass('subCategory')) {
        category.hasClass('disabled') ?
            category.find('div').addClass('enabled').removeClass('disabled') :
            category.find('div').addClass('disabled').removeClass('enabled');

        category.find('div').each(function () {
            category.hasClass('disabled') ?
                setFilterTrue($(this).attr('id')) : setFilterFalse($(this).attr('id'));
        })
    }
    category.toggleClass('enabled').toggleClass('disabled');
    category.hasClass('enabled') ? setFilterTrue(category.attr('id')) : setFilterFalse(category.attr('id'));
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
