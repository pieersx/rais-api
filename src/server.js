import 'dotenv/config';
import { app } from './app.js';

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`[RAIS-API] Servidor OAI-PMH corriendo en http://localhost:${PORT}`);
  console.log(`[RAIS-API] Endpoint: http://localhost:${PORT}/api/oai?verb=Identify`);
});
