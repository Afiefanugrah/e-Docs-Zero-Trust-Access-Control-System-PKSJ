import express, { Request, Response } from "express";

const PORT = process.env.PORT;

// Db connettion
import sequelize from "./config/db.config";
sequelize.authenticate().then(() => console.log("✅ Database Ready"));

// Middleware
const app = express();
app.use(express.json());

// Route Sederhana
app.get("/", (req: Request, res: Response) => {
  res.send("Halo dari Express + TypeScript! (test)");
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
