import express from "express";
import multer from "multer";
import fs from "fs";
import { parse } from "csv-parse";
import { PrismaClient } from "@prisma/client";
import pdf from "pdf-parse";

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ dest: "uploads/" });

router.post(
  "/upload_csv",
  upload.single("file"),
  async (req: any, res: any) => {
    if (!req.file) return res.status(400).send("Nenhum arquivo enviado.");

    const bills: any[] = [];

    fs.createReadStream(req.file.path)
      .pipe(parse({ columns: true, delimiter: ";", trim: true }))
      .on("data", (row: any) => {
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
        console.log("🔍 Linha lida do CSV:", row);
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
        } catch (err) {
          console.error("Erro ao salvar no banco:", err);
          res.status(500).send("\n Erro ao importar dados. \n");
        } finally {
          fs.unlinkSync(req.file.path);
        }
      });
  }
);

router.post(
  "/upload_pdf",
  upload.single("file"),
  async (req: any, res: any) => {
    if (!req.file) return res.status(400).send("Nenhum arquivo enviado.");

    const dataBuffer = fs.readFileSync(req.file.path);

    try {
      const data = await pdf(dataBuffer);
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
          data: bills as any[],
          skipDuplicates: true,
        });
        res.status(200).send("PDF processado com sucesso!");
      } else {
        res.status(400).send("Nenhum dado válido encontrado no PDF.");
      }
    } catch (err) {
      console.error("Erro ao processar PDF:", err);
      res.status(500).send("Erro ao processar o PDF.");
    } finally {
      fs.unlinkSync(req.file.path);
    }
  }
);

export default router;
