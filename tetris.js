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
    leftBorder: "<!",
    rigthBorder: "!>",
    bottomBorder: "▽▽",
    primaryColor: green,
    tiles: [" .", "[]", "[]", "[]", "[]", "[]", "[]", "[]"]
  },
  "color": {
    leftBorder: "░░",
    rigthBorder: "░░",
    bottomBorder: "░░",
    primaryColor: white,
    tiles: [white + "  ", cyan + "██", yellow + "██", green + "██", red + "██", blue + "██", orange + "██", purple + "██"]
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
function printTile(tile) {
  process.stdout.write(
    modes[selectedMode].primaryColor +  //set mode default color (will be overwriten if tile is colored)
    tile +                              //print tile (ex: "██")
    white                               //reset terminal color back to white
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
      printTile(modes[selectedMode].tiles[screen[i][j]])      //array has chars from both empty cells and piece tiles
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

  const hasSpace = canSpawn(fallingPiece)

  //For each tile of the piece, add it on the screen
  //Improvement opportunity: print just the fallingPiece bottom tiles, instead of overwrite the old piece currently in the spawn zone
  fallingPiece.tiles.forEach(e => {
    screen[e[0]][e[1]] = fallingPiece.id
  })

  printBoard()

  //Piece was drawn with or without space available. But if it couldn't spawn, it's game over
  if (!hasSpace) {
    clearInterval(timer)
    process.exit()
  }
}

//Return which tiles will be occupied after a 90 degree rotation in the clockwise direction
function tilesAfterRotateCW(piece) {
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

  const t = piece.tiles   //old tiles
  const newTiles = []

  //Get new tiles
  switch (piece.id) {

    case 1:   //I tetromino
      if (piece.orientation % 180 == 0) {
        newTiles.push([t[0][0]-1, t[0][1]+2], [t[1][0], t[1][1]+1], [t[2][0]+1, t[2][1]], [t[3][0]+2, t[3][1]-1])
      } else {
        newTiles.push([t[0][0]+1, t[0][1]-2], [t[1][0], t[1][1]-1], [t[2][0]-1, t[2][1]], [t[3][0]-2, t[3][1]+1])
      }
      break
    
    case 2:   //O tetromino
      newTiles.push([t[0][0], t[0][1]], [t[1][0], t[1][1]], [t[2][0], t[2][1]], [t[3][0], t[3][1]])
      break
    
    case 3:   //S tetromino
      if (piece.orientation % 180 == 0) {
        newTiles.push([t[0][0], t[0][1]], [t[1][0], t[1][1]], [t[2][0]-2, t[2][1]+1], [t[3][0], t[3][1]+1])
      } else {
        newTiles.push([t[0][0], t[0][1]], [t[1][0], t[1][1]], [t[2][0]+2, t[2][1]-1], [t[3][0], t[3][1]-1])
      }
      break
    
    case 4:   //Z tetromino
      if (piece.orientation % 180 == 0) {
        newTiles.push([t[0][0]-1, t[0][1]+2], [t[1][0], t[1][1]], [t[2][0], t[2][1]], [t[3][0]-1, t[3][1]])
      } else {
        newTiles.push([t[0][0]+1, t[0][1]-2], [t[1][0], t[1][1]], [t[2][0], t[2][1]], [t[3][0]+1, t[3][1]])
      }
      break
    
    case 5:   //J tetromino
      switch (piece.orientation / 90 % 4) {
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
      switch (piece.orientation / 90 % 4) {
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
      switch (piece.orientation / 90 % 4) {
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

  return newTiles
}

//Return which tiles will be occupied after a 90 degree rotation in the counterClockwise direction
function tilesAfterRotateCCW(piece) {
  
  return (
    tilesAfterRotateCW(             // Work smarter,
      tilesAfterRotateCW(           //not harder!
        tilesAfterRotateCW(piece)   //¯\_(ツ)_/¯
      )
    )
  )
}

function canRotate(direction) {
  
  let newTiles = []

  //clockwise:
  if (direction === "cw") {
    newTiles = tilesAfterRotateCW(fallingPiece)
  }
  //counterClockwise:
  else {
    newTiles = tilesAfterRotateCCW(fallingPiece)
  }

  let hasSpace = true

  newTiles.forEach(e => {
    //If any new tile is off limits, piece can't rotate;
    //If any new tile is on the screen, but not empty, piece can't rotate;
    //If tile is already part of fallingPiece, it should not be counted;
    if (
      e[0] < 0 ||
      e[1] < 0 || 
      e[0] > SCREEN_LENGTH - 1 ||
      e[1] > SCREEN_WIDTH - 1 ||
      screen[e[0]][e[1]] &&
      !isArrayIn2DArray(e, fallingPiece.tiles)
    ) {
      hasSpace = false
    }
  })

  return hasSpace
}

function rotate(direction) {

  let newTiles = []

  //clockwise:
  if (direction === "cw") {
    newTiles = tilesAfterRotateCW(fallingPiece)
  }
  //counterClockwise:
  else {
    newTiles = tilesAfterRotateCCW(fallingPiece)
  }

  //Clear screen from old tiles
  fallingPiece.tiles.forEach(e => {
    screen[e[0]][e[1]] = 0
  })

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

//Return which tiles will be occupied after a move in the given direction
function tilesAfterMove(piece, direction) {

  const newTiles = []

  piece.tiles.forEach(e => {
    let tile = []
    switch (direction) {
      case "left":  tile = [e[0], e[1]-1]; break;
      case "right": tile = [e[0], e[1]+1]; break;
      case "down":  tile = [e[0]+1, e[1]]; break;
    }
    newTiles.push(tile)
  })

  return newTiles
}

//Check if failingPiece can be moved 1 unit at given direction
function canMove(direction) {

  newTiles = tilesAfterMove(fallingPiece, direction)

  let hasSpace = true

  //If any new tile is off limits, piece can't move;
  //If any new tile is on the screen, but not empty, piece can't move;
  //If tile is already part of fallingPiece, it should not be counted;
  newTiles.forEach(e => {
    if (
      // e[0] < 0 ||
      e[1] < 0 || 
      e[0] > SCREEN_LENGTH - 1 ||
      e[1] > SCREEN_WIDTH - 1 ||
      screen[e[0]][e[1]] &&
      !isArrayIn2DArray(e, fallingPiece.tiles)
    ) {
      hasSpace = false
    }
  })

  return hasSpace
}

//Move the failingPiece 1 unit at given direction
function move(direction) {

  newTiles = tilesAfterMove(fallingPiece, direction)

  //Clear screen from old tiles
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
    case "a":     if (canRotate("ccw"))   rotate("ccw");    break;
    case "d":     if (canRotate("cw"))    rotate("cw");     break;
    case "up":    if (canRotate("cw"))    rotate("cw");     break;
    case "left":  if (canMove("left"))    move("left");     break;
    case "right": if (canMove("right"))   move("right");    break;
    case "down":  if (canMove("down"))    move("down");     break;
    case "c":     if (key.ctrl)           process.exit();   break;  //CTRL + C: stop script
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
