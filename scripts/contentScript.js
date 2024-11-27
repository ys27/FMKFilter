$(document).ready(() => {
  shouldFilterByPath() && findAndFilterCategories();
  findAndFilterKeyword('ul', 'li.li', 'h3');
  findAndFilterKeyword('tbody', 'tr', 'td');
  findAndFilterUser('ul', 'li.li', 'span.author');
  findAndFilterUser('table.bd_lst tbody', 'tr', 'td.author span a');
  setUpRepliesObserver();
  chrome.storage.sync.get(
    [
      'fmkFilter::hideToday',
      'fmkFilter::hidePolitics',
      'fmkFilter::hideHotPosts',
      'fmkFilter::hideReplies',
      'fmkFilter::numHideReplies',
      'fmkFilter::users',
    ],
    (res) => {
      res['fmkFilter::hideToday'] && hideToday();
      res['fmkFilter::hidePolitics'] && hidePolitics();
      res['fmkFilter::hideHotPosts'] && hideHotPosts();
      res['fmkFilter::hideReplies'] &&
        res['fmkFilter::numHideReplies'] &&
        hideReplies(parseFloat(res['fmkFilter::numHideReplies']));
      res['fmkFilter::users'] && hideUsers();
    }
  );
  openLinksInNewTab();
  setTimeout(() => $('.fm_best_widget').css('display', 'block'), 0);
});

function setUpRepliesObserver() {
  const observer = new MutationObserver(() => {
    chrome.storage.sync.get(
      [
        'fmkFilter::hideReplies',
        'fmkFilter::numHideReplies',
        'fmkFilter::users',
      ],
      (res) => {
        res['fmkFilter::hideReplies'] &&
          res['fmkFilter::numHideReplies'] &&
          hideReplies(parseFloat(res['fmkFilter::numHideReplies']));
        res['fmkFilter::users'] && hideUsers();
      }
    );
  });

  const repliesNode = document.getElementById('cmtPosition');

  if (repliesNode) {
    observer.observe(repliesNode, {
      childList: true,
    });
  }
}

function hideReplies(numHideReplies) {
  chrome.storage.sync.get(
    [
      'fmkFilter::hideRepliesCountMethod',
      'fmkFilter::numHideReplies',
      'fmkFilter::hideRepliesMode',
    ],
    (res) => {
      $('ul.fdb_lst_ul')
        .find('li.fdb_itm')
        .each(function () {
          const numDownvotes = parseInt(
            $(this)
              .find(
                'div.fdb_nav > span.vote > a.bd_login[title="비추천"] > span.blamed_count'
              )
              .html() || 0
          );
          const numUpvotes = parseInt(
            $(this)
              .find(
                'div.fdb_nav > span.vote > a.bd_login[title="추천"] > span.voted_count'
              )
              .html() || 0
          );
          if (
            (res['fmkFilter::hideRepliesCountMethod'] == 'downvotes' &&
              numDownvotes > numHideReplies) ||
            (res['fmkFilter::hideRepliesCountMethod'] ==
              'downvotesLessUpvotes' &&
              numDownvotes - numUpvotes > numHideReplies)
          ) {
            hide(this, res['fmkFilter::hideRepliesMode']);
          }
        });
    }
  );
}

function findAndFilterCategories() {
  $('.fm_best_widget')
    .find('li')
    .each(function () {
      const href = $(this).find('.category').children('a').attr('href');
      const key = `fmkFilter::${href}`;
      chrome.storage.sync.get([key, 'fmkFilter::filterMode'], (res) => {
        if (res[key] === false) {
          hide(this, res['fmkFilter::filterMode']);
        }
      });
    });
}

function findAndFilterKeyword(listElemType, postElemType, titleElemType) {
  $(listElemType)
    .find(postElemType)
    .each(function () {
      const title = $(this).find(`${titleElemType}.title`).children('a').text();
      const key = `fmkFilter::keywords`;
      chrome.storage.sync.get([key, 'fmkFilter::filterMode'], (res) => {
        if (res[key]) {
          for ([keyword, enabled] of Object.entries(res[key])) {
            if (enabled && title.includes(keyword)) {
              hide(this, res['fmkFilter::filterMode']);
            }
          }
        }
      });
    });
}

function hideUsers() {
  chrome.storage.sync.get(
    ['fmkFilter::users', 'fmkFilter::hideRepliesMode'],
    (res) => {
      const hiddenUsers = res['fmkFilter::users'];
      $('ul.fdb_lst_ul')
        .find('li.fdb_itm')
        .each(function () {
          const user = $(this).find('div.meta > a.member_plate').text();
          if (hiddenUsers[user]) {
            hide(this, res['fmkFilter::hideRepliesMode']);
          }
        });
    }
  );
}

function findAndFilterUser(listElemType, postElemType, titleElemType) {
  $(listElemType)
    .find(postElemType)
    .each(function () {
      const user =
        $(this).find(titleElemType).text().split('/ ')[1] ||
        $(this).find(titleElemType).text();
      const key = `fmkFilter::users`;
      chrome.storage.sync.get([key, 'fmkFilter::filterMode'], (res) => {
        if (res[key]) {
          for ([hiddenUser, enabled] of Object.entries(res[key])) {
            if (enabled && user?.includes(hiddenUser)) {
              hide(this, res['fmkFilter::filterMode']);
            }
          }
        }
      });
    });
}

function hideToday() {
  $('.content_widget').hide();
}

function hidePolitics() {
  if (window.location.pathname === '/') {
    const politicsBanner = $("a:contains('정치 게시판 인기글')").parents(
      'div.tl_srch.clear'
    );
    politicsBanner.next().hide();
    politicsBanner.hide();
  }
}

function hideHotPosts() {
  $('.fm_best_widget')
    .find('li.li_best2_pop1')
    .each(function () {
      $(this).hide();
    });
}

function openLinksInNewTab() {
  $('h3.title > a, span.comment_count').on('click', (e) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    let href = e.target.href;
    if (!href) {
      href = e.target.parentNode.href;
    }
    chrome.storage.sync.get('fmkFilter::openLinksInNewTab', (res) => {
      if (res['fmkFilter::openLinksInNewTab']) {
        chrome.runtime.sendMessage({ link: href });
      } else {
        window.location.href = href;
      }
    });
  });
}

function hide(elem, hideMode) {
  if (hideMode === 'blur') {
    blur($(elem));
    $(elem)
      .on('mouseenter', () => unblur($(elem)))
      .on('mouseleave', () => blur($(elem)));
  } else if (hideMode === 'hide') {
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
