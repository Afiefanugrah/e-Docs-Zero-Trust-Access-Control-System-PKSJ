import express, { Request, Response } from "express";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Route Sederhana
app.get("/", (req: Request, res: Response) => {
  res.send("Halo dari Express + TypeScript! (test) ");
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
