// Importa as funções e objetos do Firebase a partir do arquivo de configuração
import { db, carnesCollection, clientesCollection } from './firebase-config.js';
import { addDoc, onSnapshot, doc, getDoc, updateDoc, deleteDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// --- LÓGICA DA APLICAÇÃO ---

// --- Elementos do Menu Lateral ---
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// --- Demais Elementos ---
const navCarnes = document.getElementById('nav-carnes');
const navClientes = document.getElementById('nav-clientes');
const carnesPage = document.getElementById('carnesPage');
const clientesPage = document.getElementById('clientesPage');

const addCarneBtn = document.getElementById('addCarneBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const formModal = document.getElementById('formModal');
const formModalContent = document.getElementById('formModalContent');
const carneForm = document.getElementById('carneForm');
const modalTitle = document.getElementById('modalTitle');
const searchInputCarnes = document.getElementById('searchInputCarnes');
const cpfInput = document.getElementById('cpf');
const nomeInput = document.getElementById('nome');
const cpfLoader = document.getElementById('cpf-loader');

const carnesTableBody = document.getElementById('carnes-table-body');
const loadingCarnes = document.getElementById('loadingCarnes');
const carnesListDiv = document.getElementById('carnes-list');
const noResultsCarnes = document.getElementById('no-results-carnes');
const paginationCarnesContainer = document.getElementById('pagination-carnes');


const searchInputClientes = document.getElementById('searchInputClientes');
const clientesTableBody = document.getElementById('clientes-table-body');
const loadingClientes = document.getElementById('loadingClientes');
const clientesListDiv = document.getElementById('clientes-list');
const noResultsClientes = document.getElementById('no-results-clientes');
const paginationClientesContainer = document.getElementById('pagination-clientes');

const viewModal = document.getElementById('viewModal');
const viewModalContent = document.getElementById('viewModalContent');
const closeViewModalBtn = document.getElementById('closeViewModalBtn');
const viewContent = document.getElementById('viewContent');
const printCarneBtn = document.getElementById('printCarneBtn');
const multiPayFooter = document.getElementById('multiPayFooter');

const paymentModal = document.getElementById('paymentModal');
const paymentModalContent = document.getElementById('paymentModalContent');
const closePaymentModalBtn = document.getElementById('closePaymentModalBtn');
const paymentForm = document.getElementById('paymentForm');
const paymentInfo = document.getElementById('paymentInfo');
const valorPagoInput = document.getElementById('valorPago');
const descontoInput = document.getElementById('desconto');
const totalAPagarInput = document.getElementById('totalAPagar');
const valorPagoContainer = document.getElementById('valorPagoContainer');

const parcelaDetailModal = document.getElementById('parcelaDetailModal');
const parcelaDetailModalContent = document.getElementById('parcelaDetailModalContent');
const closeParcelaDetailModalBtn = document.getElementById('closeParcelaDetailModalBtn');
const parcelaDetailContent = document.getElementById('parcelaDetailContent');

const clientDetailModal = document.getElementById('clientDetailModal');
const clientDetailModalContent = document.getElementById('clientDetailModalContent');
const closeClientDetailModalBtn = document.getElementById('closeClientDetailModalBtn');
const clientDetailContent = document.getElementById('clientDetailContent');

let allCarnes = [];
let allClientes = [];
let filteredCarnes = [];
let filteredClientes = [];
let currentPageCarnes = 1;
let currentPageClientes = 1;
const ITEMS_PER_PAGE = 10;
let currentCarneToPrint = null;

// --- LÓGICA DO MENU LATERAL (SIDEBAR) ---
const openSidebar = () => {
    sidebar.classList.remove('-translate-x-full');
    sidebar.classList.add('translate-x-0');
    sidebarOverlay.classList.remove('hidden');
};
const closeSidebar = () => {
    sidebar.classList.add('-translate-x-full');
    sidebar.classList.remove('translate-x-0');
    sidebarOverlay.classList.add('hidden');
};

sidebarToggle.addEventListener('click', openSidebar);
sidebarCloseBtn.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);


// --- NAVEGAÇÃO ENTRE PÁGINAS ---
const switchPage = (pageToShow) => {
    carnesPage.classList.add('hidden');
    clientesPage.classList.add('hidden');
    navCarnes.classList.remove('bg-gray-700', 'text-gray-100');
    navCarnes.classList.add('text-gray-400', 'hover:bg-gray-700');
    navClientes.classList.remove('bg-gray-700', 'text-gray-100');
    navClientes.classList.add('text-gray-400', 'hover:bg-gray-700');

    if (pageToShow === 'carnes') {
        carnesPage.classList.remove('hidden');
        navCarnes.classList.add('bg-gray-700', 'text-gray-100');
    } else if (pageToShow === 'clientes') {
        clientesPage.classList.remove('hidden');
        navClientes.classList.add('bg-gray-700', 'text-gray-100');
    }
    if (window.innerWidth < 768) {
        closeSidebar();
    }
};

navCarnes.addEventListener('click', (e) => { e.preventDefault(); switchPage('carnes'); });
navClientes.addEventListener('click', (e) => { e.preventDefault(); switchPage('clientes'); });

// --- FUNÇÕES DE MÁSCARA E DATA ---

const maskCpfCnpj = (value) => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 11) {
        return cleaned.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
        return cleaned.slice(0, 14).replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
    }
};

cpfInput.addEventListener('input', (e) => { e.target.value = maskCpfCnpj(e.target.value); });

const getFortalezaDate = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Fortaleza' }));

const getFortalezaDateString = () => {
    const date = getFortalezaDate();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatDate = (dateString, options = {}) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T03:00:00Z');
    if (options.long) return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const setDefaultDate = () => {
    const date = getFortalezaDate();
    date.setDate(date.getDate() + 30);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    document.getElementById('primeiraParcela').value = `${year}-${month}-${day}`;
};

// --- FUNÇÕES DE UI (MODAIS) ---
const openModal = (modal, content) => { modal.classList.remove('hidden'); setTimeout(() => { content.classList.remove('scale-95', 'opacity-0'); content.classList.add('scale-100', 'opacity-100'); }, 10); };
const closeModal = (modal, content) => { content.classList.add('scale-95', 'opacity-0'); content.classList.remove('scale-100', 'opacity-100'); setTimeout(() => { modal.classList.add('hidden'); }, 300); };

addCarneBtn.addEventListener('click', () => { modalTitle.textContent = 'Adicionar Novo Carnê'; carneForm.reset(); setDefaultDate(); openModal(formModal, formModalContent); });
closeModalBtn.addEventListener('click', () => closeModal(formModal, formModalContent));
closeViewModalBtn.addEventListener('click', () => closeModal(viewModal, viewModalContent));
closePaymentModalBtn.addEventListener('click', () => closeModal(paymentModal, paymentModalContent));
closeParcelaDetailModalBtn.addEventListener('click', () => closeModal(parcelaDetailModal, parcelaDetailModalContent));
closeClientDetailModalBtn.addEventListener('click', () => closeModal(clientDetailModal, clientDetailModalContent));

// --- LÓGICA DE PAGINAÇÃO ---
const renderPaginationControls = (container, totalItems, currentPage, onPageChange) => {
    container.innerHTML = '';
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    if (totalPages <= 1) return;

    const pageInfo = document.createElement('span');
    pageInfo.className = 'text-sm text-gray-700';
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;

    const btnPrev = document.createElement('button');
    btnPrev.innerHTML = `<i class="fas fa-chevron-left mr-2"></i> Anterior`;
    btnPrev.className = 'px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors';
    btnPrev.disabled = currentPage === 1;
    btnPrev.onclick = () => onPageChange(currentPage - 1);

    const btnNext = document.createElement('button');
    btnNext.innerHTML = `Próximo <i class="fas fa-chevron-right ml-2"></i>`;
    btnNext.className = 'px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors';
    btnNext.disabled = currentPage === totalPages;
    btnNext.onclick = () => onPageChange(currentPage + 1);

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'flex items-center gap-2';
    buttonGroup.appendChild(btnPrev);
    buttonGroup.appendChild(btnNext);

    container.appendChild(pageInfo);
    container.appendChild(buttonGroup);
};


// --- LÓGICA DE CLIENTES ---
onSnapshot(query(clientesCollection), (snapshot) => {
    allClientes = [];
    snapshot.forEach(doc => allClientes.push({ id: doc.id, ...doc.data() }));
    allClientes.sort((a, b) => a.nome.localeCompare(b.nome));
    applyClientFilter();
    loadingClientes.classList.add('hidden');
    clientesListDiv.classList.remove('hidden');
});

const renderClientes = () => {
    clientesTableBody.innerHTML = '';
    noResultsClientes.classList.toggle('hidden', filteredClientes.length > 0);

    const startIndex = (currentPageClientes - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedItems = filteredClientes.slice(startIndex, endIndex);

    paginatedItems.forEach(cliente => {
        const tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-gray-50';
        tr.innerHTML = `
            <td class="p-4"><div class="font-medium text-gray-800">${cliente.nome}</div></td>
            <td class="p-4 text-gray-600">${maskCpfCnpj(cliente.cpf)}</td>
            <td class="p-4 text-center"><button onclick="viewClientDetails('${cliente.id}')" class="text-blue-600 hover:text-blue-800">Ver Detalhes</button></td>
        `;
        clientesTableBody.appendChild(tr);
    });

    renderPaginationControls(
        paginationClientesContainer,
        filteredClientes.length,
        currentPageClientes,
        (newPage) => {
            currentPageClientes = newPage;
            renderClientes();
        }
    );
};

const applyClientFilter = () => {
    const searchTerm = searchInputClientes.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const searchTermNumeros = searchInputClientes.value.replace(/\D/g, '');

    if (!searchTerm && !searchTermNumeros) {
        filteredClientes = [...allClientes];
    } else {
        filteredClientes = allClientes.filter(c => {
            const nomeNormalizado = (c.nome || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const cpfLimpo = (c.cpf || '').replace(/\D/g, '');
            return nomeNormalizado.includes(searchTerm) || (searchTermNumeros.length > 0 && cpfLimpo.includes(searchTermNumeros));
        });
    }
    currentPageClientes = 1;
    renderClientes();
};

searchInputClientes.addEventListener('input', applyClientFilter);

cpfInput.addEventListener('blur', async () => {
    const cpf = cpfInput.value.replace(/\D/g, '');
    if (cpf.length === 11 || cpf.length === 14) {
        cpfLoader.classList.remove('hidden');
        const q = query(clientesCollection, where("cpf", "==", cpf));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const clientData = querySnapshot.docs[0].data();
            nomeInput.value = clientData.nome;
        }
        cpfLoader.classList.add('hidden');
    }
});

// --- LÓGICA DE CARNÊS ---
onSnapshot(query(carnesCollection), (snapshot) => {
    allCarnes = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        const sortKeys = getCarneSortKeys(data);
        allCarnes.push({ id: doc.id, ...data, sortKeys });
    });
    allCarnes.sort((a, b) => (a.sortKeys.priority - b.sortKeys.priority) || (a.sortKeys.date - b.sortKeys.date));
    applyCarneFilter();
    loadingCarnes.classList.add('hidden');
    carnesListDiv.classList.remove('hidden');
});

carneForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = nomeInput.value;
    const cpf = cpfInput.value.replace(/\D/g, '');

    let clienteId = null;

    if (cpf) {
        const q = query(clientesCollection, where("cpf", "==", cpf));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const clienteDoc = querySnapshot.docs[0];
            clienteId = clienteDoc.id;
            const clienteDocData = clienteDoc.data();
            if (clienteDocData.nome !== nome) {
                await updateDoc(doc(db, "clientes", clienteId), { nome: nome });
            }
        } else {
            const newClientRef = await addDoc(clientesCollection, { nome, cpf });
            clienteId = newClientRef.id;
        }
    }

    const valorFinanciado = parseFloat(document.getElementById('valorFinanciado').value);
    const entrada = parseFloat(document.getElementById('entrada').value) || 0;
    const qtdParcelas = parseInt(document.getElementById('qtdParcelas').value);
    const primeiraParcela = document.getElementById('primeiraParcela').value;
    const produto = document.getElementById('produto').value;

    const valorAParcelar = valorFinanciado - entrada;
    const valorParcela = parseFloat((valorAParcelar / qtdParcelas).toFixed(2));
    const parcelas = [];
    let dataVencimento = new Date(primeiraParcela + 'T03:00:00Z');
    for (let i = 1; i <= qtdParcelas; i++) {
        parcelas.push({
            numero: i,
            valorOriginal: valorParcela,
            debitoAnterior: 0,
            creditoAnterior: 0,
            descontoAplicado: 0,
            valor: valorParcela,
            vencimento: dataVencimento.toISOString().split('T')[0],
            status: 'Pendente'
        });
        dataVencimento.setMonth(dataVencimento.getMonth() + 1);
    }
    const diferenca = valorAParcelar - (valorParcela * qtdParcelas);
    if (diferenca.toFixed(2) != 0.00) {
        const newVal = parseFloat((parcelas[qtdParcelas - 1].valor + diferenca).toFixed(2));
        parcelas[qtdParcelas - 1].valor = newVal;
        parcelas[qtdParcelas - 1].valorOriginal = newVal;
    }

    const carneData = { clienteId, nome, cpf, produto, valorFinanciado, entrada, qtdParcelas, primeiraParcela, parcelas };
    try {
        await addDoc(carnesCollection, carneData);
        carneForm.reset();
        closeModal(formModal, formModalContent);
    } catch (error) { console.error("Erro ao salvar o carnê: ", error); }
});

const getCarneSortKeys = (carne) => {
    const hoje = getFortalezaDate();
    hoje.setHours(0, 0, 0, 0);
    let proximaParcelaPendente = null;

    for (const parcela of carne.parcelas) {
        if (parcela.status === 'Pendente') {
            proximaParcelaPendente = parcela;
            break;
        }
    }
    if (!proximaParcelaPendente) {
        return { priority: 4, date: new Date('2999-12-31') };
    }
    const vencimento = new Date(proximaParcelaPendente.vencimento + 'T03:00:00Z');
    if (vencimento < hoje) {
        return { priority: 1, date: vencimento };
    }
    const diffTime = vencimento - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
        return { priority: 2, date: vencimento };
    }
    return { priority: 3, date: vencimento };
};

const getCarneStatus = (carne) => {
    const hoje = getFortalezaDate();
    hoje.setHours(0, 0, 0, 0);
    let proximoVencimento = null;

    for (const parcela of carne.parcelas) {
        if (parcela.status === 'Pendente') {
            const vencimento = new Date(parcela.vencimento + 'T03:00:00Z');
            if (vencimento < hoje) {
                return { text: 'Atrasado', class: 'bg-red-200 text-red-800' };
            }
            if (!proximoVencimento || vencimento < proximoVencimento) {
                proximoVencimento = vencimento;
            }
        }
    }

    if (!proximoVencimento) {
        return { text: 'Pago', class: 'bg-green-200 text-green-800' };
    }

    const diffTime = proximoVencimento - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) {
        return { text: 'Vencendo', class: 'bg-yellow-200 text-yellow-800' };
    }

    return { text: 'Em dia', class: 'bg-blue-200 text-blue-800' };
};

const renderCarnes = () => {
    carnesTableBody.innerHTML = '';
    noResultsCarnes.classList.toggle('hidden', filteredCarnes.length > 0);

    const startIndex = (currentPageCarnes - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedItems = filteredCarnes.slice(startIndex, endIndex);

    paginatedItems.forEach(carne => {
        const status = getCarneStatus(carne);
        const tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-gray-50';
        tr.innerHTML = `
            <td class="p-4"><div class="font-medium text-gray-800">${carne.nome}</div></td>
            <td class="p-4 text-gray-600">${maskCpfCnpj(carne.cpf)}</td>
            <td class="p-4 text-center"><span class="px-3 py-1 text-xs font-semibold rounded-full ${status.class}">${status.text}</span></td>
            <td class="p-4 text-right font-medium text-gray-800">${carne.valorFinanciado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td class="p-4 text-center">
                <div class="flex justify-center items-center gap-2">
                    <button onclick="viewCarne('${carne.id}')" class="text-green-600 hover:text-green-800" title="Visualizar"><i class="fas fa-eye"></i></button>
                    <button onclick="deleteCarne('${carne.id}', '${carne.nome}')" class="text-red-600 hover:text-red-800" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                </div>
            </td>
        `;
        carnesTableBody.appendChild(tr);
    });

    renderPaginationControls(
        paginationCarnesContainer,
        filteredCarnes.length,
        currentPageCarnes,
        (newPage) => {
            currentPageCarnes = newPage;
            renderCarnes();
        }
    );
};

const applyCarneFilter = () => {
    const searchTerm = searchInputCarnes.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const searchTermNumeros = searchInputCarnes.value.replace(/\D/g, '');

    if (!searchTerm && !searchTermNumeros) {
        filteredCarnes = [...allCarnes];
    } else {
        filteredCarnes = allCarnes.filter(c => {
            const nomeNormalizado = (c.nome || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const cpfLimpo = (c.cpf || '').replace(/\D/g, '');
            return nomeNormalizado.includes(searchTerm) || (searchTermNumeros.length > 0 && cpfLimpo.includes(searchTermNumeros));
        });
    }
    currentPageCarnes = 1;
    renderCarnes();
};

searchInputCarnes.addEventListener('input', applyCarneFilter);

window.deleteCarne = async (id, nome) => {
    if (confirm(`Tem certeza que deseja excluir o carnê de ${nome}? Esta ação não pode ser desfeita.`)) {
        try {
            await deleteDoc(doc(db, "carnes", id));
        } catch (error) { console.error("Erro ao excluir carnê: ", error); }
    }
};

window.viewCarne = async (id) => {
    const carneRef = doc(db, "carnes", id);
    const carneSnap = await getDoc(carneRef);
    if (carneSnap.exists()) {
        const carne = { id: carneSnap.id, ...carneSnap.data() };
        currentCarneToPrint = carne;

        let totalPagoParcelas = 0;
        let totalDescontosAplicados = 0;
        carne.parcelas.forEach(p => {
            if (p.status === 'Paga') {
                if (p.valorPago) totalPagoParcelas += p.valorPago;
                if (p.descontoAplicado) totalDescontosAplicados += p.descontoAplicado;
            }
        });
        const entrada = carne.entrada || 0;
        const totalGeralRecebido = entrada + totalPagoParcelas;
        const saldoDevedor = carne.valorFinanciado - totalGeralRecebido - totalDescontosAplicados;

        const hasPending = carne.parcelas.some(p => p.status === 'Pendente');

        let parcelasHtml = '';
        if (hasPending) {
            parcelasHtml += `
            <div class="flex items-center p-2 bg-gray-100 rounded-md mb-2">
                <input type="checkbox" id="selectAllCheckbox" class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                <label for="selectAllCheckbox" class="ml-2 block text-sm text-gray-900">Selecionar Todas</label>
            </div>
            `;
        }

        parcelasHtml += '<div id="parcelas-list-container">';
        carne.parcelas.forEach((p, index) => {
            const isPendente = p.status === 'Pendente';
            const hoje = getFortalezaDate();
            hoje.setHours(0, 0, 0, 0);
            const vencimento = new Date(p.vencimento + 'T03:00:00Z');
            const isAtrasada = isPendente && vencimento < hoje;

            let paymentInfoHtml = !isPendente ? `<p class="text-sm text-green-700">Pago em: ${formatDate(p.dataPagamento)}</p>` : `<p class="text-sm ${isAtrasada ? 'text-red-600 font-medium' : 'text-gray-500'}">Vencimento: ${formatDate(p.vencimento)}</p>`;

            parcelasHtml += `
                <div class="flex justify-between items-center p-3 rounded-lg mb-2 ${isPendente ? (isAtrasada ? 'bg-red-50' : 'bg-gray-50') : 'bg-green-50'}">
                   <div class="flex items-center">
                        ${isPendente ? `<input type="checkbox" class="parcela-checkbox h-4 w-4 mr-4" data-index="${index}" data-valor="${p.valor}">` : '<div class="w-8"></div>'}
                        <div>
                            <p class="font-semibold text-gray-800">Parcela ${String(p.numero).padStart(2, '0')} - ${p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            ${paymentInfoHtml}
                        </div>
                   </div>
                    <div class="no-print flex items-center gap-3">
                        <button onclick="viewParcelaDetails('${id}', ${index})" class="text-gray-500 hover:text-gray-800 text-lg" title="Ver Detalhes da Parcela"><i class="fas fa-eye"></i></button>
                        ${isPendente ? `<button onclick="openPaymentModal('${id}', [${index}])" class="bg-blue-500 text-white text-sm font-bold py-1 px-3 rounded-lg hover:bg-blue-600">Pagar</button>` : `<div class="flex items-center gap-3"><span class="text-green-600 font-bold"><i class="fas fa-check-circle"></i></span><button onclick="printParcelaRecibo('${id}', ${index})" class="text-gray-500 hover:text-gray-800 text-lg" title="Imprimir Recibo da Parcela"><i class="fas fa-receipt"></i></button></div>`}
                    </div>
                </div>
            `;
        });
        parcelasHtml += '</div>';

        viewContent.innerHTML = `
            <div class="space-y-4 mb-6">
                <div><p class="text-sm text-gray-500">CLIENTE</p><p class="text-lg font-semibold text-gray-800">${carne.nome}</p></div>
                <div><p class="text-sm text-gray-500">PRODUTO</p><p class="text-lg text-gray-700">${carne.produto || 'Não informado'}</p></div>
                <div><p class="text-sm text-gray-500">VALOR TOTAL DA COMPRA</p><p class="text-lg font-bold text-blue-600">${carne.valorFinanciado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
            </div>
            <hr class="my-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4">Resumo Financeiro</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                <div class="p-2 bg-gray-50 rounded-md"><p class="text-gray-500">Valor de Entrada</p><p class="font-semibold text-gray-800">${entrada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                <div class="p-2 bg-gray-50 rounded-md"><p class="text-gray-500">Recebido (Parcelas)</p><p class="font-semibold text-gray-800">${totalPagoParcelas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                <div class="p-2 bg-yellow-50 rounded-md"><p class="text-yellow-600">Descontos Concedidos</p><p class="font-semibold text-yellow-800">${totalDescontosAplicados.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                <div class="p-2 bg-green-50 rounded-md col-span-2 md:col-span-1"><p class="text-green-600">Total Geral Recebido</p><p class="font-bold text-lg text-green-800">${totalGeralRecebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                <div class="p-2 bg-red-50 rounded-md col-span-2 md:col-span-2"><p class="text-red-600">Saldo Devedor</p><p class="font-bold text-lg text-red-800">${saldoDevedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
            </div>
            <hr class="my-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4">Parcelas</h3>
            ${parcelasHtml}
        `;
        multiPayFooter.innerHTML = `<button id="multiPayBtn" onclick="handleMultiPay('${id}')" class="hidden w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition duration-300"></button>`;

        addCheckboxListeners();
        openModal(viewModal, viewModalContent);
    }
};

const addCheckboxListeners = () => {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const parcelasCheckboxes = document.querySelectorAll('.parcela-checkbox');

    const updateMultiPayButton = () => {
        const selected = document.querySelectorAll('.parcela-checkbox:checked');
        const multiPayBtn = document.getElementById('multiPayBtn');
        if (selected.length > 0) {
            let total = 0;
            selected.forEach(cb => total += parseFloat(cb.dataset.valor));
            multiPayBtn.textContent = `Pagar ${selected.length} Parcela(s) Selecionada(s) - Total: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
            multiPayBtn.classList.remove('hidden');
        } else {
            multiPayBtn.classList.add('hidden');
        }
    };

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            parcelasCheckboxes.forEach(checkbox => { checkbox.checked = e.target.checked; });
            updateMultiPayButton();
        });
    }
    parcelasCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (!checkbox.checked && selectAllCheckbox) { selectAllCheckbox.checked = false; }
            updateMultiPayButton();
        });
    });
};

window.handleMultiPay = (carneId) => {
    const selected = document.querySelectorAll('.parcela-checkbox:checked');
    const indices = Array.from(selected).map(cb => parseInt(cb.dataset.index));
    if (indices.length > 0) { openPaymentModal(carneId, indices); }
};

window.openPaymentModal = async (carneId, parcelaIndices) => {
    const carneRef = doc(db, "carnes", carneId);
    const carneSnap = await getDoc(carneRef);
    if (!carneSnap.exists()) return;

    const carne = carneSnap.data();
    let totalValor = 0;
    parcelaIndices.forEach(index => { totalValor += carne.parcelas[index].valor; });

    let infoHtml;
    if (parcelaIndices.length === 1) {
        const parcela = carne.parcelas[parcelaIndices[0]];
        infoHtml = `<p><strong>Parcela:</strong> ${parcela.numero} / ${carne.qtdParcelas}</p><p><strong>Vencimento:</strong> ${formatDate(parcela.vencimento)}</p><p class="font-bold text-lg"><strong>Valor a Pagar:</strong> ${parcela.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>`;
        valorPagoContainer.style.display = 'block';
        valorPagoInput.required = true;
    } else {
        infoHtml = `<p><strong>${parcelaIndices.length} parcelas selecionadas</strong></p><p class="font-bold text-lg"><strong>Valor Total:</strong> ${totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>`;
        valorPagoContainer.style.display = 'none';
        valorPagoInput.required = false;
        valorPagoInput.value = '';
    }

    paymentInfo.innerHTML = infoHtml;
    document.getElementById('paymentCarneId').value = carneId;
    document.getElementById('paymentParcelaIndices').value = JSON.stringify(parcelaIndices);
    descontoInput.value = '';

    const updateTotal = () => {
        const desconto = parseFloat(descontoInput.value) || 0;
        const finalTotal = totalValor - desconto;
        totalAPagarInput.value = finalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        if (parcelaIndices.length === 1) { valorPagoInput.value = finalTotal.toFixed(2); }
    };

    descontoInput.addEventListener('input', updateTotal);
    updateTotal();
    openModal(paymentModal, paymentModalContent);
};

paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const carneId = document.getElementById('paymentCarneId').value;
    const parcelaIndices = JSON.parse(document.getElementById('paymentParcelaIndices').value);
    const descontoTotal = parseFloat(descontoInput.value) || 0;

    const carneRef = doc(db, "carnes", carneId);
    const carneSnap = await getDoc(carneRef);
    if (!carneSnap.exists()) return;

    let carneData = carneSnap.data();
    const dataPagamentoCorreta = getFortalezaDateString();

    if (parcelaIndices.length === 1) {
        const parcelaIndex = parcelaIndices[0];
        let valorPago = parseFloat(valorPagoInput.value) || 0;
        
        let parcelaAtual = carneData.parcelas[parcelaIndex];
        const valorDevido = parcelaAtual.valor - descontoTotal;

        if (parcelaIndex === carneData.parcelas.length - 1 && valorPago > valorDevido) {
            valorPago = valorDevido;
        }

        parcelaAtual.status = 'Paga';
        parcelaAtual.dataPagamento = dataPagamentoCorreta;
        parcelaAtual.valorPago = valorPago;
        parcelaAtual.descontoAplicado = descontoTotal;
        
        const diferenca = parseFloat((valorDevido - valorPago).toFixed(2));

        if (diferenca !== 0 && parcelaIndex < carneData.parcelas.length - 1) {
            const nextParcela = carneData.parcelas[parcelaIndex + 1];
            nextParcela.debitoAnterior = nextParcela.debitoAnterior || 0;
            nextParcela.creditoAnterior = nextParcela.creditoAnterior || 0;

            if (diferenca > 0) {
                nextParcela.debitoAnterior = parseFloat((nextParcela.debitoAnterior + diferenca).toFixed(2));
            } else {
                const credito = -diferenca;
                nextParcela.creditoAnterior = parseFloat((nextParcela.creditoAnterior + credito).toFixed(2));
            }
            
            nextParcela.valor = parseFloat(
                (nextParcela.valorOriginal + nextParcela.debitoAnterior - nextParcela.creditoAnterior).toFixed(2)
            );
            if (nextParcela.valor < 0) nextParcela.valor = 0;

        } else if (diferenca > 0 && parcelaIndex === carneData.parcelas.length - 1) {
            let ultimoVencimento = new Date(parcelaAtual.vencimento + 'T03:00:00Z');
            ultimoVencimento.setMonth(ultimoVencimento.getMonth() + 1);
            const novaParcela = { 
                numero: carneData.parcelas.length + 1, 
                valorOriginal: 0, 
                debitoAnterior: diferenca,
                creditoAnterior: 0,
                valor: diferenca, 
                vencimento: ultimoVencimento.toISOString().split('T')[0], 
                status: 'Pendente', 
                descontoAplicado: 0 
            };
            carneData.parcelas.push(novaParcela);
            carneData.qtdParcelas = carneData.parcelas.length;
        }
    } else {
        let totalSelecionado = 0;
        parcelaIndices.forEach(index => totalSelecionado += carneData.parcelas[index].valor);

        parcelaIndices.forEach(index => {
            let parcela = carneData.parcelas[index];
            const proporcao = totalSelecionado > 0 ? parcela.valor / totalSelecionado : 0;
            const descontoParcela = descontoTotal * proporcao;

            parcela.status = 'Paga';
            parcela.dataPagamento = dataPagamentoCorreta;
            parcela.descontoAplicado = parseFloat(descontoParcela.toFixed(2));
            parcela.valorPago = parseFloat((parcela.valor - descontoParcela).toFixed(2));
        });
    }
    
    try {
        await updateDoc(carneRef, { parcelas: carneData.parcelas, qtdParcelas: carneData.qtdParcelas });
        closeModal(paymentModal, paymentModalContent);
        viewCarne(carneId);
    } catch (error) { console.error("Erro ao registrar pagamento:", error); }
});


window.viewParcelaDetails = async (carneId, parcelaIndex) => {
    const carneRef = doc(db, "carnes", carneId);
    const carneSnap = await getDoc(carneRef);
    if (!carneSnap.exists()) return;

    const carne = carneSnap.data();
    const parcela = carne.parcelas[parcelaIndex];

    let statusText, statusColor;
    const hoje = getFortalezaDate();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(parcela.vencimento + 'T03:00:00Z');

    if (parcela.status === 'Paga') {
        const valorDevido = parcela.valor - (parcela.descontoAplicado || 0);
        const diferenca = parseFloat((valorDevido - (parcela.valorPago || 0)).toFixed(2));
        if (diferenca > 0) {
            statusText = 'Paga Parcialmente (Saldo transferido)';
            statusColor = 'text-yellow-600';
        } else {
            statusText = 'Paga Integralmente';
            statusColor = 'text-green-600';
        }
    } else if (vencimento < hoje) {
        statusText = 'Atrasada'; statusColor = 'text-red-600';
    } else {
        statusText = 'Pendente'; statusColor = 'text-blue-600';
    }

    const debitoAnterior = parcela.debitoAnterior || 0;
    const creditoAnterior = parcela.creditoAnterior || 0;

    const debitoHtml = debitoAnterior > 0 ? `<div class="p-3 bg-red-50 rounded-lg"><p class="text-sm text-red-500">Débito Anterior (Pag. a menor)</p><p class="font-semibold text-red-800">+ ${debitoAnterior.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>` : '';
    const creditoHtml = creditoAnterior > 0 ? `<div class="p-3 bg-green-50 rounded-lg"><p class="text-sm text-green-500">Crédito Anterior (Pag. a maior)</p><p class="font-semibold text-green-800">- ${creditoAnterior.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>` : '';


    const detailHtml = `
        <div class="space-y-3 text-gray-700">
            <div class="p-3 bg-gray-50 rounded-lg"><p class="text-sm text-gray-500">Valor Original da Parcela</p><p class="font-semibold">${(parcela.valorOriginal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
            ${debitoHtml}
            ${creditoHtml}
            <div class="p-3 bg-blue-50 rounded-lg"><p class="text-sm text-blue-500">Total a Pagar Nesta Parcela</p><p class="font-bold text-lg text-blue-800">${(parcela.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
            <hr class="my-4"/>
            <div class="p-3 bg-gray-50 rounded-lg"><p class="text-sm text-gray-500">Status</p><p class="font-bold ${statusColor}">${statusText}</p></div>
            <div class="p-3 bg-gray-50 rounded-lg"><p class="text-sm text-gray-500">Vencimento</p><p class="font-semibold">${formatDate(parcela.vencimento)}</p></div>
            ${parcela.status === 'Paga' ? `<div class="p-3 bg-green-50 rounded-lg"><p class="text-sm text-green-500">Desconto Concedido</p><p class="font-semibold text-green-800">${(parcela.descontoAplicado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div><div class="p-3 bg-green-50 rounded-lg"><p class="text-sm text-green-500">Data do Pagamento</p><p class="font-semibold text-green-800">${formatDate(parcela.dataPagamento)}</p></div><div class="p-3 bg-green-50 rounded-lg"><p class="text-sm text-green-500">Valor Efetivamente Pago</p><p class="font-semibold text-green-800">${(parcela.valorPago || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>` : ''}
        </div>`;

    parcelaDetailContent.innerHTML = detailHtml;
    openModal(parcelaDetailModal, parcelaDetailModalContent);
};

window.viewClientDetails = async (clientId) => {
    const clientRef = doc(db, "clientes", clientId);
    const clientSnap = await getDoc(clientRef);
    if (!clientSnap.exists()) return;

    const clientData = clientSnap.data();
    const q = query(carnesCollection, where("clienteId", "==", clientId));
    const carnesSnapshot = await getDocs(q);
    const clientCarnes = [];
    carnesSnapshot.forEach(doc => clientCarnes.push({ id: doc.id, ...doc.data() }));

    let totalParcelas = 0; let parcelasPagasAtrasadas = 0;
    clientCarnes.forEach(carne => {
        carne.parcelas.forEach(p => {
            totalParcelas++;
            if (p.status === 'Paga') {
                const vencimento = new Date(p.vencimento + 'T03:00:00Z');
                const pagamento = new Date(p.dataPagamento + 'T03:00:00Z');
                if (pagamento > vencimento) parcelasPagasAtrasadas++;
            }
        });
    });

    let classificacao = { text: 'Bom Pagador', color: 'text-blue-600', icon: 'fa-thumbs-up' };
    if (clientCarnes.length === 0) classificacao = { text: 'Novo Cliente', color: 'text-gray-600', icon: 'fa-user-plus' };
    else if (clientCarnes.some(c => getCarneStatus(c).text === 'Atrasado')) classificacao = { text: 'Requer Atenção', color: 'text-red-600', icon: 'fa-exclamation-circle' };
    else if (parcelasPagasAtrasadas === 0 && totalParcelas > 0) classificacao = { text: 'Excelente Pagador', color: 'text-green-600', icon: 'fa-star' };
    else if (parcelasPagasAtrasadas > totalParcelas / 4) classificacao = { text: 'Pagador com Atrasos', color: 'text-yellow-600', icon: 'fa-exclamation-triangle' };

    let carnesHtml = '<div class="space-y-2">';
    if (clientCarnes.length > 0) {
        clientCarnes.sort((a, b) => new Date(b.primeiraParcela) - new Date(a.primeiraParcela));
        carnesHtml += clientCarnes.map(carne => {
            const status = getCarneStatus(carne);
            return `
                <div class="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <div><p class="font-semibold">${carne.produto}</p><p class="text-sm text-gray-600">${carne.valorFinanciado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} - <span class="font-bold ${status.class.split(' ')[1]}">${status.text}</span></p></div>
                    <button class="text-blue-600 hover:underline" onclick="closeModal(clientDetailModal, clientDetailModalContent); viewCarne('${carne.id}')">Ver Carnê</button>
                </div>`;
        }).join('');
    } else { carnesHtml = '<p class="text-gray-500 text-center">Nenhum carnê registrado.</p>'; }
    carnesHtml += '</div>';

    clientDetailContent.innerHTML = `
        <div class="space-y-4">
            <div><p class="text-sm text-gray-500">NOME</p><p class="text-xl font-bold text-gray-800">${clientData.nome}</p></div>
            <div><p class="text-sm text-gray-500">CPF / CNPJ</p><p class="text-lg text-gray-700">${maskCpfCnpj(clientData.cpf)}</p></div>
            <div class="p-4 bg-gray-100 rounded-lg text-center">
                 <p class="text-sm text-gray-500">CLASSIFICAÇÃO DO CLIENTE</p><p class="text-2xl font-bold ${classificacao.color}"><i class="fas ${classificacao.icon} mr-2"></i>${classificacao.text}</p>
                 <p class="text-xs text-gray-500 mt-1">${parcelasPagasAtrasadas} de ${totalParcelas} parcelas pagas com atraso.</p>
            </div>
             <hr class="my-4"/><h3 class="text-lg font-bold text-gray-800 mb-2">Histórico de Compras</h3>${carnesHtml}
        </div>`;
    openModal(clientDetailModal, clientDetailModalContent);
}

// --- LÓGICA DE IMPRESSÃO ---
printCarneBtn.addEventListener('click', () => {
    if (!currentCarneToPrint) return;
    const carne = currentCarneToPrint;
    let canhotosHtml = '';
    carne.parcelas.forEach(p => {
        canhotosHtml += `
            <div class="canhoto" style="border: 1px dashed #666; padding: 8px; margin-bottom: 5px; font-family: 'Courier New', Courier, monospace; font-size: 10px;">
                <div style="text-align: center; margin-bottom: 4px;"><h3 style="font-size: 0.8rem; font-weight: bold; margin: 0;">ARCANJO ELETROMÓVEIS</h3></div>
                <div style="border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 4px 0; margin: 4px 0;">
                    <p style="margin: 2px 0;"><strong>Cliente:</strong> ${carne.nome}</p><p style="margin: 2px 0;"><strong>Produto:</strong> ${carne.produto || 'N/A'}</p>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span><strong>Parcela:</strong> ${String(p.numero).padStart(2, '0')}/${String(carne.qtdParcelas).padStart(2, '0')}</span><span><strong>Venc:</strong> ${formatDate(p.vencimento)}</span>
                </div>
                <div style="text-align: right; margin-top: 4px; font-size: 1rem; font-weight: bold;">${p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                <div style="margin-top: 8px; border-top: 1px solid #ccc; padding-top: 4px; font-size: 0.7rem;"><p>Recebido: ________________ Data: ___/___/____</p></div>
            </div>`;
    });
    document.getElementById('print-area').innerHTML = `<div style="padding: 10px;">${canhotosHtml}</div>`;
    window.print();
});

window.printParcelaRecibo = async (carneId, parcelaIndex) => {
    const carneRef = doc(db, "carnes", carneId);
    const carneSnap = await getDoc(carneRef);
    if (!carneSnap.exists()) return;

    const carne = carneSnap.data();
    const parcela = carne.parcelas[parcelaIndex];
    if (!parcela || parcela.status !== 'Paga') return;

    const valorDevido = parcela.valor - (parcela.descontoAplicado || 0);
    const saldoPendente = parseFloat((valorDevido - (parcela.valorPago || 0)).toFixed(2));
    const cupomHtml = `
       <div style="width: 300px; padding: 10px; font-family: 'Courier New', monospace; font-size: 12px; color: #000;">
           <div style="text-align: center; margin-bottom: 10px;"><h3 style="font-size: 16px; font-weight: bold; margin: 0;">ARCANJO ELETROMÓVEIS</h3><p style="margin: 0;">Groaíras, CE</p><p style="margin: 5px 0; font-size: 14px; font-weight: bold;">COMPROVANTE DE PAGAMENTO</p></div>
           <p><strong>Cliente:</strong> ${carne.nome}</p><p><strong>Produto:</strong> ${carne.produto || 'N/A'}</p>
           <hr style="border: none; border-top: 1px dashed #000; margin: 10px 0;">
           <p style="margin: 0; font-weight: bold; text-align: center;">DETALHES DA PARCELA</p>
           <div style="display: flex; justify-content: space-between; margin-top: 5px;"><span>Parcela Nº:</span><span>${parcela.numero} de ${carne.qtdParcelas}</span></div>
           <div style="display: flex; justify-content: space-between;"><span>Vencimento:</span><span>${formatDate(parcela.vencimento)}</span></div>
           <div style="display: flex; justify-content: space-between;"><span>Data Pagamento:</span><span>${formatDate(parcela.dataPagamento)}</span></div>
           <hr style="border: none; border-top: 1px dashed #000; margin: 10px 0;">
           <div style="display: flex; justify-content: space-between;"><span>Valor da Parcela:</span><span>${parcela.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
           <div style="display: flex; justify-content: space-between;"><span>Desconto Aplicado:</span><span>${(parcela.descontoAplicado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
           <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 5px;"><span>VALOR PAGO:</span><span>${(parcela.valorPago || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
           ${saldoPendente > 0 ? `<div style="display: flex; justify-content: space-between; color: #D32F2F; margin-top: 5px;"><span>Saldo Pendente:</span><span>${saldoPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div><p style="font-size: 10px; text-align: center; margin-top: 5px;">(Valor transferido para a próxima parcela)</p>` : ''}
           <hr style="border: none; border-top: 1px dashed #000; margin: 10px 0;"><p style="text-align: center; font-size: 10px;">Obrigado pela preferência!</p>
       </div>`;
    document.getElementById('print-area').innerHTML = cupomHtml;
    window.print();
};

// Expor funções para o escopo global
window.viewCarne = viewCarne;
window.deleteCarne = deleteCarne;
window.viewClientDetails = viewClientDetails;
window.viewParcelaDetails = viewParcelaDetails;
window.openPaymentModal = openPaymentModal;
window.printParcelaRecibo = printParcelaRecibo;
window.handleMultiPay = handleMultiPay;
window.closeModal = closeModal;
window.clientDetailModal = clientDetailModal;
window.clientDetailModalContent = clientDetailModalContent;
