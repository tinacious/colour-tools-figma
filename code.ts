
figma.showUI(__html__, { width: 600, height: 460 })


figma.ui.onmessage = async (message) => {
  switch (message.type) {
    case 'export-palette':
      return exportStylesToColourPalette()
    case 'create-palette':
      return createColourPalette(message.data)
    case 'graph':
      return createGraphWithNumbers(message.data)
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
  console.log('createColourPalette', 'data', data)

  const { paletteName, colours } = data

  const frame = figma.createFrame()
  frame.resize(200, 200)

  frame.name = paletteName
  // frame.fills = [
  //   {
  //     type: 'SOLID',
  //     color: colourScheme === 'dark' ? hexToFigmaRGB('#000000') : hexToFigmaRGB('#FFFFFF')
  //   }
  // ]
  frame.layoutMode = 'HORIZONTAL'
  frame.layoutSizingHorizontal = 'HUG'

  const nodes: SceneNode[] = [];
  // for (let i = 0; i < numberOfRectangles; i++) {
  //   const rect = figma.createRectangle();
  //   rect.x = i * 150;
  //   rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }];
  //   figma.currentPage.appendChild(rect);
  //   nodes.push(rect);
  // }
  // figma.currentPage.selection = nodes;
  // figma.viewport.scrollAndZoomIntoView(nodes);



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
    const paintStyle = figma.createPaintStyle()
    paintStyle.name = paletteName + '/' + name
    paintStyle.paints = [
      {
        type: 'SOLID',
        color: hexToFigmaRGB(hex),
      }
    ]

    // Assign the style to the rectangle
    await swatch.setFillStyleIdAsync(paintStyle.id)

    frame.appendChild(swatch)
    nodes.push(swatch)
  })

  figma.viewport.scrollAndZoomIntoView(nodes)
}

async function exportStylesToColourPalette() {
  const styles = await figma.getLocalPaintStylesAsync();

  console.log('styles', styles)
}

async function createGraphWithNumbers(numbers: number[]) {
  // Inter Regular is the font that objects will be created with by default in
  // Figma. We need to wait for fonts to load before creating text using them.
  await figma.loadFontAsync({ family: "Inter", style: "Regular" })

  const frameWidth = 800
  const frameHeight = 600
  const chartX = 25
  const chartY = 50
  const chartWidth = frameWidth - 50
  const chartHeight = frameHeight - 50

  const frame = figma.createFrame()
  frame.resizeWithoutConstraints(frameWidth, frameHeight)

  // Center the frame in our current viewport so we can see it.
  frame.x = figma.viewport.center.x - frameWidth / 2
  frame.y = figma.viewport.center.y - frameHeight / 2

  // Border for the chart
  const border = figma.createRectangle()
  frame.appendChild(border)
  border.resizeWithoutConstraints(frameWidth, frameHeight)
  border.strokeAlign = 'INSIDE'
  border.strokeWeight = 3
  border.fills = []
  border.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]
  border.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' }

  // Line at the bottom of the chart
  const line = figma.createRectangle()
  frame.appendChild(line)
  line.x = chartX
  line.y = chartY + chartHeight
  line.resizeWithoutConstraints(chartWidth, 3)
  line.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]
  line.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' }

  const min = numbers.reduce((a, b) => Math.min(a, b), 0)
  const max = numbers.reduce((a, b) => Math.max(a, b), 0)

  for (let i = 0; i < numbers.length; i++) {
    const num = numbers[i];
    const left = chartX + chartWidth * (i + 0.25) / numbers.length;
    const right = chartX + chartWidth * (i + 0.75) / numbers.length;
    const top = chartY + chartHeight - chartHeight * (Math.max(0, num) - min) / (max - min);
    const bottom = chartY + chartHeight - chartHeight * (Math.min(0, num) - min) / (max - min);

    // The column
    const column = figma.createRectangle()
    frame.appendChild(column)
    column.x = left
    column.y = top
    column.resizeWithoutConstraints(right - left, bottom - top)
    column.fills = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }]
    column.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' }

    // The label
    const label = figma.createText()
    frame.appendChild(label)
    label.x = left - 50
    label.y = top - 50
    label.resizeWithoutConstraints(right - left + 100, 50)
    label.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]
    label.characters = num.toString()
    label.fontSize = 30
    label.textAlignHorizontal = 'CENTER'
    label.textAlignVertical = 'BOTTOM'
    label.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' }
  }
}

// Make sure to close the plugin when you're done. Otherwise the plugin will
// keep running, which shows the cancel button at the bottom of the screen.
// figma.closePlugin();


function createRectanglesExample() {
  // This plugin creates 5 rectangles on the screen.
  const numberOfRectangles = 5

  // This file holds the main code for plugins. Code in this file has access to
  // the *figma document* via the figma global object.
  // You can access browser APIs in the <script> tag inside "ui.html" which has a
  // full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

  const nodes: SceneNode[] = [];
  for (let i = 0; i < numberOfRectangles; i++) {
    const rect = figma.createRectangle();
    rect.x = i * 150;
    rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }];
    figma.currentPage.appendChild(rect);
    nodes.push(rect);
  }
  figma.currentPage.selection = nodes;
  figma.viewport.scrollAndZoomIntoView(nodes);
}

const themes = {
  tinacious: {
    name: "Tinacious Design",
    colours: [
      {
        name: "pink",
        colour: "#ff3399"
      },
      {
        name: "blue",
        colour: "#33d5ff"
      },
      {
        name: "grey",
        colour: "#b3b3d4"
      },
      {
        name: "green",
        colour: "#00d364"
      },
      {
        name: "purple",
        colour: "#cc66ff"
      },
      {
        name: "yellow",
        colour: "#ffcc66"
      },
      {
        name: "turquoise",
        colour: "#00ced1"
      },
      {
        name: "midnight-sky",
        colour: "#1d1d26"
      },
      {
        name: "overcast-sky",
        colour: "#c8c8d5"
      },
      {
        name: "tangerine",
        colour: "#ffaa00"
      },
      {
        name: "red",
        colour: "#f10f69"
      }
    ]
  }
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
function webRGBToFigmaRGB(color): any {
  const rgb = {}

  namesRGB.forEach((e, i) => {
    rgb[e] = color[i] / 255
  })

  if (color[3] !== undefined) rgb['a'] = color[3]
  return rgb
}


// endregion Colour utils