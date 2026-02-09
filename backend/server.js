const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const COMMENTS_FILE = path.join(__dirname, 'comments.json');

// Middleware
app.use(cors());
app.use(express.json());

// Función para leer comentarios
async function readComments() {
  try {
    const data = await fs.readFile(COMMENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Si el archivo no existe, devolver array vacío
    return [];
  }
}

// Función para guardar comentarios
async function saveComments(comments) {
  await fs.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 2), 'utf8');
}

// GET - Obtener todos los comentarios
app.get('/api/comments', async (req, res) => {
  try {
    const comments = await readComments();
    res.json(comments);
  } catch (error) {
    console.error('Error leyendo comentarios:', error);
    res.status(500).json({ error: 'Error al leer comentarios' });
  }
});

// POST - Añadir nuevo comentario
app.post('/api/comments', async (req, res) => {
  try {
    const { name, text } = req.body;
    
    if (!name || !text) {
      return res.status(400).json({ error: 'Nombre y texto son requeridos' });
    }

    const comments = await readComments();
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES') + ' ' + 
                    now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const newComment = {
      id: Date.now().toString(),
      name: name.trim(),
      text: text.trim(),
      date: dateStr
    };

    comments.unshift(newComment); // Añadir al principio
    await saveComments(comments);

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error guardando comentario:', error);
    res.status(500).json({ error: 'Error al guardar comentario' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

