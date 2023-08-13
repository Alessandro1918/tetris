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

//color: index of "colors" array.
//tiles: array of [X, Y] coordinates of each tile of the piece on the screen. [0, 0] is "screen top-left", [0, MAX] is "screen top-right", etc.
//orientation: how many degrees the piece is turned since it's spawn (90, 180, 270, or 360=0).
const pieces = [
  {},                                                                    //Empty space (white)
  {color: 1, tiles: [[2, 3], [2, 4], [2, 5], [2, 6]], orientation: 0},  //I tetromino (cyan)
  {color: 2, tiles: [[1, 4], [1, 5], [2, 4], [2, 5]], orientation: 0},  //O tetromino (yellow)
  {color: 3, tiles: [[1, 5], [1, 6], [2, 4], [2, 5]], orientation: 0},  //S tetromino (green)
  {color: 4, tiles: [[1, 4], [1, 5], [2, 5], [2, 6]], orientation: 0},  //Z tetromino (red)
  {color: 5, tiles: [[1, 4], [1, 5], [1, 6], [2, 6]], orientation: 0},  //J tetromino (blue)
  {color: 6, tiles: [[1, 4], [1, 5], [1, 6], [2, 4]], orientation: 0},  //L tetromino (orange)
  {color: 7, tiles: [[1, 4], [1, 5], [1, 6], [2, 5]], orientation: 0},  //T tetromino (purple)
]

//Pieces are not selected at random; instead, they are picked from a complete set, one by one. 
//Once said set is empty, it's refilled with the original pieces available
let remainingPieces = []
function resetRemaingPieces() {
  remainingPieces = [1, 2, 3, 4, 5, 6, 7]
}
resetRemaingPieces()

//The piece currently on the move
let fallingPiece = {
  color: 0, 
  tiles: [],
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
//     const tile = 0
//     row.push(tile)
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

//Finds an 1D array ([0, 0]) in a 2D array ([[0, 0], [1, 1]])
function isArrayIn2DArray(oneDimArray, twoDimArray) {
  let isInArray = false
  twoDimArray.forEach((e) => {
    if (
      e[0] === oneDimArray[0] &&
      e[1] === oneDimArray[1]
    ) {
      isInArray = true
    }
  })
  return isInArray
}

//Check if piece can move 1 row down
function isSpaceAvailable(piece) {

  //Get every tile below each failingPiece tile, not counting tiles from the bottom row of failingPiece
  const tiles = []
  piece.tiles.forEach(e => {
    const tile = [e[0]+1, e[1]]
    if (!isArrayIn2DArray(tile, piece.tiles)) {
      tiles.push(tile)
    }
  })

  //If even a single tile is not empty, piece can't move down
  let isAvailable = true
  tiles.forEach((e) => {
    if (screen[e[0]][e[1]]) {
      isAvailable = false
    }
  })
  return isAvailable
}

// **************************
// ***** Game functions *****
// **************************

//Print the board, tile by tile.
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

  //For each tile of the piece, add it on the screen
  fallingPiece.tiles.forEach(e => {
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

  const c = fallingPiece.tiles
  const newTiles = []
  
  //Clear old tiles
  fallingPiece.tiles.forEach(e => {
    screen[e[0]][e[1]] = 0
  })
  
  //Get new tiles
  switch (fallingPiece.color) {

    case 1:   //I tetromino
      if (fallingPiece.orientation % 180 == 0) {
        newTiles.push([c[0][0]-1, c[0][1]+2], [c[1][0], c[1][1]+1], [c[2][0]+1, c[2][1]], [c[3][0]+2, c[3][1]-1])
      } else {
        newTiles.push([c[0][0]+1, c[0][1]-2], [c[1][0], c[1][1]-1], [c[2][0]-1, c[2][1]], [c[3][0]-2, c[3][1]+1])
      }
      break
    
    case 2:   //O tetromino
      newTiles.push([c[0][0], c[0][1]], [c[1][0], c[1][1]], [c[2][0], c[2][1]], [c[3][0], c[3][1]])
      break
    
    case 3:   //S tetromino
      if (fallingPiece.orientation % 180 == 0) {
        newTiles.push([c[0][0], c[0][1]], [c[1][0], c[1][1]], [c[2][0]-2, c[2][1]+1], [c[3][0], c[3][1]+1])
      } else {
        newTiles.push([c[0][0], c[0][1]], [c[1][0], c[1][1]], [c[2][0]+2, c[2][1]-1], [c[3][0], c[3][1]-1])
      }
      break
    
    case 4:   //Z tetromino
      if (fallingPiece.orientation % 180 == 0) {
        newTiles.push([c[0][0]-1, c[0][1]+2], [c[1][0], c[1][1]], [c[2][0], c[2][1]], [c[3][0]-1, c[3][1]])
      } else {
        newTiles.push([c[0][0]+1, c[0][1]-2], [c[1][0], c[1][1]], [c[2][0], c[2][1]], [c[3][0]+1, c[3][1]])
      }
      break
    
    case 5:   //J tetromino
      switch (fallingPiece.orientation / 90 % 4) {
        case 0:
          newTiles.push([c[0][0]-1, c[0][1]+1], [c[1][0], c[1][1]], [c[2][0]+1, c[2][1]-1], [c[3][0], c[3][1]-2])
          break
        case 1:
          newTiles.push([c[0][0]+1, c[0][1]-1], [c[1][0], c[1][1]], [c[2][0]-1, c[2][1]+1], [c[3][0]-2, c[3][1]])
          break
        case 2:
          newTiles.push([c[0][0]-1, c[0][1]+1], [c[1][0], c[1][1]], [c[2][0]+1, c[2][1]-1], [c[3][0], c[3][1]+2])
          break
        case 3:
          newTiles.push([c[0][0]+1, c[0][1]-1], [c[1][0], c[1][1]], [c[2][0]-1, c[2][1]+1], [c[3][0]+2, c[3][1]])
          break
      }
      break

    case 6:   //L tetromino
      switch (fallingPiece.orientation / 90 % 4) {
        case 0:
          newTiles.push([c[0][0]-1, c[0][1]+1], [c[1][0], c[1][1]], [c[2][0]+1, c[2][1]-1], [c[3][0]-2, c[3][1]])
          break
        case 1:
          newTiles.push([c[0][0]+1, c[0][1]-1], [c[1][0], c[1][1]], [c[2][0]-1, c[2][1]+1], [c[3][0], c[3][1]+2])
          break
        case 2:
          newTiles.push([c[0][0]-1, c[0][1]+1], [c[1][0], c[1][1]], [c[2][0]+1, c[2][1]-1], [c[3][0]+2, c[3][1]])
          break
        case 3:
          newTiles.push([c[0][0]+1, c[0][1]-1], [c[1][0], c[1][1]], [c[2][0]-1, c[2][1]+1], [c[3][0], c[3][1]-2])
          break
      }
      break

    case 7:   //T tetromino
      switch (fallingPiece.orientation / 90 % 4) {
        case 0:
          newTiles.push([c[0][0]-1, c[0][1]+1], [c[1][0], c[1][1]], [c[2][0]+1, c[2][1]-1], [c[3][0]-1, c[3][1]-1])
          break
        case 1:
          newTiles.push([c[0][0]+1, c[0][1]-1], [c[1][0], c[1][1]], [c[2][0]-1, c[2][1]+1], [c[3][0]-1, c[3][1]+1])
          break
        case 2:
          newTiles.push([c[0][0]-1, c[0][1]+1], [c[1][0], c[1][1]], [c[2][0]+1, c[2][1]-1], [c[3][0]+1, c[3][1]+1])
          break
        case 3:
          newTiles.push([c[0][0]+1, c[0][1]-1], [c[1][0], c[1][1]], [c[2][0]-1, c[2][1]+1], [c[3][0]+1, c[3][1]-1])
          break
      }
      break
  }

  //Update fallingPiece and screen with new tiles
  fallingPiece = {
    ...fallingPiece, 
    tiles: newTiles, 
    orientation: fallingPiece.orientation + 90
  }
  newTiles.forEach(e => {
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

  //Save fallingPiece new tiles to aux array
  const newTiles = []
  fallingPiece.tiles.forEach(e => {
    const newCoord = [e[0]+1, e[1]]
    newTiles.push(newCoord)
  })

  //Clear old tiles
  fallingPiece.tiles.forEach(e => {
    screen[e[0]][e[1]] = 0
  })

  //Update fallingPiece
  fallingPiece.tiles = [...newTiles]
  fallingPiece.tiles.forEach(e => {
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