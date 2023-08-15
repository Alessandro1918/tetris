require("readline").emitKeypressEvents(process.stdin)   //makes process.stdin emit keypress events
process.stdin.setRawMode(true)                          //emit event on a per char base, instead of per enter key press

// *********************
// ***** Constanst *****
// *********************

const SCREEN_WIDTH = 10     //number of columns
const SCREEN_LENGTH = 20    //number of rows

const white =  "\x1b[0m"
const red =    "\x1b[31m"
const green =  "\x1b[32m"
const yellow = "\x1b[33m"
const blue =   "\x1b[34m"
const purple = "\x1b[35m"
const cyan =   "\x1b[36m"
const orange = white        //ANSI sequences don't support "orange"

//id: unique identifier; can be used to define the color in the "colors" array.
//tiles: array of [X, Y] coordinates of each tile of the piece on the screen. [0, 0] is "screen top-left", [0, MAX] is "screen top-right", etc.
//orientation: how many degrees the piece is turned since it's spawn (90, 180, 270, or 360=0).
//Tetrominoes spawn with their highest block on row 20, axis of rotation on column 6: https://tetris.wiki/Original_Rotation_System
const pieces = [
  {},                                                                //Empty space (white)
  {id: 1, tiles: [[0, 3], [0, 4], [0, 5], [0, 6]], orientation: 0},  //I tetromino (cyan)
  {id: 2, tiles: [[0, 4], [0, 5], [1, 4], [1, 5]], orientation: 0},  //O tetromino (yellow)
  {id: 3, tiles: [[0, 5], [0, 6], [1, 4], [1, 5]], orientation: 0},  //S tetromino (green)
  {id: 4, tiles: [[0, 4], [0, 5], [1, 5], [1, 6]], orientation: 0},  //Z tetromino (red)
  {id: 5, tiles: [[0, 4], [0, 5], [0, 6], [1, 6]], orientation: 0},  //J tetromino (blue)
  {id: 6, tiles: [[0, 4], [0, 5], [0, 6], [1, 4]], orientation: 0},  //L tetromino (orange)
  {id: 7, tiles: [[0, 4], [0, 5], [0, 6], [1, 5]], orientation: 0},  //T tetromino (purple)
]

//Render the game based on the CLI argument (ex: > node tetris.js color)
const modes = {
  "classic": {
    tile: "[]",
    space: " .",
    leftBorder: "<!",
    rigthBorder: "!>",
    bottomBorder: "▽▽",
    primaryColor: green,
    colors: [green, green, green, green, green, green, green, green]
  },
  "color": {
    tile: "██",
    space: "  ",
    leftBorder: "░░",
    rigthBorder: "░░",
    bottomBorder: "░░",
    primaryColor: white,
    colors: [white, cyan, yellow, green, red, blue, orange, purple]
  }
}

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
// const screen = [
//   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
// ]
const screen = []
for (var i = 0; i < SCREEN_LENGTH; i++) {
  const row = []
  for (var j = 0; j < SCREEN_WIDTH; j++) {
    const tile = 0
    row.push(tile)
  }
  screen.push(row)
}

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

// **************************
// ***** Game functions *****
// **************************

//Print a single tile.
//If param "color" not mentioned, use mode's default color
function printTile(tile, color) {
  if (color === undefined) {
    color = modes[selectedMode].primaryColor
  }
  process.stdout.write(
    color +   //start piece color (ex: orange)
    tile +    //print tile (ex: "██")
    white     //reset terminal color back to white
  )
}

//Print the board, tile by tile.
function printBoard() {
  process.stdout.moveCursor(0, -(SCREEN_LENGTH + 1))          //moves cursor up "n" lines
  process.stdout.clearLine(1)                                 //clear from cursor to end
  
  for (var i = 0; i < SCREEN_LENGTH; i++) {                   //i: row counter
    for (var j = 0; j < SCREEN_WIDTH; j++) {                  //j: column counter 
      if (j == 0) {
        printTile(modes[selectedMode].leftBorder)             //left border
      }
      if (screen[i][j]) {
        printTile(                                            //piece tile
          modes[selectedMode].tile,
          modes[selectedMode].colors[[screen[i][j]]]
        )
      } else {
        printTile(modes[selectedMode].space)                  //empty cell
      }
      if (j == SCREEN_WIDTH - 1) {
        printTile(modes[selectedMode].rigthBorder)            //right border
      }
    }
    process.stdout.write("\n")                                //end of line
  }
  for (var j = 0; j < SCREEN_WIDTH + 2; j++) {
    printTile(modes[selectedMode].bottomBorder)               //bottom border
  }
  process.stdout.write("\n")
}

//Check if piece has screen space to spawn.
function canSpawn(piece) {
  let hasSpace = true
  piece.tiles.forEach(e => {
    if (screen[e[0]][e[1]]) {
      hasSpace = false
    }
  })
  return hasSpace
}

//Print a new piece on the board
//Game overs can only be checked here, after new piece is selected (some could still fit in the remaining space, and even moved away)
function spawn() {

  //Sort a new piece from the pool of remaining pieces
  let pieceId = 9   // a piece that doesn't exist
  while (remainingPieces.indexOf(pieceId) < 0) {
    pieceId = getRandomInt()
  }
  // fallingPiece = pieces[pieceId]        //shallow copy
  fallingPiece = {...pieces[pieceId]}      //deep copy

  //Remove piece from the pool of remaining pieces
  const filtered = remainingPieces.filter(e => e != pieceId)
  remainingPieces = [...filtered]
  if (remainingPieces.length == 0) {
    resetRemaingPieces()
  }

  const canPieceSpawn = canSpawn(fallingPiece)

  //For each tile of the piece, add it on the screen
  //Improvement opportunity: print just the fallingPiece bottom tiles, instead of overwrite the old piece currently in the spawn zone
  fallingPiece.tiles.forEach(e => {
    screen[e[0]][e[1]] = fallingPiece.id
  })

  printBoard()

  //Piece was drawn with or without space available. But if it couldn't spawn, it's game over
  if (!canPieceSpawn) {
    clearInterval(timer)
    process.exit()
  }
}

function canRotate(direction) {
  //clockwise:
  if (direction === "cw") {
    return true
  }
  //counterClockwise:
  else {
    return true
  }
}

function rotateClockwise() {
  //0 degrees:
  //I:            //O:           //S:         //Z:         //J:         //L:         //T:
  // -- -- -- --  //-- -- -- --  // -- -- --  // -- -- --  // -- -- --  // -- -- --  // -- -- --
  // -- -- -- --  //-- ██ ██ --  // -- ██ ██  // ██ ██ --  // ██ ██ ██  // ██ ██ ██  // ██ ██ ██
  // ██ ██ ██ ██  //-- ██ ██ --  // ██ ██ --  // -- ██ ██  // -- -- ██  // ██ -- --  // -- ██ --
  // -- -- -- --  //-- -- -- --  // -- -- --  // -- -- --  // -- -- --  // -- -- --  // -- -- --
  // -- -- -- --  //-- -- -- --  // -- -- --  // -- -- --  // -- -- --  // -- -- --  // -- -- --

  //+90 CW:
  // -- -- -- --	//-- -- -- --  // -- ██ --  // -- -- ██  // -- ██ --  // ██ ██ --  // -- ██ --
  // -- -- ██ --	//-- ██ ██ --  // -- ██ ██  // -- ██ ██  // -- ██ --  // -- ██ --  // ██ ██ --
  // -- -- ██ --	//-- ██ ██ --  // -- -- ██  // -- ██ --  // ██ ██ --  // -- ██ --  // -- ██ --
  // -- -- ██ --	//-- -- -- --  // -- -- --  // -- -- --  // -- -- --  // -- -- --  // -- -- --
  // -- -- ██ --	//-- -- -- --  // -- -- --  // -- -- --  // -- -- --  // -- -- --  // -- -- --

  //(Pictures of pieces at free-falling, not immediately after spawning. Because of the lack of space, they can't rotate rigth after spawning)
  //For the full example: https://tetris.wiki/Nintendo_Rotation_System

  const t = fallingPiece.tiles   //old tiles
  const newTiles = []
  
  //Clear old tiles
  fallingPiece.tiles.forEach(e => {
    screen[e[0]][e[1]] = 0
  })
  
  //Get new tiles
  switch (fallingPiece.id) {

    case 1:   //I tetromino
      if (fallingPiece.orientation % 180 == 0) {
        newTiles.push([t[0][0]-1, t[0][1]+2], [t[1][0], t[1][1]+1], [t[2][0]+1, t[2][1]], [t[3][0]+2, t[3][1]-1])
      } else {
        newTiles.push([t[0][0]+1, t[0][1]-2], [t[1][0], t[1][1]-1], [t[2][0]-1, t[2][1]], [t[3][0]-2, t[3][1]+1])
      }
      break
    
    case 2:   //O tetromino
      newTiles.push([t[0][0], t[0][1]], [t[1][0], t[1][1]], [t[2][0], t[2][1]], [t[3][0], t[3][1]])
      break
    
    case 3:   //S tetromino
      if (fallingPiece.orientation % 180 == 0) {
        newTiles.push([t[0][0], t[0][1]], [t[1][0], t[1][1]], [t[2][0]-2, t[2][1]+1], [t[3][0], t[3][1]+1])
      } else {
        newTiles.push([t[0][0], t[0][1]], [t[1][0], t[1][1]], [t[2][0]+2, t[2][1]-1], [t[3][0], t[3][1]-1])
      }
      break
    
    case 4:   //Z tetromino
      if (fallingPiece.orientation % 180 == 0) {
        newTiles.push([t[0][0]-1, t[0][1]+2], [t[1][0], t[1][1]], [t[2][0], t[2][1]], [t[3][0]-1, t[3][1]])
      } else {
        newTiles.push([t[0][0]+1, t[0][1]-2], [t[1][0], t[1][1]], [t[2][0], t[2][1]], [t[3][0]+1, t[3][1]])
      }
      break
    
    case 5:   //J tetromino
      switch (fallingPiece.orientation / 90 % 4) {
        case 0:
          newTiles.push([t[0][0]-1, t[0][1]+1], [t[1][0], t[1][1]], [t[2][0]+1, t[2][1]-1], [t[3][0], t[3][1]-2])
          break
        case 1:
          newTiles.push([t[0][0]+1, t[0][1]-1], [t[1][0], t[1][1]], [t[2][0]-1, t[2][1]+1], [t[3][0]-2, t[3][1]])
          break
        case 2:
          newTiles.push([t[0][0]-1, t[0][1]+1], [t[1][0], t[1][1]], [t[2][0]+1, t[2][1]-1], [t[3][0], t[3][1]+2])
          break
        case 3:
          newTiles.push([t[0][0]+1, t[0][1]-1], [t[1][0], t[1][1]], [t[2][0]-1, t[2][1]+1], [t[3][0]+2, t[3][1]])
          break
      }
      break

    case 6:   //L tetromino
      switch (fallingPiece.orientation / 90 % 4) {
        case 0:
          newTiles.push([t[0][0]-1, t[0][1]+1], [t[1][0], t[1][1]], [t[2][0]+1, t[2][1]-1], [t[3][0]-2, t[3][1]])
          break
        case 1:
          newTiles.push([t[0][0]+1, t[0][1]-1], [t[1][0], t[1][1]], [t[2][0]-1, t[2][1]+1], [t[3][0], t[3][1]+2])
          break
        case 2:
          newTiles.push([t[0][0]-1, t[0][1]+1], [t[1][0], t[1][1]], [t[2][0]+1, t[2][1]-1], [t[3][0]+2, t[3][1]])
          break
        case 3:
          newTiles.push([t[0][0]+1, t[0][1]-1], [t[1][0], t[1][1]], [t[2][0]-1, t[2][1]+1], [t[3][0], t[3][1]-2])
          break
      }
      break

    case 7:   //T tetromino
      switch (fallingPiece.orientation / 90 % 4) {
        case 0:
          newTiles.push([t[0][0]-1, t[0][1]+1], [t[1][0], t[1][1]], [t[2][0]+1, t[2][1]-1], [t[3][0]-1, t[3][1]-1])
          break
        case 1:
          newTiles.push([t[0][0]+1, t[0][1]-1], [t[1][0], t[1][1]], [t[2][0]-1, t[2][1]+1], [t[3][0]-1, t[3][1]+1])
          break
        case 2:
          newTiles.push([t[0][0]-1, t[0][1]+1], [t[1][0], t[1][1]], [t[2][0]+1, t[2][1]-1], [t[3][0]+1, t[3][1]+1])
          break
        case 3:
          newTiles.push([t[0][0]+1, t[0][1]-1], [t[1][0], t[1][1]], [t[2][0]-1, t[2][1]+1], [t[3][0]+1, t[3][1]-1])
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
  fallingPiece.tiles.forEach(e => {
    screen[e[0]][e[1]] = fallingPiece.id
  })

  printBoard()
}

function rotateCounterClockwise() {
  rotateClockwise()   // Work smarter,
  rotateClockwise()   // not harder!
  rotateClockwise()   // ¯\_(ツ)_/¯
}

//Check if failingPiece can be moved 1 unit at given direction
function canMove(direction) {

  //Get every tile on the left of / on the rigth of / below each failingPiece tile,
  //not counting tiles from the belonging to failingPiece
  const newTiles = []
  fallingPiece.tiles.forEach(e => {
    let tile = []
    switch (direction) {
      case "left":  tile = [e[0], e[1]-1]; break;
      case "right": tile = [e[0], e[1]+1]; break;
      case "down":  tile = [e[0]+1, e[1]]; break;
    }
    if (!isArrayIn2DArray(tile, fallingPiece.tiles)) {
      newTiles.push(tile)
    }
  })

  let hasSpace = true

  //If any new tile is off limits, piece can't move;
  //If any new tile is on the screen, but not empty, piece can't move down;
  newTiles.forEach(e => {
    if (
      [e[1]] < 0 || 
      [e[1]] > SCREEN_WIDTH - 1 || 
      [e[0]] > SCREEN_LENGTH - 1 ||
      screen[e[0]][e[1]]
    ) {
      hasSpace = false
    }
  })

  return hasSpace
}

//Move the failingPiece 1 unit at given direction
function move(direction) {

  //Save fallingPiece new tiles to aux array
  const newTiles = []
  switch (direction) {
    
    case "left":
      fallingPiece.tiles.forEach(e => {
        newTiles.push([e[0], e[1]-1])
      })
      break
    
    case "right":
      fallingPiece.tiles.forEach(e => {
        newTiles.push([e[0]+1, e[1]+1])
      })
      break
    
    case "down":
      fallingPiece.tiles.forEach(e => {
        newTiles.push([e[0]+1, e[1]])
      })
      break
  }

  //Clear old tiles
  fallingPiece.tiles.forEach(e => {
    screen[e[0]][e[1]] = 0
  })

  //Update fallingPiece and screen with new tiles
  fallingPiece.tiles = [...newTiles]
  fallingPiece.tiles.forEach(e => {
    screen[e[0]][e[1]] = fallingPiece.id
  })

  printBoard()
}

//Read key press
process.stdin.on("keypress", (char, key) => {
  switch (key.name) {
    case "a":     if (canRotate("ccw"))   rotateCounterClockwise(); break;
    case "d":     if (canRotate("cw"))    rotateClockwise();        break;
    case "up":    if (canRotate("cw"))    rotateClockwise();        break;
    case "left":  if (canMove("left"))    move("left");             break;
    case "right": if (canMove("right"))   move("right");            break;
    case "down":  if (canMove("down"))    move("down");             break;
    case "c":     if (key.ctrl)           process.exit();           break;  //CTRL + C: stop script
  }
})

// ***** Start! *****

process.argv.length == 2
  ? selectedMode = "classic"        //no arg provided, use default
  : selectedMode = process.argv[2]  //use param provided by CLI

console.clear()

printBoard()

spawn()

const timer = setInterval(() => {

  if (canMove("down")) {
    move("down")
  } else {     
    spawn()
  }

}, 1000)
