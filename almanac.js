let cachedPlants = null;
let bgConfig = [];
let currentTab = 'plants'; // Default awal
let cachedZombies = null;
let isZombieDataPrepared = false;

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

let isDataPrepared = false; // Flag agar tidak proses ulang

async function loadPlantsData() {
    if (isDataPrepared) return;
    
    const res = await fetch('data/plants.json');
    const data = await res.json();
    
    // PROSES SEKALIGUS (The Flash Way)
    // Kita siapkan semua data (harga & jalur gambar) di awal
    const preparedData = await Promise.all(data.plants.map(async (item) => {
        const costOnly = getOnlyCostNumber(item.cost);
        
        // Cek gambar cukup satu kali seumur hidup aplikasi berjalan
        const webpPath = `img/plants/${item.seedType}.webp`;
        const pngPath = `img/plants/${item.seedType}.png`;
        const imgPath = await checkImage(webpPath) ? webpPath : (await checkImage(pngPath) ? pngPath : null);

        return {
            ...item,
            processedCost: costOnly,
            processedImg: imgPath
        };
    }));

    cachedPlants = preparedData;
    isDataPrepared = true; 
    console.log("Data & Asset siap dikonsumsi!");
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

function getOnlyCostNumber(text) {
    if (!text || text.trim() === "") return null;

    // 1. Cek apakah ada kata "Gratis" (Case Insensitive)
    if (text.toLowerCase().includes("gratis")) {
        return "Gratis";
    }

    // 2. Gunakan Regex untuk mencari angka yang didahului oleh '>' (Logika: >Harga)
    // Atau angka di dalam tag color setelah kata Biaya
    const priceMatch = text.match(/>(\d+)</) || text.match(/color=[^>]+>(\d+)<\/color>/);
    
    if (priceMatch) {
        return priceMatch[1];
    }

    // 3. Fallback: Cari angka pertama yang BUKAN bagian dari "=14>"
    // Kita hapus dulu semua pola "=angka>" agar tidak mengganggu
    const cleanedText = text.replace(/=\d+>/g, ''); 
    const fallbackMatch = cleanedText.match(/\d+/);
    
    return fallbackMatch ? fallbackMatch[0] : null;
}

async function renderPlants() {
    const list = document.getElementById('item-list');
    list.innerHTML = "";
    
    // Pastikan data sudah siap sebelum render
    if (!cachedPlants) await loadPlantsData();

    for (const item of cachedPlants) {
        // Satpam tab
        if (currentTab !== 'plants') return;

        const card = document.createElement('div');
        card.className = 'seed-card';
        
        // --- DEFINISIKAN BGPATH DI SINI ---
        const bgPath = getBgBySeedType(item.seedType); 

        card.innerHTML = `
            <img src="${bgPath}">
            ${item.processedCost ? `<div class="card-cost-display">${item.processedCost}</div>` : ''}
            ${!item.processedImg ? '<div class="no-image-text">Gambar Tidak Ada</div>' : ''}
            <img src="${item.processedImg || ''}" style="${!item.processedImg ? 'display:none' : ''}">
        `;
        
        card.onclick = () => showDetail(item, item.processedImg);
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
        img.onerror = () => resolve(false);let cachedPlants = null;
        img.src = url;
    });
}
async function loadZombiesData() {
    if (isZombieDataPrepared) return;
    
    try {
        const res = await fetch('data/zombies.json');
        const data = await res.json();
        
        // Proses pengecekan gambar zombi (webp -> png)
        const preparedData = await Promise.all(data.zombies.map(async (item) => {
            const webpPath = `img/zombies/${item.theZombieType}.webp`;
            const pngPath = `img/zombies/${item.theZombieType}.png`;
            const imgPath = await checkImage(webpPath) ? webpPath : (await checkImage(pngPath) ? pngPath : null);

            return {
                ...item,
                processedImg: imgPath
            };
        }));

        cachedZombies = preparedData;
        isZombieDataPrepared = true;
    } catch (err) {
        console.error("Gagal memuat data zombi:", err);
    }
}
async function renderZombies() {
    const list = document.getElementById('item-list');
    list.innerHTML = "";
    
    if (!cachedZombies) await loadZombiesData();

    for (const item of cachedZombies) {
        // Satpam Race Condition
        if (currentTab !== 'zombies') return;

        const card = document.createElement('div');
        card.className = 'zombie-card'; // Pakai class khusus zombi
        
        const windowUI = "img/ui/zombie_windowUI.png";

        // LAYER: Belakang (windowUI), Depan (Foto Zombi)
        card.innerHTML = `
            <img src="${windowUI}" class="zombie-bg">
            ${!item.processedImg ? '<div class="no-image-text">Gambar Tidak Ada</div>' : ''}
            <img src="${item.processedImg || ''}" class="zombie-pic" style="${!item.processedImg ? 'display:none' : ''}">
        `;
        
        card.onclick = () => showZombieDetail(item);
        list.appendChild(card);
    }
}

function showZombieDetail(item) {
    const scrollArea = document.querySelector('.info-scroll-area');
    if (scrollArea) scrollArea.scrollTop = 0;

    document.getElementById('detail-name').innerText = item.name;
    document.getElementById('detail-intro').innerHTML = parseFusionText(item.introduce || "");
    document.getElementById('detail-info').innerHTML = parseFusionText(item.info || "");
    document.getElementById('detail-cost').innerHTML = ""; // Zombi gratisan (ga punya harga)

    const viewer = document.getElementById('detail-image-container');
    const imgPath = item.processedImg;

    // CUKUP 1 LAYER: Foto Zombi saja
    viewer.innerHTML = `
        ${!imgPath ? '<div class="no-image-text" style="font-size:12px">Gambar Tidak Ada</div>' : ''}
        <img src="${imgPath || ''}" style="${!imgPath ? 'display:none' : 'object-fit: contain; width: 100%; height: 100%;'}">
    `;
}

function switchTab(type) {
    currentTab = type;
    const list = document.getElementById('item-list');
    const detail = document.getElementById('detail-view');
    const container = document.querySelector('.almanac-container');
    
    document.getElementById('btn-plants').className = (type === 'plants' ? 'active' : '');
    document.getElementById('btn-zombies').className = (type === 'zombies' ? 'active' : '');

    if (type === 'zombies') {
        container.style.backgroundImage = "url('img/ui/zombie.png')";
        detail.style.backgroundImage = "url('img/ui/zombie_infoUI.png')";
        
        // Tambahkan class zombie dan hapus class plant
        detail.classList.add('zombie-mode');
        detail.classList.remove('plant-mode');
        document.getElementById('detail-name').style.color = "#11ff00"
        
        renderZombies();
    } else {
        container.style.backgroundImage = "url('img/ui/plant.png')";
        detail.style.backgroundImage = "url('img/ui/plant_infoUI.png')";
        
        // Tambahkan class plant dan hapus class zombie
        detail.classList.add('plant-mode');
        detail.classList.remove('zombie-mode');
        
        renderPlants();
    }
}

window.switchTab = switchTab;
init();