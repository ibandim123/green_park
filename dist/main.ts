import express from "express";
import Routes from "../src/routes/uploads";

const app = express();
const routes = new Routes();

app.use(express.json());
app.use("/api", routes.router);
app.listen(3000, () => {
  console.log("🚀 Servidor rodando na porta 3000");
});
