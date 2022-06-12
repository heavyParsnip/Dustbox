/*** Cursor implementation and behavior ***/
import * as elements from "./elements.js";
import { cHeight, cWidth, GAME_GRID } from "./main.js";

///GLOBAL VARIABLES///-----------------------------------------------------------
//Keep a separate reference of the canvas. I know this is redundant, but I'm pretty sure this saves processing time.
let canvas = document.querySelector("canvas");     // Canvas
let ctx = canvas.getContext("2d");                 // Context
const DEFAULT_BRUSH_SIZE = 2;                      // Base brush size
const DEFAULT_BRUSH_ELEMENT = "sand";              // Base brush element

let x = 0;                                         // Cursor X position
let y = 0;                                         // Cursor Y position
let isInCanvas = false;                            // Is the cursor in the canvas? (for debugging)

let brushSize = DEFAULT_BRUSH_SIZE;                // Initialize brush size
let brushElement = DEFAULT_BRUSH_ELEMENT;          // Initialize brush element
let brushReplace = false;                          // Initialize brush replacing

///CURSOR FUNCTIONS///-----------------------------------------------------------

export function moveCursor(e) {
    if(!isInCanvas) return;

    let pos = getCursorPos(e);
    x = pos.x;
    y = pos.y;
}

export function setBrushSize(e) {
    let newBrushSize = e.target.value;
    brushSize = parseInt(newBrushSize);
}

export function setBrushElement(e) {
    brushElement = e.target.value;
}

export function setBrushReplace(e) {
    brushReplace = e.target.checked;
}

// Create a square of the selected element based on the brush size and other brush settings
export function draw() {
    if(x < 2 || x > cWidth-2 || y < 2 || y > cHeight-3) return;

    for(let dx = x-brushSize; dx < x+brushSize; dx++) {
        for(let dy = y-brushSize; dy < y+brushSize; dy++) {
            if(dx < 1 || dx > cWidth-1 || dy < 1 || dy > cHeight-1 || GAME_GRID[dx][dy] == undefined) continue;
            
            if(brushReplace || brushElement == "empty") {
                elements.transmogrify(GAME_GRID[dx][dy], brushElement);
            }
            else if(GAME_GRID[dx][dy] instanceof elements.Empty) {
                elements.createParticle(dx, dy, brushElement);  
            }
        }
    }
}

export function getCursorPos(e) {
    let rect = e.target.getBoundingClientRect();
    let cursorX = e.clientX - rect.x;
	let cursorY = e.clientY - rect.y;
    
    //console.log(cursorX,cursorY);
    return {
        x: Math.round(cursorX),
        y: Math.round(cursorY)
    };
}

export function enterCanvas() {
    isInCanvas = true;
}

export function leaveCanvas() {
    isInCanvas = false;
}

export function setElement(element) {
    brushElement = element;
}

export {brushElement, brushSize, brushReplace};