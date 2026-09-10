const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 80;
const uploadsDirectory = path.join(__dirname, 'uploads');
const metadataPath = path.join(uploadsDirectory, 'entregas.json');

fs.mkdirSync(uploadsDirectory, { recursive: true });

function slugify(name) {
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function readEntries() {
    try {
        return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    } catch {
        return [];
    }
}

function writeEntries(entries) {
    fs.writeFileSync(metadataPath, JSON.stringify(entries, null, 2));
}

const storage = multer.diskStorage({
    destination: uploadsDirectory,
    filename: (request, file, callback) => {
        const filename = `${slugify(request.body.studentName || '')}.html`;
        callback(null, filename);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (request, file, callback) => {
        const isHtml = path.extname(file.originalname).toLowerCase() === '.html';
        callback(isHtml ? null : new Error('Envie apenas arquivos com extensão .html.'), isHtml);
    }
});

app.use(express.static(__dirname, { index: 'index.html', dotfiles: 'deny' }));
app.use('/trabalhos', express.static(uploadsDirectory, { dotfiles: 'deny', index: false }));

app.get('/api/entregas', (request, response) => {
    const entries = readEntries().filter(entry => fs.existsSync(path.join(uploadsDirectory, entry.filename)));
    response.json(entries.sort((first, second) => second.submittedAt.localeCompare(first.submittedAt)));
});

app.post('/api/entregas', upload.single('activityFile'), (request, response) => {
    const studentName = (request.body.studentName || '').trim();
    const filename = `${slugify(studentName)}.html`;

    if (!studentName || !slugify(studentName)) {
        if (request.file) fs.unlinkSync(request.file.path);
        return response.status(400).json({ message: 'Informe o nome completo do aluno.' });
    }
    if (!request.file) return response.status(400).json({ message: 'Selecione o arquivo HTML da atividade.' });

    const html = fs.readFileSync(request.file.path, 'utf8').slice(0, 5000).toLowerCase();
    if (!html.includes('<html') && !html.includes('<!doctype html')) {
        fs.unlinkSync(request.file.path);
        return response.status(400).json({ message: 'O arquivo enviado não parece ser uma página HTML.' });
    }

    const entries = readEntries().filter(entry => entry.filename !== filename);
    const entry = { studentName, filename, submittedAt: new Date().toISOString() };
    entries.push(entry);
    writeEntries(entries);
    response.status(201).json({ message: 'Atividade enviada com sucesso.', entry });
});

app.use((error, request, response, next) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return response.status(400).json({ message: 'O arquivo deve ter no máximo 2 MB.' });
    }
    response.status(400).json({ message: error.message || 'Não foi possível enviar a atividade.' });
});

app.listen(port, () => console.log(`Portal disponível em http://localhost:${port}`));