/// <reference path="../node_modules/@figma/plugin-typings/index.d.ts" />


async function initData() {

    // await figma.clientStorage.setAsync('mixFontRules', null)
    // await figma.clientStorage.setAsync('mixFontCurrentGroup', null)

    // [{id:string, group:string, fonts:[FontName]
    // FontName {family:string, style:string}
    const mixFontRules = await figma.clientStorage.getAsync('mixFontRules') || []

    // [string]
    let mixFontGroups = [];
    if (mixFontRules.length > 0) {
        mixFontRules.forEach(item => {
            if (!mixFontGroups.includes(item.group)) {
                mixFontGroups.push(item.group)
            }
        })
    } else {
        mixFontGroups = ['Default']
    }

    const mixFontCurrentGroup = await figma.clientStorage.getAsync('mixFontCurrentGroup') || 'Default'

    // [{family:string, styles:[string]}]
    let fontList = []
    let fontNames = []
    let availableFontNames = [];
    const availableFonts = await figma.listAvailableFontsAsync()
    for (let font of availableFonts) {
        availableFontNames.push(font.fontName.family + ' ' + font.fontName.style)
        if (fontNames.includes(font.fontName.family)) {
            const index = fontNames.indexOf(font.fontName.family)
            fontList[index].styles.push(font.fontName.style)
        } else {
            fontNames.push(font.fontName.family)
            fontList.push({
                name: font.fontName.family,
                styles: [font.fontName.style]
            })
        }
    }

    return {mixFontGroups, mixFontCurrentGroup, mixFontRules, availableFontNames, fontList}
}

initData().then(data => {
    figma.showUI(__html__, {width: 300, height: 330})
    figma.ui.postMessage({
        type: 'initData',
        data: {
            /** @type {string[]} */
            mixFontGroups: data.mixFontGroups,
            /** @type {string} */
            mixFontCurrentGroup: data.mixFontCurrentGroup,
            /** @type {{id :string, group :string, fonts :FontName[]}[} */
            mixFontRules: data.mixFontRules,
            /** @type {{family :string, styles :string[]}[]} */
            fontList: data.fontList,
            /** @type {string} */
            characters: getCharactersFromSelection()
        }
    })

    figma.on('selectionchange', () => {
        figma.ui.postMessage({
            type: 'selectionchange',
            data: {
                characters: getCharactersFromSelection()
            }
        })
    })

    figma.ui.onmessage = pluginMessage => {
        // pluginMessage.data: {mixFontGroups, mixFontCurrentGroup, mixFontRules}
        if (pluginMessage.type === 'syncData') {
            const messageData = pluginMessage.data
            const tasks = Object.keys(messageData).map(key => figma.clientStorage.setAsync(key, messageData[key]))
            Promise.all(tasks)
        }

        // pluginMessage.data: {id, fonts: {family, style}[]}
        if (pluginMessage.type === 'changeFont') {
            const fonts = pluginMessage.data.fonts
            /** @type {TextNode[]} */
            const selectedTextLayers = figma.currentPage.selection.filter(layer => layer.type === 'TEXT')
            if (selectedTextLayers.length === 0) {
                figma.ui.postMessage({
                    type: 'showMessage',
                    data: 'Select at least 1 text layer.'
                })
            } else {
                // Change font
                let missedFonts = []
                fonts.forEach(font => {
                    const fullName = font.family + ' ' + font.style
                    if (!data.availableFontNames.includes(fullName)) {
                        missedFonts.push(fullName)
                    }
                })
                if (missedFonts.length > 0) {
                    figma.ui.postMessage({
                        type: 'showMessage',
                        data: missedFonts.join(', ') + ' is not install.'
                    })
                } else {
                    // https://en.wikipedia.org/wiki/Latin_script_in_Unicode
                    const regexLatin = /[\u0000-\u1EFF\u2070-\u218F\u2C60-\u2C7F\uA720–\uA7FF\uAB30–\uAB6F\uFB00–\uFB4F\uFF00–\uFFEF]+/g
                    Promise.all(fonts.map(font => figma.loadFontAsync(font))).then(() => {
                        selectedTextLayers.forEach(layer => {
                            const text = layer.characters
                            // Change CJK font
                            layer.fontName = fonts[1]
                            // Change Latin font
                            let match
                            while (match = regexLatin.exec(text)) {
                                layer.setRangeFontName(match.index, match.index + match[0].length, fonts[0])
                            }
                        })
                    })
                }
            }
        }

        // Characters Update
        if (pluginMessage.type === 'charactersUpdate') {
            const characters = pluginMessage.data.characters;
            /** @type {TextNode} */
            const selectedTextLayer = figma.currentPage.selection.filter(layer => layer.type === 'TEXT')[0]
            if (selectedTextLayer) {
                if (!selectedTextLayer.hasMissingFont) {
                    const fontName = selectedTextLayer.fontName
                    if (fontName === figma.mixed) {
                        Promise.all(getFontNamesFromTextNode(selectedTextLayer)
                            .map(font => figma.loadFontAsync(font)))
                            .then(() => {
                                selectedTextLayer.characters = characters
                            })
                    } else {
                        figma.loadFontAsync(fontName).then(() => {
                            selectedTextLayer.characters = characters
                        })
                    }
                } else {
                    figma.ui.postMessage({
                        type: 'showMessage',
                        data: 'Text layer has missing font.'
                    })
                }
            }
        }
    }
})

function getCharactersFromSelection() {
    /** @type {TextNode[]} */
    const selectedTextLayers = figma.currentPage.selection.filter(layer => layer.type === 'TEXT')
    if (selectedTextLayers.length === 1) {
        return selectedTextLayers[0].characters
    } else {
        return null
    }
}

function getFontNamesFromTextNode(node) {
    let fontNames = []
    let fontNamesString = []
    for (let i = 0; i < node.characters.length; i++) {
        let fontName = node.getRangeFontName(i, i + 1)
        if (!fontNamesString.includes(JSON.stringify(fontName))) {
            fontNames.push(fontName)
            fontNamesString.push(JSON.stringify(fontName))
        }
    }
    return fontNames
}

