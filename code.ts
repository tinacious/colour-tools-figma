figma.showUI(__html__, { width: 660, height: 660 })

async function loadLocalStyles() {
  const styles = await figma.getLocalPaintStylesAsync()

  const colours: { hex: string, name: string }[] = []

  styles.forEach((style) => {
    style.paints.forEach((paint) => {
      if (paint.type === 'SOLID') {
        colours.push({
          name: style.name
            .replace(/\s/g, '_')
            .replace(/\//g, '__'),
          hex: figmaRGBToHex(paint.color),
        })
      }
    })
  })

  figma.ui.postMessage({
    type: 'local-styles',
    data: colours,
  })
}
loadLocalStyles()


figma.ui.onmessage = async (message) => {
  switch (message.type) {
    case 'export-palette':
      return exportStylesToColourPalette()
    case 'create-palette':
      return createColourPalette(message.data)
    case 'refresh-local-styles':
      return loadLocalStyles()
    default:
      console.log('Unsupported message', message)
  }

  figma.closePlugin()
}


type CreatePaletteRequest = {
  colourScheme: 'dark' | 'light'
  paletteName: string
  colours: {
    name: string
    hex: string
  }[]
}

async function createColourPalette(data: CreatePaletteRequest) {
  const { paletteName, colours } = data

  const frame = figma.createFrame()
  frame.resize(200, 200)

  frame.name = paletteName
  frame.layoutMode = 'HORIZONTAL'
  frame.layoutSizingHorizontal = 'HUG'

  const variableCollection = figma.variables.createVariableCollection(paletteName)

  const nodes: SceneNode[] = [];

  colours.forEach(async (colour) => {
    const { name, hex } = colour

    // Create the rectangle
    const swatch = figma.createRectangle()
    swatch.name = name
    swatch.resize(200, 200)
    swatch.fills = [
      {
        type: 'SOLID',
        color: hexToFigmaRGB(hex),
      }
    ]

    // Create styles
    const colourName = paletteName + '/' + name
    const solidPaint = figma.util.solidPaint(hexToFigmaRGB(hex), {
      color: hexToFigmaRGB(hex)
    })

    // Create colours
    const paintStyle = figma.createPaintStyle()
    paintStyle.name = colourName
    paintStyle.paints = [
      solidPaint
    ]
    const colourVariable = figma.variables.createVariable(
      colourName,
      variableCollection,
      'COLOR',
    )
    figma.variables.setBoundVariableForPaint(
      solidPaint,
      'color',
      colourVariable,
    )
    colourVariable.setValueForMode(variableCollection.modes[0].modeId, solidPaint.color)


    // Assign the style to the rectangle
    await swatch.setFillStyleIdAsync(paintStyle.id)

    frame.appendChild(swatch)
    nodes.push(swatch)
  })

  figma.viewport.scrollAndZoomIntoView(nodes)

  loadLocalStyles()
}

// This isn't used yet but can potentially be useful if we want a JSON format for sharing colours using import/export
async function exportStylesToColourPalette() {
  const styles = await figma.getLocalPaintStylesAsync();

  console.log('styles', styles)
}


// region Colour utils

const namesRGB = ['r', 'g', 'b']


function hexToFigmaRGB(color: string): RGB | RGBA {
  let opacity = ''

  color = color.toLowerCase()

  if (color[0] === '#') color = color.slice(1)
  if (color.length === 3) {
    color = color.replace(/(.)(.)(.)?/g, '$1$1$2$2$3$3')
  } else if (color.length === 8) {
    const arr = color.match(/(.{6})(.{2})/) || new Array(8)
    color = arr[1]
    opacity = arr[2]
  }

  const num = parseInt(color, 16)
  const rgb = [num >> 16, (num >> 8) & 255, num & 255]

  if (opacity) {
    rgb.push(parseInt(opacity, 16) / 255)
    return webRGBToFigmaRGB(rgb as webRGBA)
  } else {
    return webRGBToFigmaRGB(rgb as webRGB)
  }
}


type webRGB = [number, number, number]
type webRGBA = [number, number, number, number]

function webRGBToFigmaRGB(color: webRGBA): RGBA
function webRGBToFigmaRGB(color: webRGB): RGB
// @ts-expect-error Library code
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function webRGBToFigmaRGB(color): any {
  const rgb = {}

  namesRGB.forEach((e, i) => {
    // @ts-expect-error Library code
    rgb[e] = color[i] / 255
  })

  // @ts-expect-error Library code
  if (color[3] !== undefined) rgb['a'] = color[3]
  return rgb
}

function figmaRGBToHex(color: RGB | RGBA): string {
  let hex = '#'

  const rgb = figmaRGBToWebRGB(color) as webRGB | webRGBA
  hex += ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1)

  if (rgb[3] !== undefined) {
    const a = Math.round(rgb[3] * 255).toString(16)
    if (a.length == 1) {
      hex += '0' + a
    } else {
      if (a !== 'ff') hex += a
    }
  }
  return hex
}

function figmaRGBToWebRGB(color: RGBA): webRGBA
function figmaRGBToWebRGB(color: RGB): webRGB
// @ts-expect-error Library code
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function figmaRGBToWebRGB(color): any {
  const rgb = []

  namesRGB.forEach((e, i) => {
    rgb[i] = Math.round(color[e] * 255)
  })

  if (color['a'] !== undefined) rgb[3] = Math.round(color['a'] * 100) / 100
  return rgb
}


// endregion Colour utils
