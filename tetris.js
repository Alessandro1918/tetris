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
const orange = "\033[38;5;214m"
const blackOnYellow = "\033[38;5;0;48;5;142m" //https://i.stack.imgur.com/KTSQa.png

//id: unique identifier; can be used to define the color in the "colors" array.
//tiles: array of [X, Y] coordinates of each tile of the piece on the screen. [0, 0] is "screen top-left", [0, MAX] is "screen top-right", etc.
//orientation: how many degrees the piece is turned since it's spawn (90, 180, 270, or 360=0).
//Tetrominoes spawn with their highest block on row 20, axis of rotation on column 6: https://tetris.wiki/Original_Rotation_System
const pieces = [
  {},                                                                //Empty space (white)
  {id: 1, name: "I", tiles: [[0, 3], [0, 4], [0, 5], [0, 6]], orientation: 0},  //I tetromino (cyan)
  {id: 2, name: "O", tiles: [[0, 4], [0, 5], [1, 4], [1, 5]], orientation: 0},  //O tetromino (yellow)
  {id: 3, name: "S", tiles: [[0, 5], [0, 6], [1, 4], [1, 5]], orientation: 0},  //S tetromino (green)
  {id: 4, name: "Z", tiles: [[0, 4], [0, 5], [1, 5], [1, 6]], orientation: 0},  //Z tetromino (red)
  {id: 5, name: "J", tiles: [[0, 4], [0, 5], [0, 6], [1, 6]], orientation: 0},  //J tetromino (blue)
  {id: 6, name: "L", tiles: [[0, 4], [0, 5], [0, 6], [1, 4]], orientation: 0},  //L tetromino (orange)
  {id: 7, name: "T", tiles: [[0, 4], [0, 5], [0, 6], [1, 5]], orientation: 0},  //T tetromino (purple)
]

//Render the game based on the CLI argument (ex: > node tetris.js color)
const modes = {
  "classic": {
    color: green,
    leftBorder: "<!",
    rigthBorder: "!>",
    bottomBorder: "▽▽",
    tiles: [" .", "[]", "[]", "[]", "[]", "[]", "[]", "[]"]
  },
  "gameboy": {
    color: blackOnYellow,
    leftBorder: "ᢂᢂ",
    rigthBorder: "ᢂᢂ",
    bottomBorder: "ᢂᢂ",
    tiles: ["  ", "🀑🀑", "🀓🀓", "🁫🁫", "🁳🁳", "🂣🂣", "🂢🂢", "🂡🂡"]
  },
  "color": {
    color: white,
    leftBorder: "░░",
    rigthBorder: "░░",
    bottomBorder: "░░",
    tiles: [white + "  ", cyan + "██", yellow + "██", green + "██", red + "██", blue + "██", orange + "██", purple + "██"]
  }
}

//Pieces are not selected at random; instead, they are picked from a complete set, one by one. 
//Once said set is empty, it's refilled with the original pieces available
let remainingPieces = []
function resetRemaingPieces() {
  remainingPieces = [1, 2, 3, 4, 5, 6, 7]
  shuffleArray(remainingPieces)
}
resetRemaingPieces()

//The piece currently on the move
let fallingPiece = {
  color: 0, 
  tiles: [],
  orientation: 0
}

let score = 0

let speed = 1000  //ms

let isPaused = false

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

//Randomize array in-place using Durstenfeld shuffle algorithm
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1))
    let temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

// **************************
// ***** Game functions *****
// **************************

//Print a single tile.
function printTile(tile) {
  process.stdout.write(
    modes[selectedMode].color +         //set mode default color (will be overwriten if tile is colored)
    tile +                              //print tile (ex: "██")
    white                               //reset terminal color back to white
  )
}

//Print the board, tile by tile.
function printBoard() {
  process.stdout.moveCursor(0, -(SCREEN_LENGTH + 3))          //moves cursor up "n" lines (+1 from the bottom border, +1 for the "Next piece:" line, +1 for the score)
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

  process.stdout.write(
    modes[selectedMode].color + "Next: " + 
    pieces[remainingPieces[0]].name + 
    "".padEnd(2 * SCREEN_WIDTH + 4 - "Next: T".length, "  ") +    //+4: borders length
    white + "\n"
  )

  process.stdout.write(
    modes[selectedMode].color + "Score: " + 
    score + 
    "".padEnd(2 * SCREEN_WIDTH + 4 - `Score: ${score}`.length, "  ") + 
    white + "\n"
  )
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
  pieceId = remainingPieces[0]
  // fallingPiece = pieces[pieceId]           //shallow copy
  fallingPiece = {...pieces[pieceId]}         //deep copy

  //Remove piece from the pool of remaining pieces
  remainingPieces = remainingPieces.slice(1)  //from [1] to [length-1]
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
  let auxPiece = {...piece}
  auxPiece = {...auxPiece, tiles: tilesAfterRotateCW(auxPiece), orientation: auxPiece.orientation + 90}   // Work smarter,
  auxPiece = {...auxPiece, tiles: tilesAfterRotateCW(auxPiece), orientation: auxPiece.orientation + 90}   //not harder!
  auxPiece = {...auxPiece, tiles: tilesAfterRotateCW(auxPiece), orientation: auxPiece.orientation + 90}   //¯\_(ツ)_/¯
  return auxPiece.tiles
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
    orientation: direction === "cw" 
      ? fallingPiece.orientation + 90
      : fallingPiece.orientation + 270
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

//Return an array of indexes of completed rows (ex:[], or [19], or [14, 15]), ordered by "top row first".
function completedRows() {

  const lines =[]

  for (var i = 0; i < SCREEN_LENGTH; i++) {     //i: row counter
    let isCompleted = true
    for (var j = 0; j < SCREEN_WIDTH; j++) {    //j: column counter
      if (!screen[i][j]) {
        isCompleted = false
      }
    }
    if (isCompleted) {
      lines.push(i)
    }
  }

  return lines
}

//Clear all completed rows.
//Drops every tile above the cleared lines one row down.
function clearRows(rows) {

  //Clear rows
  for (var i = 0; i < SCREEN_LENGTH; i++) {     //i: row counter
    for (var j = 0; j < SCREEN_WIDTH; j++) {    //j: column counter
      if (rows.includes(i)) {
        screen[i][j] = 0
        printBoard()
      }
    }
  }

  //Copy every row above clearedRows to a temp var "n" row below
  let tempScreen = [...screen]
  for (var i = SCREEN_LENGTH - 1; i > - 1; i--) {   //bottom to top
    for (var j = 0; j < SCREEN_WIDTH; j++) {
      if (
        i < Math.min(...rows)                       //row is above a cleared row
      ) {
        tempScreen[i + rows.length][j] = screen[i][j]
      }
    }
  }

  //Update screen
  for (var i = 0; i < SCREEN_LENGTH; i++) {
    for (var j = 0; j < SCREEN_WIDTH; j++) {
      screen[i][j] = tempScreen[i][j]
    }
  }

  //Update score
  score = score + rows.length

  //Update speed
  clearInterval(timer)
  speed = speed - 40
  timer = setInterval(() => {
    loop()
  }, speed)  //ms
  
  printBoard()
}

//Pauses / resumes the game
function pauseResume() {
  isPaused = !isPaused
  if (isPaused) {
    process.stdout.write(
      modes[selectedMode].color + 
      "PAUSED - Hit [P]        " + "\n" + 
      "again to resume         " + 
      white + "\n"
    )
  } else {
    //Clear this last 2 lines
    process.stdout.moveCursor(0, -1)    //moves cursor up "n" lines
    process.stdout.clearLine(1)         //clear from cursor to end
    process.stdout.moveCursor(0, -1)
    process.stdout.clearLine(1)
  }
}

//Read key press
process.stdin.on("keypress", (char, key) => {
  switch (key.name) {
    //Right-handed player:
    case "left":  if (canMove("left"))    move("left");     break;
    case "right": if (canMove("right"))   move("right");    break;
    case "down":  if (canMove("down"))    move("down");     break;
    case "up":    if (canRotate("cw"))    rotate("cw");     break;

    //Left-handed player:
    case "a":     if (canMove("left"))    move("left");     break;
    case "d":     if (canMove("right"))   move("right");    break;
    case "s":     if (canMove("down"))    move("down");     break;
    case "w":     if (canRotate("ccw"))   rotate("ccw");    break;
 
    //Other controls:
    case "p":     pauseResume();          break;
    case "c":     if (key.ctrl)           process.exit();   break;  //CTRL + C: stop script
  }
})

// ***** Start! *****

if (process.argv.length == 2) {
  selectedMode = "classic"        //no arg provided, use default
} else {
  selectedMode = process.argv[2]  //use param provided by CLI
}

console.clear()

printBoard()

spawn()

function loop() {
  if (isPaused) {
    return
  }
  if (canMove("down")) {
    move("down")
  } else {    
    const rows = completedRows() 
    if (rows.length > 0) {
      clearRows(rows)
    }
    spawn()
  }
}

let timer = setInterval(() => {
  loop()
}, speed)  //ms
