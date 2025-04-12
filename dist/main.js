"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uploads_1 = __importDefault(require("../src/routes/uploads"));
const app = (0, express_1.default)();
const routes = new uploads_1.default();
app.use(express_1.default.json());
app.use("/api", routes.router);
app.listen(3000, () => {
    console.log("🚀 Servidor rodando na porta 3000");
});
