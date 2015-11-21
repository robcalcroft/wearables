import express from "express";
import five from "johnny-five";
import bp from "body-parser";
import request from "request";
import { Converter } from "csvtojson";

let board = new five.Board();

let converter = new Converter({
    noheader: true
});

let stocks = [
    "AAPL",
    "MSFT",
    "PLUS",
    "AIT",
    "AFT"
];

board.on("ready", () => {

    let lcd = new five.LCD({
        pins: [ 7, 8, 9, 10, 11, 12],
        backlight: 6,
        rows: 2,
        cols: 20
    });

    let app = express();

    let getStock;

    app.use(bp.json({ type: "application/json" }));

    app.post("/stock", (req, res) => {
        if(stocks.indexOf(req.body.stock) === -1) {
            stocks.push(req.body.stock);
        }
        res.end();
    });

    app.delete("/stock", (req, res) => {
        if(stocks.indexOf(req.body.stock) !== -1) {
            stocks.splice(stocks.indexOf(req.body.stock), 1);
        }
        res.end();
    });

    app.get("/startTicker", (req, res) => {
        getStock = setInterval(() => {
            request(`http://finance.yahoo.com/d/quotes.csv?s=${stocks.join("+")}&f=sp`, (err, res, body) => {
                if(err) {
                    return false;
                }
                parseCSV(body);
            });
        }, 10000);
        res.end();
    });

    app.get("/stopTicker", (req, res) => {
        clearInterval(getStock);
        lcd.clear();
        res.end();
    });

    function parseCSV(body) {
        let firstPass = body.split("\n");
        firstPass.pop();
        let n = firstPass.length - 1;
        let interval = setInterval(() => {
            if(n === 0) {
                clearInterval(interval);
                return false;
            }
            let secondPass = firstPass[n].split(",");
            let obj = {
                name: secondPass[0].replace(/\"/g, ""),
                current: secondPass[1]
            };
            lcd.clear()
                .cursor(0, 0)
                .print(`Stock -> ${obj.name}`)
                .cursor(1, 0).print(`Cur   -> ${obj.current}`);
            n--;
        }, (10000/firstPass.length));
    }

    app.listen(8000);

});
