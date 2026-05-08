let tournaments = JSON.parse(localStorage.getItem('poker_tournaments')) || [];
let bankrollChart = null;
let editingId = null;
let currentImageBase64 = null;

// DOM Elements
const tournamentForm = document.getElementById('tournament-form');
const tournamentList = document.getElementById('tournament-list');
const modalOverlay = document.getElementById('modal-overlay');
const addBtn = document.getElementById('add-tournament-btn');
const closeBtn = document.querySelector('.close-modal');
const formatFilter = document.getElementById('format-filter');
const toggleSessionBtn = document.getElementById('toggle-session-mode');

// Event Listeners for new filters
const categoryFilter = document.getElementById('category-filter');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    const initBank = localStorage.getItem('initial_bankroll') || 0;
    if (document.getElementById('initial-bankroll')) {
        document.getElementById('initial-bankroll').value = initBank;
    }
    initChart();
    updateUI();
    
    // Set default date to today
    document.getElementById('t-date').valueAsDate = new Date();
});

// Event Listeners
const speedFilter = document.getElementById('speed-filter');
if (formatFilter) formatFilter.addEventListener('change', updateUI);
if (speedFilter) speedFilter.addEventListener('change', updateUI);
if (categoryFilter) categoryFilter.addEventListener('change', updateUI);

if (toggleSessionBtn) {
    toggleSessionBtn.addEventListener('click', () => {
        if (toggleSessionBtn.textContent.includes('Torneos')) {
            toggleSessionBtn.textContent = 'Vista: Sesiones';
        } else {
            toggleSessionBtn.textContent = 'Vista: Torneos';
        }
        updateUI();
    });
}

const saveBankrollBtn = document.getElementById('save-bankroll-btn');
if (saveBankrollBtn) {
    saveBankrollBtn.addEventListener('click', () => {
        const input = document.getElementById('initial-bankroll');
        if(input) localStorage.setItem('initial_bankroll', input.value);
        updateChart(getFilteredTournaments());
        
        // Feedback visual
        saveBankrollBtn.textContent = '✅';
        setTimeout(() => {
            saveBankrollBtn.textContent = '💾';
        }, 1500);
    });
}

addBtn.addEventListener('click', () => {
    resetForm();
    modalOverlay.classList.remove('hidden');
});
closeBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
    resetForm();
});

const exportBackupBtn = document.getElementById('export-backup-btn');
const importBackupBtn = document.getElementById('import-backup-btn');
const importFileInput = document.getElementById('import-file-input');

if (exportBackupBtn) {
    exportBackupBtn.addEventListener('click', () => {
        const backupData = {
            tournaments: tournaments,
            initial_bankroll: localStorage.getItem('initial_bankroll') || 0
        };
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        
        const date = new Date().toISOString().split('T')[0];
        downloadAnchorNode.setAttribute("download", `GGTracker_Backup_${date}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });
}

if (importBackupBtn) {
    importBackupBtn.addEventListener('click', () => {
        if(importFileInput) importFileInput.click();
    });
}

if (importFileInput) {
    importFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const contents = e.target.result;
            const backupData = JSON.parse(contents);
            
            if (backupData.tournaments && Array.isArray(backupData.tournaments)) {
                tournaments = backupData.tournaments;
                localStorage.setItem('poker_tournaments', JSON.stringify(tournaments));
                
                if (backupData.initial_bankroll !== undefined) {
                    localStorage.setItem('initial_bankroll', backupData.initial_bankroll);
                    const initInput = document.getElementById('initial-bankroll');
                    if (initInput) initInput.value = backupData.initial_bankroll;
                }
                
                updateUI();
                alert('Backup restaurado con éxito!');
            } else {
                alert('El archivo no tiene el formato correcto.');
            }
        } catch (error) {
            alert('Error al leer el archivo de backup.');
            console.error(error);
        }
        importFileInput.value = ''; // Reset
    };
    reader.readAsText(file);
});
}

document.getElementById('upload-txt-btn').addEventListener('click', () => {
    document.getElementById('file-upload').click();
});

document.getElementById('file-upload').addEventListener('change', async (event) => {
    const files = event.target.files;
    if (files.length === 0) return;

    let addedCount = 0;
    let duplicateCount = 0;

    for (const file of files) {
        if (file.name.toLowerCase().endsWith('.zip')) {
            try {
                const zip = await JSZip.loadAsync(file);
                for (const filename of Object.keys(zip.files)) {
                    if (filename.toLowerCase().endsWith('.txt')) {
                        const text = await zip.files[filename].async("string");
                        const parsed = parseGGText(text);
                        if (parsed) {
                            if (parsed.tourneyId && tournaments.some(t => t.tourneyId === parsed.tourneyId)) {
                                duplicateCount++;
                                continue;
                            }
                            tournaments.push({ id: Date.now() + Math.random(), ...parsed });
                            addedCount++;
                        }
                    }
                }
            } catch (e) {
                console.error('Error procesando ZIP:', file.name, e);
                alert(`Hubo un error al descomprimir el archivo ${file.name}. Asegúrate de que sea un archivo ZIP válido.`);
            }
        } else if (file.name.toLowerCase().endsWith('.txt')) {
            try {
                const text = await file.text();
                const parsed = parseGGText(text);
                if (parsed) {
                    if (parsed.tourneyId && tournaments.some(t => t.tourneyId === parsed.tourneyId)) {
                        duplicateCount++;
                        continue;
                    }
                    tournaments.push({ id: Date.now() + Math.random(), ...parsed });
                    addedCount++;
                }
            } catch (e) {
                console.error('Error parsing file:', file.name, e);
            }
        }
    }

    if (addedCount > 0 || duplicateCount > 0) {
        saveData();
        updateUI();
        updateChart();
        let msg = `Se cargaron ${addedCount} torneos exitosamente.`;
        if (duplicateCount > 0) msg += `\nSe omitieron ${duplicateCount} torneos porque ya estaban registrados.`;
        alert(msg);
    } else {
        alert('No se encontraron torneos válidos nuevos en los archivos seleccionados.');
    }
    
    event.target.value = '';
});

function parseGGText(text) {
    if (!text.trim()) return null;
    
    let tourneyId = '';
    let name = '';
    let buyin = 0;
    let reentries = 0;
    let cash = 0;
    let pos = '';
    let totalPlayers = '';
    let date = '';

    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    let isTournament = false;
    
    lines.forEach(line => {
        if (line.startsWith('Tournament #')) {
            isTournament = true;
            const matchId = line.match(/Tournament #(\d+)/);
            if (matchId) tourneyId = matchId[1];
            const parts = line.split(',');
            if (parts.length >= 2) {
                name = parts.slice(1, -1).join(',').trim();
                if (!name) name = parts[1].trim();
            }
        } else if (line.startsWith('Buy-in:')) {
            const parts = line.replace('Buy-in:', '').split('+');
            buyin = parts.reduce((sum, p) => sum + parseFloat(p.replace('$', '') || 0), 0);
        } else if (line.endsWith('Players')) {
            const match = line.match(/^(\d+)\s+Players/);
            if (match) totalPlayers = match[1];
        } else if (line.startsWith('Tournament started')) {
            const match = line.match(/\d{4}\/\d{2}\/\d{2}/);
            if (match) date = match[0].replace(/\//g, '-');
        } else if (line.includes('finished the tournament in')) {
            const match = line.match(/in (\d+)(st|nd|rd|th)/);
            if (match) pos = match[1];
        } else if (line.includes('received a total of')) {
            const cashMatch = line.match(/total of \$([0-9,]+(\.\d+)?)/);
            if (cashMatch) {
                cash = parseFloat(cashMatch[1].replace(',', ''));
            }
        } else if (line.includes(': Hero, $') && cash === 0) {
            const match = line.match(/\$([\d,\.]+)/);
            if (match) cash = parseFloat(match[1].replace(/,/g, ''));
        }
        
        // Match re-entries if present
        if (line.includes('made') && (line.includes('re-entries') || line.includes('re-entry'))) {
            const reMatch = line.match(/made (\d+) re-entr/);
            if (reMatch) {
                reentries = parseInt(reMatch[1]);
            }
        }
    });

    if (!isTournament) return null;

    return {
        tourneyId,
        name,
        buyin,
        reentries,
        cash,
        pos: pos || '-',
        totalPlayers: totalPlayers || '-',
        date: date || new Date().toISOString().split('T')[0],
        image: null
    };
}

window.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.classList.add('hidden');
        resetForm();
    }
    const imageViewerOverlay = document.getElementById('image-viewer-overlay');
    if (e.target === imageViewerOverlay) {
        imageViewerOverlay.classList.add('hidden');
    }
});

document.querySelector('.close-image-viewer').addEventListener('click', () => {
    document.getElementById('image-viewer-overlay').classList.add('hidden');
});

document.getElementById('t-image').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) {
        currentImageBase64 = null;
        return;
    }
    const reader = new FileReader();
    reader.onload = function(evt) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            currentImageBase64 = canvas.toDataURL('image/jpeg', 0.7);
            updateImagePreview();
        };
        img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
});

function updateImagePreview() {
    const preview = document.getElementById('t-image-preview');
    if (currentImageBase64) {
        preview.src = currentImageBase64;
        preview.style.display = 'block';
    } else {
        preview.src = '';
        preview.style.display = 'none';
    }
}

function resetForm() {
    tournamentForm.reset();
    document.getElementById('t-date').valueAsDate = new Date();
    editingId = null;
    currentImageBase64 = null;
    updateImagePreview();
    document.querySelector('.modal-header h2').textContent = 'Registrar Torneo';
}

tournamentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const tournamentData = {
        name: document.getElementById('t-name').value,
        buyin: parseFloat(document.getElementById('t-buyin').value),
        reentries: parseInt(document.getElementById('t-reentries').value) || 0,
        cash: parseFloat(document.getElementById('t-cash').value) || 0,
        pos: document.getElementById('t-pos').value || '-',
        totalPlayers: document.getElementById('t-total-players').value || '-',
        date: document.getElementById('t-date').value,
        image: currentImageBase64
    };

    if (editingId) {
        const index = tournaments.findIndex(t => t.id === editingId);
        if (index !== -1) tournaments[index] = { ...tournaments[index], ...tournamentData };
    } else {
        tournaments.push({ id: Date.now(), ...tournamentData });
    }

    saveData();
    updateUI();
    
    modalOverlay.classList.add('hidden');
    resetForm();
});

// Logic Functions
function saveData() {
    localStorage.setItem('poker_tournaments', JSON.stringify(tournaments));
}

window.toggleCustomDate = function() {
    const filter = document.getElementById('date-filter');
    const container = document.getElementById('custom-date-container');
    if (filter && container) {
        if (filter.value === 'CUSTOM') {
            container.style.display = 'flex';
        } else {
            container.style.display = 'none';
        }
    }
};

window.checkAllFilters = function() {
    const checkboxes = document.querySelectorAll('.toggle-label input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
    
    const dateFilter = document.getElementById('date-filter');
    if (dateFilter) {
        dateFilter.value = 'ALL';
        window.toggleCustomDate();
    }
    
    updateUI();
};

window.uncheckAllFilters = function() {
    const checkboxes = document.querySelectorAll('.toggle-label input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    updateUI();
};

let currentSortColumn = 'date';
let currentSortDirection = 'desc'; // 'asc' or 'desc'

window.sortTable = function(column) {
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        if (['date', 'profit', 'cash', 'buyin', 'reentries'].includes(column)) {
            currentSortDirection = 'desc';
        } else {
            currentSortDirection = 'asc';
        }
    }
    
    // Update Icons
    document.querySelectorAll('.sortable .sort-icon').forEach(icon => icon.textContent = '');
    const activeHeader = document.querySelector(`th[data-sort="${column}"] .sort-icon`);
    if (activeHeader) {
        activeHeader.textContent = currentSortDirection === 'asc' ? '▲' : '▼';
    }
    
    updateUI();
};

window.deleteAllTournaments = function() {
    if (confirm("🚨 ¿Estás seguro de que quieres eliminar TODOS los torneos? Esta acción borrará la base de datos entera y no se puede deshacer.")) {
        tournaments = [];
        localStorage.removeItem('poker_tournaments');
        updateUI();
        alert("Base de datos vaciada correctamente.");
    }
};

function getFilteredTournaments() {
    const tglRegular = document.getElementById('tgl-regular') ? document.getElementById('tgl-regular').checked : true;
    const tglBounty = document.getElementById('tgl-bounty') ? document.getElementById('tgl-bounty').checked : true;
    const tglTurbo = document.getElementById('tgl-turbo') ? document.getElementById('tgl-turbo').checked : true;
    const tglHyper = document.getElementById('tgl-hyper') ? document.getElementById('tgl-hyper').checked : true;
    const tglGGSeries = document.getElementById('tgl-ggseries') ? document.getElementById('tgl-ggseries').checked : true;
    const tglWSOP = document.getElementById('tgl-wsop') ? document.getElementById('tgl-wsop').checked : true;
    const tglFlipout = document.getElementById('tgl-flipout') ? document.getElementById('tgl-flipout').checked : true;
    const tglSat = document.getElementById('tgl-sat') ? document.getElementById('tgl-sat').checked : true;
    const tglTBuilder = document.getElementById('tgl-tbuilder') ? document.getElementById('tgl-tbuilder').checked : true;
    const tglFT = document.getElementById('tgl-ft') ? document.getElementById('tgl-ft').checked : true;

    const dateFilter = document.getElementById('date-filter') ? document.getElementById('date-filter').value : 'ALL';
    const dateFrom = document.getElementById('date-from') ? document.getElementById('date-from').value : '';
    const dateTo = document.getElementById('date-to') ? document.getElementById('date-to').value : '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tournaments.filter(t => {
        const nameUpper = t.name.toUpperCase();
        
        // Excluir automáticamente "Step X to Step Y" que son gratuitos
        if (nameUpper.match(/STEP \d+ TO STEP/)) return false;
        
        const totalPlayersInt = parseInt(t.totalPlayers);
        
        // Omitir Spin & Gold de 3 y 6 participantes
        if ((nameUpper.includes('SPIN & GOLD') || nameUpper.includes('SPIN&GOLD') || nameUpper.includes('SPIN AND GOLD')) && (totalPlayersInt === 3 || totalPlayersInt === 6)) {
            return false;
        }
        
        // 1. Detección de Flags
        const isHyper = nameUpper.includes('HYPER');
        const isTurbo = !isHyper && nameUpper.includes('TURBO');
        const isBounty = nameUpper.includes('BOUNTY') || nameUpper.includes('PKO');
        
        const isSat = nameUpper.includes('STEP') || nameUpper.includes('SATELLITE') || nameUpper.includes('QUALIFIER') || nameUpper.includes('SAT ');
        const isThanksGG = nameUpper.includes('THANKSGG') || nameUpper.includes('DAILY $100,000') || nameUpper.includes('FLIPOUT') || nameUpper.includes('FREEROLL') || nameUpper.includes('FREE');
        const isWSOP = nameUpper.includes('WSOP');
        const isGGSeries = nameUpper.includes('GG MASTERS') || nameUpper.includes('GGMASTERS') || nameUpper.includes('GG SERIES') || nameUpper.match(/\bGG\b/) || nameUpper.match(/(?:^|\s|#|-)\d+\s*-\s*[LMH]\b/);
        const isTBuilder = nameUpper.startsWith('T$') || nameUpper.includes('T$ BUILDER') || nameUpper.includes('T$BUILDER');
        
        const posInt = parseInt(t.pos);
        const isFT = (!isNaN(posInt) && posInt > 0 && posInt <= 9 && !isNaN(totalPlayersInt) && totalPlayersInt >= 18);
        
        // "Regular" significa que NO es ninguno de los formatos o categorías especiales
        const isRegular = !isBounty && !isTurbo && !isHyper && !isThanksGG && !isSat && !isWSOP && !isGGSeries && !isTBuilder;

        // 2. Filtro de Categorías por Checkboxes
        // Las categorías especiales (marcas) tienen prioridad y no se ven afectadas por los interruptores de Turbo o Bounty.
        // Es decir, si seleccionas "GG Series", verás todos los GG Series sin importar si desmarcaste "Turbo" o "Bounty".
        if (isThanksGG) {
            if (!tglFlipout) return false;
        } else if (isSat) {
            if (!tglSat) return false;
        } else if (isTBuilder) {
            if (!tglTBuilder) return false;
        } else if (isWSOP) {
            if (!tglWSOP) return false;
        } else if (isGGSeries) {
            if (!tglGGSeries) return false;
        } else {
            // Torneos normales que no pertenecen a ninguna serie o marca especial
            if (isBounty && !tglBounty) return false;
            if (isTurbo && !tglTurbo) return false;
            if (isHyper && !tglHyper) return false;
            if (isRegular && !tglRegular) return false;
        }
        
        // El filtro de Final Tables (Top 9) es transversal, aplica a todos si se desmarca
        if (isFT && !tglFT) return false;

        // 5. Filtro de Fechas
        if (dateFilter !== 'ALL') {
            if (!t.date) return false;
            
            const parts = t.date.split('-');
            if (parts.length === 3) {
                const tDate = new Date(parts[0], parts[1] - 1, parts[2]);
                tDate.setHours(0, 0, 0, 0);

                if (dateFilter === 'TODAY') {
                    if (tDate.getTime() !== today.getTime()) return false;
                } else if (dateFilter === 'YESTERDAY') {
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    if (tDate.getTime() < yesterday.getTime()) return false;
                } else if (dateFilter === '3_DAYS') {
                    const threeDaysAgo = new Date(today);
                    threeDaysAgo.setDate(threeDaysAgo.getDate() - 2);
                    if (tDate.getTime() < threeDaysAgo.getTime()) return false;
                } else if (dateFilter === '7_DAYS') {
                    const sevenDaysAgo = new Date(today);
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
                    if (tDate.getTime() < sevenDaysAgo.getTime()) return false;
                } else if (dateFilter === 'THIS_MONTH') {
                    if (tDate.getMonth() !== today.getMonth() || tDate.getFullYear() !== today.getFullYear()) return false;
                } else if (dateFilter === 'CUSTOM') {
                    if (dateFrom) {
                        const fromParts = dateFrom.split('-');
                        const fDate = new Date(fromParts[0], fromParts[1] - 1, fromParts[2]);
                        fDate.setHours(0, 0, 0, 0);
                        if (tDate.getTime() < fDate.getTime()) return false;
                    }
                    if (dateTo) {
                        const toParts = dateTo.split('-');
                        const tDateTo = new Date(toParts[0], toParts[1] - 1, toParts[2]);
                        tDateTo.setHours(0, 0, 0, 0);
                        if (tDate.getTime() > tDateTo.getTime()) return false;
                    }
                }
            }
        }

        return true;
    }).sort((a, b) => {
        let valA, valB;
        if (currentSortColumn === 'date') {
            valA = new Date(a.date).getTime();
            valB = new Date(b.date).getTime();
        } else if (currentSortColumn === 'name') {
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
        } else if (currentSortColumn === 'buyin') {
            valA = parseFloat(a.buyin) || 0;
            valB = parseFloat(b.buyin) || 0;
        } else if (currentSortColumn === 'reentries') {
            valA = parseInt(a.reentries) || 0;
            valB = parseInt(b.reentries) || 0;
        } else if (currentSortColumn === 'cash') {
            valA = parseFloat(a.cash) || 0;
            valB = parseFloat(b.cash) || 0;
        } else if (currentSortColumn === 'profit') {
            const costA = parseFloat(a.buyin) * (1 + parseInt(a.reentries || 0));
            valA = (parseFloat(a.cash) || 0) - costA;
            
            const costB = parseFloat(b.buyin) * (1 + parseInt(b.reentries || 0));
            valB = (parseFloat(b.cash) || 0) - costB;
        } else if (currentSortColumn === 'pos') {
            valA = parseInt(a.pos) || 999999;
            valB = parseInt(b.pos) || 999999;
        }

        if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
        return 0;
    });
}

function updateUI() {
    const filtered = getFilteredTournaments();
    renderTournaments(filtered);
    calculateStats(filtered);
    updateChart(filtered);
}

function calculateStats(data) {
    if (!data || data.length === 0) {
        document.querySelector('#stat-profit .value').textContent = '$0.00';
        document.querySelector('#stat-profit .value').className = 'value';
        document.querySelector('#stat-roi .value').textContent = '0.0%';
        document.querySelector('#stat-itm .value').textContent = '0.0%';
        document.querySelector('#stat-avg-buyin .value').textContent = '$0.00';
        document.querySelector('#stat-max-win .value').textContent = '$0.00';
        document.querySelector('#stat-itm-count .value').textContent = '0';
        document.querySelector('#stat-max-buyin .value').textContent = '$0.00';
        document.querySelector('#stat-total-buyin .value').textContent = '$0.00';
        document.querySelector('#stat-ft-count .value').textContent = '0';
        return;
    }

    let totalInvested = 0;
    let totalCashed = 0;
    let itmCount = 0;
    let maxWin = 0;
    let maxBuyin = 0;
    let ftCount = 0;

    data.forEach(t => {
        const totalBuyin = t.buyin * (1 + t.reentries);
        totalInvested += totalBuyin;
        totalCashed += t.cash;
        if (t.cash >= totalBuyin && totalBuyin > 0) itmCount++;
        
        const netProfit = t.cash - totalBuyin;
        if (netProfit > maxWin) maxWin = netProfit;
        if (totalBuyin > maxBuyin) maxBuyin = totalBuyin;
        
        const posInt = parseInt(t.pos);
        if (!isNaN(posInt) && posInt > 0 && posInt <= 9) ftCount++;
    });

    const netProfit = totalCashed - totalInvested;
    const roi = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;
    const itm = (itmCount / data.length) * 100;
    const avgBuyin = totalInvested / data.length;

    // Update Cards
    const profitEl = document.querySelector('#stat-profit .value');
    profitEl.textContent = `$${netProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    profitEl.className = `value ${netProfit >= 0 ? 'positive' : 'negative'}`;

    document.querySelector('#stat-roi .value').textContent = `${roi.toFixed(1)}%`;
    document.querySelector('#stat-roi .value').className = `value ${roi >= 0 ? 'positive' : 'negative'}`;
    document.querySelector('#stat-itm .value').textContent = `${itm.toFixed(1)}%`;
    document.querySelector('#stat-avg-buyin .value').textContent = `$${avgBuyin.toFixed(2)}`;
    
    document.querySelector('#stat-max-win .value').textContent = `$${maxWin.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    document.querySelector('#stat-max-win .value').className = `value ${maxWin > 0 ? 'positive' : ''}`;
    document.querySelector('#stat-itm-count .value').textContent = itmCount;
    document.querySelector('#stat-max-buyin .value').textContent = `$${maxBuyin.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    document.querySelector('#stat-total-buyin .value').textContent = `$${totalInvested.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    document.querySelector('#stat-ft-count .value').textContent = ftCount;
}

function getTags(name) {
    let tags = '';
    const upperName = name.toUpperCase();
    if (upperName.includes('BOUNTY') || upperName.includes('PKO')) {
        tags += `<span class="badge badge-bounty">🎯 PKO</span>`;
    }
    if (upperName.includes('TURBO') || upperName.includes('HYPER')) {
        tags += `<span class="badge badge-turbo">⚡ Turbo</span>`;
    }
    if (upperName.includes('DEEP') || upperName.includes('MONSTER')) {
        tags += `<span class="badge badge-deep">🌊 Deep</span>`;
    }
    if (upperName.includes('HIGH ROLLER') || upperName.includes('HR')) {
        tags += `<span class="badge badge-hr">💎 HR</span>`;
    }
    return tags;
}

function renderTournaments(data) {
    tournamentList.innerHTML = '';
    
    if (!data || data.length === 0) return;

    // Sort by date descending
    const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
    const sessionMode = toggleSessionBtn && toggleSessionBtn.textContent.includes('Sesiones');

    if (sessionMode) {
        const sessions = {};
        sorted.forEach(t => {
            if (!sessions[t.date]) sessions[t.date] = [];
            sessions[t.date].push(t);
        });

        for (const [date, tourneys] of Object.entries(sessions)) {
            let totalBuyin = 0;
            let totalCash = 0;
            let totalReentries = 0;
            tourneys.forEach(t => {
                totalBuyin += t.buyin * (1 + t.reentries);
                totalCash += t.cash;
                totalReentries += t.reentries;
            });
            const profit = totalCash - totalBuyin;
            
            let sessionCashColor = '#ffd700'; // Yellow
            if (totalCash === 0) {
                sessionCashColor = '#888888'; // Gray
            } else if (totalCash < totalBuyin) {
                sessionCashColor = '#ff5252'; // Red
            }

            const row = document.createElement('tr');
            row.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            row.style.borderTop = '2px solid rgba(255,255,255,0.1)';
            row.innerHTML = `
                <td style="text-align: center;">
                    <input type="checkbox" class="session-checkbox" data-date="${date}" onchange="onSessionCheckboxChange(this)" style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary-color);">
                </td>
                <td><strong>📅 ${date}</strong></td>
                <td><strong>${tourneys.length} Torneos</strong></td>
                <td><strong>$${totalBuyin.toFixed(2)}</strong></td>
                <td><strong>${totalReentries}</strong></td>
                <td style="color: ${sessionCashColor};"><strong>$${totalCash.toFixed(2)}</strong></td>
                <td class="${profit >= 0 ? 'profit-plus' : 'profit-minus'}">
                    <strong>${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}</strong>
                </td>
                <td colspan="3" style="text-align: right;">
                    <button class="btn-secondary" onclick="toggleSessionDetails('${date}')" style="padding: 2px 8px; font-size: 0.8rem; cursor: pointer;">Detalle 🔽</button>
                </td>
            `;
            tournamentList.appendChild(row);
            
            tourneys.forEach(t => {
                const tr = createTournamentRow(t);
                tr.classList.add(`session-detail-${date}`);
                tr.style.display = 'none';
                tr.style.opacity = '0.7';
                tournamentList.appendChild(tr);
            });
        }
    } else {
        sorted.forEach(t => {
            tournamentList.appendChild(createTournamentRow(t));
        });
    }
}

function createTournamentRow(t) {
    const totalBuyin = t.buyin * (1 + t.reentries);
    const profit = t.cash - totalBuyin;
    
    let posHtml = t.pos;
    const posInt = parseInt(t.pos);
    const isFT = !isNaN(posInt) && posInt > 0 && posInt <= 9;
    
    if (isFT) {
        posHtml = `<span style="color: #ffd700; text-shadow: 0 0 8px rgba(255, 215, 0, 0.6); font-weight: bold;">⭐ ${t.pos}º</span>`;
    } else {
        posHtml = `${t.pos}º`;
    }
    
    const row = document.createElement('tr');
    if (isFT) {
        row.style.backgroundColor = 'rgba(212, 175, 55, 0.08)';
    }
    
    let cashColor = '#ffd700'; // Yellow
    if (t.cash === 0) {
        cashColor = '#888888'; // Gray
    } else if (t.cash < totalBuyin) {
        cashColor = '#ff5252'; // Red
    }
    
    row.innerHTML = `
        <td style="text-align: center;">
            <input type="checkbox" class="row-checkbox" value="${t.id}" onchange="onRowCheckboxChange()" style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary-color);">
        </td>
        <td>${t.date}</td>
        <td><strong>${t.name}</strong> ${getTags(t.name)}</td>
        <td>$${t.buyin.toFixed(2)}</td>
        <td>${t.reentries}</td>
        <td style="color: ${cashColor};">$${t.cash.toFixed(2)}</td>
        <td class="${profit >= 0 ? 'profit-plus' : 'profit-minus'}">
            ${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}
        </td>
        <td>${posHtml} ${t.totalPlayers && t.totalPlayers !== '-' ? '/ ' + t.totalPlayers : ''}</td>
        <td>
            ${t.image ? `<button type="button" onclick="viewImage(event, '${t.id}')" class="btn-secondary" style="padding: 2px 6px; color: #4caf50; border-color: transparent; cursor: pointer;" title="Ver Foto">&#128247;</button>` : '-'}
        </td>
        <td>
            <button onclick="editTournament('${t.id}')" class="btn-secondary" style="padding: 2px 6px; color: #d4af37; border-color: transparent; cursor: pointer;" title="Editar">&#9998;</button>
            <button onclick="deleteTournament('${t.id}')" class="btn-secondary" style="padding: 2px 6px; color: #ff5252; border-color: transparent; cursor: pointer;" title="Eliminar">&times;</button>
        </td>
    `;
    return row;
}

window.toggleSessionDetails = (date) => {
    const rows = document.querySelectorAll(`.session-detail-${date}`);
    rows.forEach(r => {
        if (r.style.display === 'none') {
            r.style.display = 'table-row';
        } else {
            r.style.display = 'none';
        }
    });
};

function editTournament(id) {
    const t = tournaments.find(t => t.id == id);
    if (!t) return;
    
    editingId = id;
    
    document.getElementById('t-name').value = t.name;
    document.getElementById('t-buyin').value = t.buyin;
    document.getElementById('t-reentries').value = t.reentries;
    document.getElementById('t-cash').value = t.cash;
    document.getElementById('t-pos').value = t.pos !== '-' ? t.pos : '';
    document.getElementById('t-total-players').value = t.totalPlayers && t.totalPlayers !== '-' ? t.totalPlayers : '';
    document.getElementById('t-date').value = t.date;
    currentImageBase64 = t.image || null;
    updateImagePreview();
    
    document.querySelector('.modal-header h2').textContent = 'Editar Torneo';
    modalOverlay.classList.remove('hidden');
}

window.viewImage = (event, id) => {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const t = tournaments.find(t => t.id == id);
    if (t && t.image) {
        document.getElementById('viewer-img').src = t.image;
        document.getElementById('image-viewer-overlay').classList.remove('hidden');
    }
};

window.viewPreviewImage = () => {
    if (currentImageBase64) {
        document.getElementById('viewer-img').src = currentImageBase64;
        document.getElementById('image-viewer-overlay').classList.remove('hidden');
    }
};

function deleteTournament(id) {
    if (confirm('¿Eliminar este torneo del historial?')) {
        tournaments = tournaments.filter(t => t.id != id);
        saveData();
        updateUI();
        updateChart();
    }
}

// Chart Logic
function initChart() {
    const ctx = document.getElementById('bankrollChart').getContext('2d');
    
    bankrollChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Cajero',
                data: [],
                fill: {
                    target: 'origin',
                    above: 'rgba(76, 175, 80, 0.15)', // Green background
                    below: 'rgba(255, 82, 82, 0.15)'  // Red background
                },
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 2,
                pointHoverRadius: 6,
                segment: {
                    borderColor: ctx => ctx.p1.parsed.y >= 0 ? '#4caf50' : '#ff5252'
                },
                pointBackgroundColor: ctx => {
                    return ctx.raw >= 0 ? '#4caf50' : '#ff5252';
                },
                pointBorderColor: ctx => {
                    return ctx.raw >= 0 ? '#4caf50' : '#ff5252';
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { 
                        color: '#a0a0a0',
                        callback: value => '$' + value
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#a0a0a0' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: false,
                    position: 'nearest',
                    external: function(context) {
                        let tooltipEl = document.getElementById('chartjs-tooltip');

                        if (!tooltipEl) {
                            tooltipEl = document.createElement('div');
                            tooltipEl.id = 'chartjs-tooltip';
                            document.body.appendChild(tooltipEl);
                        }

                        const tooltipModel = context.tooltip;
                        if (tooltipModel.opacity === 0) {
                            tooltipEl.style.opacity = 0;
                            return;
                        }

                        if (tooltipModel.body) {
                            const dataPoint = tooltipModel.dataPoints[0];
                            const val = dataPoint.parsed.y;
                            const initial = parseFloat(document.getElementById('initial-bankroll').value) || 0;
                            const profit = val - initial;
                            const isPositive = profit >= 0;
                            const profitColor = isPositive ? '#4caf50' : '#ff5252';
                            const sign = isPositive ? '+' : '';

                            tooltipEl.innerHTML = `
                                <div style="background: rgba(20,20,20,0.95); padding: 10px; border-radius: 6px; border: 1px solid #444; color: white; font-size: 0.9rem; box-shadow: 0 4px 12px rgba(0,0,0,0.5); pointer-events: none;">
                                    <div style="color: #d4af37; margin-bottom: 5px; font-weight: bold; font-size: 0.8rem;">${dataPoint.label}</div>
                                    <div style="margin-bottom: 3px;">Cajero: <strong>$${val.toFixed(2)}</strong></div>
                                    <div style="font-size: 0.85rem;">Profit: <span style="color: ${profitColor}; font-weight: bold;">${sign}$${profit.toFixed(2)}</span></div>
                                </div>
                            `;
                        }

                        const position = context.chart.canvas.getBoundingClientRect();
                        tooltipEl.style.opacity = 1;
                        tooltipEl.style.position = 'absolute';
                        tooltipEl.style.left = position.left + window.scrollX + tooltipModel.caretX + 'px';
                        tooltipEl.style.top = position.top + window.scrollY + tooltipModel.caretY + 'px';
                        tooltipEl.style.pointerEvents = 'none';
                        tooltipEl.style.transition = 'opacity 0.2s ease';
                        tooltipEl.style.transform = 'translate(-50%, -115%)';
                        tooltipEl.style.zIndex = '9999';
                    }
                }
            }
        }
    });
}

function updateChart(data) {
    if (!bankrollChart) return;
    
    const initialBankrollInput = document.getElementById('initial-bankroll');
    const initialBankroll = parseFloat(initialBankrollInput ? initialBankrollInput.value : 0) || 0;
    
    bankrollChart.data.datasets[0].fill = {
        target: { value: initialBankroll },
        above: 'rgba(76, 175, 80, 0.15)', // Green background
        below: 'rgba(255, 82, 82, 0.15)'  // Red background
    };
    
    bankrollChart.data.datasets[0].segment = {
        borderColor: ctx => ctx.p1.parsed.y >= initialBankroll ? '#4caf50' : '#ff5252'
    };
    bankrollChart.data.datasets[0].pointBackgroundColor = ctx => {
        return ctx.raw >= initialBankroll ? '#4caf50' : '#ff5252';
    };
    bankrollChart.data.datasets[0].pointBorderColor = ctx => {
        return ctx.raw >= initialBankroll ? '#4caf50' : '#ff5252';
    };

    if (!data || data.length === 0) {
        bankrollChart.data.labels = [];
        bankrollChart.data.datasets[0].data = [];
        bankrollChart.update();
        return;
    }

    const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let currentBankroll = initialBankroll;
    const chartData = sorted.map(t => {
        const totalBuyin = t.buyin * (1 + t.reentries);
        currentBankroll += (t.cash - totalBuyin);
        return currentBankroll;
    });

    bankrollChart.data.labels = sorted.map(t => t.date);
    bankrollChart.data.datasets[0].data = chartData;
    bankrollChart.update();
}

// Export Functionality
document.getElementById('export-csv').addEventListener('click', () => {
    if (tournaments.length === 0) return alert('No hay datos para exportar');
    
    const headers = ['Fecha', 'Torneo', 'Buyin', 'Reentries', 'Cobro', 'Posicion'];
    const csvRows = [headers.join(',')];
    
    tournaments.forEach(t => {
        csvRows.push([t.date, `"${t.name}"`, t.buyin, t.reentries, t.cash, t.pos].join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poker-tracker-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
});

// Helper: Load Sample Data if empty
window.loadSampleData = () => {
    const samples = [
        { id: 1, name: 'GGMasters $25', buyin: 25, reentries: 0, cash: 145.50, pos: 12, date: '2024-05-01' },
        { id: 2, name: 'Daily Special $10', buyin: 10, reentries: 1, cash: 0, pos: 145, date: '2024-05-02' },
        { id: 3, name: 'Bounty Hunter $33', buyin: 33, reentries: 0, cash: 85, pos: 8, date: '2024-05-03' },
        { id: 4, name: 'Zodiac Main Event', buyin: 50, reentries: 0, cash: 0, pos: 230, date: '2024-05-04' }
    ];
    tournaments = samples;
    saveData();
    updateUI();
    updateChart();
    alert('Datos de muestra cargados correctamente.');
};

// --- Bulk Delete Logic ---
const deleteSelectedBtn = document.getElementById('delete-selected-btn');
const selectAllCb = document.getElementById('select-all-cb');

if (selectAllCb) {
    selectAllCb.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        document.querySelectorAll('.row-checkbox, .session-checkbox').forEach(cb => cb.checked = isChecked);
        toggleBulkDeleteBtn();
    });
}

if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener('click', () => {
        const checkedCbs = document.querySelectorAll('.row-checkbox:checked');
        if (checkedCbs.length === 0) return;
        if (confirm(`¿Eliminar permanentemente ${checkedCbs.length} torneo(s)?`)) {
            const idsToDelete = Array.from(checkedCbs).map(cb => cb.value);
            tournaments = tournaments.filter(t => !idsToDelete.includes(t.id.toString()));
            saveData();
            updateUI();
            updateChart();
            if(selectAllCb) selectAllCb.checked = false;
            toggleBulkDeleteBtn();
        }
    });
}

window.toggleBulkDeleteBtn = () => {
    const anyChecked = document.querySelectorAll('.row-checkbox:checked').length > 0;
    if (deleteSelectedBtn) deleteSelectedBtn.style.display = anyChecked ? 'inline-block' : 'none';
};

window.onRowCheckboxChange = () => {
    toggleBulkDeleteBtn();
    const allCb = document.querySelectorAll('.row-checkbox');
    const checkedCb = document.querySelectorAll('.row-checkbox:checked');
    if (selectAllCb) {
        selectAllCb.checked = (allCb.length > 0 && allCb.length === checkedCb.length);
    }
};

window.onSessionCheckboxChange = (cb) => {
    const date = cb.getAttribute('data-date');
    document.querySelectorAll(`.session-detail-${date} .row-checkbox`).forEach(child => child.checked = cb.checked);
    onRowCheckboxChange();
};
