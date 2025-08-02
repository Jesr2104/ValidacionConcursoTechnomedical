const server = "https://script.google.com/macros/s/AKfycbw9HW1qVOa87KJ3M_KUqx_Z5fMB1yCFXm2r-GW1lvDi7D0iWBgbdBXqPk6SrcIoPLOO/exec";
let listaParticipantes = [];

async function getlist() {
  const data = new URLSearchParams();
  data.append("funcion", "obtenerLista");
  listaParticipantes.length = 0;

  fetch(server, {
    method: "POST",
    body: data,
  })
  .then(response => response.json())
  .then(data => {
    data.forEach((participante) => {
      let newParticipante = {
        fechaInscripcion: participante["Fecha de Incripcion"],
        nombre: participante["Nombre completo"],
        fechaNacimiento: participante["Fecha de nacimiento"],
        cedula: participante["Cédula de ciudadanía"],
        ciudad: participante["Ciudad"],
        empresa: participante["Empresa"],
        cargo: participante["Cargo"],
        colegio: participante["Colegio de bacteriólogos"],
        asesor: participante["Asesor comercial"],
        telefono: participante["Teléfono"],
        correo: participante["Correo electrónico"],
        confirmado: participante["Confirmado"]
      };
      listaParticipantes.push(newParticipante);
      agregarParticipante(
        newParticipante.nombre,
        newParticipante.cedula,
        newParticipante.confirmado
      );
    });
  })
  .catch((error) => {
    console.error("Error:", error);
  });
}

function agregarParticipante(nombre, cedula, validado) {
  const cuerpo = document.getElementById("cuerpo-tabla");

  const fila = document.createElement("tr");
  fila.innerHTML = `
      <td>${nombre}</td>
      <td>${cedula}</td>
      <td><span class="status-icon ${validado ? 'validado' : 'no-validado'}">${validado ? "✓" : "✗"}</span></td>
      <td style="white-space: nowrap;">
          <button class='btn btn-info' onclick="mostrarInfo('${cedula}')">
              <span>👁️</span> Ver info
          </button>
          ${!validado ? `
          <button class='btn btn-validar' onclick="validarPorCedula('${cedula}', this)">
              <span>✓</span> Validar
          </button>` : ""}
      </td>
  `;
  cuerpo.appendChild(fila);
}

function filtrarYMostrarParticipantes() {
  const buscador = document.getElementById("buscador").value.toLowerCase();

  // Filtrado
  const filtrados = listaParticipantes.filter(p => {
    let nombre = p.nombre?.toLowerCase() || "";
    let cedula = String(p.cedula || "");
    return nombre.includes(buscador ) || cedula.includes(buscador);
  });

  // Mostrar resultado filtrado
  const cuerpo = document.getElementById("cuerpo-tabla");
  cuerpo.innerHTML = "";

  filtrados.forEach(p => {
    agregarParticipante(
      p.nombre, 
      p.cedula,
      p.confirmado
    );
  });
}

function mostrarSoloValidados() {
  const filtro = document.getElementById("filtroValidados").checked;
  const cuerpo = document.getElementById("cuerpo-tabla");
  const checkboxNoValidados = document.getElementById("filtroNoValidados");
  cuerpo.innerHTML = "";

  checkboxNoValidados.checked = false;

  if (filtro) {
    // Mostrar solo los validados
    const validados = listaParticipantes.filter(p => p.confirmado === true);

    if (validados.length === 0) {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-light)">
          No hay participantes validados
        </td>
      `;
      cuerpo.appendChild(fila);
      return;
    }

    validados.forEach((p, index) => {
      agregarParticipante(p.nombre, p.cedula, p.confirmado);
    });

  } else {
    // Mostrar todos
    listaParticipantes.forEach((p, index) => {
      agregarParticipante(p.nombre, p.cedula, p.confirmado);
    });
  }
}

function mostrarSoloNoValidados() {
  const filtro = document.getElementById("filtroNoValidados").checked;
  const cuerpo = document.getElementById("cuerpo-tabla");
  const checkboxValidados = document.getElementById("filtroValidados");
  cuerpo.innerHTML = "";

  checkboxValidados.checked = false;

  if (filtro) {
    // Mostrar solo los no validados
    const noValidados = listaParticipantes.filter(p => !p.confirmado);

    if (noValidados.length === 0) {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-light)">
          Todos los participantes están validados
        </td>
      `;
      cuerpo.appendChild(fila);
      return;
    }

    noValidados.forEach((p) => {
      agregarParticipante(p.nombre, p.cedula, p.confirmado);
    });

  } else {
    // Mostrar todos
    listaParticipantes.forEach((p, index) => {
      agregarParticipante(p.nombre, p.cedula, p.confirmado);
    });
  }
}

function validarPorCedula(cedula, boton) {
  // 1. Buscar el índice del participante por su cédula
  const index = listaParticipantes.findIndex(p => p.cedula.toString() === cedula.toString());
  if (index === -1) {
    alert("Participante no encontrado en la lista local.");
    return;
  }

  // Bloquear botón
  boton.disabled = true;

  // Mostrar loader
  const originalHTML = boton.innerHTML;
  boton.innerHTML = `<span>✓</span> Validando <span class="loader"></span>`;

  const participante = listaParticipantes[index];

  // 2. Crear los datos para enviar al servidor
  const data = new URLSearchParams();
  data.append("funcion", "confirmarParticipacion");
  data.append("cedula", cedula);

  // 3. Hacer el POST
  fetch(server, {
    method: "POST",
    body: data,
  })
  .then(response => response.text())
  .then(respuesta => { 
    if (respuesta === "Participante confirmado con éxito") {
      // 4. Actualizar en la lista local
      listaParticipantes[index].confirmado = true;

      // 5. Volver a renderizar la tabla completa o filtrada
      filtrarYMostrarParticipantes(); // puedes usar esta o la que aplique según el contexto

      // 6. Confirmación visual
      boton.innerHTML = '✅ Validado';
    } else {
      alert(`No se pudo validar al participante: ${respuesta.mensaje || 'Error desconocido'}`);
    }
  })
  .catch(error => {
    console.error("Error al validar participante:", error);
    alert("Error al validar participante. Por favor intenta de nuevo.");
    boton.disabled = false;
    boton.innerHTML = originalHTML;
  });
}

function mostrarInfo(cedula) {
  // 1. Buscar al participante
  const index = listaParticipantes.findIndex(p => p.cedula.toString() === cedula.toString());
  if (index === -1) {
    alert("Participante no encontrado.");
    return;
  }

  const p = listaParticipantes[index];  

  // 2. Crear estilos si no existen
  if (!document.getElementById("estilos-modal-participante")) {
    const style = document.createElement("style");
    style.id = "estilos-modal-participante";
    style.textContent = `
      .modal {
        display: none; position: fixed; z-index: 999; left: 0; top: 0;
        width: 100%; height: 100%; overflow: auto;
        background-color: rgba(0,0,0,0.5);
      }
      .modal-contenido {
        background-color: #fff; margin: 10% auto; padding: 2rem;
        border-radius: 8px; width: 80%; max-width: 500px;
      }
      .cerrar {
        float: right; font-size: 24px; cursor: pointer;
      }
      .modal-contenido div {
        margin-bottom: 10px;
      }
      .modal-contenido b {
        display: inline-block; width: 160px;
      }
    `;
    document.head.appendChild(style);
  }

  // 3. Crear el modal si no existe
  let modal = document.getElementById("modal-participante");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-participante";
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-contenido">
        <span class="cerrar" onclick="document.getElementById('modal-participante').style.display='none'">&times;</span>
        <h2>Detalle del Participante</h2>
        <div id="detalle-participante"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // 4. Rellenar los datos del participante
  const detalleHTML = `
    <div><b>Fecha de Inscripción:</b> ${p.fechaInscripcion}</div>
    <div><b>Nombre completo:</b> ${p.nombre}</div>
    <div><b>Fecha de nacimiento:</b> ${p.fechaNacimiento}</div>
    <div><b>Cédula:</b> ${p.cedula}</div>
    <div><b>Ciudad:</b> ${p.ciudad}</div>
    <div><b>Empresa:</b> ${p.empresa}</div>
    <div><b>Cargo:</b> ${p.cargo}</div>
    <div><b>Colegio:</b> ${p.colegio}</div>
    <div><b>Asesor comercial:</b> ${p.asesor}</div>
    <div><b>Teléfono:</b> ${p.telefono}</div>
    <div><b>Correo electrónico:</b> ${p.correo}</div>
    <div><b>Confirmado:</b> ${p.confirmado ? "Sí" : "No"}</div>
  `;

  document.getElementById("detalle-participante").innerHTML = detalleHTML;
  modal.style.display = "block";
}

function escogerGanador() {
  const validados = listaParticipantes.filter(p => p.confirmado);
  if (validados.length === 0) {
    alert("No hay participantes validados para escoger un ganador.");
    return;
  }

  const btn = document.getElementById('btn-ganador');
  btn.innerHTML = '<span>⏳</span> Seleccionando...';
  btn.disabled = true;

  setTimeout(() => {
    const ganador = validados[Math.floor(Math.random() * validados.length)];

    // Crear estilos si no existen
    if (!document.getElementById("estilos-modal-ganador")) {
      const style = document.createElement("style");
      style.id = "estilos-modal-ganador";
      style.textContent = `
        .modal-ganador {
          display: flex;
          justify-content: center;
          align-items: center;
          position: fixed;
          top: 0; left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0,0,0,0.8);
          z-index: 1000;
        }
        .contenido-ganador {
          background: white;
          padding: 2.5rem;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 0 30px rgba(0,0,0,0.3);
          animation: zoomIn 0.5s ease;
        }
        .contenido-ganador h1 {
          font-size: 2.5rem;
          color: #2ecc71;
          margin-bottom: 1rem;
        }
        .contenido-ganador p {
          font-size: 1.2rem;
          margin: 0.5rem 0;
          color: #333;
        }
        .btn-cerrar-modal {
          margin-top: 1.5rem;
          padding: 0.7rem 1.5rem;
          background-color: #2ecc71;
          border: none;
          border-radius: 5px;
          color: white;
          font-size: 1rem;
          cursor: pointer;
        }
        @keyframes zoomIn {
          from { transform: scale(0.7); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    // Eliminar modal anterior si existe
    const modalExistente = document.getElementById("modal-ganador");
    if (modalExistente) modalExistente.remove();

    // Crear modal
    const modal = document.createElement("div");
    modal.className = "modal-ganador";
    modal.id = "modal-ganador";
    modal.innerHTML = `
      <div class="contenido-ganador">
        <h1>🎉 ¡Felicidades!</h1>
        <p><strong>Nombre:</strong> ${ganador.nombre}</p>
        <p><strong>Cédula:</strong> ${ganador.cedula}</p>
        <button class="btn-cerrar-modal" onclick="document.getElementById('modal-ganador').remove()">Cerrar</button>
      </div>
    `;

    document.body.appendChild(modal);

    // Restaurar botón
    btn.innerHTML = 'Escoger Ganador';
    btn.disabled = false;
  }, 1500);
}

window.addEventListener("DOMContentLoaded", () => {
  if (listaParticipantes.length === 0) {
    getlist();
  }
});


