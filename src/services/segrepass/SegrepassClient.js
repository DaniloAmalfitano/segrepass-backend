import { CookieJar } from "tough-cookie";
import { Agent } from "undici";
import * as cheerio from "cheerio";

const BASE_URL = "https://www.segrepass1.unina.it";

const TIMEOUT_MS = 60000;

const insecureDispatcher = new Agent({
    connect: {
        rejectUnauthorized: false
    }
});

class SegrepassClient {

    createSession() {
        return {
            jar: new CookieJar()
        };
    }
   async get(session, url, options = {}) {
    const cookieHeader =await session.jar.getCookieString(url);
    const response =await fetch(url,{
                headers: {
                    Cookie: cookieHeader
                },

                dispatcher:
                    insecureDispatcher,

                redirect:
                    options.redirect ?? "follow",

                signal:
                    AbortSignal.timeout(
                        TIMEOUT_MS
                    )
            }
        );
    const setCookies =response.headers.getSetCookie();
    for (const setCookie of setCookies) {
        await session.jar.setCookie(
            setCookie,
            url
        );
    }
        return response;
    }
    async login(session, username, password) {
        const loginPageResponse =await this.get(session, `${BASE_URL}/identificazione.do`);

        if (!loginPageResponse.ok) {
            throw new Error(
                `Errore apertura login: HTTP ${loginPageResponse.status}`
            );
        }
        const loginPageHtml =await loginPageResponse.text();

        const $ =cheerio.load(loginPageHtml);

        const setCookies =loginPageResponse.headers.getSetCookie();
        for (const setCookie of setCookies) {
            await session.jar.setCookie(
                setCookie,
                BASE_URL
            );
        }
        const form =$("#formCredenzialiIstituzionali");

        if (!form.length) {
            throw new Error(
                "Form di login non trovato"
            );
        }

        const formAction =form.attr("action");

        if (!formAction) {
            throw new Error(
                "Action del form di login non trovata"
            );
        }

        const fname =form.find('input[name="fname"]').attr("value");

        const answer =form.find('input[name="answer"]').attr("value");

        const formData =new URLSearchParams();

        formData.set("fname",fname);

        formData.set("answer", answer);

        formData.set("codice_fiscale",username);

        formData.set("password",password);

        const cookieHeader =await session.jar.getCookieString(BASE_URL);

        const loginResponse =await fetch(new URL(formAction,BASE_URL),{
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded",

                        Cookie:
                            cookieHeader,

                        Origin:
                            BASE_URL,

                        Referer:
                            `${BASE_URL}/identificazione.do`,

                        "User-Agent":
                            "Mozilla/5.0"
                    },

                    body:
                        formData,

                    dispatcher:
                        insecureDispatcher,

                    redirect:
                        "manual",

                    signal:
                        AbortSignal.timeout(
                            TIMEOUT_MS
                        )
                }
            );

        const loginHtml =await loginResponse.text();

        const $login =cheerio.load(loginHtml);

        const title =$login("title").text().trim();

        const loginSucceeded =title.includes("Menu Utente");

        if (!loginSucceeded) {
            throw new Error(
                "Login Segrepass fallito"
            );
        }

        const loginSetCookies = loginResponse.headers.getSetCookie();
        for (const setCookie of loginSetCookies){
            await session.jar.setCookie(setCookie,BASE_URL);
        }

        const dispatchResponse =await this.get(session,`${BASE_URL}/dispatch.do?dove=LinkEsis`,{
            redirect: "manual"
        });

        if (dispatchResponse.status !== 302){
            throw new Error(
                `Accesso a ESIS fallito: HTTP ${dispatchResponse.status}`
            );
        }
        const location =dispatchResponse.headers.get("location");

        if (!location) {
            throw new Error(
                "Redirect verso ESIS non trovato"
            );
        }
        const esisUrl =new URL(location,BASE_URL).href;
        const esisResponse =await this.get(session,esisUrl);

        if (!esisResponse.ok) {
            throw new Error(`Accesso a ESIS fallito: HTTP ${esisResponse.status}`);
        }

        const dispatchSetCookies =dispatchResponse.headers.getSetCookie();
            for (const setCookie of dispatchSetCookies){
                await session.jar.setCookie(setCookie,BASE_URL);
            }
            return {
                esisUrl: new URL(location,BASE_URL).href
            };
        }

        async getTranscript(session) {
            const url =`${BASE_URL}/esis/caricaMenu.do?azione=esamiSostenuti&currentParent=link_1`;

            const response =await this.get(session,url);

            if (!response.ok) {
                throw new Error(`Errore recupero libretto: HTTP ${response.status}`);
            }
            return await response.text();
        }

    async getStudyPlan(session) {

        const url =`${BASE_URL}/esis/caricaMenu.do?azione=pianiStudio&currentParent=link_1`;

        const response =await this.get(session,url)

        if (!response.ok) {
            throw new Error(`Errore recupero piano di studi: HTTP ${response.status}`);
        }
        return await response.text();
    }
    
async getStudentSummary(session) {

    const url =`${BASE_URL}/esis/caricaMenu.do?azione=riepilogoEsamiCrediti`;
    const pageResponse =await this.get(session,url);

    if (!pageResponse.ok) {
        throw new Error(`Errore apertura riepilogo: HTTP ${pageResponse.status}`);
    }

    const pageHtml =await pageResponse.text();
    const $ = cheerio.load(pageHtml);
    const form =$("#riepilogoEsamiCrediti");
    const formAction =form.attr("action");
    const dataCalcolo =form.find('input[name="dataCalcolo"]').attr("value");
    const formData =new URLSearchParams();

    formData.set("dataCalcolo",dataCalcolo);
    formData.set("buttonAction","Calcola");

    const cookieHeader =await session.jar.getCookieString(`${BASE_URL}/esis/`);

    const response =await fetch(new URL(formAction,BASE_URL),{
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded",

                    Cookie:
                        cookieHeader,

                    Origin:
                        BASE_URL,

                    Referer:
                        url,

                    "User-Agent":
                        "Mozilla/5.0"
                },

                body:
                    formData,

                dispatcher:
                    insecureDispatcher,

                redirect:
                    "follow",

                signal:
                    AbortSignal.timeout(
                        TIMEOUT_MS
                    )
            }
        );

    if (!response.ok) {
        throw new Error(`Errore calcolo riepilogo: HTTP ${response.status}`);
    }
    const setCookies =response.headers.getSetCookie();

    for (const setCookie of setCookies) {
        await session.jar.setCookie(setCookie,`${BASE_URL}/esis/`);
    }
    return await response.text();
    }
}

export default new SegrepassClient();