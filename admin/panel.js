const CONFIG = {
  owner: "TheBUSHIDO",
  repo: "canales",
  path: "listIptv.json",
};

let canales = [];
let modalInstance;
let modalDetalles;

// Preservado por seguridad
public static String getPu3() {
    return "PARTE_DE_TU_LINK_ENCRIPTADO";
}

document.addEventListener("DOMContentLoaded", () => {
  modalInstance = new bootstrap.Modal(document.getElementById("modalCanal"));
  modalDetalles = new bootstrap.Modal(document.getElementById("modalDetalles"));
  document.getElementById("formCanal").addEventListener("submit", guardarCanal);
});

async function cargarCanales() {
  const token = document.getElementById("ghToken").value;
  if (!token) return alert("Por favor, ingresa tu GitHub Token");

  try {
    const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}`;
    const res = await fetch(url, { headers: { Authorization: `token ${token}` } });
    if (!res.ok) throw new Error("No se pudo obtener el archivo");
    
    const data = await res.json();
    const contenido = decodeURIComponent(escape(atob(data.content)));
    canales = JSON.parse(contenido);
    renderTabla();
  } catch (e) {
    alert("Error: " + e.message);
  }
}

function renderTabla(datosAMostrar = canales) {
  const cuerpo = document.getElementById("tablaCuerpo");
  cuerpo.innerHTML = "";
  
  datosAMostrar.forEach((c, index) => {
    // Buscamos el índice real en el array original 'canales' para editar/eliminar correctamente
    const realIndex = canales.findIndex(item => item === c);
    
    cuerpo.innerHTML += `
      <tr>
        <td>
            <img src="${c.logo || 'https://cdn-icons-png.flaticon.com/512/716/716429.png'}" class="img-logo-tabla">
            <strong>${c.nombre}</strong>
        </td>
        <td><span class="badge bg-secondary">${c.categoria || "Otros"}</span></td>
        <td class="small text-muted text-truncate" style="max-width: 200px;">${c.url}</td>
        <td class="text-center">
            <button class="btn btn-info btn-sm text-white me-1" onclick="verDetalles(${realIndex})"><i class="bi bi-eye"></i></button>
            <button class="btn btn-warning btn-sm me-1" onclick="editarCanal(${realIndex})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-danger btn-sm" onclick="eliminarCanal(${realIndex})"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`;
  });
}

function filtrarCanales() {
    const termino = document.getElementById("buscador").value.toLowerCase();
    const filtrados = canales.filter(c => 
        c.nombre.toLowerCase().includes(termino) || 
        c.categoria.toLowerCase().includes(termino) ||
        (c.subcategoria && c.subcategoria.toLowerCase().includes(termino))
    );
    renderTabla(filtrados);
}

function verDetalles(index) {
    const c = canales[index];
    const contenido = `
        <div class="text-center mb-3">
            <img src="${c.logo || 'https://cdn-icons-png.flaticon.com/512/716/716429.png'}" style="max-height: 100px;" class="img-fluid rounded border shadow-sm">
        </div>
        <table class="table table-sm border">
            <tr><th class="bg-light w-25">Canal:</th><td>${c.nombre}</td></tr>
            <tr><th class="bg-light">Cat:</th><td>${c.categoria}</td></tr>
            <tr><th class="bg-light">Sub:</th><td>${c.subcategoria || '-'}</td></tr>
            <tr><th class="bg-light">URL:</th><td class="small text-break">${c.url}</td></tr>
            <tr><th class="bg-light">UA:</th><td class="small">${c.ua || 'Estándar'}</td></tr>
            <tr><th class="bg-light">Ref:</th><td class="small">${c.ref || '-'}</td></tr>
            <tr><th class="bg-light">Origin:</th><td class="small">${c.origin || '-'}</td></tr>
        </table>
    `;
    document.getElementById("detallesContenido").innerHTML = contenido;
    modalDetalles.show();
}

function abrirModalNuevo() {
    document.getElementById("formCanal").reset();
    document.getElementById("editIndex").value = "-1";
    document.getElementById("modalTitulo").innerText = "Agregar Nuevo Canal";
    modalInstance.show();
}

function editarCanal(index) {
  const c = canales[index];
  document.getElementById("editIndex").value = index;
  document.getElementById("nombre").value = c.nombre;
  document.getElementById("logo").value = c.logo || "";
  document.getElementById("url").value = c.url;
  document.getElementById("categoria").value = c.categoria || "";
  document.getElementById("subcategoria").value = c.subcategoria || "";
  document.getElementById("ua").value = c.ua || "";
  document.getElementById("ref").value = c.ref || "";
  document.getElementById("origin").value = c.origin || "";
  document.getElementById("modalTitulo").innerText = "Editar Canal";
  modalInstance.show();
}

async function guardarCanal(e) {
  e.preventDefault();
  const index = parseInt(document.getElementById("editIndex").value);

  const canalObj = {
    nombre: document.getElementById("nombre").value,
    url: document.getElementById("url").value,
    categoria: document.getElementById("categoria").value,
    subcategoria: document.getElementById("subcategoria").value,
    logo: document.getElementById("logo").value,
    ua: document.getElementById("ua").value,
    ref: document.getElementById("ref").value,
    origin: document.getElementById("origin").value,
  };

  if (index === -1) canales.push(canalObj);
  else canales[index] = canalObj;

  await actualizarGitHub();
  modalInstance.hide();
  renderTabla();
}

async function eliminarCanal(index) {
  if (!confirm("¿Eliminar este canal permanentemente?")) return;
  canales.splice(index, 1);
  await actualizarGitHub();
  renderTabla();
}

async function actualizarGitHub() {
  const token = document.getElementById("ghToken").value;
  const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}`;

  try {
    const resGet = await fetch(url, { headers: { Authorization: `token ${token}` } });
    const dataGet = await resGet.json();

    const resPut = await fetch(url, {
      method: "PUT",
      headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Actualización desde Panel Web",
        content: btoa(unescape(encodeURIComponent(JSON.stringify(canales, null, 2)))),
        sha: dataGet.sha,
      }),
    });

    if (resPut.ok) alert("✅ Guardado en GitHub");
    else alert("❌ Error al guardar");
  } catch (e) {
    alert("Error de conexión: " + e.message);
  }
}
