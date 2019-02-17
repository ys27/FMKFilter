const white = 'rgb(255, 255, 255)'

$(document).ready(() => {
    $.getJSON("categories.json", (filters) => {
        initStorage(filters);
        renderFilters(filters);
    });
    $('#refresh').on('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
        });
    });
    $('#settings').on('click', () => {
        location.href = 'settings.html';
    });
})

function initStorage(filters) {
    chrome.storage.sync.get('filterMode', (result) => {
        if (result['filterMode'] === undefined) {
            chrome.storage.sync.set({ 'filterMode': 'blur' });
        }
    });
    for (const [index, [mainCategory, subLevel]] of Object.entries(Object.entries(filters))) {
        if (isArray(subLevel)) {
            for (categoryObj of subLevel) {
                for (const [, [category, categoryId]] of Object.entries(Object.entries(categoryObj))) {
                    const key = `fmkFilter-${categoryId}`
                    chrome.storage.sync.get([key], (result) => {
                        if (result[key] === undefined) {
                            setFilterTrue(categoryId);
                        }
                    });
                }
            }
        }
        else if (isObject(subLevel)) {
            for (const [subIndex, [subCategory, categories]] of Object.entries(Object.entries(subLevel))) {
                for (categoryObj of categories) {
                    for (const [, [category, categoryId]] of Object.entries(Object.entries(categoryObj))) {
                        const key = `fmkFilter-${categoryId}`
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

function renderFilters(filters) {
    for (const [index, [mainCategory, subLevel]] of Object.entries(Object.entries(filters))) {
        $('#categories').append(`<div id="${index}" class="mainCategory"><span class="filter">${mainCategory}</span></div>`);
        if (isArray(subLevel)) {
            for (categoryObj of subLevel) {
                for (const [, [category, categoryId]] of Object.entries(Object.entries(categoryObj))) {
                    $(`#${index}`).append(`<div id="${categoryId}" class="category"><span class="filter">${category}</span></div>`);
                    const key = `fmkFilter-${categoryId}`
                    chrome.storage.sync.get([key], (result) => {
                        result[key] === 'false' ? $(`#${categoryId}`).addClass('disabled') : $(`#${categoryId}`).addClass('enabled');
                    });
                }
            }
        }
        else if (isObject(subLevel)) {
            for (const [subIndex, [subCategory, categories]] of Object.entries(Object.entries(subLevel))) {
                $(`#${index}`).append(`<div id="${index}${subIndex}" class="subCategory"><span class="filter">${subCategory}</span></div>`);
                for (categoryObj of categories) {
                    for (const [, [category, categoryId]] of Object.entries(Object.entries(categoryObj))) {
                        $(`#${index}${subIndex}`).append(`<div id="${categoryId}" class="category"><span class="filter">${category}</span></div>`);
                        const key = `fmkFilter-${categoryId}`
                        chrome.storage.sync.get([key], (result) => {
                            result[key] === 'false' ? $(`#${categoryId}`).addClass('disabled') : $(`#${categoryId}`).addClass('enabled');
                        });
                    }
                }
            }
        }
    }
    $('span.filter').on('click', function() {
        toggleView($(this).parent());
    })
}

function toggleView(category) {
    if (category.hasClass('mainCategory') || category.hasClass('subCategory')) {
        category.hasClass('disabled') ?
            category.find('div').addClass('enabled').removeClass('disabled') :
                category.find('div').addClass('disabled').removeClass('enabled');

        category.find('div').each(function() {
            category.hasClass('disabled') ?
                setFilterTrue($(this).attr('id')) : setFilterFalse($(this).attr('id'));
        })
    }
    category.toggleClass('enabled').toggleClass('disabled');
    category.hasClass('enabled') ? setFilterTrue(category.attr('id')) : setFilterFalse(category.attr('id'));
}

function setFilterTrue(id) {
    const key = `fmkFilter-${id}`;
    chrome.storage.sync.set({ [key]: 'true' });
}

function setFilterFalse(id) {
    const key = `fmkFilter-${id}`;
    chrome.storage.sync.set({ [key]: 'false' });
}

function isObject (value) {
    return value && typeof value === 'object' && value.constructor === Object;
}

function isArray (value) {
    return value && typeof value === 'object' && value.constructor === Array;
}
