// *********************
// ***** Constanst *****
// *********************

const SCREEN_WIDTH = 10     //number of collumns
const SCREEN_LENGTH = 20    //number of rows
const SPAWN_ZONE_LENGTH = 2 //how many rows of the already defined screen will be used to spawn pieces

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
  {color: 3, coords: [[1, 2], [1, 3]]},
  {color: 4, coords: [[1, 3], [1, 4]]}
]

//Pieces are not selected at random; instead, they are picked from a complete set, one by one. 
//Once said set is empty, it's refilled with the original pieces available
let remainingPieces = []
function resetRemaingPieces() {
  remainingPieces = [0, 1, 2, 3]
}
resetRemaingPieces()

let fallingPiece = {
  color: 0, 
  coords: []
}

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
//   const row = []
//   for (var i = 0; i < SCREEN_WIDTH; i++) {
//     const cell = 0
//     row.push(cell)
//   }
//   screen.push(row)
// }

// ******************************
// ***** Auxiliar functions *****
// ******************************

//Get a random integer between two values
//The maximum is exclusive and the minimum is inclusive
function getRandomInt() {
  min = 0
  max = pieces.length
  return Math.floor(Math.random() * (max - min) + min)
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
function isSpaceAvailable(piece) {

  //Get every cell below each failingPiece cell, not counting cells from the bottom row of failingPiece
  const cells = []
  piece.coords.forEach(e => {
    const cell = [e[0]+1, e[1]]
    if (!isArrayIn2DArray(cell, piece.coords)) {
      cells.push(cell)
    }
  })

  //If even a single cell is not empty, piece can't move down
  let isAvailable = true
  cells.forEach((e) => {
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
  //moves cursor up "n" lines:
  process.stdout.moveCursor(0, -SCREEN_LENGTH)                    //debug: print SPAWN_ZONE_LENGTH rows
  // process.stdout.moveCursor(0, -(SCREEN_LENGTH-SPAWN_ZONE_LENGTH))   //prod: don't print it
  process.stdout.clearLine(1)                                        //clear from cursor to end
  
  //i: row counter
  //j: collumn counter
  for (var i = 0; i < SCREEN_LENGTH; i++) {                       //debug      
  // for (var i = SPAWN_ZONE_LENGTH; i < SCREEN_LENGTH; i++) {          //prod
    for (var j = 0; j < SCREEN_WIDTH; j++) {      
      if (i < SPAWN_ZONE_LENGTH) {
        if (screen[i][j]) {
          process.stdout.write(colors[screen[i][j]] + "██" + white)
        } else {
          process.stdout.write("--")
        }
      } else {
        if (screen[i][j]) {
          process.stdout.write(colors[screen[i][j]] + "██" + white)
        } else {
          process.stdout.write("[]")
        }
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
  // fallingPiece = pieces[pieceColor]        //shallow copy
  fallingPiece = {...pieces[pieceColor]}      //deep copy

  //Remove piece from the pool of remaining pieces
  const filtered = remainingPieces.filter(e => e != pieceColor)
  remainingPieces = [...filtered]
  if (remainingPieces.length == 0) {
    resetRemaingPieces()
  }

  //For each cell of the piece, add it on the screen
  fallingPiece.coords.forEach(e => {
    screen[e[0]][e[1]] = fallingPiece.color
  })

  //Check if piece can be moved down, or is game over
  if (!isSpaceAvailable(fallingPiece)) {
    clearInterval(timer)
  }

  printBoard()
}

//Check if bottom line of SPAWN_ZONE_LENGTH is not empty
//(It will trigger a false positive while piece is still falling to open space; don't check this value immediately after piece move one row down)
function isGameOver() {
  let isOver = false
    for (var j = 0; j < SCREEN_WIDTH; j++) {      //j: collumn counter
      if (screen[SPAWN_ZONE_LENGTH-1][j]) {
        isOver = true
      }
    }
  return isOver
}

//Move the failingPiece 1 row down
function gravity() {

  //Save fallingPiece new coords to aux array
  const newCoords = []
  fallingPiece.coords.forEach(e => {
    const newCoord = [e[0]+1, e[1]]
    newCoords.push(newCoord)
  })

  //Clear old coords
  fallingPiece.coords.forEach(e => {
    screen[e[0]][e[1]] = 0
  })

  //Update fallingPiece
  fallingPiece.coords = [...newCoords]
  fallingPiece.coords.forEach(e => {
    screen[e[0]][e[1]] = fallingPiece.color
  })
}

console.clear()

printBoard()

spawn()

const timer = setInterval(() => {

  if (isSpaceAvailable(fallingPiece)) {
    gravity()
  } else {
    if (isGameOver()) {
      clearInterval(timer)
    } else {
      spawn()
    }
  }

  printBoard()

}, 100)