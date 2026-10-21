Chart.register(ChartDataLabels);

// Total de estudiantes simulados
const TOTAL_ESTUDIANTES = 10000;

const PROGRAMAS = [
    "Medicina",
    "Enfermería",
    "Odontología",
    "Fisioterapia",
    "Bacteriología"
];

const SEDES = ["Cartagena", "Montería", "Bogotá"];
const ESTRATOS = [1, 2, 3, 4, 5, 6];
const SEXOS = ["Femenino", "Masculino"];
const AÑOS = [2024, 2025];
const JORNADAS = ["Diurna", "Nocturna"];

const COLORES = [
    "#E8A0B5",
    "#C5B2E8",
    "#B7D9C2",
    "#F4D78E",
    "#F4C5A8",
    "#D9C4D9"
];

let estudiantes = [];
const graficos = {};

function generarEstudiantes() {
    estudiantes = [];
    for (let i = 1; i <= TOTAL_ESTUDIANTES; i++) {
        estudiantes.push({
            id: i,
            programa: elegir(PROGRAMAS),
            sede: elegir(SEDES),
            estrato: elegir(ESTRATOS),
            sexo: elegir(SEXOS),
            año: elegir(AÑOS),
            jornada: elegir(JORNADAS)
        });
    }
}

function elegir(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
}

function obtenerMarcados(id) {
    return Array.from(
        document.querySelectorAll(`#${id} input:checked`)
    ).map(casilla => casilla.value);
}

function getFilters() {
    return {
        programas: obtenerMarcados("filtroProgramas"),
        sedes: obtenerMarcados("filtroSedes"),
        estratos: obtenerMarcados("filtroEstratos").map(Number),
        sexo: document.getElementById("sexo").value,
        año: document.getElementById("año").value,
        jornada: document.getElementById("jornada").value
    };
}

function filtered() {
    const f = getFilters();
    return estudiantes.filter(e =>
        (f.programas.length === 0 || f.programas.includes(e.programa)) &&
        (f.sedes.length === 0 || f.sedes.includes(e.sede)) &&
        (f.estratos.length === 0 || f.estratos.includes(e.estrato)) &&
        (f.sexo === "Todos" || e.sexo === f.sexo) &&
        (f.año === "Todos" || String(e.año) === f.año) &&
        (f.jornada === "Todos" || e.jornada === f.jornada)
    );
}

function contar(datos, propiedad, valores) {
    return valores.map(valor =>
        datos.filter(e => e[propiedad] === valor).length
    );
}

function porcentaje(cantidad, total) {
    return total ? (cantidad / total * 100) : 0;
}

function porcentajeTexto(cantidad, total) {
    return porcentaje(cantidad, total).toFixed(1) + "%";
}

// Configuración de ejes y Tooltips (Frecuencia Absoluta + Relativa)
function opcionesEjes(datosFiltrados, tipo = "cantidad") {
    const totalActual = datosFiltrados.length;

    return {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                top: 28
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: true,
                backgroundColor: "#2c222e",
                titleFont: { size: 13, weight: "bold" },
                bodyFont: { size: 12 },
                padding: 10,
                displayColors: false,
                callbacks: {
                    label: function(contexto) {
                        let valorNum = contexto.parsed.y ?? contexto.parsed;
                        let absVal, relVal;

                        if (tipo === "porcentaje") {
                            relVal = valorNum;
                            absVal = Math.round((valorNum / 100) * totalActual);
                        } else {
                            absVal = valorNum;
                            relVal = porcentaje(absVal, totalActual).toFixed(1);
                        }

                        const absFormatted = absVal.toLocaleString("es-CO");
                        return [
                            ` Frecuencia Absoluta: ${absFormatted} estudiantes`,
                            ` Frecuencia Relativa: ${relVal}%`
                        ];
                    }
                }
            },
            datalabels: {
                anchor: tipo === "porcentaje" ? "center" : "end",
                align: tipo === "porcentaje" ? "center" : "top",
                color: tipo === "porcentaje" ? "#ffffff" : "#665b69",
                font: {
                    weight: "bold",
                    size: 11
                },
                formatter: function(value) {
                    if (value === 0) return "";
                    return tipo === "porcentaje" ? value + "%" : value.toLocaleString("es-CO");
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Categorías",
                    color: "#766a79",
                    font: { weight: "bold" }
                },
                ticks: { color: "#766a79" },
                grid: { display: false }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: tipo === "porcentaje" ? "Porcentaje (%)" : "Número de estudiantes",
                    color: "#766a79",
                    font: { weight: "bold" }
                },
                ticks: {
                    color: "#766a79",
                    precision: tipo === "porcentaje" ? 1 : 0,
                    callback: valor => tipo === "porcentaje" ? valor + "%" : valor.toLocaleString("es-CO")
                },
                grid: { color: "#f0e9ef" }
            }
        }
    };
}

function crearGrafico(id, configuracion) {
    const canvas = document.getElementById(id);
    if (graficos[id]) {
        graficos[id].destroy();
    }
    graficos[id] = new Chart(canvas, configuracion);
}

function dibujarProgramas(datos) {
    const f = getFilters();
    const programasVisibles = f.programas.length > 0 ? f.programas : PROGRAMAS;
    const cantidades = programasVisibles.map(prog => datos.filter(e => e.programa === prog).length);

    crearGrafico("graficoProgramas", {
        type: "bar",
        data: {
            labels: programasVisibles,
            datasets: [{
                label: "Estudiantes",
                data: cantidades,
                backgroundColor: COLORES.slice(0, programasVisibles.length),
                borderRadius: 7,
                maxBarThickness: 48
            }]
        },
        options: opcionesEjes(datos, "cantidad")
    });
}

function dibujarSexo(datos) {
    const cantidades = contar(datos, "sexo", SEXOS);
    const datosPorcentaje = cantidades.map(cantidad =>
        Number(porcentaje(cantidad, datos.length).toFixed(1))
    );

    const opcionesSexo = opcionesEjes(datos, "porcentaje");
    delete opcionesSexo.scales;
    opcionesSexo.plugins.legend = {
        display: true,
        position: "bottom",
        labels: {
            color: "#665b69",
            usePointStyle: true,
            pointStyle: "circle",
            padding: 16,
            font: { size: 11 }
        }
    };

    crearGrafico("graficoSexo", {
        type: "doughnut",
        data: {
            labels: SEXOS,
            datasets: [{
                label: "Porcentaje de estudiantes",
                data: datosPorcentaje,
                backgroundColor: [COLORES[0], COLORES[1]],
                borderColor: "#ffffff",
                borderWidth: 4,
                hoverOffset: 7
            }]
        },
        options: opcionesSexo
    });
}

function dibujarSedes(datos) {
    const cantidades = contar(datos, "sede", SEDES);
    crearGrafico("graficoSedes", {
        type: "bar",
        data: {
            labels: SEDES,
            datasets: [{
                label: "Estudiantes",
                data: cantidades,
                backgroundColor: [COLORES[2], COLORES[1], COLORES[3]],
                borderRadius: 7,
                maxBarThickness: 55
            }]
        },
        options: opcionesEjes(datos, "cantidad")
    });
}

function dibujarEstratos(datos) {
    const cantidades = contar(datos, "estrato", ESTRATOS);
    crearGrafico("graficoEstratos", {
        type: "bar",
        data: {
            labels: ESTRATOS.map(n => "Estrato " + n),
            datasets: [{
                label: "Estudiantes",
                data: cantidades,
                backgroundColor: COLORES,
                borderRadius: 7,
                maxBarThickness: 42
            }]
        },
        options: opcionesEjes(datos, "cantidad")
    });
}

function dibujarJornada(datos) {
    const cantidades = contar(datos, "jornada", JORNADAS);
    crearGrafico("graficoJornada", {
        type: "bar",
        data: {
            labels: JORNADAS,
            datasets: [{
                label: "Estudiantes",
                data: cantidades,
                backgroundColor: [COLORES[4], COLORES[5]],
                borderRadius: 7,
                maxBarThickness: 55
            }]
        },
        options: opcionesEjes(datos, "cantidad")
    });
}

function dibujarAños(datos) {
    const cantidades = contar(datos, "año", AÑOS);
    crearGrafico("graficoAños", {
        type: "line",
        data: {
            labels: AÑOS.map(String),
            datasets: [{
                label: "Estudiantes por año",
                data: cantidades,
                borderColor: "#C18BA8",
                backgroundColor: "rgba(232, 160, 181, 0.25)",
                pointBackgroundColor: "#C18BA8",
                pointRadius: 5,
                fill: true,
                tension: 0.3
            }]
        },
        options: opcionesEjes(datos, "cantidad")
    });
}

function actualizarIndicadores(datos) {
    document.getElementById("totalEstudiantes").textContent =
        datos.length.toLocaleString("es-CO");

    document.getElementById("totalProgramas").textContent =
        new Set(datos.map(e => e.programa)).size;

    document.getElementById("totalSedes").textContent =
        new Set(datos.map(e => e.sede)).size;

    const diurna = datos.filter(e => e.jornada === "Diurna").length;
    const nocturna = datos.filter(e => e.jornada === "Nocturna").length;

    if (!datos.length) {
        document.getElementById("jornadaPrincipal").textContent = "-";
    } else if (diurna >= nocturna) {
        document.getElementById("jornadaPrincipal").textContent = "Diurna";
    } else {
        document.getElementById("jornadaPrincipal").textContent = "Nocturna";
    }
}

function actualizarTabla(datos) {
    const cuerpo = document.getElementById("tablaResultados");
    cuerpo.innerHTML = "";

    PROGRAMAS.forEach(programa => {
        const cantidad = datos.filter(e => e.programa === programa).length;
        const fila = document.createElement("tr");

        [
            programa,
            cantidad.toLocaleString("es-CO"),
            porcentajeTexto(cantidad, datos.length)
        ].forEach(texto => {
            const celda = document.createElement("td");
            celda.textContent = texto;
            fila.appendChild(celda);
        });

        cuerpo.appendChild(fila);
    });
}

function actualizarEstadoFiltros() {
    const f = getFilters();
    const partes = [];

    if (f.programas.length) partes.push(`${f.programas.length} programa(s)`);
    if (f.sedes.length) partes.push(`${f.sedes.length} sede(s)`);
    if (f.estratos.length) partes.push(`${f.estratos.length} estrato(s)`);
    if (f.sexo !== "Todos") partes.push(`Sexo: ${f.sexo}`);
    if (f.año !== "Todos") partes.push(`Año: ${f.año}`);
    if (f.jornada !== "Todos") partes.push(`Jornada: ${f.jornada}`);

    document.getElementById("estadoFiltros").textContent =
        partes.length ? partes.join(" · ") : "Todos los registros";
}

// Conexión con la API de IA (Backend Node.js con Gemini)
async function actualizarInterpretacion(datos) {
    const contenedor = document.getElementById("interpretacion");

    if (!datos.length) {
        contenedor.textContent = "No hay resultados para los filtros seleccionados.";
        return;
    }

    contenedor.innerHTML = "<p><i>✧ Generando interpretación comparativa con IA...</i></p>";

    const resumen = {
        totalEstudiantes: datos.length,
        programas: PROGRAMAS.map(p => ({ programa: p, cantidad: datos.filter(e => e.programa === p).length })),
        sedes: SEDES.map(s => ({ sede: s, cantidad: datos.filter(e => e.sede === s).length })),
        estratos: ESTRATOS.map(est => ({ estrato: est, cantidad: datos.filter(e => e.estrato === est).length })),
        jornadas: JORNADAS.map(j => ({ jornada: j, cantidad: datos.filter(e => e.jornada === j).length })),
        sexo: SEXOS.map(sx => ({ sexo: sx, cantidad: datos.filter(e => e.sexo === sx).length })),
        años: AÑOS.map(a => ({ año: a, cantidad: datos.filter(e => e.año === a).length }))
    };

    try {
        const respuesta = await fetch("http://localhost:3000/api/interpretar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resumen)
        });

        if (!respuesta.ok) throw new Error("Error en la respuesta del servidor");

        const data = await respuesta.json();
        contenedor.innerHTML = data.interpretacion.replace(/\n/g, "<br>");
    } catch (error) {
        console.error("Falló la IA, usando respaldo local:", error);
        contenedor.innerHTML = `<p>Análisis cuantitativo de ${datos.length.toLocaleString("es-CO")} estudiantes registrados.</p>`;
    }
}

function actualizarDashboard() {
    const datos = filtered();

    actualizarIndicadores(datos);
    actualizarTabla(datos);
    actualizarEstadoFiltros();
    actualizarInterpretacion(datos);

    dibujarProgramas(datos);
    dibujarSexo(datos);
    dibujarSedes(datos);
    dibujarEstratos(datos);
    dibujarJornada(datos);
    dibujarAños(datos);
}

function limpiarFiltros() {
    document.querySelectorAll(
        "#filtroProgramas input, #filtroSedes input, #filtroEstratos input"
    ).forEach(casilla => {
        casilla.checked = false;
    });

    document.getElementById("sexo").value = "Todos";
    document.getElementById("año").value = "Todos";
    document.getElementById("jornada").value = "Todos";

    actualizarDashboard();
}

function iniciarDashboard() {
    generarEstudiantes();

    document.querySelectorAll(
        "#filtroProgramas input, #filtroSedes input, #filtroEstratos input"
    ).forEach(casilla => {
        casilla.addEventListener("change", actualizarDashboard);
    });

    document.getElementById("sexo").addEventListener("change", actualizarDashboard);
    document.getElementById("año").addEventListener("change", actualizarDashboard);
    document.getElementById("jornada").addEventListener("change", actualizarDashboard);
    document.getElementById("btnLimpiar").addEventListener("click", limpiarFiltros);

    actualizarDashboard();
}

document.addEventListener("DOMContentLoaded", iniciarDashboard);