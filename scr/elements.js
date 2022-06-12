/*** Definitions and behaviors for element particles ***/
import { cHeight, GAME_GRID } from "./main.js";
import { getRandomInt } from "./utils.js";

///GLOBAL VARIABLES///-----------------------------------------------------------
//Keep a separate reference of the canvas. I know this is redundant, but I'm pretty sure this saves processing time.
let canvas = document.querySelector("canvas");  // Canvas
let ctx = canvas.getContext("2d");              // Context
const PARTICLES = [];                           // Active particles

///CLASSES///-----------------------------------------------------------
class Element {
    constructor(x, y) {
        this.x = x;                 // X position
        this.y = y;                 // Y position
        this.gravity = false;       // Affected by gravity?
        this.flammable = false;     // Can catch fire? (defunct)
        this.liquid = false;        // Is it a liquid?
        this.gaseous = false;       // Is it a gas?
        this.density = 0;           // Liquid and gaseous elements with lower densities float on top of those with higher densities
        this.red = 50;              // Red channel
        this.green = 50;            // Green channel
        this.blue = 50;             // Blue channel
        this.alpha = 255;           // Alpha channel
    }

    particleAction() {
        //Container for child classes. Should never be empty when actually called.
    }

    react() {
        //Container for child classes. Should only be empty if the element initiates no reactions.
    }
}

// Makes up the background/any unoccupied position
export class Empty extends Element {
    constructor(x,y) {
        super(x,y);
    }
}

// Sand! The default element.
// It turns to mud when soaked.
// And it fuses nearby sand into glass when struck by lightning!
class Sand extends Element {
    constructor(x,y) {
        super(x,y);
        this.gravity = true;
        this.density = 5;
        this.red = 255;
        this.green = 228;
        this.blue = 196;
    }
    
    particleAction() {
        fallSolid(this);
        this.react();
    }

    react() {
        let adjacent = getAllAdjacent(this);
        // React with water, mix into mud
        for(let i = 0; i < adjacent.length; i++) {
            
            if(adjacent[i] instanceof Water) {
                transmogrify(this, "mud");
                transmogrify(adjacent[i], "empty");
                return;
            }
        }
    }
}

// Water--vital for the chemical reactions that sustain all forms of life.
// Receives many interactions but initates none in the game. Steams when heated.
class Water extends Element {
    constructor(x,y) {
        super(x,y);
        this.gravity = true;
        this.liquid = true;
        this.density = 4;
        this.red = 55;
        this.green = 75;
        this.blue = 243;
    }

    particleAction() {
        fallLiquid(this);
    }

    react() {

    }
}

// Saltwater. It's water, but salty. It'll make you more thirsty later if you drink it.
// Can't be spawned through the menu. Created when salt mixes with water. It's denser than water.
class Saltwater extends Water {
    constructor(x,y) {
        super(x,y);
        this.density = 5;
        this.red = 90;
        this.green = 110;
    }

    particleAction() {
        fallLiquid(this);
    }
}

// Mud. I liked to play in it when I was younger. Mostly inert.
// Will turn adjacent sand particles to mud if adjacent to water.
class Mud extends Element {
    constructor(x,y) {
        super(x,y);
        this.gravity = true;
        this.density = 5;
        this.red = 90;
        this.green = 78;
        this.blue = 76;
    }

    particleAction() {
        fallSolid(this);
        this.react();
    }

    react() {
        let adjacent = getAllAdjacent(this);
        let water = null;
        let sand = null;
        // React with sand, turn sand to mud if adjacent to water
        for(let i = 0; i < adjacent.length; i++) {
            
            if(water == null && adjacent[i] instanceof Water) {
                water = adjacent[i]
            }
            else if(sand == null && adjacent[i] instanceof Sand) {
                sand = adjacent[i];
            }
        }
        if(water != null && sand != null) {
            transmogrify(water, "empty");
            transmogrify(sand, "mud");
        }
    }
}

// Oil. Highly flammable, and highly prized all over the world for that property.
// If an element can start a fire, it'll burn oil every time.
class Oil extends Element {
    constructor(x,y) {
        super(x,y);
        this.gravity = true;
        this.density = 1;
        this.liquid = true;
        this.flammable = true;
        this.red = 106;
        this.green = 48;
        this.blue = 48;
    }
    particleAction() {
        fallLiquid(this);
    }
}

// Stone. It's heavy. Mostly inert, but falls faster than the other solids.
class Stone extends Element {
    constructor(x,y) {
        super(x,y);
        this.gravity = true;
        this.density = 7;
        this.red = 150;
        this.green = 150;
        this.blue = 150;
    }

    particleAction() {
        fallSolid(this);
        fallSolid(this);
    }
}

// Wood. Doesn't do much on its own. Reasonably flammable.
class Wood extends Element {
    constructor(x,y) {
        super(x,y);
        this.gravity = false;
        this.density = 5;
        this.red = 99;
        this.green = 60;
        this.blue = 3;
    }

    particleAction() {

    }
}

// Ice, sometimes known as solid water. Melts when heated or salted.
class Ice extends Element {
    constructor(x,y) {
        super(x,y);
        this.gravity = false;
        this.density = 5;
        this.red = 186;
        this.green = 247;
        this.blue = 255;
    }

    particleAction() {

    }
}

// Salt. Great with many culinary dishes. Don't use too much & your blood pressure will thank you.
// Makes water salty and ice melty. Also makes fire yellow.
class Salt extends Element {
    constructor(x,y) {
        super(x,y);
        this.gravity = true;
        this.density = 5;
        this.red = 250;
        this.green = 250;
        this.blue = 250;
    }

    particleAction() {
        fallSolid(this);
        this.react();
    }

    react() {
        let strictAdj = getStrictAdjacent(this);
        for(let i = 0; i < strictAdj.length; i++) {
            if(strictAdj[i] instanceof Water && !(strictAdj[i] instanceof Saltwater)) {
                transmogrify(strictAdj[i], "empty");
                transmogrify(this, "saltwater");
            }
            else if(strictAdj[i] instanceof Ice) {
                let chance = getRandomInt(0, 100);
                if(chance < 22) {
                    transmogrify(strictAdj[i], "water");
                }
            }
        }
    }
}

// Fire! One of the most entertaining elements. Destructive.
// Burns things that can be burned. Steams when doused.
// Comes in a range of colors.
class Fire extends Element {
    constructor(x,y) {
        super(x,y);
        this.gravity = false;
        this.gaseous = true;
        this.density = 0;
        this.red = 238 + getRandomInt(-20, 15);
        this.green = 64 + getRandomInt(-30, 20);
        this.blue = 15 + getRandomInt(-5, 30);
        this.lifetime = 0;
        this.maxLifetime = 30 + getRandomInt(-5, 15);
        this.chanceToRise = 60;
    }

    particleAction() {
        if(getRandomInt(0, 100) < this.chanceToRise) {
            riseGas(this);
        }
        this.lifetime++;
        this.react();
    }

    react() {
        // Disappears after the particle exceeds its maximum lifetime.
        if(this.lifetime >= this.maxLifetime) {
            transmogrify(this, "empty");
        }

        let adjacent = getAllAdjacent(this);
        // We're using a switch statement for this one because fire reacts with a lot of stuff
        for(let i = 0; i < adjacent.length; i++) {
            switch(adjacent[i].constructor.name) {
                case "Wood":
                    this.burnWood(adjacent[i]);
                    break;
                case "Water":
                    this.burnWater(adjacent[i]);
                    break;
                case "Salt":
                    this.burnSalt(adjacent[i]);
                    break;
                case "Ice":
                    this.burnIce(adjacent[i]);
                    break;
                case "Oil":
                    this.burnOil(adjacent[i]);
                    break;
                default:
                    break;
            }
        }
    }

    burnWood(wood) {
        let chance = getRandomInt(0, 100);
        if(chance < 8) {
            transmogrify(wood, "fire");
        }
    }

    burnWater (water) {
        let chance = getRandomInt(0, 100);
        if(chance < 10) {
            transmogrify(water, "steam");
            this.lifetime += 20;
        }
    }

    burnSalt(salt) {
        let adj = getAllAdjacent(this);
        let chance = getRandomInt(0, 100);
        if(chance < 5) {
            transmogrify(salt, "empty");
        }
        this.green = 160;
        for(let i = 0; i < adj.length; i++) {
            if(adj[i] instanceof Fire) {
                adj[i].green = 220;
            }
        }
    }

    burnIce(ice) {
        let chance = getRandomInt(0, 100);
        if(chance < 40) {
            transmogrify(ice, "water");
        }
        else {
            transmogrify(ice, "empty");
        }
    }

    burnOil(oil) {
        let chance = getRandomInt(0, 100);
        if(chance < 20) {
            transmogrify(oil, "fire");
        }
    }
}

// Lava. Melts through and burns almost everything.
class Lava extends Element {
    constructor(x,y) {
        super(x,y);
        this.gravity = true;
        this.liquid = true;
        this.density = 3;
        this.red = 243;
        this.green = 137;
        this.blue = 0;
    }

    particleAction() {
        fallLiquid(this);
        this.react();
    }

    react() {
        let adjacent = getAllAdjacent(this);
        // We're using a switch statement for this one because lava also reacts with a lot of stuff
        for(let i = 0; i < adjacent.length; i++) {
            switch(adjacent[i].constructor.name) {
                case "Wood":
                    this.meltWood(adjacent[i]);
                    break;
                case "Water":
                    this.meltWater(adjacent[i]);
                    break;
                case "Oil":
                    this.meltOil(adjacent[i]);
                    break;
                case "Stone":
                    this.meltStone(adjacent[i]);
                    break;
                case "Ice":
                    this.meltIce(adjacent[i]);
                    break;
                case "Glass":
                    this.meltGlass(adjacent[i]);
                    break;
                case "Wall":
                case "Lava":
                case "Empty":
                    break;
                default:
                    transmogrify(adjacent[i], "empty");
                    break;
            }
        }
    }

    meltWood(wood) {
        let chance = getRandomInt(0, 100);
        if(chance < 50) {
            transmogrify(wood, "fire");
        }
    }

    meltWater (water) {
        let chance = getRandomInt(0, 100);
        if(chance < 15) {
            transmogrify(water, "steam");
        }
        else {
            transmogrify(water, "empty");
        }
    }

    meltOil(oil) {
        transmogrify(oil, "fire");
    }

    meltStone(stone) {
        let chance = getRandomInt(0, 100);
        if(chance < 1) {
            transmogrify(stone, "empty");
        }
    }

    meltIce(ice) {
        transmogrify(ice, "water");
    }

    meltGlass(glass) {
        let chance = getRandomInt(0, 100);
        if(chance < 8) {
            transmogrify(glass, "lava");
        }
    }
}

// Lightning. The wackiest element in this bunch. Zaps anything it touches, but some elements won't mind.
// Fuses sand into glass. May start a fire on wood, or immediately turn it into ash (I'm subsituting mud for ash).
// Can turn water into steam. Violently flings water and steam. Cuts through fire. Burns oil.
class Lightning extends Element {
    constructor(x,y) {
        super(x,y);
        this.gravity = true;
        this.density = 3;
        this.red = 247;
        this.green = 242;
        this.blue = 0;
        this.nextX = 0;
        this.nextY = 0;
    }

    particleAction() {
        fallLightning(this);
        this.react();
    }

    react() {
        if(this.y > cHeight-3) {
            transmogrify(this, "empty");
            return;
        }

        let adjacentBelow = getBelowAdjacent(this);
        // We're using a switch statement for this one because lightning, too, also reacts (or specifically doesn't react) with a lot of stuff.
        for(let i = 0; i < adjacentBelow.length; i++) {
            switch(adjacentBelow[i].constructor.name) {
                case "Wood":
                    this.zapWood(adjacentBelow[i]);
                    return;
                case "Water":
                    this.zapWater(adjacentBelow[i]);
                    return;
                case "Oil":
                    this.zapOil(adjacentBelow[i]);
                    return;
                case "Stone":
                    this.zapStone(adjacentBelow[i]);
                    return;
                case "Fire":
                    this.zapFire(adjacentBelow[i]);
                    return;
                case "Sand":
                    this.zapSand(adjacentBelow[i]);
                    return;
                case "Steam":
                case "Empty":
                case "Lightning":
                    return;
                default:
                    transmogrify(this, "empty");
                    return;
            }
        }
    }

    zapWood(wood) {
        let chance = getRandomInt(0, 100);
        if(chance < 40) {
            transmogrify(wood, "fire");
        }
        else if(chance < 65) {
            transmogrify(wood, "mud");
        }
        transmogrify(this, "empty");
    }

    zapWater(water) {
        let chance = getRandomInt(0, 100);
        if(chance < 50) {
            let randomX = getRandomInt(-10, 10);
            let randomY = getRandomInt(3, 20);
            let waterAdj = getStrictAdjacent(water);
            for(let i = 0; i < waterAdj.length; i++) {
                let randomSwap;
                try {
                    randomSwap = GAME_GRID[waterAdj[i].x+randomX][waterAdj[i].y-randomY];
                }
                catch {
                    randomSwap = null;
                }

                if(randomSwap != undefined && randomSwap != null && randomSwap instanceof Empty) {
                    swap(waterAdj[i], randomSwap);
                }
            }
        }
        transmogrify(this, "empty");
    }

    zapOil(oil) {
        transmogrify(oil, "fire");
        transmogrify(this, "empty");
    }

    zapStone(stone) {
        let chance = getRandomInt(0, 100);
        if(chance < 50) {
            let randomX = getRandomInt(-10, 10);
            let randomY = getRandomInt(3, 20);
            let stoneAdj = getStrictAdjacent(stone);
            for(let i = 0; i < stoneAdj.length; i++) {
                let randomSwap;
                try {
                    randomSwap = GAME_GRID[stoneAdj[i].x+randomX][stoneAdj[i].y-randomY];
                }
                catch {
                    randomSwap = null;
                }

                if(randomSwap != undefined && randomSwap != null && randomSwap instanceof Empty) {
                    swap(stoneAdj[i], randomSwap);
                }
            }
        }
        transmogrify(this, "empty");
    }

    zapFire(fire) {
        transmogrify(fire, "empty");
    }

    zapSand(sand) {
        let chance = getRandomInt(0, 100);
        if(chance < 26) {
            let sandAdj = getStrictAdjacent(sand);
            for(let i = 0; i < sandAdj.length; i++) {
                if(sandAdj[i] != undefined && sandAdj[i] instanceof Sand) {
                    transmogrify(sandAdj[i], "glass");
                    this.zapSand(sandAdj[i]);
                }
            }
        }
        //transmogrify(this, "empty"); // Works better when this statement isn't included, but I haven't figured out why.
    }
}

// Steam! Comes from water that's too hot to stay water.
// Just for fun, it imitates the water cycle. 
// Turns to water when high up, then rains back down. If there's a lot of it, you might even see lightning!
// Comes in a range of colors.
class Steam extends Element {
    constructor(x,y) {
        super(x,y);
        this.gravity = false;
        this.gaseous = true;
        this.density = 1;
        let colorOffset = getRandomInt(-20,20);
        this.red = 212 + colorOffset;
        this.green = 212 + colorOffset;
        this.blue = 212 + colorOffset;
        this.chanceToRain = 1;
    }

    particleAction() {
        riseGas(this);
        this.react();
    }

    react() {
        // Count adjacent steam particles
        let adjacent = getAllAdjacent(this);
        let adjSteam = 0;
        for(let i = 0; i < adjacent.length; i++) {
            if(adjacent[i] instanceof Steam) {
                adjSteam++;
            }
        }

        // Make lightning!
        if(adjSteam >= 8 && getRandomInt(0, 1000) < this.chanceToRain) {
            transmogrify(this, "lightning");
        }

        // Maybe rain?
        if(this.y < 7 && getRandomInt(0, 100) < this.chanceToRain) {
            transmogrify(this, "water");
        }
    }
}

// Glass. Makes nice windows, sculptures, and more. 
// It's tensile strength isn't exceptional on average, so it's usually brittle, 
// but the upper bound of its strength can exceed most metals by orders of magnitude.
// Occurs when sand is struck by lightning. Mostly inert.
class Glass extends Element {
    constructor(x,y) {
        super(x,y);
        this.gravity = false;
        this.gaseous = false;
        this.density = 0;
        this.red = 223;
        this.green = 223;
        this.blue = 223;
        this.alpha = 148;
    }
}

// Wall. Not a real substance.
// Completely inert and unaffected by gravity.
class Wall extends Element {
    constructor(x,y) {
        super(x,y);
        this.gravity = false;
        this.gaseous = false;
        this.density = 0;
        this.red = 83;
        this.green = 83;
        this.blue = 83;
    }
}


///ELEMENT FUNCTIONS///-----------------------------------------------------------
/* ELEMENT MANIPULATION */
export function createParticle(x, y, elem) {
    let particle;

    switch(elem) {
        case "sand":
            particle = new Sand(x,y);
            break;
        case "water":
            particle = new Water(x,y);
            break;
        case "saltwater":
            particle = new Saltwater(x,y);
            break;
        case "oil":
            particle = new Oil(x,y);
            break;
        case "mud":
            particle = new Mud(x,y);
            break;
        case "stone":
            particle = new Stone(x,y);
            break;
        case "stone":
            particle = new Stone(x,y);
            break;
        case "wood":
            particle = new Wood(x,y);
            break;
        case "ice":
            particle = new Ice(x,y);
            break;
        case "salt":
            particle = new Salt(x,y);
            break;
        case "fire":
            particle = new Fire(x,y);
            break;
        case "lava":
            particle = new Lava(x,y);
            break;
        case "lightning":
            particle = new Lightning(x,y);
            break;
        case "steam":
            particle = new Steam(x,y);
            break;
        case "glass":
            particle = new Glass(x,y);
            break;
        case "wall":
            particle = new Wall(x,y);
            break;
        case "empty":
        default:
            particle = new Empty(x,y);
            break;
    }

    if(!(particle instanceof Empty)) {
        PARTICLES.push(particle);
    }
    
    GAME_GRID[x][y] = particle;
}

export function transmogrify(target, newElem) {
    let x = target.x;
    let y = target.y;
    if(!(target instanceof Empty))
    {
        let replaced = PARTICLES.indexOf(target);
        PARTICLES.splice(replaced, 1);
    }
    createParticle(x, y, newElem);
}

export function destroyAllParticles() {
    while(PARTICLES.length != 0) {
        PARTICLES.pop();
    }
}

/* ELEMENT POSITION FUNCTIONS */
// Return all adjacent particles, including diagonals
function getAllAdjacent(target) {
    let adjacent = [];
    
    for(let dx = target.x-1; dx <= target.x+1; dx++) {
        for(let dy = target.y-1; dy <= target.y+1; dy++) {
            let particle;
            try {
                particle = GAME_GRID[dx][dy];
            }
            catch {
                continue;
            }

            if(particle != undefined && particle != null && particle != target) {
                adjacent.push(particle);
            }
        }
    }

    return adjacent;
}

// Return all adjacent particles, excluding diagonals.
function getStrictAdjacent(target)
{
    let adjacent = [ getLeft(target), getRight(target), getAbove(target), getBelow(target) ];
    return adjacent;
}

// Particle to the left
function getLeft(target) {
    let left;
    try {
        left = GAME_GRID[target.x-1][target.y];
    }
    catch {
        return null;
    }
    
    if (left != undefined) {
        return left;
    }
}

// Particle to the right
function getRight(target) {
    let right;
    try {
        right = GAME_GRID[target.x+1][target.y];
    }
    catch {
        return null;
    }
    
    if (right != undefined) {
        return right;
    }
}

// Particle below
function getBelow(target) {
    let below;
    try {
        below = GAME_GRID[target.x][target.y+1];
    }
    catch {
        return null;
    }
    
    if (below != undefined) {
        return below;
    }
}

// Particle above
function getAbove(target) {
    let above;
    try {
        above = GAME_GRID[target.x][target.y-1];
    }
    catch {
        return null;
    }
    
    if (above != undefined) {
        return above;
    }
}

// All below particles (including diagonals)
function getBelowAdjacent(target) {
    let belowAdj = [];
    
    for(let dx = target.x-1; dx <= target.x+1; dx++) {
        let particle;
        try {
            particle = GAME_GRID[dx][target.y+1];
        }
        catch {
            continue;
        }

        if(particle != undefined && particle != null) {
            belowAdj.push(particle);
        }
    }

    return belowAdj;
}

// Diagonally below particles
function getBelowDiagonal(target) {
    let belowDiagonal = [];
    
    for(let dx = target.x-1; dx <= target.x+1; dx++) {
        let particle;
        try {
            particle = GAME_GRID[dx][target.y+1];
        }
        catch {
            continue;
        }

        if(particle != undefined && particle != null && !(particle.x == target.x && particle.y == target.y+1)) {
            belowDiagonal.push(particle);
        }
    }

    return belowDiagonal;
}

// All above particles (including diagonals)
function getAboveAdjacent(target) {
    let aboveAdj = [];

    for(let dx = target.x-1; dx <= target.x+1; dx++) {
        let particle; 
        try {
            particle = GAME_GRID[dx][target.y-1];
        }
        catch {
            continue;
        }
        
        if(particle != undefined && particle != null) {
            aboveAdj.push(particle);
        }
    }

    return aboveAdj;
}

// Diagonally above particles
function getAboveDiagonal(target) {
    let aboveDiagonal = [];
    
    for(let dx = target.x-1; dx <= target.x+1; dx++) {
        let particle;
        try {
            particle = GAME_GRID[dx][target.y-1];
        }
        catch {
            continue;
        }

        if(particle != undefined && particle != null && !(particle.x == target.x && particle.y == target.y-1)) {
            aboveDiagonal.push(particle);
        }
    }

    return aboveDiagonal;
}

/* ELEMENT ACTION FUNCTIONS */

// Solid falling
function fallSolid(target) {
    if(target.y >= cHeight-2) return;

    let below = getBelow(target);
    if(below == null) return;
    
    if(below instanceof Empty) {
        swap(target, below);
    }
    else if(below.liquid) {
        let allBelow = getBelowAdjacent(target);
        if (allBelow.length == 0) return;
        let randomDownDir = getRandomInt(0, allBelow.length-1);

        swap(target, allBelow[randomDownDir]);
    }
}

// Liquid falling
function fallLiquid(target) {
    if(target.y >= cHeight-2) return;

    let allBelow = getBelowAdjacent(target);
    if(allBelow.length == 0) return;
    let randomDownDir = getRandomInt(0,allBelow.length-1);
    
    let leftRight = [ getLeft(target), getRight(target) ];
    let randomHorizDir = getRandomInt(0,leftRight.length-1);

    if(allBelow[randomDownDir] instanceof Empty) {
        swap(target, allBelow[randomDownDir]);
    }
    else if(leftRight[randomHorizDir] instanceof Empty) {
        swap(target, leftRight[randomHorizDir])
    }
    else if(allBelow[randomDownDir].liquid) {
        let densityDiffernce = target.density-allBelow[randomDownDir].density;
        if(densityDiffernce > 0) {
            swap(target, allBelow[randomDownDir]);
        }
    }
    else if(leftRight[randomHorizDir] != null && leftRight[randomHorizDir].liquid) {
        swap(target, leftRight[randomHorizDir]);
    }
}

// Lightning falling
function fallLightning(target) {
    if(target.y >= cHeight-2) return;

    let belowDiag = getBelowDiagonal(target);
    if(belowDiag.length == 0) return;
    let randomDiagDir = getRandomInt(0,belowDiag.length-1);
    let below = getBelow(target);

    if(belowDiag[randomDiagDir] instanceof Empty) {
        swap(target, belowDiag[randomDiagDir]);
    }
    else if(below instanceof Empty) {
        swap(target, below);
    }
}

// Gas rising
function riseGas(target) {
    if(target.y <= 2) return;

    let aboveDiag = getAboveDiagonal(target);
    if(aboveDiag.length == 0) return;
    let randomDiagDir = getRandomInt(0,aboveDiag.length-1);

    let leftRight = [ getLeft(target), getRight(target) ];
    let randomHorizDir = getRandomInt(0, leftRight.length-1);

    if(aboveDiag[randomDiagDir] instanceof Empty) {
        swap(target, aboveDiag[randomDiagDir]);
    }
    else if(aboveDiag[randomDiagDir].gaseous) {
        let densityDiffernce = target.density-aboveDiag[randomDiagDir].density;
        if(densityDiffernce > 0) swap(target, aboveDiag[randomDiagDir]);
    }
    else if(leftRight[randomHorizDir] instanceof Empty) {
        swap(target, leftRight[randomHorizDir]);
    }
}

// Swap two particles
function swap(part1, part2) {
    let p1Pos = { x: part1.x, y: part1.y };
    let p2Pos = { x: part2.x, y: part2.y };

    GAME_GRID[p1Pos.x][p1Pos.y] = part2;
    GAME_GRID[p2Pos.x][p2Pos.y] = part1;
    part1.x = p2Pos.x;
    part1.y = p2Pos.y;
    part2.x = p1Pos.x;
    part2.y = p1Pos.y;
}

export { PARTICLES };