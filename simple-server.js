const express = require('express');
const app = express();
const PORT = 5001;
app.get('/', (req, res) => res.send('Server is working!'));
app.listen(PORT, () => console.log(`Test server running on http://localhost:${PORT}`));
