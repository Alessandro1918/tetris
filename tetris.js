// *********************
// ***** Constanst *****
// *********************

const SCREEN_WIDTH = 10
const SCREEN_LENGTH = 20

const white = "\x1b[0m"
const red = "\x1b[31m"
const green = "\x1b[32m"
const yellow = "\x1b[33m"
const blue = "\x1b[34m"
const colors = [white, red, green, yellow, blue]

//color: index of "colors" array
//coords: XY pair. [0, 0] is "top-left", [0, MAX] is "top-right", etc.
const pieces = [
  {color: 1, coords: [[0, 0], [0, 1], [0, 2], [1, 1]]},
  {color: 2, coords: [[0, 1], [0, 2], [1, 2], [1, 3]]},
  {color: 3, coords: [[2, 2], [2, 3]]},
  {color: 4, coords: [[3, 3], [3, 4]]}
]

//(Pieces are not selected at random; instead, they are picked from a complete set, one by one. 
//Once said set is empty, it's refilled with the original pieces available)
let remainingPieces = []
function resetRemaingPieces() {
  remainingPieces = [0, 1, 2, 3]
}
resetRemaingPieces()

let fallingPiece = {}

//Init screen
const screen = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
  [1, 1, 0, 2, 2, 3, 0, 4, 0, 0],
  [1, 1, 2, 2, 0, 3, 4, 4, 4, 0],
]
// const screen = []
// for (var j = 0; j < SCREEN_LENGTH; j++) {
//   const line = []
//   for (var i = 0; i < SCREEN_WIDTH; i++) {
//     const cell = 0
//     line.push(cell)
//   }
//   screen.push(line)
// }

// ******************************
// ***** Auxiliar functions *****
// ******************************

//Get a random integer between two values
//The maximum is exclusive and the minimum is inclusive
function getRandomInt() {
  min = 0
  max = pieces.length
  // return Math.floor(Math.random() * (max - min) + min)
  return 0
}

//Finds an array ([0, 0]) in a 2D array ([[0, 0], [1, 1]])
function isArrayIn2DArray(cell, array) {
  let isInArray = false
  array.forEach((e) => {
    if (
      e[0] === cell[0] &&
      e[1] === cell[1]
    ) {
      isInArray = true
    }
  })
  return isInArray
}

//Check if piece can move 1 row down
function isSpaceAvailable(array) {
  let isAvailable = true
  array.forEach((e) => {
    if (screen[e[0]][e[1]]) {
      isAvailable = false
    }
  })
  return isAvailable
}

// **************************
// ***** Game functions *****
// **************************

//Print the board, cell by cell.
function printBoard() {
  process.stdout.moveCursor(0, -SCREEN_LENGTH)    //moves cursor up "n" lines
  process.stdout.clearLine(1)                     //clear from cursor to end
  for (var j = 0; j < SCREEN_LENGTH; j++) {
    for (var i = 0; i < SCREEN_WIDTH; i++) {
      if (screen[j][i]) {
        process.stdout.write(colors[screen[j][i]] + "██" + white)
      } else {
        process.stdout.write("--")
      }
    }
    process.stdout.write("\n")
  }
}

//Print a new piece on the board
function spawn() {

  //Sort a new piece from the pool of remaining pieces
  let pieceColor = 9   // a color that doesn't exist
  while (remainingPieces.indexOf(pieceColor) < 0) {
    pieceColor = getRandomInt()
  }
  fallingPiece = pieces[pieceColor]

  //Remove piece from the pool of remaining pieces
  const filtered = remainingPieces.filter(e => e != pieceColor)
  remainingPieces = [...filtered]
  if (remainingPieces.length == 0) {
    resetRemaingPieces()
  }

  //For each cell of the piece, add it on the screen
  fallingPiece.coords.forEach((e, i) => {
    const line = e[0]
    const row = e[1]
    screen[line][row] = fallingPiece.color
  })

  printBoard()
}

//Move the failingPiece 1 row down, if space is available
function gravity() {

  //Get every cell below each failingPiece cell, not counting cells from the bottom row of failingPiece
  const cells = []
  fallingPiece.coords.forEach((e, i) => {
    const cell = [e[0]+1, e[1]]
    if (!isArrayIn2DArray(cell, fallingPiece.coords)) {
      cells.push(cell)
    }
  })

  if (!isSpaceAvailable(cells)) return

  //Save fallingPiece new coords to aux array
  const newCoords = []
  fallingPiece.coords.forEach((e, i) => {
    const newCoord = [e[0]+1, e[1]]
    newCoords.push(newCoord)
  })

  //Clear old coords
  fallingPiece.coords.forEach((e, i) => {
    screen[e[0]][e[1]] = 0
  })

  //Update fallingPiece
  fallingPiece.coords = [...newCoords]
  fallingPiece.coords.forEach((e, i) => {
    screen[e[0]][e[1]] = fallingPiece.color
  })
}

printBoard()

spawn()

const timer = setInterval(() => {

  gravity()
  
  printBoard()

}, 1000)