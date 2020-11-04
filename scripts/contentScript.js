$(document).ready(() => {
    shouldFilterByPath() && findAndFilterCategories();
    chrome.storage.sync.get('fmkFilter::hideToday', (result) => {
        if (result['fmkFilter::hideToday']) {
            hideToday();
        }
    });
    findAndFilterKeyword('ul', 'li.li', 'h3');
    findAndFilterKeyword('tbody', 'tr', 'td');
    chrome.storage.sync.get('fmkFilter::hidePolitics', (result) => {
        if (result['fmkFilter::hidePolitics']) {
            hidePolitics();
        }
    });
    setTimeout(() => $('body').css('visibility', 'visible'), 0);
})

function findAndFilterCategories() {
    $('.fm_best_widget').find('li').each(function () {
        const href = $(this).find('.category').children('a').attr('href');
        const key = `fmkFilter::${href}`;
        chrome.storage.sync.get([key, 'fmkFilter::filterMode'], (result) => {
            if (result[key] === false) {
                if (result['fmkFilter::filterMode'] === 'blur') {
                    blur($(this));
                    $(this).find('.title').find('a')
                        .mouseenter(() => { unblur($(this)) })
                        .mouseleave(() => { blur($(this)) });
                }
                else if (result['fmkFilter::filterMode'] === 'hide') {
                    $(this).hide();
                }
            }
        });
    });
}

function findAndFilterKeyword(listElemType, postElemType, titleElemType) {
    $(listElemType).find(postElemType).each(function () {
        const title = $(this).find(`${titleElemType}.title`).children('a').text();
        const key = `fmkFilter::keywords`;
        chrome.storage.sync.get([key, 'fmkFilter::filterMode'], (result) => {
            if (result[key]) {
                for ([keyword, enabled] of Object.entries(result[key])) {
                    if (enabled && title.includes(keyword)) {
                        if (result['fmkFilter::filterMode'] === 'blur') {
                            blur($(this));
                            $(this).find('.title').find('a')
                                .mouseenter(() => unblur($(this)))
                                .mouseleave(() => blur($(this)));
                        }
                        else if (result['fmkFilter::filterMode'] === 'hide') {
                            $(this).hide();
                        }
                    }
                }
            }
        });
    })
}

function hideToday() {
    $('.content_widget').hide();
}

function hidePolitics() {
    if (window.location.pathname === '/') {
        const politicsBanner = $("a:contains('정치 게시판 인기글')").parents("div.tl_srch.clear");
        politicsBanner.next().hide();
        politicsBanner.hide();
    }
}

function blur(elem) {
    elem.css('-webkit-filter', 'blur(3px)');
    elem.css('-moz-filter', 'blur(3px)');
    elem.css('-o-filter', 'blur(3px)');
    elem.css('-ms-filter', 'blur(3px)');
    elem.css('filter', 'blur(3px)');
}

function unblur(elem) {
    elem.css('-webkit-filter', 'blur(0px)');
    elem.css('-moz-filter', 'blur(0px)');
    elem.css('-o-filter', 'blur(0px)');
    elem.css('-ms-filter', 'blur(0px)');
    elem.css('filter', 'blur(0px)');
}

function shouldFilterByPath() {
    const search = window.location.search;
    return search === '' || search.startsWith('?mid=best');
}