const express = require('express');
const app = express();

try {
  app.get('/*splat', (req, res) => {
    res.send('ok');
  });
  console.log('Express 5 accepts /*splat without error.');
} catch (err) {
  console.error('Express 5 throws an error on /*splat:', err.message);
}
