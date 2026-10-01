import * as cheerio from "cheerio";

class SegrepassParser {
   async parseTranscript(html) {
    const $ = cheerio.load(html);
    const rows = $("tbody tr");
    return rows
        .map((_, row) => {
            const cells = $(row).find("td");

            if (cells.length < 5) {
                return null;
            }

            const codice = $(cells[0]).text().trim();
            const insegnamento = $(cells[1]).text().trim();
            const votoRaw = $(cells[2]).text().trim();
            const cfuRaw = $(cells[3]).text().trim();
            const data = $(cells[4]).text().trim();

            const voto = Number.isNaN(Number(votoRaw))
                ? votoRaw
                : Number(votoRaw);

            const cfu = Number.isNaN(Number(cfuRaw))
                ? cfuRaw
                : Number(cfuRaw);

            return {
                codice,
                insegnamento,
                voto,
                cfu,
                data
            };
        })
        .get()
        .filter(Boolean);
}

    async parseStudyPlan(html) {
        const $ = cheerio.load(html);

        const rows = $("table#insegnamentoPadre tbody tr");

        return rows
            .map((_, row) => {
                const cells = $(row).find("td");

                if (cells.length < 8) {
                    return null;
                }

                const esito = $(cells[3]).text()?.trim();

                if (esito !== "Superato") {

                    const codice = $(cells[0]).text().trim();
                    const insegnamento = $(cells[1]).text().trim();
                    const annoCorso = $(cells[2]).text().trim();
                    const cfuRaw = $(cells[5]).text().trim();
                    const settore = $(cells[7]).text().trim();

                    const cfu = Number.isNaN(Number(cfuRaw))
                        ? cfuRaw
                        : Number(cfuRaw);

                    return {
                        codice,
                        insegnamento,
                        annoCorso,
                        cfu,
                        settore
                    };
                }

                return null;
            })
            .get()
            .filter(Boolean);
    }
    async parseStudentName(html) {
        const $ = cheerio.load(html);

        return $("p.navigationbar strong")
            .text()
            .replace(/\u00a0/g, " ")
            .replace(/^\s*Benvenuto\/a:\s*/i, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    async parseStudentId(html) {
        const $ = cheerio.load(html);
        const selectedOption = $("#carriera option:checked").first();
        const option = selectedOption.length
            ? selectedOption
            : $("#carriera option[selected]").first();

        return option.length ? option.text().trim() : null;
    }

    async parseDegreeCourse(html) {
        const $ = cheerio.load(html);
        let course = null;

        $("p.textcontent").each((_, paragraph) => {
            const text = $(paragraph)
                .text()
                .replace(/\u00a0/g, " ")
                .replace(/\s+/g, " ")
                .trim();
            const match = text.match(/\bCorso\s+di\s+laurea\s*:\s*(.+)$/i);

            if (match && match[1].trim()) {
                course = match[1].trim();
                return false;
            }
        });

        return course;
    }
            
    
    async parseStudentSummary(html) {
        const $ = cheerio.load(html);

        const texts = $("table.tabella td").map((_, td) => $(td).text().replace(/\u00a0/g, " ").trim()).get();
        
        const valueOf = (label) => {
            const i = texts.indexOf(label);
            return i === -1 ? null : texts[i + 1];
        };

    return [{
        creditiMaturati: valueOf("Crediti Maturati"),
        creditiMancanti: valueOf("Crediti Mancanti"),
        creditiTotali: valueOf("Crediti Totali"),
        esamiSostenuti: valueOf("Esami Sostenuti"),
        esamiInMedia: valueOf("Esami in Media"),
        mediaPonderataSu30: valueOf("Media Ponderata su 30"),
        mediaAritmeticaSu30: valueOf("Media Aritmetica su 30"),
        mediaPonderataSu110: valueOf("Media Ponderata su 110"),
        mediaAritmeticaSu110: valueOf("Media Aritmetica su 110"),
        numeroLodi: valueOf("Numero di Lodi"),
        },];
    }
}

export default new SegrepassParser();
