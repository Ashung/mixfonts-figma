async function initData() {
    // [{id:string, group:string, font1:FontName, font2:FontName}]
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

    return {mixFontGroups, mixFontCurrentGroup, mixFontRules, fontList}
}

initData().then(data => {
    figma.showUI(__html__, {width: 280, height:260})
    figma.ui.postMessage({
        type: 'initData',
        data
    })
    figma.ui.onmessage = pluginMessage => {
        const data = pluginMessage.data
        if (pluginMessage.type === 'syncData') {
            // data: {mixFontGroups, mixFontCurrentGroup, mixFontRules}
            const tasks = Object.keys(data).map(key => figma.clientStorage.setAsync(key, data[key]))
            Promise.all(tasks).then(
                console.log('save ' + Object.keys(data).join(','))
            )
        }
        if (pluginMessage.type === 'changeFont') {
            console.log(data)
            let selectedTextLayers = figma.currentPage.selection.filter(layer => layer.type === 'TEXT');
            if (selectedTextLayers.length === 0) {
                figma.ui.postMessage({
                    type: 'showMessage',
                    data: 'Select at least 1 text layer.'
                })
            } else {
                
            }
        }
    }
})
