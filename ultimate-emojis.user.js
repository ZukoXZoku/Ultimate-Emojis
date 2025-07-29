// ==UserScript==
// @name         Ultimate Emojis
// @version      0.1
// @description  Discord-style emoji/sticker/gif picker with favorites, pagination, search.
// @author       ZukoXZoku
// @match        https://aither.cc/*
// @match        https://blutopia.cc/*
// @match        https://fearnopeer.com/*
// @match        https://lst.gg/*
// @match        https://reelflix.xyz/*
// @match        https://upload.cx/*
// @match        https://oldtoons.world/*
// @icon         https://ptpimg.me/91xfz9.gif
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      //url
// ==/UserScript==

(function () {
  'use strict';

  const JSON_URL = '#'; // Do not touch this
  const EMOJIS_PER_PAGE = 306;

  let allEmojis = [];
  let filteredEmojis = [];
  let currentPage = 1;

  // Load favorites from storage
  const favorites = new Set(JSON.parse(GM_getValue('uni_favoriteEmojis', '[]')));

  // Create container
  const container = document.createElement('div');
  container.id = 'uni-emoji-menu';
  document.body.appendChild(container);




  // Inject Discord-style dark theme CSS with updated unique selectors
  GM_addStyle(`
    /* Container */
    #uni-emoji-menu {
      position: fixed;
      bottom: 15px;
      right: 15px;
      width: 440px;
      max-height: 75vh;
      background-color: #2f3136;
      color: #dcddde;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
      padding: 12px;
      display: none;
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      user-select: none;
      flex-direction: column;
      z-index: 9999999;
    }

    /* Search input */
    #uni-emoji-search {
    z-index: 998;
    position: sticky;
    top: 0;
    grid-column: 1 / -1;
    background: linear-gradient(135deg, #2f3136, #3a3b41);
    color: #e0e0e0;
    height: 36px;
    border: 2px solid #444;
    border-radius: 10px;
    width: 100%;
    padding: 8px 14px;
    box-sizing: border-box;
    font-size: 14px;
    font-family: 'Segoe UI', sans-serif;
    outline: none;
    box-shadow: 0 2px 5px rgba(0,0,0,0.25);
    transition: all 0.2s ease;
    margin: 5px 0 15px 0;
    }
    #uni-emoji-search::placeholder {
      color: #72767d;
    }
    #uni-emoji-search:focus {
      outline: none;
      background-color: #292b2f;
      box-shadow: 0 0 6px #7289da;
      color: #fff;
    }

    /* Emoji grid */
    .uni-emoji-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, 36px);
      gap: 8px;
      justify-content: start;
      overflow-y: auto;
      flex-grow: 1;
      padding-right: 4px;
    }

    .uni-emoji-grid img {
      width: 36px;
      height: 36px;
      border-radius: 6px;
      cursor: pointer;
      object-fit: contain;
      filter: drop-shadow(0 0 1px #000);
      position: relative;
      background-color: #202225;
    }
    .uni-emoji-grid img:hover {
      transform: scale(1.3);
      box-shadow: 0 0 8px #7289da;
      z-index: 10;
    }

    /* Favorite star overlay */
    .uni-emoji-favorite {
      position: relative;
    }
    .uni-emoji-favorite::after {
      content: "★";
      position: absolute;
      top: 2px;
      right: 2px;
      font-size: 14px;
      color: #f1c40f;
      text-shadow:
        0 0 2px #000,
        0 0 4px #000;
      pointer-events: none;
      user-select: none;
    }

    /* Pagination container */
    .uni-pagination {
      display: flex;
      justify-content: center;
      gap: 6px;
      margin-top: 12px;
      flex-wrap: wrap;
      user-select: none;
    }

    .uni-pagination button {
      background-color: #202225;
      border: none;
      border-radius: 3px;
      color: #b9bbbe;
      padding: 6px 12px;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.2s ease, color 0.2s ease;
      user-select: none;
      box-shadow: 0 0 5px transparent;
      flex-shrink: 0;
      min-width: 32px;
      font-weight: 600;
    }
    .uni-pagination button:hover:not(.active) {
      background-color: #36393f;
      color: #fff;
      box-shadow: 0 0 5px #7289da;
    }
    .uni-pagination button.active {
      background-color: #5865f2;
      color: white;
      cursor: default;
      box-shadow: 0 0 10px #5865f2;
    }

    /* Page jump container */
    #uni-page-jump-container {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 12px;
      user-select: none;
    }
    #uni-page-jump-container input[type="number"] {
      width: 64px;
      padding: 6px 8px;
      font-size: 15px;
      border: none;
      border-radius: 20px;
      background-color: #202225;
      color: #dcddde;
      box-shadow: inset 0 0 4px #000;
      text-align: center;
      user-select: text;
      -moz-appearance: textfield;
    }
    /* Remove spin buttons for number input */
    #uni-page-jump-container input[type=number]::-webkit-inner-spin-button,
    #uni-page-jump-container input[type=number]::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    #uni-page-jump-container button {
      background-color: #5865f2;
      border: none;
      border-radius: 5px;
      padding: 6px 14px;
      color: white;
      font-weight: 600;
      font-size: 15px;
      cursor: pointer;
      box-shadow: 0 0 8px #5865f2;
      transition: background-color 0.2s ease;
      user-select: none;
    }
    #uni-page-jump-container button:hover {
      background-color: #4752c4;
    }

    .testbtn1 {
    font-family: ubuntu;
    background-color: #2f3136;
    color: #fefefe;
    width: 60px;
    padding: 0 7px;
    border: none;
    border-radius: 5px;
    transition: background-color .1s ease-in-out,color .1s ease-in-out
    box-shadow: 0 0 8px #101010;
    margin: 0 10px 10px 10px
    }

    .testbtn1:hover {
    background-color: #404247;
    cursor: pointer;
    }

.srchxbtn .fa-solid.fa-magnifying-glass {
  position: relative;
  left: 375px;
  top: -40px;
  color: blue;
  font-size: 20px;
}

/* Search Bar Container */
.srchxbtn {
  display: flex;
}

/* Top Buttons */
.topsearchbarbuttons {
  display: flex;
  gap: 8px;
  margin: 8px 0 8px 8px;
}
.emojistab, .stickerstab {
  font-family: "gg sans", "Noto Sans", "Helvetica Neue", Arial, sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: #fff;
  background: none;
  border: none;
  border-radius: 8px;
  padding: 4px 12px;
  cursor: pointer;
  opacity: 0.8;
  transition: background 0.18s cubic-bezier(.4,0,.2,1),
              color 0.18s cubic-bezier(.4,0,.2,1),
              opacity 0.18s cubic-bezier(.4,0,.2,1);
}

.emojistab:hover, .stickerstab:hover {
  background-color: #46484c;
  color: #fff;
  opacity: 1;
}

.emojistab.active,
.stickerstab.active {
  background: #46484c;
  color: #fff;
  opacity: 1;
}

.emojistab.active:hover,
.stickerstab.active:hover {
  background: #404246;
  color: #fff;
}


.emojistab, .giftab {
  font-family: "gg sans", "Noto Sans", "Helvetica Neue", Arial, sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: #fff;
  background: none;
  border: none;
  border-radius: 8px;
  padding: 4px 12px;
  cursor: pointer;
  opacity: 0.8;
  transition: background 0.18s cubic-bezier(.4,0,.2,1),
              color 0.18s cubic-bezier(.4,0,.2,1),
              opacity 0.18s cubic-bezier(.4,0,.2,1);
}

.emojistab:hover, .giftab:hover {
  background-color: #46484c;
  color: #fff;
  opacity: 1;
}

.emojistab.active,
.giftab.active {
  background: #46484c;
  color: #fff;
  opacity: 1;
}

.emojistab.active:hover,
.giftab.active:hover {
  background: #404246;
  color: #fff;
}
`);

  // Insert base HTML with unique IDs and classes
    container.innerHTML = `
    <div class="topsearchbarbuttons">
      <div class="giftab">Gifs</div>
      <div class="stickerstab">Stickers</div>
      <div class="emojistab active">Emojis</div>
    </div>
    <div class="srchxbtn">
      <input type="text" id="uni-emoji-search" placeholder="Search emojis... (Right-click emoji to favorite)">
      <i class="fa-solid fa-magnifying-glass"></i>
    </div>
    <div class="uni-emoji-grid" id="uni-emoji-grid"></div>
    <div class="uni-pagination" id="uni-emoji-pagination"></div>
    <div id="uni-page-jump-container">
      <input type="number" id="uni-page-jump-input" min="1" placeholder="Page" />
      <button id="uni-page-jump-button">Go</button>
    </div>
    <div id="uni-sticker-comingsoon" style="display:none; text-align:center; color:#b5bac1; font-size:18px; margin: 30px;">
      <span style="font-size:22px; font-weight:600;">Coming soon!</span>
    </div>
        <div id="uni-gif-comingsoon" style="display:none; text-align:center; color:#b5bac1; font-size:18px; margin: 30px;">
      <span style="font-size:22px; font-weight:600;">Coming soon!</span>
    </div>
    `;
  const grid = document.getElementById('uni-emoji-grid');
  const pagination = document.getElementById('uni-emoji-pagination');
  const searchInput = document.getElementById('uni-emoji-search');
  const pageJumpInput = document.getElementById('uni-page-jump-input');
  const pageJumpButton = document.getElementById('uni-page-jump-button');

  // Fetch emojis JSON
  GM_xmlhttpRequest({
    method: "GET",
    url: JSON_URL,
    onload: function (res) {
      try {
        const raw = JSON.parse(res.responseText);
        allEmojis = Object.entries(raw).map(([key, value]) => ({
          name: key,
          url: value.url,
          tags: value.tags || [],
        }));
        filteredEmojis = allEmojis;
        applyFavoriteSort();
        showPage(1);
      } catch (err) {
        console.error("❌ JSON parsing error:", err);
            container.innerHTML = `<b style="text-align:center;"><i> ❌ Failed to load the script</i></b>`;
      }
    },
    onerror: function () {
      container.innerHTML = `<b style="text-align:center;"><i> ❌ Failed to load the script</i></b>`;
    }
  });

  // Save favorites to storage
  function saveFavorites() {
    GM_setValue('uni_favoriteEmojis', JSON.stringify([...favorites]));
  }

  // Sort filtered emojis so favorites come first
  function applyFavoriteSort() {
    // Pull favorites first
    const favs = [];
    const nonFavs = [];
    filteredEmojis.forEach(e => {
      if (favorites.has(e.name)) favs.push(e);
      else nonFavs.push(e);
    });
    filteredEmojis = [...favs, ...nonFavs];
  }

  // Show page of emojis
  function showPage(page) {
    const totalPages = Math.max(1, Math.ceil(filteredEmojis.length / EMOJIS_PER_PAGE));
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    currentPage = page;

    const start = (page - 1) * EMOJIS_PER_PAGE;
    const end = start + EMOJIS_PER_PAGE;
    const pageEmojis = filteredEmojis.slice(start, end);

    grid.innerHTML = '';
    pageEmojis.forEach(emoji => {
      const img = document.createElement('img');
      img.src = emoji.url;
      img.alt = emoji.name;
      img.title = emoji.name;

      // Add favorite star overlay if favorited
      if (favorites.has(emoji.name)) img.classList.add('uni-emoji-favorite');

img.addEventListener('click', () => {
  const bbcode = `[img=48]${emoji.url}[/img] `;


  const input = document.getElementById('chatbox__messages-create');
  if (input && input.tagName.toLowerCase() === 'textarea') {
    if (input.selectionStart !== undefined) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const current = input.value;
      input.value = current.slice(0, start) + bbcode + current.slice(end);
      input.selectionStart = input.selectionEnd = start + bbcode.length;
    } else {
      input.value += bbcode;
    }
    input.focus();
  }


  img.style.opacity = '0.5';
  setTimeout(() => (img.style.opacity = '1'), 300);
});


      img.addEventListener('contextmenu', e => {
        e.preventDefault();

        if (favorites.has(emoji.name)) favorites.delete(emoji.name);
        else favorites.add(emoji.name);
        saveFavorites();
        applyFavoriteSort();
        showPage(currentPage);
      });

      grid.appendChild(img);
    });

    renderPagination();
  }


  function renderPagination() {
    pagination.innerHTML = '';
    const totalPages = Math.max(1, Math.ceil(filteredEmojis.length / EMOJIS_PER_PAGE));


    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);


    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }


    if (currentPage > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i>`;
      prevBtn.title = 'Previous page';
      prevBtn.onclick = () => showPage(currentPage - 1);
      pagination.appendChild(prevBtn);
    }


    for (let i = startPage; i <= endPage; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === currentPage) btn.classList.add('active');
      btn.onclick = () => showPage(i);
      pagination.appendChild(btn);
    }


    if (currentPage < totalPages) {
      const nextBtn = document.createElement('button');
      nextBtn.innerHTML = `<i class="fa-solid fa-arrow-right"></i>`;
      nextBtn.title = 'Next page';
      nextBtn.onclick = () => showPage(currentPage + 1);
      pagination.appendChild(nextBtn);
    }
  }


  searchInput.addEventListener('input', () => {
    const term = searchInput.value.trim().toLowerCase();
    if (!term) {
      filteredEmojis = allEmojis;
    } else {
      filteredEmojis = allEmojis.filter(e =>
        e.name.toLowerCase().includes(term) ||
        e.tags.some(t => t.toLowerCase().includes(term))
      );
    }
    applyFavoriteSort();
    showPage(1);
  });

  pageJumpButton.addEventListener('click', () => {
    let val = parseInt(pageJumpInput.value);
    if (isNaN(val) || val < 1) val = 1;
    const totalPages = Math.max(1, Math.ceil(filteredEmojis.length / EMOJIS_PER_PAGE));
    if (val > totalPages) val = totalPages;
    showPage(val);
  });


pageJumpInput.addEventListener('input', function () {
  this.value = this.value.replace(/[^0-9]/g, '');
});


pageJumpInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    pageJumpButton.click();
  }
});



// ⌨️ Hotkey: Alt + E to toggle emoji menu
document.addEventListener('keydown', (e) => {
  if (e.altKey && e.ctrlKey && e.key.toLowerCase() === 'e') {
    const menu = document.getElementById('uni-emoji-menu');
    if (menu) {
      menu.style.display = (menu.style.display === 'none' ? 'flex' : 'none');
    }
  }
});


const emojiTab = container.querySelector('.emojistab');
const stickerTab = container.querySelector('.stickerstab');
const gifTab = container.querySelector('.giftab');
const emojiGrid = container.querySelector('.uni-emoji-grid');
const paginationDiv = container.querySelector('.uni-pagination');
const pageJumpDiv = container.querySelector('#uni-page-jump-container');
const searchBarDiv = container.querySelector('.srchxbtn');
const stickerComingSoon = container.querySelector('#uni-sticker-comingsoon');
const gifComingSoon = container.querySelector('#uni-gif-comingsoon');


emojiTab.addEventListener('click', () => {
  emojiTab.classList.add('active');
  stickerTab.classList.remove('active');
  gifTab.classList.remove('active');
  emojiGrid.style.display = '';
  paginationDiv.style.display = '';
  pageJumpDiv.style.display = '';
  searchBarDiv.style.display = '';
  stickerComingSoon.style.display = 'none';
  gifComingSoon.style.display = 'none';
  searchInput.placeholder = "Search emojis... (Right-click emoji to favorite)";
  showPage(currentPage);
});

stickerTab.addEventListener('click', () => {
  stickerTab.classList.add('active');
  emojiTab.classList.remove('active');
  gifTab.classList.remove('active');
  emojiGrid.style.display = 'none';
  paginationDiv.style.display = 'none';
  pageJumpDiv.style.display = 'none';
  searchBarDiv.style.display = '';
  stickerComingSoon.style.display = '';
  gifComingSoon.style.display = 'none';
  searchInput.placeholder = "Search stickers... (Coming soon!)";
});

gifTab.addEventListener('click', () => {
  gifTab.classList.add('active');
  emojiTab.classList.remove('active');
  stickerTab.classList.remove('active');
  emojiGrid.style.display = 'none';
  paginationDiv.style.display = 'none';
  pageJumpDiv.style.display = 'none';
  searchBarDiv.style.display = '';
  stickerComingSoon.style.display = 'none';
  gifComingSoon.style.display = '';
  searchInput.placeholder = "Search gifs... (Coming soon!)";
});

})();
