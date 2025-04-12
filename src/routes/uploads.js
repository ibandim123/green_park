"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Routes = void 0;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const csv_parse_1 = require("csv-parse");
const client_1 = require("@prisma/client");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const prisma = new client_1.PrismaClient();
const upload = (0, multer_1.default)({ dest: "uploads/" });
class Routes {
    constructor() {
        this.router = express_1.default.Router();
        this.routes();
    }
    routes() {
        this.router.post("/upload_csv", upload.single("file"), async (req, res) => {
            if (!req.file)
                return res.status(400).send("Nenhum arquivo enviado.");
            const bills = [];
            fs_1.default.createReadStream(req.file.path)
                .pipe((0, csv_parse_1.parse)({ columns: true, delimiter: ";", trim: true }))
                .on("data", (row) => {
                switch (row.id_lots) {
                    case "17":
                        row.id_lots = "3";
                        break;
                    case "18":
                        row.id_lots = "6";
                        break;
                    case "19":
                        row.id_lots = "7";
                        break;
                }
                console.log("registros:", row);
                bills.push({
                    client_name: row.client_name,
                    id_lots: parseInt(row.id_lots),
                    value: parseFloat(row.value),
                    typeable_line: row.typeable_line,
                    active: true,
                    created_at: new Date(),
                });
            })
                .on("end", async () => {
                try {
                    await prisma.bills.createMany({
                        data: bills,
                        skipDuplicates: true,
                    });
                    res.status(200).send("Dados importados com sucesso!");
                }
                catch (err) {
                    console.error("Erro ao salvar no banco:", err);
                    res.status(500).send("\n Erro ao importar dados. \n");
                }
                finally {
                    fs_1.default.unlinkSync(req.file.path);
                }
            });
        });
        this.router.post("/upload_pdf", upload.single("file"), async (req, res) => {
            if (!req.file)
                return res.status(400).send("Nenhum arquivo enviado.");
            const dataBuffer = fs_1.default.readFileSync(req.file.path);
            try {
                const data = await (0, pdf_parse_1.default)(dataBuffer);
                const fullText = data.text;
                const matches = [
                    ...fullText.matchAll(/Nome:\s*(.+?)\s+Valor:\s*R?\$?\s*([\d.,]+)/gi),
                ];
                const bills = matches.map(([, nome, valor]) => ({
                    client_name: nome.trim(),
                    id_lots: 3, // Deixei por enquanto, só a nível de demonstração
                    value: parseFloat(valor.replace(".", "").replace(",", ".")),
                    typeable_line: "000000000000000000",
                    active: true,
                    created_at: new Date(),
                }));
                console.log(bills);
                if (bills.length) {
                    await prisma.bills.createMany({
                        data: bills,
                        skipDuplicates: true,
                    });
                    res.status(200).send("PDF processado com sucesso!");
                }
                else {
                    res.status(400).send("Nenhum dado válido encontrado no PDF.");
                }
            }
            catch (err) {
                console.error("Erro ao processar PDF:", err);
                res.status(500).send("Erro ao processar o PDF.");
            }
            finally {
                fs_1.default.unlinkSync(req.file.path);
            }
        });
        this.router.get("/boletos", async (req, res) => {
            const { client_name, id_lots, value, active } = req.query;
            const where = {};
            if (client_name) {
                where.client_name = {
                    contains: String(client_name),
                    // mode: "insensitive",
                };
            }
            if (id_lots) {
                where.id_lots = Number(id_lots);
            }
            if (value) {
                where.value = Number(value);
            }
            if (active !== undefined) {
                where.active = active === "true";
            }
            try {
                const bills = await prisma.bills.findMany({
                    where,
                    orderBy: { created_at: "desc" },
                });
                res.status(200).json(bills);
            }
            catch (err) {
                console.error("Erro ao buscar boletos:", err);
                res.status(500).send("Erro ao buscar boletos");
            }
        });
        return this.router;
    }
}
exports.Routes = Routes;
exports.default = Routes;
