/*** Game initialization and processing ***/
import * as cursor from "./cursor.js";
import * as utils from "./utils.js";
import * as elements from "./elements.js";

///GLOBAL VARIABLES///-----------------------------------------------------------
let canvas = document.querySelector("canvas");                          // Canvas
let ctx = canvas.getContext("2d");                                      // Context
let cWidth = canvas.width;                                              // Canvas width
let cHeight = canvas.height;                                            // Canvas height
let imageData = ctx.createImageData(cWidth, cHeight);                   // Canvas image data
let elementDivs = document.querySelector("#elementButtons").children;   // Divs containing the element buttons
let elementButtons = [];                                                // Container of the element buttons, assembeld from elementDivs
let brushReplaceBox = document.querySelector("#brushReplaceBox");       // Brush replace control
let brushSizeMenu = document.querySelector("#brushSizeMenu");           // Brush size control
let resetButton = document.querySelector("#resetButton");               // Reset button
const GAME_GRID = [];                                                   // Grid that holds the particle in each position of the game area
const GAME_GRID_LENGTH = 300;                                           // Size of the game grid
const MAX_PARTICLES = 20000;                                            // Particle limit (unimplemented)
const BASE_FPS = 30;                                                    // Default FPS
let framerate = 1000 / BASE_FPS;                                        // Default game framerate
let interval;                                                           // Interval container for calling the draw function

///FUNCTIONS///-----------------------------------------------------------

//Initialization
export function init(){

    // Collect and store the element buttons
    for(let i = 0; i < elementDivs.length; i++) {
        let divChildren = elementDivs[i].children;
        for(let j = 0; j < divChildren.length; j++) {
            if(divChildren[j].localName == "button") {
                elementButtons.push(divChildren[j]);
            }
        }
    }

    // Initialize events & the game grid
    initEvents();
    initGrid();

    // Start the game!
    update();    
}

function update() {
    // Set timeout
    setTimeout(update, framerate);
    
    // Update particle states
    updateParticles();

    // Draw it all out
    renderFrame();
}

function initEvents() {
    /* CANVAS EVENTS */
    canvas.onmousemove = cursor.moveCursor;
    canvas.ontouchmove = cursor.moveCursor;

    canvas.onmouseenter = cursor.enterCanvas;
    canvas.onmouseleave = function() {
        cursor.leaveCanvas;
        clearInterval(interval);
    }

    canvas.onmousedown = function(e) {
        if(e.button == 2) {
            return;
        }
        interval = setInterval(cursor.draw, 5);
    }
    canvas.ontouchstart = function() {
        interval = setInterval(cursor.draw, 5);
    }

    canvas.onmouseup = function() {
        clearInterval(interval);
    }
    canvas.ontouchend = function() {
        clearInterval(interval);
    }
    canvas.ontouchcancel = function() {
        clearInterval(interval);
    }

    // Block the context menu while in the canvas element (it's a nuisance there)
    canvas.oncontextmenu = function(e) {
        e.preventDefault();
    }

    /* MENU EVENTS */
    // Set up button events
    for(let i = 0; i < elementButtons.length; i++) {
        elementButtons[i].onclick = function(e) {
            cursor.setBrushElement(e);

            for(let j = 0; j < elementButtons.length; j++) {
                elementButtons[j].style.removeProperty('border');
            }
            e.target.style.setProperty('border', '2px solid green');
        }
    }
    
    // Set up other control events
    brushSizeMenu.onchange = cursor.setBrushSize;
    brushReplaceBox.onchange = cursor.setBrushReplace;
    resetButton.onclick = function() {
        elements.destroyAllParticles();
        initGrid();
    }
}

// Initialize the game grid
function initGrid() {
    for (let x = 0; x < GAME_GRID_LENGTH; x++) {
        GAME_GRID[x] = [];
        for (let y = 0; y < GAME_GRID_LENGTH; y++) {
            elements.createParticle(x, y, "empty");
        }
    }
}

// Draw this frame
function renderFrame() {
    drawBackground();
    
    imageData = ctx.getImageData(0,0,cWidth,cHeight);
    for(let i = 0; i < elements.PARTICLES.length; i++) {
        let currentPart = elements.PARTICLES[i];
        let imageIndex = (currentPart.x + currentPart.y*cWidth)*4;
        imageData.data[imageIndex] = currentPart.red;
        imageData.data[imageIndex+1] = currentPart.green;
        imageData.data[imageIndex+2] = currentPart.blue;
        imageData.data[imageIndex+3] = currentPart.alpha;
    }
    ctx.putImageData(imageData, 0, 0);
}

// Draw the background & its border
function drawBackground() {
    let bgColor = 'rgb(40,40,40)';
    let bgFrameColor = 'gray';

    utils.drawRectangle(ctx, 0, 0, cWidth, cHeight, bgColor);
    utils.drawLine(ctx, 0, 0, cWidth, 0, 1, bgFrameColor);
    utils.drawLine(ctx, cWidth, 0, cWidth, cHeight, 1, bgFrameColor);
    utils.drawLine(ctx, cWidth, cHeight, 0, cHeight, 1, bgFrameColor);
    utils.drawLine(ctx, 0, cHeight, 0, 0, 1, bgFrameColor);
}

// Apply particle physics and hope for the best...
function updateParticles() {
    for(let i = 0; i < elements.PARTICLES.length; i++) {
        let current = elements.PARTICLES[i];
        current.particleAction();
    }
}

// Variables needed by other modules
export { GAME_GRID, GAME_GRID_LENGTH, cWidth, cHeight };