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
    const availableFonts = await figma.listAvailableFontsAsync()
    for (let font of availableFonts) {
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

    return {mixFontGroups, mixFontCurrentGroup, mixFontRules, availableFonts, fontList}
}

initData().then(data => {
    figma.showUI(__html__, {width: 280, height:260})
    figma.ui.postMessage({
        type: 'initData',
        data: {
            mixFontGroups: data.mixFontGroups,
            mixFontCurrentGroup: data.mixFontCurrentGroup,
            mixFontRules: data.mixFontRules,
            fontList: data.fontList
        }
    })
    figma.ui.onmessage = pluginMessage => {
        // pluginMessage.data: {mixFontGroups, mixFontCurrentGroup, mixFontRules}
        if (pluginMessage.type === 'syncData') {
            const messageData = pluginMessage.data
            const tasks = Object.keys(messageData).map(key => figma.clientStorage.setAsync(key, messageData[key]))
            Promise.all(tasks)
            // console.log('save ' + Object.keys(messageData).join(','))

        }
        // pluginMessage.data: [{family, style}]
        if (pluginMessage.type === 'changeFont') {
            const fonts = pluginMessage.data
            const selectedTextLayers = figma.currentPage.selection.filter(layer => layer.type === 'TEXT');
            if (selectedTextLayers.length === 0) {
                figma.ui.postMessage({
                    type: 'showMessage',
                    data: 'Select at least 1 text layer.'
                })
            } else {
                // Change font
                const availableFonts = data.availableFonts
                let missedFonts = []
                fonts.forEach(font => {
                    if (!availableFonts.some(item => item.fontName.family === font.family && item.fontName.style === font.style)) {
                        missedFonts.push(`${font.family} ${font.style}`)
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
                            layer.setRangeFontName(0, text.length, fonts[1])
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
    }
})
