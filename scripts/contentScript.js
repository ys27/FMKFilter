$(document).ready(() => {
    shouldFilterByPath() && findAndFilterCategories();
    findAndFilterKeyword('ul', 'li.li', 'h3');
    findAndFilterKeyword('tbody', 'tr', 'td');
    chrome.storage.sync.get(['fmkFilter::hideToday', 'fmkFilter::hidePolitics', 'fmkFilter::hideHotPosts'], (result) => {
        result['fmkFilter::hideToday'] && hideToday();
        result['fmkFilter::hidePolitics'] && hidePolitics();
        result['fmkFilter::hideHotPosts'] && hideHotPosts();
    });
    setTimeout(() => $('body').css('visibility', 'visible'), 0);
})

function findAndFilterCategories() {
    $('.fm_best_widget').find('li').each(function () {
        const href = $(this).find('.category').children('a').attr('href');
        const key = `fmkFilter::${href}`;
        chrome.storage.sync.get([key, 'fmkFilter::filterMode'], (result) => {
            if (result[key] === false) {
                hide(this, result);
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
                        hide(this, result);
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

function hideHotPosts() {
    $('.fm_best_widget').find('li.li_best2_pop1').each(function () {
        $(this).hide();
    });
}

function hide(elem, storage) {
    if (storage['fmkFilter::filterMode'] === 'blur') {
        blur($(elem));
        $(elem).find('.title').find('a')
            .mouseenter(() => unblur($(elem)))
            .mouseleave(() => blur($(elem)));
    } else if (storage['fmkFilter::filterMode'] === 'hide') {
        $(elem).hide();
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