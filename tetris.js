require("readline").emitKeypressEvents(process.stdin)   //makes process.stdin emit keypress events
process.stdin.setRawMode(true)                          //emit event on a per char base, instead of per enter key press

// *********************
// ***** Constanst *****
// *********************

const SCREEN_WIDTH = 10     //number of collumns
const SCREEN_LENGTH = 20    //number of rows
const SPAWN_ZONE_LENGTH = 3 //how many rows of the already defined screen will be used to spawn pieces

const white = "\x1b[0m"
const red = "\x1b[31m"
const green = "\x1b[32m"
const yellow = "\x1b[33m"
const blue = "\x1b[34m"
const purple = "\x1b[35m"
const cyan = "\x1b[36m"
const orange = white        //ANSI sequences don't support "orange"
const colors = [white, cyan, yellow, green, red, blue, orange, purple]

//color: index of "colors" array
//coords: XY pair. [0, 0] is "top-left", [0, MAX] is "top-right", etc.
const pieces = [
  {},                                                                    //Empty space (white)
  {color: 1, coords: [[2, 3], [2, 4], [2, 5], [2, 6]], orientation: 0},  //I tetromino (cyan)
  {color: 2, coords: [[1, 4], [1, 5], [2, 4], [2, 5]], orientation: 0},  //O tetromino (yellow)
  {color: 3, coords: [[1, 5], [1, 6], [2, 4], [2, 5]], orientation: 0},  //S tetromino (green)
  {color: 4, coords: [[1, 4], [1, 5], [2, 5], [2, 6]], orientation: 0},  //Z tetromino (red)
  {color: 5, coords: [[1, 4], [1, 5], [1, 6], [2, 6]], orientation: 0},  //J tetromino (blue)
  {color: 6, coords: [[1, 4], [1, 5], [1, 6], [2, 4]], orientation: 0},  //L tetromino (orange)
  {color: 7, coords: [[1, 4], [1, 5], [1, 6], [2, 5]], orientation: 0},  //T tetromino (purple)
]

//Pieces are not selected at random; instead, they are picked from a complete set, one by one. 
//Once said set is empty, it's refilled with the original pieces available
let remainingPieces = []
function resetRemaingPieces() {
  remainingPieces = [1, 2, 3, 4, 5, 6, 7]
}
resetRemaingPieces()

let fallingPiece = {
  color: 0, 
  coords: [],
  orientation: 0
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
  min = 1
  max = pieces.length +1
  // return 0
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

//Read key press
process.stdin.on("keypress", (char, event) => {
  if (char === "w") rotateClockwise()
  if (char === "c") process.exit()
})

function rotateClockwise() {
  //0 degrees:
  //I:			//O:		   //S:		 	//Z:		 //J:		  //L:		   //T:
  // -- -- -- --  //-- -- -- --  // -- -- --  // -- -- --  // -- -- --  // -- -- --  // -- -- --
  // -- -- -- --  //-- ██ ██ --  // -- ██ ██  // ██ ██ --  // ██ ██ ██  // ██ ██ ██  // ██ ██ ██
  // ██ ██ ██ ██  //-- ██ ██ --  // ██ ██ --  // -- ██ ██  // -- -- ██  // ██ -- --  // -- ██ --
  // [] [] [] []  //[] [] [] []  // [] [] []  // [] [] []  // [] [] []  // [] [] []  // [] [] []
  // [] [] [] []  //[] [] [] []  // [] [] []  // [] [] []  // [] [] []  // [] [] []  // [] [] []

  //+90 CW:
  // -- -- -- --	//-- -- -- --  // -- ██ --  // -- -- ██  // -- ██ --  // ██ ██ --  // -- ██ --
  // -- -- ██ --	//-- ██ ██ --  // -- ██ ██  // -- ██ ██  // -- ██ --  // -- ██ --  // ██ ██ --
  // -- -- ██ --	//-- ██ ██ --  // -- -- ██  // -- ██ --  // ██ ██ --  // -- ██ --  // -- ██ --
  // [] [] ██ []	//[] [] [] []  // [] [] []  // [] [] []  // [] [] []  // [] [] []  // [] [] []
  // [] [] ██ []	//[] [] [] []  // [] [] []  // [] [] []  // [] [] []  // [] [] []  // [] [] []

  //For the full example: https://tetris.wiki/Nintendo_Rotation_System

  const c = fallingPiece.coords
  const newCoords = []
  
  //Clear old coords
  fallingPiece.coords.forEach(e => {
    screen[e[0]][e[1]] = 0
  })
  
  //Get new coords
  switch (fallingPiece.color) {

    case 1:   //I tetromino
      if (fallingPiece.orientation % 180 == 0) {
        newCoords.push([c[0][0]-1, c[0][1]+2], [c[1][0], c[1][1]+1], [c[2][0]+1, c[2][1]], [c[3][0]+2, c[3][1]-1])
      } else {
        newCoords.push([c[0][0]+1, c[0][1]-2], [c[1][0], c[1][1]-1], [c[2][0]-1, c[2][1]], [c[3][0]-2, c[3][1]+1])
      }
      break
    
    case 2:   //O tetromino
      newCoords.push([c[0][0], c[0][1]], [c[1][0], c[1][1]], [c[2][0], c[2][1]], [c[3][0], c[3][1]])
      break
    
    case 3:   //S tetromino
      if (fallingPiece.orientation % 180 == 0) {
        newCoords.push([c[0][0], c[0][1]], [c[1][0], c[1][1]], [c[2][0]-2, c[2][1]+1], [c[3][0], c[3][1]+1])
      } else {
        newCoords.push([c[0][0], c[0][1]], [c[1][0], c[1][1]], [c[2][0]+2, c[2][1]-1], [c[3][0], c[3][1]-1])
      }
      break
    
    case 4:   //Z tetromino
      if (fallingPiece.orientation % 180 == 0) {
        newCoords.push([c[0][0]-1, c[0][1]+2], [c[1][0], c[1][1]], [c[2][0], c[2][1]], [c[3][0]-1, c[3][1]])
      } else {
        newCoords.push([c[0][0]+1, c[0][1]-2], [c[1][0], c[1][1]], [c[2][0], c[2][1]], [c[3][0]+1, c[3][1]])
      }
      break
    
    case 5:   //J tetromino
      switch (fallingPiece.orientation / 90 % 4) {
        case 0:
          newCoords.push([c[0][0]-1, c[0][1]+1], [c[1][0], c[1][1]], [c[2][0]+1, c[2][1]-1], [c[3][0], c[3][1]-2])
          break
        case 1:
          newCoords.push([c[0][0]+1, c[0][1]-1], [c[1][0], c[1][1]], [c[2][0]-1, c[2][1]+1], [c[3][0]-2, c[3][1]])
          break
        case 2:
          newCoords.push([c[0][0]-1, c[0][1]+1], [c[1][0], c[1][1]], [c[2][0]+1, c[2][1]-1], [c[3][0], c[3][1]+2])
          break
        case 3:
          newCoords.push([c[0][0]+1, c[0][1]-1], [c[1][0], c[1][1]], [c[2][0]-1, c[2][1]+1], [c[3][0]+2, c[3][1]])
          break
      }
      break

    case 6:   //L tetromino
      switch (fallingPiece.orientation / 90 % 4) {
        case 0:
          newCoords.push([c[0][0]-1, c[0][1]+1], [c[1][0], c[1][1]], [c[2][0]+1, c[2][1]-1], [c[3][0]-2, c[3][1]])
          break
        case 1:
          newCoords.push([c[0][0]+1, c[0][1]-1], [c[1][0], c[1][1]], [c[2][0]-1, c[2][1]+1], [c[3][0], c[3][1]+2])
          break
        case 2:
          newCoords.push([c[0][0]-1, c[0][1]+1], [c[1][0], c[1][1]], [c[2][0]+1, c[2][1]-1], [c[3][0]+2, c[3][1]])
          break
        case 3:
          newCoords.push([c[0][0]+1, c[0][1]-1], [c[1][0], c[1][1]], [c[2][0]-1, c[2][1]+1], [c[3][0], c[3][1]-2])
          break
      }
      break

    case 7:   //T tetromino
      switch (fallingPiece.orientation / 90 % 4) {
        case 0:
          newCoords.push([c[0][0]-1, c[0][1]+1], [c[1][0], c[1][1]], [c[2][0]+1, c[2][1]-1], [c[3][0]-1, c[3][1]-1])
          break
        case 1:
          newCoords.push([c[0][0]+1, c[0][1]-1], [c[1][0], c[1][1]], [c[2][0]-1, c[2][1]+1], [c[3][0]-1, c[3][1]+1])
          break
        case 2:
          newCoords.push([c[0][0]-1, c[0][1]+1], [c[1][0], c[1][1]], [c[2][0]+1, c[2][1]-1], [c[3][0]+1, c[3][1]+1])
          break
        case 3:
          newCoords.push([c[0][0]+1, c[0][1]-1], [c[1][0], c[1][1]], [c[2][0]-1, c[2][1]+1], [c[3][0]+1, c[3][1]-1])
          break
      }
      break
  }

  //Update fallingPiece and screen with new coords
  fallingPiece = {
    ...fallingPiece, 
    coords: newCoords, 
    orientation: fallingPiece.orientation + 90
  }
  newCoords.forEach(e => {
    screen[e[0]][e[1]] = fallingPiece.color
  })

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
      process.exit()
    } else {
      spawn()
    }
  }

  printBoard()

}, 100)