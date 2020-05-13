import './ui.scss'

window.onmessage = (event) => {

    const pluginMessage = event.data.pluginMessage

    const textUpdate = document.getElementById('textUpdate')
    const elemGroup = document.getElementById('group')
    const elemRulesContainer = document.getElementById('rules')
    const elemList = document.getElementById('list')
    const elemForm = document.getElementById('form')
    const elemGroupTitle = document.getElementById('ruleGroup')
    const elemLatinTextFamily = document.getElementById('ruleLatinFontFamily')
    const elemLatinTextStyle = document.getElementById('ruleLatinFontStyle')
    const elemCJKTextFamily = document.getElementById('ruleCJKFontFamily')
    const elemCJKTextStyle = document.getElementById('ruleCJKFontStyle')
    const elemAddRule = document.getElementById('addRule')
    const elemCancelButton = document.getElementById('cancelButton')
    const currentEditedRuleId = document.getElementById('currentEditedRuleId')
    const elemSaveButton = document.getElementById('saveButton')
    const elemImport = document.getElementById('importRules')
    const elemExport = document.getElementById('exportRules')

    if (pluginMessage.type === 'initData') {
        let {
            /** @type {string[]} */
            mixFontGroups,
            /** @type {string} */
            mixFontCurrentGroup,
            /** @type {{id :string, group :string, fonts :FontName[]}[} */
            mixFontRules,
            /** @type {{family :string, styles :string[]}[]} */
            fontList,
            /** @type {string} */
            characters
        } = pluginMessage.data

        // console.log(mixFontRules)
        // console.log(ruleId)

        // Load rules
        reloadGroups()
        reloadRules()
    
        // Add rule from
        const fontFamilyNames = fontList.map(font => font.name)
        setOptionsToSelect(fontFamilyNames, elemLatinTextFamily)
        setOptionsToSelect(fontFamilyNames, elemCJKTextFamily)
        setOptionsToSelect(fontList[0].styles, elemLatinTextStyle)
        setOptionsToSelect(fontList[0].styles, elemCJKTextStyle)
        elemLatinTextFamily.onchange = function() {
            setOptionsToSelect(fontList[this.value].styles, elemLatinTextStyle)
        }
        elemCJKTextFamily.onchange = function() {
            setOptionsToSelect(fontList[this.value].styles, elemCJKTextStyle)
        }

        // Characters update
        textUpdate.value = characters || '';
        textUpdate.disabled = characters ? false : true
        textUpdate.focus()
        textUpdate.setSelectionRange(textUpdate.value.length, textUpdate.value.length)
        textUpdate.oninput = function() {
            const pluginMessage = {
                type: 'charactersUpdate',
                data: {
                    characters: this.value
                }
            }
            window.parent.postMessage({pluginMessage}, '*')
        };

        // Add rule
        elemAddRule.onclick = () => {
            elemList.style.left = '-100%'
            elemForm.style.left = '0'
            elemGroupTitle.value = mixFontCurrentGroup
        }

        // Group
        elemGroup.onchange = function() {
            mixFontCurrentGroup = this.value
            reloadGroups()
            reloadRules()
            const pluginMessage = {
                type: 'syncData',
                data: {mixFontCurrentGroup}
            }
            window.parent.postMessage({pluginMessage}, '*')
        }

        // Cancel
        elemCancelButton.onclick = () => {
            elemList.style.left = '0'
            elemForm.style.left = '100%'
        }

        // Save
        elemSaveButton.onclick = function() {
            const group = elemGroupTitle.value
            let fonts = []
            fonts.push({
                family: fontList[elemLatinTextFamily.value].name,
                style: fontList[elemLatinTextFamily.value].styles[elemLatinTextStyle.value]
            })
            fonts.push({
                family: fontList[elemCJKTextFamily.value].name,
                style: fontList[elemCJKTextFamily.value].styles[elemCJKTextStyle.value]
            })
            if (!mixFontGroups.includes(group)) {
                mixFontGroups.push(group)
            }
            mixFontGroups.sort()
            mixFontCurrentGroup = group
            
            if (currentEditedRuleId.value !== '') {
                const currentRuleIndex = mixFontRules.findIndex(rule => rule.id === currentEditedRuleId.value)
                mixFontRules[currentRuleIndex].group = group
                mixFontRules[currentRuleIndex].fonts = fonts
                currentEditedRuleId.value = ''
            } else {
                const id = generateHashID()
                mixFontRules.push({id, group, fonts})
            }

            elemList.style.left = '0'
            elemForm.style.left = '100%'

            // Reload mixFontRules list
            reloadGroups()
            reloadRules()

            // Send data to Figma
            const pluginMessage = {
                type: 'syncData',
                data: {mixFontGroups, mixFontCurrentGroup, mixFontRules}
            }
            window.parent.postMessage({pluginMessage}, '*')
        }

        // Import
        elemImport.onclick = () => {
            const fileInput = document.createElement('input')
            fileInput.type = 'file'
            fileInput.accept = '.json'
            fileInput.click()
            fileInput.onchange = () => {
                const file = fileInput.files[0]
                if (file.type === 'application/json') {
                    const reader = new FileReader()
                    reader.onload = () => {
                        const content = reader.result
                        try {
                            const mixFontRulesFromJSON = JSON.parse(content)
                            if (mixFontGroups.filter(item => item.group === mixFontCurrentGroup).length === 0) {
                                mixFontGroups.splice(mixFontGroups.indexOf(mixFontCurrentGroup), 1)
                            }
                            mixFontRulesFromJSON.forEach(rule => {
                                if (!mixFontGroups.includes(rule.group)) {
                                    mixFontGroups.push(rule.group)
                                }
                                if (rule.id) {
                                    for (let i = 0; i < mixFontRules.length; i++) {
                                        if (mixFontRules[i].id === rule.id) {
                                            mixFontRules.splice(i, 1)
                                        }
                                    }
                                } else {
                                    rule['id'] = generateHashID()
                                }
                                mixFontRules.push(rule)
                            })
                            mixFontGroups.sort()
                            mixFontCurrentGroup = mixFontGroups[0]
                            reloadGroups()
                            reloadRules()
                            const pluginMessage = {
                                type: 'syncData',
                                data: {mixFontGroups, mixFontCurrentGroup, mixFontRules}
                            }
                            window.parent.postMessage({pluginMessage}, '*')
                            toast(`Import ${mixFontRulesFromJSON.length} rule${mixFontRulesFromJSON.length > 1 ? 's' : ''}.`, false)
                        } catch (e) {
                            toast('Error: ' + e.message, true)
                        }
                    }
                    reader.readAsText(file)
                } else {
                    toast('No a JSON file.', true)
                }
            }
        }

        // Export
        elemExport.onclick = () => {
            if (mixFontRules.length === 0) {
                toast('No rule to export.')
            } else {
                const blob = new Blob(
                    [JSON.stringify(mixFontRules)],
                    {type: 'text/plain;charset=utf-8'}
                )
                const elemDownload = document.createElement('a')
                elemDownload.download = 'mixfonts.json'
                elemDownload.href = URL.createObjectURL(blob)
                elemDownload.click()
            }
        }

        function reloadGroups() {
            removeChildrenOfElement(elemGroup)
            mixFontGroups.forEach((item, index) => {
                const defaultSelected = (item === mixFontCurrentGroup) ? true : false
                const elemOption = new Option(item, item, defaultSelected)
                elemGroup.appendChild(elemOption)
                if (defaultSelected) {
                    elemGroup.selectedIndex = index
                }
            })
        }

        function reloadRules() {
            if (mixFontRules.length === 0) {
                removeChildrenOfElement(elemRulesContainer)
                const elemNotData = document.createElement('div')
                elemNotData.className = 'type type--11-pos empty'
                elemNotData.innerHTML = 'You don\'t have any mixfonts rule.<br/>' +
                    'Please click <svg width="11" height="11" viewBox="0 0 11 11"><path d="M5 5V0H6V5H11V6H6V11H5V6H0V5H5Z" fill-opacity="0.8"/></svg> icon to add one,<br/>' +
                    'or click <svg width="13px" height="14px" viewBox="0 0 13 14"><path d="M6,9.2929 L6,0 L7,0 L7,9.2929 L9.6464,6.6464 L10.3536,7.3536 L6.5,11.2071 L2.6464,7.3536 L3.3536,6.6464 L6,9.2929 Z M0,10 L1,10 L1,13 L12,13 L12,10 L13,10 L13,14 L0,14 L0,10 Z" fill-opacity="0.8"></path></svg> icon to import rules from JSON file.'
                elemRulesContainer.appendChild(elemNotData)
            } else {
                removeChildrenOfElement(elemRulesContainer)
                mixFontRules.filter(rule => {
                    return rule.group === mixFontCurrentGroup
                })
                .forEach(rule => {
                    const elemRule = createRuleBlock(rule)
                    elemRulesContainer.appendChild(elemRule)
                })

                // Remove
                const removeRuleButtons = elemRulesContainer.querySelectorAll('a.icon--remove')
                removeRuleButtons.forEach(button => {
                    button.onclick = function() {
                        const ruleBlock = this.parentNode
                        elemRulesContainer.removeChild(ruleBlock)
                        const ruleId = this.getAttribute('rule-id')
                        for (let i = 0; i < mixFontRules.length; i++) {
                            if (mixFontRules[i].id === ruleId) {
                                mixFontRules.splice(i, 1)
                            }
                        }
                        if (elemRulesContainer.children.length === 0) {
                            mixFontGroups.splice(mixFontGroups.indexOf(mixFontCurrentGroup), 1)
                            mixFontCurrentGroup = mixFontGroups[0] || 'Default'
                        }
                        const pluginMessage = {
                            type: 'syncData',
                            data: {mixFontGroups, mixFontCurrentGroup, mixFontRules}
                        }
                        window.parent.postMessage({pluginMessage}, '*')
                    }
                })

                // Edit
                const editRuleButtons = elemRulesContainer.querySelectorAll('a.icon--edit')
                editRuleButtons.forEach(button => {
                    button.onclick = function() {
                        const ruleId = this.getAttribute('rule-id')
                        const currentRule = mixFontRules.find(rule => rule.id === ruleId)
                        currentEditedRuleId.value = ruleId

                        elemList.style.left = '-100%'
                        elemForm.style.left = '0'
                        elemGroupTitle.value = mixFontCurrentGroup

                        elemLatinTextFamily.value = fontFamilyNames.indexOf(currentRule.fonts[0].family)
                        setOptionsToSelect(fontList[elemLatinTextFamily.value].styles, elemLatinTextStyle)
                        elemLatinTextStyle.value = fontList[elemLatinTextFamily.value].styles.indexOf(currentRule.fonts[0].style)
                        elemCJKTextFamily.value = fontFamilyNames.indexOf(currentRule.fonts[1].family)
                        setOptionsToSelect(fontList[elemCJKTextFamily.value].styles, elemCJKTextStyle)
                        elemCJKTextStyle .value = fontList[elemCJKTextFamily.value].styles.indexOf(currentRule.fonts[1].style)
                    }
                })
            }
        }

    }

    if (pluginMessage.type === 'showMessage') {
        toast(pluginMessage.data, true)
    }

    if (pluginMessage.type === 'selectionchange') {
        const characters = pluginMessage.data.characters
        textUpdate.value = characters || '';
        textUpdate.disabled = characters ? false : true
        textUpdate.focus()
        textUpdate.setSelectionRange(textUpdate.value.length, textUpdate.value.length)
    }

}

function createRuleBlock(rule) {
    const elemRule = document.createElement('div');
    elemRule.className = 'rule'
    elemRule.setAttribute('rule-id', rule.id)

    const elemRulePreview = document.createElement('div')
    elemRulePreview.className = 'rule__preview'
    const elemRuleThumb = document.createElement('div')
    elemRuleThumb.className = 'rule__thumb'

    const elemCJKText = document.createElement('span')
    elemCJKText.textContent = '漢字 かんじ 한자 '
    elemCJKText.style.fontFamily = rule.fonts[1].family
    applyFontStyleToElement(rule.fonts[1].style, elemCJKText)
    
    const elemLatinText = document.createElement('span')
    elemLatinText.textContent = 'Text'
    elemLatinText.style.fontFamily = rule.fonts[0].family
    applyFontStyleToElement(rule.fonts[0].style, elemLatinText)

    const elemRuleDesc = document.createElement('div')
    elemRuleDesc.className = 'rule__desc'
    elemRuleDesc.textContent = `${rule.fonts[0].family} ${rule.fonts[0].style}, ${rule.fonts[1].family} ${rule.fonts[1].style}`

    elemRuleThumb.appendChild(elemCJKText)
    elemRuleThumb.appendChild(elemLatinText)
    elemRulePreview.appendChild(elemRuleThumb)
    elemRulePreview.appendChild(elemRuleDesc)
    elemRule.appendChild(elemRulePreview)

    const elemRuleRemove = document.createElement('a')
    elemRuleRemove.className = 'icon icon--remove'
    elemRuleRemove.setAttribute('rule-id', rule.id)
    elemRuleRemove.title = 'Remove Rule'
    elemRule.appendChild(elemRuleRemove)

    const elemRuleEdit = document.createElement('a')
    elemRuleEdit.className = 'icon icon--edit'
    elemRuleEdit.setAttribute('rule-id', rule.id)
    elemRuleEdit.title = 'Edit Rule'
    elemRule.appendChild(elemRuleEdit)

    elemRulePreview.onclick = function() {
        const pluginMessage = {
            type: 'changeFont',
            data: {
                id: rule.id,
                fonts: rule.fonts
            }
        }
        window.parent.postMessage({pluginMessage}, '*')
    }

    return elemRule
}

function applyFontStyleToElement(fontStyle, elem) {
    if (/Italic$/i.test(fontStyle) || /Slanted$/i.test(fontStyle)) {
        elem.style.fontStyle = 'italic'
    }
    if (/Oblique$/i.test(fontStyle)) {
        elem.style.fontStyle = 'oblique'
    }
    if (/Condensed/i.test(fontStyle)) {
        elem.style.fontStretch = 'condensed'
    }
    fontStyle = fontStyle.replace(/\sItalic$/i, '')
    fontStyle = fontStyle.replace(/\sOblique$/i, '')
    fontStyle = fontStyle.replace(/\sSlanted$/i, '')
    fontStyle = fontStyle.replace(/\s?Condensed\s?/i, '')
    let value;
    switch (fontStyle) {
        case 'Thin':        value = 100; break
        case 'Hairline':    value = 100; break
        case 'ExtraLight':  value = 200; break
        case 'Extralight':  value = 200; break
        case 'Extra Light': value = 200; break
        case 'UltraLight':  value = 200; break
        case 'Ultralight':  value = 200; break
        case 'Ultra Light': value = 200; break
        case 'Light':       value = 300; break
        case 'Normal':      value = 400; break
        case 'Regular':     value = 400; break
        case 'Medium':      value = 500; break
        case 'SemiBold':    value = 600; break
        case 'Semibold':    value = 600; break
        case 'Semi Bold':   value = 600; break
        case 'DemiBold':    value = 600; break
        case 'Demibold':    value = 600; break
        case 'Demi Bold':   value = 600; break
        case 'Bold':        value = 700; break
        case 'ExtraBold':   value = 800; break
        case 'Extrabold':   value = 800; break
        case 'Extra Bold':  value = 800; break
        case 'UltraBold':   value = 800; break
        case 'Ultrabold':   value = 800; break
        case 'Ultra Bold':  value = 800; break
        case 'Black':       value = 900; break
        case 'Heavy':       value = 900; break
        default:            value = 400; break
    }
    elem.style.fontWeight = value
}

function setOptionsToSelect(options, select) {
    removeChildrenOfElement(select)
    options.forEach((option, index) => {
        const elemOption = new Option(option, index, index === 0 ? true : false)
        select.appendChild(elemOption)
    })
}

function removeChildrenOfElement(elem) {
    while (elem.firstChild) {
        elem.removeChild(elem.firstChild)
    }
}

function generateHashID() {
    return Number(new Date()).toString(16);
}

function toast(message, error) {
    const elemToast = document.createElement('div')
    elemToast.textContent = message
    elemToast.className = 'toast'
    if (error) {
        elemToast.className = 'toast toast--error'
    }
    document.body.appendChild(elemToast)
    const hideToast = () => {
        elemToast.style.opacity = 0
    }
    const removeToast = () => {
        document.body.removeChild(elemToast)
    } 
    setTimeout(hideToast, 1000)
    setTimeout(removeToast, 1200)
}
