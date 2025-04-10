import express from "express";
import uploadRoutes from "../src/routes/uploads";

const app = express();
app.use(express.json());

app.use("/api", uploadRoutes);

app.listen(3000, () => {
  console.log("🚀 Servidor rodando na porta 3000");
});
