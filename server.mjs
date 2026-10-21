import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static('.'));

// Convierte Markdown (**texto**) a HTML (<strong>texto</strong>) de forma segura
function formatearTextoAHTML(texto) {
    if (!texto) return '';
    return texto
        .replace(/\*\*(.*?)\*\`/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
}

// Extrae el elemento con mayor conteo de un objeto o arreglo de datos de forma segura
function obtenerMayor(datosObjeto) {
    if (!datosObjeto) return { nombre: 'General', cantidad: 0 };
    
    // Si viene como Array [{programa: 'Medicina', estudiantes: 100}]
    if (Array.isArray(datosObjeto)) {
        if (datosObjeto.length === 0) return { nombre: 'Sin datos', cantidad: 0 };
        const ordenado = [...datosObjeto].sort((a, b) => {
            const valA = a.estudiantes || a.cantidad || a.total || 0;
            const valB = b.estudiantes || b.cantidad || b.total || 0;
            return valB - valA;
        });
        const top = ordenado[0];
        const nombre = top.programa || top.sede || top.nombre || top.categoria || Object.values(top)[0];
        const cantidad = top.estudiantes || top.cantidad || top.total || Object.values(top)[1] || 0;
        return { nombre, cantidad };
    }
    
    // Si viene como Objeto {'Medicina': 100, 'Enfermería': 80}
    if (typeof datosObjeto === 'object') {
        const entradas = Object.entries(datosObjeto);
        if (entradas.length === 0) return { nombre: 'Sin datos', cantidad: 0 };
        const ordenado = entradas.sort((a, b) => Number(b[1]) - Number(a[1]));
        return { nombre: ordenado[0][0], cantidad: ordenado[0][1] };
    }

    return { nombre: 'General', cantidad: 0 };
}

// Generador local de análisis enriquecido y entendible
function generarAnalisisEnriquecido(datos) {
    const total = datos.totalEstudiantes || 0;
    const topPrograma = obtenerMayor(datos.programas);
    const topSede = obtenerMayor(datos.sedes);
    const topJornada = obtenerMayor(datos.jornadas);

    const pctPrograma = total > 0 && topPrograma.cantidad ? Math.round((topPrograma.cantidad / total) * 100) : null;
    const pctSede = total > 0 && topSede.cantidad ? Math.round((topSede.cantidad / total) * 100) : null;

    const textoPrograma = pctPrograma ? `con predominio en <strong>${topPrograma.nombre}</strong> (${pctPrograma}% de la cohorte seleccionada)` : 'con participación en las distintas ofertas académicas de salud';
    const textoSede = pctSede ? `registrando mayor densidad poblacional en la sede <strong>${topSede.nombre}</strong> (${pctSede}%)` : 'con presencia distribuida en las sedes universitarias';

    return `
        • <strong>Muestra Seleccionada:</strong> Se evalúa un total de <strong>${total.toLocaleString('es-CO')} estudiantes</strong> matriculados en la facultad de Ciencias de la Salud.<br><br>
        • <strong>Distribución Académica y Geográfica:</strong> Los datos indican una concentración relevante ${textoPrograma}, ${textoSede}. Esto refleja el comportamiento poblacional ante la demanda de los programas del área.<br><br>
        • <strong>Tendencia Operativa:</strong> La preferencia en jornada <strong>${topJornada.nombre}</strong> y la estabilidad socioeconómica de los grupos permiten planificar de forma óptima los laboratorios, salas de simulación clínica y convenios docencia-servicio.
    `.trim();
}

app.post('/api/interpretar', async (req, res) => {
    const datosResumen = req.body;

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("La GEMINI_API_KEY no está definida en el archivo .env");
        }

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
Actúa como un experto analista estadístico en educación superior de Ciencias de la Salud.
Realiza un análisis descriptivo conciso, claro y profesional de los siguientes datos filtrados (${datosResumen.totalEstudiantes} estudiantes):

DATOS:
- Total estudiantes: ${datosResumen.totalEstudiantes}
- Programas: ${JSON.stringify(datosResumen.programas)}
- Sedes: ${JSON.stringify(datosResumen.sedes)}
- Estratos: ${JSON.stringify(datosResumen.estratos)}
- Jornadas: ${JSON.stringify(datosResumen.jornadas)}
- Sexo: ${JSON.stringify(datosResumen.sexo)}
- Años: ${JSON.stringify(datosResumen.años)}

REGLAS DE FORMATO CRÍTICAS:
1. Responde en 3 viñetas utilizando la etiqueta <strong>Texto</strong> para resaltar conceptos importantes.
2. NUNCA utilices asteriscos (** ni *) en tu respuesta.
3. El lenguaje debe ser directo, claro, analítico y fácil de entender.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
        });

        const htmlLimpio = formatearTextoAHTML(response.text);
        res.json({ interpretacion: htmlLimpio });

    } catch (error) {
        console.warn("Usando generador local enriquecido:", error.message);
        const htmlLocal = generarAnalisisEnriquecido(datosResumen);
        res.json({ interpretacion: htmlLocal });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor activo en http://localhost:${PORT}`);
});