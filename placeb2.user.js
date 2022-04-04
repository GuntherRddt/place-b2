// ==UserScript==
 // @name         r/place Belgium2 tile-placement automation tool
 // @namespace    http://tampermonkey.net/
 // @version      1.0.0
 // @description  place B2 tile-placement automation tool
 // @author       Jared/tjmora/Gunther
 // @match        https://hot-potato.reddit.com/embed*
 // @grant        GM_xmlhttpRequest
 // ==/UserScript==

 (function () {
    "use strict";

    async function runScript(theCanvas) {
        const placeApi = getPlaceApi(theCanvas);

        var template = [ // coordinates + color index
            [280, 710, 27],
            [281, 709, 27],
            [282, 709, 27],
            [283, 709, 27],
            [284, 710, 27],
            [284, 711, 27],
            [283, 712, 27],
            [282, 713, 27],
            [281, 714, 27],
            [280, 715, 27],
            [281, 715, 27],
            [282, 715, 27],
            [283, 715, 27],
            [284, 715, 27]
        ];

        let newDiv = document.createElement('div');
        newDiv.innerHTML = "B2 bot activated, placed pixels might not update on your canvas.";
        document.body.prepend(newDiv);
        newDiv.style.position = "absolute";
        newDiv.style.backgroundColor = "red";
        newDiv.style.width = "10%";
        newDiv.style.height = "10%";
        newDiv.style.color = "white";
        newDiv.style["z-index"] = "9999";


        console.log("Template: ", template);
        setTimeout(async () => {

            while(true) {
                // shuffle template, so placement is randomized (try to avoid concurrent placements with other users)
                shuffleArray(template);
                for (const target of template)
                {
                    //console.log("Checking target: ", target);
                    var x = target[0]
                    var y = target[1]
                    var color_idx = target[2]

                    var selectedPixel = placeApi.getPixel(x, y);
                    if (colorMap[selectedPixel] !== color_idx)
                    {
                        await placeApi.setPixel(x, y, color_idx);
                        console.log("set pixel", x, ",", y);
                        var random_delay = Math.random() * 18 + 1 // avoid bot detection?
                        await sleep((5 * 60 + random_delay) * 1000); // 5 minutes and [1;20] seconds
                        break;
                    }
                    else {
                        //console.log('skipping', x, y);
                        await sleep(150); // avoid high cpu when all pixels are correct
                    }
                }
            }
        }, 5000);
    }

    const colorMap = {
        "#BE039": 1, // dark red
        "#FF450": 2, // red
        "#FFA80": 3, // orange
        "#FFD635": 4, // yellow
        "#0A368": 6, // dark green
        "#0CC78": 7, // green
        "#7EED56": 8, // light green
        "#0756F": 9, // dark teal
        "#09EAA": 10, // teal
        "#2450A4": 12, // dark blue
        "#3690EA": 13, // blue
        "#51E9F4": 14, // light blue
        "#493AC1": 15, // indigo
        "#6A5CFF": 16, // periwinkle
        "#811E9F": 18, // dark purple
        "#B44AC0": 19, // purple
        "#FF3881": 22, // pink
        "#FF99AA": 23, // light pink
        "#6D482F": 24, // dark brown
        "#9C6926": 25, // brown
        "#000": 27, // black
        "#898D90": 29, // gray
        "#D4D7D9": 30, // light gray
        "#FFFFFF": 31, // white
    };

    const isReadyInterval = setInterval(() => {
        const theCanvas = document
            .querySelector("mona-lisa-embed")
            ?.shadowRoot?.querySelector("mona-lisa-camera")
            ?.querySelector("mona-lisa-canvas")
            ?.shadowRoot?.querySelector("canvas");

        if (theCanvas && document.querySelector("mona-lisa-embed")?.shadowRoot?.querySelector("mona-lisa-overlay")?.shadowRoot.children.length === 0) {
            clearInterval(isReadyInterval);
            runScript(theCanvas);
        }
    }, 500);

    function getPlaceApi(theCanvas) {
        const context = theCanvas.getContext("2d");

        return {
            getPixel: (x, y) => {
                const data = context.getImageData(x, y, 1, 1).data;
                return rgbToHex(data[0], data[1], data[2]);
            },
            setPixel: async (x, y, color) => {
                theCanvas.dispatchEvent(createEvent("click-canvas", { x, y }));
                await sleep(1000);
                theCanvas.dispatchEvent(
                    createEvent("select-color", { color: color })
                );
                await sleep(1000);
                theCanvas.dispatchEvent(createEvent("confirm-pixel"));
            },
        };
    }

    function createEvent(e, t) {
        return new CustomEvent(e, {
            composed: !0,
            bubbles: !0,
            cancelable: !0,
            detail: t,
        });
    }

    function sleep(ms) {
        //console.log("Sleep for ", ms);
        return new Promise((response) => setTimeout(response, ms));
    }

    function rgbToHex(r, g, b) {
        return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`.toUpperCase();
    }

    function shuffleArray(array) {
        // Randomize array in-place using Durstenfeld shuffle algorithm.
        for (var ii = array.length - 1; ii > 0; ii--) {
            var jj = Math.floor(Math.random() * (ii + 1));
            var temp = array[ii];
            array[ii] = array[jj];
            array[jj] = temp;
        }
    }


    function GM_fetch(url, opt){
        function blobTo(to, blob) {
            if (to == "arrayBuffer" && blob.arrayBuffer) return blob.arrayBuffer()
            return new Promise((resolve, reject) => {
                var fileReader = new FileReader()
                fileReader.onload = function (event) { if (to == "base64") resolve(event.target.result); else resolve(event.target.result) }
                if (to == "arrayBuffer") fileReader.readAsArrayBuffer(blob)
                else if (to == "base64") fileReader.readAsDataURL(blob) // "data:*/*;base64,......"
                else if (to == "text") fileReader.readAsText(blob, "utf-8")
                else reject("unknown to")
            })
        }
        return new Promise((resolve, reject)=>{
            // https://www.tampermonkey.net/documentation.php?ext=dhdg#GM_xmlhttpRequest
            opt = opt || {}
            opt.url = url
            opt.data = opt.body
            opt.responseType = "blob"
            opt.onload = (resp)=>{
                var blob = resp.response
                resp.blob = ()=>Promise.resolve(blob)
                resp.arrayBuffer = ()=>blobTo("arrayBuffer", blob)
                resp.text = ()=>blobTo("text", blob)
                resp.json = async ()=>JSON.parse(await blobTo("text", blob))
                resolve(resp)
            }
            opt.ontimeout = ()=>reject("fetch timeout")
            opt.onerror = ()=>reject("fetch error")
            opt.onabort = ()=>reject("fetch abort")
            GM_xmlhttpRequest(opt)
        })
    }

})();
