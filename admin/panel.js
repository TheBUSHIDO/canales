const CONFIG = {
  owner: "TheBUSHIDO",
  repo: "canales",
  path: "listIptv.json",
};

let canales = [];
let modalInstance;

document.addEventListener("DOMContentLoaded", () => {
  modalInstance = new bootstrap.Modal(document.getElementById("modalCanal"));
  document.getElementById("formCanal").addEventListener("submit", guardarCanal);
});

async function cargarCanales() {
  const token = document.getElementById("ghToken").value;
  if (!token) return alert("Ingresa tu GitHub Token para leer/escribir");

  try {
    const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}`;
    const res = await fetch(url, {
      headers: { Authorization: `token ${token}` },
    });
    const data = await res.json();
    // El contenido viene en Base64, hay que decodificarlo
    const contenido = decodeURIComponent(escape(atob(data.content)));
    canales = JSON.parse(contenido);
    renderTabla();
  } catch (e) {
    alert("Error al cargar: " + e.message);
  }
}

function renderTabla() {
  const cuerpo = document.getElementById("tablaCuerpo");
  cuerpo.innerHTML = "";
  canales.forEach((c, index) => {
    cuerpo.innerHTML += `
            <tr>
                <td><strong>${c.nombre}</strong></td>
                <td><span class="badge bg-secondary">${c.categoria || "Otros"}</span></td>
                <td class="small text-muted">${c.url.substring(0, 40)}...</td>
                <td class="text-center">
                    <button class="btn btn-warning btn-sm me-1" onclick="editarCanal(${index})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="eliminarCanal(${index})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `;
  });
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
  document.getElementById("url").value = c.url;
  document.getElementById("categoria").value = c.categoria || "Otros";
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
    ua: document.getElementById("ua").value,
    ref: document.getElementById("ref").value,
    origin: document.getElementById("origin").value,
  };

  if (index === -1)
    canales.push(canalObj); // Nuevo
  else canales[index] = canalObj; // Editar

  await actualizarGitHub();
  modalInstance.hide();
  renderTabla();
}

async function eliminarCanal(index) {
  if (!confirm("¿Seguro que quieres eliminar este canal?")) return;
  canales.splice(index, 1);
  await actualizarGitHub();
  renderTabla();
}

async function actualizarGitHub() {
  const token = document.getElementById("ghToken").value;
  const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.path}`;

  try {
    // 1. Obtener el SHA actual
    const resGet = await fetch(url, {
      headers: { Authorization: `token ${token}` },
    });
    const dataGet = await resGet.json();

    // 2. Subir nueva versión
    const resPut = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Panel Web: Actualización de lista",
        content: btoa(
          unescape(encodeURIComponent(JSON.stringify(canales, null, 2))),
        ),
        sha: dataGet.sha,
      }),
    });

    if (resPut.ok) alert("✅ GitHub actualizado correctamente");
    else alert("❌ Error al subir a GitHub");
  } catch (e) {
    alert("Error de conexión: " + e.message);
  }
}
