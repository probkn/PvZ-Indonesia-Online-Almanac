let cachedPlants = null;
let bgConfig = [];

async function init() {
    try {
        const resData = await fetch('data/data.json');
        const configJson = await resData.json();
        bgConfig = configJson.bg_mapping;
        
        await loadPlantsData();
        renderPlants();
    } catch (err) {
        console.error("Inisialisasi gagal:", err);
    }
}

async function loadPlantsData() {
    if (cachedPlants) return;
    const res = await fetch('data/plants.json');
    const data = await res.json();
    cachedPlants = data.plants;
    console.log("Data tanaman dimuat 1x.");
}

function getBgBySeedType(id) {
    if (!bgConfig) return "img/card/seedp.png";
    const config = bgConfig.find(c => id >= c.start && id <= c.end);
    return config ? `img/card/${config.bg}.png` : `img/card/seedp.png`;
}

// Fungsi cek gambar: Mencoba WebP dulu, lalu PNG
async function checkImageFormat(seedType) {
    const formats = ['.webp', '.png'];
    for (const ext of formats) {
        const path = `img/plants/${seedType}${ext}`;
        const exists = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = path;
        });
        if (exists) return path;
    }
    return null; // Tidak ditemukan keduanya
}
function parseFusionText(text) {
    if (!text) return "";
    return text
        .replace(/<color=(#[a-fA-F0-9]+|black|red|blue|white|yellow)>/g, '<span style="color: $1">')
        .replace(/<\/color>/g, '</span>')
        .replace(/<size=\d+>/g, '')
        .replace(/<\/size>/g, '')
        .replace(/\n/g, '<br>');
}

// 1. Fungsi ambil harga (Tetap amankan angka size=14)
function getOnlyCostNumber(text) {
    if (!text || text.trim() === "") return null;
    const colorMatch = text.match(/<color=[^>]+>(\d+)<\/color>/);
    if (colorMatch) return colorMatch[1];
    const allNumbers = text.match(/\d+/g);
    if (allNumbers) {
        const cost = allNumbers.find(num => num !== "14");
        return cost || allNumbers[0];
    }
    return null;
}

// 2. Fungsi Render - Logic diperbaiki agar tidak "False NULL"
async function renderPlants() {
    const list = document.getElementById('item-list');
    list.innerHTML = "";
    if (!cachedPlants) await loadPlantsData();

    // Render satu-satu dengan urutan yang benar
    for (const item of cachedPlants) {
        const card = document.createElement('div');
        card.className = 'seed-card';
        
        const bgPath = getBgBySeedType(item.seedType);
        const costOnly = getOnlyCostNumber(item.cost);
        
        // Cek gambar (WebP dulu baru PNG)
        const webpPath = `img/plants/${item.seedType}.webp`;
        const pngPath = `img/plants/${item.seedType}.png`;
        
        const imgPath = await checkImage(webpPath) ? webpPath : (await checkImage(pngPath) ? pngPath : null);

        // URUTAN: BG -> COST -> TEXT (IF NULL) -> PLANT IMAGE
        card.innerHTML = `
            <img src="${bgPath}">
            ${costOnly !== null ? `<div class="card-cost-display">${costOnly}</div>` : ''}
            ${!imgPath ? '<div class="no-image-text">Gambar Tidak Ada</div>' : ''}
            <img src="${imgPath || ''}" style="${!imgPath ? 'display:none' : ''}">
        `;
        
        card.onclick = () => showDetail(item, imgPath);
        list.appendChild(card);
    }
}

// 3. Fungsi Detail - Teks diganti jadi "Gambar Tidak Ada"
function showDetail(item, imgPath) {
    const scrollArea = document.querySelector('.info-scroll-area');
    if (scrollArea) scrollArea.scrollTop = 0;

    document.getElementById('detail-name').innerText = item.name + " (" + item.seedType + ")";
    document.getElementById('detail-intro').innerHTML = parseFusionText(item.introduce);
    document.getElementById('detail-info').innerHTML = parseFusionText(item.info);
    document.getElementById('detail-cost').innerHTML = parseFusionText(item.cost);

    const viewer = document.getElementById('detail-image-container');
    const bgPath = getBgBySeedType(item.seedType);
    const costOnly = getOnlyCostNumber(item.cost);

    viewer.innerHTML = `
        <img src="${bgPath}">
        ${costOnly !== null ? `<div class="card-cost-display" style="font-size: 1.2rem; bottom: 5px;">${costOnly}</div>` : ''}
        ${!imgPath ? '<div class="no-image-text" style="font-size:12px">Gambar Tidak Ada</div>' : ''}
        <img src="${imgPath || ''}" style="${!imgPath ? 'display:none' : 'object-fit: contain;'}">
    `;
}

// 4. Fungsi bantu cek gambar yang lebih stabil
function checkImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

function switchTab(type) {
    const list = document.getElementById('item-list');
    const detail = document.getElementById('detail-view');
    document.getElementById('btn-plants').className = (type === 'plants' ? 'active' : '');
    document.getElementById('btn-zombies').className = (type === 'zombies' ? 'active' : '');

    if (type === 'zombies') {
        list.innerHTML = "<h2 style='padding:20px; color:#aaa;'>Coming Soon...</h2>";
        detail.style.visibility = "hidden";
    } else {
        renderPlants();
        detail.style.visibility = "visible";
    }
}

window.switchTab = switchTab;
init();